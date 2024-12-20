
export async function loadGamePage(params = {}) {

    const roomId = params.roomId; // extract roomId

    if (!roomId) {
        console.error("Room ID is required to load the game page!");
        return;
    }

    const app = document.getElementById('app');

    app.innerHTML=`
        <div clssdd="content">
            <div class="logo">Slide Puzzle</div>
            <div class="board" id="puzzle-board">
                
            </div>
            <div class="time"><h1>Time: <span id="time">0</span> seconds</h1></div>
        </div>

        <div id="chat-container">
            <div id="chat-messages"></div>
            <input type="text" id="chat-input" placeholder="Type your message">
            <button id="chat-send">Send</button>
        </div> 
    `

    // const playerName = await getPlayerName();
    const playerName = localStorage.getItem('username')

    console.log(`Joined game room: ${roomId} as ${playerName}`);

    // Listen for gameEnded
    socket.on('gameEnded', ({ winner, time }) => {
        console.log('gameEnded received:', { winner, time });
        showWinnerScreen({ winner, time });
    });

    // ==== game logic ====

    const sketch = (p) => {
        let source;
        let tiles = [];
        let cols = 4;
        let rows = 4;
        let w,h;
        let board = []; // order,positions of all tiles
        // let blankSpot = -1;
        let turnCount = 0;
        let startTime;
        // let endTime;

        p.preload = () => {
            source = p.loadImage("img/gory2.jpg");
        }

        p.setup = () => {
            const canvas = p.createCanvas(400,400);
            canvas.parent("puzzle-board"); // attach canvas to the html div with id "puzzle-board"

            // px dimensions of each tiles
            w = p.width / cols;
            h = p.height / rows;

            // chopping img into tiles
            for (let i = 0; i < cols; i++){
                for (let j = 0; j < rows; j++){
                    let x = i * w;
                    let y = j * h;
                    let img = p.createImage(w,h)
                    img.copy(source, x, y, w , h, 0, 0, w , h) // copy from source, from location (4) to destination (4)
                    let index = i + j * cols;
                    board.push(index);
                    let tile = new Tile(index, img);
                    tiles.push(tile)
                }
            }

            // remove a tile (to be able to shuffle)
            tiles.pop();
            board.pop();
            board.push(-1);

            // shuffle the array that is keeping the track of indexes
            shuffleIt(board);

            // Start the timer
            startTime = Date.now();
        }

        function swap(i,j,arr){
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }

        function randomMove(arr){
            let r1 = p.floor(p.random(cols));
            let r2 = p.floor(p.random(rows)); 
            move(r1, r2, arr);
        }

        function shuffleIt(arr){
            for (let i = 0; i < 20; i++){ // kafelki
                randomMove(arr);
            }
        }

        p.mousePressed = () => {
            console.log("Mouse pressed at:", p.mouseX, p.mouseY);
            let i = p.floor(p.mouseX / w); //col
            let j = p.floor(p.mouseY / h); //row
            if (move(i, j, board)) {
                turnCount++;
                console.log("Turn count:", turnCount);
                // document.getElementById("turns").innerText = turnCount;
            }
        }

        p.draw = () => {
            if (gameOver) return;
            p.background(0);

            //randomMove(board);

            // Update elapsed time display
            const elapsedTimeMs = Date.now() - startTime; // Elapsed time in milliseconds
            const seconds = Math.floor(elapsedTimeMs / 1000);
            const milliseconds = elapsedTimeMs % 1000;

            // seconds.milliseconds
            const formattedTime = `${seconds}.${milliseconds.toString().padStart(3, '0')}`;

            // Update the display
            document.getElementById("time").innerText = formattedTime;
            
            // draw the board
            for (let i = 0; i < cols; i++){
                for (let j = 0; j < rows; j++){
                    let index = i + j * cols;
                    let x = i * w;
                    let y = j* h;
                    let tileIndex = board[index];
                    if (tileIndex > -1){ // don't draw an empty tile
                        let img = tiles[tileIndex].img;
                        p.image(img, x, y, w, h);
                    }
                }
            }

            // show as grid
            for (let i = 0; i < cols; i++){
                for (let j = 0; j < rows; j++){
                    let x = i * w;
                    let y = j* h;
                    p.strokeWeight(2);
                    p.noFill();
                    p.rect(x, y, w, h);
                }
            }

            checkPuzzleSolved()
        }

        p.goToHome = () => {
            import('./Home.js').then(({ loadHomePage }) => {
                loadHomePage(); // Load login page dynamically
            });
        }
        window.goToHome = p.goToHome;

        function isSolved() {
            for (let i = 0; i < board.length-1; i++) {
            if (board[i] !== tiles[i].index) {
                return false;
            }
            }
            return true;
        }

        let gameOver = false; // track if game is over

        function checkPuzzleSolved() {
            if (isSolved() && !gameOver) {
                console.log("SOLVED!");
                gameOver = true;
                const completionTime = (Date.now() - startTime) / 1000; // Calculate elapsed time

                socket.emit('PuzzleSolved', {
                    roomId: roomId, // Room ID where the player is
                    playerName: playerName, // Player's name
                    time: completionTime // Time taken
                });

                showWinnerScreen({ winner: playerName, time: completionTime.toFixed(2) });
            }
        }

        function move(i, j, arr){
            let blank = findBlank();
            let blankCol = blank % cols;
            let blankRow = p.floor(blank / rows);
            // console.log(`Blank Tile: col=${blankCol}, row=${blankRow}`);
            // console.log(`Is Neighbor: ${isNeighbor(i, j, blankCol, blankRow)}`);
            if (isNeighbor(i, j, blankCol, blankRow)){
                swap(blank, i + j * cols, arr); //if it is a proper neighbour it can be swapped
                return true;
            }
            return false;
        }

        function isNeighbor(i, j, x, y){
            if (i !== x && j !== y){
                return false;
            }
            if (p.abs(i-x) == 1 || p.abs(j-y) ==1){
                return true
            }
            return false
        }

        function findBlank(){ //check which one is blank
            for (let i = 0; i < board.length; i++){
                if (board[i] == -1) return i;
            }
        }

    }

    new p5(sketch);

}