import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isExtraOwner } from './ownerStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/lockData.json');

// 📦 Struktur:
// {
//   bot: { locked: false, reason: null, lockedBy: null, lockedAt: null },
//   features: { "<namaFitur lowercase>": { reason, lockedBy, lockedAt } }
// }
let state = { bot: { locked: false, reason: null, lockedBy: null, lockedAt: null }, features: {} };

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            state = {
                bot: raw.bot || { locked: false, reason: null, lockedBy: null, lockedAt: null },
                features: raw.features || {},
            };
        }
    } catch (error) {
        console.error('Error loading lock data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(state, null, 2));
    } catch (error) {
        console.error('Error saving lock data:', error);
    }
}

load();

// ===== Bot-wide lock =====
export function isBotLocked() {
    return !!state.bot.locked;
}

export function getBotLockInfo() {
    return state.bot;
}

export function lockBot(reason, byUserId) {
    state.bot = { locked: true, reason: reason || 'Tidak ada alasan', lockedBy: byUserId, lockedAt: Date.now() };
    save();
}

export function unlockBot() {
    const wasLocked = state.bot.locked;
    state.bot = { locked: false, reason: null, lockedBy: null, lockedAt: null };
    save();
    return wasLocked;
}

// ===== Per-feature lock =====
function normalize(name) {
    return (name || '').toLowerCase().trim();
}

export function isFeatureLocked(name) {
    return !!state.features[normalize(name)];
}

export function getFeatureLockInfo(name) {
    return state.features[normalize(name)] || null;
}

export function lockFeature(name, reason, byUserId) {
    state.features[normalize(name)] = { reason: reason || 'Tidak ada alasan', lockedBy: byUserId, lockedAt: Date.now() };
    save();
}

export function unlockFeature(name) {
    const key = normalize(name);
    if (!state.features[key]) return false;
    delete state.features[key];
    save();
    return true;
}

export function listLockedFeatures() {
    return state.features;
}

/**
 * 🔒 Cek apakah user boleh lewat lock (bot-wide atau per-fitur) buat menjalankan `config`.
 * Dipanggil dari messageHandler.js & slashAdapter.js biar prefix & slash command konsisten.
 * @returns {string|null} pesan penolakan (siap dikirim ke user), atau null kalau boleh lanjut.
 */
export function getLockDenyReason(config, userId, settings) {
    const isOwnerLevel = userId === settings.idOwner || isExtraOwner(userId);
    // 🔓 Owner (utama/tambahan) selalu bisa lewat, termasuk buat jalanin .lock / .unlock pas bot lagi dikunci.
    if (isOwnerLevel) return null;

    if (state.bot.locked) {
        return (
            `🔒 **BOT SEDANG DIKUNCI**\n\n` +
            `> Bot lagi gak bisa dipakai sementara oleh <@${state.bot.lockedBy}>.\n` +
            `> 📝 Alasan: ${state.bot.reason}`
        );
    }

    const lockInfo = state.features[normalize(config?.name)];
    if (lockInfo) {
        return (
            `🔒 **FITUR DIKUNCI**\n\n` +
            `> Fitur \`${config.name}\` sedang dikunci oleh <@${lockInfo.lockedBy}>.\n` +
            `> 📝 Alasan: ${lockInfo.reason}`
        );
    }

    return null;
}
