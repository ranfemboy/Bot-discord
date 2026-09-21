import fs from 'fs';
import path from 'path';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder } from 'discord.js';
import { createMenuSession, getMenuSession } from '../../lib/menuSessionStore.js';

const pluginConfig = {
    name: 'menu',
    alias: ['help', 'menuhelp'],
    category: 'general',
    description: 'Menampilkan daftar semua fitur/plugin bot',
    usage: '.menu',
    example: '.menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const CATEGORY_EMOJI = {
    game: '🎮',
    rpg: '⚔️',
    pokemon: '🐾',
    ai: '🤖',
    admin: '🛠️',
    event: '📢',
    group: '👥',
    general: 'ℹ️',
    anime: '📚',
    owner: '👑',
    store: '🛒',
    internet: '🌐',
    download: '⬇️',
    maker: '🎨',
    music: '🎶', 
    lainnya: '📦',
};

function categoryEmoji(cat) {
    return CATEGORY_EMOJI[cat] || '📦';
}

const EMBED_COLOR = '#4A5568';
const DIVIDER = '───────────────';

const LOADING_EMOJI = '⏳';
const PROGRESS_STEPS = [10, 25, 40, 55, 70, 85, 100];
const PROGRESS_SEGMENTS = 10;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildProgressBar(percent) {
    const filled = Math.round((percent / 100) * PROGRESS_SEGMENTS);
    const empty = PROGRESS_SEGMENTS - filled;
    const bar = '▰'.repeat(filled) + '▱'.repeat(empty);
    const label = percent >= 100 ? 'Menyiapkan menu...' : 'Memuat...';
    return `${bar}  ${percent}%  ·  ${label}`;
}

function pickRandomBanner(settings) {
    const list = Array.isArray(settings.menuBanners) && settings.menuBanners.length > 0
        ? settings.menuBanners
        : (settings.menuBannerUrl ? [settings.menuBannerUrl] : []);
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
}

function categoryLabel(cat) {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function getGreeting(timezone = 'Asia/Jakarta') {
    const hour = parseInt(
        new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: timezone }).format(new Date()),
        10
    );

    if (hour >= 4 && hour < 11) return 'Ohayou Gozaimasu';
    if (hour >= 11 && hour < 18) return 'Konnichiwa';
    return 'Konbanwa';
}

function groupPluginsByCategory(client) {
    const categories = {};
    client.plugins.forEach(plugin => {
        const cat = plugin.config.category || 'lainnya';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(plugin.config);
    });
    return categories;
}

const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov'];

function detectMediaType(url) {
    if (!url) return null;
    const ext = path.extname(url.split('?')[0]).toLowerCase();
    if (VIDEO_EXT.includes(ext)) return 'video';
    if (IMAGE_EXT.includes(ext)) return 'image';
    return 'image';
}

async function buildBannerPayload(bannerUrl) {
    const result = { embedImageUrl: null, files: [] };
    if (!bannerUrl) return result;

    const type = detectMediaType(bannerUrl);
    const isLocal = !/^https?:\/\//i.test(bannerUrl);

    const cleanExt = path.extname(bannerUrl.split('?')[0]);

    if (type === 'video') {
        const fileName = 'menu-banner' + (cleanExt || '.mp4');

        try {
            if (isLocal) {
                if (!fs.existsSync(bannerUrl)) {
                    console.warn('[Menu] Banner video lokal gak ketemu, dilewatin:', bannerUrl);
                    return result;
                }
                result.files.push(new AttachmentBuilder(bannerUrl, { name: fileName }));
            } else {
                const res = await fetch(bannerUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)' },
                });
                if (!res.ok) {
                    console.warn(`[Menu] Gagal download banner video (HTTP ${res.status}):`, bannerUrl);
                    return result;
                }
                const buffer = Buffer.from(await res.arrayBuffer());
                result.files.push(new AttachmentBuilder(buffer, { name: fileName }));
            }
        } catch (err) {
            console.warn('[Menu] Gagal siapin attachment video banner:', err.message);
        }
        return result;
    }

    if (isLocal) {
        if (!fs.existsSync(bannerUrl)) {
            console.warn('[Menu] Banner gambar/GIF lokal gak ketemu, dilewatin:', bannerUrl);
            return result;
        }
        const fileName = 'menu-banner' + (cleanExt || '.gif');
        result.files.push(new AttachmentBuilder(bannerUrl, { name: fileName }));
        result.embedImageUrl = `attachment://${fileName}`;
        return result;
    }

    result.embedImageUrl = bannerUrl;
    return result;
}

async function buildSoundAttachment(soundUrl) {
    if (!soundUrl) return null;

    const isLocal = !/^https?:\/\//i.test(soundUrl);
    const cleanExt = path.extname(soundUrl.split('?')[0]) || '.mp3';
    const fileName = '𝄞 Rei Ayanami' + cleanExt;

    try {
        if (isLocal) {
            if (!fs.existsSync(soundUrl)) {
                console.warn('[Menu] Sound lokal gak ketemu, dilewatin:', soundUrl);
                return null;
            }
            return new AttachmentBuilder(soundUrl, { name: fileName });
        }

        const res = await fetch(soundUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot/1.0)' },
        });
        if (!res.ok) {
            console.warn(`[Menu] Gagal download sound (HTTP ${res.status}):`, soundUrl);
            return null;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        return new AttachmentBuilder(buffer, { name: fileName });
    } catch (err) {
        console.warn('[Menu] Gagal siapin attachment sound:', err.message);
        return null;
    }
}

