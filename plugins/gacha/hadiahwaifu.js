/**
 * Hadiah Waifu — Discord version
 * -----------------------------
 * Kasih hadiah ke istri kamu, affection yang didapat lebih besar dari
 * kencan tapi biayanya juga lebih mahal. Nambah totalGift + affection ke
 * object istri yang lagi dinikahi.
 */
import { getUser as getEconomyUser, removeMoney } from '../../lib/economyStore.js';
import { getUser, updateIstriStats } from '../../lib/waifuStore.js';
import { getRank } from '../../lib/waifuData.js';

const GIFT_COST = 3000; // 💵 biaya sekali kasih hadiah
const AFFECTION_MIN = 15;
const AFFECTION_MAX = 30;

// 🎁 Jenis hadiah random biar gak monoton
const GIFTS = [
    '💐 Buket bunga mawar',
    '🍫 Sekotak coklat premium',
    '🧸 Boneka beruang lucu',
    '📿 Kalung berlian',
    '💍 Cincin promise',
    '👗 Baju rancangan designer',
    '🎀 Kado misterius yang dibungkus rapi',
    '💌 Surat cinta tulisan tangan',
];

export const config = {
    name: 'hadiahwaifu',
    alias: ['giftwaifu'],
    category: 'gacha',
    description: 'Kasih hadiah ke istri kamu buat nambah affection',
    usage: '.hadiahwaifu',
    example: '.hadiahwaifu',
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

        if (!user.istri?.name) {
            return m.reply('💔 Kamu belum punya istri.\n\nGunakan *.nikahwaifu <nama>* terlebih dahulu.');
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
        const istri = updateIstriStats(m.guild.id, m.author.id, { affectionDelta: gained, giftDelta: 1 });

        let text = `🎁 *HADIAH TERKIRIM* 🎁\n\n`;
        text += `Kamu ngasih ${gift} ke *${istri.name}*.\n\n`;
        text += `💞 Affection : +${gained} (Total: ${istri.affection})\n`;
        text += `💕 Rank Hubungan : ${getRank(istri.affection)}\n`;
        text += `🎁 Total Hadiah : ${istri.totalGift}\n`;
        text += `💸 Sisa Uang : ${(economyUser.money - GIFT_COST).toLocaleString('id-ID')} 💵`;

        return m.reply(text);
    } catch (err) {
        console.error('hadiahwaifu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
