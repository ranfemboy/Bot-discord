/**
 * AFK — Discord version
 * -----------------------------
 * Dikonversi dari source code yang dikasih (WA-based, global.afkStorage +
 * `checkAfk` terpisah). Di bot ini:
 * - command `.afk` di file ini cuma buat SET status AFK.
 * - deteksi "user kembali" & "user yang di-mention lagi AFK" dipindah ke
 *   plugins/event/afkWatcher.js (event-based, jalan di semua pesan)
 *   karena command handler cuma jalan untuk pesan yang diawali prefix,
 *   sementara AFK harus kedeteksi di SEMUA pesan biasa juga.
 */
import { setAfkUser } from '../../lib/afkStore.js';

export const config = {
    name: 'afk',
    alias: ['away', 'brb'],
    category: 'group',
    description: 'Set status AFK dengan alasan',
    usage: '.afk <alasan>',
    example: '.afk lagi makan',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { args }) {
    const reason = args.join(' ') || 'Tidak ada alasan';
    setAfkUser(m.author.id, reason);

    await m.reply(
        `💤 *ᴀꜰᴋ ᴀᴋᴛɪꜰ*\n\n` +
        `\`\`\`${m.author.username} sekarang AFK\`\`\`\n` +
        `🍀 \`Alasan:\` *${reason}*\n\n` +
        `_Ketik apapun untuk menonaktifkan AFK._`
    );
}
