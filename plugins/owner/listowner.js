import { EmbedBuilder } from 'discord.js';
import { listOwners } from '../../lib/ownerStore.js';
import settings from '../../setting.js';

const pluginConfig = {
    name: 'listowner',
    alias: ['ownerlist'],
    category: 'owner',
    description: 'Melihat daftar owner utama dan owner tambahan bot',
    usage: '.listowner',
    example: '.listowner',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

async function handler(m) {
    try {
        const extraOwners = listOwners();

        const lines = [`1. <@${settings.idOwner}> — ⭐ Owner Utama`];
        extraOwners.forEach((o, i) => {
            lines.push(`${i + 2}. <@${o.userId}> — 👑 ditambahkan <t:${Math.floor(o.addedAt / 1000)}:R>`);
        });

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle(`👑 DAFTAR OWNER (${extraOwners.length + 1})`)
            .setDescription(lines.join('\n'))
            .setFooter({ text: '⭐ Utama (dari config) | 👑 Tambahan (bisa dicabut)' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Listowner Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
