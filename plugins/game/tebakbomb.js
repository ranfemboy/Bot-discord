import { removeMoney, getUser } from '../../lib/economyStore.js';
import { createGame, buildBoardEmbed, buildBoardComponents } from '../../lib/tebakBombStore.js';

export const config = {
    name: 'tebakbomb',
    alias: ['bomb', 'tebakbuah', 'mines'],
    category: 'game',
    description: 'Game tebak bomb — buka kotak buah, hindari bomb, cash out kapan aja',
    usage: '.tebakbomb <taruhan>',
    example: '.tebakbomb 1000',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true,
};

const MIN_BET = 100;

export async function handler(m, { args, prefix }) {
    const bet = parseInt(args[0], 10);

    if (!bet || bet < MIN_BET) {
        const user = getUser(m.guild.id, m.author.id);
        return m.reply(
            `⚠️ **CARA MAIN**\n\n` +
            `> \`${prefix}tebakbomb <taruhan>\`\n` +
            `> Minimal taruhan: **${MIN_BET.toLocaleString('id-ID')}**\n\n` +
            `💰 Saldo kamu: **${user.money.toLocaleString('id-ID')}**\n\n` +
            `Contoh: \`${prefix}tebakbomb 1000\``
        );
    }

    const success = removeMoney(m.guild.id, m.author.id, bet);
    if (!success) {
        const user = getUser(m.guild.id, m.author.id);
        return m.reply(`❌ Saldo kamu gak cukup, Sensei~\n\n> Saldo kamu: **${user.money.toLocaleString('id-ID')}**`);
    }

    // Kirim dulu pakai state kosong buat dapetin messageId, baru bikin game & board asli
    const placeholderMsg = await m.reply('💣 Menyiapkan papan...');

    const game = createGame({
        messageId: placeholderMsg.id,
        channelId: placeholderMsg.channel.id,
        guildId: m.guild.id,
        ownerId: m.author.id,
        bet,
    });

    const embed = buildBoardEmbed(game, { username: m.author.username });
    const components = buildBoardComponents(game);

    await placeholderMsg.edit({ content: '', embeds: [embed], components });
}