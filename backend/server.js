const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(cors()); // umożliwia serwerowi obsługę żądań z innych domen

// Serwowanie statycznych plików z folderu frontend
app.use(express.static(path.join(__dirname, '../frontend'))); // ensure static files are served from the frontend directory

app.use('/api/auth', authRoutes); // Obsługa tras rejestracji i logowania

// === nickname endpoint ===
app.get('/api/auth/nickname', (req, res) => {
    const username = req.headers['username'];
    if (username) {
        return res.status(200).json({ nickname: username });
    }
    return res.status(401).json({ message: 'Not logged in' });
});

const Leaderboard = require('./models/Leaderboard'); // import leaderboard model

// === leaderboard endpoint ===
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await Leaderboard.find().sort({ time: 1 }).limit(10); // top 10 by fastest time
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === search leaderboard by pattern ===
app.get('/api/leaderboard/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const regex = new RegExp(query, 'i'); // 'i' -> case-insensitive
        const results = await Leaderboard.find({ playerName: { $regex: regex } }).sort({ time: 1 });

        res.json(results);
    } catch (error) {
        console.error('Error searching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Przekierowanie wszystkich innych tras na index.html (dla SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

mongoose
   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(() => console.log('Connected to MongoDB'))
   .catch((err) => console.error('MongoDB connection error:', err));


// Obsługa socket.io dla multiplayera
const rooms = {}; // Przechowywanie stanu pokoi w pamięci

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // ==== room stuff ====

    // Create a room
    socket.on('createRoom', ({ roomId, maxPlayers, playerName }) => {

        if (playerName.startsWith("Guest_")) {
            console.log("Guests cannot create rooms.");
            socket.emit('error', { message: "Guests are not allowed to create rooms." });
            return;
        }

        if (rooms[roomId]) {
            socket.emit('error', 'Room already exists');
            return;
        }

        rooms[roomId] = {
            players: [{ id: socket.id, name: playerName, completed: false, time: null }],
            maxPlayers,
            gameInitialized: false
        };

        console.log(`${playerName} created room ${roomId}`);

        socket.join(roomId);
        io.to(roomId).emit('roomUpdate', { ...rooms[roomId], roomId });
    });

    // Gracz dołącza do pokoju
    socket.on('joinRoom', ({ roomId, playerName }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { players: [], gameState: 'waiting', winner: null };
        }

        if (rooms[roomId].players.length >= rooms[roomId].maxPlayers) {
            socket.emit('error', 'Room is full');
            return;
        }

        if (rooms[roomId].players.find((p) => p.name.toLowerCase() === playerName.toLowerCase())) {
            console.error(`Player ${playerName} already in room ${roomId}`);
            return;
        }
        
        rooms[roomId].players.push({
            id: socket.id,
            name: playerName,
            completed: false,
            time: null,
        });
        
        socket.join(roomId);
        console.log(`User ${playerName} joined room ${roomId}`);
        io.to(roomId).emit('roomUpdate', { roomId, ...rooms[roomId] });
    });

    socket.on('startGame', (roomId) => {
        console.log(`Game started in room ${roomId}`);
        
        const room = rooms[roomId];
        if (!room) {
            socket.emit('error', 'Room does not exist');
            return;
        }

        if (room.players[0].id !== socket.id) {
            socket.emit('error', 'Only the room creator can start the game');
            return;
        }

        room.started = true;
        room.gameState = 'inProgress'; //active

        console.log(`Game started in room ${roomId}`);
        console.log(`Room players:`, room.players);
        socket.to(roomId).emit('gameStarted', { roomId });
    });

    socket.on('puzzleSolved', async ({ roomId, playerName, time }) => {
        console.log(`Puzzle solved by ${playerName} in room ${roomId}`);
        
        if (!rooms[roomId]) {
            console.error(`Room ${roomId} does not exist`);
            return;
        }

        try {
            // add player's score to the leaderboard
            await Leaderboard.create({ playerName, time });
        } catch (error) {
            console.error('Error updating leaderboard:', error);
        }
    
        const room = rooms[roomId];
        console.log(room)
        console.log(playerName)
        const player = room.players.find((p) => p.name === playerName);
        console.log(`Winner in PuzzleSolved:`, player);
    
        player.completed = true;
        player.time = time;
    
        console.log(`Player ${playerName} in room ${roomId} completed in ${time} seconds.`);
    
        // declare player as the winner
        room.gameState = 'completed';
        room.winner = player;

        // broadcast the game ended event to all players in the room
        io.to(roomId).emit('gameEnded', {
            winner: playerName,
            time: time,
        });
        
        console.log(`Game ended in room ${roomId}. Winner: ${player.name}`);
    });
    
    // Obsługa rozłączenia
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        // remove a player from any room
        for (const [roomId, room] of Object.entries(rooms)) {
            room.players = room.players.filter(player => player.id !== socket.id);
            if (room.players.length === 0) {
                delete rooms[roomId]; // delete empty room
                console.log(`Room deleted: ${roomId}`);
            } else {
                io.to(roomId).emit('roomUpdate', room);
            }
        }
    });

    // ==== chat function ====

    socket.on('chatMessage', (messageData) => {
        console.log('server -> Message received:', messageData);
        const { roomId, playerName, message } = messageData;

        if (!roomId || !playerName || !message) {
            console.error('Incomplete message data:', messageData);
            return;
        }

        io.emit('chatMessage', {
            playerName,
            message,
            timestamp: Date.now(),
        });

        console.log(`server -> Send message to room ${roomId}:`, { playerName, message });
    });
});

// Start serwera
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});