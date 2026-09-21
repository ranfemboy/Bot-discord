import { EmbedBuilder } from 'discord.js';
import { removeStaff } from '../../lib/staffStore.js';

const pluginConfig = {
    name: 'delstaff',
    alias: ['removestaff'],
    category: 'owner',
    description: 'Mencabut status Staff dari user (khusus owner)',
    usage: '.delstaff @user',
    example: '.delstaff @Budi',
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
            return m.reply('❌ Mention user yang mau dicabut status Staff-nya!\n\n> `.delstaff @user`');
        }

        const success = removeStaff(target.id);
        if (!success) {
            return m.reply(`❌ ${target} bukan Staff.`);
        }

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('👔 STAFF DICABUT')
            .setDescription(`${target} udah bukan Staff lagi.`)
            .setFooter({ text: `Dicabut oleh ${m.author.username}` })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Delstaff Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
