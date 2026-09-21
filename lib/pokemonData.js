// ============================================================
// 🐾 POKEMON DATA — Katalog tipe, spesies, shop item & type chart
// Semua data statis sistem Pokemon dikumpulin di sini biar
// gampang di-maintain / ditambah dari satu tempat aja.
// ============================================================

// 🏷️ Daftar tipe Pokemon (key selalu lowercase Bahasa Indonesia)
export const TYPES = {
    normal: { label: 'Normal', emoji: '⚪' },
    api: { label: 'Api', emoji: '🔥' },
    air: { label: 'Air', emoji: '💧' },
    rumput: { label: 'Rumput', emoji: '🌱' },
    listrik: { label: 'Listrik', emoji: '⚡' },
    es: { label: 'Es', emoji: '❄️' },
    petarung: { label: 'Petarung', emoji: '🥊' },
    racun: { label: 'Racun', emoji: '☠️' },
    tanah: { label: 'Tanah', emoji: '⛰️' },
    batu: { label: 'Batu', emoji: '🪨' },
    terbang: { label: 'Terbang', emoji: '🦅' },
    psikis: { label: 'Psikis', emoji: '🔮' },
    serangga: { label: 'Serangga', emoji: '🐞' },
    hantu: { label: 'Hantu', emoji: '👻' },
    naga: { label: 'Naga', emoji: '🐉' },
    gelap: { label: 'Gelap', emoji: '🌙' },
    baja: { label: 'Baja', emoji: '⚙️' },
    peri: { label: 'Peri', emoji: '✨' },
};

export function formatTypes(types = []) {
    return types.map((t) => `${TYPES[t]?.emoji || ''} ${TYPES[t]?.label || t}`).join(' / ');
}

// ⚔️ Type chart simplified — attacker -> { defender: multiplier }
// Kalau kombinasi gak ada di sini, dianggap normal (x1)
const TYPE_CHART = {
    api: { rumput: 2, es: 2, serangga: 2, baja: 2, air: 0.5, batu: 0.5, api: 0.5, naga: 0.5 },
    air: { api: 2, tanah: 2, batu: 2, rumput: 0.5, air: 0.5, naga: 0.5 },
    rumput: { air: 2, tanah: 2, batu: 2, api: 0.5, rumput: 0.5, racun: 0.5, terbang: 0.5, serangga: 0.5, naga: 0.5, baja: 0.5 },
    listrik: { air: 2, terbang: 2, tanah: 0, rumput: 0.5, listrik: 0.5, naga: 0.5 },
    es: { rumput: 2, tanah: 2, terbang: 2, naga: 2, api: 0.5, air: 0.5, es: 0.5, baja: 0.5 },
    petarung: { normal: 2, es: 2, batu: 2, gelap: 2, baja: 2, racun: 0.5, terbang: 0.5, psikis: 0.5, serangga: 0.5, peri: 0.5, hantu: 0 },
    racun: { rumput: 2, peri: 2, tanah: 0.5, batu: 0.5, hantu: 0.5, baja: 0 },
    tanah: { api: 2, listrik: 2, racun: 2, batu: 2, baja: 2, rumput: 0.5, serangga: 0.5, terbang: 0 },
    batu: { api: 2, es: 2, terbang: 2, serangga: 2, petarung: 0.5, tanah: 0.5, baja: 0.5 },
    terbang: { rumput: 2, petarung: 2, serangga: 2, listrik: 0.5, batu: 0.5, baja: 0.5 },
    psikis: { petarung: 2, racun: 2, gelap: 0, psikis: 0.5, baja: 0.5 },
    serangga: { rumput: 2, psikis: 2, gelap: 2, api: 0.5, petarung: 0.5, racun: 0.5, terbang: 0.5, hantu: 0.5, baja: 0.5, peri: 0.5 },
    hantu: { psikis: 2, hantu: 2, normal: 0, gelap: 0.5 },
    naga: { naga: 2, baja: 0.5, peri: 0 },
    gelap: { psikis: 2, hantu: 2, petarung: 0.5, gelap: 0.5, peri: 0.5 },
    baja: { es: 2, batu: 2, peri: 2, api: 0.5, air: 0.5, listrik: 0.5, baja: 0.5 },
    peri: { petarung: 2, naga: 2, gelap: 2, api: 0.5, racun: 0.5, baja: 0.5 },
    normal: { hantu: 0 },
};

