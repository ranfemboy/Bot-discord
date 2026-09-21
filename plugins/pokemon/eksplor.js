import { isRegistered, getAccount } from '../../lib/pokemonStore.js';
import { createEksplorJob, buildEksplorMessage } from '../../lib/eksplorStore.js';

const pluginConfig = {
    name: 'eksplor',
    alias: ['explore', 'jelajah'],
    category: 'pokemon',
    description: 'Menjelajah buat ketemu Pokemon liar yang bisa ditangkap',
    usage: '.eksplor',
    example: '.eksplor',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    isEnabled: true,
};

async function handler(m) {
    try {
        const guildId = m.guild.id;
        const userId = m.author.id;

        if (!isRegistered(guildId, userId)) {
            return m.reply('❌ Kamu belum daftar! Ketik `.daftar nama | umur | gender` dulu ya.');
        }

        const acc = getAccount(guildId, userId);
        const hasBall = Object.values(acc.pokeballs).some((n) => n > 0);
        if (!hasBall) {
            return m.reply('❌ Pokeball kamu habis! Beli dulu di `.pokeshop` sebelum eksplor lagi.');
        }

        const { id, species, level } = createEksplorJob(guildId, userId);
        await m.reply(buildEksplorMessage(id, species, level));
    } catch (error) {
        console.error('Eksplor Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
