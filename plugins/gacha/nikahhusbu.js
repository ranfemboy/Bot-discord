/**
 * Nikah Husbu — Discord version
 * -----------------------------
 * Versi cowok dari nikahwaifu.js
 */
import { getUser, setSuami, getHusbuOwner, registerHusbuMarriage } from '../../lib/husbuStore.js';
import { rarityEmoji } from '../../lib/husbuData.js';

export const config = {
    name: 'nikahhusbu',
    alias: ['nikahhusband', 'marryhusbu'],
    category: 'gacha',
    description: 'Menikahi salah satu husbu dari koleksi',
    usage: '.nikahhusbu <nama husbu>',
    example: '.nikahhusbu Levi Ackerman',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { args }) {
    try {
        const nama = args.join(' ').trim();
        if (!nama) {
            return m.reply('💍 Contoh: `.nikahhusbu Levi Ackerman`\n\nKetik `.koleksihusbu` buat lihat daftar husbu kamu.');
        }

        const user = getUser(m.guild.id, m.author.id);

        if (user.suami?.name) {
            return m.reply(`❌ Kamu udah menikah dengan *${user.suami.name}*. Cerai dulu pakai *.ceraihusbu* kalau mau ganti.`);
        }

        if (!user.collection.length) {
            return m.reply('❌ Koleksi husbu kamu masih kosong. Coba *.gachahusbu* dulu.');
        }

        const target = user.collection.find((h) => h.name.toLowerCase() === nama.toLowerCase());
        if (!target) {
            return m.reply(`❌ Husbu **${nama}** gak ada di koleksi kamu. Ketik *.koleksihusbu* buat lihat daftarnya.`);
        }

        // 🔒 Cek dulu apakah husbu ini udah "diambil" orang lain di server ini
        const owner = getHusbuOwner(m.guild.id, target.name);
        if (owner && owner.userId !== m.author.id) {
            return m.reply(`Anda Tidak bisa menikah dengan husbu ini karna husbu ini telah di ambil oleh <@${owner.userId}>`);
        }

        const suami = setSuami(m.guild.id, m.author.id, target);
        registerHusbuMarriage(m.guild.id, suami.name, m.author.id);

        let text = `💍 *PERNIKAHAN BERHASIL* 💍\n\n`;
        text += `Kamu resmi menikah dengan *${suami.name}* (${suami.anime}) ${rarityEmoji(suami.rarity)}!\n\n`;
        text += `Gunakan *.suamiku* buat lihat profil suami kamu. 💕`;

        return m.reply(text);
    } catch (err) {
        console.error('nikahhusbu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
