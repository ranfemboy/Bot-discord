import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { POKEMON_LIST, statsAtLevel, EVOLUTION_MAP, EVOLUTION_COST } from './pokemonData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/pokemonUsers.json');

const store = new Map();

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => store.set(key, value));
        }
    } catch (error) {
        console.error('Error loading pokemon data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(store), null, 2));
    } catch (error) {
        console.error('Error saving pokemon data:', error);
    }
}

load();

function makeKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

// 🎁 Bonus daftar gratis
export const STARTER_BONUS = {
    pokeballs: { pokeball: 5 },
    coins: 3000,
};

function defaultAccount() {
    return {
        registered: false,
        name: null,
        age: null,
        gender: null, // 'cewek' | 'cowok'
        registeredAt: null,
        coins: 0,
        pokeballs: { pokeball: 0, greatball: 0, ultraball: 0, masterball: 0 },
        potions: { potion: 0, superpotion: 0 },
        pokemons: [],
        team: [], // array of uid, max 6, index 0 = lead
        pokemonSeq: 0,
    };
}

export function isRegistered(guildId, userId) {
    const key = makeKey(guildId, userId);
    const acc = store.get(key);
    return !!(acc && acc.registered);
}

export function getAccount(guildId, userId) {
    const key = makeKey(guildId, userId);
    if (!store.has(key)) {
        store.set(key, defaultAccount());
    }
    const merged = {
        ...defaultAccount(),
        ...store.get(key),
        pokeballs: { ...defaultAccount().pokeballs, ...(store.get(key).pokeballs || {}) },
        potions: { ...defaultAccount().potions, ...(store.get(key).potions || {}) },
    };
    store.set(key, merged);
    return merged;
}

export function setAccount(guildId, userId, data) {
    store.set(makeKey(guildId, userId), data);
    save();
}

export function registerAccount(guildId, userId, { name, age, gender }) {
    const acc = getAccount(guildId, userId);
    acc.registered = true;
    acc.name = name;
    acc.age = age;
    acc.gender = gender;
    acc.registeredAt = Date.now();
    acc.coins += STARTER_BONUS.coins;
    acc.pokeballs.pokeball += STARTER_BONUS.pokeballs.pokeball;
    setAccount(guildId, userId, acc);
    return acc;
}

export function addCoins(guildId, userId, amount) {
    const acc = getAccount(guildId, userId);
    acc.coins = Math.max(0, acc.coins + amount);
    setAccount(guildId, userId, acc);
    return acc;
}

export function removeCoins(guildId, userId, amount) {
    const acc = getAccount(guildId, userId);
    if (acc.coins < amount) return false;
    acc.coins -= amount;
    setAccount(guildId, userId, acc);
    return true;
}

export function addPokeball(guildId, userId, ballKey, qty) {
    const acc = getAccount(guildId, userId);
    acc.pokeballs[ballKey] = (acc.pokeballs[ballKey] || 0) + qty;
    setAccount(guildId, userId, acc);
    return acc;
}

export function removePokeball(guildId, userId, ballKey) {
    const acc = getAccount(guildId, userId);
    if (!acc.pokeballs[ballKey] || acc.pokeballs[ballKey] < 1) return false;
    acc.pokeballs[ballKey] -= 1;
    setAccount(guildId, userId, acc);
    return true;
}

export function addPotion(guildId, userId, potionKey, qty) {
    const acc = getAccount(guildId, userId);
    acc.potions[potionKey] = (acc.potions[potionKey] || 0) + qty;
    setAccount(guildId, userId, acc);
    return acc;
}

// 🆕 Tambahin pokemon baru ke koleksi user (hasil nangkap)
export function addPokemon(guildId, userId, speciesKey, level) {
    const acc = getAccount(guildId, userId);
    acc.pokemonSeq = (acc.pokemonSeq || 0) + 1;
    const uid = `p${acc.pokemonSeq}`;
    const species = POKEMON_LIST[speciesKey];
    const stats = statsAtLevel(species, level);

    const mon = {
        uid,
        key: speciesKey,
        nickname: null,
        level,
        exp: 0,
        currentHp: stats.maxHp,
        maxHp: stats.maxHp,
        caughtAt: Date.now(),
    };

    acc.pokemons.push(mon);
    if (acc.team.length < 6) acc.team.push(uid);
    setAccount(guildId, userId, acc);
    return mon;
}

export function getPokemon(guildId, userId, uid) {
    const acc = getAccount(guildId, userId);
    return acc.pokemons.find((p) => p.uid === uid) || null;
}

export function updatePokemon(guildId, userId, uid, patch) {
    const acc = getAccount(guildId, userId);
    const idx = acc.pokemons.findIndex((p) => p.uid === uid);
    if (idx === -1) return null;
    acc.pokemons[idx] = { ...acc.pokemons[idx], ...patch };
    setAccount(guildId, userId, acc);
    return acc.pokemons[idx];
}

