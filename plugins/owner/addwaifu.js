/**
 * Add Waifu — Owner Only
 * -----------------------------
 * Nambahin waifu baru ke pool gacha langsung dari chat, tanpa perlu buka
 * atau edit lib/waifuData.js manual. Disimpan ke data/customWaifuList.json
 * lewat lib/customWaifuStore.js dan otomatis kegabung ke pool gacha
 * (asal .gachawaifu udah di-setup pakai rollWaifuCombined, cek komen di
 * lib/customWaifuStore.js).
 */
import { addCustomWaifu, findWaifuByName, RARITIES } from '../../lib/customWaifuStore.js';
import { rarityEmoji } from '../../lib/waifuData.js';

export const config = {
    name: 'addwaifu',
    alias: ['addwaifuku', 'newwaifu'],
    category: 'owner',
    description: 'Nambahin waifu baru ke pool gacha (owner only)',
    usage: '.addwaifu <nama>|<anime>|<rarity>',
    example: '.addwaifu Rem|Re:Zero|LEGENDARY',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { args }) {
    try {
        const raw = args.join(' ').trim();

        if (!raw || !raw.includes('|')) {
            return m.reply(
                `📌 *CARA PAKAI .addwaifu*\n\n` +
                `\`.addwaifu <nama>|<anime>|<rarity>\`\n\n` +
                `📝 Contoh:\n\`.addwaifu Rem|Re:Zero|LEGENDARY\`\n\n` +
                `🎲 Rarity valid: ${RARITIES.join(', ')}`
            );
        }

        const parts = raw.split('|').map((p) => p.trim());
        if (parts.length !== 3) {
            return m.reply('❌ Format kurang lengkap. Harus 3 bagian dipisah `|` → nama|anime|rarity');
        }

        const [name, anime, rarityRaw] = parts;
        if (!name || !anime || !rarityRaw) {
            return m.reply('❌ Nama, anime, dan rarity gak boleh ada yang kosong ya, Sensei~');
        }

        const rarity = rarityRaw.toUpperCase();
        if (!RARITIES.includes(rarity)) {
            return m.reply(`❌ Rarity *${rarityRaw}* gak valid.\n\nPilih salah satu: ${RARITIES.join(', ')}`);
        }

        if (findWaifuByName(name)) {
            return m.reply(`❌ Waifu *${name}* udah ada di pool (bawaan atau custom). Pakai nama lain ya~`);
        }

        const entry = addCustomWaifu({ name, anime, rarity });

        let text = `✅ *WAIFU BARU DITAMBAHIN* ✅\n\n`;
        text += `👤 Nama : *${entry.name}*\n`;
        text += `📺 Anime : ${entry.anime}\n`;
        text += `${rarityEmoji(entry.rarity)}\n\n`;
        text += `Waifu ini sekarang otomatis kegabung ke pool *.gachawaifu*! 🎉✨`;

        return m.reply(text);
    } catch (err) {
        console.error('addwaifu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
