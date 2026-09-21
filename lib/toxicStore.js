import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'toxicSettings.json');

// 📦 Struktur: { "guildId": { enabled: true, words: ["kata1", "kata2"] } }
let data = {};
let loaded = false;

function ensureDataDir() {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadData() {
    if (loaded) return;
    ensureDataDir();
    if (fs.existsSync(DATA_PATH)) {
        try { data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')); } catch { data = {}; }
    } else {
        data = {};
        saveData();
    }
    loaded = true;
}

function saveData() {
    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function ensureGuild(guildId) {
    if (!data[guildId]) data[guildId] = { enabled: true, words: [] };
    if (data[guildId].enabled === undefined) data[guildId].enabled = true;
    if (!data[guildId].words) data[guildId].words = [];
    return data[guildId];
}

/** Default TRUE kalau belum pernah di-set (biar behavior lama tetep jalan) */
export function isToxicFilterEnabled(guildId) {
    loadData();
    return data[guildId]?.enabled !== false;
}

export function setToxicFilterEnabled(guildId, enabled) {
    loadData();
    ensureGuild(guildId).enabled = enabled;
    saveData();
}

export function getCustomWords(guildId) {
    loadData();
    return data[guildId]?.words || [];
}

export function addCustomWord(guildId, word) {
    loadData();
    const g = ensureGuild(guildId);
    const normalized = word.toLowerCase().trim();
    if (!g.words.includes(normalized)) g.words.push(normalized);
    saveData();
    return g.words;
}