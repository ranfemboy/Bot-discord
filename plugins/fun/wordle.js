import { EmbedBuilder } from 'discord.js';
import { startGame, getSession, submitGuess, giveUp } from '../../lib/wordleStore.js';

const pluginConfig = {
    name: 'wordle',
    alias: [],
    category: 'fun',
    description: 'Main tebak kata 5 huruf ala Wordle (Bahasa Indonesia), bebas main berkali-kali',
    usage: '.wordle / .wordle <kata> / .wordle nyerah',
    example: '.wordle rumah',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 2,
    isEnabled: true,
};

const FEEDBACK_EMOJI = { correct: '🟩', present: '🟨', absent: '⬛' };

function renderBoard(session) {
    if (!session.guesses.length) return '_Belum ada tebakan._';
    return session.guesses
        .map((g) => {
            const letters = g.word.toUpperCase().split('').join(' ');
            const emoji = g.feedback.map((f) => FEEDBACK_EMOJI[f]).join('');
            return `${emoji}\n\`${letters}\``;
        })
        .join('\n\n');
}

function buildEmbed(session, extraNote) {
    const sisa = session.maxGuesses - session.guesses.length;
    const embed = new EmbedBuilder()
        .setColor(session.finished ? (session.win ? '#2ECC71' : '#E74C3C') : '#3498DB')
        .setTitle('🟩 WORDLE — Tebak Kata 5 Huruf')
        .setDescription(renderBoard(session))
        .addFields({ name: '🎯 Sisa Kesempatan', value: `${session.finished ? 0 : sisa} / ${session.maxGuesses}`, inline: true })
        .setFooter({ text: 'Ketik .wordle <kata> buat nebak, atau .wordle nyerah buat nyerah' })
        .setTimestamp();

    if (extraNote) embed.addFields({ name: '📢 Info', value: extraNote, inline: false });
    if (session.finished && !session.win) embed.addFields({ name: '🔑 Jawaban', value: session.word.toUpperCase(), inline: true });

    return embed;
}

async function handler(m, { args }) {
    try {
        const userId = m.author.id;
        const input = (args[0] || '').toLowerCase();

        if (input === 'nyerah') {
            const result = giveUp(userId);
            if (!result) return m.reply('❌ Kamu gak lagi main Wordle. Ketik `.wordle` buat mulai game baru.');
            return m.reply({ embeds: [buildEmbed(result, `🏳️ Kamu nyerah! Jawabannya **${result.word.toUpperCase()}**.`)] });
        }

        let session = getSession(userId);

        if (!input) {
            if (!session || session.finished) {
                session = startGame(userId);
                return m.reply({ embeds: [buildEmbed(session, '🎮 Game baru dimulai! Tebak kata 5 huruf.')] });
            }
            return m.reply({ embeds: [buildEmbed(session)] });
        }

        if (!/^[a-z]{5}$/.test(input)) {
            return m.reply('❌ Tebakan harus tepat **5 huruf** (huruf saja, tanpa angka/simbol)!');
        }

        if (!session || session.finished) {
            session = startGame(userId);
        }

        const result = submitGuess(userId, input);
        const note = result.finished && result.win ? `🎉 Bener banget! Ketebak dalam **${result.guesses.length}** tebakan!` : null;

        await m.reply({ embeds: [buildEmbed(result, note)] });
    } catch (error) {
        console.error('Wordle Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
