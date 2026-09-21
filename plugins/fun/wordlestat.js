import { EmbedBuilder } from 'discord.js';
import { getStats } from '../../lib/wordleStore.js';

const pluginConfig = {
    name: 'wordlestat',
    alias: ['statwordle'],
    category: 'fun',
    description: 'Melihat statistik menang/kalah Wordle kamu',
    usage: '.wordlestat [@user]',
    example: '.wordlestat',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m) {
    try {
        const target = m.mentions.users.first() || m.author;
        const stats = getStats(target.id);
        const winRate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('📊 STATISTIK WORDLE')
            .addFields(
                { name: '🎮 Total Main', value: `${stats.played}`, inline: true },
                { name: '🏆 Menang', value: `${stats.wins}`, inline: true },
                { name: '💀 Kalah', value: `${stats.losses}`, inline: true },
                { name: '📈 Win Rate', value: `${winRate}%`, inline: true }
            )
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Wordlestat Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
