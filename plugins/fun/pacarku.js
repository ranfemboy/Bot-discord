/**
 * Pacarku — Discord version
 * -----------------------------
 * Fitur baru: cek status pacaran sendiri. Datanya udah ada semua di
 * lib/coupleStore.js (field `pasangan` & `jadiPacar`, diisi lewat
 * .tembak / .terima).
 */
import { EmbedBuilder } from 'discord.js';
import { getUser } from '../../lib/coupleStore.js';

export const config = {
    name: 'pacarku',
    alias: ['mypartner', 'partnerku'],
    category: 'fun',
    description: 'Cek siapa pacar kamu sekarang & sudah berapa lama',
    usage: '.pacarku',
    example: '.pacarku',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

function formatDurasi(ms) {
    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days} hari ${hours} jam`;
    if (hours > 0) return `${hours} jam ${minutes} menit`;
    return `${minutes} menit`;
}

export async function handler(m, { prefix }) {
    const guildId = m.guild.id;
    const me = getUser(guildId, m.author.id);

    if (!me.pasangan) {
        return m.reply(
            `💔 **JOMBLO TERDETEKSI**\n\n` +
            `Kamu belum punya pasangan di server ini.\n` +
            `Yuk cari gebetan pakai \`${prefix}tembak @user\`!`
        );
    }

    // Jaga-jaga kalau data pasangannya udah gak konsisten (mis. udah putus sepihak)
    const partnerData = getUser(guildId, me.pasangan);
    if (partnerData.pasangan !== m.author.id) {
        return m.reply(
            `💔 **JOMBLO TERDETEKSI**\n\n` +
            `Kamu belum punya pasangan di server ini.\n` +
            `Yuk cari gebetan pakai \`${prefix}tembak @user\`!`
        );
    }

    const jadianTimestamp = me.jadiPacar ? Math.floor(me.jadiPacar / 1000) : null;
    const durasi = me.jadiPacar ? formatDurasi(Date.now() - me.jadiPacar) : 'Tidak diketahui';

    const embed = new EmbedBuilder()
        .setColor('#FF6B9D')
        .setTitle('💑 PACARKU')
        .setDescription(
            `Pacar kamu adalah <@${me.pasangan}>\n` +
            `Moga terus langgeng yah 💕\n\n` +
            `📅 **Tanggal jadian:** ${jadianTimestamp ? `<t:${jadianTimestamp}:D>` : 'Tidak diketahui'}\n` +
            `⏳ **Sudah pacaran selama:** ${durasi}`
        )
        .setThumbnail(m.author.displayAvatarURL());

    await m.reply({ embeds: [embed] });
}
