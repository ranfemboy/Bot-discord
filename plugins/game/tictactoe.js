import { createGame, buildBoardEmbed, buildBoardComponents, buildDifficultyEmbed, buildDifficultyComponents } from '../../lib/tictactoeStore.js';

export const config = {
    name: 'tictactoe',
    alias: ['ttt', 'tictac'],
    category: 'game',
    description: 'Main Tic Tac Toe — lawan pemain lain atau lawan Bot (Easy/Medium/Hard)',
    usage: '.tictactoe @user  ATAU  .tictactoe (buat lawan bot)',
    example: '.tictactoe @Budi',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { prefix }) {
    const opponent = m.mentions.users.first();

    // 🆚 Mode Player vs Player
    if (opponent) {
        if (opponent.id === m.author.id) {
            return m.reply('❌ Gak bisa lawan diri sendiri, Sensei~');
        }
        if (opponent.bot) {
            return m.reply(`❌ Gak bisa mention bot. Mau lawan bot? Ketik \`${prefix}tictactoe\` tanpa mention siapa-siapa.`);
        }

        const placeholderMsg = await m.reply('❌⭕ Menyiapkan papan...');

        const game = createGame({
            messageId: placeholderMsg.id,
            channelId: placeholderMsg.channel.id,
            guildId: m.guild.id,
            mode: 'pvp',
            playerX: m.author.id,
            playerO: opponent.id,
        });

        const embed = buildBoardEmbed(game);
        const components = buildBoardComponents(game);

        return placeholderMsg.edit({ content: '', embeds: [embed], components });
    }

    // 🤖 Mode Player vs Bot -> pilih kesulitan dulu
    const embed = buildDifficultyEmbed(`<@${m.author.id}>`);
    const components = buildDifficultyComponents(m.author.id);

    await m.reply({ embeds: [embed], components });
}
