import { EmbedBuilder } from 'discord.js';
import { POKEMON_LIST, EVOLUTION_COST, resolveEvolution } from '../../lib/pokemonData.js';
import { isRegistered, getPokemon, evolvePokemon } from '../../lib/pokemonStore.js';

const pluginConfig = {
    name: 'evolusipoke',
    alias: ['evolvepoke', 'evopoke'],
    category: 'pokemon',
    description: 'Mengevolusikan Pokemon kamu (biaya 5.000 coin)',
    usage: '.evolusipoke <uid>',
    example: '.evolusipoke p3',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m, { args }) {
    try {
        const guildId = m.guild.id;
        const userId = m.author.id;

        if (!isRegistered(guildId, userId)) {
            return m.reply('❌ Kamu belum daftar! Ketik `.daftar nama | umur | gender` dulu ya.');
        }

        const uid = args[0]?.trim().toLowerCase();
        if (!uid) {
            return m.reply(
                '🧬 *CARA EVOLUSI*\n\n> `.evolusipoke <uid>`\n> Contoh: `.evolusipoke p3`\n\n' +
                `💰 Biaya evolusi: **${EVOLUTION_COST.toLocaleString('id-ID')} coin**\n` +
                'Ketik `.kandang` buat lihat UID Pokemon kamu.'
            );
        }

        const mon = getPokemon(guildId, userId, uid);
        if (!mon) {
            return m.reply(`❌ Pokemon dengan UID **${uid}** tidak ditemukan. Cek \`.kandang\`.`);
        }

        const evoInfo = resolveEvolution(mon.key);
        if (!evoInfo) {
            return m.reply(`❌ **${POKEMON_LIST[mon.key].name}** tidak punya evolusi lebih lanjut.`);
        }

        const result = evolvePokemon(guildId, userId, uid);

        if (!result.ok) {
            if (result.reason === 'level_kurang') {
                return m.reply(`❌ Level Pokemon ini masih kurang! Butuh minimal level **${result.required}** buat evolusi.`);
            }
            if (result.reason === 'coin_kurang') {
                return m.reply(`❌ Coin kamu gak cukup! Evolusi butuh **${result.required.toLocaleString('id-ID')} coin**.`);
            }
            return m.reply('❌ Gagal mengevolusikan Pokemon.');
        }

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
            .setTitle('🧬 EVOLUSI BERHASIL!')
            .setDescription(
                `**${result.oldSpecies.name}** berevolusi menjadi **${result.newSpecies.name}**! 🎉\n\n` +
                `🆔 UID: \`${result.mon.uid}\`\n` +
                `📊 Level: **${result.mon.level}**\n` +
                `❤️ HP: **${result.mon.currentHp} / ${result.mon.maxHp}**\n` +
                `💰 Biaya: **-${EVOLUTION_COST.toLocaleString('id-ID')} coin**`
            )
            .setThumbnail(result.oldSpecies.sprite)
            .setImage(result.newSpecies.sprite)
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Evolusipoke Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };