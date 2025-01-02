import { getSocket } from '../connect.js';

// === MQTT - powiadomienia o aktywności graczy ===
export function setupMQTT(roomId) {
    const mqttClient = mqtt.connect('wss://test.mosquitto.org:8081/mqtt');
    
    mqttClient.on('connect', () => {
        console.log('MQTT connected');
        const topic = `slide-puzzle/activity/${roomId}`;
        mqttClient.subscribe(topic, (err) => {
            if (!err) {
                console.log(`Subscribed to topic: ${topic}`);
            } else {
                console.error('Subscription error:', err);
            }
        });
    });

    // Odbieranie powiadomień
    mqttClient.on('message', (topic, message) => {

        const event = JSON.parse(message.toString());
        console.log(`Activity event received:`, event);

        // Obsługa zdarzeń
        if (event.event === 'join') {
            displayNotification(`👤 ${event.playerName} joined the room.`);
        } else if (event.event === 'leave') {
            displayNotification(`🚪 ${event.playerName} left the room.`);
        } else if (event.event === 'startGame') {
            displayNotification(`The game has started!`);
        } else {
            displayNotification(`ℹ️ ${event.message}`);
        }
    });

    // Funkcja wyświetlająca powiadomienia
    function displayNotification(text) {
        // console.log('Displaying notification:', text);
        const notifications = document.getElementById('notifications');
        console.log(document.getElementById('notifications'));
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = text;
        notifications.appendChild(notification);

        // Pokaż powiadomienie
        setTimeout(() => {
            notification.style.opacity = 1;
        }, 10);

        // Usuń powiadomienie po 5 sekundach
        setTimeout(() => {
            notification.style.opacity = 0;
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    return mqttClient
}



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