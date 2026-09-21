import { EmbedBuilder } from 'discord.js';
import {
    MIN_PLAYERS,
    MAX_PLAYERS,
    ROLES,
    createGame,
    getGame,
    deleteGame,
    joinGame,
    leaveGame,
    canStart,
    buildLobbyEmbed,
    buildLobbyComponents,
    buildPlayerListEmbed,
    startGameAndSendRoles,
    findActiveRoomFor,
} from '../../lib/werewolfStore.js';

const pluginConfig = {
    name: 'werewolf',
    alias: ['ww', 'wwgc'],
    category: 'game',
    description: 'Main Werewolf bareng temen 1 server, semua aksi malam rahasia lewat DM',
    usage: '.ww <create|player|exit|delete>',
    example: '.ww create',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

function roleListText() {
    return Object.values(ROLES)
        .map((r) => `${r.emoji} **${r.name}** — ${r.desc}`)
        .join('\n');
}

async function handleCreate(m, settings) {
    if (getGame(m.channel.id)) {
        return m.reply('❌ Room di channel ini udah ada! Ketik `.ww player` buat lihat status, atau gabung lewat tombol di lobby.');
    }

    const activeRoom = findActiveRoomFor(m.author.id);
    if (activeRoom) {
        return m.reply('❌ Kamu masih dalam game Werewolf di channel lain! Selesaikan dulu atau `.ww exit` di sana.');
    }

    const game = createGame(m.channel.id, m.guild.id, m.author);
    const embed = buildLobbyEmbed(game, settings);
    await m.reply({ embeds: [embed], components: buildLobbyComponents(m.channel.id) });
}

async function handlePlayer(m) {
    const game = getGame(m.channel.id);
    if (!game) return m.reply('❌ Tidak ada game di channel ini!');
    await m.reply({ embeds: [buildPlayerListEmbed(game)] });
}

async function handleExit(m) {
    const result = leaveGame(m.channel.id, m.author.id);
    if (!result.ok) return m.reply(result.message);
    if (result.emptied) return m.reply('🗑️ Room dihapus karena kosong.');
    if (result.newOwner) {
        return m.reply(`👋 **${m.author.username}** keluar.\n👑 Host baru: **${result.newOwner.username}**`);
    }
    return m.reply(`👋 **${m.author.username}** keluar dari game.`);
}

async function handleDelete(m, settings) {
    const game = getGame(m.channel.id);
    if (!game) return m.reply('❌ Tidak ada game di channel ini!');

    const isOwner = game.owner === m.author.id;
    const isBotOwner = m.author.id === settings.idOwner;
    if (!isOwner && !isBotOwner) return m.reply('❌ Hanya host atau owner bot yang bisa hapus room!');

    deleteGame(m.channel.id);
    await m.react('🗑️').catch(() => {});
    await m.reply('🗑️ Room Werewolf dihapus!');
}

async function handleHelp(m) {
    const embed = new EmbedBuilder()
        .setColor('#8E44AD')
        .setTitle('🐺 WEREWOLF — Social Deduction Game')
        .setDescription(
            `Cari siapa Werewolf di antara kalian, sebelum mereka menghabisi semua warga!\n\n` +
            `**Cara main:**\n` +
            `🆕 \`.ww create\` — Buat room\n` +
            `👥 \`.ww player\` — Lihat status & daftar player\n` +
            `🚪 \`.ww exit\` — Keluar dari room\n` +
            `🗑️ \`.ww delete\` — Hapus room (host/owner)\n\n` +
            `Gabung & mulai game bisa lewat tombol di pesan lobby ✨\n\n` +
            `**Roles:**\n${roleListText()}\n\n` +
            `Min **${MIN_PLAYERS}** player, Max **${MAX_PLAYERS}** player.\n` +
            `🤫 Semua aksi malam (bunuh/lindungi/intip/investigasi) dikirim lewat DM — role kamu gak akan pernah kelihatan orang lain.`
        );
    await m.reply({ embeds: [embed] });
}

async function handler(m, { args, settings }) {
    const action = (args[0] || '').toLowerCase();
    try {
        switch (action) {
            case 'create':
                return await handleCreate(m, settings);
            case 'player':
            case 'status':
                return await handlePlayer(m);
            case 'exit':
            case 'leave':
                return await handleExit(m);
            case 'delete':
                return await handleDelete(m, settings);
            default:
                return await handleHelp(m);
        }
    } catch (error) {
        console.error('Werewolf Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message).catch(() => {});
    }
}

// 🔘 Dipanggil dari handler/interactionHandler.js pas tombol "Gabung" dipencet
export async function handleJoinButton(interaction, { settings }) {
    const channelId = interaction.customId.replace('wwjoin_', '');
    const result = joinGame(channelId, interaction.user);
    if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });

    await interaction.reply({ content: `✅ Kamu gabung sebagai player #${result.game.players.length}!`, ephemeral: true });
    await interaction.message.edit({ embeds: [buildLobbyEmbed(result.game, settings)] }).catch(() => {});
}

// 🔘 Dipanggil dari handler/interactionHandler.js pas tombol "Mulai" dipencet
export async function handleStartButton(interaction, { settings }) {
    const channelId = interaction.customId.replace('wwstart_', '');
    const isBotOwner = interaction.user.id === settings.idOwner;
    const result = canStart(channelId, interaction.user.id, isBotOwner);
    if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });

    await interaction.deferUpdate();

    const { game, failedDm } = await startGameAndSendRoles(channelId, interaction.client, settings.prefix || '.');

    const roleCount = {};
    game.players.forEach((p) => { roleCount[p.role] = (roleCount[p.role] || 0) + 1; });
    const roleInfo = Object.entries(roleCount).map(([role, count]) => `${ROLES[role].emoji} ${ROLES[role].name}: ${count}`).join('\n');

    const embed = new EmbedBuilder()
        .setColor('#992D22')
        .setTitle('🐺 GAME DIMULAI!')
        .setDescription(
            `🌙 **Malam Hari ke-1**\n\n` +
            `**Komposisi Role:**\n${roleInfo}\n\n` +
            `📩 Cek DM kalian untuk lihat role masing-masing!\n` +
            `🌙 Werewolf sedang berburu...\n` +
            `⏱️ Waktu malam: 60 detik` +
            (failedDm.length ? `\n\n⚠️ Gagal DM: ${failedDm.join(', ')} — buka DM dari server dulu ya!` : '')
        );
    await interaction.message.edit({ embeds: [embed], components: [] }).catch(() => {});
}

export { pluginConfig as config, handler };
