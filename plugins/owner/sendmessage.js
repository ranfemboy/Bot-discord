import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} from 'discord.js';
import { createSession, getSession, deleteSession } from '../../lib/sendMessageSession.js';

const config = {
    name: 'sendmessage',
    alias: ['broadcast', 'sm'],
    category: 'owner',
    description: 'Kirim pengumuman ke server & channel pilihan, lewat DM khusus owner',
    usage:
        '.sendmessage <text>\n' +
        '.sendmessage text | <text>\n' +
        '.sendmessage button <hijau/biru/merah> | <label> | <fitur> | <text>',
    example: '.sendmessage button hijau | menu | menu | bot udah di upd yh silahkan ketik menu di spam bot',
    isOwner: true,
    isGroup: true,
    isPrivate: false, // cuma bisa dipakai lewat DM
    cooldown: 5,
    isEnabled: true,
};

// Prefix ini dipakai index.js buat tau interaction (button/select) mana yang harus dilempar ke plugin ini
const interactionPrefix = 'sm_';

const COLOR_MAP = {
    hijau: ButtonStyle.Success,
    biru: ButtonStyle.Primary,
    merah: ButtonStyle.Danger,
};

function parseInput(raw) {
    const trimmed = raw.trim();
    const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase();

    if (firstWord === 'button') {
        const segments = trimmed.split('|').map((s) => s.trim());
        // segments[0] = "button hijau"
        if (segments.length < 4) return { error: true };

        const colorWord = segments[0].split(/\s+/)[1]?.toLowerCase();
        const style = COLOR_MAP[colorWord] || ButtonStyle.Secondary;
        const label = segments[1];
        const feature = segments[2];
        const text = segments.slice(3).join('|').trim();

        if (!label || !feature || !text) return { error: true };

        return { text, button: { style, label, feature } };
    }

    if (firstWord === 'text') {
        const segments = trimmed.split('|').map((s) => s.trim());
        const text = segments.slice(1).join('|').trim();
        if (!text) return { error: true };
        return { text, button: null };
    }

    // Fallback: seluruh teks dianggap pesan biasa tanpa tombol
    if (!trimmed) return { error: true };
    return { text: trimmed, button: null };
}

function buildGuildRows(sessionId, guilds) {
    const list = [...guilds.values()].slice(0, 25); // limit Discord: maks 25 button (5 baris x 5)
    const rows = [];
    for (let i = 0; i < list.length; i += 5) {
        const row = new ActionRowBuilder().addComponents(
            list.slice(i, i + 5).map((g) =>
                new ButtonBuilder()
                    .setCustomId(`sm_guild:${sessionId}:${g.id}`)
                    .setLabel(g.name.slice(0, 80))
                    .setStyle(ButtonStyle.Primary)
            )
        );
        rows.push(row);
    }
    return rows;
}

async function handler(m, { client, args }) {
    const raw = args.join(' ');
    const parsed = parseInput(raw);

    if (parsed.error) {
        return m.reply(
            `❌ *Format salah!*\n\n` +
            `> \`${config.usage.split('\n').join('`\n> `')}\``
        );
    }

    const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    createSession(sessionId, {
        authorId: m.author.id,
        text: parsed.text,
        button: parsed.button,
    });

    if (client.guilds.cache.size === 0) {
        return m.reply('❌ Bot belum join server manapun.');
    }

    const rows = buildGuildRows(sessionId, client.guilds.cache);
    await m.reply({
        content: '📡 *Pilih server yang ingin dikirim pesan:*',
        components: rows,
    });
}

// Dipanggil dari index.js setiap ada button/select menu diklik dengan customId berawalan "sm_"
async function interaction(interaction, { client, settings }) {
    // Step 1: owner klik tombol pilih SERVER -> tampilkan dropdown CHANNEL
    if (interaction.isButton() && interaction.customId.startsWith('sm_guild:')) {
        const [, sessionId, guildId] = interaction.customId.split(':');
        const session = getSession(sessionId);

        if (!session) return interaction.reply({ content: '❌ Sesi kadaluarsa, ulangi `.sendmessage` lagi.', ephemeral: true });
        if (interaction.user.id !== session.authorId) return interaction.reply({ content: '❌ Ini bukan sesi kamu.', ephemeral: true });

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return interaction.reply({ content: '❌ Server tidak ditemukan (mungkin bot udah keluar).', ephemeral: true });

        const channels = guild.channels.cache
            .filter((c) => c.isTextBased() && !c.isThread())
            .first(25); // limit Discord select menu: maks 25 opsi

        if (channels.length === 0) {
            return interaction.update({ content: `❌ Tidak ada text channel di **${guild.name}**.`, components: [] });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId(`sm_channel:${sessionId}:${guildId}`)
            .setPlaceholder('Pilih channel tujuan')
            .addOptions(channels.map((c) => ({ label: `#${c.name}`.slice(0, 100), value: c.id })));

        await interaction.update({
            content: `📡 Server: **${guild.name}**\nPilih channel tujuan:`,
            components: [new ActionRowBuilder().addComponents(menu)],
        });
        return;
    }

    // Step 2: owner pilih CHANNEL -> kirim pesan final ke channel itu
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('sm_channel:')) {
        const [, sessionId] = interaction.customId.split(':');
        const session = getSession(sessionId);

        if (!session) return interaction.reply({ content: '❌ Sesi kadaluarsa, ulangi `.sendmessage` lagi.', ephemeral: true });
        if (interaction.user.id !== session.authorId) return interaction.reply({ content: '❌ Ini bukan sesi kamu.', ephemeral: true });

        const channelId = interaction.values[0];
        const channel = client.channels.cache.get(channelId);
        if (!channel) return interaction.update({ content: '❌ Channel tidak ditemukan.', components: [] });

        const payload = { content: session.text };
        if (session.button) {
            const btn = new ButtonBuilder()
                .setCustomId(`sm_feature:${session.button.feature}`)
                .setLabel(session.button.label)
                .setStyle(session.button.style);
            payload.components = [new ActionRowBuilder().addComponents(btn)];
        }

        await channel.send(payload);
        deleteSession(sessionId);

        await interaction.update({
            content: `✅ Pesan berhasil dikirim ke **#${channel.name}** (${channel.guild.name}).`,
            components: [],
        });
        return;
    }

    // Step 3: member biasa klik tombol yang ada di pesan broadcast
    if (interaction.isButton() && interaction.customId.startsWith('sm_feature:')) {
        const feature = interaction.customId.split(':')[1];
        await interaction.reply({
            content: `ℹ️ Ketik \`${settings.prefix}${feature}\` di channel ini buat pakai fiturnya ya~`,
            ephemeral: true,
        });
        return;
    }
}

export { config, handler, interactionPrefix, interaction };
