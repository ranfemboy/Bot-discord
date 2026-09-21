/**
 * Cerai Waifu — Discord version
 * -----------------------------
 * Converted from ESM plugin (m.sender/getDatabase) by Claude
 */
import { getUser, clearIstri, releaseWaifuMarriage } from '../../lib/waifuStore.js';

export const config = {
    name: 'ceraiwaifu',
    alias: ['cerai', 'divorcewaifu'],
    category: 'waifu',
    description: 'Menceraikan istri',
    usage: '.ceraiwaifu',
    example: '.ceraiwaifu',
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

        if (!user.istri?.name) {
            return m.reply('💔 Kamu belum memiliki istri.');
        }

        const namaIstri = user.istri.name;
        clearIstri(m.guild.id, m.author.id);
        releaseWaifuMarriage(m.guild.id, namaIstri); // 🔓 waifu ini balik jadi "rebutan" lagi

        let text = `💔 *PERCERAIAN BERHASIL* 💔\n\n`;
        text += `Kamu resmi berpisah dengan *${namaIstri}*.\n\n`;
        text += `Sekarang kamu kembali menjadi jomblo. 🥲`;

        return m.reply(text);
    } catch (err) {
        console.error('ceraiwaifu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
