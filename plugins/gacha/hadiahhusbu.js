/**
 * Hadiah Husbu — Discord version
 * -----------------------------
 * Versi cowok dari hadiahwaifu.js
 */
import { getUser as getEconomyUser, removeMoney } from '../../lib/economyStore.js';
import { getUser, updateSuamiStats } from '../../lib/husbuStore.js';
import { getRank } from '../../lib/husbuData.js';

const GIFT_COST = 3000; // 💵 biaya sekali kasih hadiah
const AFFECTION_MIN = 15;
const AFFECTION_MAX = 30;

// 🎁 Jenis hadiah random biar gak monoton
const GIFTS = [
    '💐 Buket bunga mawar',
    '🍫 Sekotak coklat premium',
    '⌚ Jam tangan mewah',
    '📿 Kalung berlian',
    '💍 Cincin promise',
    '👔 Setelan jas rancangan designer',
    '🎀 Kado misterius yang dibungkus rapi',
    '💌 Surat cinta tulisan tangan',
];

export const config = {
    name: 'hadiahhusbu',
    alias: ['gifthusbu'],
    category: 'gacha',
    description: 'Kasih hadiah ke suami kamu buat nambah affection',
    usage: '.hadiahhusbu',
    example: '.hadiahhusbu',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 1800, // ⏳ 30 menit sekali
    energi: 0,
    isEnabled: true,
};

export async function handler(m) {
    try {
        const user = getUser(m.guild.id, m.author.id);

        if (!user.suami?.name) {
            return m.reply('💔 Kamu belum punya suami.\n\nGunakan *.nikahhusbu <nama>* terlebih dahulu.');
        }

        const economyUser = getEconomyUser(m.guild.id, m.author.id);
        if (economyUser.money < GIFT_COST) {
            return m.reply(
                `❌ Uang kamu gak cukup buat beli hadiah.\n\n` +
                `💸 Biaya : ${GIFT_COST.toLocaleString('id-ID')} 💵\n` +
                `💰 Uang kamu : ${economyUser.money.toLocaleString('id-ID')} 💵`
            );
        }

        removeMoney(m.guild.id, m.author.id, GIFT_COST);

        const gained = Math.floor(Math.random() * (AFFECTION_MAX - AFFECTION_MIN + 1)) + AFFECTION_MIN;
        const gift = GIFTS[Math.floor(Math.random() * GIFTS.length)];
        const suami = updateSuamiStats(m.guild.id, m.author.id, { affectionDelta: gained, giftDelta: 1 });

        let text = `🎁 *HADIAH TERKIRIM* 🎁\n\n`;
        text += `Kamu ngasih ${gift} ke *${suami.name}*.\n\n`;
        text += `💞 Affection : +${gained} (Total: ${suami.affection})\n`;
        text += `💕 Rank Hubungan : ${getRank(suami.affection)}\n`;
        text += `🎁 Total Hadiah : ${suami.totalGift}\n`;
        text += `💸 Sisa Uang : ${(economyUser.money - GIFT_COST).toLocaleString('id-ID')} 💵`;

        return m.reply(text);
    } catch (err) {
        console.error('hadiahhusbu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
