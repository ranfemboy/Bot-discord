/**
 * Custom Waifu Store
 * -----------------------------
 * Tempat nyimpen waifu yang ditambahin owner lewat .addwaifu, TANPA perlu
 * buka/edit lib/waifuData.js manual. Disimpan persisten di
 * data/customWaifuList.json, terus digabung otomatis sama waifuList bawaan
 * lewat getCombinedWaifuPool() / rollWaifuCombined().
 *
 * ⚠️ SETUP SEKALI DOANG:
 * Di plugin gacha kamu (misal plugins/gacha/gachawaifu.js), ganti:
 *     import { rollWaifu } from '../../lib/waifuData.js';
 * jadi:
 *     import { rollWaifuCombined as rollWaifu } from '../../lib/customWaifuStore.js';
 * Setelah itu, waifu baru dari .addwaifu bakal otomatis ikut kegacha. Gak
 * perlu ngulang setup ini lagi tiap nambah waifu baru.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { waifuList } from './waifuData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/customWaifuList.json');

export const RARITIES = ['COMMON', 'EPIC', 'LEGENDARY'];

let customList = [];

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            customList = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading custom waifu list:', error);
        customList = [];
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(customList, null, 2));
    } catch (error) {
        console.error('Error saving custom waifu list:', error);
    }
}

load();

/** Semua waifu tambahan yang didaftarin lewat .addwaifu */
export function getCustomWaifuList() {
    return customList;
}

/** Cari waifu (nama) di pool bawaan MAUPUN pool custom. Return object atau null. */
export function findWaifuByName(name) {
    const target = name.toLowerCase();
    return (
        waifuList.find((w) => w.name.toLowerCase() === target) ||
        customList.find((w) => w.name.toLowerCase() === target) ||
        null
    );
}

/** Nambahin waifu baru ke pool custom (dipanggil sama .addwaifu). */
export function addCustomWaifu({ name, anime, rarity }) {
    const entry = { name: name.trim(), anime: anime.trim(), rarity: rarity.toUpperCase() };
    customList.push(entry);
    save();
    return entry;
}

/** Hapus waifu dari pool custom (buat .delwaifu kalau nanti dibutuhin). */
export function removeCustomWaifu(name) {
    const target = name.toLowerCase();
    const idx = customList.findIndex((w) => w.name.toLowerCase() === target);
    if (idx === -1) return false;
    customList.splice(idx, 1);
    save();
    return true;
}

/** Gabungan pool bawaan (waifuData.js) + pool custom (.addwaifu). */
export function getCombinedWaifuPool() {
    return [...waifuList, ...customList];
}

/**
 * Sama kayak rollWaifu() bawaan, tapi ngambil dari pool gabungan.
 * Pakai ini di plugin .gachawaifu biar waifu hasil .addwaifu ikut kegacha.
 */
export function rollWaifuCombined() {
    const pool = getCombinedWaifuPool();
    const chance = Math.random();
    const rarity = chance <= 0.05 ? 'LEGENDARY' : chance <= 0.3 ? 'EPIC' : 'COMMON';

    const filtered = pool.filter((w) => w.rarity === rarity);
    const source = filtered.length ? filtered : pool;
    const picked = source[Math.floor(Math.random() * source.length)];

    return {
        name: picked.name,
        anime: picked.anime,
        rarity: picked.rarity,
        affection: 0,
        marriedAt: null,
        totalDate: 0,
        totalGift: 0,
    };
}
