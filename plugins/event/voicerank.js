import { EmbedBuilder } from 'discord.js';
import { getVoiceProfile } from '../../lib/voiceXpStore.js';

export const config = {
    name: 'voicerank',
    category: 'event',
    alias: ['vrank', 'voicelevel', 'vlevel'],
    description: 'Cek level & XP hasil nongkrong di voice channel',
    usage: '[@member]',
    cooldown: 3,
    isGroup: true,
};

export async function handler(m, { args }) {
    const target = m.mentions.users.first() ?? m.author;
    const profile = getVoiceProfile(target.id);

    const jam = Math.floor(profile.totalMinutes / 60);
    const menit = profile.totalMinutes % 60;

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setAuthor({ name: `${target.tag} — Voice Rank`, iconURL: target.displayAvatarURL({ dynamic: true }) })
        .addFields(
            { name: '🏆 Level', value: `${profile.level}`, inline: true },
            { name: '✨ XP', value: `${profile.xp} / ${profile.nextLevelXp}`, inline: true },
            { name: '⏱ Total Waktu Voice', value: `${jam} jam ${menit} menit`, inline: true },
            { name: '📈 XP ke level berikutnya', value: `${profile.xpToNextLevel} XP lagi`, inline: false },
        )
        .setTimestamp();

    await m.reply({ embeds: [embed] });
}
