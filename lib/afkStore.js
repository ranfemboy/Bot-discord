import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 💤 Store untuk fitur .afk — dikonversi dari source code (global.afkStorage
// Map di WA) jadi persisted JSON file, pola sama kayak lib/economyStore.js,
// supaya status AFK gak hilang kalau bot restart. Global per-user (bukan
// per-guild), sama seperti behavior aslinya.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/afkData.json');

let afkData = {};

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            afkData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading afk data:', error);
        afkData = {};
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(afkData, null, 2));
    } catch (error) {
        console.error('Error saving afk data:', error);
    }
}

load();

export function getAfkUser(userId) {
    return afkData[userId] || null;
}

export function setAfkUser(userId, reason) {
    afkData[userId] = { reason: reason || 'Tidak ada alasan', time: Date.now() };
    save();
}

export function removeAfkUser(userId) {
    if (!afkData[userId]) return false;
    delete afkData[userId];
    save();
    return true;
}

export function isUserAfk(userId) {
    return Boolean(afkData[userId]);
}

export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours} jam ${minutes % 60} menit`;
    if (minutes > 0) return `${minutes} menit ${seconds % 60} detik`;
    return `${seconds} detik`;
}
