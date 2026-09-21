import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { addMoney } from './economyStore.js';

// 💣 Tebak Bomb — game "Mines"-style: grid 3x3, 1 bomb + 8 buah bernilai
// beda-beda. User pilih kotak satu-satu, tiap kotak buah nambahin winnings,
// kalau kena bomb SEMUA winnings di ronde ini hangus. Bisa cash out kapan
// aja buat ngamanin winnings yang udah kekumpul.

const FRUITS = [
    { emoji: '🍌', value: 500 },
    { emoji: '🍇', value: 700 },
    { emoji: '🍎', value: 900 },
    { emoji: '🥭', value: 1000 },
    { emoji: '🍉', value: 1200 },
    { emoji: '🥝', value: 1400 },
    { emoji: '🍒', value: 1800 },
    { emoji: '🫐', value: 2000 },
    { emoji: '💎', value: 5000 },
];
const BOMB_EMOJI = '💣';
const HIDDEN_LABEL = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

// 🎲 Sesi game aktif, in-memory aja (sifatnya sementara per pesan, gak perlu di-persist ke disk)
const games = new Map(); // key: messageId -> game state

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// 🥇 Acak tata letak: 9 kotak = 1 bomb + 8 buah (dipilih random 8 dari 9 buah yang ada di FRUITS,
// biar 💎 gak selalu muncul tiap game)
function generateLayout() {
    const pickedFruits = shuffle(FRUITS).slice(0, 8);
    const cells = shuffle([...pickedFruits, { emoji: BOMB_EMOJI, value: 0, isBomb: true }]);
    return cells; // array 9 elemen, index 0-8 = posisi kotak 1-9
}

export function createGame({ messageId, channelId, guildId, ownerId, bet }) {
    const game = {
        messageId,
        channelId,
        guildId,
        ownerId,
        bet,
        layout: generateLayout(),
        revealed: new Array(9).fill(false),
        winnings: 0,
        ended: false,
        won: false,
        createdAt: Date.now(),
    };
    games.set(messageId, game);
    return game;
}

export function getGame(messageId) {
    return games.get(messageId) || null;
}

export function deleteGame(messageId) {
    games.delete(messageId);
}

function revealedCount(game) {
    return game.revealed.filter(Boolean).length;
}

function isFullyCleared(game) {
    // Menang total kalau semua kotak NON-bomb udah kebuka (8 dari 9)
    return revealedCount(game) === 8;
}

// 🧱 Bikin baris tombol 3x3 + baris Cash Out, sesuai state game sekarang
export function buildBoardComponents(game) {
    const rows = [];

    for (let row = 0; row < 3; row++) {
        const actionRow = new ActionRowBuilder();
        for (let col = 0; col < 3; col++) {
            const idx = row * 3 + col;
            const isRevealed = game.revealed[idx];
            const cell = game.layout[idx];

            const button = new ButtonBuilder().setCustomId(`tebakbomb_pick_${game.messageId}_${idx}`);

            if (game.ended) {
                // Game udah selesai -> bongkar semua kotak (transparansi hasil akhir)
                if (cell.isBomb) {
                    button.setLabel(BOMB_EMOJI).setStyle(ButtonStyle.Danger);
                } else if (isRevealed) {
                    button.setLabel(cell.emoji).setStyle(ButtonStyle.Success);
                } else {
                    button.setLabel(cell.emoji).setStyle(ButtonStyle.Secondary);
                }
                button.setDisabled(true);
            } else if (isRevealed) {
                button.setLabel(cell.emoji).setStyle(ButtonStyle.Success).setDisabled(true);
            } else {
                button.setLabel(HIDDEN_LABEL[idx]).setStyle(ButtonStyle.Secondary).setDisabled(false);
            }

            actionRow.addComponents(button);
        }
        rows.push(actionRow);
    }

    const cashOutRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`tebakbomb_cashout_${game.messageId}`)
            .setLabel(`💰 Cash Out (${game.winnings.toLocaleString('id-ID')})`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(game.ended || game.winnings === 0)
    );
    rows.push(cashOutRow);

    return rows;
}

function formatPrizeTable() {
    const lines = [];
    for (let i = 0; i < FRUITS.length; i += 3) {
        lines.push(
            FRUITS.slice(i, i + 3)
                .map((f) => `${f.emoji} ${f.value.toLocaleString('id-ID')}`)
                .join('   ')
        );
    }
    return lines.join('\n');
}

