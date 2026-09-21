/**
 * Remove Background — Discord version
 * -----------------------------
 * Dikonversi dari removebackground.js (module.exports/ctx-based, WA).
 *
 * 🐛 FIX: API `api.nexray.eu.cc/tools/removebg` itu BUKAN API yang balikin
 * JSON — dia langsung ngasih GAMBAR HASIL di URL itu sendiri begitu diakses
 * (generate-on-fetch), persis kayak cara plugin WA aslinya makai (dipasang
 * langsung sebagai `document.url`). Versi sebelumnya salah nganggep ini API
 * JSON (`data.result`) makanya selalu gagal. Sekarang URL-nya langsung
 * dipasang ke `.setImage()`, Discord yang fetch gambarnya sendiri.
 */
import { EmbedBuilder } from 'discord.js';

export const config = {
    name: 'removebackground',
    alias: ['removebg', 'rmbg'],
    category: 'tool',
    description: 'Menghapus background gambar secara otomatis',
    usage: '.removebg (kirim gambar / reply gambar)',
    example: '.removebg',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true,
};

async function findImageUrl(m) {
    const fromMsg = m.attachments.find((a) => a.contentType?.startsWith('image/'));
    if (fromMsg) return fromMsg.url;

    if (m.reference) {
        try {
            const replied = await m.channel.messages.fetch(m.reference.messageId);
            const fromReply = replied.attachments.find((a) => a.contentType?.startsWith('image/'));
            if (fromReply) return fromReply.url;
        } catch {
            // pesan yang di-reply gak ketemu/udah dihapus
        }
    }
    return null;
}

export async function handler(m) {
    const imageUrl = await findImageUrl(m);

    if (!imageUrl) {
        return m.reply('🖼️ Kirim gambar dengan caption `.removebg`, atau reply ke pesan yang ada gambarnya lalu ketik `.removebg` ya~');
    }

    const loadingMsg = await m.reply('⏳ Lagi menghapus background...');

    try {
        const resultUrl = `https://api.nexray.eu.cc/tools/removebg?url=${encodeURIComponent(imageUrl)}`;

        const embed = new EmbedBuilder()
            .setColor('#00C2A8')
            .setTitle('✂️ Remove Background Result')
            .setImage(resultUrl)
            .setFooter({ text: 'Kalau gambar gak muncul, kemungkinan gambar sumbernya gagal diproses' })
            .setTimestamp();

        await loadingMsg.edit({ content: '', embeds: [embed] });
    } catch (error) {
        console.error('RemoveBG Error:', error);
        await loadingMsg.edit('❌ *GAGAL*\n\n> ' + error.message);
    }
}
