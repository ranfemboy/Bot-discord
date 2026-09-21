import { createRequestFromCommand } from '../../lib/reportStore.js';

const pluginConfig = {
    name: 'req',
    alias: ['request', 'requestfitur'],
    category: 'general',
    description: 'Kirim request fitur / komentar langsung ke owner lewat DM',
    usage: '.req <komentar>',
    example: '.req tambahin fitur auto-role dong pas member baru join',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    isEnabled: true,
};

async function handler(m, { client, settings, args }) {
    const comment = args.join(' ').trim();

    if (!comment) {
        return m.reply(
            `💡 *REQUEST FITUR*\n\n` +
            `Format: \`${settings.prefix}req <komentar>\`\n` +
            `Bisa juga sambil lampirkan foto (attach langsung atau reply ke pesan yang ada fotonya).\n\n` +
            `Contoh: \`${settings.prefix}req tambahin fitur auto-role dong\``
        );
    }

    // 📷 Ambil foto: prioritas dari attachment di pesan command ini,
    // kalau gak ada baru cek dari pesan yang di-reply.
    let imageUrl = null;
    const directAttachment = m.attachments?.find((a) => a.contentType?.startsWith('image/'));

    if (directAttachment) {
        imageUrl = directAttachment.url;
    } else if (m.reference) {
        try {
            const quoted = await m.fetchReference();
            const quotedImage = quoted.attachments?.find((a) => a.contentType?.startsWith('image/'));
            if (quotedImage) imageUrl = quotedImage.url;
        } catch {
            // reply gagal di-fetch, lanjut tanpa foto aja
        }
    }

    try {
        await createRequestFromCommand(m, comment, { client, settings, imageUrl });
        await m.react('✅');
        await m.reply('✅ Request kamu udah dikirim ke owner. Nanti bakal direspon lewat DM ya~ 🌸');
    } catch (error) {
        console.error('Req Plugin Error:', error);
        await m.react('☢');
        await m.reply('❌ *GAGAL*\n\nGagal mengirim request ke owner, coba lagi nanti.');
    }
}

export { pluginConfig as config, handler };