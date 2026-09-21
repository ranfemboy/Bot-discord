import { randomUUID } from 'crypto';

const SESSION_EXPIRY_MS = 10 * 60 * 1000; // 10 menit

// sessionId -> { ownerId, guildId, expireTimer }
const sessions = new Map();

function scheduleExpiry(sessionId) {
    const s = sessions.get(sessionId);
    if (!s) return;
    if (s.expireTimer) clearTimeout(s.expireTimer);
    s.expireTimer = setTimeout(() => sessions.delete(sessionId), SESSION_EXPIRY_MS);
}

export function createSession({ ownerId, guildId }) {
    const sessionId = randomUUID().slice(0, 8);
    sessions.set(sessionId, { ownerId, guildId });
    scheduleExpiry(sessionId);
    return sessionId;
}

export function getSession(sessionId) {
    return sessions.get(sessionId) ?? null;
}

export function refreshSession(sessionId) {
    scheduleExpiry(sessionId);
}

export function deleteSession(sessionId) {
    const s = sessions.get(sessionId);
    if (s?.expireTimer) clearTimeout(s.expireTimer);
    sessions.delete(sessionId);
}
