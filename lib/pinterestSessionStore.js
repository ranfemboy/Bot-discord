import { randomUUID } from 'crypto';

export const PAGE_SIZE = 10; // batas maksimal attachment/embed image per pesan Discord
const SESSION_EXPIRY_MS = 10 * 60 * 1000; // 10 menit

// sessionId -> { query, items, page, ownerId, expireTimer }
const sessions = new Map();

function scheduleExpiry(sessionId) {
    const s = sessions.get(sessionId);
    if (!s) return;
    if (s.expireTimer) clearTimeout(s.expireTimer);
    s.expireTimer = setTimeout(() => sessions.delete(sessionId), SESSION_EXPIRY_MS);
}

/** Bikin session baru buat 1 hasil pencarian Pinterest */
export function createSession({ query, items, ownerId }) {
    const sessionId = randomUUID().slice(0, 8);
    sessions.set(sessionId, { query, items, page: 0, ownerId });
    scheduleExpiry(sessionId);
    return sessionId;
}

export function getSession(sessionId) {
    return sessions.get(sessionId) ?? null;
}

/** Ambil item-item di halaman sekarang + info pagination */
export function getPageItems(sessionId) {
    const s = sessions.get(sessionId);
    if (!s) return null;

    const start = s.page * PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(s.items.length / PAGE_SIZE));

    return {
        items: s.items.slice(start, start + PAGE_SIZE),
        page: s.page,
        totalPages,
        hasNext: s.page + 1 < totalPages,
    };
}

/** Pindah ke halaman berikutnya, balikin data halaman yang baru */
export function goToNextPage(sessionId) {
    const s = sessions.get(sessionId);
    if (!s) return null;

    const totalPages = Math.ceil(s.items.length / PAGE_SIZE);
    if (s.page + 1 < totalPages) s.page += 1;

    scheduleExpiry(sessionId);
    return getPageItems(sessionId);
}

export function deleteSession(sessionId) {
    const s = sessions.get(sessionId);
    if (s?.expireTimer) clearTimeout(s.expireTimer);
    sessions.delete(sessionId);
}