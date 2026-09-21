import { EmbedBuilder } from 'discord.js';

export const config = {
    name: 'listserver',
    alias: ['lsserver', 'servers'],
    category: 'owner',
    description: 'Liat semua server yang ada bot-nya (khusus owner)',
    usage: '.listserver',
    example: '.listserver',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { client }) {
    if (client.guilds.cache.size === 0) {
        return m.reply('❌ Bot belum join server manapun.');
    }

    const guilds = [...client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
    const totalMembers = guilds.reduce((sum, g) => sum + g.memberCount, 0);

    const chunks = [];
    for (let i = 0; i < guilds.length; i += 10) chunks.push(guilds.slice(i, i + 10));

    for (let i = 0; i < chunks.length; i++) {
        const desc = chunks[i]
            .map((g, idx) => `**${i * 10 + idx + 1}. ${g.name}**\n> ID: \`${g.id}\` | 👥 ${g.memberCount.toLocaleString('id-ID')} member | 👑 Owner: <@${g.ownerId}>`)
            .join('\n\n');

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(i === 0 ? `📋 List Server (${guilds.length} total, ${totalMembers.toLocaleString('id-ID')} member)` : '📋 List Server (lanjutan)')
            .setDescription(desc)
            .setFooter({ text: `Halaman ${i + 1}/${chunks.length}` });

        await m.reply({ embeds: [embed] });
    }
}