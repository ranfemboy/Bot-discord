import { EmbedBuilder } from 'discord.js';
import { TYPES } from '../../lib/pokemonData.js';

const pluginConfig = {
    name: 'tipepoke',
    alias: ['tipe', 'typelist'],
    category: 'pokemon',
    description: 'Menampilkan daftar semua tipe Pokemon beserta emoji-nya',
    usage: '.tipepoke',
    example: '.tipepoke',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m) {
    try {
        const lines = Object.values(TYPES).map((t) => `${t.emoji} **${t.label}**`);

        // Bagi 2 kolom biar rapi
        const half = Math.ceil(lines.length / 2);
        const col1 = lines.slice(0, half).join('\n');
        const col2 = lines.slice(half).join('\n');

        const embed = new EmbedBuilder()
            .setColor('#95A5A6')
            .setTitle('📖 DAFTAR TIPE POKEMON')
            .addFields(
                { name: '\u200b', value: col1, inline: true },
                { name: '\u200b', value: col2, inline: true }
            )
            .setFooter({ text: 'Ketik .pokedex buat lihat katalog spesies Pokemon' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Tipepoke Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
