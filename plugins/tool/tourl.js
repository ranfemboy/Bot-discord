/**
 * To URL — Discord version
 * -----------------------------
 * Dikonversi dari tourl.js (plugin WA pakai downloadMediaMessage/sock).
 * Di Discord tinggal ambil attachment (dari pesan sendiri atau yang
 * di-reply), download buffer-nya lewat axios, terus upload ke beberapa
 * host gratisan lewat lib/uploaderApi.js.
 */
import axios from 'axios';
import { EmbedBuilder } from 'discord.js';
import { uploadToAllHosts } from '../../lib/uploaderApi.js';

export const config = {
    name: 'tourl',
    alias: ['upload', 'catbox', 'url'],
    category: 'tool',
    description: 'Upload media (reply/kirim) ke beberapa host dan dapatkan link URL',
    usage: '.tourl (reply/kirim media)',
    example: '.tourl',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true,
};

async function findAttachment(m) {
    const fromMsg = m.attachments.first();
    if (fromMsg) return fromMsg;

    if (m.reference) {
        try {
            const replied = await m.channel.messages.fetch(m.reference.messageId);
            const fromReply = replied.attachments.first();
            if (fromReply) return fromReply;
        } catch {
            // pesan yang di-reply gak ketemu/udah dihapus
        }
    }
    return null;
}

export async function handler(m, { prefix }) {
    const attachment = await findAttachment(m);

    if (!attachment) {
        return m.reply(
            `📤 **MEDIA UPLOADER**\n\n` +
            `Butuh link untuk media kamu? Bisa dibantu upload ke beberapa server gratisan!\n\n` +
            `**Cara Pakai:**\n` +
            `👉 Kirim media dengan caption \`${prefix}tourl\`\n` +
            `👉 Atau reply media yang udah ada dengan \`${prefix}tourl\``
        );
    }

    const loadingMsg = await m.reply('🕕 Lagi mengunggah ke beberapa server...');

    try {
        const { data: buffer } = await axios.get(attachment.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
        });

        const { results, failed } = await uploadToAllHosts(Buffer.from(buffer), attachment.name || 'file');

        if (results.length === 0) {
            return loadingMsg.edit(`❌ Semua server gagal upload!\n\n> Gagal di: ${failed.join(', ')}`);
        }

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('🚀 Upload Berhasil!')
            .setDescription(
                results
                    .map((r) => `☁️ **${r.host}** (${r.expires})\n${r.url}`)
                    .join('\n\n')
            )
            .setFooter({ text: failed.length ? `Gagal di: ${failed.join(', ')}` : 'Semua host berhasil' })
            .setTimestamp();

        await loadingMsg.edit({ content: '', embeds: [embed] });
    } catch (error) {
        console.error('ToURL Error:', error);
        await loadingMsg.edit('❌ *GAGAL*\n\n> ' + error.message);
    }
}
