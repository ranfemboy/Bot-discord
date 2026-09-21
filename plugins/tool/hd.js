/**
 * HD / Remini Image Enhancer — Discord version
 * ---------------------------------------------
 * Extracted from ihancer.com scraper/plugin
 *
 * Usage:
 * - Kirim gambar dengan caption .remini
 * - Reply pesan yang berisi gambar lalu ketik .remini
 *
 * @credit: ren-offc
 * @noted: don't delete the credit
 */

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
 * Upload image ke ihancer.com
 * lalu mengambil hasil gambar yang sudah di-enhance.
 */
async function photoihancer(imageBuffer, method = 1) {
    const blob = new Blob([imageBuffer], {
        type: 'image/jpeg',
    });

    const form = new FormData();

    form.set('method', String(method));
    form.set('is_pro_version', 'true');
    form.set('is_enhancing_more', 'false');
    form.set('max_image_size', 'high');
    form.set('file', blob, 'file.jpg');

    const res = await fetch('https://ihancer.com/api/enhance', {
        method: 'POST',
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'Referer': 'https://ihancer.com/app/',
        },
        body: form,
    });

    if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
    }

    return Buffer.from(await res.arrayBuffer());
}

/**
 * Mencari attachment gambar dari:
 * 1. Pesan command
 * 2. Pesan yang di-reply
 */
async function findImage(m) {
    // Cek gambar langsung di pesan command
    const attachment = m.attachments?.find((a) =>
        a.contentType?.startsWith('image/')
    );

    if (attachment) {
        return attachment;
    }

    // Cek pesan yang di-reply
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
        // Download gambar dari Discord
        const response = await fetch(image.url);

        if (!response.ok) {
            throw new Error(
                `Gagal mengambil gambar Discord: ${response.status} ${response.statusText}`
            );
        }

        const imageBuffer = Buffer.from(
            await response.arrayBuffer()
        );

        // Kirim ke ihancer
        const enhancedBuffer = await photoihancer(imageBuffer);

        // Kirim hasil sebagai attachment
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