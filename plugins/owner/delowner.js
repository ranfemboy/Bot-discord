import { EmbedBuilder } from 'discord.js';
import { removeOwner } from '../../lib/ownerStore.js';

const pluginConfig = {
    name: 'delowner',
    alias: ['delown', 'dedown'],
    category: 'owner',
    description: 'Mencabut status Owner tambahan dari user (khusus owner utama)',
    usage: '.delowner @user',
    example: '.delowner @Budi',
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
        const target = m.mentions.users.first();
        if (!target) {
            return m.reply('❌ Mention user yang mau dicabut status Owner-nya!\n\n> `.delowner @user`');
        }

        const success = removeOwner(target.id);
        if (!success) {
            return m.reply(`❌ ${target} bukan Owner tambahan. (Owner utama gak bisa dicabut lewat command ini)`);
        }

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('👑 OWNER DICABUT')
            .setDescription(`${target} udah bukan Owner tambahan lagi.`)
            .setFooter({ text: `Dicabut oleh ${m.author.username}` })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Delowner Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
