/**
 * Terima — Discord version
 * -----------------------------
 * Dikonversi dari terima.js (WA). Cara nyari siapa yang nembak:
 * 1) reply ke pesan tembakan lalu mention orangnya, ATAU
 * 2) mention langsung siapa yang nembak, ATAU
 * 3) tanpa argumen -> otomatis ambil dari sesi tembakan aktif di channel ini.
 */
import { getUser, setUser, findSessionForTarget, deleteSession } from '../../lib/coupleStore.js';

export const config = {
    name: 'terima',
    alias: ['accept', 'yes'],
    category: 'fun',
    description: 'Menerima tembakan dari seseorang',
    usage: '.terima [@user]',
    example: '.terima',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

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
            `> Balas notifikasi tembakan dengan \`${prefix}terima\`\n` +
            `> Atau \`${prefix}terima @user\``
        );
    }

    if (shooterId === m.author.id) {
        return m.reply('❌ **GAGAL**\n\n> Tidak bisa menerima diri sendiri!');
    }

    const shooterData = getUser(guildId, shooterId);
    const myData = getUser(guildId, m.author.id);

    if (shooterData.pasangan !== m.author.id && shooterData.tembakTarget !== m.author.id) {
        return m.reply(`❌ **TIDAK MENEMBAK**\n\n> <@${shooterId}> tidak sedang menembakmu`);
    }

    shooterData.pasangan = m.author.id;
    shooterData.jadiPacar = Date.now();
    shooterData.tembakTarget = null;
    shooterData.terimaCount = (shooterData.terimaCount || 0) + 1;

    myData.pasangan = shooterId;
    myData.jadiPacar = Date.now();

    setUser(guildId, shooterId, shooterData);
    setUser(guildId, m.author.id, myData);
    deleteSession(guildId, m.channel.id, m.author.id);

    await m.react('💕').catch(() => {});
    await m.reply(
        `💕 **CIE CIE DITERIMA!**\n\n` +
        `<@${m.author.id}> dan <@${shooterId}> resmi pacaran!\n\n` +
        `Semoga langgeng dan bahagia 💍`
    );
}
