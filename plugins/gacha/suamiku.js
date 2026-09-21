/**
 * Suamiku — Discord version
 * -----------------------------
 * Versi cowok dari istriku.js
 */
import { getUser } from '../../lib/husbuStore.js';
import { rarityEmoji, getRank } from '../../lib/husbuData.js';

export const config = {
    name: 'suamiku',
    alias: ['myhusbu', 'husbandku'],
    category: 'gacha',
    description: 'Melihat profil suami',
    usage: '.suamiku',
    example: '.suamiku',
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

        if (!user.suami?.name) {
            return m.reply('💔 Kamu belum memiliki suami.\n\nGunakan *.nikahhusbu <nama>* terlebih dahulu.');
        }

        const suami = user.suami;
        const marriedDays = Math.floor((Date.now() - (suami.marriedAt || Date.now())) / (1000 * 60 * 60 * 24));

        let text = `❤️ *PROFIL SUAMI* ❤️\n\n`;
        text += `🤵 Nama : ${suami.name}\n`;
        text += `📺 Anime : ${suami.anime}\n`;
        text += `🏆 Rarity : ${rarityEmoji(suami.rarity)}\n`;
        text += `💞 Affection : ${suami.affection || 0}\n`;
        text += `💕 Rank Hubungan : ${getRank(suami.affection || 0)}\n`;
        text += `💍 Status : Menikah\n`;
        text += `⏳ Lama Pernikahan : ${marriedDays} Hari\n`;
        text += `🎁 Total Hadiah : ${suami.totalGift || 0}\n`;
        text += `🌆 Total Kencan : ${suami.totalDate || 0}\n`;

        return m.reply(text);
    } catch (err) {
        console.error('suamiku error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
