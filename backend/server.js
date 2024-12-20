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
app.use(express.static(path.join(__dirname, '../frontend'))); // Ensure static files are served from the frontend directory

app.use('/api/auth', authRoutes); // Obsługa tras rejestracji i logowania

// === nickname endpoint ===
app.get('/api/auth/nickname', (req, res) => {
    const username = req.headers['username'];
    if (username) {
        return res.status(200).json({ nickname: username });
    }
    return res.status(401).json({ message: 'Not logged in' });
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
            gameState: 'waiting',
            started: false,
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
        // const nickname = playerName || `Guest_${Math.floor(Math.random() * 1000)}`;
        
        // rooms[roomId].players.push({ id: socket.id, name: playerName });
        rooms[roomId].players.push({
            id: socket.id,
            name: playerName,
            completed: false,
            time: null,
        });
        
        socket.join(roomId);
        console.log(`User ${playerName} joined room ${roomId}`);
        // io.to(roomId).emit('roomUpdate', { ...rooms[roomId], roomId });
        io.to(roomId).emit('roomUpdate', { playerName, roomId });
        // io.to(roomId).emit('roomUpdate', rooms[roomId]);
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
        // io.to(roomId).emit('gameStarted', { roomId });
        socket.to(roomId).emit('gameStarted', { roomId });
    });

    socket.on('PuzzleSolved', ({ roomId, playerName, time }) => {
        console.log(`Zdarzenie PuzzleSolved otrzymane: roomId=${roomId}, playerName=${playerName}`);
        if (!rooms[roomId]) {
            console.error(`Room ${roomId} does not exist`);
            return;
        }
    
        const room = rooms[roomId];
        console.log(room)
        console.log(playerName)
        const player = room.players.find((p) => p.name === playerName);
        console.log(`Player data in PuzzleSolved:`, player);
    
        if (!player || player.completed) {
            console.error(`No player or player already completed`)
            return;
        }
    
        // Mark player as completed
        player.completed = true;
        player.time = time;
    
        console.log(`Player ${playerName} in room ${roomId} completed in ${time} seconds.`);
    
        // Declare this player as the winner
        room.gameState = 'completed';
        room.winner = player;

        // Broadcast the game ended event to all players in the room
        io.to(roomId).emit('gameEnded', {
            winner: player.name,
            time: player.time,
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

});


// Start serwera
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});