import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/economyData.json');

const economyData = new Map();

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => economyData.set(key, value));
        }
    } catch (error) {
        console.error('Error loading economy data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(economyData), null, 2));
    } catch (error) {
        console.error('Error saving economy data:', error);
    }
}

load();

function makeKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

// 🏅 Urutan tingkat (rank) buat sistem upgrade senjata & pickaxe
export const TIER_RANK = { kayu: 1, besi: 2, emas: 3, berlian: 4 };

export function defaultUser() {
    return {
        money: 0,
        hp: 100,
        maxHp: 100,
        weapons: {
            pedang: null,   // 'kayu' | 'besi' | 'emas' | 'berlian' | null
            pickaxe: null,  // 'kayu' | 'besi' | 'emas' | 'berlian' | null
            busur: false,   // true/false
        },
        arrows: 0,
        potions: {
            heal: 0,
        },
    };
}

export function getUser(guildId, userId) {
    const key = makeKey(guildId, userId);
    if (!economyData.has(key)) {
        economyData.set(key, defaultUser());
        save();
    }
    // Jaga-jaga kalau ada field baru yang belum ada di data lama
    const data = economyData.get(key);
    const merged = { ...defaultUser(), ...data, weapons: { ...defaultUser().weapons, ...(data.weapons || {}) }, potions: { ...defaultUser().potions, ...(data.potions || {}) } };
    economyData.set(key, merged);
    return merged;
}

export function setUser(guildId, userId, data) {
    economyData.set(makeKey(guildId, userId), data);
    save();
}

export function addMoney(guildId, userId, amount) {
    const user = getUser(guildId, userId);
    user.money = Math.max(0, user.money + amount);
    setUser(guildId, userId, user);
    return user;
}

export function removeMoney(guildId, userId, amount) {
    const user = getUser(guildId, userId);
    if (user.money < amount) return false;
    user.money -= amount;
    setUser(guildId, userId, user);
    return true;
}

export function heal(guildId, userId, amount) {
    const user = getUser(guildId, userId);
    user.hp = Math.min(user.maxHp, user.hp + amount);
    setUser(guildId, userId, user);
    return user;
}

export function damage(guildId, userId, amount) {
    const user = getUser(guildId, userId);
    user.hp = Math.max(0, user.hp - amount);
    setUser(guildId, userId, user);
    return user;
}
