import axios from 'axios';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// ❌⭕ Tic Tac Toe — 2 mode: Player vs Player & Player vs Bot (Easy/Medium/Hard).
// Gerakan bot pakai algoritma murni (bukan AI) biar 100% gak ada bug/macet:
// - Easy   : acak total
// - Medium : blok kalau lawan mau menang, menang kalau bisa, sisanya acak
// - Hard   : minimax (gak terkalahkan)
// AI cuma dipakai buat KOMENTAR/EJEKAN bot abis jalan (flavor text doang,
// kalau API-nya gagal/lemot, game tetep jalan normal tanpa komentar).

const games = new Map(); // key: messageId -> game state

const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontal
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // vertikal
    [0, 4, 8], [2, 4, 6],           // diagonal
];

const MARK = { X: '❌', O: '⭕', empty: '➖' };

function checkWinner(board) {
    for (const [a, b, c] of WIN_LINES) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], line: [a, b, c] };
        }
    }
    if (board.every((cell) => cell !== null)) return { winner: 'draw', line: [] };
    return null;
}

function getEmptyCells(board) {
    return board.map((v, i) => (v === null ? i : null)).filter((v) => v !== null);
}

// 🧠 Minimax standar buat mode Hard (papan cuma 9 sel, ringan banget buat di-brute-force)
function minimax(board, depth, isMaximizing, botMark, humanMark) {
    const result = checkWinner(board);
    if (result) {
        if (result.winner === botMark) return 10 - depth;
        if (result.winner === humanMark) return depth - 10;
        return 0;
    }

    const empties = getEmptyCells(board);
    if (isMaximizing) {
        let best = -Infinity;
        for (const idx of empties) {
            board[idx] = botMark;
            best = Math.max(best, minimax(board, depth + 1, false, botMark, humanMark));
            board[idx] = null;
        }
        return best;
    } else {
        let best = Infinity;
        for (const idx of empties) {
            board[idx] = humanMark;
            best = Math.min(best, minimax(board, depth + 1, true, botMark, humanMark));
            board[idx] = null;
        }
        return best;
    }
}

function findWinningMove(board, mark) {
    for (const idx of getEmptyCells(board)) {
        board[idx] = mark;
        const result = checkWinner(board);
        board[idx] = null;
        if (result && result.winner === mark) return idx;
    }
    return null;
}

function pickBotMove(board, difficulty, botMark, humanMark) {
    const empties = getEmptyCells(board);

    if (difficulty === 'easy') {
        return empties[Math.floor(Math.random() * empties.length)];
    }

    if (difficulty === 'medium') {
        const winMove = findWinningMove(board, botMark);
        if (winMove !== null) return winMove;
        const blockMove = findWinningMove(board, humanMark);
        if (blockMove !== null) return blockMove;
        // Dikit bias ke tengah/pojok biar gak keliatan bego-bego amat
        const priority = [4, 0, 2, 6, 8].filter((i) => empties.includes(i));
        if (priority.length) return priority[0];
        return empties[Math.floor(Math.random() * empties.length)];
    }

    // hard -> minimax, selalu ambil langkah paling optimal (gak terkalahkan)
    let bestScore = -Infinity;
    let bestMove = empties[0];
    for (const idx of empties) {
        board[idx] = botMark;
        const score = minimax(board, 0, false, botMark, humanMark);
        board[idx] = null;
        if (score > bestScore) {
            bestScore = score;
            bestMove = idx;
        }
    }
    return bestMove;
}

// 🎭 Persona komentar bot per level kesulitan (dipakai sebagai prompt ke AI)
const PERSONA_PROMPT = {
    easy: `Kamu adalah bot Tic Tac Toe level EASY yang polos, ceroboh, dan agak absurd/lucu.
Kasih 1 kalimat pendek (maks 15 kata) komentar santai/lucu abis kamu jalan di Tic Tac Toe,
bahasa Indonesia gaul santai. Jangan pakai tanda kutip di jawaban.`,
    medium: `Kamu adalah bot Tic Tac Toe level MEDIUM yang percaya diri dan sedikit menggoda/provokatif
tapi tetep asik. Kasih 1 kalimat pendek (maks 15 kata) komentar abis kamu jalan di Tic Tac Toe,
bahasa Indonesia gaul santai. Jangan pakai tanda kutip di jawaban.`,
    hard: `Kamu adalah bot Tic Tac Toe level HARD yang dingin, sombong, dan meremehkan lawan
karena yakin gak terkalahkan. Kasih 1 kalimat pendek (maks 15 kata) komentar abis kamu jalan
di Tic Tac Toe, bahasa Indonesia gaul, agak nyebelin tapi masih sopan. Jangan pakai tanda kutip.`,
};

