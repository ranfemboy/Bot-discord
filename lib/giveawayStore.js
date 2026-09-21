import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { addMoney } from './economyStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/giveawayData.json');

const giveaways = new Map();

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => giveaways.set(key, value));
        }
    } catch (error) {
        console.error('Error loading giveaway data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(giveaways), null, 2));
    } catch (error) {
        console.error('Error saving giveaway data:', error);
    }
}

load();

export function createGiveaway(giveaway) {
    giveaways.set(giveaway.id, giveaway);
    save();
    return giveaway;
}

export function getGiveaway(id) {
    return giveaways.get(id);
}

function buildButtonRow(id, disabled = false, label = '🎉 Klaim Giveaway') {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`giveaway_${id}`)
            .setLabel(label)
            .setEmoji('🎁')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled)
    );
}

export function buildGiveawayEmbed(giveaway) {
    const claimed = giveaway.claimedBy.length;
    return new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(
            `💰 Hadiah: **${giveaway.amount.toLocaleString('id-ID')} 💵** / orang\n` +
            `🎟️ Slot Klaim: **${claimed} / ${giveaway.maxUse}**\n` +
            `⏰ Berakhir: <t:${Math.floor(giveaway.expiresAt / 1000)}:R>\n\n` +
            `Klik tombol 🎁 di bawah buat klaim hadiahnya!`
        )
        .setFooter({ text: `Giveaway ID: ${giveaway.id}` })
        .setTimestamp();
}

export async function endGiveaway(client, id) {
    const giveaway = giveaways.get(id);
    if (!giveaway || giveaway.ended) return;
    giveaway.ended = true;
    save();

    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);
        const embed = buildGiveawayEmbed(giveaway).setColor('#7F8C8D').setTitle('🎉 GIVEAWAY BERAKHIR 🎉');
        await message.edit({ embeds: [embed], components: [buildButtonRow(id, true, '🔒 Giveaway Selesai')] });
    } catch (err) {
        console.error('Gagal mengakhiri giveaway:', err.message);
    }
}

export function scheduleGiveawayEnd(client, giveaway) {
    const msLeft = giveaway.expiresAt - Date.now();
    if (msLeft <= 0) {
        endGiveaway(client, giveaway.id);
        return;
    }
    // ⚠️ setTimeout cuma jalan selama proses bot alive; kalau bot restart,
    // giveaway akan otomatis ditutup saat claim berikutnya jika sudah expired.
    setTimeout(() => endGiveaway(client, giveaway.id), msLeft);
}

export async function handleGiveawayClaim(interaction) {
    const id = interaction.customId.replace('giveaway_', '');
    const giveaway = giveaways.get(id);

    if (!giveaway) {
        return interaction.reply({ content: '❌ Giveaway tidak ditemukan atau sudah dihapus.', ephemeral: true });
    }

    if (giveaway.ended || Date.now() > giveaway.expiresAt || giveaway.claimedBy.length >= giveaway.maxUse) {
        if (!giveaway.ended) await endGiveaway(interaction.client, id);
        return interaction.reply({ content: '⏰ Giveaway ini sudah berakhir atau slot-nya sudah penuh!', ephemeral: true });
    }

    if (giveaway.claimedBy.includes(interaction.user.id)) {
        return interaction.reply({ content: '❌ Kamu sudah klaim giveaway ini sebelumnya!', ephemeral: true });
    }

    giveaway.claimedBy.push(interaction.user.id);
    addMoney(giveaway.guildId, interaction.user.id, giveaway.amount);
    save();

    await interaction.reply({
        content: `🎉 Selamat! Kamu mendapatkan **${giveaway.amount.toLocaleString('id-ID')} 💵**!`,
        ephemeral: true,
    });

    const isFull = giveaway.claimedBy.length >= giveaway.maxUse;
    const embed = buildGiveawayEmbed(giveaway);
    await interaction.message.edit({
        embeds: [embed],
        components: [buildButtonRow(id, isFull)],
    });

    if (isFull) await endGiveaway(interaction.client, id);
}

export { buildButtonRow };
