import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/levelRoles.json');

// 📦 Struktur: { "guildId": { "level": "roleId" } }
// Reward role dikasih pas user nyampe TEPAT di level itu (bukan akumulatif/nested).
let data = {};

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading level roles:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving level roles:', error);
    }
}

load();

export function setLevelRole(guildId, level, roleId) {
    if (!data[guildId]) data[guildId] = {};
    data[guildId][level] = roleId;
    save();
}

export function removeLevelRole(guildId, level) {
    if (!data[guildId] || !data[guildId][level]) return false;
    delete data[guildId][level];
    save();
    return true;
}

/** 🎁 Role reward buat level TERTENTU (exact match), null kalau gak ada yang di-setting */
export function getRoleForLevel(guildId, level) {
    return data[guildId]?.[level] || null;
}

/** 📋 List semua level->role reward di 1 server, urut dari level terkecil */
export function getGuildLevelRoles(guildId) {
    const guildData = data[guildId] || {};
    return Object.entries(guildData)
        .map(([level, roleId]) => ({ level: parseInt(level, 10), roleId }))
        .sort((a, b) => a.level - b.level);
}