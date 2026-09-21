// 💒 Data & helper untuk sistem Waifu (gacha, nikah, cerai)
// Digabung dari waifulist.js + waifu-system.js biar konsisten sama gaya lib/rpgData.js

export const GACHA_COST = 4000; // 💵 harga sekali gacha/spin

// 📜 Daftar waifu yang bisa didapat dari gacha
export const waifuList = [
    { name: 'Rem', anime: 'Re:Zero', rarity: 'LEGENDARY' },
    { name: 'Shiroko', anime: 'Blue Archive', rarity: 'LEGENDARY' },
    { name: 'Asuna', anime: 'Sword Art Online', rarity: 'EPIC' },
    { name: 'Mikasa Ackerman', anime: 'Attack on Titan', rarity: 'EPIC' },
    { name: 'Alya', anime: 'Alya Sometimes Hides Her Feelings in Russian', rarity: 'EPIC' },
    { name: 'Hinata Hyuga', anime: 'Naruto', rarity: 'COMMON' },
    { name: 'Nobara Kugisaki', anime: 'Jujutsu Kaisen', rarity: 'COMMON' },
    { name: "Machi Kuragi", anime: "Fruits Basket", rarity: "COMMON" },
    { name: "Ui Hirasawa", anime: "K-On!", rarity: "COMMON" },
    { name: "Karin Uzumaki", anime: "Naruto", rarity: "COMMON" },
    { name: "Sasha Blouse", anime: "Attack on Titan", rarity: "COMMON" },
    { name: "Minori Kushieda", anime: "Toradora!", rarity: "COMMON" },
    { name: "Petra Ral", anime: "Attack on Titan", rarity: "COMMON" },
    { name: "Tenten", anime: "Naruto", rarity: "COMMON" },
    { name: "Mako Mankanshoku", anime: "Kill la Kill", rarity: "COMMON" },
    { name: "Mayuri Shiina", anime: "Steins;Gate", rarity: "COMMON" },
    { name: "Shizuka Hiratsuka", anime: "Oregairu", rarity: "COMMON" },
    { name: "Yuki Suou", anime: "Roshidere", rarity: "EPIC" },
    { name: "Megumi Kato", anime: "Saekano", rarity: "EPIC" },
    { name: "Miku Nakano", anime: "Quintessential Quintuplets", rarity: "EPIC" },
    { name: "Chizuru Mizuhara", anime: "Rent-a-Girlfriend", rarity: "EPIC" },
    { name: "Yor Forger", anime: "Spy x Family", rarity: "EPIC" },
    { name: "Shinobu Kocho", anime: "Demon Slayer", rarity: "EPIC" },
    { name: "Aqua", anime: "Konosuba", rarity: "EPIC" },
    { name: "Emilia", anime: "Re:Zero", rarity: "EPIC" },
    { name: "Marin Kitagawa", anime: "My Dress-Up Darling", rarity: "EPIC" },
    { name: "Ai Hoshino", anime: "Oshi no Ko", rarity: "EPIC" },
    { name: "Holo", anime: "Spice and Wolf", rarity: "EPIC" },
    { name: "Zero Two", anime: "Darling in the Franxx", rarity: "LEGENDARY" },
    { name: "Rem", anime: "Re:Zero", rarity: "LEGENDARY" },
    { name: "Mikasa Ackerman", anime: "Attack on Titan", rarity: "LEGENDARY" },
    { name: "Violet Evergarden", anime: "Violet Evergarden", rarity: "LEGENDARY" },
    { name: "Makima", anime: "Chainsaw Man", rarity: "LEGENDARY" },
    { name: "Yukino Yukinoshita", anime: "Oregairu", rarity: "LEGENDARY" },
    { name: "Saber", anime: "Fate/stay night", rarity: "LEGENDARY" },
    { name: "Kurisu Makise", anime: "Steins;Gate", rarity: "LEGENDARY" },
    { name: "Frieren", anime: "Sousou no Frieren", rarity: "LEGENDARY" },
	{ name: "Hinata Hyuga", anime: "Naruto", rarity: "EPIC" },
	{ name: "Rias Gremory", anime: "High School DxD", rarity: "LEGENDARY" },
	{ name: "Asuna Yuuki", anime: "Sword Art Online", rarity: "LEGENDARY" },
	{ name: "Taiga Aisaka", anime: "Toradora!", rarity: "EPIC" },
	{ name: "Kaguya Shinomiya", anime: "Kaguya-sama: Love is War", rarity: "LEGENDARY" },
	{ name: "Hayasaka Ai", anime: "Kaguya-sama: Love is War", rarity: "EPIC" },
	{ name: "Echidna", anime: "Re:Zero", rarity: "EPIC" },
	{ name: "Ram", anime: "Re:Zero", rarity: "EPIC" },
	{ name: "Nezuko Kamado", anime: "Demon Slayer", rarity: "LEGENDARY" },
	{ name: "Power", anime: "Chainsaw Man", rarity: "EPIC" },
	{ name: "Himeno", anime: "Chainsaw Man", rarity: "COMMON" },
	{ name: "Kobeni Higashiyama", anime: "Chainsaw Man", rarity: "COMMON" },
	{ name: "Tohru", anime: "Miss Kobayashi's Dragon Maid", rarity: "EPIC" },
	{ name: "Kanna Kamui", anime: "Miss Kobayashi's Dragon Maid", rarity: "COMMON" },
	{ name: "Esdeath", anime: "Akame ga Kill!", rarity: "LEGENDARY" },
	{ name: "Akame", anime: "Akame ga Kill!", rarity: "EPIC" },
	{ name: "Kurumi Tokisaki", anime: "Date A Live", rarity: "LEGENDARY" },
	{ name: "Origami Tobiichi", anime: "Date A Live", rarity: "EPIC" },
	{ name: "Yuno Gasai", anime: "Future Diary", rarity: "LEGENDARY" },
	{ name: "Lucy", anime: "Elfen Lied", rarity: "EPIC" },
	{ name: "Anya Forger", anime: "Spy x Family", rarity: "COMMON" },
{ name: "Nino Nakano", anime: "Quintessential Quintuplets", rarity: "EPIC" },
{ name: "Ichika Nakano", anime: "Quintessential Quintuplets", rarity: "EPIC" },
{ name: "Yotsuba Nakano", anime: "Quintessential Quintuplets", rarity: "COMMON" },
{ name: "Itsuki Nakano", anime: "Quintessential Quintuplets", rarity: "COMMON" },
{ name: "Darkness", anime: "Konosuba", rarity: "EPIC" },
{ name: "Megumin", anime: "Konosuba", rarity: "LEGENDARY" },
{ name: "Roxy Migurdia", anime: "Mushoku Tensei", rarity: "EPIC" },
{ name: "Eris Boreas Greyrat", anime: "Mushoku Tensei", rarity: "EPIC" },
{ name: "Sylphiette", anime: "Mushoku Tensei", rarity: "EPIC" },
{ name: "Shouko Nishimiya", anime: "A Silent Voice", rarity: "LEGENDARY" },
{ name: "Mai Sakurajima", anime: "Bunny Girl Senpai", rarity: "LEGENDARY" },
{ name: "Tomoe", anime: "Kamisama Kiss", rarity: "EPIC" },
{ name: "Nanami Momozono", anime: "Kamisama Kiss", rarity: "COMMON" },
{ name: "CC", anime: "Code Geass", rarity: "LEGENDARY" },
{ name: "Kallen Stadtfeld", anime: "Code Geass", rarity: "EPIC" },
{ name: "Milim Nava", anime: "That Time I Got Reincarnated as a Slime", rarity: "EPIC" },
{ name: "Shuna", anime: "That Time I Got Reincarnated as a Slime", rarity: "COMMON" },
{ name: "Shion", anime: "That Time I Got Reincarnated as a Slime", rarity: "EPIC" },
{ name: "Rimuru Tempest", anime: "That Time I Got Reincarnated as a Slime", rarity: "LEGENDARY" },
{ name: "Mereoleona Vermillion", anime: "Black Clover", rarity: "LEGENDARY" },
{ name: "Noelle Silva", anime: "Black Clover", rarity: "EPIC" },
{ name: "Vanessa Enoteca", anime: "Black Clover", rarity: "EPIC" },
{ name: "Fubuki", anime: "One Punch Man", rarity: "EPIC" },
{ name: "Tatsumaki", anime: "One Punch Man", rarity: "LEGENDARY" },
{ name: "Boa Hancock", anime: "One Piece", rarity: "LEGENDARY" },
{ name: "Nami", anime: "One Piece", rarity: "EPIC" },
{ name: "Robin", anime: "One Piece", rarity: "LEGENDARY" },
{ name: "Yamato", anime: "One Piece", rarity: "LEGENDARY" },
{ name: "Uta", anime: "One Piece Film: Red", rarity: "EPIC" }
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

export function rollWaifu() {
    const rarity = rollRarity();
    const pool = waifuList.filter((w) => w.rarity === rarity);
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return createWaifu(picked);
}

export function createWaifu(data) {
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
