import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { addMoney } from './economyStore.js';

/*
✦ WEREWOLF GAME (Discord edition)
✦ Semua aksi malam (kill/protect/lihat role/investigasi) dikirim & dijawab
  lewat DM pakai Button, biar role tetap rahasia dari player lain & dari
  channel grup.
✦ State disimpan in-memory (Map), key-nya channel ID tempat `.ww create`
  dijalankan. Hilang kalau bot restart — sama kayak versi aslinya.
*/

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 15;
export const PHASE_DURATION = {
    night: 60_000, // 60 detik
    day: 90_000,   // 90 detik
};
const WIN_REWARD = 5000; // 💰 koin buat tim pemenang

export const ROLES = {
    werewolf: { emoji: '🐺', name: 'Werewolf', team: 'wolf', desc: 'Bunuh warga tiap malam' },
    seer: { emoji: '🔮', name: 'Seer', team: 'village', desc: 'Intip role player tiap malam (tapi hasilnya kadang meleset)' },
    guardian: { emoji: '🛡️', name: 'Guardian', team: 'village', desc: 'Lindungi 1 player tiap malam' },
    sorcerer: { emoji: '🧙', name: 'Sorcerer', team: 'wolf', desc: 'Investigasi apakah target Seer atau bukan' },
    witch: { emoji: '👼', name: 'Witch', team: 'village', desc: '1x ramuan hidup & 1x ramuan racun sepanjang game' },
    sheriff: { emoji: '🕵️', name: 'Sheriff', team: 'village', desc: 'Tebak identitas werewolf, 3 kesempatan sepanjang game' },
    mimic: { emoji: '🎭', name: 'Mimic', team: 'wolf', desc: 'Selalu ke-detect sebagai warga biasa oleh Seer' },
    ghost: { emoji: '👻', name: 'Ghost', team: 'village', desc: 'Kirim 1 clue anonim ke channel setelah mati' },
    villager: { emoji: '👨‍🌾', name: 'Villager', team: 'village', desc: 'Diskusi & vote di siang hari' },
};

const games = new Map(); // channelId -> game state

function getGame(channelId) {
    return games.get(channelId);
}

function clearGameTimeout(game) {
    if (game?.timeout) clearTimeout(game.timeout);
}

function deleteGame(channelId) {
    const game = games.get(channelId);
    clearGameTimeout(game);
    games.delete(channelId);
}

// 🔍 Cek apakah user lagi main di channel lain (biar gak nyambi 2 game sekaligus)
function findActiveRoomFor(userId) {
    for (const [channelId, game] of games.entries()) {
        if (game.players.some((p) => p.id === userId)) return channelId;
    }
    return null;
}

