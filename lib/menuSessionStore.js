import { randomUUID } from 'crypto';

const SESSION_EXPIRY_MS = 10 * 60 * 1000; // 10 menit

// sessionId -> { categories, ownerId, expireTimer }
const sessions = new Map();

function scheduleExpiry(sessionId) {
    const s = sessions.get(sessionId);
    if (!s) return;
    if (s.expireTimer) clearTimeout(s.expireTimer);
    s.expireTimer = setTimeout(() => sessions.delete(sessionId), SESSION_EXPIRY_MS);
}

/** Bikin session menu baru. `categories` = { namaKategori: [pluginConfig, ...] } */
export function createMenuSession({ categories, ownerId }) {
    const sessionId = randomUUID().slice(0, 8);
    sessions.set(sessionId, { categories, ownerId });
    scheduleExpiry(sessionId);
    return sessionId;
}

export function getMenuSession(sessionId) {
    const s = sessions.get(sessionId);
    if (s) scheduleExpiry(sessionId); // sekalian refresh masa aktif tiap dipakai
    return s ?? null;
}
