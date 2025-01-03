import { getSocket } from '../connect.js';
const socket = getSocket();

import { navigateTo } from '../router.js';

export function loadWaitingRoomPage() {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div>
            <button id="return-btn">Return</button>
            <h1>Waiting Room</h1>
            <div>
                <input type="text" id="room-id" placeholder="Room ID">
                <input type="number" id="max-players" placeholder="Max Players" min="2" max="10">
                <button id="create-room">Create Room</button>
            </div>
            <div>
                <input type="text" id="join-room-id" placeholder="Room ID">
                <button id="join-room">Join Room</button>
            </div>
            <div id="room-info">
                <h2>Room Details</h2>
                <ul id="player-list"></ul>
                <button id="start-game" disabled>Start Game</button>
            </div>
        </div>
    `;

    document.getElementById('return-btn').addEventListener('click', () => {
        navigateTo('/'); // navigate back to home
    });
    
    let currentRoomId = null;

    const playerName = localStorage.getItem('username') || `Guest_${Math.floor(Math.random() * 1000)}`;
    
    console.log("username from localStorage:", localStorage.getItem('username'));
    if ( !localStorage.getItem('username') ) {
        localStorage.setItem('username', playerName)
    }
    // console.log("username from localStorage2:", localStorage.getItem('username'));
    console.log(`player name is: ${playerName}`)

    const playerList = document.getElementById('player-list');
    const startGameBtn = document.getElementById('start-game');

    const createRoomBtn = document.getElementById('create-room');
    const roomIdInput = document.getElementById('room-id');
    const maxPlayersInput = document.getElementById('max-players');

    const joinRoomBtn = document.getElementById('join-room');
    const joinRoomIdInput = document.getElementById('join-room-id');


    // === Room Management ===

    // Create room
    createRoomBtn.addEventListener('click', () => {
        const roomId = roomIdInput.value;
        const maxPlayers = parseInt(maxPlayersInput.value, 10);
        if (roomId && maxPlayers) {
            socket.emit('createRoom', { roomId, maxPlayers, playerName });
            currentRoomId = roomId;
            console.log(`Room created with ID: ${currentRoomId}`);
        } else {
            console.error('Room ID or max players not provided');
        }
    });

    // create room btn only for guests
    if (playerName && !playerName.startsWith("Guest_")) {
        console.log("Logged-in user: Room creation allowed.");
        createRoomBtn.disabled = false;
    } else {
        console.log("Guests cannot create rooms.");
        createRoomBtn.disabled = true;
        createRoomBtn.title = "You must be logged in to create a room.";
    }

    // Join room
    joinRoomBtn.addEventListener('click', async () => {
        const roomId = joinRoomIdInput.value;
        if (roomId) {
            const roomExists = await checkRoomExists(roomId);
            if (roomExists) {
                socket.emit('joinRoom', { roomId, playerName });
                currentRoomId = roomId;
                console.log(`Joined room with ID: ${currentRoomId}`);
            } else {
                alert('Room does not exist. Please enter a valid Room ID.');
            }
        } else {
            console.error('Room ID not provided');
        }
    });

    // --- Socket.IO ---

    // Update room details
    socket.on('roomUpdate', (room) => {
        // console.log(`roomUpdate room: ${room}`)
        
        if (!room || typeof room !== 'object') {
            console.error('Invalid room data received in roomUpdate:', room);
            return;
        }

        currentRoomId = room.roomId;
        console.log(`Updated currentRoomId: ${currentRoomId}`);
        
        // Update player list in the UI
        playerList.innerHTML = '';
        room.players.forEach((player) => {
            const li = document.createElement('li');
            li.textContent = player.name;
            playerList.appendChild(li);
        });

        // Enable the start game button for the room creator
        startGameBtn.disabled = room.players[0].id !== socket.id;
    });

    // Start the game
    startGameBtn.addEventListener('click', () => {
        if (currentRoomId) {
            console.log(`Emitting startGame for room: ${currentRoomId}`);
            socket.emit('startGame', currentRoomId);
            navigateTo('/game', { roomId: currentRoomId, playerName });
        } else {
            console.error('No current room ID available for startGame');
        }
    });

    //Navigate to game page when game starts
    socket.on('gameStarted', (room) => {
        console.log(`Game started, navigating to game room: ${room.roomId}`);
        navigateTo(`/game`, { roomId: room.roomId, playerName });
    });
}

// check if room exists
async function checkRoomExists(roomId) {
    try {
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) {
            console.error(`Error checking room existence: ${response.statusText}`);
            return false;
        }
        const data = await response.json();
        return data.exists; // returns `{ exists: true/false }`
    } catch (error) {
        console.error('Error checking room existence:', error);
        return false;
    }
}