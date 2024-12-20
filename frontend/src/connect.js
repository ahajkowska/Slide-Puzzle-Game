import { io } from 'https://cdn.socket.io/4.5.1/socket.io.esm.min.js';

const socket = io('http://localhost:3001'); // Connect to backend

// Join a room
export function joinRoom(roomId, playerName) {
    if (!roomId || !playerName) {
        console.error('Room ID and player name are required to join the room.');
        return;
    }
    console.log(`Joining a room: ${roomId}, player: ${playerName}`);
    socket.emit('joinRoom', { roomId, playerName });
}

// Emit puzzle solved event
export function emitPuzzleSolved(roomId, playerName) {
    socket.emit('puzzleSolved', { roomId, playerName });
}

// Listen for room updates
export function onRoomUpdate(callback) {
    socket.on('roomUpdate', callback);
}

// Listen for game end event
export function onGameEnded(callback) {
    socket.on('gameEnded', callback);
}

// Listen for real-time chat messages
export function onChatMessage(callback) {
    // console.log("onChatMessage executed")
    socket.on('chatMessage', callback); // Listen for incoming chat messages
}

export function sendChatMessage(roomId, playerName, message) { 
    if (!roomId || !playerName || !message) {
        console.error('Incomplete data for chatMessage:', { roomId, playerName, message });
        return;
    }
    // console.log('sendChatMessage executed')
    socket.emit('chatMessage', { roomId, playerName, message }); // Send a chat message to the server
}

export default socket;
