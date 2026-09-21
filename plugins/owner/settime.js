/**
 * Voice Guard — Settime
 * -----------------------------
 * Atur berapa lama bot standby di voice sebelum otomatis keluar
 * sendiri. Satuan: jam / hari / bulan.
 */
import { getVoiceConnection } from '@discordjs/voice';
import { getGuildData, setGuildData, clearGuildData, toMs, formatSisaWaktu } from '../../lib/voiceGuardStore.js';

export const config = {
    name: 'settime',
    alias: ['vsettime', 'settimevc'],
    category: 'owner',
    description: 'Atur durasi bot standby di voice sebelum otomatis keluar (jam/hari/bulan)',
    usage: '.settime <jam/hari/bulan> <jumlah>',
    example: '.settime jam 5',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

const SATUAN_VALID = ['jam', 'hari', 'bulan'];

export async function handler(m, { args }) {
    if (!m.guild || !m.member) {
        return m.reply(
            '❌ Fitur ini butuh bot beneran ke-invite ke server (Guild Install), bukan cuma di-add ke akun pribadi.'
        );
    }

    const connection = getVoiceConnection(m.guild.id);
    const data = getGuildData(m.guild.id);

    if (!connection || !data) {
        return m.reply(`❌ Bot belum standby di voice channel manapun. Pakai \`${m.content.startsWith('/') ? '/join' : '.join'}\` dulu ya.`);
    }

    const satuan = (args?.[0] || '').toLowerCase();
    const jumlah = parseInt(args?.[1], 10);

    if (!SATUAN_VALID.includes(satuan) || !Number.isFinite(jumlah) || jumlah <= 0) {
        return m.reply(
            `❌ Format salah.\n\n` +
            `Contoh: \`${m.content.startsWith('/') ? '/settime' : '.settime'} jam 5\` (satuan: jam / hari / bulan)`
        );
    }

    const ms = toMs(satuan, jumlah);

    clearGuildData(m.guild.id); // batalin timer lama kalau ada, sebelum pasang yang baru

    const timeout = setTimeout(() => {
        const conn = getVoiceConnection(m.guild.id);
        if (conn) conn.destroy();
        clearGuildData(m.guild.id);
    }, ms);

    setGuildData(m.guild.id, { ...data, timeout, leaveAt: Date.now() + ms });

    await m.reply(
        `✅ Oke, bot akan standby selama **${jumlah} ${satuan}** lagi.\n` +
        `Otomatis keluar sekitar **${formatSisaWaktu(ms)}** dari sekarang.`
    );
}
