import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } from 'discord.js';
import { createGiveaway } from '../../lib/giveawayAmStore.js';
import { getStats } from '../../lib/amPremStore.js';

/**
 * 🔄 UPDATE: format command diubah dari `.giveaway am <jumlah>` (subcommand)
 * jadi `.giveawayam | <jumlah>` sesuai request. Teks embed & label tombol
 * juga disesuaikan. Logic inti (DM ke user yang claim + notif owner) TIDAK
 * DIUBAH sama sekali — itu semua sudah ditangani di
 * lib/giveawayAmStore.js -> handleGiveawayAmClaim() dan sudah benar.
 */
export const config = {
    name: 'giveawayam',
    alias: ['gwam'],
    category: 'admin',
    description: 'Bikin giveaway akun Alight Motion Premium untuk server (khusus admin/owner)',
    usage: '.giveawayam | <jumlah>',
    example: '.giveawayam | 3',
    isOwner: false, // dicek manual di handler (admin ATAU owner)
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { settings, args, prefix }) {
    // 🔒 Cuma admin server atau owner bot yang boleh bikin giveaway
    const isOwner = m.author.id === settings.idOwner;
    const isAdmin = m.member?.permissions?.has(PermissionsBitField.Flags.Administrator);

    if (!isOwner && !isAdmin) {
        return m.reply('❌ *AKSES DITOLAK*\n\n> Fitur ini khusus admin server atau owner bot.');
    }

    // Terima format `| <jumlah>` maupun `<jumlah>` polos
    const raw = args.join(' ').replace(/^\|/, '').trim();
    const amount = parseInt(raw, 10);

    if (!amount || amount < 1) {
        return m.reply(`❌ Format salah, Sensei~\n\n> Gunakan: \`${prefix}giveawayam | <jumlah>\`\n> Contoh: \`${prefix}giveawayam | 3\``);
    }

    const stats = getStats();
    if (amount > stats.available) {
        return m.reply(
            `❌ Stok gak cukup, Sensei~\n\n` +
            `> Diminta: **${amount}** akun\n` +
            `> Stok tersedia: **${stats.available}** akun\n\n` +
            `Kurangin jumlahnya atau restock dulu pakai \`.addakun\`.`
        );
    }

    const embed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('🎉 Giveaway Alight Motion Premium')
        .setDescription('Klaim Akun nya sekarang dengan klick di button di bawah ini 👇')
        .addFields({ name: '🎉 Sudah Claim (0)', value: 'Belum ada yang claim' })
        .setFooter({ text: `Sisa slot: ${amount}` })
        .setTimestamp();

    // Kirim dulu dengan customId sementara, biar dapet messageId-nya buat dipakein ke customId asli
    const placeholderButton = new ButtonBuilder()
        .setCustomId('giveawayam_claim_pending')
        .setLabel('Akun Alight Motion')
        .setStyle(ButtonStyle.Success);

    const placeholderRow = new ActionRowBuilder().addComponents(placeholderButton);

    const sentMessage = await m.channel.send({ embeds: [embed], components: [placeholderRow] });

    createGiveaway({
        messageId: sentMessage.id,
        channelId: sentMessage.channel.id,
        guildId: m.guild.id,
        hostId: m.author.id,
        limit: amount,
    });

    const claimButton = new ButtonBuilder()
        .setCustomId(`giveawayam_claim_${sentMessage.id}`)
        .setLabel('Akun Alight Motion')
        .setStyle(ButtonStyle.Success);

    const finalRow = new ActionRowBuilder().addComponents(claimButton);

    await sentMessage.edit({ components: [finalRow] });

    // Rapihin, hapus pesan command-nya kalau bisa
    if (m.deletable) {
        await m.delete().catch(() => {});
    }
}