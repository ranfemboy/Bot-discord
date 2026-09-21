import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/husbuStore.json');

const husbuData = new Map();

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => husbuData.set(key, value));
        }
    } catch (error) {
        console.error('Error loading husbu data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(husbuData), null, 2));
    } catch (error) {
        console.error('Error saving husbu data:', error);
    }
}

load();

function makeKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

export function defaultUser() {
    return {
        collection: [], // 📦 semua husbu hasil gacha
        suami: null,    // 🤵 husbu yang lagi dinikahi (salah satu dari collection)
    };
}

export function getUser(guildId, userId) {
    const key = makeKey(guildId, userId);
    if (!husbuData.has(key)) {
        husbuData.set(key, defaultUser());
        save();
    }
    const data = husbuData.get(key);
    const merged = { ...defaultUser(), ...data };
    husbuData.set(key, merged);
    return merged;
}

export function setUser(guildId, userId, data) {
    husbuData.set(makeKey(guildId, userId), data);
    save();
}

export function addHusbuToCollection(guildId, userId, husbu) {
    const user = getUser(guildId, userId);
    user.collection.push(husbu);
    setUser(guildId, userId, user);
    return user;
}

// Buang husbu terakhir di koleksi (dipakai waktu tombol Skip ditekan)
export function removeLastFromCollection(guildId, userId) {
    const user = getUser(guildId, userId);
    const removed = user.collection.pop();
    setUser(guildId, userId, user);
    return removed;
}

export function setSuami(guildId, userId, husbu) {
    const user = getUser(guildId, userId);
    user.suami = { ...husbu, marriedAt: Date.now() };
    setUser(guildId, userId, user);
    return user.suami;
}

export function clearSuami(guildId, userId) {
    const user = getUser(guildId, userId);
    user.suami = null;
    setUser(guildId, userId, user);
}

// 💞 Nambahin affection + total kencan/hadiah ke suami yang lagi dinikahi.
// Dipakai sama .kencanhusbu & .hadiahhusbu.
export function updateSuamiStats(guildId, userId, { affectionDelta = 0, dateDelta = 0, giftDelta = 0 } = {}) {
    const user = getUser(guildId, userId);
    if (!user.suami) return null;
    user.suami.affection = (user.suami.affection || 0) + affectionDelta;
    user.suami.totalDate = (user.suami.totalDate || 0) + dateDelta;
    user.suami.totalGift = (user.suami.totalGift || 0) + giftDelta;
    setUser(guildId, userId, user);
    return user.suami;
}

// 🔒 REGISTRY EKSKLUSIVITAS HUSBU (versi cowok dari waifuStore.js)
function marriageKey(guildId, husbuName) {
    return `marriage:${guildId}:${husbuName.toLowerCase()}`;
}

/** Cari siapa pemilik sah husbu ini di server tsb. Return { userId, marriedAt } atau null. */
export function getHusbuOwner(guildId, husbuName) {
    const key = marriageKey(guildId, husbuName);
    if (husbuData.has(key)) return husbuData.get(key);

    // 🔄 Fallback buat data lama (nikah sebelum fitur exclusivity ini ada)
    const prefix = `${guildId}-`;
    for (const [k, v] of husbuData.entries()) {
        if (k.startsWith(prefix) && v?.suami?.name?.toLowerCase() === husbuName.toLowerCase()) {
            const userId = k.slice(prefix.length);
            const owner = { userId, marriedAt: v.suami.marriedAt || Date.now() };
            husbuData.set(key, owner);
            save();
            return owner;
        }
    }
    return null;
}

/** Daftarin husbu ini sebagai "milik" userId di server tsb. */
export function registerHusbuMarriage(guildId, husbuName, userId) {
    husbuData.set(marriageKey(guildId, husbuName), { userId, marriedAt: Date.now() });
    save();
}

/** Lepas kepemilikan husbu ini (dipanggil pas cerai). */
export function releaseHusbuMarriage(guildId, husbuName) {
    husbuData.delete(marriageKey(guildId, husbuName));
    save();
}
