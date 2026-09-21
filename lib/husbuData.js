// 🤵 Data & helper untuk sistem Husbu (gacha, nikah, cerai) — versi cowok dari waifuData.js

export const GACHA_COST = 4000; // 💵 harga sekali gacha/spin

// 📜 Daftar husbu yang bisa didapat dari gacha
export const husbuList = [
    { name: 'Levi Ackerman', anime: 'Attack on Titan', rarity: 'LEGENDARY' },
    { name: 'Gojo Satoru', anime: 'Jujutsu Kaisen', rarity: 'LEGENDARY' },
    { name: 'Kirito', anime: 'Sword Art Online', rarity: 'EPIC' },
    { name: 'Itachi Uchiha', anime: 'Naruto', rarity: 'EPIC' },
    { name: 'Zenitsu Agatsuma', anime: 'Demon Slayer', rarity: 'EPIC' },
    { name: 'Tanjiro Kamado', anime: 'Demon Slayer', rarity: 'COMMON' },
    { name: 'Subaru Natsuki', anime: 'Re:Zero', rarity: 'COMMON' },
    { name: 'Zhongli', anime: 'Genshin Impact', rarity: 'LEGENDARY' },
    { name: 'Neuvillette', anime: 'Genshin Impact', rarity: 'LEGENDARY' },
    { name: 'Xiao', anime: 'Genshin Impact', rarity: 'LEGENDARY' },
    { name: 'Jing Yuan', anime: 'Honkai: Star Rail', rarity: 'LEGENDARY' },
    { name: 'Blade', anime: 'Honkai: Star Rail', rarity: 'LEGENDARY' },
    { name: 'Sunday', anime: 'Honkai: Star Rail', rarity: 'LEGENDARY' },
    { name: 'Levi Ackerman', anime: 'Attack on Titan', rarity: 'LEGENDARY' },
    { name: 'Gojo Satoru', anime: 'Jujutsu Kaisen', rarity: 'LEGENDARY' },
    { name: 'Sung Jinwoo', anime: 'Solo Leveling', rarity: 'LEGENDARY' },
    { name: 'Itachi Uchiha', anime: 'Naruto', rarity: 'LEGENDARY' },
    { name: 'Sebastian Michaelis', anime: 'Black Butler', rarity: 'LEGENDARY' },
    { name: 'Aizen Sosuke', anime: 'Bleach', rarity: 'LEGENDARY' },
    { name: 'Diluc Ragnvindr', anime: 'Genshin Impact', rarity: 'EPIC' },
    { name: 'Kaeya Alberich', anime: 'Genshin Impact', rarity: 'EPIC' },
    { name: 'Childe (Tartaglia)', anime: 'Genshin Impact', rarity: 'EPIC' },
    { name: 'Kazuha Kaedehara', anime: 'Genshin Impact', rarity: 'EPIC' },
    { name: 'Wanderer (Scaramouche)', anime: 'Genshin Impact', rarity: 'EPIC' },
    { name: 'Alhaitham', anime: 'Genshin Impact', rarity: 'EPIC' },
    { name: 'Ayato Kamisato', anime: 'Genshin Impact', rarity: 'EPIC' },
    { name: 'Arataki Itto', anime: 'Genshin Impact', rarity: 'EPIC' },
    { name: 'Wriothesley', anime: 'Genshin Impact', rarity: 'EPIC' },
    { name: 'Dan Heng', anime: 'Honkai: Star Rail', rarity: 'EPIC' },
    { name: 'Dan Heng • Imbibitor Lunae', anime: 'Honkai: Star Rail', rarity: 'EPIC' },
    { name: 'Aventurine', anime: 'Honkai: Star Rail', rarity: 'EPIC' },
    { name: 'Dr. Ratio', anime: 'Honkai: Star Rail', rarity: 'EPIC' },
    { name: 'Luocha', anime: 'Honkai: Star Rail', rarity: 'EPIC' },
    { name: 'Argenti', anime: 'Honkai: Star Rail', rarity: 'EPIC' },
    { name: 'Kirito', anime: 'Sword Art Online', rarity: 'EPIC' },
    { name: 'Zenitsu Agatsuma', anime: 'Demon Slayer', rarity: 'EPIC' },
    { name: 'Giyu Tomioka', anime: 'Demon Slayer', rarity: 'EPIC' },
    { name: 'Rengoku Kyojuro', anime: 'Demon Slayer', rarity: 'EPIC' },
    { name: 'Sasuke Uchiha', anime: 'Naruto', rarity: 'EPIC' },
    { name: 'Killua Zoldyck', anime: 'Hunter x Hunter', rarity: 'EPIC' },
    { name: 'Chrollo Lucilfer', anime: 'Hunter x Hunter', rarity: 'EPIC' },
    { name: 'Edward Elric', anime: 'Fullmetal Alchemist', rarity: 'EPIC' },
    { name: 'Roy Mustang', anime: 'Fullmetal Alchemist', rarity: 'EPIC' },
    { name: 'Yuji Itadori', anime: 'Jujutsu Kaisen', rarity: 'EPIC' },
    { name: 'Megumi Fushiguro', anime: 'Jujutsu Kaisen', rarity: 'EPIC' },
    { name: 'Ken Kaneki', anime: 'Tokyo Ghoul', rarity: 'EPIC' },
    { name: 'Ichigo Kurosaki', anime: 'Bleach', rarity: 'EPIC' },
    { name: 'L Lawliet', anime: 'Death Note', rarity: 'EPIC' },
    { name: 'Light Yagami', anime: 'Death Note', rarity: 'EPIC' },
    { name: 'Kaveh', anime: 'Genshin Impact', rarity: 'COMMON' },
    { name: 'Thoma', anime: 'Genshin Impact', rarity: 'COMMON' },
    { name: 'Heizou Shikanoin', anime: 'Genshin Impact', rarity: 'COMMON' },
    { name: 'Chongyun', anime: 'Genshin Impact', rarity: 'COMMON' },
    { name: 'Bennett', anime: 'Genshin Impact', rarity: 'COMMON' },
    { name: 'Xingqiu', anime: 'Genshin Impact', rarity: 'COMMON' },
    { name: 'Gorou', anime: 'Genshin Impact', rarity: 'COMMON' },
    { name: 'Sampo Koski', anime: 'Honkai: Star Rail', rarity: 'COMMON' },
    { name: 'Yanqing', anime: 'Honkai: Star Rail', rarity: 'COMMON' },
    { name: 'Gepard Landau', anime: 'Honkai: Star Rail', rarity: 'COMMON' },
    { name: 'Welt Yang', anime: 'Honkai: Star Rail', rarity: 'COMMON' },
    { name: 'Boothill', anime: 'Honkai: Star Rail', rarity: 'COMMON' },
    { name: 'Misha', anime: 'Honkai: Star Rail', rarity: 'COMMON' },
    { name: 'Tanjiro Kamado', anime: 'Demon Slayer', rarity: 'COMMON' },
    { name: 'Inosuke Hashibira', anime: 'Demon Slayer', rarity: 'COMMON' },
    { name: 'Subaru Natsuki', anime: 'Re:Zero', rarity: 'COMMON' },
    { name: 'Naruto Uzumaki', anime: 'Naruto', rarity: 'COMMON' },
    { name: 'Gon Freecss', anime: 'Hunter x Hunter', rarity: 'COMMON' },
    { name: 'Hisoka Morow', anime: 'Hunter x Hunter', rarity: 'COMMON' },
    { name: 'Deku Midoriya', anime: 'My Hero Academia', rarity: 'COMMON' },
    { name: 'Bakugo Katsuki', anime: 'My Hero Academia', rarity: 'COMMON' },
    { name: 'Todoroki Shoto', anime: 'My Hero Academia', rarity: 'COMMON' },
    { name: 'Inuyasha', anime: 'Inuyasha', rarity: 'COMMON' },
    { name: 'Sesshomaru', anime: 'Inuyasha', rarity: 'COMMON' },
    { name: 'Spike Spiegel', anime: 'Cowboy Bebop', rarity: 'COMMON' },
    { name: 'Ciel Phantomhive', anime: 'Black Butler', rarity: 'COMMON' },
    { name: 'Loid Forger', anime: 'Spy x Family', rarity: 'COMMON' },
    { name: 'Yuta Okkotsu', anime: 'Jujutsu Kaisen', rarity: 'COMMON' },
    { name: 'Toji Fushiguro', anime: 'Jujutsu Kaisen', rarity: 'COMMON' },
    { name: 'Rimuru Tempest', anime: 'That Time I Got Reincarnated as a Slime', rarity: 'COMMON' }
];

