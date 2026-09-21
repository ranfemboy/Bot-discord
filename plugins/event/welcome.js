import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { getWelcomeConfig } from '../../lib/welcomeStore.js';
import { buildSayWelcomeRow } from '../../lib/welcomeButtonStore.js';
import { renderWelcomeCanvas } from '../../lib/canvas/welcomeCanvas.js';

const pluginConfig = {
    name: 'welcome',
    alias: [],
    category: 'event',
    description: 'Mengirim pesan sambutan otomatis ketika member baru bergabung',
    usage: 'otomatis (tidak dipanggil via command)',
    example: '-',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

const event = 'guildMemberAdd';

function formatText(text, member) {
    return text
        .replace(/{member}/g, `<@${member.id}>`)
        .replace(/{membername}/g, member.user.username)
        .replace(/{membertag}/g, member.user.tag)
        .replace(/{server}/g, member.guild.name)
        .replace(/{membercount}/g, member.guild.memberCount)
        .replace(/{created}/g, `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
        .replace(/{joined}/g, `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`);
}

async function buildCanvasAttachment(member) {
    try {
        const buffer = await renderWelcomeCanvas({
            username: member.user.username,
            avatarURL: member.user.displayAvatarURL({ extension: 'png', size: 256 })
        });
        return new AttachmentBuilder(buffer, { name: 'welcome-canvas.png' });
    } catch (err) {
        console.error('Welcome Canvas Error:', err.message);
        return null;
    }
}

async function handler(member, { settings }) {
    try {
        const config = getWelcomeConfig(member.guild.id);
        const attachment = await buildCanvasAttachment(member);

        // Server BELUM pernah di-setting -> pakai pesan welcome bawaan/default
        if (!config) {
            const channel = member.guild.systemChannel ||
                member.guild.channels.cache.find(c => c.name.toLowerCase().includes('welcome'));
            if (!channel) return;

            const embed = new EmbedBuilder()
                .setColor('#00FF7F')
                .setTitle(`👋 Selamat Datang di ${member.guild.name}!`)
                .setDescription(`Halo ${member}, selamat bergabung! Semoga betah ya 🎉`)
                .setFooter({ text: settings.footerText })
                .setTimestamp();

            if (attachment) {
                embed.setImage('attachment://welcome-canvas.png');
            } else {
                embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }));
                embed.setImage(settings.thumbnailUrl);
            }

            await channel.send({
                embeds: [embed],
                components: [buildSayWelcomeRow(member.id)],
                files: attachment ? [attachment] : []
            });
            return;
        }

        // Server SUDAH di-setting lewat .setwelcome -> pakai config custom
        const channel = member.guild.channels.cache.get(config.channelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(config.color || '#00FF7F')
            .setTitle(config.title || `👋 Selamat Datang di ${member.guild.name}!`)
            .setDescription(formatText(config.text, member))
            .setFooter({ text: config.footer || settings.footerText || 'Selamat bergabung!' })
            .setTimestamp();

        if (attachment) {
            embed.setImage('attachment://welcome-canvas.png');
        } else if (config.imageUrl) {
            embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }));
            embed.setImage(config.imageUrl);
        }

        if (config.fields?.length) {
            config.fields.forEach(field => {
                embed.addFields({
                    name: field.name,
                    value: field.value.replace(/{member}/g, `<@${member.id}>`),
                    inline: field.inline || false
                });
            });
        }

        await channel.send({
            embeds: [embed],
            components: [buildSayWelcomeRow(member.id)],
            files: attachment ? [attachment] : [],
            stickers: config.stickerId ? [config.stickerId] : []
        });
    } catch (error) {
        console.error('Welcome Plugin Error:', error);
    }
}

export { pluginConfig as config, handler, event }