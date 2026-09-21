import { EmbedBuilder } from 'discord.js';
import { addMoney, getUser } from '../../lib/economyStore.js';

const pluginConfig = {
    name: 'addmoney',
    alias: ['tambahuang'],
    category: 'owner',
    description: 'Menambahkan uang ke user tertentu (khusus owner)',
    usage: '.addmoney @user <jumlah>',
    example: '.addmoney @Budi 5000',
    isOwner: true,
    isGroup: true,
    isPrivate: false,
    cooldown: 0,
    isEnabled: true,
};

async function handler(m, { args }) {
    try {
        const target = m.mentions.users.first();
        if (!target) {
            return m.reply('❌ Mention user yang mau ditambahkan uangnya!\n\n> `.addmoney @user <jumlah>`');
        }

        const amountArg = args.find((a) => /^\d+$/.test(a.replace(/[.,]/g, '')));
        const amount = parseInt((amountArg || '').replace(/[.,]/g, ''), 10);

        if (!amount || amount <= 0) {
            return m.reply('❌ Masukkan jumlah uang yang valid!\n\n> `.addmoney @user <jumlah>`');
        }

        const user = addMoney(m.guild.id, target.id, amount);

        const embed = new EmbedBuilder()
            .setColor('#00E676')
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('💰 UANG DITAMBAHKAN')
            .addFields(
                { name: '👤 Diberikan Ke', value: `<@${target.id}>`, inline: true },
                { name: '➕ Jumlah', value: `${amount.toLocaleString('id-ID')} 💵`, inline: true },
                { name: '💰 Total Sekarang', value: `${user.money.toLocaleString('id-ID')} 💵`, inline: true }
            )
            .setFooter({ text: `Ditambahkan oleh ${m.author.username}` })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('AddMoney Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