export function buildBoardEmbed(game, { username, statusText } = {}) {
    const embed = new EmbedBuilder()
        .setColor(game.ended ? (game.won ? '#57F287' : '#ED4245') : '#F1C40F')
        .setTitle('💣 Tebak Bomb')
        .setDescription(
            `Pemain: **${username}**\n` +
            `Taruhan: **${game.bet.toLocaleString('id-ID')}**\n` +
            `Kotak terbuka: **${revealedCount(game)}/8**\n` +
            `Winnings saat ini: **${game.winnings.toLocaleString('id-ID')}**\n\n` +
            (statusText || 'Pilih salah satu kotak di bawah. Awas ada 1 bomb 💣 nyempil di antara buah-buahnya!')
        )
        .addFields({ name: '📋 Tabel Hadiah', value: formatPrizeTable() })
        .setFooter({ text: 'Semakin banyak kotak dibuka, semakin gede taruhannya buat cash out!' })
        .setTimestamp();

    return embed;
}

/**
 * 🔘 Handler tombol pilih kotak (dipanggil dari interactionHandler.js).
 * customId format: tebakbomb_pick_<messageId>_<index>
 */
export async function handlePickButton(interaction) {
    const parts = interaction.customId.split('_');
    const messageId = parts[2];
    const index = parseInt(parts[3], 10);

    const game = getGame(messageId);
    if (!game) {
        return interaction.reply({ content: '❌ Game ini udah gak aktif/kadaluarsa.', ephemeral: true });
    }
    if (interaction.user.id !== game.ownerId) {
        return interaction.reply({ content: '❌ Ini bukan game kamu, Sensei~', ephemeral: true });
    }
    if (game.ended) {
        return interaction.reply({ content: '❌ Game ini udah selesai.', ephemeral: true });
    }
    if (game.revealed[index]) {
        return interaction.reply({ content: '⚠️ Kotak ini udah dibuka.', ephemeral: true });
    }

    const cell = game.layout[index];
    game.revealed[index] = true;

    let statusText;

    if (cell.isBomb) {
        // 💥 Kena bomb -> game over, winnings hangus semua
        game.ended = true;
        game.won = false;
        game.winnings = 0;
        statusText = `💥 **BOOM!** Kamu kena bomb di kotak ${index + 1}!\nSeluruh winnings ronde ini hangus. Coba lagi ya~`;
        deleteGame(messageId);
    } else {
        game.winnings += cell.value;

        if (isFullyCleared(game)) {
            // 🏆 Semua kotak non-bomb kebuka -> auto menang total
            game.ended = true;
            game.won = true;
            addMoney(game.guildId, game.ownerId, game.winnings);
            statusText = `🏆 **CLEAR!** Semua kotak aman berhasil dibuka!\n**+${game.winnings.toLocaleString('id-ID')}** masuk ke saldo kamu!`;
            deleteGame(messageId);
        } else {
            statusText = `✅ Aman! Dapet ${cell.emoji} senilai **${cell.value.toLocaleString('id-ID')}**.\nLanjut buka kotak lain, atau cash out sekarang.`;
        }
    }

    const embed = buildBoardEmbed(game, { username: interaction.user.username, statusText });
    const components = buildBoardComponents(game);

    await interaction.update({ embeds: [embed], components });
}

/**
 * 🔘 Handler tombol Cash Out (dipanggil dari interactionHandler.js).
 * customId format: tebakbomb_cashout_<messageId>
 */
export async function handleCashOutButton(interaction) {
    const messageId = interaction.customId.replace('tebakbomb_cashout_', '');

    const game = getGame(messageId);
    if (!game) {
        return interaction.reply({ content: '❌ Game ini udah gak aktif/kadaluarsa.', ephemeral: true });
    }
    if (interaction.user.id !== game.ownerId) {
        return interaction.reply({ content: '❌ Ini bukan game kamu, Sensei~', ephemeral: true });
    }
    if (game.ended) {
        return interaction.reply({ content: '❌ Game ini udah selesai.', ephemeral: true });
    }
    if (game.winnings <= 0) {
        return interaction.reply({ content: '❌ Belum ada winnings buat di-cash out, buka minimal 1 kotak dulu.', ephemeral: true });
    }

    game.ended = true;
    game.won = true;
    addMoney(game.guildId, game.ownerId, game.winnings);
    deleteGame(messageId);

    const statusText = `💰 **CASH OUT BERHASIL!**\n**+${game.winnings.toLocaleString('id-ID')}** masuk ke saldo kamu!`;

    const embed = buildBoardEmbed(game, { username: interaction.user.username, statusText });
    const components = buildBoardComponents(game);

    await interaction.update({ embeds: [embed], components });
}