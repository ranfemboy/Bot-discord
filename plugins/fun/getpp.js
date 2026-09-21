import { EmbedBuilder } from 'discord.js';

const pluginConfig = {
    name: 'getpp',
    alias: ['getavatar', 'getavt', 'avatar'],
    category: 'fun',
    description: 'Mengambil foto profile kamu atau orang yang di-mention',
    usage: '.getpp [@user]',
    example: '.getpp @Budi',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    isEnabled: true,
};

async function handler(m) {
    try {
        const target = m.mentions.users.first() || m.author;

        const avatarURL = target.displayAvatarURL({ dynamic: true, size: 1024 });

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setAuthor({ name: `Foto Profile ${target.username}`, iconURL: avatarURL })
            .setImage(avatarURL)
            .setFooter({ text: `Diminta oleh ${m.author.username}` })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Getpp Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };