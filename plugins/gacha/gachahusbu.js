/**
 * Gacha Husbu — Discord version
 * -----------------------------
 * Versi cowok dari gachawaifu.js
 *
 * Fitur: gacha husbu random seharga 4000 💵 per spin, dipotong dari uang
 * di economyStore. Ada tombol merah "Skip ⏩" di bawah hasil kalau husbu-nya
 * kurang cocok — klik tombolnya bakal gacha ulang otomatis (potong 4000 lagi).
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getUser as getEconomyUser, removeMoney } from '../../lib/economyStore.js';
import { addHusbuToCollection, removeLastFromCollection } from '../../lib/husbuStore.js';
import { rollHusbu, rarityEmoji, GACHA_COST } from '../../lib/husbuData.js';
import { createSession, getSession, refreshSession, deleteSession } from '../../lib/gachaHusbuSessionStore.js';

export const config = {
    name: 'gachahusbu',
    alias: ['summonhusbu', 'gachahusband'],
    category: 'gacha',
    description: 'Gacha husbu random seharga 4000 💵 per spin',
    usage: '.gachahusbu',
    example: '.gachahusbu',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

function buildContent({ husbu, remainingMoney }) {
    let text = `✨ *HUSBU GACHA* ✨\n\n`;
    text += `🤵 Nama : ${husbu.name}\n`;
    text += `📺 Anime : ${husbu.anime}\n`;
    text += `🏆 Rarity : ${rarityEmoji(husbu.rarity)}\n\n`;
    text += `💸 Biaya Gacha : ${GACHA_COST.toLocaleString('id-ID')} 💵\n`;
    text += `💰 Sisa Uang : ${remainingMoney.toLocaleString('id-ID')} 💵\n\n`;
    text += `📦 Husbu berhasil masuk ke koleksi.\n`;
    text += `Gunakan *.koleksihusbu* untuk melihat koleksi, atau tekan tombol di bawah kalau kurang cocok.`;
    return text;
}

function buildComponents(sessionId) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`gachaHusbuSkip_${sessionId}`)
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

        const husbu = rollHusbu();
        addHusbuToCollection(m.guild.id, m.author.id, husbu);

        const remaining = getEconomyUser(m.guild.id, m.author.id).money;
        const sessionId = createSession({ ownerId: m.author.id, guildId: m.guild.id });

        return m.reply({
            content: buildContent({ husbu, remainingMoney: remaining }),
            components: buildComponents(sessionId),
        });
    } catch (err) {
        console.error('gachahusbu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}

// ────────────────────────────────
// 🖱 Interaction handler tombol "Skip ⏩" (dipanggil dari handler/interactionHandler.js)
// ────────────────────────────────
export async function handleGachaHusbuSkip(interaction) {
    const sessionId = interaction.customId.replace('gachaHusbuSkip_', '');
    const session = getSession(sessionId);

    if (!session) {
        return interaction.reply({ content: '❌ Sesi gacha ini udah kadaluarsa, coba `.gachahusbu` lagi ya.', ephemeral: true });
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

    // Buang husbu hasil gacha sebelumnya, lalu potong uang & gacha ulang
    removeLastFromCollection(session.guildId, session.ownerId);
    removeMoney(session.guildId, session.ownerId, GACHA_COST);

    const husbu = rollHusbu();
    addHusbuToCollection(session.guildId, session.ownerId, husbu);

    const remaining = getEconomyUser(session.guildId, session.ownerId).money;
    refreshSession(sessionId);

    await interaction.update({
        content: buildContent({ husbu, remainingMoney: remaining }),
        components: buildComponents(sessionId),
    });
}
