import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'levelConfig.json');

export const DEFAULT_MESSAGE = '🎉 Selamat {user}, kamu naik ke **Level {level}**! Terus aktif chat yah 🚀';

// guildId -> { channelId: string|null, message: string }
let configData = {};
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
            configData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        } catch {
            configData = {};
        }
    }
    loaded = true;
}

function saveData() {
    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(configData, null, 2));
}

/** Ambil config level-up buat 1 server. Kalau belum pernah di-set, balikin default. */
export function getGuildLevelConfig(guildId) {
    loadData();
    return configData[guildId] ?? { channelId: null, message: DEFAULT_MESSAGE };
}

/** Set channel tujuan notif level-up. channelId = null berarti balik kirim di channel chat biasa. */
export function setLevelChannel(guildId, channelId) {
    loadData();
    const current = getGuildLevelConfig(guildId);
    configData[guildId] = { ...current, channelId };
    saveData();
}

/** Set template pesan level-up. Placeholder yang didukung: {user}, {level} */
export function setLevelMessage(guildId, message) {
    loadData();
    const current = getGuildLevelConfig(guildId);
    configData[guildId] = { ...current, message };
    saveData();
}

/** Reset config server balik ke default (channel biasa + pesan bawaan) */
export function resetLevelConfig(guildId) {
    loadData();
    delete configData[guildId];
    saveData();
}

/** Ganti placeholder {user} dan {level} di template jadi nilai asli */
export function renderLevelMessage(template, { user, level }) {
    return template
        .replaceAll('{user}', user)
        .replaceAll('{level}', level);
}
