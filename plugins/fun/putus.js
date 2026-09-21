/**
 * Putus — Discord version
 * -----------------------------
 * Melengkapi couple system (tembak/terima/tolak/pacarku). Mengakhiri
 * hubungan pacaran yang lagi berjalan — data pasangan di KEDUA belah
 * pihak direset bareng biar gak ada yang "nyangkut" sepihak.
 */
import { EmbedBuilder } from 'discord.js';
import { getUser, setUser } from '../../lib/coupleStore.js';

export const config = {
    name: 'putus',
    alias: ['breakup', 'cerai'],
    category: 'fun',
    description: 'Mengakhiri hubungan pacaran dengan pasangan kamu',
    usage: '.putus',
    example: '.putus',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
};

const breakupQuotes = [
    'Semoga kalian sama-sama nemu yang lebih baik 🕊️',
    'Gapapa, patah hati itu proses buat belajar dewasa 🌱',
    'Kadang dua orang emang ditakdirkan cuma buat singgah, bukan menetap 🍂',
    'Move on itu berat, tapi kamu pasti bisa! 💪',
    'Yang penting jangan saling benci ya, sudah cukup sampai di sini 🤍',
];

export async function handler(m) {
    const guildId = m.guild.id;
    const me = getUser(guildId, m.author.id);

    if (!me.pasangan) {
        return m.reply('❌ Kamu belum punya pasangan buat diputusin, Sensei~');
    }

    const partnerId = me.pasangan;
    const partnerData = getUser(guildId, partnerId);

    // 💔 Reset data di kedua belah pihak sekaligus
    me.pasangan = null;
    me.jadiPacar = null;
    me.tembakTarget = null;
    me.putusCount = (me.putusCount || 0) + 1;

    if (partnerData.pasangan === m.author.id) {
        partnerData.pasangan = null;
        partnerData.jadiPacar = null;
        partnerData.tembakTarget = null;
        partnerData.putusCount = (partnerData.putusCount || 0) + 1;
    }

    setUser(guildId, m.author.id, me);
    setUser(guildId, partnerId, partnerData);

    const quote = breakupQuotes[Math.floor(Math.random() * breakupQuotes.length)];

    await m.react('💔').catch(() => {});

    const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle('💔 PUTUS')
        .setDescription(
            `<@${m.author.id}> dan <@${partnerId}> telah mengakhiri hubungan mereka.\n\n` +
            `${quote}`
        );

    await m.reply({ embeds: [embed] });
}
