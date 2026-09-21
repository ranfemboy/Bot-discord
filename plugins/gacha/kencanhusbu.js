/**
 * Kencan Husbu — Discord version
 * -----------------------------
 * Versi cowok dari kencanwaifu.js
 */
import { getUser as getEconomyUser, removeMoney } from '../../lib/economyStore.js';
import { getUser, updateSuamiStats } from '../../lib/husbuStore.js';
import { getRank } from '../../lib/husbuData.js';

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
    name: 'kencanhusbu',
    alias: ['datehusbu'],
    category: 'gacha',
    description: 'Ajak suami kamu kencan buat nambah affection',
    usage: '.kencanhusbu',
    example: '.kencanhusbu',
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

        if (!user.suami?.name) {
            return m.reply('💔 Kamu belum punya suami.\n\nGunakan *.nikahhusbu <nama>* terlebih dahulu.');
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
        const suami = updateSuamiStats(m.guild.id, m.author.id, { affectionDelta: gained, dateDelta: 1 });

        let text = `💑 *KENCAN BERHASIL* 💑\n\n`;
        text += `${spot} bareng *${suami.name}*.\n\n`;
        text += `💞 Affection : +${gained} (Total: ${suami.affection})\n`;
        text += `💕 Rank Hubungan : ${getRank(suami.affection)}\n`;
        text += `🌆 Total Kencan : ${suami.totalDate}\n`;
        text += `💸 Sisa Uang : ${(economyUser.money - DATE_COST).toLocaleString('id-ID')} 💵`;

        return m.reply(text);
    } catch (err) {
        console.error('kencanhusbu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
