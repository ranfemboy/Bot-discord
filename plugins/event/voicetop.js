import { EmbedBuilder } from 'discord.js';
import { getLeaderboard } from '../../lib/voiceXpStore.js';

export const config = {
    name: 'voicetop',
    category: 'event',
    alias: ['vtop', 'voiceleaderboard'],
    description: 'Leaderboard 10 besar voice XP tertinggi',
    cooldown: 5,
    isGroup: true,
};

export async function handler(m) {
    const top = getLeaderboard(10);

    if (top.length === 0) {
        return m.reply('📭 Belum ada data voice XP nih, Sensei~ Yuk mabar dulu di voice channel!');
    }

    const medal = ['🥇', '🥈', '🥉'];
    const lines = top.map((entry, i) => {
        const rank = medal[i] ?? `${i + 1}.`;
        const jam = Math.floor(entry.totalMinutes / 60);
        return `${rank} <@${entry.userId}> — Level **${entry.level}** (${entry.xp} XP, ${jam} jam voice)`;
    });

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎙 Voice XP Leaderboard')
        .setDescription(lines.join('\n'))
        .setTimestamp();

    await m.reply({ embeds: [embed] });
}
