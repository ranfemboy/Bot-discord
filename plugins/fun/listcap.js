/**
 * Listcap — Discord version
 * -----------------------------
 * Menampilkan semua cap/julukan yang lagi aktif di server ini, dengan
 * mention (tag) usernya masing-masing.
 */
import { EmbedBuilder } from 'discord.js';
import { listCaps } from '../../lib/capStore.js';

export const config = {
    name: 'listcap',
    alias: ['capsaja', 'daftarcap'],
    category: 'fun',
    description: 'Melihat daftar cap/julukan yang aktif di server ini',
    usage: '.listcap',
    example: '.listcap',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m) {
    const caps = listCaps(m.guild.id);

    if (!caps.length) {
        return m.reply('📭 Belum ada yang di-cap di server ini.');
    }

    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('📋 Daftar Cap/Julukan')
        .setDescription(
            caps
                .sort((a, b) => b.setAt - a.setAt)
                .map((c, i) => `${i + 1}. <@${c.userId}> → **${c.label}**`)
                .join('\n')
        )
        .setFooter({ text: `Total: ${caps.length} cap aktif` });

    await m.reply({ embeds: [embed] });
}
