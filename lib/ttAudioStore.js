import { randomUUID } from 'crypto';

const EXPIRY_MS = 10 * 60 * 1000; // 10 menit

// id -> { url, title, ownerId, expireTimer }
const sessions = new Map();

export function createTtAudioSession({ url, title, ownerId }) {
    const id = randomUUID().slice(0, 8);
    const expireTimer = setTimeout(() => sessions.delete(id), EXPIRY_MS);
    sessions.set(id, { url, title, ownerId, expireTimer });
    return id;
}

export function getTtAudioSession(id) {
    return sessions.get(id) ?? null;
}