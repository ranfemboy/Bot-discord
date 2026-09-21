/**
 * Gacha Waifu — Discord version
 * -----------------------------
 * Converted from ESM plugin (m.sender/getDatabase) by Claude
 *
 * Fitur: gacha waifu random seharga 4000 💵 per spin, dipotong dari uang
 * di economyStore (sistem yang sama dipakai .buy, .shop, dll).
 * Ada tombol merah "Skip ⏩" di bawah hasil kalau waifu-nya kurang cocok —
 * klik tombolnya bakal gacha ulang otomatis (potong 4000 lagi).
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUser as getEconomyUser, removeMoney } from '../../lib/economyStore.js';
import { addWaifuToCollection, removeLastFromCollection } from '../../lib/waifuStore.js';
import { rollWaifu, rarityEmoji, GACHA_COST } from '../../lib/waifuData.js';
import { createSession, getSession, refreshSession, deleteSession } from '../../lib/gachaSessionStore.js';

export const config = {
    name: 'gachawaifu',
    alias: ['summonwaifu', 'gacha'],
    category: 'gacha',
    description: 'Gacha waifu random seharga 4000 💵 per spin',
    usage: '.gachawaifu',
    example: '.gachawaifu',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

function buildContent({ author, waifu, remainingMoney }) {
    let text = `✨ *WAIFU GACHA* ✨\n\n`;
    text += `🌸 Nama : ${waifu.name}\n`;
    text += `📺 Anime : ${waifu.anime}\n`;
    text += `🏆 Rarity : ${rarityEmoji(waifu.rarity)}\n\n`;
    text += `💸 Biaya Gacha : ${GACHA_COST.toLocaleString('id-ID')} 💵\n`;
    text += `💰 Sisa Uang : ${remainingMoney.toLocaleString('id-ID')} 💵\n\n`;
    text += `📦 Waifu berhasil masuk ke koleksi.\n`;
    text += `Gunakan *.koleksiwaifu* untuk melihat koleksi, atau tekan tombol di bawah kalau kurang cocok.`;
    return text;
}

function buildComponents(sessionId) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`gachaSkip_${sessionId}`)
                .setLabel('Skip ⏩')
                .setStyle(ButtonStyle.Danger)
        ),
    ];
}

export async function handler(m) {
    try {
        const economyUser = getEconomyUser(m.guild.id, m.author.id);
        if (economyUser.money < GACHA_COST) {
            return m.reply(
                `❌ Uang kamu tidak cukup!\n\n` +
                `💸 Butuh : ${GACHA_COST.toLocaleString('id-ID')} 💵\n` +
                `💰 Kamu punya : ${economyUser.money.toLocaleString('id-ID')} 💵`
            );
        }

        removeMoney(m.guild.id, m.author.id, GACHA_COST);

        const waifu = rollWaifu();
        addWaifuToCollection(m.guild.id, m.author.id, waifu);

        const remaining = getEconomyUser(m.guild.id, m.author.id).money;
        const sessionId = createSession({ ownerId: m.author.id, guildId: m.guild.id });

        return m.reply({
            content: buildContent({ author: m.author, waifu, remainingMoney: remaining }),
            components: buildComponents(sessionId),
        });
    } catch (err) {
        console.error('gachawaifu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}

// ────────────────────────────────
// 🖱 Interaction handler tombol "Skip ⏩" (dipanggil dari handler/interactionHandler.js)
// ────────────────────────────────
export async function handleGachaSkip(interaction) {
    const sessionId = interaction.customId.replace('gachaSkip_', '');
    const session = getSession(sessionId);

    if (!session) {
        return interaction.reply({ content: '❌ Sesi gacha ini udah kadaluarsa, coba `.gachawaifu` lagi ya.', ephemeral: true });
    }
    if (interaction.user.id !== session.ownerId) {
        return interaction.reply({ content: '❌ Tombol ini bukan buat kamu.', ephemeral: true });
    }

    const economyUser = getEconomyUser(session.guildId, session.ownerId);
    if (economyUser.money < GACHA_COST) {
        deleteSession(sessionId);
        return interaction.update({
            content:
                `❌ Uang kamu tidak cukup buat skip/gacha ulang.\n\n` +
                `💸 Butuh : ${GACHA_COST.toLocaleString('id-ID')} 💵\n` +
                `💰 Kamu punya : ${economyUser.money.toLocaleString('id-ID')} 💵`,
            components: [],
        });
    }

    // Buang waifu hasil gacha sebelumnya, lalu potong uang & gacha ulang
    removeLastFromCollection(session.guildId, session.ownerId);
    removeMoney(session.guildId, session.ownerId, GACHA_COST);

    const waifu = rollWaifu();
    addWaifuToCollection(session.guildId, session.ownerId, waifu);

    const remaining = getEconomyUser(session.guildId, session.ownerId).money;
    refreshSession(sessionId);

    await interaction.update({
        content: buildContent({ author: interaction.user, waifu, remainingMoney: remaining }),
        components: buildComponents(sessionId),
    });
}