const FALLBACK_COMMENTS = {
    easy: ['Eh kotak mana ya... ini deh! 🤪', 'Asal taro aja hehe~', 'Wah kepencet, ya udah deh 😅'],
    medium: ['Coba tebak langkahku selanjutnya 😏', 'Lumayan nih permainannya~', 'Hmm, menarik...'],
    hard: ['Sia-sia aja usahamu. 😤', 'Kamu gak akan menang.', 'Perhitungan sempurna. Selalu.'],
};

// ⚠️ API AI pihak ketiga tidak resmi, dipakai CUMA buat flavor text komentar.
// Timeout pendek + fallback array di atas, biar kalau API lemot/down game tetep lancar.
async function getBotComment(difficulty) {
    try {
        const { data } = await axios.get('https://api.theresav.biz.id/ai/feelbetter', {
            params: {
                text: 'Kasih komentar singkat abis kamu jalan di Tic Tac Toe.',
                prompt: PERSONA_PROMPT[difficulty],
                chatId: `ttt-${difficulty}-${Date.now()}`,
                apikey: 'kyujir',
            },
            timeout: 6000,
        });
        const comment = data?.result?.trim();
        if (comment && comment.length < 200) return comment;
    } catch {
        // gagal/timeout -> pakai fallback, game TETEP jalan normal
    }
    const pool = FALLBACK_COMMENTS[difficulty] || FALLBACK_COMMENTS.medium;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ──────────────────────────────
// 🎮 Manajemen sesi game
// ──────────────────────────────

export function createGame({ messageId, channelId, guildId, mode, difficulty, playerX, playerO }) {
    const game = {
        messageId,
        channelId,
        guildId,
        mode, // 'pvp' | 'bot'
        difficulty: difficulty || null, // 'easy' | 'medium' | 'hard' (cuma kalau mode bot)
        board: new Array(9).fill(null),
        playerX,
        playerO, // userId, atau 'bot'
        turn: 'X',
        ended: false,
        winner: null,
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

function currentPlayerId(game) {
    return game.turn === 'X' ? game.playerX : game.playerO;
}

function otherMark(mark) {
    return mark === 'X' ? 'O' : 'X';
}

export function buildDifficultyComponents(authorId) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`tictactoe_startbot_easy_${authorId}`).setLabel('🟢 Easy').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`tictactoe_startbot_medium_${authorId}`).setLabel('🟡 Medium').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`tictactoe_startbot_hard_${authorId}`).setLabel('🔴 Hard').setStyle(ButtonStyle.Danger),
    );
    return [row];
}

export function buildDifficultyEmbed(authorTag) {
    return new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('❌⭕ Tic Tac Toe — Vs Bot')
        .setDescription(`${authorTag}, pilih tingkat kesulitan bot dulu ya~\n\n🟢 **Easy** — asal jalan\n🟡 **Medium** — mikir dikit\n🔴 **Hard** — gak terkalahkan (minimax)`);
}

export function buildBoardComponents(game) {
    const rows = [];
    for (let row = 0; row < 3; row++) {
        const actionRow = new ActionRowBuilder();
        for (let col = 0; col < 3; col++) {
            const idx = row * 3 + col;
            const cell = game.board[idx];
            const button = new ButtonBuilder().setCustomId(`tictactoe_pick_${game.messageId}_${idx}`);

            if (cell === 'X') {
                button.setLabel(MARK.X).setStyle(ButtonStyle.Danger).setDisabled(true);
            } else if (cell === 'O') {
                button.setLabel(MARK.O).setStyle(ButtonStyle.Primary).setDisabled(true);
            } else {
                button.setLabel(MARK.empty).setStyle(ButtonStyle.Secondary).setDisabled(game.ended);
            }
            actionRow.addComponents(button);
        }
        rows.push(actionRow);
    }
    return rows;
}

