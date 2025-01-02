import { getSocket } from '../connect.js';
import { setupMQTT, setupChat } from './chatPlayerActivity.js';
import { initializeGame } from './gameLogic.js';
import { showWinnerScreen } from './winnerScreen.js';
import { navigateTo } from '../router.js';

export async function loadGamePage(params = {}) {

    const roomId = params.roomId; // extract roomId
    const playerName = params.playerName; // use playerName from navigation parameters

    if (!roomId) {
        console.error("Room ID is required to load the game page!");
        return;
    }

    console.log(`Joined game room: ${roomId} as ${playerName}`);

    const app = document.getElementById('app');

    // Check if the game board already exists
    app.innerHTML = `
            <button id="leave-game">Leave Game</button>
            <div class="content">
                <div class="logo">Slide Puzzle</div>
                <div class="board" id="puzzle-board"></div>
                <div class="time"><h1>Time: <span id="time">0</span> seconds</h1></div>
            </div>
            <div id="notifications" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
            </div>
            <div id="chat-container">
                <div id="chat-messages"></div>
                <input type="text" id="chat-input" placeholder="Type your message">
                <button id="chat-send">Send</button>
            </div>
        `;

    const socket = getSocket();

    setupMQTT(roomId);
    setupChat(roomId, playerName);
    initializeGame(roomId, playerName, socket)

    document.getElementById('leave-game').addEventListener('click', () => {
        if (confirm('Are you sure you want to leave the game?')) {
            // Emitowanie zdarzenia opuszczenia gry
            socket.emit('leaveGame', { roomId, playerName });
    
            navigateTo('/');
        }
    });     

    // Listen for gameEnded
    socket.on('gameEnded', ({ winner, time }) => {
        console.log('gameEnded received:', { winner, time });
        showWinnerScreen( { winner, time } );
    });
}