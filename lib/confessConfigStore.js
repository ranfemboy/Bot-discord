import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'confessConfig.json');

// 📦 Struktur: { "guildId": { approvalChannelId: "...", sendChannelId: "..." } }
let data = {};
let loaded = false;

function ensureDataDir() {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadData() {
    if (loaded) return;
    ensureDataDir();

    if (fs.existsSync(DATA_PATH)) {
        try {
            data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        } catch {
            data = {};
        }
    } else {
        data = {};
        saveData();
    }
    loaded = true;
}

function saveData() {
    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function ensureGuild(guildId) {
    if (!data[guildId]) data[guildId] = { approvalChannelId: null, sendChannelId: null };
    return data[guildId];
}

/** Ambil config confess punya 1 guild: { approvalChannelId, sendChannelId } */
export function getConfessConfig(guildId) {
    loadData();
    return ensureGuild(guildId);
}

export function setApprovalChannel(guildId, channelId) {
    loadData();
    ensureGuild(guildId).approvalChannelId = channelId;
    saveData();
}

export function setSendChannel(guildId, channelId) {
    loadData();
    ensureGuild(guildId).sendChannelId = channelId;
    saveData();
}

/**
 * 🔘 Admin klik tombol "Setting Approval Channels" / "Setting Send Messenger Channels"
 * di pesan setup `.confession` -> munculin channel select menu (ephemeral).
 * customId formatnya: confessCfgApproval_<guildId> / confessCfgSend_<guildId>
 */
export async function handleConfessConfigButton(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Cuma Administrator yang boleh atur ini, Sensei~', ephemeral: true });
    }

    const isApproval = interaction.customId.startsWith('confessCfgApproval_');
    const guildId = interaction.customId.replace('confessCfgApproval_', '').replace('confessCfgSend_', '');

    const select = new ChannelSelectMenuBuilder()
        .setCustomId(isApproval ? `confessCfgApprovalSelect_${guildId}` : `confessCfgSendSelect_${guildId}`)
        .setPlaceholder(isApproval ? 'Pilih channel approval confess...' : 'Pilih channel kirim confess...')
        .addChannelTypes(ChannelType.GuildText);

    const row = new ActionRowBuilder().addComponents(select);

    return interaction.reply({
        content: isApproval
            ? '📥 Pilih channel tempat staff/admin nge-approve atau nolak confess yang masuk:'
            : '📮 Pilih channel publik tempat confess yang udah di-approve bakal dikirim:',
        components: [row],
        ephemeral: true,
    });
}

/**
 * 📋 Admin milih channel dari channel select menu -> simpan ke config.
 * customId formatnya: confessCfgApprovalSelect_<guildId> / confessCfgSendSelect_<guildId>
 */
export async function handleConfessConfigSelect(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Cuma Administrator yang boleh atur ini, Sensei~', ephemeral: true });
    }

    const isApproval = interaction.customId.startsWith('confessCfgApprovalSelect_');
    const guildId = interaction.customId.replace('confessCfgApprovalSelect_', '').replace('confessCfgSendSelect_', '');
    const channelId = interaction.values[0];

    if (isApproval) {
        setApprovalChannel(guildId, channelId);
    } else {
        setSendChannel(guildId, channelId);
    }

    return interaction.update({
        content: isApproval
            ? `✅ Channel approval confess udah di-set ke <#${channelId}>! Sekarang confess yang masuk bakal muncul di situ buat di-approve/tolak.`
            : `✅ Channel kirim confess udah di-set ke <#${channelId}>! Confess yang di-approve bakal nongol publik di situ.`,
        components: [],
    });
}