// Bagi role sesuai jumlah player (distribusi sama kayak versi WA-nya)
function generateRoles(playerCount) {
    const roles = [];

    if (playerCount === 4) roles.push('werewolf', 'seer', 'guardian', 'villager');
    else if (playerCount === 5) roles.push('werewolf', 'seer', 'guardian', 'villager', 'villager');
    else if (playerCount === 6) roles.push('werewolf', 'werewolf', 'seer', 'guardian', 'villager', 'villager');
    else if (playerCount === 7) roles.push('werewolf', 'werewolf', 'seer', 'guardian', 'witch', 'villager', 'villager');
    else if (playerCount === 8) roles.push('werewolf', 'werewolf', 'seer', 'guardian', 'witch', 'villager', 'villager', 'villager');
    else if (playerCount === 9) roles.push('werewolf', 'werewolf', 'seer', 'guardian', 'sorcerer', 'witch', 'villager', 'villager', 'villager');
    else if (playerCount === 10) roles.push('werewolf', 'werewolf', 'seer', 'guardian', 'sorcerer', 'witch', 'sheriff', 'villager', 'villager', 'villager');
    else if (playerCount === 11) roles.push('werewolf', 'werewolf', 'mimic', 'seer', 'guardian', 'sorcerer', 'witch', 'sheriff', 'villager', 'villager', 'villager');
    else if (playerCount === 12) roles.push('werewolf', 'werewolf', 'mimic', 'seer', 'guardian', 'sorcerer', 'witch', 'sheriff', 'ghost', 'villager', 'villager', 'villager');
    else {
        roles.push('werewolf', 'werewolf', 'werewolf', 'mimic', 'seer', 'guardian', 'sorcerer', 'witch', 'sheriff', 'ghost');
        while (roles.length < playerCount) roles.push('villager');
    }

    for (let i = roles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    return roles;
}

function getRoleDescription(role, prefix) {
    const d = {
        werewolf:
            `🐺 **WEREWOLF**\n\nKamu adalah predator malam!\n\n` +
            `🎯 Tujuan: Habisi semua Villager\n` +
            `⚔️ Skill: Bunuh 1 player tiap malam\n\n` +
            `Cek DM ini tiap malam, bakal ada tombol buat pilih target 🐾`,
        seer:
            `🔮 **SEER**\n\nKamu bisa mengintip identitas player!\n\n` +
            `🎯 Tujuan: Bantu Villager\n` +
            `🔮 Skill: Intip role 1 player tiap malam\n` +
            `⚠️ Tapi hati-hati, penglihatanmu **gak selalu akurat**...\n\n` +
            `Cek DM ini tiap malam buat pilih siapa yang mau diintip 👀`,
        guardian:
            `🛡️ **GUARDIAN**\n\nKamu pelindung warga!\n\n` +
            `🎯 Tujuan: Lindungi Villager dari Werewolf\n` +
            `🛡️ Skill: Lindungi 1 player tiap malam\n\n` +
            `Cek DM ini tiap malam buat pilih siapa yang mau dilindungi 🛡️`,
        sorcerer:
            `🧙 **SORCERER**\n\nKamu sekutu Werewolf!\n\n` +
            `🎯 Tujuan: Bantu Werewolf menang\n` +
            `🔍 Skill: Investigasi apakah target itu Seer atau bukan\n\n` +
            `Cek DM ini tiap malam buat pilih target investigasi 🧙`,
        villager:
            `👨‍🌾 **VILLAGER**\n\nKamu warga biasa!\n\n` +
            `🎯 Tujuan: Temukan & vote Werewolf sampai habis\n` +
            `🗳️ Skill: Vote di siang hari lewat tombol di channel\n\n` +
            `Gak ada aksi malam — perhatikan baik-baik siapa yang mencurigakan 👀`,
        witch:
            `👼 **WITCH / BIDAN**\n\nKamu punya 2 ramuan sakti seumur hidup game ini!\n\n` +
            `🎯 Tujuan: Bantu Villager bertahan hidup\n` +
            `💊 Ramuan Hidup: Selamatkan korban werewolf (1x sepanjang game, bukan tiap malam)\n` +
            `🧪 Ramuan Racun: Bunuh siapa aja (1x sepanjang game, bukan tiap malam)\n\n` +
            `Cek DM tiap malam — racun bisa dipakai kapan aja, ramuan hidup ditawarkan pas ada yang diserang werewolf 👼`,
        sheriff:
            `🕵️ **SHERIFF**\n\nKamu penyelidik tajam!\n\n` +
            `🎯 Tujuan: Bantu Villager temukan Werewolf\n` +
            `🔫 Skill: Pilih target, lalu tebak apakah dia Werewolf atau bukan\n` +
            `❤️ Kamu punya 3 kesempatan sepanjang game — tebakan BENAR bikin target langsung tereliminasi pas pagi, tebakan SALAH ngurangin sisa kesempatanmu\n\n` +
            `Cek DM tiap malam buat mulai menyelidik 🕵️`,
        mimic:
            `🎭 **IMPOSTOR / MIMIC**\n\nKamu penyamar ulung dari kubu Werewolf!\n\n` +
            `🎯 Tujuan: Bantu Werewolf menang\n` +
            `🎭 Skill: Pasif — kalau di-intip Seer, kamu SELALU keliatan sebagai warga biasa (tim Village)\n\n` +
            `Gak ada aksi malam, cukup berbaur sama Villager dan biarkan Seer salah curiga 🎭`,
        ghost:
            `👻 **GHOST / SPIRIT**\n\nKamu warga biasa... tapi punya rahasia!\n\n` +
            `🎯 Tujuan: Bantu Villager temukan Werewolf\n` +
            `👻 Skill: Begitu kamu MATI, kamu masih bisa kirim 1 pesan/clue anonim ke channel buat bantu yang masih hidup\n\n` +
            `Gak ada aksi malam selagi hidup — perhatikan baik-baik siapa yang mencurigakan 👀`,
    };
    return d[role] || 'Unknown role';
}

// ─────────────────────────────────────────────────────────
// LOBBY
// ─────────────────────────────────────────────────────────

export function createGame(channelId, guildId, owner) {
    const game = {
        channelId,
        guildId,
        owner: owner.id,
        status: 'waiting',
        day: 0,
        phase: 'lobby',
        players: [{ id: owner.id, username: owner.username, number: 1, role: null, alive: true, voted: false, skillUsed: false, potions: null, hearts: null, ghostClueUsed: false }],
        dead: [],
        votes: {},
        voters: {},
        nightActions: { kill: null, protect: null, witchHeal: false, witchPoison: null, sheriffKill: null },
        createdAt: Date.now(),
        timeout: null,
    };
    games.set(channelId, game);
    return game;
}

export function joinGame(channelId, user) {
    const game = getGame(channelId);
    if (!game) return { ok: false, message: `❌ Belum ada room! Ketik \`.ww create\` dulu.` };
    if (game.status !== 'waiting') return { ok: false, message: '❌ Game sudah dimulai! Tunggu ronde berikutnya.' };
    if (game.players.length >= MAX_PLAYERS) return { ok: false, message: `❌ Room penuh! (Max ${MAX_PLAYERS} player)` };
    if (game.players.some((p) => p.id === user.id)) return { ok: false, message: '❌ Kamu sudah bergabung!' };

    const activeRoom = findActiveRoomFor(user.id);
    if (activeRoom && activeRoom !== channelId) return { ok: false, message: '❌ Kamu masih dalam game di channel lain!' };

    game.players.push({ id: user.id, username: user.username, number: game.players.length + 1, role: null, alive: true, voted: false, skillUsed: false, potions: null, hearts: null, ghostClueUsed: false });
    return { ok: true, game };
}

export function leaveGame(channelId, userId) {
    const game = getGame(channelId);
    if (!game) return { ok: false, message: '❌ Tidak ada game di channel ini!' };
    if (game.status === 'playing') return { ok: false, message: '❌ Tidak bisa keluar saat game berjalan!' };

    const idx = game.players.findIndex((p) => p.id === userId);
    if (idx === -1) return { ok: false, message: '❌ Kamu tidak ada di game ini!' };

    game.players.splice(idx, 1);
    game.players.forEach((p, i) => (p.number = i + 1));

    if (game.players.length === 0) {
        deleteGame(channelId);
        return { ok: true, emptied: true };
    }

    let newOwner = null;
    if (game.owner === userId) {
        game.owner = game.players[0].id;
        newOwner = game.players[0];
    }
    return { ok: true, game, newOwner };
}

export function canStart(channelId, userId, isBotOwner) {
    const game = getGame(channelId);
    if (!game) return { ok: false, message: '❌ Belum ada room!' };
    if (game.status !== 'waiting') return { ok: false, message: '❌ Game sudah berjalan!' };
    if (game.owner !== userId && !isBotOwner) return { ok: false, message: '❌ Hanya host yang dapat memulai game!' };
    if (game.players.length < MIN_PLAYERS) {
        return { ok: false, message: `❌ Minimal ${MIN_PLAYERS} player! Saat ini: ${game.players.length} player` };
    }
    return { ok: true, game };
}

export function buildLobbyEmbed(game, settings) {
    const list = game.players.map((p) => `${p.number}. ${p.username}`).join('\n') || '-';
    const canStartYet = game.players.length >= MIN_PLAYERS;
    return new EmbedBuilder()
        .setColor('#8E44AD')
        .setTitle('🐺 WEREWOLF — Room Terbuka')
        .setDescription(
            `Host: **${game.players.find((p) => p.id === game.owner)?.username ?? '???'}**\n\n` +
            `👥 **Player (${game.players.length}/${MAX_PLAYERS})**\n${list}\n\n` +
            (canStartYet
                ? '✅ Sudah bisa dimulai, host tinggal pencet **Mulai** 🐺'
                : `🕕 Butuh ${MIN_PLAYERS - game.players.length} player lagi buat bisa mulai`)
        )
        .setFooter({ text: `${settings?.botName ?? 'Bot'} • Semua aksi malam nanti dikirim lewat DM` });
}

export function buildLobbyComponents(channelId, disabled = false) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`wwjoin_${channelId}`).setLabel('Gabung').setEmoji('➕').setStyle(ButtonStyle.Success).setDisabled(disabled),
            new ButtonBuilder().setCustomId(`wwstart_${channelId}`).setLabel('Mulai').setEmoji('▶️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        ),
    ];
}

