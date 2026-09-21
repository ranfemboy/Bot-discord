import { isRegistered, getLeadPokemon } from '../../lib/pokemonStore.js';
import { createDuelChallenge, buildChallengeMessage } from '../../lib/duelStore.js';

const pluginConfig = {
    name: 'duel',
    alias: ['battle', 'tarungpoke'],
    category: 'pokemon',
    description: 'Menantang player lain buat duel Pokemon andalan',
    usage: '.duel @user',
    example: '.duel @Fana',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    isEnabled: true,
};

async function handler(m) {
    try {
        const guildId = m.guild.id;
        const challenger = m.author;
        const target = m.mentions.users.first();

        if (!target) {
            return m.reply('❌ Tag orang yang mau kamu tantang! Contoh: `.duel @Fana`');
        }
        if (target.bot) {
            return m.reply('❌ Gak bisa nantang bot!');
        }
        if (target.id === challenger.id) {
            return m.reply('❌ Gak bisa nantang diri sendiri, ngapain juga 😅');
        }

        if (!isRegistered(guildId, challenger.id)) {
            return m.reply('❌ Kamu belum daftar! Ketik `.daftar nama | umur | gender` dulu ya.');
        }
        if (!isRegistered(guildId, target.id)) {
            return m.reply(`❌ ${target} belum daftar akun Pokemon, gak bisa diajak duel.`);
        }

        const leadChallenger = getLeadPokemon(guildId, challenger.id);
        const leadTarget = getLeadPokemon(guildId, target.id);

        if (!leadChallenger) {
            return m.reply('❌ Kamu belum punya Pokemon sama sekali! Tangkap dulu lewat `.eksplor`.');
        }
        if (!leadTarget) {
            return m.reply(`❌ ${target} belum punya Pokemon sama sekali, gak bisa diajak duel.`);
        }
        if (leadChallenger.currentHp <= 0) {
            return m.reply('❌ Pokemon andalan kamu sedang sekarat! Sembuhkan dulu lewat `.healpoke`.');
        }
        if (leadTarget.currentHp <= 0) {
            return m.reply(`❌ Pokemon andalan ${target} sedang sekarat, gak bisa diajak duel dulu.`);
        }

        const id = createDuelChallenge(guildId, m.channel.id, challenger.id, target.id);
        await m.reply(buildChallengeMessage(id, challenger, target));
    } catch (error) {
        console.error('Duel Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
