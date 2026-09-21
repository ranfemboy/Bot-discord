import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { RARITY, rollWildPokemon, formatTypes, randomBetween, SHOP_ITEMS } from './pokemonData.js';
import { getAccount, addPokeball, removePokeball, addPokemon, addCoins, isRegistered } from './pokemonStore.js';

const pending = new Map();

// 🎯 Urutan prioritas ball yang otomatis dipakai pas Tangkap ditekan (paling kuat duluan)
const BALL_PRIORITY = ['masterball', 'ultraball', 'greatball', 'pokeball'];

// 🌱 Range level pokemon liar berdasarkan rarity-nya
const WILD_LEVEL_RANGE = {
    common: [2, 8],
    uncommon: [5, 14],
    rare: [10, 22],
    legendary: [20, 35],
};

function rollWildLevel(rarity) {
    const [min, max] = WILD_LEVEL_RANGE[rarity] || [2, 8];
    return randomBetween(min, max);
}

export function createEksplorJob(guildId, userId) {
    const species = rollWildPokemon();
    const level = rollWildLevel(species.rarity);
    const id = Math.random().toString(36).slice(2, 10);
    pending.set(id, { guildId, userId, species, level, createdAt: Date.now() });
    setTimeout(() => pending.delete(id), 5 * 60 * 1000);
    return { id, species, level };
}

function buildActionRow(jobId, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`eksplor_tangkap_${jobId}`)
            .setLabel('Tangkap')
            .setEmoji('🔴')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`eksplor_kabur_${jobId}`)
            .setLabel('Kabur')
            .setEmoji('🏃')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
    );
}

export function buildEksplorMessage(jobId, species, level) {
    const rarity = RARITY[species.rarity];
    const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`🌿 Seekor Pokemon Liar Muncul!`)
        .setThumbnail(species.sprite)
        .setImage(species.sprite)
        .addFields(
            { name: '📛 Nama', value: species.name, inline: true },
            { name: `${rarity.emoji} Rarity`, value: rarity.label, inline: true },
            { name: '📊 Level', value: `${level}`, inline: true },
            { name: '🏷️ Tipe', value: formatTypes(species.types), inline: false }
        )
        .setFooter({ text: 'Ketik cepat! Kesempatan bisa hilang kalau kelamaan mikir 👀' })
        .setTimestamp();

    return { embeds: [embed], components: [buildActionRow(jobId)] };
}

export async function handleEksplorButton(interaction) {
    const [, action, jobId] = interaction.customId.split('_');
    const job = pending.get(jobId);

    if (!job) {
        return interaction.reply({ content: '❌ Sesi eksplor sudah kedaluwarsa, ketik ulang `.eksplor` ya.', ephemeral: true });
    }
    if (interaction.user.id !== job.userId) {
        return interaction.reply({ content: '❌ Ini bukan sesi eksplor kamu!', ephemeral: true });
    }

    const { guildId, userId, species, level } = job;

    if (action === 'kabur') {
        pending.delete(jobId);
        return interaction.update({
            content: `🏃 Kamu memutuskan kabur dari **${species.name}** liar itu.`,
            embeds: [],
            components: [],
        });
    }

    if (action === 'tangkap') {
        if (!isRegistered(guildId, userId)) {
            pending.delete(jobId);
            return interaction.update({ content: '❌ Kamu belum `.daftar`! Sesi eksplor dibatalkan.', embeds: [], components: [] });
        }

        const acc = getAccount(guildId, userId);
        const ballKey = BALL_PRIORITY.find((k) => (acc.pokeballs[k] || 0) > 0);

        if (!ballKey) {
            pending.delete(jobId);
            return interaction.update({
                content: '❌ Kamu tidak punya Pokeball sama sekali! Beli dulu di `.pokeshop`.',
                embeds: [],
                components: [],
            });
        }

        removePokeball(guildId, userId, ballKey);
        const ball = SHOP_ITEMS[ballKey];
        const rarity = RARITY[species.rarity];

        const isGuaranteed = ballKey === 'masterball';
        const chance = Math.min(0.95, rarity.catchRate * ball.catchMult);
        const success = isGuaranteed || Math.random() < chance;

        pending.delete(jobId);

        if (!success) {
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('💨 Gagal Menangkap!')
                .setThumbnail(species.sprite)
                .setDescription(
                    `**${species.name}** ${rarity.emoji} lepas dari **${ball.emoji} ${ball.label}** dan langsung kabur!\n` +
                    `_${ball.emoji} ${ball.label} yang dipakai tetap habis terpakai._`
                )
                .setTimestamp();
            return interaction.update({ content: '', embeds: [embed], components: [] });
        }

        const mon = addPokemon(guildId, userId, species.key, level);
        const bonusCoin = randomBetween(rarity.coin[0], rarity.coin[1]);
        addCoins(guildId, userId, bonusCoin);

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🎉 Berhasil Menangkap Pokemon!')
            .setThumbnail(species.sprite)
            .addFields(
                { name: '📛 Pokemon', value: `${species.name} ${rarity.emoji}`, inline: true },
                { name: '📊 Level', value: `${level}`, inline: true },
                { name: '🆔 UID', value: mon.uid, inline: true },
                { name: `${ball.emoji} Ball Dipakai`, value: ball.label, inline: true },
                { name: '💰 Bonus Koin', value: `+${bonusCoin.toLocaleString('id-ID')} 🪙`, inline: true }
            )
            .setFooter({ text: 'Cek koleksi kamu lewat .kandang' })
            .setTimestamp();

        return interaction.update({ content: '', embeds: [embed], components: [] });
    }
}
