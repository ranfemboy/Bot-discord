import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { renderBanCanvas } from '../../lib/canvas/banCanvas.js';

const pluginConfig = {
    name: 'ban',
    alias: ['banned'],
    category: 'admin',
    description: 'Mem-ban member dari server, lengkap dengan canvas notifikasi ban (khusus Admin/Moderator)',
    usage: '.ban @user [alasan]',
    example: '.ban @user Spam & toxic di chat',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { args, prefix }) {
    if (!m.member.permissions.has('BanMembers')) {
        return m.reply(`❌ Kamu tidak memiliki permission untuk mem-ban member!\n` + `Diperlukan: **Ban Members**`);
    }

    const mentions = m.mentions.users;
    if (mentions.size === 0) {
        return m.reply(
            `🔨 *SISTEM BAN*\n\n` +
                `> Mem-ban member dari server\n\n` +
                `Format: ${prefix}ban @user [alasan]\n\n` +
                `*Contoh:*\n` +
                `${prefix}ban @user Spam & toxic di chat`
        );
    }

    const targetUser = mentions.first();
    const targetMember =
        m.guild.members.cache.get(targetUser.id) ||
        (await m.guild.members.fetch(targetUser.id).catch(() => null));

    if (targetUser.id === m.author.id) {
        return m.reply('❌ Tidak bisa mem-ban diri sendiri!');
    }

    if (targetUser.id === m.client.user.id) {
        return m.reply('❌ Tidak bisa mem-ban bot ini sendiri!');
    }

    if (targetMember) {
        if (!targetMember.bannable) {
            return m.reply('❌ Aku tidak bisa mem-ban member ini! (role-nya lebih tinggi/sejajar dari aku)');
        }

        if (targetMember.roles.highest.position >= m.member.roles.highest.position && m.guild.ownerId !== m.author.id) {
            return m.reply('❌ Kamu tidak bisa mem-ban user dengan role yang sama atau lebih tinggi dari kamu!');
        }
    }

    // 📝 Ambil alasan dari args (buang bagian mention-nya)
    const reason = args.slice(1).join(' ').trim() || 'Tidak ada alasan';

    // 📩 DM ke user duluan SEBELUM di-ban (kalau udah di-ban, bot & user bakal gak share server lagi jadi DM gagal)
    try {
        const dmEmbed = new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle('🔨 Kamu Telah Di-Ban!')
            .setDescription(`Kamu telah di-ban dari server **${m.guild.name}**`)
            .addFields(
                { name: '📝 Alasan', value: reason, inline: false },
                { name: '👤 Moderator', value: `${m.author.tag}`, inline: false }
            )
            .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] }).catch(() => console.log('Could not send DM to banned user'));
    } catch (e) {
        console.log('Error sending ban DM:', e);
    }

    try {
        if (targetMember) {
            await targetMember.ban({ reason: `${reason} | Dieksekusi oleh: ${m.author.tag}` });
        } else {
            // 🔎 User gak ada di cache/guild (mungkin udah left) tapi masih bisa di-ban by ID
            await m.guild.members.ban(targetUser.id, { reason: `${reason} | Dieksekusi oleh: ${m.author.tag}` });
        }
    } catch (e) {
        return m.reply(`❌ Error saat mem-ban member: ${e.message}`);
    }

    // 🎨 Canvas notifikasi ban (background merah simple, mirip pola welcome canvas, tapi beda tema)
    let attachment = null;
    try {
        const buffer = await renderBanCanvas({
            username: targetUser.username,
            avatarURL: targetUser.displayAvatarURL({ extension: 'png', size: 256 }),
            reason,
            moderator: m.author.tag,
        });
        attachment = new AttachmentBuilder(buffer, { name: 'ban-canvas.png' });
    } catch (err) {
        console.error('Ban Canvas Error:', err.message);
    }

    const embed = new EmbedBuilder()
        .setColor('#8B0000')
        .setTitle('🔨 Member Di-Ban')
        .setDescription(`${targetUser} telah di-ban dari server`)
        .addFields(
            { name: '📝 Alasan', value: reason, inline: false },
            { name: '👤 Moderator', value: `${m.author}`, inline: false }
        )
        .setTimestamp();

    if (attachment) {
        embed.setImage('attachment://ban-canvas.png');
    } else {
        embed.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
    }

    return m.reply({ embeds: [embed], files: attachment ? [attachment] : [] });
}

export { pluginConfig as config, handler };
