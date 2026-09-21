import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { getUser, setUser } from './economyStore.js';
import { ANIMALS, MELEE_TIER_MULTIPLIER, MELEE_EXTRA_COUNTER_CHANCE, randomBetween } from './rpgData.js';

const pending = new Map();

export function createHuntJob(animalKey, authorId, guildId) {
    const id = Math.random().toString(36).slice(2, 10);
    pending.set(id, { animalKey, authorId, guildId, createdAt: Date.now() });
    setTimeout(() => pending.delete(id), 5 * 60 * 1000);
    return id;
}

function buildWeaponRow(jobId, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`hunt_pedang_${jobId}`)
            .setLabel('Pedang')
            .setEmoji('🗡️')
            .setStyle(ButtonStyle.Primary) // biru
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`hunt_busur_${jobId}`)
            .setLabel('Busur')
            .setEmoji('🏹')
            .setStyle(ButtonStyle.Danger) // merah
            .setDisabled(disabled)
    );
}

export function buildInitialHuntMessage(jobId, animal) {
    return {
        content: `${animal.emoji} Mau berburu **${animal.label}** pakai senjata apa?`,
        components: [buildWeaponRow(jobId)],
    };
}

export async function handleHuntButton(interaction) {
    const [, weapon, jobId] = interaction.customId.split('_');
    const job = pending.get(jobId);

    if (!job) {
        return interaction.reply({ content: '❌ Sesi berburu sudah kedaluwarsa, ketik ulang `.hunt` ya.', ephemeral: true });
    }
    if (interaction.user.id !== job.authorId) {
        return interaction.reply({ content: '❌ Ini bukan sesi berburu kamu!', ephemeral: true });
    }

    const animal = ANIMALS[job.animalKey];
    const user = getUser(job.guildId, job.authorId);

    if (user.hp <= 0) {
        pending.delete(jobId);
        return interaction.update({ content: '💀 HP kamu habis! Gunakan `.heal` dulu sebelum berburu lagi.', components: [] });
    }

    let reward, counterChance, counterDamage, usedLabel, usedValue;

    if (weapon === 'busur') {
        if (!user.weapons.busur) {
            return interaction.reply({ content: '❌ Kamu belum punya **Busur** 🏹! Beli dulu di `.shop`.', ephemeral: true });
        }
        if (user.arrows < animal.arrows) {
            return interaction.reply({
                content: `❌ Anak panah kamu kurang! Butuh **${animal.arrows} 🎯**, kamu punya **${user.arrows} 🎯**.`,
                ephemeral: true,
            });
        }
        user.arrows -= animal.arrows;
        reward = randomBetween(animal.reward[0], animal.reward[1]);
        counterChance = animal.counterChance || 0;
        counterDamage = animal.counterDamage || [5, 10];
        usedLabel = '🎯 Panah Terpakai';
        usedValue = `${animal.arrows}x (sisa ${user.arrows})`;
    } else if (weapon === 'pedang') {
        const tier = user.weapons.pedang;
        if (!tier) {
            return interaction.reply({ content: '❌ Kamu belum punya **Pedang** 🗡️! Beli dulu di `.shop`.', ephemeral: true });
        }
        const multiplier = MELEE_TIER_MULTIPLIER[tier] ?? 1;
        reward = Math.round(randomBetween(animal.reward[0], animal.reward[1]) * multiplier);
        counterChance = Math.min(1, (animal.counterChance || 0) + MELEE_EXTRA_COUNTER_CHANCE);
        counterDamage = animal.counterDamage || [5, 10];
        usedLabel = '⚔️ Senjata Dipakai';
        usedValue = `Pedang ${tier} 🗡️ (tanpa panah)`;
    } else {
        return interaction.reply({ content: '❌ Senjata tidak dikenal.', ephemeral: true });
    }

    user.money += reward;

    let counterText = '';
    if (counterChance && Math.random() < counterChance) {
        const dmg = randomBetween(counterDamage[0], counterDamage[1]);
        user.hp = Math.max(0, user.hp - dmg);
        counterText = `\n💥 **${animal.label}** melawan balik dan kamu kena **${dmg} damage**!`;
    }

    setUser(job.guildId, job.authorId, user);
    pending.delete(jobId);

    const embed = new EmbedBuilder()
        .setColor(counterText ? '#E74C3C' : '#27AE60')
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTitle(`${animal.emoji} Berhasil Memburu ${animal.label}!`)
        .addFields(
            { name: usedLabel, value: usedValue, inline: true },
            { name: '💰 Uang Didapat', value: `+${reward.toLocaleString('id-ID')} 💵`, inline: true },
            { name: '❤️ HP Saat Ini', value: `${user.hp} / ${user.maxHp}`, inline: true }
        )
        .setDescription(counterText || null)
        .setTimestamp();

    await interaction.update({ content: '', embeds: [embed], components: [] });
}