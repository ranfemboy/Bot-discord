import { EmbedBuilder } from 'discord.js';
import { addOwner, isExtraOwner } from '../../lib/ownerStore.js';

const pluginConfig = {
    name: 'addowner',
    alias: ['addown', 'setowner'],
    category: 'owner',
    description: 'Menambahkan user jadi Owner tambahan (khusus owner utama)',
    usage: '.addowner @user',
    example: '.addowner @Budi',
    isOwner: true, // cuma idOwner utama yang boleh nambah owner baru
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
            return m.reply('❌ Mention user yang mau dijadiin Owner tambahan!\n\n> `.addowner @user`');
        }
        if (target.bot) {
            return m.reply('❌ Bot gak bisa dijadiin Owner.');
        }
        if (isExtraOwner(target.id)) {
            return m.reply(`❌ ${target} udah jadi Owner tambahan.`);
        }

        addOwner(target.id, m.author.id);

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('👑 OWNER DITAMBAHKAN')
            .setDescription(`${target} sekarang jadi **Owner tambahan** bot.`)
            .setFooter({ text: `Ditambahkan oleh ${m.author.username}` })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Addowner Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
