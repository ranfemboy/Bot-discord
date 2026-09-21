// 🛍️ Katalog barang di .shop — key harus lowercase & tanpa spasi ganda
export const SHOP_ITEMS = {
    'pedang kayu': { emoji: '🗡️', label: 'Pedang Kayu', slot: 'pedang', tier: 'kayu', price: 100 },
    'pedang besi': { emoji: '🗡️', label: 'Pedang Besi', slot: 'pedang', tier: 'besi', price: 200 },
    'pedang emas': { emoji: '🗡️', label: 'Pedang Emas', slot: 'pedang', tier: 'emas', price: 500 },
    'pedang berlian': { emoji: '🗡️', label: 'Pedang Berlian', slot: 'pedang', tier: 'berlian', price: 2000 },

    'busur': { emoji: '🏹', label: 'Busur', slot: 'busur', price: 3000 },
    'anak panah': { emoji: '🏹', label: 'Anak Panah', type: 'consumable', key: 'arrows', price: 50 },

    'pickaxe kayu': { emoji: '⛏️', label: 'Pickaxe Kayu', slot: 'pickaxe', tier: 'kayu', price: 100 },
    'pickaxe besi': { emoji: '⛏️', label: 'Pickaxe Besi', slot: 'pickaxe', tier: 'besi', price: 250 },
    'pickaxe emas': { emoji: '⛏️', label: 'Pickaxe Emas', slot: 'pickaxe', tier: 'emas', price: 350 },
    'pickaxe berlian': { emoji: '⛏️', label: 'Pickaxe Berlian', slot: 'pickaxe', tier: 'berlian', price: 25000 },

    'potion heal': { emoji: '🧪', label: 'Potion Heal', type: 'consumable', key: 'heal', price: 70 },
};

// Alias biar user gak harus ketik nama persis
export const ITEM_ALIASES = {
    'panah': 'anak panah',
    'arrow': 'anak panah',
    'potion': 'potion heal',
    'heal': 'potion heal',
    'busur panah': 'busur',
};

// ⚔️ Multiplier reward & resiko kalau berburu pakai Pedang (melee, gak butuh panah)
export const MELEE_TIER_MULTIPLIER = {
    kayu: 0.6,
    besi: 0.8,
    emas: 1.0,
    berlian: 1.3,
};
export const MELEE_EXTRA_COUNTER_CHANCE = 0.2; // melee lebih berisiko daripada busur

export function resolveItem(rawName) {
    const key = rawName.trim().toLowerCase().replace(/\s+/g, ' ');
    if (SHOP_ITEMS[key]) return { key, item: SHOP_ITEMS[key] };
    if (ITEM_ALIASES[key] && SHOP_ITEMS[ITEM_ALIASES[key]]) {
        return { key: ITEM_ALIASES[key], item: SHOP_ITEMS[ITEM_ALIASES[key]] };
    }
    return null;
}

// 🐾 Daftar hewan buruan .hunt
export const ANIMALS = {
    ayam: { emoji: '🐔', label: 'Ayam', arrows: 1, reward: [15, 35], counterChance: 0 },
    babihutan: { emoji: '🐗', label: 'Babi Hutan', arrows: 3, reward: [50, 90], counterChance: 0.25, counterDamage: [10, 20] },
    sapi: { emoji: '🐄', label: 'Sapi', arrows: 4, reward: [70, 130], counterChance: 0.15, counterDamage: [5, 15] },
};

export const ANIMAL_ALIASES = {
    'babi': 'babihutan',
    'babi hutan': 'babihutan',
    'boar': 'babihutan',
    'chicken': 'ayam',
    'cow': 'sapi',
};

export function resolveAnimal(rawName) {
    const key = rawName.trim().toLowerCase().replace(/\s+/g, '');
    const keySpaced = rawName.trim().toLowerCase();
    if (ANIMALS[key]) return { key, animal: ANIMALS[key] };
    if (ANIMAL_ALIASES[keySpaced] && ANIMALS[ANIMAL_ALIASES[keySpaced]]) {
        const k = ANIMAL_ALIASES[keySpaced];
        return { key: k, animal: ANIMALS[k] };
    }
    return null;
}

export function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}