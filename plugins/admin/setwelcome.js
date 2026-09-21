import { EmbedBuilder } from 'discord.js';
import { getWelcomeConfig, setWelcomeConfig } from '../../lib/welcomeStore.js';

const pluginConfig = {
    name: 'setwelcome',
    alias: ['welcomeset'],
    category: 'admin',
    description: 'Mengatur pesan sambutan otomatis untuk member baru',
    usage: '.setwelcome <#channel> <teks> [gambar]',
    example: '.setwelcome #welcome Selamat datang {member} di {server} https://example.com/image.jpg',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { args }) {
    try {
        // Cek permission Administrator
        if (!m.member.permissions.has('Administrator')) {
            return m.reply('❌ Anda memerlukan permission **Administrator** untuk menggunakan perintah ini!');
        }

        const channel = m.mentions.channels.first();
        if (!channel) {
            return m.reply('❌ Gunakan: `.setwelcome <#channel> <teks> [gambar]`\nContoh: `.setwelcome #welcome Selamat datang {member} di {server} https://example.com/image.jpg`');
        }

        // args[0] = mention channel, sisanya adalah teks (+ url gambar kalau ada)
        const restArgs = args.slice(1);
        let imageUrl = null;
        let text = restArgs.join(' ');

        const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/i;
        const urlMatch = text.match(urlRegex);
        if (urlMatch) {
            imageUrl = urlMatch[0];
            text = text.replace(urlRegex, '').trim();
        }

        if (!text) {
            text = `Selamat datang {member} di {server}! 🎉\nKamu adalah member ke-{membercount}`;
        }

        const config = getWelcomeConfig(m.guild.id) || {};
        config.channelId = channel.id;
        config.text = text;
        config.imageUrl = imageUrl;
        config.title = `👋 Selamat Datang di ${m.guild.name}!`;
        config.color = '#00FF7F';
        config.footer = 'Selamat bergabung!';

        setWelcomeConfig(m.guild.id, config);

        const previewEmbed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('✅ Welcome Message Setup')
            .setDescription('Pesan sambutan berhasil diatur! Gunakan `.testwelcome` untuk melihat tampilannya.')
            .addFields(
                { name: '📢 Channel', value: `<#${channel.id}>`, inline: true },
                { name: '📝 Teks', value: text, inline: false },
                { name: '🖼️ Gambar', value: imageUrl || 'Tidak ada', inline: true }
            )
            .setTimestamp();

        await m.reply({ embeds: [previewEmbed] });
    } catch (error) {
        console.error('SetWelcome Error:', error);
        m.reply('❌ Terjadi kesalahan saat mengatur welcome message.');
    }
}

export { pluginConfig as config, handler }
