import { EmbedBuilder } from 'discord.js';
import { addPremium } from '../../lib/premiumStore.js';

export const config = {
    name: 'addprem',
    alias: ['addpremium'],
    category: 'owner',
    description: 'Menambahkan status premium ke user tertentu (khusus owner)',
    usage: '.addprem @user <jumlah_hari|lifetime>',
    example: '.addprem @Budi 30  atau  .addprem @Budi lifetime',
    isOwner: true,
    isStaffAllowed: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { args }) {
    try {
        const target = m.mentions.users.first();
        if (!target) {
            return m.reply('❌ Mention user yang mau dijadiin premium!\n\n> `.addprem @user <jumlah_hari|lifetime>`');
        }

        const durasiArg = args.find((a) => a.toLowerCase() === 'lifetime' || /^\d+$/.test(a));
        if (!durasiArg) {
            return m.reply('❌ Masukkan durasinya!\n\n> `.addprem @user 30` (30 hari)\n> `.addprem @user lifetime` (permanen)');
        }

        const isLifetime = durasiArg.toLowerCase() === 'lifetime';
        if (!isLifetime && parseInt(durasiArg, 10) <= 0) {
            return m.reply('❌ Jumlah hari harus lebih dari 0.');
        }

        const entry = addPremium(target.id, isLifetime ? 'lifetime' : durasiArg, m.author.id);

        const durasiText = entry.lifetime
            ? '♾️ Lifetime (Permanen)'
            : `⏳ Sampai ${new Date(entry.expiresAt).toLocaleString('id-ID')}`;

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('⭐ PREMIUM DITAMBAHKAN')
            .addFields(
                { name: '👤 User', value: `<@${target.id}>`, inline: true },
                { name: '📅 Berlaku Sampai', value: durasiText, inline: true },
            )
            .setFooter({ text: `Ditambahkan oleh ${m.author.username}` })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('AddPrem Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}