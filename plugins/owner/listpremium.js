import { EmbedBuilder } from 'discord.js';
import { getAllPremium } from '../../lib/premiumStore.js';

export const config = {
    name: 'listpremium',
    alias: ['lsprem', 'listprem'],
    category: 'owner',
    description: 'Liat semua user premium yang masih aktif (khusus owner)',
    usage: '.listpremium',
    example: '.listpremium',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { client }) {
    const list = getAllPremium();
    if (list.length === 0) {
        return m.reply('📭 Belum ada user premium yang aktif.');
    }

    const chunks = [];
    for (let i = 0; i < list.length; i += 10) chunks.push(list.slice(i, i + 10));

    for (let i = 0; i < chunks.length; i++) {
        const lines = await Promise.all(
            chunks[i].map(async (entry, idx) => {
                let tag = entry.userId;
                try {
                    const user = await client.users.fetch(entry.userId);
                    tag = user.tag;
                } catch {}

                const status = entry.lifetime
                    ? '♾️ Lifetime'
                    : `⏳ Sampai ${new Date(entry.expiresAt).toLocaleString('id-ID')}`;

                return `**${i * 10 + idx + 1}. ${tag}** (\`${entry.userId}\`)\n> ${status}`;
            })
        );

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(i === 0 ? `⭐ List Premium (${list.length} user aktif)` : '⭐ List Premium (lanjutan)')
            .setDescription(lines.join('\n\n'))
            .setFooter({ text: `Halaman ${i + 1}/${chunks.length}` });

        await m.reply({ embeds: [embed] });
    }
}