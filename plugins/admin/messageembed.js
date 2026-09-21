import { EmbedBuilder } from 'discord.js';

const pluginConfig = {
    name: 'messageembed',
    alias: ['embed', 'embedmsg'],
    category: 'admin',
    description: 'Kirim pesan embed dengan warna custom',
    usage: '.embed <judul>|<deskripsi>|<warna>',
    example: '.embed Hello|This is embed message|#FF0000',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { args, prefix }) {
    // 📝 m.text gak pernah ada di codebase ini, teks command diambil dari args
    const text = args.join(' ');
    const parts = text.split('|');

    if (parts.length < 2) {
        return m.reply(
            `📝 *EMBED MESSAGE*\n\n` +
                `> Format: ${prefix}embed <judul>|<deskripsi>|<warna>\n\n` +
                `*Contoh:*\n` +
                `${prefix}embed Hello|Ini adalah pesan embed|#FF0000\n\n` +
                `*Warna default:* #0099FF (biru)`
        );
    }

    const title = parts[0]?.trim() || 'Embed Message';
    const description = parts[1]?.trim() || '';
    const colorInput = parts[2]?.trim() || '#0099FF';

    let color = colorInput;
    if (!color.startsWith('#')) {
        color = '#' + color;
    }

    if (!/^#[0-9A-F]{6}$/i.test(color)) {
        return m.reply('❌ Format warna tidak valid! Gunakan format HEX: #RRGGBB');
    }

    try {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setFooter({
                text: `Dikirim oleh ${m.author.username}`,
                iconURL: m.author.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        // 🚫 sock.sendMessage gak ada di bot ini (itu API Baileys/WhatsApp), yang bener m.reply
        await m.reply({ embeds: [embed] });

        m.react('✅');
    } catch (e) {
        m.react('❌');
        m.reply(`❌ Error: ${e.message}`);
    }
}

export { pluginConfig as config, handler };
