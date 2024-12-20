export function loadHomePage() {
    const app = document.getElementById('app');

    app.innerHTML=`
        <div class="logo">slide puzzle</div>
        <div class="buttons">
            <button id="playButton">play</button>
            <button id="rulesButton">rules</button>
            <button id="login">login</button>
            <button id="leaderboard">leaderboard</button>
        </div>

        <!-- Rules Modal -->
        <div id="rulesModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Game Rules</h2>
                <p>
                    Hello! Your mission: rearrange the tiles to restore the image.<br>
                    1. Click the tiles to shuffle them into the empty space.<br>
                    2. Complete the puzzle as fast as you can.<br>
                    3. When the picture is restored, take a moment to marvel at your triumph and then celebrate your win. 🎉
                </p>
            </div>
        </div>
    `;

    window.addEventListener('beforeunload', () => {
        // clear local storage
        localStorage.removeItem('username');
    });
    
    document.getElementById('playButton').addEventListener('click', () => {
        import('./waitingRoom.js').then(({ loadWaitingRoomPage }) => loadWaitingRoomPage());
    });
    document.getElementById('login').addEventListener('click', () => {
        import('./login.js').then(({ loadLoginPage }) => loadLoginPage());
    });
    document.getElementById('leaderboard').addEventListener('click', () => {
        import('./leaderboard.js').then(({ loadLeaderboardPage }) => loadLeaderboardPage());
    });
    
       // === Modal functionality ===

       const rulesModal = document.getElementById('rulesModal');
       const rulesButton = document.getElementById('rulesButton');
       const closeButton = document.querySelector('.close');
   
       // open the modal when the rules btn is clicked
       rulesButton.addEventListener('click', () => {
           rulesModal.style.display = 'block';
       });
   
       // close the modal when the close btn is clicked
       closeButton.addEventListener('click', () => {
           rulesModal.style.display = 'none';
       });
   
       // close the modal when the user clicks outside the modal content
       window.addEventListener('click', (event) => {
           if (event.target === rulesModal) {
               rulesModal.style.display = 'none';
           }
       });

}