import { io } from 'https://cdn.socket.io/4.5.1/socket.io.esm.min.js';

const socket = io('http://localhost:3001'); // Connect to backend

// Listen for real-time chat messages
export function onChatMessage(callback) {
    console.log("onChatMessage executed")
    socket.on('chatMessage', callback); // Listen for incoming chat messages
}

export function sendChatMessage(roomId, playerName, message) { 
    if (!roomId || !playerName || !message) {
        console.error('Incomplete data for chatMessage:', { roomId, playerName, message });
        return;
    }
    console.log(`sendChatMessage executed, ${ roomId, playerName, message }`)
    socket.emit('chatMessage', { roomId, playerName, message, timestamp: Date.now() }); // Send a chat message to the server
}

export default socket;