export function buildPlayerListEmbed(game) {
    const list = game.players
        .map((p) => `${p.number}. ${p.username} ${p.alive ? '✅' : `☠️ (${ROLES[p.role]?.name ?? '???'})`}`)
        .join('\n');
    const phaseLabel = game.phase === 'night' ? '🌙 Malam' : game.phase === 'day' ? '☀️ Siang' : '🕕 Lobby';
    return new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🐺 WEREWOLF — Status')
        .setDescription(
            `📅 Hari ke-${game.day} • ${phaseLabel}\n` +
            `👤 Hidup: ${game.players.filter((p) => p.alive).length} | ☠️ Mati: ${game.dead.length}\n\n${list}`
        );
}

// ─────────────────────────────────────────────────────────
// START GAME
// ─────────────────────────────────────────────────────────

export async function startGameAndSendRoles(channelId, client, prefix) {
    const game = getGame(channelId);
    if (!game) return { ok: false };

    const roles = generateRoles(game.players.length);
    game.players.forEach((p, i) => {
        p.role = roles[i];
        if (p.role === 'witch') p.potions = { heal: true, poison: true };
        if (p.role === 'sheriff') p.hearts = 3;
    });
    game.status = 'playing';
    game.day = 1;
    game.phase = 'night';

    const failedDm = [];
    for (const player of game.players) {
        try {
            const user = await client.users.fetch(player.id);
            const roleInfo = ROLES[player.role];
            const embed = new EmbedBuilder()
                .setColor('#2C2F33')
                .setTitle(`${roleInfo.emoji} Role kamu: ${roleInfo.name}`)
                .setDescription(getRoleDescription(player.role, prefix))
                .setFooter({ text: '🤫 Jangan kasih tau siapapun role kamu!' });
            await user.send({ embeds: [embed] });
        } catch (e) {
            failedDm.push(player.username);
            console.log(`[WW] Gagal kirim role ke ${player.id}:`, e.message);
        }
    }

    await sendNightPrompts(channelId, client);

    game.timeout = setTimeout(() => {
        processNightActions(channelId, client).catch((e) => console.error('[WW] processNightActions error:', e));
    }, PHASE_DURATION.night);

    return { ok: true, game, failedDm };
}

// ─────────────────────────────────────────────────────────
// NIGHT PHASE
// ─────────────────────────────────────────────────────────

