/**
 * Kencan Waifu — Discord version
 * -----------------------------
 * Ajak istri kamu kencan buat nambah affection. Keluar biaya dari
 * economyStore (sama kayak .gachawaifu, dll), dan nambah totalDate + affection
 * ke object istri yang lagi dinikahi.
 */
import { getUser as getEconomyUser, removeMoney } from '../../lib/economyStore.js';
import { getUser, updateIstriStats } from '../../lib/waifuStore.js';
import { getRank } from '../../lib/waifuData.js';

const DATE_COST = 1500; // 💵 biaya sekali kencan
const AFFECTION_MIN = 5;
const AFFECTION_MAX = 15;

// 🌆 Lokasi kencan random biar gak monoton
const DATE_SPOTS = [
    '🎬 Nonton film bareng di bioskop',
    '🍜 Makan ramen hangat berdua',
    '🌳 Jalan-jalan santai di taman kota',
    '🎡 Naik bianglala sambil ngobrol',
    '☕ Ngopi santai di kafe pinggir jalan',
    '🛍️ Belanja bareng ke mall',
    '🌅 Piknik sore sambil nunggu matahari terbenam',
    '🎮 Main game bareng semaleman',
];

export const config = {
    name: 'kencanwaifu',
    alias: ['datewaifu'],
    category: 'gacha',
    description: 'Ajak istri kamu kencan buat nambah affection',
    usage: '.kencanwaifu',
    example: '.kencanwaifu',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3600, // ⏳ 1 jam sekali biar berasa spesial, gak dispam
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
        if (economyUser.money < DATE_COST) {
            return m.reply(
                `❌ Uang kamu gak cukup buat kencan.\n\n` +
                `💸 Biaya : ${DATE_COST.toLocaleString('id-ID')} 💵\n` +
                `💰 Uang kamu : ${economyUser.money.toLocaleString('id-ID')} 💵`
            );
        }

        removeMoney(m.guild.id, m.author.id, DATE_COST);

        const gained = Math.floor(Math.random() * (AFFECTION_MAX - AFFECTION_MIN + 1)) + AFFECTION_MIN;
        const spot = DATE_SPOTS[Math.floor(Math.random() * DATE_SPOTS.length)];
        const istri = updateIstriStats(m.guild.id, m.author.id, { affectionDelta: gained, dateDelta: 1 });

        let text = `💑 *KENCAN BERHASIL* 💑\n\n`;
        text += `${spot} bareng *${istri.name}*.\n\n`;
        text += `💞 Affection : +${gained} (Total: ${istri.affection})\n`;
        text += `💕 Rank Hubungan : ${getRank(istri.affection)}\n`;
        text += `🌆 Total Kencan : ${istri.totalDate}\n`;
        text += `💸 Sisa Uang : ${(economyUser.money - DATE_COST).toLocaleString('id-ID')} 💵`;

        return m.reply(text);
    } catch (err) {
        console.error('kencanwaifu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
