import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ⚠️ Store untuk fitur .warn, dipindah ke lib/ + pakai path absolut (pola sama
// kayak lib/afkStore.js) biar gak gantung ke current working directory pas bot dijalankan.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/warnStore.json');

let warnings = {};

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            warnings = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading warnings:', error);
        warnings = {};
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(warnings, null, 2));
    } catch (error) {
        console.error('Error saving warnings:', error);
    }
}

load();

export function getUserWarnings(guildId, userId) {
    const key = `${guildId}_${userId}`;
    return warnings[key]?.count || 0;
}

export function addWarning(guildId, userId, reason = 'Tidak ada alasan') {
    const key = `${guildId}_${userId}`;

    if (!warnings[key]) {
        warnings[key] = { count: 0, history: [] };
    }

    warnings[key].count += 1;
    warnings[key].history.push({ timestamp: Date.now(), reason });

    save();
    return warnings[key].count;
}

export function clearWarnings(guildId, userId) {
    const key = `${guildId}_${userId}`;
    delete warnings[key];
    save();
}

export function getWarningMessage(count) {
    if (count === 1) return '⚠️ Ini adalah warning pertama kamu. Perhatikan perilakumu!';
    if (count === 2) return '🔴 Ini adalah warning kedua kamu. Kamu akan di-timeout 1 jam!';
    return '🚫 Ini adalah warning ketiga. Kamu akan di-kick dari server!';
}