function buildTargetButtons(channelId, targets, prefix = 'wwact', style = ButtonStyle.Secondary) {
    const rows = [];
    for (let i = 0; i < targets.length; i += 5) {
        const row = new ActionRowBuilder();
        targets.slice(i, i + 5).forEach((p) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${prefix}_${channelId}_${p.number}`)
                    .setLabel(`${p.number}. ${p.username}`.slice(0, 80))
                    .setStyle(style)
            );
        });
        rows.push(row);
    }
    return rows;
}

// 👼 Tombol target racun buat Witch, + tombol skip biar racunnya disimpan
function buildWitchPoisonButtons(channelId, targets) {
    const rows = buildTargetButtons(channelId, targets, 'wwwitchpoison', ButtonStyle.Secondary);
    rows.push(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`wwwitchskip_${channelId}`).setLabel('Simpan Racun').setEmoji('⏭️').setStyle(ButtonStyle.Secondary)
        )
    );
    return rows;
}

async function sendNightPrompts(channelId, client) {
    const game = getGame(channelId);
    if (!game) return;

    const alive = game.players.filter((p) => p.alive);

    for (const player of alive) {
        try {
            const user = await client.users.fetch(player.id);

            if (player.role === 'werewolf') {
                const targets = alive.filter((p) => ROLES[p.role].team !== 'wolf');
                const embed = new EmbedBuilder()
                    .setColor('#992D22')
                    .setTitle('🐺 Malam Tiba — Waktunya Berburu')
                    .setDescription('Pilih siapa yang mau kamu bunuh malam ini:');
                await user.send({ embeds: [embed], components: buildTargetButtons(channelId, targets) });
            } else if (player.role === 'seer') {
                const targets = alive.filter((p) => p.id !== player.id);
                const embed = new EmbedBuilder()
                    .setColor('#9B59B6')
                    .setTitle('🔮 Malam Tiba — Waktunya Mengintip')
                    .setDescription('Pilih siapa yang mau kamu intip rolenya:');
                await user.send({ embeds: [embed], components: buildTargetButtons(channelId, targets) });
            } else if (player.role === 'guardian') {
                const targets = alive;
                const embed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('🛡️ Malam Tiba — Waktunya Melindungi')
                    .setDescription('Pilih siapa yang mau kamu lindungi malam ini:');
                await user.send({ embeds: [embed], components: buildTargetButtons(channelId, targets) });
            } else if (player.role === 'sorcerer') {
                const targets = alive.filter((p) => p.id !== player.id);
                const embed = new EmbedBuilder()
                    .setColor('#1ABC9C')
                    .setTitle('🧙 Malam Tiba — Waktunya Investigasi')
                    .setDescription('Pilih siapa yang mau kamu investigasi:');
                await user.send({ embeds: [embed], components: buildTargetButtons(channelId, targets) });
            } else if (player.role === 'witch') {
                const canHeal = !!player.potions?.heal;
                const canPoison = !!player.potions?.poison;
                if (!canHeal && !canPoison) {
                    const embed = new EmbedBuilder()
                        .setColor('#95A5A6')
                        .setTitle('👼 Malam Tiba')
                        .setDescription('Ramuanmu sudah habis dipakai. Tunggu pagi & perhatikan sekitar 👀');
                    await user.send({ embeds: [embed] });
                } else {
                    let desc = '';
                    desc += canHeal
                        ? `💊 Kalau werewolf menyerang malam ini, kamu bakal dikabari buat pakai **ramuan hidup**.\n\n`
                        : `💊 Ramuan hidupmu sudah habis dipakai.\n\n`;
                    desc += canPoison
                        ? `🧪 Kamu juga bisa pakai **ramuan racun** sekarang buat bunuh 1 target (opsional, boleh dilewati):`
                        : `🧪 Ramuan racunmu sudah habis dipakai.`;
                    const embed = new EmbedBuilder().setColor('#8E44AD').setTitle('👼 Malam Tiba — Witch').setDescription(desc);
                    if (canPoison) {
                        const targets = alive.filter((p) => p.id !== player.id);
                        await user.send({ embeds: [embed], components: buildWitchPoisonButtons(channelId, targets) });
                    } else {
                        await user.send({ embeds: [embed] });
                    }
                }
            } else if (player.role === 'sheriff') {
                if (player.hearts > 0) {
                    const targets = alive.filter((p) => p.id !== player.id);
                    const embed = new EmbedBuilder()
                        .setColor('#F39C12')
                        .setTitle('🕵️ Malam Tiba — Waktunya Menyelidik')
                        .setDescription(`Pilih target buat kamu tebak apakah dia Werewolf atau bukan.\n❤️ Sisa kesempatan: ${player.hearts}`);
                    await user.send({ embeds: [embed], components: buildTargetButtons(channelId, targets, 'wwsheriff', ButtonStyle.Primary) });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor('#95A5A6')
                        .setTitle('🕵️ Malam Tiba')
                        .setDescription('Kesempatan menebakmu udah habis. Tunggu pagi & perhatikan sekitar 👀');
                    await user.send({ embeds: [embed] });
                }
            } else if (player.role === 'mimic') {
                const embed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('🎭 Malam Tiba')
                    .setDescription('Kamu menyamar jadi warga biasa. Gak ada aksi malam — tunggu pagi 🎭');
                await user.send({ embeds: [embed] });
            } else if (player.role === 'ghost') {
                const embed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('👻 Malam Tiba')
                    .setDescription('Kamu masih warga biasa selagi hidup. Gak ada aksi malam — tunggu pagi 👀');
                await user.send({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('👨‍🌾 Malam Tiba')
                    .setDescription('Kamu Villager biasa, gak ada aksi malam. Tunggu pagi & perhatikan siapa yang mencurigakan 👀');
                await user.send({ embeds: [embed] });
            }
        } catch (e) {
            console.log(`[WW] Gagal kirim prompt malam ke ${player.id}:`, e.message);
        }
    }
}

// 👼 DM Witch pas Werewolf berhasil milih korban, biar dia bisa mutusin pakai ramuan hidup atau nggak
async function notifyWitch(channelId, client, victim) {
    const game = getGame(channelId);
    if (!game) return;
    const witch = game.players.find((p) => p.role === 'witch' && p.alive && p.potions?.heal);
    if (!witch) return;
    try {
        const user = await client.users.fetch(witch.id);
        const embed = new EmbedBuilder()
            .setColor('#C0392B')
            .setTitle('💊 Werewolf Menyerang!')
            .setDescription(`**${victim.username}** diserang werewolf malam ini!\nMau pakai ramuan hidup buat nyelametin dia?`);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`wwwitchheal_${channelId}_yes`).setLabel('Selamatkan').setEmoji('💊').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`wwwitchheal_${channelId}_no`).setLabel('Biarkan').setEmoji('💤').setStyle(ButtonStyle.Secondary)
        );
        await user.send({ embeds: [embed], components: [row] });
    } catch (e) {
        console.log(`[WW] Gagal kirim notif witch:`, e.message);
    }
}

// 👻 DM Ghost pas dia baru aja mati, nawarin kesempatan kirim 1 clue anonim
async function notifyGhost(channelId, client, deadPlayer) {
    if (deadPlayer.role !== 'ghost' || deadPlayer.ghostClueUsed) return;
    try {
        const user = await client.users.fetch(deadPlayer.id);
        const embed = new EmbedBuilder()
            .setColor('#BDC3C7')
            .setTitle('👻 Kamu Sudah Meninggal')
            .setDescription('Sebagai Ghost, kamu masih punya 1 kesempatan kirim clue/pesan anonim ke channel buat bantu yang masih hidup.');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`wwghostclue_${channelId}`).setLabel('Kirim Clue').setEmoji('📝').setStyle(ButtonStyle.Primary)
        );
        await user.send({ embeds: [embed], components: [row] });
    } catch (e) {
        console.log(`[WW] Gagal kirim notif ghost:`, e.message);
    }
}

// Dipanggil dari interactionHandler pas tombol aksi malam (wwact_) dipencet
export async function handleNightAction(interaction, channelId, targetNumber) {
    const game = getGame(channelId);
    if (!game || game.phase !== 'night') {
        return interaction.reply({ content: '❌ Game ini udah gak aktif atau bukan fase malam lagi.', ephemeral: true });
    }

    const player = game.players.find((p) => p.id === interaction.user.id);
    if (!player || !player.alive) {
        return interaction.reply({ content: '❌ Kamu bukan player aktif di game ini.', ephemeral: true });
    }
    if (player.skillUsed) {
        return interaction.reply({ content: '❌ Kamu udah pakai skill malam ini!', ephemeral: true });
    }

    const target = game.players.find((p) => p.number === targetNumber && p.alive);
    if (!target) {
        return interaction.reply({ content: '❌ Target gak valid atau udah mati.', ephemeral: true });
    }

    switch (player.role) {
        case 'werewolf': {
            if (ROLES[target.role].team === 'wolf') {
                return interaction.reply({ content: '❌ Gak bisa bunuh sesama team!', ephemeral: true });
            }
            game.nightActions.kill = target.id;
            player.skillUsed = true;
            notifyWitch(channelId, interaction.client, target).catch((e) => console.log('[WW] notifyWitch error:', e.message));
            return interaction.reply({ content: `🐺 Target terpilih: **${target.username}**. Menunggu malam berakhir...`, ephemeral: true });
        }
        case 'guardian': {
            game.nightActions.protect = target.id;
            player.skillUsed = true;
            return interaction.reply({ content: `🛡️ Kamu melindungi **${target.username}** malam ini.`, ephemeral: true });
        }
        case 'seer': {
            player.skillUsed = true;
            let shownRole;
            if (target.role === 'mimic') {
                // 🎭 Mimic selalu ke-detect sebagai role tim village, gak peduli akurasi
                const villagePool = Object.keys(ROLES).filter((r) => ROLES[r].team === 'village');
                shownRole = villagePool[Math.floor(Math.random() * villagePool.length)];
            } else {
                // 🌫️ 35% kemungkinan hasil intip meleset, biar player gak bisa 100% percaya
                const isAccurate = Math.random() > 0.35;
                shownRole = target.role;
                if (!isAccurate) {
                    const pool = Object.keys(ROLES).filter((r) => r !== target.role);
                    shownRole = pool[Math.floor(Math.random() * pool.length)];
                }
            }
            const info = ROLES[shownRole];
            return interaction.reply({
                content:
                    `🔮 Penglihatanmu terasa buram di tengah kabut malam...\n\n` +
                    `**${target.username}** sepertinya adalah:\n` +
                    `${info.emoji} **${info.name}**\n\n` +
                    `⚠️ Ingat, penglihatanmu gak selalu akurat!`,
                ephemeral: true,
            });
        }
        case 'sorcerer': {
            player.skillUsed = true;
            const isSeer = target.role === 'seer';
            return interaction.reply({
                content:
                    `🧙 Hasil investigasi terhadap **${target.username}**:\n\n` +
                    `${isSeer ? '✅ Target ini adalah **Seer**!' : '❌ Target ini **bukan** Seer.'}`,
                ephemeral: true,
            });
        }
        default:
            return interaction.reply({ content: '❌ Role kamu gak punya aksi malam.', ephemeral: true });
    }
}

// ─────────────────────────────────────────────────────────
// 👼 WITCH ACTIONS
// ─────────────────────────────────────────────────────────

// Dipanggil pas Witch pencet target racun (wwwitchpoison_)
export async function handleWitchPoison(interaction, channelId, targetNumber) {
    const game = getGame(channelId);
    if (!game || game.phase !== 'night') {
        return interaction.reply({ content: '❌ Game ini udah gak aktif atau bukan fase malam lagi.', ephemeral: true });
    }
    const player = game.players.find((p) => p.id === interaction.user.id);
    if (!player || player.role !== 'witch' || !player.alive) {
        return interaction.reply({ content: '❌ Kamu bukan Witch aktif di game ini.', ephemeral: true });
    }
    if (!player.potions?.poison) {
        return interaction.reply({ content: '❌ Ramuan racunmu sudah habis dipakai.', ephemeral: true });
    }
    if (player.skillUsed) {
        return interaction.reply({ content: '❌ Kamu udah pakai aksi malam ini!', ephemeral: true });
    }
    const target = game.players.find((p) => p.number === targetNumber && p.alive);
    if (!target) {
        return interaction.reply({ content: '❌ Target gak valid atau udah mati.', ephemeral: true });
    }

    player.potions.poison = false;
    player.skillUsed = true;
    game.nightActions.witchPoison = target.id;
    return interaction.reply({ content: `🧪 Kamu meracuni **${target.username}** malam ini. Efeknya keliatan pas pagi.`, ephemeral: true });
}

// Dipanggil pas Witch pencet "Simpan Racun" (wwwitchskip_)
export async function handleWitchSkip(interaction, channelId) {
    const game = getGame(channelId);
    if (!game || game.phase !== 'night') {
        return interaction.reply({ content: '❌ Game ini udah gak aktif atau bukan fase malam lagi.', ephemeral: true });
    }
    const player = game.players.find((p) => p.id === interaction.user.id);
    if (!player || player.role !== 'witch') {
        return interaction.reply({ content: '❌ Kamu bukan Witch di game ini.', ephemeral: true });
    }
    return interaction.reply({ content: '⏭️ Kamu menyimpan ramuan racunmu buat malam lain.', ephemeral: true });
}

// Dipanggil pas Witch mutusin pakai ramuan hidup atau nggak (wwwitchheal_)
export async function handleWitchHeal(interaction, channelId, decision) {
    const game = getGame(channelId);
    if (!game || game.phase !== 'night') {
        return interaction.reply({ content: '❌ Game ini udah gak aktif atau bukan fase malam lagi.', ephemeral: true });
    }
    const player = game.players.find((p) => p.id === interaction.user.id);
    if (!player || player.role !== 'witch' || !player.alive) {
        return interaction.reply({ content: '❌ Kamu bukan Witch aktif di game ini.', ephemeral: true });
    }
    if (!player.potions?.heal) {
        return interaction.reply({ content: '❌ Ramuan hidupmu sudah habis dipakai atau udah kepake malam ini.', ephemeral: true });
    }

    if (decision === 'yes') {
        player.potions.heal = false;
        game.nightActions.witchHeal = true;
        return interaction.reply({ content: '💊 Kamu memakai ramuan hidup buat menyelamatkan korban werewolf!', ephemeral: true });
    }
    return interaction.reply({ content: '💤 Kamu memutuskan untuk gak pakai ramuan hidup malam ini.', ephemeral: true });
}

// ─────────────────────────────────────────────────────────
// 🕵️ SHERIFF ACTIONS
// ─────────────────────────────────────────────────────────

// Dipanggil pas Sheriff milih target (wwsheriff_) -> lanjut ke tombol tebak
export async function handleSheriffTargetSelect(interaction, channelId, targetNumber) {
    const game = getGame(channelId);
    if (!game || game.phase !== 'night') {
        return interaction.reply({ content: '❌ Game ini udah gak aktif atau bukan fase malam lagi.', ephemeral: true });
    }
    const player = game.players.find((p) => p.id === interaction.user.id);
    if (!player || player.role !== 'sheriff' || !player.alive) {
        return interaction.reply({ content: '❌ Kamu bukan Sheriff aktif di game ini.', ephemeral: true });
    }
    if (player.hearts <= 0) {
        return interaction.reply({ content: '❌ Kesempatan menebakmu udah habis.', ephemeral: true });
    }
    if (player.skillUsed) {
        return interaction.reply({ content: '❌ Kamu udah pakai aksi malam ini!', ephemeral: true });
    }
    const target = game.players.find((p) => p.number === targetNumber && p.alive);
    if (!target) {
        return interaction.reply({ content: '❌ Target gak valid atau udah mati.', ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`wwsheriffguess_${channelId}_${targetNumber}_wolf`).setLabel('Werewolf').setEmoji('🐺').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`wwsheriffguess_${channelId}_${targetNumber}_notwolf`).setLabel('Bukan Werewolf').setEmoji('❌').setStyle(ButtonStyle.Secondary)
    );
    return interaction.reply({ content: `🕵️ Target: **${target.username}**. Menurutmu dia...`, components: [row], ephemeral: true });
}

// Dipanggil pas Sheriff pencet tebakan (wwsheriffguess_)
export async function handleSheriffGuess(interaction, channelId, targetNumber, guess) {
    const game = getGame(channelId);
    if (!game || game.phase !== 'night') {
        return interaction.reply({ content: '❌ Game ini udah gak aktif atau bukan fase malam lagi.', ephemeral: true });
    }
    const player = game.players.find((p) => p.id === interaction.user.id);
    if (!player || player.role !== 'sheriff' || !player.alive) {
        return interaction.reply({ content: '❌ Kamu bukan Sheriff aktif di game ini.', ephemeral: true });
    }
    if (player.hearts <= 0) {
        return interaction.reply({ content: '❌ Kesempatan menebakmu udah habis.', ephemeral: true });
    }
    if (player.skillUsed) {
        return interaction.reply({ content: '❌ Kamu udah pakai aksi malam ini!', ephemeral: true });
    }
    const target = game.players.find((p) => p.number === targetNumber && p.alive);
    if (!target) {
        return interaction.reply({ content: '❌ Target gak valid atau udah mati.', ephemeral: true });
    }

    player.skillUsed = true;
    const isWolf = ROLES[target.role]?.team === 'wolf';
    const guessedWolf = guess === 'wolf';
    const correct = isWolf === guessedWolf;

    if (correct) {
        game.nightActions.sheriffKill = target.id;
        return interaction.reply({ content: `🎯 Tepat! **${target.username}** ketauan dan bakal dieksekusi pas pagi nanti.`, ephemeral: true });
    }

    player.hearts -= 1;
    return interaction.reply({
        content: `❌ Meleset! Tebakanmu soal **${target.username}** salah.\n❤️ Sisa kesempatan: ${player.hearts}`,
        ephemeral: true,
    });
}

// ─────────────────────────────────────────────────────────
// 👻 GHOST ACTIONS
// ─────────────────────────────────────────────────────────

// Dipanggil pas Ghost (yang udah mati) pencet tombol "Kirim Clue" (wwghostclue_)
export async function handleGhostClueButton(interaction, channelId) {
    const game = getGame(channelId);
    if (!game) return interaction.reply({ content: '❌ Game ini udah gak aktif.', ephemeral: true });

    const player = game.players.find((p) => p.id === interaction.user.id);
    if (!player || player.role !== 'ghost' || player.alive) {
        return interaction.reply({ content: '❌ Fitur ini cuma buat Ghost yang udah mati.', ephemeral: true });
    }
    if (player.ghostClueUsed) {
        return interaction.reply({ content: '❌ Kamu udah pakai jatah clue-mu.', ephemeral: true });
    }

    const modal = new ModalBuilder().setCustomId(`wwghostModal_${channelId}`).setTitle('👻 Kirim Clue Anonim');
    const input = new TextInputBuilder()
        .setCustomId('wwghostClueInput')
        .setLabel('Pesan/clue kamu (bakal dikirim anonim)')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(300)
        .setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
}

// Dipanggil pas Ghost submit modal clue-nya (wwghostModal_)
export async function handleGhostModalSubmit(interaction, channelId) {
    const game = getGame(channelId);
    if (!game) return interaction.reply({ content: '❌ Game ini udah gak aktif.', ephemeral: true });

    const player = game.players.find((p) => p.id === interaction.user.id);
    if (!player || player.role !== 'ghost' || player.alive) {
        return interaction.reply({ content: '❌ Fitur ini cuma buat Ghost yang udah mati.', ephemeral: true });
    }
    if (player.ghostClueUsed) {
        return interaction.reply({ content: '❌ Kamu udah pakai jatah clue-mu.', ephemeral: true });
    }

    const message = interaction.fields.getTextInputValue('wwghostClueInput');
    player.ghostClueUsed = true;

    const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
    if (channel) {
        await channel
            .send({ embeds: [new EmbedBuilder().setColor('#BDC3C7').setTitle('👻 Pesan dari Alam Baka').setDescription(message)] })
            .catch(() => {});
    }
    return interaction.reply({ content: '✅ Clue anonimmu udah terkirim ke channel!', ephemeral: true });
}

// ─────────────────────────────────────────────────────────
// RESOLVE NIGHT -> DAY
// ─────────────────────────────────────────────────────────

async function processNightActions(channelId, client) {
    const game = getGame(channelId);
    if (!game || game.phase !== 'night') return;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return deleteGame(channelId);

    const { kill, protect, witchHeal, witchPoison, sheriffKill } = game.nightActions;
    let report = `☀️ **Pagi Hari ke-${game.day}**\n\n`;

    const deadIds = new Set();
    const deathLines = [];
    const trySlay = (id, cause) => {
        if (!id || deadIds.has(id)) return;
        const victim = game.players.find((p) => p.id === id && p.alive);
        if (!victim) return;
        victim.alive = false;
        game.dead.push(victim);
        deadIds.add(id);
        deathLines.push({ victim, cause });
    };

    let wolfSaved = false;
    if (kill && kill === protect) {
        report += `🛡️ Guardian berhasil melindungi target werewolf malam ini!\n\n`;
        wolfSaved = true;
    } else if (kill && witchHeal) {
        report += `💊 Witch berhasil menyelamatkan korban werewolf malam ini!\n\n`;
        wolfSaved = true;
    } else if (kill) {
        trySlay(kill, 'wolf');
    }

    if (witchPoison) trySlay(witchPoison, 'poison');
    if (sheriffKill) trySlay(sheriffKill, 'sheriff');

    if (deathLines.length === 0) {
        if (!wolfSaved) report += `🌅 Malam yang tenang... tidak ada korban.\n\n`;
    } else {
        for (const { victim, cause } of deathLines) {
            const causeLabel = cause === 'wolf' ? '☠️' : cause === 'poison' ? '🧪' : '🕵️';
            report += `${causeLabel} **${victim.username}** ditemukan tewas!\n> Role: ${ROLES[victim.role].emoji} ${ROLES[victim.role].name}\n\n`;
            notifyGhost(channelId, client, victim).catch(() => {});
        }
    }

    const winner = checkWinner(game);
    if (winner) {
        await channel.send({ embeds: [new EmbedBuilder().setColor('#F1C40F').setTitle('☀️ Pagi Telah Tiba').setDescription(report)] });
        return endGame(channelId, client, winner);
    }

    game.phase = 'day';
    game.votes = {};
    game.voters = {};
    game.nightActions = { kill: null, protect: null, witchHeal: false, witchPoison: null, sheriffKill: null };
    game.players.forEach((p) => { p.voted = false; p.skillUsed = false; });

    const alive = game.players.filter((p) => p.alive);
    report += `🗳️ Waktunya voting! Pencet tombol di bawah buat vote siapa yang dieliminasi.\n`;
    report += `⏱️ Waktu: ${PHASE_DURATION.day / 1000} detik`;

    const embed = new EmbedBuilder().setColor('#F1C40F').setTitle(`☀️ Hari ke-${game.day}`).setDescription(report);
    await channel.send({ embeds: [embed], components: buildTargetButtonsForVote(channelId, alive) });

    game.timeout = setTimeout(() => {
        executeVote(channelId, client).catch((e) => console.error('[WW] executeVote error:', e));
    }, PHASE_DURATION.day);
}

function buildTargetButtonsForVote(channelId, targets) {
    const rows = [];
    for (let i = 0; i < targets.length; i += 5) {
        const row = new ActionRowBuilder();
        targets.slice(i, i + 5).forEach((p) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`wwvote_${channelId}_${p.number}`)
                    .setLabel(`${p.number}. ${p.username}`.slice(0, 80))
                    .setStyle(ButtonStyle.Danger)
            );
        });
        rows.push(row);
    }
    return rows;
}

// Dipanggil dari interactionHandler pas tombol vote (wwvote_) dipencet
export async function handleVote(interaction, channelId, targetNumber) {
    const game = getGame(channelId);
    if (!game || game.status !== 'playing') {
        return interaction.reply({ content: '❌ Tidak ada game aktif!', ephemeral: true });
    }
    if (game.phase !== 'day') {
        return interaction.reply({ content: '❌ Sekarang bukan waktu voting!', ephemeral: true });
    }

    const voter = game.players.find((p) => p.id === interaction.user.id);
    if (!voter) return interaction.reply({ content: '❌ Kamu bukan player dalam game ini!', ephemeral: true });
    if (!voter.alive) return interaction.reply({ content: '❌ Kamu sudah mati! Tidak bisa vote.', ephemeral: true });
    if (voter.voted) return interaction.reply({ content: '❌ Kamu sudah vote! Tunggu hasilnya.', ephemeral: true });

    const target = game.players.find((p) => p.number === targetNumber && p.alive);
    if (!target) return interaction.reply({ content: '❌ Target gak valid atau udah mati.', ephemeral: true });

    voter.voted = true;
    game.voters[voter.id] = target.id;
    game.votes[target.id] = (game.votes[target.id] || 0) + 1;

    const alive = game.players.filter((p) => p.alive);
    const votedCount = alive.filter((p) => p.voted).length;

    await interaction.reply({ content: `🗳️ Vote tercatat ke **${target.username}**. (${votedCount}/${alive.length} sudah vote)`, ephemeral: true });

    if (votedCount >= alive.length) {
        clearGameTimeout(game);
        await executeVote(channelId, interaction.client);
    }
}

async function executeVote(channelId, client) {
    const game = getGame(channelId);
    if (!game || game.phase !== 'day') return;

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return deleteGame(channelId);

    let maxVotes = 0;
    let eliminatedId = null;
    let isTie = false;

    for (const [playerId, count] of Object.entries(game.votes)) {
        if (count > maxVotes) { maxVotes = count; eliminatedId = playerId; isTie = false; }
        else if (count === maxVotes && maxVotes > 0) { isTie = true; }
    }

    let result = `⚖️ **Hasil Voting**\n\n`;
    if (isTie || maxVotes === 0) {
        result += `🤷 ${isTie ? 'Vote seri, tidak ada yang tereliminasi!' : 'Tidak ada yang vote, tidak ada yang tereliminasi.'}\n\n`;
    } else if (eliminatedId) {
        const eliminated = game.players.find((p) => p.id === eliminatedId);
        if (eliminated) {
            eliminated.alive = false;
            game.dead.push(eliminated);
            result += `⚰️ **${eliminated.username}** dieliminasi warga!\n> Role: ${ROLES[eliminated.role].emoji} ${ROLES[eliminated.role].name}\n> Votes: ${maxVotes}\n\n`;
            notifyGhost(channelId, client, eliminated).catch(() => {});
        }
    }

    const winner = checkWinner(game);
    if (winner) {
        await channel.send({ embeds: [new EmbedBuilder().setColor('#E74C3C').setTitle('⚖️ Hasil Voting').setDescription(result)] });
        return endGame(channelId, client, winner);
    }

    game.phase = 'night';
    game.day += 1;
    game.nightActions = { kill: null, protect: null, witchHeal: false, witchPoison: null, sheriffKill: null };
    game.players.forEach((p) => { p.voted = false; p.skillUsed = false; });

    result += `🌙 **Malam ke-${game.day}** — special role, cek DM kalian!\n⏱️ Waktu: ${PHASE_DURATION.night / 1000} detik`;
    await channel.send({ embeds: [new EmbedBuilder().setColor('#2C3E50').setTitle('🌙 Malam Tiba').setDescription(result)] });

    await sendNightPrompts(channelId, client);
    game.timeout = setTimeout(() => {
        processNightActions(channelId, client).catch((e) => console.error('[WW] processNightActions error:', e));
    }, PHASE_DURATION.night);
}

function checkWinner(game) {
    const alive = game.players.filter((p) => p.alive);
    const wolves = alive.filter((p) => ROLES[p.role]?.team === 'wolf');
    const villagers = alive.filter((p) => ROLES[p.role]?.team === 'village');
    if (wolves.length === 0) return 'village';
    if (wolves.length >= villagers.length) return 'wolf';
    return null;
}

async function endGame(channelId, client, winner) {
    const game = getGame(channelId);
    if (!game) return;
    clearGameTimeout(game);

    const winningPlayers = game.players.filter((p) => ROLES[p.role]?.team === winner);
    for (const p of winningPlayers) {
        try { addMoney(game.guildId, p.id, WIN_REWARD); } catch (e) { console.log('[WW] Gagal kasih reward:', e.message); }
    }

    const list = game.players
        .map((p) => {
            const status = p.alive ? '✅' : '☠️';
            const won = winningPlayers.some((w) => w.id === p.id) ? ' 🏆' : '';
            return `${status} ${p.username} — ${ROLES[p.role].emoji} ${ROLES[p.role].name}${won}`;
        })
        .join('\n');

    const embed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('🎉 GAME OVER!')
        .setDescription(
            `${winner === 'wolf' ? '🐺 **WEREWOLF MENANG!**' : '👨‍🌾 **VILLAGER MENANG!**'}\n\n` +
            `**Reveal Role:**\n${list}\n\n` +
            `💰 Tim pemenang dapat +${WIN_REWARD.toLocaleString('id-ID')} koin!\n\n` +
            `Main lagi? \`.ww create\``
        );

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (channel) await channel.send({ embeds: [embed] }).catch(() => {});

    games.delete(channelId);
}

export { getGame, deleteGame, findActiveRoomFor };
