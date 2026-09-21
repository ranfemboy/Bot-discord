/**
 * Cap / Julukan — Discord version
 * -----------------------------
 * Fitur baru sesuai cap.txt: `.cap @user <julukan>` kasih julukan ke
 * seseorang. Selanjutnya tiap kali orang itu chat, bot bakal nyeletuk
 * pakai julukannya (dieksekusi oleh plugins/event/capWatcher.js).
 */
import { setCap, removeCap, getCap } from '../../lib/capStore.js';

export const config = {
    name: 'cap',
    alias: ['julukan'],
    category: 'fun',
    description: 'Kasih julukan ke user, bot bakal nyeletuk tiap dia chat',
    usage: '.cap @user <julukan> / .cap del @user',
    example: '.cap @Udin Bocah',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { args, prefix }) {
    const target = m.mentions.users.first();

    if (args[0]?.toLowerCase() === 'del') {
        const delTarget = m.mentions.users.first();
        if (!delTarget) return m.reply(`❌ Mention user yang mau dihapus cap-nya.\n\n> \`${prefix}cap del @user\``);
        const removed = removeCap(m.guild.id, delTarget.id);
        return m.reply(removed ? `✅ Cap untuk <@${delTarget.id}> berhasil dihapus.` : `❌ <@${delTarget.id}> belum punya cap.`);
    }

    if (!target) {
        return m.reply(
            `⚠️ **CARA PAKAI**\n\n` +
            `> \`${prefix}cap @user <julukan>\`\n` +
            `> \`${prefix}cap del @user\`\n\n` +
            `Contoh: \`${prefix}cap @Udin Bocah\``
        );
    }

    const label = args.slice(1).join(' ').trim();
    if (!label) return m.reply(`❌ Sertakan julukannya.\n\n> \`${prefix}cap @user <julukan>\``);

    if (target.bot) return m.reply('❌ Gak bisa ngasih cap ke bot!');

    const existing = getCap(m.guild.id, target.id);
    setCap(m.guild.id, target.id, label, m.author.id);

    await m.reply(
        existing
            ? `✅ Cap <@${target.id}> diubah jadi **${label}**!`
            : `✅ <@${target.id}> telah di-cap sebagai **${label}**!`
    );
}
