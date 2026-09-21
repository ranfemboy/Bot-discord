import { EmbedBuilder } from 'discord.js';
import { addStaff, isStaff } from '../../lib/staffStore.js';

const pluginConfig = {
    name: 'addstaff',
    alias: [],
    category: 'owner',
    description: 'Menambahkan user jadi Staff (khusus owner). Staff cuma bisa akses .addprem',
    usage: '.addstaff @user',
    example: '.addstaff @Budi',
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
            return m.reply('❌ Mention user yang mau dijadiin Staff!\n\n> `.addstaff @user`');
        }
        if (target.bot) {
            return m.reply('❌ Bot gak bisa dijadiin Staff.');
        }
        if (isStaff(target.id)) {
            return m.reply(`❌ ${target} udah jadi Staff.`);
        }

        addStaff(target.id, m.author.id);

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('👔 STAFF DITAMBAHKAN')
            .setDescription(`${target} sekarang jadi **Staff** dan cuma bisa akses \`.addprem\`.`)
            .setFooter({ text: `Ditambahkan oleh ${m.author.username}` })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Addstaff Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
