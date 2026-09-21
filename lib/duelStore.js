import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { POKEMON_LIST, statsAtLevel, typeMultiplier, randomBetween } from './pokemonData.js';
import { getLeadPokemon, updatePokemon, gainExp, addCoins } from './pokemonStore.js';

const pending = new Map();

export function createDuelChallenge(guildId, channelId, challengerId, targetId) {
    const id = Math.random().toString(36).slice(2, 10);
    pending.set(id, { guildId, channelId, challengerId, targetId, createdAt: Date.now() });
    setTimeout(() => pending.delete(id), 3 * 60 * 1000);
    return id;
}

export function buildChallengeMessage(id, challenger, target) {
    const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('⚔️ TANTANGAN DUEL POKEMON!')
        .setDescription(`${challenger} menantang ${target} buat duel pakai Pokemon andalan mereka! 🔥`)
        .setFooter({ text: 'Tantangan otomatis batal dalam 3 menit kalau tidak direspon.' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`duel_accept_${id}`).setLabel('Terima').setEmoji('✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`duel_decline_${id}`).setLabel('Tolak').setEmoji('❌').setStyle(ButtonStyle.Danger)
    );

    return { embeds: [embed], components: [row] };
}

// ⚔️ Simulasikan 1 ronde penuh pertarungan, pakai HP tersimpan (currentHp) sebagai titik awal
function simulateBattle(guildId, aUserId, bUserId, leadA, leadB) {
    const speciesA = POKEMON_LIST[leadA.key];
    const speciesB = POKEMON_LIST[leadB.key];
    const statA = statsAtLevel(speciesA, leadA.level);
    const statB = statsAtLevel(speciesB, leadB.level);

    let hpA = leadA.currentHp;
    let hpB = leadB.currentHp;
    const log = [];
    let turn = 'A'; // challenger duluan
    let round = 0;
    const MAX_ROUNDS = 30;

    while (hpA > 0 && hpB > 0 && round < MAX_ROUNDS) {
        round++;
        if (turn === 'A') {
            const mult = typeMultiplier(speciesA.types[0], speciesB.types);
            const variance = 0.85 + Math.random() * 0.3;
            const dmg = Math.max(1, Math.round(statA.atk * mult * variance - statB.def * 0.4));
            hpB = Math.max(0, hpB - dmg);
            const note = mult > 1 ? ' (Sangat efektif! 💥)' : mult < 1 && mult > 0 ? ' (Kurang efektif...)' : mult === 0 ? ' (Tidak berpengaruh!)' : '';
            log.push(`R${round}: **${speciesA.name}** menyerang → **${dmg} dmg**${note} (HP ${speciesB.name}: ${hpB}/${statB.maxHp})`);
        } else {
            const mult = typeMultiplier(speciesB.types[0], speciesA.types);
            const variance = 0.85 + Math.random() * 0.3;
            const dmg = Math.max(1, Math.round(statB.atk * mult * variance - statA.def * 0.4));
            hpA = Math.max(0, hpA - dmg);
            const note = mult > 1 ? ' (Sangat efektif! 💥)' : mult < 1 && mult > 0 ? ' (Kurang efektif...)' : mult === 0 ? ' (Tidak berpengaruh!)' : '';
            log.push(`R${round}: **${speciesB.name}** menyerang → **${dmg} dmg**${note} (HP ${speciesA.name}: ${hpA}/${statA.maxHp})`);
        }
        turn = turn === 'A' ? 'B' : 'A';
    }

    let winner; // 'A' | 'B' | 'draw'
    if (hpA <= 0 && hpB <= 0) winner = 'draw';
    else if (hpA <= 0) winner = 'B';
    else if (hpB <= 0) winner = 'A';
    else winner = hpA / statA.maxHp >= hpB / statB.maxHp ? 'A' : 'B'; // habis ronde, bandingkan sisa HP%

    return { hpA, hpB, statA, statB, speciesA, speciesB, log, winner, round };
}

export async function handleDuelButton(interaction) {
    const [, action, id] = interaction.customId.split('_');
    const job = pending.get(id);

    if (!job) {
        return interaction.reply({ content: '❌ Tantangan duel ini sudah kedaluwarsa atau sudah diproses.', ephemeral: true });
    }
    if (interaction.user.id !== job.targetId) {
        return interaction.reply({ content: '❌ Cuma orang yang ditantang yang bisa merespon ini!', ephemeral: true });
    }

    const { guildId, challengerId, targetId } = job;

    if (action === 'decline') {
        pending.delete(id);
        return interaction.update({ content: `❌ <@${targetId}> menolak tantangan duel dari <@${challengerId}>.`, embeds: [], components: [] });
    }

    pending.delete(id);

    const leadA = getLeadPokemon(guildId, challengerId);
    const leadB = getLeadPokemon(guildId, targetId);

    if (!leadA) return interaction.update({ content: `❌ <@${challengerId}> belum punya Pokemon sama sekali! Duel dibatalkan.`, embeds: [], components: [] });
    if (!leadB) return interaction.update({ content: `❌ <@${targetId}> belum punya Pokemon sama sekali! Duel dibatalkan.`, embeds: [], components: [] });
    if (leadA.currentHp <= 0) return interaction.update({ content: `❌ Pokemon andalan <@${challengerId}> sekarat! Sembuhkan dulu lewat \`.healpoke\`.`, embeds: [], components: [] });
    if (leadB.currentHp <= 0) return interaction.update({ content: `❌ Pokemon andalan <@${targetId}> sekarat! Sembuhkan dulu lewat \`.healpoke\`.`, embeds: [], components: [] });

    const result = simulateBattle(guildId, challengerId, targetId, leadA, leadB);

    // 💾 Simpan HP terbaru ke masing-masing pokemon
    updatePokemon(guildId, challengerId, leadA.uid, { currentHp: result.hpA });
    updatePokemon(guildId, targetId, leadB.uid, { currentHp: result.hpB });

    let resultText;
    let winnerId = null, loserId = null, winnerMonUid = null, loserMonUid = null, winnerLevel = 0, loserLevel = 0;

    if (result.winner === 'draw') {
        resultText = '🤝 **SERI!** Kedua Pokemon sama-sama tumbang di ronde terakhir.';
    } else if (result.winner === 'A') {
        resultText = `🏆 **${result.speciesA.name}** milik <@${challengerId}> MENANG!`;
        winnerId = challengerId; loserId = targetId;
        winnerMonUid = leadA.uid; loserMonUid = leadB.uid;
        winnerLevel = leadA.level; loserLevel = leadB.level;
    } else {
        resultText = `🏆 **${result.speciesB.name}** milik <@${targetId}> MENANG!`;
        winnerId = targetId; loserId = challengerId;
        winnerMonUid = leadB.uid; loserMonUid = leadA.uid;
        winnerLevel = leadB.level; loserLevel = leadA.level;
    }

    let rewardText = '';
    if (winnerId) {
        const coinReward = 150 + loserLevel * 5;
        addCoins(guildId, winnerId, coinReward);
        addCoins(guildId, loserId, 25); // konsolasi kecil biar gak nyesek amat

        const { leveledUp: winnerLvUp } = gainExp(guildId, winnerId, winnerMonUid, 45 + loserLevel * 3) || {};
        gainExp(guildId, loserId, loserMonUid, 15);

        rewardText =
            `\n💰 <@${winnerId}> dapat **+${coinReward.toLocaleString('id-ID')} 🪙** (+25 🪙 konsolasi buat <@${loserId}>)` +
            (winnerLvUp ? `\n🆙 Pokemon <@${winnerId}> naik **${winnerLvUp} level**!` : '');
    }

    // 📜 Log dipotong biar gak kepanjangan buat 1 embed field (limit 1024 char)
    const trimmedLog = result.log.length > 12
        ? [...result.log.slice(0, 5), `_...${result.log.length - 10} ronde dilewati..._`, ...result.log.slice(-5)]
        : result.log;

    const embed = new EmbedBuilder()
        .setColor(result.winner === 'draw' ? '#95A5A6' : '#F1C40F')
        .setTitle('⚔️ HASIL DUEL POKEMON')
        .addFields(
            { name: `🔵 ${result.speciesA.name} (Lv.${leadA.level}) — <@${challengerId}>`, value: `❤️ HP Akhir: ${result.hpA}/${result.statA.maxHp}`, inline: true },
            { name: `🔴 ${result.speciesB.name} (Lv.${leadB.level}) — <@${targetId}>`, value: `❤️ HP Akhir: ${result.hpB}/${result.statB.maxHp}`, inline: true },
            { name: '📜 Jalannya Duel', value: trimmedLog.join('\n').slice(0, 1024) || '-', inline: false },
            { name: '🎯 Hasil', value: resultText + rewardText, inline: false }
        )
        .setFooter({ text: `Total ${result.round} ronde` })
        .setTimestamp();

    return interaction.update({ content: '', embeds: [embed], components: [] });
}
