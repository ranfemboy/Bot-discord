import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 💘 Store untuk fitur .tembak / .terima / .tolak
// Pola penyimpanan mengikuti lib/economyStore.js (Map + JSON file di /data)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/coupleData.json');

const coupleData = new Map();

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => coupleData.set(key, value));
        }
    } catch (error) {
        console.error('Error loading couple data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(coupleData), null, 2));
    } catch (error) {
        console.error('Error saving couple data:', error);
    }
}

load();

function makeKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

function defaultUser() {
    return {
        pasangan: null,       // userId pasangan sekarang (kalau ada)
        tembakTarget: null,   // userId yang lagi ditembak sama user ini (menunggu jawaban)
        jadiPacar: null,      // timestamp jadi pacar
        tembakCount: 0,
        terimaCount: 0,
        ditolakCount: 0,
        putusCount: 0,
    };
}

export function getUser(guildId, userId) {
    const key = makeKey(guildId, userId);
    if (!coupleData.has(key)) {
        coupleData.set(key, defaultUser());
        save();
    }
    const merged = { ...defaultUser(), ...coupleData.get(key) };
    coupleData.set(key, merged);
    return merged;
}

export function setUser(guildId, userId, data) {
    coupleData.set(makeKey(guildId, userId), data);
    save();
}

// ⏳ Sesi tembakan aktif (in-memory saja, sengaja gak di-persist ke file
// karena sifatnya sementara/expire dalam 1 jam)
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 jam
const activeSessions = new Map(); // key: `${guildId}_${channelId}_${targetId}` -> { shooterId, targetId, guildId, channelId, timestamp }

function sessionKey(guildId, channelId, targetId) {
    return `${guildId}_${channelId}_${targetId}`;
}

export function createTembakSession(guildId, channelId, shooterId, targetId) {
    const key = sessionKey(guildId, channelId, targetId);
    const session = { shooterId, targetId, guildId, channelId, timestamp: Date.now() };
    activeSessions.set(key, session);
    return session;
}

// 🔎 Cari sesi tembakan yang lagi nunggu jawaban dari `targetId` di channel ini
export function findSessionForTarget(guildId, channelId, targetId) {
    const key = sessionKey(guildId, channelId, targetId);
    const session = activeSessions.get(key);
    if (!session) return null;
    if (Date.now() - session.timestamp > SESSION_TIMEOUT_MS) {
        activeSessions.delete(key);
        return null;
    }
    return session;
}

export function deleteSession(guildId, channelId, targetId) {
    activeSessions.delete(sessionKey(guildId, channelId, targetId));
}
