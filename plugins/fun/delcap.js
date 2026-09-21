/**
 * Delcap — Discord version
 * -----------------------------
 * Command terpisah buat hapus cap/julukan (selain lewat `.cap del @user`
 * yang udah ada, sesuai request supaya ada command khusus).
 */
import { getCap, removeCap } from '../../lib/capStore.js';

export const config = {
    name: 'delcap',
    alias: ['hapuscap', 'uncap'],
    category: 'fun',
    description: 'Menghapus cap/julukan seseorang',
    usage: '.delcap @user',
    example: '.delcap @Udin',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { prefix }) {
    const target = m.mentions.users.first();

    if (!target) {
        return m.reply(`❌ Mention user yang mau dihapus cap-nya.\n\n> \`${prefix}delcap @user\``);
    }

    const cap = getCap(m.guild.id, target.id);
    if (!cap) {
        return m.reply(`❌ <@${target.id}> belum punya cap/julukan.`);
    }

    removeCap(m.guild.id, target.id);
    await m.reply(`✅ Cap **${cap.label}** untuk <@${target.id}> berhasil dihapus.`);
}
