/**
 * Koleksi Husbu — Discord version
 * -----------------------------
 * Versi cowok dari koleksiwaifu.js
 */
import { getUser } from '../../lib/husbuStore.js';
import { rarityEmoji } from '../../lib/husbuData.js';

export const config = {
    name: 'koleksihusbu',
    alias: ['husbucollection', 'koleksihusband'],
    category: 'gacha',
    description: 'Melihat koleksi husbu hasil gacha',
    usage: '.koleksihusbu',
    example: '.koleksihusbu',
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
            return m.reply('📦 Koleksi husbu kamu masih kosong. Coba *.gachahusbu* dulu.');
        }

        // Grup berdasarkan nama, biar duplikat kelihatan jumlahnya (contoh: Levi Ackerman x3)
        const grouped = new Map();
        for (const h of user.collection) {
            const key = h.name;
            if (!grouped.has(key)) grouped.set(key, { ...h, count: 0 });
            grouped.get(key).count++;
        }

        const order = { LEGENDARY: 0, EPIC: 1, COMMON: 2 };
        const sorted = [...grouped.values()].sort((a, b) => order[a.rarity] - order[b.rarity]);

        let text = `📦 *KOLEKSI HUSBU* — ${m.author.username}\n\n`;
        text += `Total : ${user.collection.length} husbu (${grouped.size} unik)\n\n`;
        sorted.forEach((h, i) => {
            text += `${i + 1}. ${h.name} (${h.anime}) ${rarityEmoji(h.rarity)}${h.count > 1 ? ` x${h.count}` : ''}\n`;
        });
        text += `\nGunakan *.nikahhusbu <nama>* buat menikahi salah satunya.`;

        return m.reply(text);
    } catch (err) {
        console.error('koleksihusbu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