function playerLabel(game, mark) {
    const id = mark === 'X' ? game.playerX : game.playerO;
    if (id === 'bot') return `🤖 Bot (${game.difficulty})`;
    return `<@${id}>`;
}

export function buildBoardEmbed(game, statusText) {
    const embed = new EmbedBuilder()
        .setColor(game.ended ? (game.winner === 'draw' ? '#F1C40F' : '#57F287') : '#5865F2')
        .setTitle('❌⭕ Tic Tac Toe')
        .setDescription(
            `${MARK.X} ${playerLabel(game, 'X')}  **VS**  ${MARK.O} ${playerLabel(game, 'O')}\n\n` +
            (statusText || `Giliran: ${MARK[game.turn]} ${playerLabel(game, game.turn)}`)
        )
        .setTimestamp();
    return embed;
}

/**
 * 🔘 Handler tombol pilih kotak. customId: tictactoe_pick_<messageId>_<index>
 */
export async function handlePickButton(interaction) {
    const parts = interaction.customId.split('_');
    const messageId = parts[2];
    const index = parseInt(parts[3], 10);

    const game = getGame(messageId);
    if (!game) return interaction.reply({ content: '❌ Game ini udah gak aktif/kadaluarsa.', ephemeral: true });
    if (game.ended) return interaction.reply({ content: '❌ Game ini udah selesai.', ephemeral: true });

    const expectedPlayerId = currentPlayerId(game);
    if (interaction.user.id !== expectedPlayerId) {
        return interaction.reply({ content: '❌ Bukan giliran kamu, Sensei~', ephemeral: true });
    }
    if (game.board[index] !== null) {
        return interaction.reply({ content: '⚠️ Kotak ini udah keisi.', ephemeral: true });
    }

    game.board[index] = game.turn;

    let result = checkWinner(game.board);
    let statusText;
    let botComment = null;

    if (!result && game.mode === 'bot' && game.turn === 'X') {
        // Giliran manusia baru aja jalan & belum ada yang menang -> lanjut giliran bot (O)
        game.turn = 'O';
        const botMark = 'O';
        const humanMark = 'X';
        const botMove = pickBotMove(game.board, game.difficulty, botMark, humanMark);
        game.board[botMove] = botMark;
        result = checkWinner(game.board);
        botComment = await getBotComment(game.difficulty);
        game.turn = 'X';
    } else if (!result) {
        game.turn = otherMark(game.turn);
    }

    if (result) {
        game.ended = true;
        game.winner = result.winner;
        if (result.winner === 'draw') {
            statusText = '🤝 **SERI!** Papan penuh, gak ada yang menang.';
        } else {
            const winnerLabel = playerLabel(game, result.winner);
            statusText = `🏆 **${MARK[result.winner]} ${winnerLabel} MENANG!**`;
        }
        deleteGame(messageId);
    } else {
        statusText = `Giliran: ${MARK[game.turn]} ${playerLabel(game, game.turn)}`;
    }

    if (botComment) {
        statusText += `\n\n🤖 *"${botComment}"*`;
    }

    const embed = buildBoardEmbed(game, statusText);
    const components = buildBoardComponents(game);

    await interaction.update({ embeds: [embed], components });
}

/**
 * 🔘 Handler tombol pilih kesulitan bot. customId: tictactoe_startbot_<difficulty>_<authorId>
 */
export async function handleDifficultyButton(interaction) {
    const [, , difficulty, authorId] = interaction.customId.split('_');

    if (interaction.user.id !== authorId) {
        return interaction.reply({ content: '❌ Bukan kamu yang mulai game ini, Sensei~', ephemeral: true });
    }

    const game = createGame({
        messageId: interaction.message.id,
        channelId: interaction.channel.id,
        guildId: interaction.guild.id,
        mode: 'bot',
        difficulty,
        playerX: authorId,
        playerO: 'bot',
    });

    const embed = buildBoardEmbed(game);
    const components = buildBoardComponents(game);

    await interaction.update({ embeds: [embed], components });
}
