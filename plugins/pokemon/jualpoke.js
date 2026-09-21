import { EmbedBuilder } from 'discord.js';
import { POKEMON_LIST, RARITY, randomBetween } from '../../lib/pokemonData.js';
import { isRegistered, getPokemon, sellPokemon } from '../../lib/pokemonStore.js';

const pluginConfig = {
    name: 'jualpoke',
    alias: ['jual', 'sellpoke'],
    category: 'pokemon',
    description: 'Menjual salah satu Pokemon kamu demi Coin',
    usage: '.jualpoke <uid>',
    example: '.jualpoke p2',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    isEnabled: true,
};

async function handler(m, { args }) {
    try {
        const guildId = m.guild.id;
        const userId = m.author.id;

        if (!isRegistered(guildId, userId)) {
            return m.reply('❌ Kamu belum daftar! Ketik `.daftar nama | umur | gender` dulu ya.');
        }

        const uid = (args[0] || '').trim().toLowerCase();
        if (!uid) {
            return m.reply('❌ Sebutkan UID Pokemon yang mau dijual! Contoh: `.jualpoke p2`\n\nKetik `.kandang` buat lihat UID Pokemon kamu.');
        }

        const mon = getPokemon(guildId, userId, uid);
        if (!mon) {
            return m.reply(`❌ Pokemon dengan UID **${uid}** tidak ditemukan.`);
        }

        const species = POKEMON_LIST[mon.key];
        const rarity = RARITY[species.rarity];
        const coinReward = Math.round(randomBetween(rarity.coin[0], rarity.coin[1]) * (1 + mon.level * 0.05));

        const acc = sellPokemon(guildId, userId, uid, coinReward);
        if (!acc) return m.reply('❌ Gagal menjual Pokemon.');

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
            .setTitle('💰 Pokemon Terjual!')
            .setThumbnail(species.sprite)
            .addFields(
                { name: '📛 Pokemon', value: `${species.name} ${rarity.emoji} (Lv.${mon.level})`, inline: true },
                { name: '💰 Didapat', value: `+${coinReward.toLocaleString('id-ID')} 🪙`, inline: true },
                { name: '🪙 Coin Sekarang', value: `${acc.coins.toLocaleString('id-ID')} 🪙`, inline: true }
            )
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Jualpoke Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
