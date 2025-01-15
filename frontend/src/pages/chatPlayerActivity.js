import { getSocket } from '../connect.js';

// === chat logic ===
export function setupChat(roomId, playerName) {
    const socket = getSocket();

    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    // Send a message
    chatSend.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            console.log('Sending message:', { roomId, playerName, message });
            socket.emit('addChatMessage', { roomId, playerName, message });
            chatInput.value = ''; // Clear the input
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
            if (message) {
                console.log('Sending message by enter:', { roomId, playerName, message });
                socket.emit('addChatMessage', { roomId, playerName, message, timestamp: Date.now() });
                chatInput.value = ''; // Clear the input
            }
        }
    });

    socket.on('addChatMessageRoom', (msg) => {
        const { playerName, message, timestamp } = msg;

        console.log(`Adding message: ${playerName} - ${message}`);
        const msgElement = document.createElement('div');
        msgElement.innerHTML = `<strong>${playerName}</strong> [${new Date(timestamp).toLocaleTimeString()}]: ${message}`;
        chatMessages.appendChild(msgElement);

        // Automatycznie przewiń do dołu po dodaniu nowej wiadomości
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }) 
}