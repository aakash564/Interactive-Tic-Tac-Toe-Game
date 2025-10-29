const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
];

// DOM Elements
const gameBoard = document.getElementById('gameBoard');
const gameStatus = document.getElementById('gameStatus');
const resetButton = document.getElementById('resetButton');

// Game State
let boardState = Array(9).fill(null);
let currentPlayer = 'X';
let isGameActive = true;

// Audio Context and Sounds
let audioContext;
const soundFiles = {
    place: 'tictac_place.mp3',
    win: 'tictac_win.mp3'
};
const audioBuffers = {};

/**
 * Initializes the Audio Context and loads sounds.
 */
async function initializeAudio() {
    if (!window.AudioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const loadSound = async (key) => {
        try {
            const response = await fetch(soundFiles[key]);
            const arrayBuffer = await response.arrayBuffer();
            audioBuffers[key] = await audioContext.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error(`Error loading audio file ${soundFiles[key]}:`, e);
        }
    };

    await Promise.all(Object.keys(soundFiles).map(loadSound));
}

/**
 * Plays a loaded sound effect.
 * @param {string} key - Key corresponding to the sound file (e.g., 'place').
 */
function playSound(key) {
    if (!audioContext || !audioBuffers[key]) return;
    
    // Resume context if suspended (common requirement for user interaction)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers[key];
    source.connect(audioContext.destination);
    source.start(0);
}


/**
 * Renders the 9 cells onto the game board.
 */
function renderBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i, cell));
        gameBoard.appendChild(cell);
    }
    updateStatus(`Player ${currentPlayer}'s Turn`);
}

/**
 * Updates the game status display.
 * @param {string} message 
 */
function updateStatus(message) {
    gameStatus.textContent = message;
}

/**
 * Checks for a winner.
 * @returns {string | null} 'X', 'O', or null if no winner.
 */
function checkWinner() {
    for (const combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            return { winner: boardState[a], combination };
        }
    }
    return null;
}

/**
 * Handles a cell click event.
 * @param {number} index - Index of the clicked cell (0-8).
 * @param {HTMLElement} cellElement - The clicked cell DOM element.
 */
function handleCellClick(index, cellElement) {
    if (!isGameActive || boardState[index]) {
        return; // Ignore if game is inactive or cell is already taken
    }

    // 1. Update state and UI
    boardState[index] = currentPlayer;
    cellElement.textContent = currentPlayer;
    cellElement.classList.add(currentPlayer.toLowerCase());
    
    playSound('place');

    // 2. Check game end conditions
    const winnerResult = checkWinner();
    
    if (winnerResult) {
        // Winner found
        isGameActive = false;
        updateStatus(`Player ${winnerResult.winner} Wins!`);
        highlightWinningCells(winnerResult.combination);
        playSound('win');
        return;
    }

    // Check for draw (if all cells are filled)
    if (boardState.every(cell => cell !== null)) {
        isGameActive = false;
        updateStatus("It's a Draw!");
        return;
    }

    // 3. Switch player
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus(`Player ${currentPlayer}'s Turn`);
}

/**
 * Highlights the three cells that resulted in a win.
 * @param {number[]} combination 
 */
function highlightWinningCells(combination) {
    const cells = gameBoard.querySelectorAll('.cell');
    combination.forEach(index => {
        cells[index].classList.add('winning');
    });
}


/**
 * Resets the game state and UI.
 */
function resetGame() {
    boardState.fill(null);
    currentPlayer = 'X';
    isGameActive = true;
    renderBoard(); // Rerender to clear cells and remove classes
}

/**
 * Initializes the game and sets up listeners.
 */
function initialize() {
    // 1. Setup Audio
    initializeAudio();
    
    // 2. Initial Render
    renderBoard();

    // 3. Reset Button Listener
    resetButton.addEventListener('click', resetGame);
}

document.addEventListener('DOMContentLoaded', initialize);

