import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'botChannels.json');

// 📦 Struktur: { "guildId": { allowed: [...], blocked: [...] } }
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
        try {
            data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        } catch {
            data = {};
        }
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
    if (!data[guildId]) data[guildId] = { allowed: [], blocked: [] };
    if (!data[guildId].allowed) data[guildId].allowed = [];
    if (!data[guildId].blocked) data[guildId].blocked = [];
    return data[guildId];
}

/** Ambil daftar channel yang di-allow (array kosong = gak ada batasan whitelist) */
export function getAllowedChannels(guildId) {
    loadData();
    const guild = ensureGuild(guildId);
    return Array.isArray(guild.allowed) ? guild.allowed : [];
}

/** Ambil daftar channel yang di-block */
export function getBlockedChannels(guildId) {
    loadData();
    const guild = ensureGuild(guildId);
    return Array.isArray(guild.blocked) ? guild.blocked : [];
}

/** Cek apakah bot boleh dipakai di channel ini (block selalu menang duluan) */
export function isChannelAllowed(guildId, channelId) {
    loadData();
    const guildData = ensureGuild(guildId);
    
    // Pastikan blocked dan allowed adalah array
    const blocked = Array.isArray(guildData.blocked) ? guildData.blocked : [];
    const allowed = Array.isArray(guildData.allowed) ? guildData.allowed : [];

    if (blocked.includes(channelId)) return false; // di-block = selalu ditolak

    if (allowed.length === 0) return true; // gak ada whitelist = bebas (asal gak di-block)

    return allowed.includes(channelId); // ada whitelist = harus ada di daftar itu
}

export function addAllowed(guildId, channelId) {
    loadData();
    const g = ensureGuild(guildId);
    if (!g.allowed.includes(channelId)) g.allowed.push(channelId);
    saveData();
}

export function removeAllowed(guildId, channelId) {
    loadData();
    const g = ensureGuild(guildId);
    g.allowed = g.allowed.filter((id) => id !== channelId);
    saveData();
}

export function addBlocked(guildId, channelId) {
    loadData();
    const g = ensureGuild(guildId);
    if (!g.blocked.includes(channelId)) g.blocked.push(channelId);
    saveData();
}

export function removeBlocked(guildId, channelId) {
    loadData();
    const g = ensureGuild(guildId);
    g.blocked = g.blocked.filter((id) => id !== channelId);
    saveData();
}

export function resetChannels(guildId) {
    loadData();
    delete data[guildId];
    saveData();
}
