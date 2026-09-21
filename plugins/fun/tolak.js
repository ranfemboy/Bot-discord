/**
 * Tolak — Discord version
 * -----------------------------
 * Dikonversi dari tolak.js (WA). Logic sama persis kayak terima.js,
 * cuma efeknya nolak alih-alih jadian.
 */
import { getUser, setUser, findSessionForTarget, deleteSession } from '../../lib/coupleStore.js';

export const config = {
    name: 'tolak',
    alias: ['reject', 'no'],
    category: 'fun',
    description: 'Menolak tembakan dari seseorang',
    usage: '.tolak [@user]',
    example: '.tolak',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

const rejectionQuotes = [
    'Sabar ya, yang lebih baik pasti datang! 🌟',
    'Belum jodoh bukan berarti tidak ada jodoh 💪',
    'Move on! Banyak ikan di laut! 🐟',
    'Yang sabar ya, cinta sejati akan datang 💕',
    'Jangan patah semangat, tetap semangat! 🔥',
    'Penolakan adalah awal dari keberhasilan 💪',
    'Masih banyak kesempatan di luar sana! ✨',
    'Yakin masih ada yang lebih cocok buat kamu! 🌈',
];

export async function handler(m, { prefix }) {
    const guildId = m.guild.id;
    let shooterId = m.mentions.users.first()?.id || null;

    if (!shooterId) {
        const session = findSessionForTarget(guildId, m.channel.id, m.author.id);
        if (session) shooterId = session.shooterId;
    }

    if (!shooterId) {
        return m.reply(
            `⚠️ **CARA PAKAI**\n\n` +
            `> Balas notifikasi tembakan dengan \`${prefix}tolak\`\n` +
            `> Atau \`${prefix}tolak @user\``
        );
    }

    if (shooterId === m.author.id) {
        return m.reply('❌ **GAGAL**\n\n> Tidak bisa menolak diri sendiri!');
    }

    const shooterData = getUser(guildId, shooterId);
    const myData = getUser(guildId, m.author.id);

    if (shooterData.pasangan !== m.author.id && shooterData.tembakTarget !== m.author.id) {
        return m.reply(`❌ **TIDAK MENEMBAK**\n\n> <@${shooterId}> tidak sedang menembakmu`);
    }

    shooterData.pasangan = null;
    shooterData.tembakTarget = null;
    myData.pasangan = null;
    shooterData.ditolakCount = (shooterData.ditolakCount || 0) + 1;

    setUser(guildId, shooterId, shooterData);
    setUser(guildId, m.author.id, myData);
    deleteSession(guildId, m.channel.id, m.author.id);

    const quote = rejectionQuotes[Math.floor(Math.random() * rejectionQuotes.length)];

    await m.react('💔').catch(() => {});
    await m.reply(
        `💔 **WADUH, YANG SABAR YAK**\n\n` +
        `<@${m.author.id}> menolak <@${shooterId}> sebagai pacarnya\n\n` +
        `${quote}`
    );
}
