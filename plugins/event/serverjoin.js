import { EmbedBuilder, AuditLogEvent, PermissionsBitField, ChannelType } from 'discord.js';

const pluginConfig = {
    name: 'serverjoin',
    alias: [],
    category: 'event',
    description: 'Kirim notifikasi ke DM owner setiap kali bot ditambahkan ke server baru',
    usage: 'otomatis (tidak dipanggil via command)',
    example: '-',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

const event = 'guildCreate';

// 🕵️ Cari siapa yang invite bot lewat Audit Log (butuh permission View Audit Log)
async function findInviter(guild, botUserId) {
    try {
        const me = guild.members.me;
        if (!me?.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) return null;

        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 5 });
        const entry = logs.entries.find((e) => e.target?.id === botUserId);
        return entry?.executor || null;
    } catch (err) {
        console.error('ServerJoin AuditLog Error:', err.message);
        return null;
    }
}

// 🔗 Bikin invite link dari channel text pertama yang bot punya izin Create Invite di situ
async function createInviteLink(guild) {
    try {
        const me = guild.members.me;
        const channel = guild.channels.cache.find(
            (c) =>
                c.type === ChannelType.GuildText &&
                c.viewable &&
                c.permissionsFor(me)?.has(PermissionsBitField.Flags.CreateInstantInvite)
        );
        if (!channel) return null;

        const invite = await channel.createInvite({
            maxAge: 0,
            maxUses: 0,
            unique: false,
            reason: 'Notifikasi server baru buat owner',
        });
        return invite.url;
    } catch (err) {
        console.error('ServerJoin Invite Error:', err.message);
        return null;
    }
}

async function handler(guild, { client, settings }) {
    try {
        if (!settings.idOwner) return;

        const [inviter, inviteUrl] = await Promise.all([
            findInviter(guild, client.user.id),
            createInviteLink(guild),
        ]);

        const owner = await client.users.fetch(settings.idOwner).catch(() => null);
        if (!owner) return;

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🍀 BOT TELAH DITAMBAHKAN KE SERVER BARU')
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '📌 Server', value: guild.name, inline: true },
                { name: '🆔 Server ID', value: guild.id, inline: true },
                { name: '👥 Member', value: `${guild.memberCount}`, inline: true },
                {
                    name: '👤 Ditambahkan Oleh',
                    value: inviter ? `${inviter.tag} (${inviter.id})` : '❓ Tidak diketahui (izin View Audit Log gak ada)',
                    inline: false,
                },
                {
                    name: '🔗 Invite',
                    value: inviteUrl || '❓ Tidak bisa dibuat (izin Create Instant Invite gak ada)',
                    inline: false,
                }
            )
            .setFooter({ text: `Total server sekarang: ${client.guilds.cache.size}` })
            .setTimestamp();

        await owner.send({ embeds: [embed] }).catch((err) => console.error('ServerJoin DM Error:', err.message));
    } catch (error) {
        console.error('ServerJoin Plugin Error:', error);
    }
}

export { pluginConfig as config, event, handler };
