/**
 * Istriku — Discord version
 * -----------------------------
 * Converted from ESM plugin (m.sender/getDatabase) by Claude
 */
import { getUser } from '../../lib/waifuStore.js';
import { rarityEmoji, getRank } from '../../lib/waifuData.js';

export const config = {
    name: 'istriku',
    alias: ['mywaifu'],
    category: 'gacha',
    description: 'Melihat profil istri',
    usage: '.istriku',
    example: '.istriku',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
};

export async function handler(m) {
    try {
        const user = getUser(m.guild.id, m.author.id);

        if (!user.istri?.name) {
            return m.reply('💔 Kamu belum memiliki istri.\n\nGunakan *.nikahwaifu <nama>* terlebih dahulu.');
        }

        const istri = user.istri;
        const marriedDays = Math.floor((Date.now() - (istri.marriedAt || Date.now())) / (1000 * 60 * 60 * 24));

        let text = `❤️ *PROFIL ISTRI* ❤️\n\n`;
        text += `🌸 Nama : ${istri.name}\n`;
        text += `📺 Anime : ${istri.anime}\n`;
        text += `🏆 Rarity : ${rarityEmoji(istri.rarity)}\n`;
        text += `💞 Affection : ${istri.affection || 0}\n`;
        text += `💕 Rank Hubungan : ${getRank(istri.affection || 0)}\n`;
        text += `💍 Status : Menikah\n`;
        text += `⏳ Lama Pernikahan : ${marriedDays} Hari\n`;
        text += `🎁 Total Hadiah : ${istri.totalGift || 0}\n`;
        text += `🌆 Total Kencan : ${istri.totalDate || 0}\n`;

        return m.reply(text);
    } catch (err) {
        console.error('istriku error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
