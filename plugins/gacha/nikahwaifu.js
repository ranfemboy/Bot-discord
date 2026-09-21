/**
 * Nikah Waifu — Discord version (BONUS)
 * -----------------------------
 * Belum ada di file asli, ditambahin biar .istriku & .ceraiwaifu ada fungsinya:
 * nikahin salah satu waifu dari koleksi hasil .gachawaifu.
 */
import { getUser, setIstri, getWaifuOwner, registerWaifuMarriage } from '../../lib/waifuStore.js';
import { rarityEmoji } from '../../lib/waifuData.js';

export const config = {
    name: 'nikahwaifu',
    alias: ['nikah', 'marrywaifu'],
    category: 'gacha',
    description: 'Menikahi salah satu waifu dari koleksi',
    usage: '.nikahwaifu <nama waifu>',
    example: '.nikahwaifu Rem',
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
            return m.reply('💍 Contoh: `.nikahwaifu Rem`\n\nKetik `.koleksiwaifu` buat lihat daftar waifu kamu.');
        }

        const user = getUser(m.guild.id, m.author.id);

        if (user.istri?.name) {
            return m.reply(`❌ Kamu udah menikah dengan *${user.istri.name}*. Cerai dulu pakai *.ceraiwaifu* kalau mau ganti.`);
        }

        if (!user.collection.length) {
            return m.reply('❌ Koleksi waifu kamu masih kosong. Coba *.gachawaifu* dulu.');
        }

        const target = user.collection.find((w) => w.name.toLowerCase() === nama.toLowerCase());
        if (!target) {
            return m.reply(`❌ Waifu **${nama}** gak ada di koleksi kamu. Ketik *.koleksiwaifu* buat lihat daftarnya.`);
        }

        // 🔒 Cek dulu apakah waifu ini udah "diambil" orang lain di server ini
        const owner = getWaifuOwner(m.guild.id, target.name);
        if (owner && owner.userId !== m.author.id) {
            return m.reply(`Anda Tidak bisa menikah dengan waifu ini karna waifu ini telah di ambil oleh <@${owner.userId}>`);
        }

        const istri = setIstri(m.guild.id, m.author.id, target);
        registerWaifuMarriage(m.guild.id, istri.name, m.author.id);

        let text = `💍 *PERNIKAHAN BERHASIL* 💍\n\n`;
        text += `Kamu resmi menikah dengan *${istri.name}* (${istri.anime}) ${rarityEmoji(istri.rarity)}!\n\n`;
        text += `Gunakan *.istriku* buat lihat profil istri kamu. 💕`;

        return m.reply(text);
    } catch (err) {
        console.error('nikahwaifu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
