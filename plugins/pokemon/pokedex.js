import { EmbedBuilder } from 'discord.js';
import { POKEMON_LIST, RARITY, resolveSpecies, formatTypes } from '../../lib/pokemonData.js';

const pluginConfig = {
    name: 'pokedex',
    alias: ['dex', 'katalogpoke'],
    category: 'pokemon',
    description: 'Melihat katalog spesies Pokemon (semua atau detail 1 nama)',
    usage: '.pokedex [nama]',
    example: '.pokedex / .pokedex pikachu',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m, { args }) {
    try {
        const query = args.join(' ').trim();

        if (query) {
            const species = resolveSpecies(query);
            if (!species) return m.reply(`❌ Pokemon **${query}** tidak ditemukan di Pokedex.`);

            const rarity = RARITY[species.rarity];
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle(`📖 ${species.name}`)
                .setThumbnail(species.sprite)
                .setImage(species.sprite)
                .addFields(
                    { name: '🏷️ Tipe', value: formatTypes(species.types), inline: true },
                    { name: `${rarity.emoji} Rarity`, value: rarity.label, inline: true },
                    { name: '🎯 Catch Rate Dasar', value: `${Math.round(rarity.catchRate * 100)}%`, inline: true },
                    { name: '❤️ Base HP', value: `${species.baseHp}`, inline: true },
                    { name: '⚔️ Base ATK', value: `${species.baseAtk}`, inline: true },
                    { name: '🛡️ Base DEF', value: `${species.baseDef}`, inline: true }
                )
                .setTimestamp();

            return m.reply({ embeds: [embed] });
        }

        const byRarity = { legendary: [], rare: [], uncommon: [], common: [] };
        for (const p of Object.values(POKEMON_LIST)) byRarity[p.rarity].push(p);

        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle(`📖 POKEDEX (${Object.keys(POKEMON_LIST).length} Spesies)`)
            .addFields(
                Object.entries(byRarity)
                    .filter(([, list]) => list.length)
                    .map(([rarityKey, list]) => ({
                        name: `${RARITY[rarityKey].emoji} ${RARITY[rarityKey].label}`,
                        value: list.map((p) => p.name).join(', '),
                        inline: false,
                    }))
            )
            .setFooter({ text: 'Ketik .pokedex <nama> buat lihat detail 1 Pokemon' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Pokedex Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
