import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'levelStore.json');

// 📦 Struktur data: { [guildId]: { [userId]: { xp, lastMessage } } }
let store = {};
let loaded = false;

function ensureDataDir() {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadData() {
    if (loaded) return;
    ensureDataDir();
    if (fs.existsSync(DATA_PATH)) {
        try {
            store = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        } catch {
            store = {};
        }
    }
    loaded = true;
}

function saveData() {
    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2));
}

// 📈 Rumus level: makin tinggi level, makin banyak XP yang dibutuhin
// XP dibutuhin buat naik ke level N = 50 * N^2 + 50 * N
function xpForLevel(level) {
    return 50 * level * level + 50 * level;
}

/**
 * Hitung level berdasarkan total XP.
 * Dipakai di leveling.js: calculateLevel(data.xp).level
 * Dipakai di leaderboard.js: calculateLevel(entry.xp).level
 */
export function calculateLevel(xp) {
    let level = 0;
    while (xp >= xpForLevel(level + 1)) level++;

    const currentLevelXp = xpForLevel(level);
    const nextLevelXp = xpForLevel(level + 1);

    return {
        level,
        xp,
        currentLevelXp,
        nextLevelXp,
        xpToNextLevel: nextLevelXp - xp,
    };
}

/**
 * Ambil data XP 1 user di 1 server. Kalau belum pernah chat, balikin data kosong.
 * Dipakai di leveling.js: getUserData(m.guild.id, m.author.id)
 */
export function getUserData(guildId, userId) {
    loadData();
    if (!store[guildId]) store[guildId] = {};
    if (!store[guildId][userId]) {
        store[guildId][userId] = { xp: 0, lastMessage: 0 };
    }
    return store[guildId][userId];
}

/**
 * Simpen data XP 1 user di 1 server.
 * Dipakai di leveling.js: setUserData(m.guild.id, m.author.id, data)
 */
export function setUserData(guildId, userId, data) {
    loadData();
    if (!store[guildId]) store[guildId] = {};
    store[guildId][userId] = data;
    saveData();
}

/**
 * Ambil leaderboard 1 server, urut dari XP tertinggi.
 * Dipakai di leaderboard.js: getGuildLeaderboard(m.guild.id).slice(0, 10)
 */
export function getGuildLeaderboard(guildId) {
    loadData();
    const guildData = store[guildId] ?? {};

    return Object.entries(guildData)
        .map(([userId, data]) => ({ userId, xp: data.xp ?? 0, lastMessage: data.lastMessage ?? 0 }))
        .sort((a, b) => b.xp - a.xp);
}
