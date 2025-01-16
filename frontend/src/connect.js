import { io } from 'https://cdn.socket.io/4.5.1/socket.io.esm.min.js';
let socket;

export function getSocket() {
    if (!socket) {
        socket = io('http://localhost:3001'); 
        console.log(`Socket initialized with ID: ${socket.id}`);
    } else {
        console.log(`Reusing existing socket with ID: ${socket.id}`);
    }
    return socket;
}

