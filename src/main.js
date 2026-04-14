import { flashcards } from './data/flashcards.js';

// DOM Elements
const displayText = document.getElementById('display-text');
const readingText = document.getElementById('reading-text');
const playAudioBtn = document.getElementById('play-audio-btn');
const optionsContainer = document.getElementById('options-container');
const healthCount = document.getElementById('health-count');
const scoreCount = document.getElementById('score-count');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const modeToggleBtn = document.getElementById('mode-toggle-btn');

// Game State
let gameState = {
    score: 0,
    health: 3,
    currentCard: null,
    mode: 'JP_TO_ID', // 'JP_TO_ID' or 'ID_TO_JP'
    // Filter out cards that don't have a translation (where meaning is just reading)
    gameDeck: flashcards.filter(c => c.meaning !== c.reading && c.meaning !== c.display)
};

// Initialize Game
function init() {
    if (gameState.gameDeck.length === 0) {
        // Fallback to full list if no translations available yet
        gameState.gameDeck = flashcards;
    }
    nextRound();
}

function toggleMode() {
    gameState.mode = gameState.mode === 'JP_TO_ID' ? 'ID_TO_JP' : 'JP_TO_ID';
    modeToggleBtn.textContent = gameState.mode === 'JP_TO_ID' ? 'JP → ID' : 'ID → JP';
    nextRound();
}

function nextRound() {
    if (gameState.health <= 0) {
        endGame();
        return;
    }

    // Pick random card from gameDeck
    const randomIndex = Math.floor(Math.random() * gameState.gameDeck.length);
    gameState.currentCard = gameState.gameDeck[randomIndex];

    // Reset styles
    displayText.classList.remove('long-text');

    if (gameState.mode === 'JP_TO_ID') {
        // Show Kanji/Kana on card
        displayText.textContent = gameState.currentCard.display;
        
        // Show reading only if different
        if (gameState.currentCard.display !== gameState.currentCard.reading) {
            readingText.textContent = gameState.currentCard.reading;
            readingText.style.opacity = '1';
        } else {
            readingText.textContent = '';
            readingText.style.opacity = '0';
        }
    } else {
        // Show Indonesian Meaning on card
        displayText.textContent = gameState.currentCard.meaning;
        readingText.textContent = '';
        readingText.style.opacity = '0';

        // Adjust font for long Indonesian words
        if (gameState.currentCard.meaning.length > 15) {
            displayText.classList.add('long-text');
        }
    }
    
    // Generate Options
    generateOptions();

    // Play audio
    playAudio();
}

function generateOptions() {
    optionsContainer.innerHTML = '';
    
    let correctAnswerValue;
    if (gameState.mode === 'JP_TO_ID') {
        correctAnswerValue = gameState.currentCard.meaning;
    } else {
        // Format as "Kanji (Reading)" or just "Reading" if identical
        correctAnswerValue = formatJapaneseOption(gameState.currentCard);
    }
    
    const wrongOptions = [];
    while (wrongOptions.length < 3) {
        const randomCard = gameState.gameDeck[Math.floor(Math.random() * gameState.gameDeck.length)];
        const val = gameState.mode === 'JP_TO_ID' 
            ? randomCard.meaning 
            : formatJapaneseOption(randomCard);

        if (val !== correctAnswerValue && !wrongOptions.includes(val)) {
            wrongOptions.push(val);
        }
    }

    const allOptions = [correctAnswerValue, ...wrongOptions].sort(() => Math.random() - 0.5);

    allOptions.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        // Reduce font size if option text is long
        if (option.length > 20) btn.style.fontSize = '0.9rem';
        
        btn.style.animationDelay = `${index * 0.1}s`;
        btn.onclick = () => checkAnswer(option, btn);
        optionsContainer.appendChild(btn);
    });
}

function formatJapaneseOption(card) {
    if (card.display === card.reading) return card.display;
    return `${card.display} (${card.reading})`;
}

function checkAnswer(selected, button) {
    const allButtons = optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);

    const correctAnswer = gameState.mode === 'JP_TO_ID' 
        ? gameState.currentCard.meaning 
        : formatJapaneseOption(gameState.currentCard);

    if (selected === correctAnswer) {
        gameState.score += 10;
        scoreCount.textContent = gameState.score;
        button.classList.add('correct');
        setTimeout(nextRound, 1000);
    } else {
        gameState.health--;
        updateHealthUI();
        button.classList.add('wrong');
        
        allButtons.forEach(btn => {
            if (btn.textContent === correctAnswer) {
                btn.classList.add('correct');
            }
        });

        setTimeout(() => {
            if (gameState.health <= 0) endGame();
            else nextRound();
        }, 1500);
    }
}

function updateHealthUI() {
    healthCount.textContent = gameState.health;
    if (gameState.health === 1) {
        document.getElementById('health-container').style.borderColor = 'var(--danger)';
    }
}

function playAudio() {
    if (!gameState.currentCard.audio) return;
    const audio = new Audio(gameState.currentCard.audio);
    audio.play().catch(e => console.log('Audio play failed:', e));
}

function endGame() {
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScore.textContent = gameState.score;
}

function restartGame() {
    gameState.score = 0;
    gameState.health = 3;
    scoreCount.textContent = '0';
    updateHealthUI();
    document.getElementById('health-container').style.borderColor = 'rgba(239, 68, 68, 0.2)';
    gameScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');
    nextRound();
}

// Event Listeners
playAudioBtn.onclick = playAudio;
modeToggleBtn.onclick = toggleMode;
restartBtn.onclick = restartGame;

init();
