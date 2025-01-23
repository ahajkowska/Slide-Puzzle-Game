import { getSocket } from '../connect.js';
import { getMQTTClient } from '../mqttClient.js';

// === chat && room activity in a waiting room ===
export function setupWaitingRoomChat(playerName){
    
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    const mqttClient = getMQTTClient();

    const chatTopic = `waiting-room/general-chat`;
    const newRoomTopic = 'waiting-room/new-room';
    const playerJoinTopic = 'waiting-room/player-join';
    const chatTyping = `waiting-room/typing`;

    mqttClient.on('connect', () => {
        if (!mqttClient.subscriptions) {
            mqttClient.subscriptions = new Set(); // to track active subscriptions
        }

        if (!mqttClient.subscriptions.has(newRoomTopic)) {
            mqttClient.subscribe(newRoomTopic, (err) => {
                if (err) {
                    console.error(`Failed to subscribe to topic ${newRoomTopic}:`, err);
                } else {
                    console.log(`Subscribed to ${newRoomTopic}`);
                    mqttClient.subscriptions.add(newRoomTopic);
                }
            });
        }

        mqttClient.subscribe(playerJoinTopic, (err) => {
            if (err) {
                console.error(`Failed to subscribe to topic ${playerJoinTopic}:`, err);
            } else {
                console.log(`Subscribed to ${playerJoinTopic}`);
            }
        });

        mqttClient.subscribe(chatTopic, (err) => {
            if (err) {
                console.error(`Failed to subscribe to topic ${chatTopic}:`, err);
            } else {
                console.log(`Subscribed to waiting room chat: ${chatTopic}`);
            }
        });

        mqttClient.subscribe(chatTyping, (err) => {
            if (!err) {
                console.log(`Subscribed to typing topic: waiting-room/typing`);
            }
        });
    });

    mqttClient.on('message', (topic, message) => {
        if (topic === newRoomTopic) {
            const { roomId, maxPlayers } = JSON.parse(message.toString());
            console.log("displaying new room notification")
            displayNewRoomNotification(roomId, maxPlayers);
        }

        if (topic === playerJoinTopic) {
            const { roomId, playerName } = JSON.parse(message.toString());
            console.log("displaying player join notification")
            displayPlayerJoinNotification(roomId, playerName);
        }

        if (topic === chatTopic) {
            const msg = JSON.parse(message.toString());
            displayChatMessage(msg.playerName, msg.message);
        }

        if (topic === chatTyping) {
            const { playerName } = JSON.parse(message.toString());
            const typingIndicator = document.getElementById('typing-indicator');
            typingIndicator.innerText = `${playerName} is typing...`;
    
            // remove indicator after delay
            clearTimeout(typingIndicator.timeout);
            typingIndicator.timeout = setTimeout(() => {
                typingIndicator.innerText = '';
            }, 2000);
        }
    });
    
    function displayNewRoomNotification(roomId, maxPlayers) {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `New room created: ${roomId} (Max players: ${maxPlayers})`;
        notifications.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = 1;
        }, 10);

        setTimeout(() => {
            notification.style.opacity = 0;
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    function displayPlayerJoinNotification(roomId, playerName) {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `${playerName} has joined room: ${roomId}`;
        notifications.appendChild(notification);
    
        setTimeout(() => {
            notification.style.opacity = 1;
        }, 10);
    
        setTimeout(() => {
            notification.style.opacity = 0;
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }    
    
    function displayChatMessage(sender, message) {
        const msgElement = document.createElement('div');
        msgElement.textContent = `${sender}: ${message}`;
        chatMessages.appendChild(msgElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatSendBtn.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            mqttClient.publish(chatTopic, JSON.stringify({ playerName, message }));
            chatInput.value = ''; // clear the input
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            chatSendBtn.click();
        }
    });

    chatInput.addEventListener('input', () => {
        mqttClient.publish(chatTyping, JSON.stringify({ playerName }));
    });
}

// === game chat logic ===
export function setupChat(roomId, playerName) {
    const socket = getSocket();

    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    // send a message
    chatSend.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            console.log('Sending message:', { roomId, playerName, message });
            socket.emit('addChatMessage', { roomId, playerName, message });
            chatInput.value = ''; // clear the input
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = chatInput.value.trim();
            if (message) {
                console.log('Sending message by enter:', { roomId, playerName, message });
                socket.emit('addChatMessage', { roomId, playerName, message, timestamp: Date.now() });
                chatInput.value = ''; // clear the input
            }
        }
    });

    socket.on('addChatMessageRoom', (msg) => {
        const { playerName, message, timestamp } = msg;

        console.log(`Adding message: ${playerName} - ${message}`);
        const msgElement = document.createElement('div');
        msgElement.innerHTML = `<strong>${playerName}</strong> [${new Date(timestamp).toLocaleTimeString()}]: ${message}`;
        chatMessages.appendChild(msgElement);

        // automatycznie przewiń do dołu po dodaniu nowej wiadomości
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }) 
}