// Hitung multiplier serangan 1 tipe (attackType) vs semua tipe defender (defTypes[])
export function typeMultiplier(attackType, defTypes = []) {
    let mult = 1;
    for (const def of defTypes) {
        const chart = TYPE_CHART[attackType];
        if (chart && chart[def] !== undefined) mult *= chart[def];
    }
    return mult;
}

// 🧬 Rarity config: dipakai buat bobot spawn & catch rate dasar
export const RARITY = {
    common: { label: 'Umum', emoji: '⚪', weight: 60, catchRate: 0.75, coin: [20, 45] },
    uncommon: { label: 'Jarang', emoji: '🟢', weight: 27, catchRate: 0.45, coin: [40, 80] },
    rare: { label: 'Langka', emoji: '🔵', weight: 11, catchRate: 0.22, coin: [80, 150] },
    legendary: { label: 'Legendaris', emoji: '🟡', weight: 2, catchRate: 0.06, coin: [200, 400] },
};

function sprite(dexId) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png`;
}

// 📖 Katalog spesies Pokemon yang bisa muncul lewat .eksplor
// baseHp/baseAtk/baseDef dipakai buat itung stat pas level tertentu
export const POKEMON_LIST = {
    pidgey: { dexId: 16, name: 'Pidgey', types: ['normal', 'terbang'], rarity: 'common', baseHp: 40, baseAtk: 28, baseDef: 25 },
    rattata: { dexId: 19, name: 'Rattata', types: ['normal'], rarity: 'common', baseHp: 35, baseAtk: 30, baseDef: 20 },
    caterpie: { dexId: 10, name: 'Caterpie', types: ['serangga'], rarity: 'common', baseHp: 38, baseAtk: 22, baseDef: 24 },
    weedle: { dexId: 13, name: 'Weedle', types: ['serangga', 'racun'], rarity: 'common', baseHp: 36, baseAtk: 25, baseDef: 22 },
    zubat: { dexId: 41, name: 'Zubat', types: ['racun', 'terbang'], rarity: 'common', baseHp: 40, baseAtk: 27, baseDef: 22 },
    meowth: { dexId: 52, name: 'Meowth', types: ['normal'], rarity: 'common', baseHp: 42, baseAtk: 30, baseDef: 24 },
    psyduck: { dexId: 54, name: 'Psyduck', types: ['air'], rarity: 'common', baseHp: 45, baseAtk: 28, baseDef: 26 },
    poliwag: { dexId: 60, name: 'Poliwag', types: ['air'], rarity: 'common', baseHp: 42, baseAtk: 26, baseDef: 25 },
    bellsprout: { dexId: 69, name: 'Bellsprout', types: ['rumput', 'racun'], rarity: 'common', baseHp: 38, baseAtk: 32, baseDef: 22 },
    doduo: { dexId: 84, name: 'Doduo', types: ['normal', 'terbang'], rarity: 'common', baseHp: 44, baseAtk: 33, baseDef: 22 },
    seel: { dexId: 86, name: 'Seel', types: ['air'], rarity: 'common', baseHp: 48, baseAtk: 26, baseDef: 28 },
    grimer: { dexId: 88, name: 'Grimer', types: ['racun'], rarity: 'common', baseHp: 46, baseAtk: 30, baseDef: 27 },
    shellder: { dexId: 90, name: 'Shellder', types: ['air'], rarity: 'common', baseHp: 36, baseAtk: 28, baseDef: 33 },
    voltorb: { dexId: 100, name: 'Voltorb', types: ['listrik'], rarity: 'common', baseHp: 38, baseAtk: 32, baseDef: 26 },
    krabby: { dexId: 98, name: 'Krabby', types: ['air'], rarity: 'common', baseHp: 40, baseAtk: 34, baseDef: 30 },
    magnemite: { dexId: 81, name: 'Magnemite', types: ['listrik', 'baja'], rarity: 'common', baseHp: 38, baseAtk: 30, baseDef: 30 },

    growlithe: { dexId: 58, name: 'Growlithe', types: ['api'], rarity: 'uncommon', baseHp: 55, baseAtk: 42, baseDef: 32 },
    machop: { dexId: 66, name: 'Machop', types: ['petarung'], rarity: 'uncommon', baseHp: 58, baseAtk: 48, baseDef: 33 },
    ponyta: { dexId: 77, name: 'Ponyta', types: ['api'], rarity: 'uncommon', baseHp: 54, baseAtk: 45, baseDef: 30 },
    gastly: { dexId: 92, name: 'Gastly', types: ['hantu', 'racun'], rarity: 'uncommon', baseHp: 50, baseAtk: 44, baseDef: 28 },
    onix: { dexId: 95, name: 'Onix', types: ['batu', 'tanah'], rarity: 'uncommon', baseHp: 60, baseAtk: 38, baseDef: 55 },
    vulpix: { dexId: 37, name: 'Vulpix', types: ['api'], rarity: 'uncommon', baseHp: 52, baseAtk: 40, baseDef: 32 },
    abra: { dexId: 63, name: 'Abra', types: ['psikis'], rarity: 'uncommon', baseHp: 48, baseAtk: 46, baseDef: 26 },
    eevee: { dexId: 133, name: 'Eevee', types: ['normal'], rarity: 'uncommon', baseHp: 58, baseAtk: 42, baseDef: 35 },
    horsea: { dexId: 116, name: 'Horsea', types: ['air'], rarity: 'uncommon', baseHp: 50, baseAtk: 38, baseDef: 34 },

    dratini: { dexId: 147, name: 'Dratini', types: ['naga'], rarity: 'rare', baseHp: 68, baseAtk: 55, baseDef: 42 },
    pikachu: { dexId: 25, name: 'Pikachu', types: ['listrik'], rarity: 'rare', baseHp: 70, baseAtk: 58, baseDef: 40 },
    charmander: { dexId: 4, name: 'Charmander', types: ['api'], rarity: 'rare', baseHp: 72, baseAtk: 56, baseDef: 42 },
    squirtle: { dexId: 7, name: 'Squirtle', types: ['air'], rarity: 'rare', baseHp: 75, baseAtk: 52, baseDef: 48 },
    bulbasaur: { dexId: 1, name: 'Bulbasaur', types: ['rumput'], rarity: 'rare', baseHp: 74, baseAtk: 53, baseDef: 46 },
    snorlax: { dexId: 143, name: 'Snorlax', types: ['normal'], rarity: 'rare', baseHp: 95, baseAtk: 60, baseDef: 50 },

    articuno: { dexId: 144, name: 'Articuno', types: ['es', 'terbang'], rarity: 'legendary', baseHp: 105, baseAtk: 85, baseDef: 75 },
    zapdos: { dexId: 145, name: 'Zapdos', types: ['listrik', 'terbang'], rarity: 'legendary', baseHp: 105, baseAtk: 90, baseDef: 72 },
    moltres: { dexId: 146, name: 'Moltres', types: ['api', 'terbang'], rarity: 'legendary', baseHp: 105, baseAtk: 92, baseDef: 72 },
    mewtwo: { dexId: 150, name: 'Mewtwo', types: ['psikis'], rarity: 'legendary', baseHp: 110, baseAtk: 105, baseDef: 80 },
    mew: { dexId: 151, name: 'Mew', types: ['psikis'], rarity: 'legendary', baseHp: 108, baseAtk: 95, baseDef: 90 },
    lapras: { dexId: 131, name: 'Lapras', types: ['air', 'es'], rarity: 'legendary', baseHp: 120, baseAtk: 80, baseDef: 85 },
    gyarados: { dexId: 130, name: 'Gyarados', types: ['air', 'terbang'], rarity: 'legendary', baseHp: 115, baseAtk: 100, baseDef: 78 },
};

// ============================================================
// 🧬 EVOLVED FORMS — hanya bisa didapat lewat evolusi, gak nge-spawn liar
// ============================================================
Object.assign(POKEMON_LIST, {
    pidgeotto: { dexId: 17, name: 'Pidgeotto', types: ['normal', 'terbang'], rarity: 'common', baseHp: 63, baseAtk: 40, baseDef: 38, evolved: true },
    raticate: { dexId: 20, name: 'Raticate', types: ['normal'], rarity: 'common', baseHp: 55, baseAtk: 48, baseDef: 33, evolved: true },
    metapod: { dexId: 11, name: 'Metapod', types: ['serangga'], rarity: 'common', baseHp: 50, baseAtk: 20, baseDef: 45, evolved: true },
    butterfree: { dexId: 12, name: 'Butterfree', types: ['serangga', 'terbang'], rarity: 'common', baseHp: 60, baseAtk: 45, baseDef: 40, evolved: true },
    kakuna: { dexId: 14, name: 'Kakuna', types: ['serangga', 'racun'], rarity: 'common', baseHp: 48, baseAtk: 22, baseDef: 44, evolved: true },
    beedrill: { dexId: 15, name: 'Beedrill', types: ['serangga', 'racun'], rarity: 'common', baseHp: 58, baseAtk: 52, baseDef: 38, evolved: true },
    golbat: { dexId: 42, name: 'Golbat', types: ['racun', 'terbang'], rarity: 'common', baseHp: 62, baseAtk: 45, baseDef: 36, evolved: true },
    persian: { dexId: 53, name: 'Persian', types: ['normal'], rarity: 'common', baseHp: 60, baseAtk: 48, baseDef: 38, evolved: true },
    golduck: { dexId: 55, name: 'Golduck', types: ['air'], rarity: 'common', baseHp: 68, baseAtk: 46, baseDef: 42, evolved: true },
    poliwhirl: { dexId: 61, name: 'Poliwhirl', types: ['air'], rarity: 'common', baseHp: 62, baseAtk: 42, baseDef: 40, evolved: true },
    weepinbell: { dexId: 70, name: 'Weepinbell', types: ['rumput', 'racun'], rarity: 'common', baseHp: 58, baseAtk: 50, baseDef: 36, evolved: true },
    dodrio: { dexId: 85, name: 'Dodrio', types: ['normal', 'terbang'], rarity: 'common', baseHp: 65, baseAtk: 55, baseDef: 35, evolved: true },
    dewgong: { dexId: 87, name: 'Dewgong', types: ['air', 'es'], rarity: 'common', baseHp: 72, baseAtk: 40, baseDef: 45, evolved: true },
    muk: { dexId: 89, name: 'Muk', types: ['racun'], rarity: 'common', baseHp: 70, baseAtk: 48, baseDef: 44, evolved: true },
    cloyster: { dexId: 91, name: 'Cloyster', types: ['air', 'es'], rarity: 'common', baseHp: 55, baseAtk: 50, baseDef: 65, evolved: true },
    electrode: { dexId: 101, name: 'Electrode', types: ['listrik'], rarity: 'common', baseHp: 58, baseAtk: 50, baseDef: 42, evolved: true },
    kingler: { dexId: 99, name: 'Kingler', types: ['air'], rarity: 'common', baseHp: 62, baseAtk: 58, baseDef: 48, evolved: true },
    magneton: { dexId: 82, name: 'Magneton', types: ['listrik', 'baja'], rarity: 'common', baseHp: 58, baseAtk: 48, baseDef: 48, evolved: true },

    arcanine: { dexId: 59, name: 'Arcanine', types: ['api'], rarity: 'uncommon', baseHp: 80, baseAtk: 68, baseDef: 50, evolved: true },
    machoke: { dexId: 67, name: 'Machoke', types: ['petarung'], rarity: 'uncommon', baseHp: 72, baseAtk: 62, baseDef: 42, evolved: true },
    machamp: { dexId: 68, name: 'Machamp', types: ['petarung'], rarity: 'uncommon', baseHp: 85, baseAtk: 80, baseDef: 52, evolved: true },
    rapidash: { dexId: 78, name: 'Rapidash', types: ['api'], rarity: 'uncommon', baseHp: 68, baseAtk: 62, baseDef: 45, evolved: true },
    haunter: { dexId: 93, name: 'Haunter', types: ['hantu', 'racun'], rarity: 'uncommon', baseHp: 62, baseAtk: 58, baseDef: 35, evolved: true },
    gengar: { dexId: 94, name: 'Gengar', types: ['hantu', 'racun'], rarity: 'uncommon', baseHp: 72, baseAtk: 78, baseDef: 40, evolved: true },
    ninetales: { dexId: 38, name: 'Ninetales', types: ['api'], rarity: 'uncommon', baseHp: 70, baseAtk: 60, baseDef: 48, evolved: true },
    kadabra: { dexId: 64, name: 'Kadabra', types: ['psikis'], rarity: 'uncommon', baseHp: 58, baseAtk: 60, baseDef: 32, evolved: true },
    alakazam: { dexId: 65, name: 'Alakazam', types: ['psikis'], rarity: 'uncommon', baseHp: 68, baseAtk: 82, baseDef: 38, evolved: true },
    jolteon: { dexId: 135, name: 'Jolteon', types: ['listrik'], rarity: 'uncommon', baseHp: 72, baseAtk: 65, baseDef: 42, evolved: true },
    seadra: { dexId: 117, name: 'Seadra', types: ['air'], rarity: 'uncommon', baseHp: 62, baseAtk: 55, baseDef: 46, evolved: true },

    dragonair: { dexId: 148, name: 'Dragonair', types: ['naga'], rarity: 'rare', baseHp: 85, baseAtk: 68, baseDef: 55, evolved: true },
    dragonite: { dexId: 149, name: 'Dragonite', types: ['naga', 'terbang'], rarity: 'rare', baseHp: 130, baseAtk: 100, baseDef: 85, evolved: true },
    raichu: { dexId: 26, name: 'Raichu', types: ['listrik'], rarity: 'rare', baseHp: 88, baseAtk: 78, baseDef: 50, evolved: true },
    charmeleon: { dexId: 5, name: 'Charmeleon', types: ['api'], rarity: 'rare', baseHp: 88, baseAtk: 70, baseDef: 52, evolved: true },
    charizard: { dexId: 6, name: 'Charizard', types: ['api', 'terbang'], rarity: 'rare', baseHp: 120, baseAtk: 95, baseDef: 70, evolved: true },
    wartortle: { dexId: 8, name: 'Wartortle', types: ['air'], rarity: 'rare', baseHp: 92, baseAtk: 64, baseDef: 58, evolved: true },
    blastoise: { dexId: 9, name: 'Blastoise', types: ['air'], rarity: 'rare', baseHp: 125, baseAtk: 88, baseDef: 90, evolved: true },
    ivysaur: { dexId: 2, name: 'Ivysaur', types: ['rumput'], rarity: 'rare', baseHp: 90, baseAtk: 65, baseDef: 56, evolved: true },
    venusaur: { dexId: 3, name: 'Venusaur', types: ['rumput'], rarity: 'rare', baseHp: 122, baseAtk: 90, baseDef: 80, evolved: true },
});

// 🧬 Peta evolusi: key spesies awal -> hasil evolusi + syarat level
export const EVOLUTION_MAP = {
    pidgey: { to: 'pidgeotto', minLevel: 10 },
    rattata: { to: 'raticate', minLevel: 10 },
    caterpie: { to: 'metapod', minLevel: 5 },
    metapod: { to: 'butterfree', minLevel: 10 },
    weedle: { to: 'kakuna', minLevel: 5 },
    kakuna: { to: 'beedrill', minLevel: 10 },
    zubat: { to: 'golbat', minLevel: 12 },
    meowth: { to: 'persian', minLevel: 12 },
    psyduck: { to: 'golduck', minLevel: 15 },
    poliwag: { to: 'poliwhirl', minLevel: 12 },
    bellsprout: { to: 'weepinbell', minLevel: 12 },
    doduo: { to: 'dodrio', minLevel: 14 },
    seel: { to: 'dewgong', minLevel: 14 },
    grimer: { to: 'muk', minLevel: 14 },
    shellder: { to: 'cloyster', minLevel: 14 },
    voltorb: { to: 'electrode', minLevel: 12 },
    krabby: { to: 'kingler', minLevel: 14 },
    magnemite: { to: 'magneton', minLevel: 14 },
    growlithe: { to: 'arcanine', minLevel: 20 },
    machop: { to: 'machoke', minLevel: 15 },
    machoke: { to: 'machamp', minLevel: 25 },
    ponyta: { to: 'rapidash', minLevel: 18 },
    gastly: { to: 'haunter', minLevel: 12 },
    haunter: { to: 'gengar', minLevel: 22 },
    vulpix: { to: 'ninetales', minLevel: 18 },
    abra: { to: 'kadabra', minLevel: 12 },
    kadabra: { to: 'alakazam', minLevel: 25 },
    eevee: { to: 'jolteon', minLevel: 20 },
    horsea: { to: 'seadra', minLevel: 15 },
    dratini: { to: 'dragonair', minLevel: 20 },
    dragonair: { to: 'dragonite', minLevel: 35 },
    pikachu: { to: 'raichu', minLevel: 20 },
    charmander: { to: 'charmeleon', minLevel: 16 },
    charmeleon: { to: 'charizard', minLevel: 32 },
    squirtle: { to: 'wartortle', minLevel: 16 },
    wartortle: { to: 'blastoise', minLevel: 32 },
    bulbasaur: { to: 'ivysaur', minLevel: 16 },
    ivysaur: { to: 'venusaur', minLevel: 32 },
};

export const EVOLUTION_COST = 5000;

export function resolveEvolution(speciesKey) {
    return EVOLUTION_MAP[speciesKey] || null;
}

// Tambahin sprite url ke tiap entry biar gampang dipanggil `.sprite`
for (const key of Object.keys(POKEMON_LIST)) {
    POKEMON_LIST[key].key = key;
    POKEMON_LIST[key].sprite = sprite(POKEMON_LIST[key].dexId);
}

export function resolveSpecies(rawName) {
    const key = rawName.trim().toLowerCase().replace(/\s+/g, '');
    if (POKEMON_LIST[key]) return POKEMON_LIST[key];
    const found = Object.values(POKEMON_LIST).find((p) => p.name.toLowerCase() === rawName.trim().toLowerCase());
    return found || null;
}

// 🎲 Pilih 1 spesies random berdasarkan bobot rarity
export function rollWildPokemon() {
    const roll = Math.random() * 100;
    let acc = 0;
    let chosenRarity = 'common';
    for (const [key, r] of Object.entries(RARITY)) {
        acc += r.weight;
        if (roll <= acc) {
            chosenRarity = key;
            break;
        }
    }
    const pool = Object.values(POKEMON_LIST).filter((p) => p.rarity === chosenRarity && !p.evolved);
    return pool[Math.floor(Math.random() * pool.length)];
}

// 📈 Hitung stat pokemon di level tertentu
export function statsAtLevel(species, level) {
    return {
        maxHp: Math.round(species.baseHp + level * 3.2),
        atk: Math.round(species.baseAtk + level * 2.1),
        def: Math.round(species.baseDef + level * 1.8),
    };
}

// ============================================================
// 🛍️ SHOP — Pokeball & Potion
// ============================================================
export const SHOP_ITEMS = {
    pokeball: { emoji: '🔴', label: 'Poke Ball', price: 300, catchMult: 1, key: 'pokeball', type: 'ball' },
    greatball: { emoji: '🟠', label: 'Great Ball', price: 650, catchMult: 1.5, key: 'greatball', type: 'ball' },
    ultraball: { emoji: '🟡', label: 'Ultra Ball', price: 1300, catchMult: 2, key: 'ultraball', type: 'ball' },
    masterball: { emoji: '🟣', label: 'Master Ball', price: 15000, catchMult: 100, key: 'masterball', type: 'ball' },
    potion: { emoji: '🧪', label: 'Potion', price: 250, heal: 40, key: 'potion', type: 'potion' },
    superpotion: { emoji: '💊', label: 'Super Potion', price: 550, heal: 100, key: 'superpotion', type: 'potion' },
};

export const SHOP_ALIASES = {
    'poke ball': 'pokeball',
    'great ball': 'greatball',
    'ultra ball': 'ultraball',
    'master ball': 'masterball',
    'super potion': 'superpotion',
};

export function resolveShopItem(rawName) {
    const key = rawName.trim().toLowerCase().replace(/\s+/g, ' ');
    const compact = key.replace(/\s+/g, '');
    if (SHOP_ITEMS[compact]) return { key: compact, item: SHOP_ITEMS[compact] };
    if (SHOP_ALIASES[key] && SHOP_ITEMS[SHOP_ALIASES[key]]) {
        const k = SHOP_ALIASES[key];
        return { key: k, item: SHOP_ITEMS[k] };
    }
    return null;
}

export function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}