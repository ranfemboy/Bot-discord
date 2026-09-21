/**
 * HD / Remini Image Enhancer — Discord version
 * ---------------------------------------------
 * Backend: api-faa.my.id (hdv2) — butuh URL gambar publik, bukan upload file langsung.
 *
 * Beda sama versi WhatsApp aslinya: di Discord kita GAK PERLU re-upload gambar ke
 * host pihak ketiga (fastpic/node-upload-images) dulu, soalnya attachment Discord
 * ITU SENDIRI udah punya URL publik (CDN Discord) yang bisa langsung dipassing ke API.
 * Jadi dependency `node-upload-images` gak dipakai lagi di versi ini.
 *
 * Usage:
 * - Kirim gambar dengan caption .remini
 * - Reply pesan yang berisi gambar lalu ketik .remini
 */

import axios from 'axios';
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';

export const config = {
    name: 'remini',
    alias: ['hd', 'enhance', 'upscale'],
    category: 'tools',
    description: 'Enhance gambar menjadi HD',
    usage: '.remini (kirim/reply gambar)',
    example: '.remini',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true,
};

/**
 * Panggil api-faa.my.id buat upscale gambar dari URL publik (Discord CDN URL langsung dipakai).
 * @param {string} imageUrl - URL gambar publik (attachment.url dari Discord)
 * @returns {Promise<string>} URL hasil gambar yang udah di-upscale
 */
async function upscaleImage(imageUrl) {
    const apiUrl = `https://api-faa.my.id/faa/hdv2?url=${encodeURIComponent(imageUrl)}`;

    let res;
    try {
        res = await axios.get(apiUrl, { timeout: 30000 });
    } catch (err) {
        throw new Error('Gagal menghubungi API upscale, coba lagi nanti.');
    }

    if (!res.data?.status || !res.data?.result) {
        throw new Error('Gagal melakukan upscale, coba lagi.');
    }

    return res.data.result;
}

/**
 * Mencari attachment gambar dari:
 * 1. Pesan command
 * 2. Pesan yang di-reply
 */
async function findImage(m) {
    const attachment = m.attachments?.find((a) =>
        a.contentType?.startsWith('image/')
    );

    if (attachment) {
        return attachment;
    }

    if (m.reference?.messageId) {
        try {
            const replied = await m.channel.messages.fetch(
                m.reference.messageId
            );

            const repliedAttachment = replied.attachments.find((a) =>
                a.contentType?.startsWith('image/')
            );

            if (repliedAttachment) {
                return repliedAttachment;
            }
        } catch (err) {
            console.error('[Remini] Failed to fetch replied message:', err);
        }
    }

    return null;
}

export async function handler(m) {
    const image = await findImage(m);

    if (!image) {
        return m.reply(
            `🖼️ **HD IMAGE**\n\n` +
            `Reply gambar yang mau dijernihkan atau kirim gambar dengan caption \`.remini\`.`
        );
    }

    const loading = await m.reply('🕕 **Sedang menjernihkan gambar...**');

    try {
        const resultUrl = await upscaleImage(image.url);

        const resultResponse = await fetch(resultUrl);
        if (!resultResponse.ok) {
            throw new Error(
                `Gagal mengambil hasil gambar: ${resultResponse.status} ${resultResponse.statusText}`
            );
        }
        const enhancedBuffer = Buffer.from(await resultResponse.arrayBuffer());

        const attachment = new AttachmentBuilder(
            enhancedBuffer,
            {
                name: 'remini-enhanced.jpg',
            }
        );

        const embed = new EmbedBuilder()
            .setColor('#00C2A8')
            .setTitle('✨ Remini / HD Result')
            .setDescription(
                'Gambar berhasil di-upscale dan dijernihkan.'
            )
            .setImage('attachment://remini-enhanced.jpg')
            .setTimestamp();

        await loading.edit({
            content: '',
            embeds: [embed],
            files: [attachment],
        });

    } catch (err) {
        console.error('[HD Error]', err);

        await loading.edit(
            `❌ **Gagal memproses gambar**\n\n` +
            `> ${err.message || 'Terjadi kesalahan saat memproses gambar.'}`
        );
    }
}