// 🎲 Peluang rarity: 5% Legendary, 25% Epic, sisanya Common
const RARITY_TABLE = [
    { rarity: 'LEGENDARY', chance: 0.05 },
    { rarity: 'EPIC', chance: 0.30 }, // kumulatif (<= 0.30)
];

export function rollRarity() {
    const chance = Math.random();
    if (chance <= RARITY_TABLE[0].chance) return 'LEGENDARY';
    if (chance <= RARITY_TABLE[1].chance) return 'EPIC';
    return 'COMMON';
}

export function rollHusbu() {
    const rarity = rollRarity();
    const pool = husbuList.filter((h) => h.rarity === rarity);
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return createHusbu(picked);
}

export function createHusbu(data) {
    return {
        name: data.name,
        anime: data.anime,
        rarity: data.rarity,
        affection: 0,
        marriedAt: null,
        totalDate: 0,
        totalGift: 0,
    };
}

export function rarityEmoji(rarity) {
    switch (rarity) {
        case 'LEGENDARY':
            return '🌟 LEGENDARY';
        case 'EPIC':
            return '💎 EPIC';
        default:
            return '⚪ COMMON';
    }
}

export function getRank(affection = 0) {
    if (affection >= 1000) return '👑 Eternal Love';
    if (affection >= 500) return '💖 Soulmate';
    if (affection >= 250) return '💕 Sangat Dekat';
    if (affection >= 100) return '🥰 Romantis';
    if (affection >= 50) return '😊 Akrab';
    return '🌱 Baru Menikah';
}
