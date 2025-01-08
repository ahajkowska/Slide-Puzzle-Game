// socket.io i mqtt
const Leaderboard = require('./models/Leaderboard'); // import leaderboard model

const rooms = {};

const setupSocket = (io, mqttClient) => {
    
    // handle WebSocket connections
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

            // publikowanie info o nowym pokoju do MQTT
            const roomTopic = 'waiting-room/new-room';
            const roomMessage = JSON.stringify({ roomId, maxPlayers });
            mqttClient.publish(roomTopic, roomMessage);
            console.log(`Published to MQTT topic ${roomTopic}:`, roomMessage);
        });

        // gracz dołącza do pokoju
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
            console.log(`Socket ${socket.id}, user ${playerName} joined room ${roomId}`);

            // publikowanie zdarzenia do MQTT
            const topic = `slide-puzzle/activity/${roomId}`;
            const message = JSON.stringify({ event: 'join', playerName });
            mqttClient.publish(topic, message);

            console.log(`Published to MQTT topic ${topic}:`, message);

            io.to(roomId).emit('roomUpdate', { roomId, ...rooms[roomId] });
        });

        socket.on('startGame', (roomId) => {
            console.log(`Game started in room ${roomId}`);

            // publikowanie zdarzenia do MQTT
            const topic = `slide-puzzle/activity/${roomId}`;
            const message = JSON.stringify({ event: 'startGame' });
            mqttClient.publish(topic, message);

            console.log(`Published to MQTT topic ${topic}:`, message);

            const room = rooms[roomId];
            if (!room) {
                socket.emit('error', 'Room does not exist');
                return;
            }

            if (room.players[0].id !== socket.id) {
                socket.emit('error', 'Only the room creator can start the game');
                return;
            }

            room.gameInitialized = true;
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
            // console.log(room)
            // console.log(playerName)
            const player = room.players.find((p) => p.name === playerName);

            player.completed = true;
            player.time = time;

            console.log(`Winner in PuzzleSolved:`, player);

            // declare player as the winner
            room.gameState = 'completed';
            room.winner = player;

            // broadcast the game ended event to all players in the room
            io.to(roomId).emit('gameEnded', {
                winner: playerName,
                time,
            });

            console.log(`Game ended in room ${roomId}. Winner: ${player.name}. Time: ${time} seconds`);
        });

        socket.on('leaveGame', ({ roomId, playerName }) => {
            console.log(`${playerName} left room ${roomId}`);

            if (rooms[roomId]) {
                // Usuń gracza z pokoju
                rooms[roomId].players = rooms[roomId].players.filter(player => player.name !== playerName);

                // Powiadom innych graczy
                mqttClient.publish(`slide-puzzle/activity/${roomId}`, JSON.stringify({
                    event: 'leave',
                    playerName: playerName
                }));

                // Usuń pokój, jeśli nie ma graczy
                if (rooms[roomId].players.length === 0) {
                    delete rooms[roomId];
                    console.log(`Room ${roomId} deleted because it was empty.`);
                }
            }

            // Rozłącz gracza z pokoju
            socket.leave(roomId);
        });

        // Obsługa rozłączenia
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);

            // remove a player from any room
            for (const [roomId, room] of Object.entries(rooms)) {

                const player = room.players.find(p => p.id === socket.id);
                if (player) {
                    room.players = room.players.filter(p => p.id !== socket.id);
                    console.log(`Player ${player.name} left room ${roomId}`);

                    // Publikowanie zdarzenia do MQTT
                    const topic = `slide-puzzle/activity/${roomId}`;
                    const message = JSON.stringify({ event: 'leave', playerName: player.name });
                    mqttClient.publish(topic, message);

                    console.log(`Published to MQTT topic ${topic}:`, message);
                }

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

        socket.on('addChatMessage', (messageData) => {
            // console.log('server -> Message received:', messageData);
            const { roomId, playerName, message } = messageData;

            console.log('Received addChatMessage event:', messageData);

            if (!roomId || !playerName || !message) {
                console.error('Incomplete message data:', messageData);
                return;
            }

            // Check if the room exists
            const room = io.sockets.adapter.rooms.get(roomId);
            console.log('Room members:', room ? Array.from(room) : 'Room does not exist');

            if (!room) {
                console.error(`Room ${roomId} does not exist.`);
                return;
            }

            if (!room.has(socket.id)) {
                console.error(`Socket ${socket.id} is not in room ${roomId}`);
                return;
            }

            console.log(`server -> Send message to room ${roomId}:`, { playerName, message });

            io.to(roomId).emit('addChatMessageRoom', {
                playerName,
                message,
                timestamp: Date.now(),
            });
        });
    });

};

module.exports = { setupSocket, rooms }
