import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/wordleStats.json');

let stats = {};
const sessions = new Map(); // in-memory aja, gak perlu persist antar restart

function load() {
    try {
        if (fs.existsSync(dataPath)) stats = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (error) {
        console.error('Error loading wordle stats:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(stats, null, 2));
    } catch (error) {
        console.error('Error saving wordle stats:', error);
    }
}

load();

// 📖 Bank kata 5 huruf Bahasa Indonesia (kata umum sehari-hari)
export const WORD_LIST = [
    'rumah', 'gajah', 'domba', 'badak', 'lebah', 'semut', 'katak', 'udang', 'kursi', 'pintu',
    'dapur', 'kamar', 'mobil', 'motor', 'jaket', 'sabun', 'sikat', 'kasur', 'gelas', 'garpu',
    'pisau', 'panci', 'wajan', 'lampu', 'radio', 'kipas', 'kabel', 'gitar', 'piano', 'musik',
    'irama', 'drama', 'puisi', 'novel', 'komik', 'koran', 'surat', 'kartu', 'kunci', 'pagar',
    'pohon', 'bunga', 'jeruk', 'nanas', 'melon', 'tomat', 'bayam', 'kubis', 'beras', 'garam',
    'kecap', 'telur', 'donat', 'ombak', 'pasir', 'hutan', 'bukit', 'danau', 'sawah', 'kebun',
    'taman', 'hujan', 'petir', 'kilat', 'angin', 'bulan', 'roket', 'dunia', 'benua', 'jalan',
    'kapal', 'becak', 'taksi', 'balon', 'robot', 'catur', 'singa', 'macan', 'zebra', 'tikus',
    'elang', 'gagak', 'pipit', 'bebek', 'angsa', 'lalat', 'rayap', 'kecoa', 'besar', 'kecil',
    'lebar', 'berat', 'cepat', 'keras', 'lemas', 'panas', 'basah', 'kotor', 'indah', 'jelek',
    'bodoh', 'rajin', 'malas', 'ramah', 'galak', 'sabar', 'marah', 'sedih', 'takut', 'lemah',
    'sehat', 'sakit', 'lapar', 'capek', 'segar', 'manis', 'pahit', 'pedas', 'gurih', 'wangi',
    'busuk', 'gelap', 'ramai', 'damai', 'mudah', 'susah', 'murah', 'mahal', 'makan', 'minum',
];

function randomWord() {
    return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

export function startGame(userId) {
    const session = { word: randomWord(), guesses: [], maxGuesses: 6, finished: false, win: false };
    sessions.set(userId, session);
    return session;
}

export function getSession(userId) {
    return sessions.get(userId) || null;
}

// 🟩🟨⬛ Hitung feedback per huruf (2 pass, handle huruf dobel dengan benar)
export function evaluateGuess(guessWord, target) {
    const result = new Array(5).fill('absent');
    const targetChars = target.split('');
    const guessChars = guessWord.split('');
    const used = new Array(5).fill(false);

    for (let i = 0; i < 5; i++) {
        if (guessChars[i] === targetChars[i]) {
            result[i] = 'correct';
            used[i] = true;
        }
    }
    for (let i = 0; i < 5; i++) {
        if (result[i] === 'correct') continue;
        const idx = targetChars.findIndex((c, j) => c === guessChars[i] && !used[j]);
        if (idx !== -1) {
            result[i] = 'present';
            used[idx] = true;
        }
    }
    return result;
}

function recordStat(userId, win) {
    if (!stats[userId]) stats[userId] = { played: 0, wins: 0, losses: 0 };
    stats[userId].played += 1;
    if (win) stats[userId].wins += 1;
    else stats[userId].losses += 1;
    save();
}

export function submitGuess(userId, guessWord) {
    const session = getSession(userId);
    if (!session || session.finished) return null;

    const feedback = evaluateGuess(guessWord, session.word);
    session.guesses.push({ word: guessWord, feedback });

    if (guessWord === session.word) {
        session.finished = true;
        session.win = true;
        recordStat(userId, true);
    } else if (session.guesses.length >= session.maxGuesses) {
        session.finished = true;
        session.win = false;
        recordStat(userId, false);
    }

    return session;
}

export function giveUp(userId) {
    const session = getSession(userId);
    if (!session || session.finished) return null;
    session.finished = true;
    session.win = false;
    recordStat(userId, false);
    return session;
}

export function getStats(userId) {
    return stats[userId] || { played: 0, wins: 0, losses: 0 };
}
