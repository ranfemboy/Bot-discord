import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'premiumUsers.json');

// 📦 Struktur 1 entry: { userId, lifetime, expiresAt, addedBy, addedAt }
let users = [];
let loaded = false;

function ensureDataDir() {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadData() {
    if (loaded) return;
    ensureDataDir();

    if (fs.existsSync(DATA_PATH)) {
        try {
            users = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        } catch {
            users = [];
        }
    } else {
        users = [];
        saveData();
    }

    loaded = true;
}

function saveData() {
    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2));
}

/** Tambah/perpanjang premium. durasi = jumlah hari (angka) atau 'lifetime' untuk permanen */
export function addPremium(userId, durasi, addedBy) {
    loadData();

    let entry = users.find((u) => u.userId === userId);
    const isLifetime = String(durasi).toLowerCase() === 'lifetime';

    if (!entry) {
        entry = { userId, lifetime: false, expiresAt: null, addedBy, addedAt: Date.now() };
        users.push(entry);
    }

    if (isLifetime) {
        entry.lifetime = true;
        entry.expiresAt = null;
    } else {
        const jumlahHari = parseInt(durasi, 10);
        const durationMs = jumlahHari * 24 * 60 * 60 * 1000;
        const base = (entry.expiresAt && entry.expiresAt > Date.now()) ? entry.expiresAt : Date.now();
        entry.lifetime = false;
        entry.expiresAt = base + durationMs;
    }

    entry.addedBy = addedBy;
    entry.addedAt = Date.now();
    saveData();
    return entry;
}

/** Cek apakah user masih premium aktif (lifetime ATAU belum expired) */
export function isUserPremium(userId) {
    loadData();
    const entry = users.find((u) => u.userId === userId);
    if (!entry) return false;
    if (entry.lifetime) return true;
    if (entry.expiresAt && entry.expiresAt > Date.now()) return true;
    return false;
}

/** Ambil detail premium 1 user (buat nampilin sisa waktu, dll) */
export function getPremiumInfo(userId) {
    loadData();
    const entry = users.find((u) => u.userId === userId);
    if (!entry) return null;
    if (!entry.lifetime && entry.expiresAt && entry.expiresAt <= Date.now()) return null;
    return entry;
}

/** Hapus premium user */
export function removePremium(userId) {
    loadData();
    const before = users.length;
    users = users.filter((u) => u.userId !== userId);
    saveData();
    return users.length < before;
}

/** Ambil semua user premium yang masih aktif (buat listing) */
export function getAllPremium() {
    loadData();
    return users.filter((u) => u.lifetime || (u.expiresAt && u.expiresAt > Date.now()));
}