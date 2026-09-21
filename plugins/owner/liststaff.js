import { EmbedBuilder } from 'discord.js';
import { listStaff } from '../../lib/staffStore.js';

const pluginConfig = {
    name: 'liststaff',
    alias: ['stafflist'],
    category: 'owner',
    description: 'Melihat daftar semua Staff bot (khusus owner)',
    usage: '.liststaff',
    example: '.liststaff',
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
        const staff = listStaff();
        if (!staff.length) {
            return m.reply('📭 Belum ada Staff yang ditambahkan. Pakai `.addstaff @user` buat nambah.');
        }

        const lines = staff.map((s, i) => `${i + 1}. <@${s.userId}> — ditambahkan <t:${Math.floor(s.addedAt / 1000)}:R>`);

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`👔 DAFTAR STAFF (${staff.length})`)
            .setDescription(lines.join('\n'))
            .setFooter({ text: 'Staff cuma bisa akses .addprem' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Liststaff Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
