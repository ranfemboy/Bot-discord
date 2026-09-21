import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { getWelcomeConfig } from '../../lib/welcomeStore.js';
import { buildSayWelcomeRow } from '../../lib/welcomeButtonStore.js';
import { renderWelcomeCanvas } from '../../lib/canvas/welcomeCanvas.js';

const pluginConfig = {
    name: 'testwelcome',
    alias: [],
    category: 'admin',
    description: 'Mengetes tampilan pesan welcome yang sudah diatur',
    usage: '.testwelcome',
    example: '.testwelcome',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    try {
        const config = getWelcomeConfig(m.guild.id);
        if (!config) {
            return m.reply('❌ Belum ada welcome message yang diatur! Gunakan `.setwelcome` terlebih dahulu.');
        }

        const channel = m.guild.channels.cache.get(config.channelId);
        if (!channel) {
            return m.reply('❌ Channel welcome tidak ditemukan! Silakan atur ulang dengan `.setwelcome`.');
        }

        const member = m.member;
        const text = config.text
            .replace(/{member}/g, `<@${member.id}>`)
            .replace(/{membername}/g, member.user.username)
            .replace(/{membertag}/g, member.user.tag)
            .replace(/{server}/g, m.guild.name)
            .replace(/{membercount}/g, m.guild.memberCount)
            .replace(/{created}/g, `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
            .replace(/{joined}/g, `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`);

        const embed = new EmbedBuilder()
            .setColor(config.color || '#00FF7F')
            .setTitle(config.title || `👋 Selamat Datang di ${m.guild.name}!`)
            .setDescription(text)
            .setFooter({ text: '🔬 TEST MODE • ' + (config.footer || 'Selamat bergabung!') })
            .setTimestamp();

        let attachment = null;
        try {
            const buffer = await renderWelcomeCanvas({
                username: member.user.username,
                avatarURL: member.user.displayAvatarURL({ extension: 'png', size: 256 })
            });
            attachment = new AttachmentBuilder(buffer, { name: 'welcome-canvas.png' });
            embed.setImage('attachment://welcome-canvas.png');
        } catch (err) {
            console.error('Welcome Canvas Error:', err.message);
            if (config.imageUrl) embed.setImage(config.imageUrl);
        }

        await channel.send({
            content: '🧪 **TEST WELCOME MESSAGE**',
            embeds: [embed],
            components: [buildSayWelcomeRow(member.id)],
            files: attachment ? [attachment] : [],
            stickers: config.stickerId ? [config.stickerId] : []
        });
        await m.reply('✅ Test welcome message telah dikirim ke <#' + config.channelId + '>!');
    } catch (error) {
        console.error('TestWelcome Error:', error);
        m.reply('❌ Terjadi kesalahan saat test welcome message.');
    }
}

export { pluginConfig as config, handler }