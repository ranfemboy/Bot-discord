import { EmbedBuilder } from 'discord.js';
import { isRegistered, registerAccount, STARTER_BONUS } from '../../lib/pokemonStore.js';

const pluginConfig = {
    name: 'daftar',
    alias: ['register', 'daftarpoke'],
    category: 'pokemon',
    description: 'Daftar akun buat mulai main sistem Pokemon',
    usage: '.daftar nama | umur | gender',
    example: '.daftar Ran | 17 | Cowok',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    isEnabled: true,
};

// 🚻 Normalisasi input gender: cuma nerima 2 kubu (perempuan/cewek & pria/cowok)
const GENDER_MAP = {
    perempuan: { key: 'cewek', label: 'Perempuan ♀️' },
    cewek: { key: 'cewek', label: 'Perempuan ♀️' },
    pria: { key: 'cowok', label: 'Pria ♂️' },
    cowok: { key: 'cowok', label: 'Pria ♂️' },
};

function resolveGender(raw) {
    return GENDER_MAP[raw.trim().toLowerCase()] || null;
}

async function handler(m, { args }) {
    try {
        const guildId = m.guild.id;
        const userId = m.author.id;

        if (isRegistered(guildId, userId)) {
            return m.reply('❌ Kamu sudah terdaftar! Cek akun kamu lewat `.profilpoke`.');
        }

        const raw = args.join(' ');
        if (!raw.includes('|')) {
            return m.reply(
                '📝 *CARA DAFTAR*\n\n' +
                '> `.daftar nama | umur | gender`\n' +
                '> Contoh: `.daftar Ran | 17 | Cowok`\n\n' +
                'Gender yang diterima: **Perempuan/Cewek** atau **Pria/Cowok** 🚻'
            );
        }

        const parts = raw.split('|').map((s) => s.trim());
        if (parts.length !== 3) {
            return m.reply('❌ Format salah! Gunakan: `.daftar nama | umur | gender`');
        }

        const [name, ageRaw, genderRaw] = parts;

        if (!name || name.length < 2 || name.length > 20) {
            return m.reply('❌ Nama harus diisi, panjang 2–20 karakter.');
        }

        const age = parseInt(ageRaw, 10);
        if (isNaN(age) || age < 5 || age > 100) {
            return m.reply('❌ Umur tidak valid! Masukkan angka antara 5–100.');
        }

        const gender = resolveGender(genderRaw);
        if (!gender) {
            return m.reply('❌ Gender tidak valid! Cuma boleh **Perempuan/Cewek** atau **Pria/Cowok**.');
        }

        const acc = registerAccount(guildId, userId, { name, age, gender: gender.key });

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
            .setTitle('🎉 PENDAFTARAN BERHASIL!')
            .setDescription(`Selamat datang di dunia Pokemon, **${name}**! Perjalananmu dimulai sekarang 🌟`)
            .addFields(
                { name: '📛 Nama', value: name, inline: true },
                { name: '🎂 Umur', value: `${age}`, inline: true },
                { name: '🚻 Gender', value: gender.label, inline: true },
                { name: '🎁 Bonus Awal', value: `🔴 ${STARTER_BONUS.pokeballs.pokeball}x Poke Ball\n🪙 ${STARTER_BONUS.coins.toLocaleString('id-ID')} Coin`, inline: false }
            )
            .setFooter({ text: 'Ketik .eksplor buat mulai berburu Pokemon liar!' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Daftar Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
