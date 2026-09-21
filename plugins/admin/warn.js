import { EmbedBuilder } from 'discord.js';
import { addWarning, clearWarnings, getWarningMessage } from '../../lib/warnStore.js';

const pluginConfig = {
    name: 'warn',
    alias: ['peringatan', 'warning'],
    category: 'admin',
    description: 'Memberikan peringatan kepada member nakal',
    usage: '.warn <@user> [alasan]',
    example: '.warn @user Spam di chat',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { args, prefix }) {
    if (!m.member.permissions.has('ModerateMembers')) {
        return m.reply(`❌ Kamu tidak memiliki permission untuk memberikan warning!\n` + `Diperlukan: Moderate Members`);
    }

    const mentions = m.mentions.users;
    if (mentions.size === 0) {
        return m.reply(
            `⚠️ *SISTEM PERINGATAN*\n\n` +
                `> Memberikan peringatan kepada member nakal\n\n` +
                `Format: ${prefix}warn @user [alasan]\n\n` +
                `*Contoh:*\n` +
                `${prefix}warn @user Spam di chat\n\n` +
                `*Sistem Peringatan:*\n` +
                `1️⃣ **1 Warn** - Peringatan\n` +
                `2️⃣ **2 Warn** - Timeout 1 jam\n` +
                `3️⃣ **3 Warn** - Kick dari server\n`
        );
    }

    const targetUser = mentions.first();
    const targetMember = m.guild.members.cache.get(targetUser.id);

    if (!targetMember) {
        return m.reply('❌ Member tidak ditemukan!');
    }

    if (targetMember.user.bot) {
        return m.reply('❌ Tidak bisa memberi warning ke bot!');
    }

    if (targetMember.id === m.author.id) {
        return m.reply('❌ Tidak bisa memberi warning ke diri sendiri!');
    }

    if (targetMember.roles.highest.position >= m.member.roles.highest.position) {
        return m.reply('❌ Kamu tidak bisa memberi warning ke user dengan role yang sama atau lebih tinggi!');
    }

    // 📝 Ambil alasan dari args (buang bagian mention-nya), bukan dari m.text yang gak pernah ada
    const reason = args.slice(1).join(' ').trim() || 'Tidak ada alasan';
    const warnCount = addWarning(m.guildId, targetUser.id, reason);

    m.react('⚠️');

    try {
        const dmEmbed = new EmbedBuilder()
            .setColor('#FFB347')
            .setTitle('⚠️ Kamu Menerima Warning!')
            .setDescription(`Kamu telah menerima warning di **${m.guild.name}**`)
            .addFields(
                { name: '📝 Alasan', value: reason, inline: false },
                { name: '⚠️ Warning Count', value: `${warnCount}/3`, inline: false },
                { name: '📢 Info', value: getWarningMessage(warnCount), inline: false }
            )
            .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] }).catch(() => console.log('Could not send DM'));
    } catch (e) {
        console.log('Error sending DM:', e);
    }

    if (warnCount === 1) {
        const embed = new EmbedBuilder()
            .setColor('#FFB347')
            .setTitle('⚠️ Warning Given')
            .setDescription(`${targetUser} menerima **1** warning`)
            .addFields(
                { name: '📝 Alasan', value: reason, inline: false },
                { name: '👤 Moderator', value: `${m.author}`, inline: false },
                { name: 'ℹ️', value: 'Jika menerima 2 warning lagi akan di-timeout', inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
        await m.reply({ embeds: [embed] });
    } else if (warnCount === 2) {
        try {
            await targetMember.timeout(60 * 60 * 1000, `Warning ${warnCount}/3: ${reason}`);

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('⏱️ Timeout Applied')
                .setDescription(`${targetUser} menerima **2** warning dan di-timeout **1 jam**`)
                .addFields(
                    { name: '📝 Alasan', value: reason, inline: false },
                    { name: '👤 Moderator', value: `${m.author}`, inline: false },
                    { name: '⏰ Durasi', value: '1 jam', inline: false },
                    { name: 'ℹ️', value: 'Jika menerima 1 warning lagi akan di-kick', inline: false }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
            await m.reply({ embeds: [embed] });
        } catch (e) {
            m.reply(`❌ Error applying timeout: ${e.message}`);
        }
    } else if (warnCount >= 3) {
        try {
            await targetMember.kick(`Warning ${warnCount}/3: ${reason}`);
            clearWarnings(m.guildId, targetUser.id);

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🚪 Member Kicked')
                .setDescription(`${targetUser} telah di-kick dari server karena **3 warning**`)
                .addFields(
                    { name: '📝 Alasan', value: reason, inline: false },
                    { name: '👤 Moderator', value: `${m.author}`, inline: false },
                    { name: '⚠️ Warning', value: '3/3 - **KICKED**', inline: false }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
            await m.reply({ embeds: [embed] });
        } catch (e) {
            m.reply(`❌ Error kicking member: ${e.message}`);
        }
    }
}

export { pluginConfig as config, handler };
