/**
 * Cerai Husbu — Discord version
 * -----------------------------
 * Versi cowok dari ceraiwaifu.js
 */
import { getUser, clearSuami, releaseHusbuMarriage } from '../../lib/husbuStore.js';

export const config = {
    name: 'ceraihusbu',
    alias: ['ceraihusband', 'divorcehusbu'],
    category: 'gacha',
    description: 'Menceraikan suami',
    usage: '.ceraihusbu',
    example: '.ceraihusbu',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m) {
    try {
        const user = getUser(m.guild.id, m.author.id);

        if (!user.suami?.name) {
            return m.reply('💔 Kamu belum memiliki suami.');
        }

        const namaSuami = user.suami.name;
        clearSuami(m.guild.id, m.author.id);
        releaseHusbuMarriage(m.guild.id, namaSuami); // 🔓 husbu ini balik jadi "rebutan" lagi

        let text = `💔 *PERCERAIAN BERHASIL* 💔\n\n`;
        text += `Kamu resmi berpisah dengan *${namaSuami}*.\n\n`;
        text += `Sekarang kamu kembali menjadi jomblo. 🥲`;

        return m.reply(text);
    } catch (err) {
        console.error('ceraihusbu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
