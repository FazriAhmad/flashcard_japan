import fs from 'fs';
import path from 'path';
import { dictionaryID } from '../src/data/id-dictionary.js';

const audioDir = 'c:/Users/Fazri/portofolio/flashcard/audio_jepang';
const outputDir = 'c:/Users/Fazri/portofolio/flashcard/src/data';
const outputFile = path.join(outputDir, 'flashcards.js');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function getCardType(text, reading) {
    const hiraganaRegex = /^[\u3040-\u309F]+$/;
    const katakanaRegex = /^[\u30A0-\u30FF]+$/;
    
    // Clean text (remove special chars like 〜)
    const cleanText = text.replace(/[〜【】]/g, '');

    if (hiraganaRegex.test(cleanText)) return 'hiragana';
    if (katakanaRegex.test(cleanText)) return 'katakana';
    return 'vocabulary';
}

const files = fs.readdirSync(audioDir);
const flashcards = [];

files.forEach(file => {
    if (!file.endsWith('.mp3')) return;

    // Match format: Text【Reading】.mp3 or just Text.mp3
    const match = file.match(/^(.*?)【(.*?)】\.mp3$/);
    
    let display, reading;

    if (match) {
        display = match[1];
        reading = match[2];
    } else {
        display = file.replace('.mp3', '');
        reading = display; // Fallback
    }

    // Get meaning from dictionary or fallback to reading
    const meaning = dictionaryID[display] || reading;

    flashcards.push({
        display,
        reading,
        meaning,
        audio: `/audio_jepang/${file}`,
        type: getCardType(display, reading)
    });
});

const content = `// Generated automatically from audio_jepang folder
export const flashcards = ${JSON.stringify(flashcards, null, 2)};
`;

fs.writeFileSync(outputFile, content);
console.log(`Successfully generated ${flashcards.length} flashcards in ${outputFile}`);
