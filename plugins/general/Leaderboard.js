import { EmbedBuilder } from 'discord.js';
import { getGuildLeaderboard, calculateLevel } from '../../lib/levelStore.js';

const pluginConfig = {
    name: 'leaderboard',
    alias: ['lb', 'top'],
    category: 'general',
    description: 'Menampilkan 10 user dengan level tertinggi di server ini',
    usage: '.leaderboard',
    example: '.leaderboard',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    try {
        const leaderboard = getGuildLeaderboard(m.guild.id).slice(0, 10);

        if (leaderboard.length === 0) {
            return m.reply('📉 Belum ada data XP di server ini. Ayo mulai chat!');
        }

        const medals = ['🥇', '🥈', '🥉'];
        let description = '';

        for (let i = 0; i < leaderboard.length; i++) {
            const entry = leaderboard[i];
            const { level } = calculateLevel(entry.xp);
            const medal = medals[i] || `${i + 1}.`;
            description += `${medal} <@${entry.userId}> — Level **${level}** (${entry.xp} XP)\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle(`🏆 Leaderboard - ${m.guild.name}`)
            .setDescription(description)
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Leaderboard Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler }