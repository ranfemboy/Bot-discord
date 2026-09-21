import { EmbedBuilder } from 'discord.js';
import { isRegistered, getAccount } from '../../lib/pokemonStore.js';

const pluginConfig = {
    name: 'profilpoke',
    alias: ['akunpoke', 'mypoke'],
    category: 'pokemon',
    description: 'Melihat profil akun Pokemon kamu',
    usage: '.profilpoke [@user]',
    example: '.profilpoke',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m) {
    try {
        const target = m.mentions.users.first() || m.author;
        const guildId = m.guild.id;

        if (!isRegistered(guildId, target.id)) {
            return m.reply(target.id === m.author.id
                ? '❌ Kamu belum daftar! Ketik `.daftar nama | umur | gender` dulu ya.'
                : `❌ ${target} belum daftar akun Pokemon.`);
        }

        const acc = getAccount(guildId, target.id);
        const genderLabel = acc.gender === 'cewek' ? 'Perempuan ♀️' : 'Pria ♂️';

        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('🎴 PROFIL POKEMON TRAINER')
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: '📛 Nama', value: acc.name || '-', inline: true },
                { name: '🎂 Umur', value: `${acc.age ?? '-'}`, inline: true },
                { name: '🚻 Gender', value: genderLabel, inline: true },
                { name: '🪙 Coin', value: `${acc.coins.toLocaleString('id-ID')}`, inline: true },
                { name: '🐾 Total Pokemon', value: `${acc.pokemons.length}`, inline: true },
                { name: '👥 Tim', value: `${acc.team.length} / 6`, inline: true },
                {
                    name: '🎯 Pokeball',
                    value:
                        `🔴 Poke Ball: ${acc.pokeballs.pokeball}\n` +
                        `🟠 Great Ball: ${acc.pokeballs.greatball}\n` +
                        `🟡 Ultra Ball: ${acc.pokeballs.ultraball}\n` +
                        `🟣 Master Ball: ${acc.pokeballs.masterball}`,
                    inline: true,
                },
                {
                    name: '🧪 Potion',
                    value: `🧪 Potion: ${acc.potions.potion}\n💊 Super Potion: ${acc.potions.superpotion}`,
                    inline: true,
                }
            )
            .setFooter({ text: 'Ketik .kandang buat lihat koleksi Pokemon' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Profilpoke Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
