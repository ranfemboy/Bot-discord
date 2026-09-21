import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import instagramDownloader from '../../lib/scraper/ig.js';

const pluginConfig = {
    name: 'instagramdl',
    alias: ['igdl', 'ig', 'instagram'],
    category: 'download',
    description: 'Download video/foto Instagram',
    usage: '.instagramdl <url>',
    example: '.instagramdl https://www.instagram.com/reel/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true,
};

const IG_REGEX = /instagram\.com\/(p|reel|reels|stories|tv)\//i;

async function handler(m, { args, prefix }) {
    const url = args.join(' ').trim();

    if (!url) {
        return m.reply(
            `📸 *ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
            `> \`${prefix}igdl <url>\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${prefix}igdl https://www.instagram.com/reel/xxx\`\n` +
            `> \`${prefix}igdl https://www.instagram.com/p/xxx\``
        );
    }

    if (!IG_REGEX.test(url)) {
        return m.reply(`❌ URL tidak valid. Gunakan link Instagram (reel/post/story).`);
    }

    await m.react('🕕').catch(() => {});

    try {
        const result = await instagramDownloader(url);

        if (!result?.media?.length) {
            await m.react('❌').catch(() => {});
            return m.reply(`❌ Gagal mengambil media. Coba link lain.`);
        }

        const isStory = url.includes('/stories/');

        const embed = new EmbedBuilder()
            .setColor('#E1306C')
            .setTitle(`📸 Instagram ${isStory ? 'Story' : 'Downloader'}`)
            .setTimestamp();

        if (result.username && result.username !== '-') {
            embed.addFields({ name: '👤 Username', value: `@${result.username}`, inline: true });
        }
        if (result.likes && result.likes !== '-') {
            embed.addFields({ name: '❤️ Likes', value: `${result.likes}`, inline: true });
        }
        if (result.comment && result.comment !== '-') {
            embed.addFields({ name: '💬 Comments', value: `${result.comment}`, inline: true });
        }

        await m.reply({ embeds: [embed] });

        // Discord gak bisa nampilin video di dalam embed, jadi tiap media dikirim
        // sebagai attachment terpisah (mendukung banyak media / carousel)
        for (const [i, item] of result.media.entries()) {
            const isVideo = item.type === 'video' || item.type === 'mp4';
            const ext = isVideo ? 'mp4' : 'jpg';
            const attachment = new AttachmentBuilder(item.url, { name: `instagram_${i + 1}.${ext}` });
            await m.channel.send({ files: [attachment] });
        }

        await m.react('✅').catch(() => {});
    } catch (err) {
        await m.react('❌').catch(() => {});
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n> ${err.message}`);
    }
}

export { pluginConfig as config, handler };
