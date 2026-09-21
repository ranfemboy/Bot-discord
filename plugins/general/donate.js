import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const pluginConfig = {
    name: 'donate',
    alias: ['saweria', 'traktir'],
    category: 'general',
    description: 'Menampilkan link donasi Saweria buat support bot',
    usage: '.donate',
    example: '.donate',
    isOwner: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m, { settings }) {
    try {
        // Validate required settings
        if (!settings?.saweriaLink || typeof settings.saweriaLink !== 'string') {
            throw new Error('Link donasi belum dikonfigurasi. Hubungi owner bot.');
        }

        // Ensure all string values are properly defined
        const thumbnailUrl = settings.thumbnailUrl || m.client.user.displayAvatarURL({ size: 256 });
        const bannerUrl = settings.bannerUrl || null;
        const footerText = settings.footerText || 'Makasih banyak buat dukungannya! 🙏';

        const embed = new EmbedBuilder()
            .setColor('#FF7A00')
            .setTitle('Support ☕')
            .setDescription(
                'Suka sama bot ini? Dukung Terus Bot ini agar terus berkembang dengan cara klik Saweria di bawah ini\n\n' +
                `🔗 **[Klik di sini buat donasi](${settings.saweriaLink})**`
            )
            .setThumbnail(thumbnailUrl)
            .setImage(bannerUrl)
            .setFooter({ text: footerText })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Donasi Sekarang')
                .setEmoji('☕')
                .setStyle(ButtonStyle.Link)
                .setURL(settings.saweriaLink)
        );

        await m.reply({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error('Donate Plugin Error:', error);
        await m.reply(`❌ *GAGAL*\n\n> ${error.message || 'Terjadi kesalahan internal'}`);
    }
}

export { pluginConfig as config, handler };