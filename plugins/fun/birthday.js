import { EmbedBuilder } from 'discord.js';
import { getBirthday, formatBirthdayDate, calculateAge } from '../../lib/birthdayStore.js';

const pluginConfig = {
    name: 'birthday',
    alias: ['cekultah', 'bday'],
    category: 'fun',
    description: 'Cek tanggal ulang tahun kamu atau member lain',
    usage: '.birthday [@user]',
    example: '.birthday  atau  .birthday @user',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { prefix }) {
    const targetUser = m.mentions.users.first() || m.author;
    const data = getBirthday(targetUser.id);

    if (!data) {
        const isSelf = targetUser.id === m.author.id;
        return m.reply(
            isSelf
                ? `❌ Kamu belum daftarin ulang tahun. Pakai \`${prefix}setbirthday 17-08-2000\` dulu yuk~`
                : `❌ ${targetUser.username} belum daftarin ulang tahunnya.`
        );
    }

    const age = calculateAge(data);

    const embed = new EmbedBuilder()
        .setColor('#FF9ECD')
        .setTitle('🎂 Info Ulang Tahun')
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '👤 User', value: `${targetUser}`, inline: false },
            { name: '📅 Tanggal', value: formatBirthdayDate(data), inline: true },
            ...(age !== null ? [{ name: '🎈 Umur', value: `${age} tahun`, inline: true }] : [])
        );

    return m.reply({ embeds: [embed] });
}

export { pluginConfig as config, handler };