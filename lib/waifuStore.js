import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/waifuStore.json');

const waifuData = new Map();

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => waifuData.set(key, value));
        }
    } catch (error) {
        console.error('Error loading waifu data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(waifuData), null, 2));
    } catch (error) {
        console.error('Error saving waifu data:', error);
    }
}

load();

function makeKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

export function defaultUser() {
    return {
        collection: [], // 📦 semua waifu hasil gacha
        istri: null,    // ❤️ waifu yang lagi dinikahi (salah satu dari collection)
    };
}

export function getUser(guildId, userId) {
    const key = makeKey(guildId, userId);
    if (!waifuData.has(key)) {
        waifuData.set(key, defaultUser());
        save();
    }
    // Jaga-jaga kalau ada field baru yang belum ada di data lama
    const data = waifuData.get(key);
    const merged = { ...defaultUser(), ...data };
    waifuData.set(key, merged);
    return merged;
}

export function setUser(guildId, userId, data) {
    waifuData.set(makeKey(guildId, userId), data);
    save();
}

export function addWaifuToCollection(guildId, userId, waifu) {
    const user = getUser(guildId, userId);
    user.collection.push(waifu);
    setUser(guildId, userId, user);
    return user;
}

// Buang waifu terakhir di koleksi (dipakai waktu tombol Skip ditekan)
export function removeLastFromCollection(guildId, userId) {
    const user = getUser(guildId, userId);
    const removed = user.collection.pop();
    setUser(guildId, userId, user);
    return removed;
}

export function setIstri(guildId, userId, waifu) {
    const user = getUser(guildId, userId);
    user.istri = { ...waifu, marriedAt: Date.now() };
    setUser(guildId, userId, user);
    return user.istri;
}

export function clearIstri(guildId, userId) {
    const user = getUser(guildId, userId);
    user.istri = null;
    setUser(guildId, userId, user);
}

// 💞 Nambahin affection + total kencan/hadiah ke istri yang lagi dinikahi.
// Dipakai sama .kencanwaifu & .hadiahwaifu.
export function updateIstriStats(guildId, userId, { affectionDelta = 0, dateDelta = 0, giftDelta = 0 } = {}) {
    const user = getUser(guildId, userId);
    if (!user.istri) return null;
    user.istri.affection = (user.istri.affection || 0) + affectionDelta;
    user.istri.totalDate = (user.istri.totalDate || 0) + dateDelta;
    user.istri.totalGift = (user.istri.totalGift || 0) + giftDelta;
    setUser(guildId, userId, user);
    return user.istri;
}

// 🔒 REGISTRY EKSKLUSIVITAS WAIFU
// -------------------------------
// Satu waifu (berdasarkan nama, per-server) cuma boleh dinikahi 1 orang dalam
// waktu bersamaan. Disimpan di Map yang sama (`waifuData`) pakai key khusus
// `marriage:<guildId>:<namaWaifuLowercase>` biar ikut ke-save ke file JSON yang
// sama tanpa perlu file baru. Key ini gak akan pernah tabrakan sama key user
// biasa (`${guildId}-${userId}`) karena guildId/userId Discord isinya cuma angka.
function marriageKey(guildId, waifuName) {
    return `marriage:${guildId}:${waifuName.toLowerCase()}`;
}

/** Cari siapa pemilik sah waifu ini di server tsb. Return { userId, marriedAt } atau null. */
export function getWaifuOwner(guildId, waifuName) {
    const key = marriageKey(guildId, waifuName);
    if (waifuData.has(key)) return waifuData.get(key);

    // 🔄 Fallback buat data lama (nikah sebelum fitur exclusivity ini ada):
    // scan semua user di guild ini, kalau ketemu yang udah nikah sama waifu
    // ini, langsung didaftarkan ke registry biar konsisten ke depannya.
    const prefix = `${guildId}-`;
    for (const [k, v] of waifuData.entries()) {
        if (k.startsWith(prefix) && v?.istri?.name?.toLowerCase() === waifuName.toLowerCase()) {
            const userId = k.slice(prefix.length);
            const owner = { userId, marriedAt: v.istri.marriedAt || Date.now() };
            waifuData.set(key, owner);
            save();
            return owner;
        }
    }
    return null;
}

/** Daftarin waifu ini sebagai "milik" userId di server tsb. */
export function registerWaifuMarriage(guildId, waifuName, userId) {
    waifuData.set(marriageKey(guildId, waifuName), { userId, marriedAt: Date.now() });
    save();
}

/** Lepas kepemilikan waifu ini (dipanggil pas cerai). */
export function releaseWaifuMarriage(guildId, waifuName) {
    waifuData.delete(marriageKey(guildId, waifuName));
    save();
}
