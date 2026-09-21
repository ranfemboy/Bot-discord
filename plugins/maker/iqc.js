import { createIqcJob, buildInitialIqcMessage } from '../../lib/iqcStore.js';

const pluginConfig = {
    name: 'iqc',
    alias: ['iqchat', 'iphonechat'],
    category: 'maker',
    description: 'Membuat gambar chat iPhone style (pilih tema Biasa/Pink)',
    usage: '.iqc <text>',
    example: '.iqc Hai cantik',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true,
};

async function handler(m, { args, prefix }) {
    const text = args.join(' ');
    if (!text) {
        return m.reply(
            `📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\n> Masukkan teks untuk chat\n\n\`Contoh: ${prefix}iqc Hai cantik\``
        );
    }

    try {
        const jobId = createIqcJob(text, m.author.id);
        await m.reply(buildInitialIqcMessage(jobId));
    } catch (error) {
        console.error('[IQC]', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
