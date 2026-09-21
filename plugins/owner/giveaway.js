import { createGiveaway, buildGiveawayEmbed, buildButtonRow, scheduleGiveawayEnd } from '../../lib/giveawayStore.js';

const pluginConfig = {
    name: 'giveaway',
    alias: ['gaway'],
    category: 'owner',
    description: 'Membuat giveaway uang dengan sistem tombol (khusus owner)',
    usage: '.giveaway <jumlah>|<maks klaim>|<hari>',
    example: '.giveaway 50000|5|3',
    isOwner: true,
    isGroup: true,
    isPrivate: false,
    cooldown: 0,
    isEnabled: true,
};

async function handler(m, { args, client }) {
    try {
        const raw = args.join(' ');
        const parts = raw.split('|').map((s) => s.trim());

        if (parts.length < 3) {
            return m.reply(
                '🎁 *CARA BUAT GIVEAWAY*\n\n> `.giveaway <jumlah>|<maks klaim>|<hari>`\n> Contoh: `.giveaway 50000|5|3`\n\n' +
                '💰 jumlah = uang per orang\n🎟️ maks klaim = berapa orang bisa klaim\n⏰ hari = lama giveaway berjalan'
            );
        }

        const amount = parseInt(parts[0].replace(/[.,]/g, ''), 10);
        const maxUse = parseInt(parts[1], 10);
        const days = parseFloat(parts[2]);

        if (!amount || amount <= 0) return m.reply('❌ Jumlah uang tidak valid!');
        if (!maxUse || maxUse <= 0) return m.reply('❌ Maksimal klaim tidak valid!');
        if (!days || days <= 0) return m.reply('❌ Jumlah hari tidak valid!');

        const id = `${m.guild.id}-${Date.now()}`;
        const giveaway = {
            id,
            guildId: m.guild.id,
            channelId: m.channel.id,
            hostId: m.author.id,
            amount,
            maxUse,
            claimedBy: [],
            createdAt: Date.now(),
            expiresAt: Date.now() + days * 24 * 60 * 60 * 1000,
            ended: false,
            messageId: null,
        };

        const embed = buildGiveawayEmbed(giveaway);
        const row = buildButtonRow(id);

        const sent = await m.channel.send({ embeds: [embed], components: [row] });
        giveaway.messageId = sent.id;

        createGiveaway(giveaway);
        scheduleGiveawayEnd(client, giveaway);

        await m.react('✅').catch(() => {});
    } catch (error) {
        console.error('Giveaway Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