export function removePokemon(guildId, userId, uid) {
    const acc = getAccount(guildId, userId);
    const idx = acc.pokemons.findIndex((p) => p.uid === uid);
    if (idx === -1) return null;
    const [removed] = acc.pokemons.splice(idx, 1);
    acc.team = acc.team.filter((id) => id !== uid);
    setAccount(guildId, userId, acc);
    return removed;
}

// 🏅 Ambil pokemon andalan (lead) — index pertama di team, fallback pokemon pertama
export function getLeadPokemon(guildId, userId) {
    const acc = getAccount(guildId, userId);
    if (!acc.pokemons.length) return null;
    const leadUid = acc.team[0];
    const lead = acc.pokemons.find((p) => p.uid === leadUid);
    return lead || acc.pokemons[0];
}

export function setTeam(guildId, userId, uids) {
    const acc = getAccount(guildId, userId);
    const valid = uids.filter((uid) => acc.pokemons.some((p) => p.uid === uid)).slice(0, 6);
    acc.team = valid;
    setAccount(guildId, userId, acc);
    return acc.team;
}

export function fullHealAll(guildId, userId) {
    const acc = getAccount(guildId, userId);
    acc.pokemons.forEach((p) => (p.currentHp = p.maxHp));
    setAccount(guildId, userId, acc);
    return acc;
}

// ============================================================
// ✨ EXP & LEVEL UP
// ============================================================
// 📈 EXP yang dibutuhkan buat naik dari `level` ke `level + 1`
export function expToNext(level) {
    return 50 + level * 35;
}

// 🆙 Tambahin exp ke 1 pokemon, otomatis naik level kalau exp cukup.
// Naik level -> stat dihitung ulang & HP dipulihkan penuh (bonus).
export function gainExp(guildId, userId, uid, amount) {
    const acc = getAccount(guildId, userId);
    const idx = acc.pokemons.findIndex((p) => p.uid === uid);
    if (idx === -1) return null;

    const mon = acc.pokemons[idx];
    const species = POKEMON_LIST[mon.key];
    let leveledUp = 0;

    mon.exp = (mon.exp || 0) + amount;
    let needed = expToNext(mon.level);
    while (mon.exp >= needed) {
        mon.exp -= needed;
        mon.level += 1;
        leveledUp += 1;
        needed = expToNext(mon.level);
    }

    if (leveledUp > 0) {
        const stats = statsAtLevel(species, mon.level);
        mon.maxHp = stats.maxHp;
        mon.currentHp = stats.maxHp; // bonus: full heal pas naik level
    }

    acc.pokemons[idx] = mon;
    setAccount(guildId, userId, acc);
    return { mon, leveledUp };
}

// ============================================================
// 🧪 HEAL PAKAI POTION
// ============================================================
export function healWithPotion(guildId, userId, uid, potionKey, healAmount) {
    const acc = getAccount(guildId, userId);
    if (!acc.potions[potionKey] || acc.potions[potionKey] < 1) return { ok: false, reason: 'no_potion' };

    const idx = acc.pokemons.findIndex((p) => p.uid === uid);
    if (idx === -1) return { ok: false, reason: 'not_found' };

    const mon = acc.pokemons[idx];
    if (mon.currentHp >= mon.maxHp) return { ok: false, reason: 'full_hp' };

    acc.potions[potionKey] -= 1;
    mon.currentHp = Math.min(mon.maxHp, mon.currentHp + healAmount);
    acc.pokemons[idx] = mon;
    setAccount(guildId, userId, acc);
    return { ok: true, mon, remainingPotion: acc.potions[potionKey] };
}

// ============================================================
// 💰 JUAL POKEMON
// ============================================================
export function sellPokemon(guildId, userId, uid, coinReward) {
    const removed = removePokemon(guildId, userId, uid);
    if (!removed) return null;
    return addCoins(guildId, userId, coinReward);
}

// ============================================================
// 🧬 EVOLUSI POKEMON — bayar EVOLUTION_COST coin
// ============================================================
export function evolvePokemon(guildId, userId, uid) {
    const acc = getAccount(guildId, userId);
    const idx = acc.pokemons.findIndex((p) => p.uid === uid);
    if (idx === -1) return { ok: false, reason: 'not_found' };

    const mon = acc.pokemons[idx];
    const oldSpecies = POKEMON_LIST[mon.key];
    const evo = EVOLUTION_MAP[mon.key];

    if (!evo) return { ok: false, reason: 'no_evolution' };
    if (mon.level < evo.minLevel) return { ok: false, reason: 'level_kurang', required: evo.minLevel };
    if (acc.coins < EVOLUTION_COST) return { ok: false, reason: 'coin_kurang', required: EVOLUTION_COST };

    const newSpecies = POKEMON_LIST[evo.to];
    acc.coins -= EVOLUTION_COST;

    mon.key = evo.to;
    const stats = statsAtLevel(newSpecies, mon.level);
    mon.maxHp = stats.maxHp;
    mon.currentHp = stats.maxHp; // bonus full heal pas evolusi

    acc.pokemons[idx] = mon;
    setAccount(guildId, userId, acc);

    return { ok: true, mon, oldSpecies, newSpecies };
}