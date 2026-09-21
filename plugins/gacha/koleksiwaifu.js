/**
 * Koleksi Waifu — Discord version (BONUS)
 * -----------------------------
 * Belum ada di file asli, ditambahin karena direferensikan di teks .gachawaifu.
 */
import { getUser } from '../../lib/waifuStore.js';
import { rarityEmoji } from '../../lib/waifuData.js';

export const config = {
    name: 'koleksiwaifu',
    alias: ['waifucollection', 'koleksi'],
    category: 'gacha',
    description: 'Melihat koleksi waifu hasil gacha',
    usage: '.koleksiwaifu',
    example: '.koleksiwaifu',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
};

export async function handler(m) {
    try {
        const user = getUser(m.guild.id, m.author.id);

        if (!user.collection.length) {
            return m.reply('📦 Koleksi waifu kamu masih kosong. Coba *.gachawaifu* dulu.');
        }

        // Grup berdasarkan nama, biar duplikat kelihatan jumlahnya (contoh: Rem x3)
        const grouped = new Map();
        for (const w of user.collection) {
            const key = w.name;
            if (!grouped.has(key)) grouped.set(key, { ...w, count: 0 });
            grouped.get(key).count++;
        }

        const order = { LEGENDARY: 0, EPIC: 1, COMMON: 2 };
        const sorted = [...grouped.values()].sort((a, b) => order[a.rarity] - order[b.rarity]);

        let text = `📦 *KOLEKSI WAIFU* — ${m.author.username}\n\n`;
        text += `Total : ${user.collection.length} waifu (${grouped.size} unik)\n\n`;
        sorted.forEach((w, i) => {
            text += `${i + 1}. ${w.name} (${w.anime}) ${rarityEmoji(w.rarity)}${w.count > 1 ? ` x${w.count}` : ''}\n`;
        });
        text += `\nGunakan *.nikahwaifu <nama>* buat menikahi salah satunya.`;

        return m.reply(text);
    } catch (err) {
        console.error('koleksiwaifu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
