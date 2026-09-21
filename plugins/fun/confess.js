import { createConfess, buildConfessLogMessage } from '../../lib/confessStore.js';
import { getConfessConfig } from '../../lib/confessConfigStore.js';

const pluginConfig = {
    name: 'confess',
    alias: ['anonim'],
    category: 'fun',
    description: 'Kirim confess anonim (pesan dan/atau gambar) ke channel confess server ini',
    usage:
        '/confess pesan:<teks> image:<gambar>  — isi salah satu atau dua-duanya\n' +
        '.confess <teks>  — bisa lampirin gambar langsung di pesan Discord-nya',
    example: '/confess pesan: Aku suka warna biru',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true,
    // 🎛️ Opsi khusus buat slash command: /confess pesan:... image:...
    // (bukan pakai opsi generik "input" bawaan)
    slashOptions: [
        { name: 'pesan', type: 'string', description: 'Isi pesan confess kamu', required: false },
        { name: 'image', type: 'attachment', description: 'Gambar buat confess', required: false },
    ],
};

async function handler(m, { args }) {
    const isSlash = !!m.slashOptions;

    let confessMessage = '';
    let imageUrl = null;

    if (isSlash) {
        confessMessage = (m.slashOptions.getString('pesan') || '').trim();
        const attachment = m.slashOptions.getAttachment('image');
        if (attachment) imageUrl = attachment.url;
    } else {
        confessMessage = (args || []).join(' ').trim();
        const attachment = m.attachments?.first?.();
        if (attachment) imageUrl = attachment.url;
    }

    // 📮 Slash command dibales ephemeral (cuma keliatan sama pengirim); prefix command gak bisa
    // ephemeral (itu Message beneran, bukan interaction), jadi tetep reply biasa.
    const reply = (payload) => m.reply(isSlash ? { ...payload, ephemeral: true } : payload);

    if (!confessMessage && !imageUrl) {
        return reply({
            content:
                `💌 *CONFESS*\n\n` +
                `Isi minimal salah satu ya: pesan atau gambar!\n\n` +
                `Slash: \`/confess pesan:<teks>\` dan/atau pilih \`image:\`\n` +
                `Prefix: \`.confess <teks>\` (bisa lampirin gambar juga di pesannya)`,
        });
    }

    if (confessMessage.length > 2000) {
        return reply({ content: '❌ Pesan terlalu panjang! Maksimal 2000 karakter.' });
    }

    if (!m.guild) {
        return reply({ content: '❌ Fitur ini cuma bisa dipakai di dalam server.' });
    }

    const cfg = getConfessConfig(m.guild.id);

    if (!cfg.approvalChannelId) {
        return reply({ content: '❌ Fitur confess belum di-setup di server ini. Minta admin jalanin `.confession` dulu ya!' });
    }

    const logChannel = await m.client.channels.fetch(cfg.approvalChannelId).catch(() => null);

    if (!logChannel) {
        return reply({ content: '❌ Channel approval confess tidak ditemukan lagi! Minta admin setting ulang lewat `.confession`.' });
    }

    try {
        const confessId = createConfess(m.author.id, confessMessage, imageUrl);
        const logPayload = buildConfessLogMessage(confessId, m.author, confessMessage, imageUrl);

        await logChannel.send(logPayload);

        await reply({
            content:
                `**SYSTEM**\n` +
                `pesan: ${confessMessage || '_(kosong)_'}\n` +
                `image: ${imageUrl || '_(kosong)_'}\n\n` +
                `✅ Confess kamu udah dikirim, tunggu di-approve staff yaa~ 🌸`,
        });
    } catch (e) {
        console.error('Confess Plugin Error:', e);
        reply({ content: `❌ Error: ${e.message}` });
    }
}

export { pluginConfig as config, handler };
