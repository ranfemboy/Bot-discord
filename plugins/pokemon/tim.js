import { EmbedBuilder } from 'discord.js';
import { POKEMON_LIST, RARITY } from '../../lib/pokemonData.js';
import { isRegistered, getAccount, setTeam } from '../../lib/pokemonStore.js';

const pluginConfig = {
    name: 'tim',
    alias: ['team', 'timku'],
    category: 'pokemon',
    description: 'Melihat atau mengatur tim andalan (urutan pertama dipakai saat duel)',
    usage: '.tim / .tim set uid1,uid2,uid3',
    example: '.tim set p3,p1,p5',
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

        // ⚙️ Mode set: .tim set p3,p1,p5
        if (args[0]?.toLowerCase() === 'set') {
            const uids = (args[1] || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
            if (!uids.length) {
                return m.reply('❌ Sebutkan UID Pokemon dipisah koma! Contoh: `.tim set p3,p1,p5`');
            }

            const acc = getAccount(guildId, userId);
            const invalid = uids.filter((uid) => !acc.pokemons.some((p) => p.uid === uid));
            if (invalid.length) {
                return m.reply(`❌ UID tidak ditemukan: ${invalid.join(', ')}`);
            }

            const team = setTeam(guildId, userId, uids);
            return m.reply(`✅ Tim berhasil diatur! Andalan (lead): \`${team[0]}\`\nTotal: ${team.length} / 6 Pokemon.`);
        }

        // 📋 Mode lihat tim
        const acc = getAccount(guildId, userId);
        if (!acc.team.length) {
            return m.reply('📭 Kamu belum punya tim! Ketik `.eksplor` buat nangkap Pokemon dulu.');
        }

        const lines = acc.team.map((uid, i) => {
            const mon = acc.pokemons.find((p) => p.uid === uid);
            if (!mon) return `\`${uid}\` — (data tidak ditemukan)`;
            const species = POKEMON_LIST[mon.key];
            const rarity = RARITY[species.rarity];
            const leadTag = i === 0 ? ' 🌟 Andalan' : '';
            return `${i + 1}. \`${mon.uid}\` ${rarity.emoji} **${species.name}** — Lv.${mon.level} — ❤️ ${mon.currentHp}/${mon.maxHp}${leadTag}`;
        });

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
            .setTitle(`👥 TIM ANDALAN (${acc.team.length}/6)`)
            .setDescription(lines.join('\n'))
            .setFooter({ text: 'Ketik .tim set uid1,uid2,... buat ganti urutan tim' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Tim Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
