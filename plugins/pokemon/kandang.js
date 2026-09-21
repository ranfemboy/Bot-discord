import { EmbedBuilder } from 'discord.js';
import { POKEMON_LIST, RARITY, formatTypes } from '../../lib/pokemonData.js';
import { isRegistered, getAccount, getPokemon } from '../../lib/pokemonStore.js';

const pluginConfig = {
    name: 'kandang',
    alias: ['koleksi', 'pokemonku'],
    category: 'pokemon',
    description: 'Melihat koleksi Pokemon kamu (atau detail 1 Pokemon lewat UID)',
    usage: '.kandang [uid]',
    example: '.kandang / .kandang p1',
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

        const acc = getAccount(guildId, userId);
        const uidQuery = (args[0] || '').trim().toLowerCase();

        // 🔍 Mode detail: .kandang <uid>
        if (uidQuery) {
            const mon = getPokemon(guildId, userId, uidQuery);
            if (!mon) return m.reply(`❌ Pokemon dengan UID **${uidQuery}** tidak ditemukan.`);

            const species = POKEMON_LIST[mon.key];
            const rarity = RARITY[species.rarity];
            const isLead = acc.team[0] === mon.uid;

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(`${rarity.emoji} ${species.name}${isLead ? ' 🌟 (Andalan)' : ''}`)
                .setThumbnail(species.sprite)
                .addFields(
                    { name: '🆔 UID', value: mon.uid, inline: true },
                    { name: '📊 Level', value: `${mon.level}`, inline: true },
                    { name: '✨ EXP', value: `${mon.exp || 0}`, inline: true },
                    { name: '🏷️ Tipe', value: formatTypes(species.types), inline: true },
                    { name: `${rarity.emoji} Rarity`, value: rarity.label, inline: true },
                    { name: '👥 Di Tim', value: acc.team.includes(mon.uid) ? '✅ Ya' : '🚫 Tidak', inline: true },
                    { name: '❤️ HP', value: `${mon.currentHp} / ${mon.maxHp}`, inline: false }
                )
                .setTimestamp();

            return m.reply({ embeds: [embed] });
        }

        // 📋 Mode list ringkas
        if (!acc.pokemons.length) {
            return m.reply('📭 Kandang kamu masih kosong! Ketik `.eksplor` buat mulai berburu Pokemon liar.');
        }

        const lines = acc.pokemons.map((p) => {
            const species = POKEMON_LIST[p.key];
            const rarity = RARITY[species.rarity];
            const leadTag = acc.team[0] === p.uid ? ' 🌟' : '';
            return `\`${p.uid}\` ${rarity.emoji} **${species.name}** — Lv.${p.level} — ❤️ ${p.currentHp}/${p.maxHp}${leadTag}`;
        });

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
            .setTitle(`🐾 KANDANG POKEMON (${acc.pokemons.length})`)
            .setDescription(lines.join('\n').slice(0, 4000))
            .setFooter({ text: 'Ketik .kandang <uid> buat lihat detail, atau .tim buat atur tim andalan' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Kandang Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
