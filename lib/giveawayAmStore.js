import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { getAvailableAccount, claimAccount } from './amPremStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'giveawayam.json');

let giveaways = {};
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
            giveaways = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        } catch {
            giveaways = {};
        }
    } else {
        giveaways = {};
        saveData();
    }

    loaded = true;
}

function saveData() {
    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(giveaways, null, 2));
}

export function createGiveaway({ messageId, channelId, guildId, hostId, limit }) {
    loadData();
    giveaways[messageId] = {
        messageId,
        channelId,
        guildId,
        hostId,
        limit,
        claimedUsers: [],
        ended: false,
        createdAt: Date.now(),
    };
    saveData();
    return giveaways[messageId];
}

export function getGiveaway(messageId) {
    loadData();
    return giveaways[messageId] ?? null;
}

export function hasUserClaimed(messageId, userId) {
    loadData();
    const g = giveaways[messageId];
    if (!g) return false;
    return g.claimedUsers.includes(userId);
}

export function isGiveawayFull(messageId) {
    loadData();
    const g = giveaways[messageId];
    if (!g) return true;
    return g.claimedUsers.length >= g.limit;
}

export function getRemainingSlot(messageId) {
    loadData();
    const g = giveaways[messageId];
    if (!g) return 0;
    return Math.max(0, g.limit - g.claimedUsers.length);
}

function addClaim(messageId, userId) {
    const g = giveaways[messageId];
    if (!g) return null;
    if (!g.claimedUsers.includes(userId)) {
        g.claimedUsers.push(userId);
    }
    if (g.claimedUsers.length >= g.limit) {
        g.ended = true;
    }
    saveData();
    return g;
}

// 🔘 Handler dipanggil dari index.js pas tombol "Claim ✨" di-klik
// customId format: giveawayam_claim_<messageId>
export async function handleGiveawayAmClaim(interaction, { settings }) {
    const messageId = interaction.customId.replace('giveawayam_claim_', '');
    const giveaway = getGiveaway(messageId);

    if (!giveaway) {
        return interaction.reply({ content: '❌ Giveaway ini tidak ditemukan atau sudah kadaluarsa.', ephemeral: true });
    }

    if (giveaway.ended || isGiveawayFull(messageId)) {
        return interaction.reply({ content: '❌ Giveaway ini sudah penuh / selesai, Sensei~', ephemeral: true });
    }

    if (hasUserClaimed(messageId, interaction.user.id)) {
        return interaction.reply({ content: '⚠️ Kamu udah claim akun dari giveaway ini sebelumnya, cek DM kamu ya~', ephemeral: true });
    }

    const account = getAvailableAccount();
    if (!account) {
        return interaction.reply({ content: '❌ Stok akun Alight Motion lagi habis, Sensei~ Hubungi owner buat restock ya.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    claimAccount(account.id, interaction.user.id);
    addClaim(messageId, interaction.user.id);

    const ownerButton = new ButtonBuilder()
        .setLabel('Hubungi Owner')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/users/${settings.idOwner}`);

    const dmRow = new ActionRowBuilder().addComponents(ownerButton);

    const dmEmbed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('🎉 Berhasil MengClaim Akun Alight Motion')
        .setDescription('Berikut data data alight Motion anda')
        .addFields(
            { name: '📧 Email', value: `\`${account.email}\``, inline: false },
            { name: '🔑 Akses Login', value: `\`${account.password}\``, inline: false },
        )
        .setFooter({ text: 'Jika tak tahu cara login, hubungi owner ya~' })
        .setTimestamp();

    let dmSent = true;
    try {
        await interaction.user.send({ embeds: [dmEmbed], components: [dmRow] });
    } catch (err) {
        dmSent = false;
        console.error('Gagal DM giveaway am ke user:', err);
    }

    await interaction.editReply({
        content: dmSent
            ? '✅ Berhasil claim! Cek DM kamu buat liat data akunnya ya~'
            : '⚠️ Berhasil claim, tapi DM kamu ketutup. Buka DM dari bot ini dulu, atau hubungi owner buat ambil data akunnya.',
    });

    try {
        const channel = await interaction.client.channels.fetch(giveaway.channelId);
        const giveawayMessage = await channel.messages.fetch(giveaway.messageId);
        const remaining = getRemainingSlot(messageId);

        // 🔄 Ambil ulang data giveaway biar claimedUsers-nya paling update
        const refreshed = getGiveaway(messageId);
        const claimedList = refreshed.claimedUsers.length
            ? refreshed.claimedUsers.map((id) => `<@${id}>`).join('\n')
            : 'Belum ada yang claim';

        const originalEmbed = giveawayMessage.embeds[0];
        const updatedEmbed = EmbedBuilder.from(originalEmbed)
            .setFields(
                originalEmbed.fields
                    .filter((f) => !f.name.startsWith('🎉 Sudah Claim'))
                    .concat([{ name: `🎉 Sudah Claim (${refreshed.claimedUsers.length})`, value: claimedList }])
            )
            .setFooter({
                text: remaining > 0 ? `Sisa slot: ${remaining}` : 'Giveaway sudah selesai ✅',
            });

        const claimButton = new ButtonBuilder()
            .setCustomId(`giveawayam_claim_${messageId}`)
            .setLabel(remaining > 0 ? 'Claim ✨' : 'Penuh')
            .setStyle(ButtonStyle.Success)
            .setDisabled(remaining <= 0);

        const row = new ActionRowBuilder().addComponents(claimButton);

        await giveawayMessage.edit({ embeds: [updatedEmbed], components: [row] });
    } catch (err) {
        console.error('Gagal update embed giveaway am:', err);
    }

    // 🔔 Notif ke owner
    try {
        const owner = await interaction.client.users.fetch(settings.idOwner);
        const notifEmbed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ Akun Alight Motion Diambil Lewat Giveaway')
            .addFields(
                { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
                { name: 'Server', value: interaction.guild?.name || '-' },
                { name: 'Email diambil', value: `\`${account.email}\`` },
            )
            .setTimestamp();
        await owner.send({ embeds: [notifEmbed] });
    } catch (err) {
        console.error('Gagal kirim notif giveaway am ke owner (DM tertutup?):', err);

        // 🆘 Fallback: DM owner gagal -> tetep kasih notif di channel giveaway-nya
        try {
            const fallbackChannel = await interaction.client.channels.fetch(giveaway.channelId);
            await fallbackChannel.send({
                content: `⚠️ <@${settings.idOwner}> gagal kirim DM notif giveaway (DM mungkin tertutup). ${interaction.user.tag} baru saja klaim akun \`${account.email}\` dari giveaway.`,
            });
        } catch (fallbackErr) {
            console.error('Fallback notif giveaway am juga gagal:', fallbackErr);
        }
    }
}