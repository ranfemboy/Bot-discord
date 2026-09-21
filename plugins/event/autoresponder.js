/**
 * Auto Responder — Event Plugin
 * -----------------------------
 * Menjalankan fitur addrespon.txt: setiap pesan masuk dicek ke
 * lib/autoResponStore.js, kalau isinya PERSIS sama dengan salah satu
 * trigger yang terdaftar, bot otomatis balas (teks/sticker/media).
 *
 * Di-bind lewat sistem event plugin bot ini (lihat handler/pluginLoader.js
 * -> bindEventPlugins), jadi jalan BERBARENGAN dengan handler command biasa
 * di handler/messageHandler.js, tanpa perlu ubah file itu sama sekali.
 */
import { findResponse } from '../../lib/autoResponStore.js';

const pluginConfig = {
    name: 'autoresponder',
    alias: [],
    category: 'event',
    description: 'Membalas otomatis pesan yang cocok dengan trigger addrespon',
    usage: 'otomatis (tidak dipanggil via command)',
    example: '-',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

const event = 'messageCreate';

async function handler(message) {
    try {
        if (message.author.bot) return;
        if (!message.guild) return; // fitur ini khusus server, bukan DM
        if (!message.content) return;

        const entry = findResponse(message.guild.id, message.content);
        if (!entry) return;

        if (entry.type === 'text') {
            await message.reply(entry.content);
        } else if (entry.type === 'sticker') {
            await message.reply({ stickers: [entry.content] }).catch(async () => {
                // Sticker mungkin udah dihapus/gak accessible lagi
                await message.reply('⚠️ Sticker auto-respon buat trigger ini udah gak bisa diakses.');
            });
        } else if (entry.type === 'media') {
            await message.reply({ files: [entry.content] });
        }
    } catch (error) {
        console.error('AutoResponder Error:', error);
    }
}

export { pluginConfig as config, event, handler };
