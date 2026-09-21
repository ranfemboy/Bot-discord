import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🏷️ Store untuk fitur .cap (cap.txt) — julukan otomatis per-user per-guild.
// Format nyimpen: capData[guildId][targetUserId] = { label, setBy, setAt }
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/capData.json');

let capData = {};

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            capData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading cap data:', error);
        capData = {};
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(capData, null, 2));
    } catch (error) {
        console.error('Error saving cap data:', error);
    }
}

load();

export function setCap(guildId, userId, label, setBy) {
    if (!capData[guildId]) capData[guildId] = {};
    capData[guildId][userId] = { label, setBy, setAt: Date.now() };
    save();
}

export function getCap(guildId, userId) {
    return capData[guildId]?.[userId] || null;
}

export function removeCap(guildId, userId) {
    if (!capData[guildId]?.[userId]) return false;
    delete capData[guildId][userId];
    save();
    return true;
}

// 📋 Daftar semua cap yang aktif di 1 guild -> [{ userId, label, setBy, setAt }]
export function listCaps(guildId) {
    const entries = capData[guildId] || {};
    return Object.entries(entries).map(([userId, data]) => ({ userId, ...data }));
}
