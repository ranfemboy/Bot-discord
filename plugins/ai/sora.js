/**
 * Sora — AI Chat Persona — Discord version
 * -----------------------------
 * Dikonversi dari plugin WA mio.js (module.exports/ctx-based) ke format
 * command Discord.js bot ini. Nama file tetap mio.js sesuai file asli yang
 * di-upload, tapi nama command-nya "sora" (samain dengan `name: "sora"` di
 * config asli).
 */
import { askSora, resetChat } from '../../lib/soraChatStore.js';

export const config = {
    name: 'sora',
    alias: ['mio'],
    category: 'ai',
    description: 'Ngobrol sama Sora, AI persona anime yang tsundere & imut',
    usage: '.sora <teks> / .sora reset',
    example: '.sora halo sora!',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true,
};

export async function handler(m, { args, prefix }) {
    const input = args.join(' ').trim();

    if (!input) {
        return m.reply(
            `🌸 **SORA**\n\n` +
            `Kirim pesan buat ngobrol sama Sora.\n\n` +
            `> \`${prefix}sora <teks>\`\n` +
            `> \`${prefix}sora reset\` — reset riwayat percakapan\n\n` +
            `Contoh: \`${prefix}sora halo sora!\``
        );
    }

    if (input.toLowerCase() === 'reset') {
        resetChat(m.author.id);
        return m.reply('🔄 Percakapan dengan Sora direset!');
    }

    const typingMsg = await m.reply('💬 Sora lagi mikir...');

    try {
        const answer = await askSora(m.author.id, input);
        await typingMsg.edit(answer || '...');
    } catch (error) {
        console.error('Sora Error:', error);
        await typingMsg.edit('❌ *GAGAL*\n\n> ' + error.message);
    }
}
