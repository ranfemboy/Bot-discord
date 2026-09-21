/**
 * Add Respon — Owner Only
 * -----------------------------
 * Fitur baru sesuai addrespon.txt: nambahin trigger auto-respon custom.
 * Support teks, sticker (Discord message.stickers), dan media (attachment
 * dari pesan yang di-reply). Auto-respon-nya sendiri dieksekusi oleh
 * plugins/event/autoresponder.js (event-based, jalan di setiap pesan masuk).
 */
import { addResponse, removeResponse, listResponses } from '../../lib/autoResponStore.js';

export const config = {
    name: 'addrespon',
    alias: [],
    category: 'owner',
    description: 'Menambahkan trigger auto-respon custom (khusus owner)',
    usage:
        '.addrespon <trigger> | <teks>\n' +
        '.addrespon <trigger> | sticker (reply sticker)\n' +
        '.addrespon <trigger> | media (reply foto/video/gif)\n' +
        '.addrespon list\n' +
        '.addrespon del <trigger>',
    example: '.addrespon pagi | pagi juga!',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
};

async function getRepliedMessage(m) {
    if (!m.reference) return null;
    try {
        return await m.channel.messages.fetch(m.reference.messageId);
    } catch {
        return null;
    }
}

export async function handler(m, { args, prefix }) {
    const raw = args.join(' ');
    const subcommand = (args[0] || '').toLowerCase();

    if (subcommand === 'list') {
        const responses = listResponses(m.guild.id);
        if (!responses.length) return m.reply('📭 Belum ada trigger auto-respon di server ini.');
        return m.reply(
            `📋 **DAFTAR AUTO-RESPON**\n\n` +
            responses.map((r, i) => `${i + 1}. \`${r.trigger}\` → *(${r.type})*`).join('\n')
        );
    }

    if (subcommand === 'del' || subcommand === 'delete' || subcommand === 'remove') {
        const trigger = args.slice(1).join(' ');
        if (!trigger) return m.reply(`❌ Sertakan trigger yang mau dihapus.\n\n> \`${prefix}addrespon del <trigger>\``);
        const removed = removeResponse(m.guild.id, trigger);
        return m.reply(removed ? `✅ Trigger \`${trigger}\` berhasil dihapus.` : `❌ Trigger \`${trigger}\` tidak ditemukan.`);
    }

    if (!raw.includes('|')) {
        return m.reply(
            `⚠️ **CARA PAKAI**\n\n` +
            `> \`${prefix}addrespon trigger | teks\`\n` +
            `> \`${prefix}addrespon trigger | sticker\` *(reply sticker)*\n` +
            `> \`${prefix}addrespon trigger | media\` *(reply foto/video/gif)*\n` +
            `> \`${prefix}addrespon list\`\n` +
            `> \`${prefix}addrespon del <trigger>\``
        );
    }

    const [triggerPart, ...replyParts] = raw.split('|');
    const trigger = triggerPart.trim();
    const replyMode = replyParts.join('|').trim();

    if (!trigger) return m.reply('❌ Trigger tidak boleh kosong.');
    if (!replyMode) return m.reply('❌ Isi respon tidak boleh kosong.');

    const replyModeLower = replyMode.toLowerCase();

    // Mode sticker: ambil dari sticker pesan yang di-reply
    if (replyModeLower === 'sticker') {
        const replied = await getRepliedMessage(m);
        const sticker = replied?.stickers?.first();
        if (!sticker) {
            return m.reply('❌ Reply ke pesan yang ada sticker-nya dulu, baru pakai `| sticker`.');
        }
        // Disimpan pakai sticker.id (bukan URL) karena Discord cuma bisa "kirim ulang"
        // sticker lewat ID sticker yang beneran ada, bukan lewat URL gambar sembarang.
        addResponse(m.guild.id, trigger, 'sticker', sticker.id, m.author.id);
        return m.reply(`✅ Trigger \`${trigger}\` berhasil ditambahkan (sticker)!`);
    }

    // Mode media: ambil dari attachment pesan yang di-reply
    if (replyModeLower === 'media') {
        const replied = await getRepliedMessage(m);
        const attachment = replied?.attachments?.first();
        if (!attachment) {
            return m.reply('❌ Reply ke pesan yang ada foto/video/gif-nya dulu, baru pakai `| media`.');
        }
        addResponse(m.guild.id, trigger, 'media', attachment.url, m.author.id);
        return m.reply(`✅ Trigger \`${trigger}\` berhasil ditambahkan (media)!`);
    }

    // Mode teks biasa
    addResponse(m.guild.id, trigger, 'text', replyMode, m.author.id);
    return m.reply(`✅ Trigger \`${trigger}\` berhasil ditambahkan!\n> Respon: ${replyMode}`);
}
