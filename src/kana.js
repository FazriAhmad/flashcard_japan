import { kana } from './data/kana.js';

// --- Belajar Huruf: Hiragana & Katakana ---
// Fitur terpisah dari kuis kosakata (main.js) — punya progress/localStorage sendiri
// supaya "hafal huruf" dan "hafal kosakata" tidak saling menimpa.
const KANA_PROGRESS_KEY = 'flashcardKanaProgress';

let kanaState = {
    script: 'hiragana',
    view: 'card',
    deck: [],
    order: [],
    pos: 0
};

const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const kanaScreen = document.getElementById('kana-screen');
const kanaNavBtn = document.getElementById('kana-nav-btn');
const kanaBackBtn = document.getElementById('kana-back-btn');

const kanaFlashcard = document.getElementById('kana-flashcard');
const kanaFront = document.getElementById('kana-front');
const kanaBack = document.getElementById('kana-back');
const kanaProgressText = document.getElementById('kana-progress');
const kanaMasteredText = document.getElementById('kana-mastered-count');
const kanaMasterBtn = document.getElementById('kana-master-btn');
const kanaCardWrap = document.getElementById('kana-card-wrap');
const kanaTable = document.getElementById('kana-table');

function loadProgress() {
    try {
        return JSON.parse(localStorage.getItem(KANA_PROGRESS_KEY)) || {};
    } catch (e) {
        return {};
    }
}
function saveProgress(data) {
    localStorage.setItem(KANA_PROGRESS_KEY, JSON.stringify(data));
}
function getMastered() {
    const data = loadProgress();
    return new Set(data[kanaState.script] || []);
}
function setMastered(set) {
    const data = loadProgress();
    data[kanaState.script] = Array.from(set);
    saveProgress(data);
}

function buildDeck() {
    const g = kana[kanaState.script];
    kanaState.deck = [...g.seion, ...g.dakuten, ...g.handakuten]
        .map(k => ({ front: k.char, back: k.romaji.toUpperCase() }));
    kanaState.order = kanaState.deck.map((_, i) => i);
    kanaState.pos = 0;
    kanaFlashcard.classList.remove('flipped');
}

function shuffleOrder() {
    const order = kanaState.order;
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    kanaState.pos = 0;
    kanaFlashcard.classList.remove('flipped');
    renderCard();
}

function currentCardKey() {
    return kanaState.deck[kanaState.order[kanaState.pos]].front;
}

function speakKana(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

function renderCard() {
    if (kanaState.deck.length === 0) return;
    const item = kanaState.deck[kanaState.order[kanaState.pos]];
    kanaFront.textContent = item.front;
    kanaBack.textContent = item.back;
    kanaProgressText.textContent = `${kanaState.pos + 1} / ${kanaState.deck.length}`;
    const mastered = getMastered();
    kanaMasteredText.textContent = `${mastered.size} / ${kanaState.deck.length} dikuasai`;
    const isMastered = mastered.has(currentCardKey());
    kanaMasterBtn.classList.toggle('is-mastered', isMastered);
    kanaMasterBtn.textContent = isMastered ? '✓ SUDAH HAFAL' : 'TANDAI HAFAL';
}

function flipCard() {
    kanaFlashcard.classList.toggle('flipped');
    if (kanaFlashcard.classList.contains('flipped')) {
        speakKana(kanaState.deck[kanaState.order[kanaState.pos]].front);
    }
}

function nextCard() {
    kanaState.pos = (kanaState.pos + 1) % kanaState.deck.length;
    kanaFlashcard.classList.remove('flipped');
    renderCard();
}
function prevCard() {
    kanaState.pos = (kanaState.pos - 1 + kanaState.deck.length) % kanaState.deck.length;
    kanaFlashcard.classList.remove('flipped');
    renderCard();
}
function toggleMastered(e) {
    e.stopPropagation();
    const key = currentCardKey();
    const mastered = getMastered();
    if (mastered.has(key)) mastered.delete(key); else mastered.add(key);
    setMastered(mastered);
    renderCard();
}

function renderTable() {
    kanaTable.innerHTML = '';
    const mastered = getMastered();
    const g = kana[kanaState.script];
    [['Dasar (Seion)', g.seion], ['Dakuten (゛)', g.dakuten], ['Handakuten (゜)', g.handakuten]].forEach(([label, items]) => {
        if (items.length === 0) return;
        const h = document.createElement('div');
        h.className = 'kana-group-label';
        h.textContent = label;
        kanaTable.appendChild(h);

        const grid = document.createElement('div');
        grid.className = 'kana-grid';
        items.forEach(k => {
            const cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'kana-cell' + (mastered.has(k.char) ? ' mastered' : '');
            cell.innerHTML = `<span class="kc-char">${k.char}</span><span class="kc-romaji">${k.romaji}</span>`;
            cell.addEventListener('click', () => speakKana(k.char));
            grid.appendChild(cell);
        });
        kanaTable.appendChild(grid);
    });
}

function renderView() {
    kanaCardWrap.classList.toggle('hidden', kanaState.view !== 'card');
    kanaTable.classList.toggle('hidden', kanaState.view !== 'table');
    if (kanaState.view === 'card') renderCard(); else renderTable();
}

function openKanaScreen() {
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    kanaScreen.classList.remove('hidden');
    buildDeck();
    renderView();
}
function closeKanaScreen() {
    kanaScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
}

kanaNavBtn.addEventListener('click', openKanaScreen);
kanaBackBtn.addEventListener('click', closeKanaScreen);

document.querySelectorAll('#kana-script-toggle .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('#kana-script-toggle .toggle-btn.active').classList.remove('active');
        btn.classList.add('active');
        kanaState.script = btn.dataset.script;
        buildDeck();
        renderView();
    });
});
document.querySelectorAll('#kana-view-toggle .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('#kana-view-toggle .toggle-btn.active').classList.remove('active');
        btn.classList.add('active');
        kanaState.view = btn.dataset.view;
        renderView();
    });
});

kanaFlashcard.addEventListener('click', flipCard);
document.getElementById('kana-prev').addEventListener('click', prevCard);
document.getElementById('kana-next').addEventListener('click', nextCard);
document.getElementById('kana-shuffle').addEventListener('click', shuffleOrder);
document.getElementById('kana-speak').addEventListener('click', (e) => {
    e.stopPropagation();
    speakKana(kanaState.deck[kanaState.order[kanaState.pos]].front);
});
kanaMasterBtn.addEventListener('click', toggleMastered);