function buildOverviewEmbed({ author }, settings, categories, bannerImageUrl) {
    const greeting = getGreeting(settings.timezone);
    const totalCommands = Object.values(categories).reduce((sum, plugins) => sum + plugins.length, 0);

    let description = `${greeting}, ${author}.\n\n`;
    description += `Selamat datang di **${settings.botName}**. Pilih kategori pada menu di bawah untuk melihat daftar perintah yang tersedia.\n\n`;
    description += `${DIVIDER}\n`;
    description += Object.entries(categories)
        .map(([cat, plugins]) => `${categoryEmoji(cat)}  **${categoryLabel(cat)}**  ·  ${plugins.length} perintah`)
        .join('\n');

    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setAuthor({ name: author.username, iconURL: author.displayAvatarURL({ dynamic: true }) })
        .setTitle(`${settings.botName} — Menu`)
        .setDescription(description)
        .setThumbnail(settings.thumbnailUrl)
        .addFields({ name: 'Ringkasan', value: `${totalCommands} perintah dalam ${Object.keys(categories).length} kategori`, inline: false })
        .setFooter({ text: `${settings.footerText}  ·  Pilih kategori di bawah`, iconURL: settings.thumbnailUrl })
        .setTimestamp();

    if (bannerImageUrl) embed.setImage(bannerImageUrl);

    return embed;
}

function buildCategoryEmbed({ author }, settings, catName, plugins, bannerImageUrl) {
    let description = `${DIVIDER}\n\n`;
    plugins.forEach(p => {
        description += `▸ \`${settings.prefix}${p.name}\` — ${p.description}\n`;
    });

    const embed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setAuthor({ name: author.username, iconURL: author.displayAvatarURL({ dynamic: true }) })
        .setTitle(`${categoryEmoji(catName)}  ${settings.botName} · ${categoryLabel(catName)}`)
        .setDescription(description)
        .setThumbnail(settings.thumbnailUrl)
        .setFooter({ text: `${settings.footerText}  ·  Pilih kategori lain di bawah`, iconURL: settings.thumbnailUrl })
        .setTimestamp();

    if (bannerImageUrl) embed.setImage(bannerImageUrl);

    return embed;
}

function buildMenuComponents(sessionId, categories, settings) {
    const catNames = Object.keys(categories);

    const options = catNames.map((cat, idx) => ({
        label: categoryLabel(cat).slice(0, 100),
        description: (categories[cat].length + ' command tersedia').slice(0, 100),
        emoji: categoryEmoji(cat),
        value: sessionId + ':' + idx,
    }));

    return [
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menuCategorySelect_' + sessionId)
                .setPlaceholder('Pilih kategori menu')
                .addOptions(options)
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(settings.ownerName)
                .setEmoji('<:m_white:1499700182303117443>')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.com/users/' + settings.idOwner)
        ),
    ];
}

async function handler(m, { client, settings }) {
    let loadingMsg;
    try {
        await m.react(LOADING_EMOJI).catch(() => {});

        loadingMsg = await m.reply(buildProgressBar(0));
        for (const pct of PROGRESS_STEPS) {
            await sleep(350);
            await loadingMsg.edit(buildProgressBar(pct)).catch(() => {});
        }

        const categories = groupPluginsByCategory(client);
        const sessionId = createMenuSession({ categories, ownerId: m.author.id });

        const banner = await buildBannerPayload(pickRandomBanner(settings));

        const embed = buildOverviewEmbed({ author: m.author }, settings, categories, banner.embedImageUrl);
        const components = buildMenuComponents(sessionId, categories, settings);

        const payload = { content: '', embeds: [embed], components, files: banner.files };
        await loadingMsg.edit(payload);

        const soundAttachment = await buildSoundAttachment(settings.menuSound);
        if (soundAttachment) {
            await m.channel.send({ files: [soundAttachment] }).catch((e) => console.warn('[Menu] Gagal kirim sound:', e.message));
        }
    } catch (error) {
        console.error('Menu Plugin Error:', error);
        const errMsg = '❌ *GAGAL*\n\n> ' + error.message;
        if (loadingMsg) await loadingMsg.edit({ content: errMsg, embeds: [], components: [] }).catch(() => {});
        else await m.reply(errMsg).catch(() => {});
    }
}

export async function handleMenuCategorySelect(interaction, { settings }) {
    const sessionId = interaction.customId.replace('menuCategorySelect_', '');
    const session = getMenuSession(sessionId);

    if (!session) {
        return interaction.reply({ content: `❌ Menu ini udah kadaluarsa, ketik \`${settings.prefix}menu\` lagi ya~`, ephemeral: true });
    }
    if (interaction.user.id !== session.ownerId) {
        return interaction.reply({ content: '❌ Menu ini bukan buat kamu, Sensei~', ephemeral: true });
    }

    const [, indexStr] = interaction.values[0].split(':');
    const catNames = Object.keys(session.categories);
    const catName = catNames[parseInt(indexStr, 10)];
    const plugins = catName ? session.categories[catName] : null;

    if (!plugins) {
        return interaction.reply({ content: `❌ Kategori gak ketemu, ketik \`${settings.prefix}menu\` lagi ya~`, ephemeral: true });
    }

    const banner = await buildBannerPayload(pickRandomBanner(settings));

    const embed = buildCategoryEmbed({ author: interaction.user }, settings, catName, plugins, banner.embedImageUrl);
    const components = buildMenuComponents(sessionId, session.categories, settings);

    await interaction.update({ embeds: [embed], components, files: banner.files });
}

export { pluginConfig as config, handler }