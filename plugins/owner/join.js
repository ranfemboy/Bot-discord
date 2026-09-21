/**
 * Voice Guard — Join
 * -----------------------------
 * Suruh bot masuk ke voice channel tempat user berada, terus diam
 * di situ aja (gak muter audio apa-apa). Dipakai buat "jagain" jam
 * voice tetep jalan.
 */
import {
    joinVoiceChannel,
    getVoiceConnection,
    VoiceConnectionStatus,
    entersState,
} from '@discordjs/voice';
import { setGuildData, clearGuildData } from '../../lib/voiceGuardStore.js';

export const config = {
    name: 'join',
    alias: ['vjoin', 'joinvc'],
    category: 'owner',
    description: 'Bot masuk ke voice channel kamu dan standby diam di situ',
    usage: '.join',
    example: '.join',
    isOwner: true, 
    isPremium: false,
    isGroup: true, // wajib di server, gak bisa lewat DM
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m) {
    // 🛡️ Kalau bot cuma di-User-Install (belum di-invite penuh ke server ini
    // lewat OAuth2 scope bot), Discord gak ngasih data member/voice yang
    // lengkap — makanya harus dicek manual biar gak crash.
    if (!m.guild || !m.member) {
        return m.reply(
            '❌ Fitur ini butuh bot beneran ke-invite ke server (Guild Install), bukan cuma di-add ke akun pribadi. ' +
            'Invite bot pakai link OAuth2 (scope `bot` + `applications.commands`) ke server ini dulu ya.'
        );
    }

    const voiceChannel = m.member.voice?.channel;
    if (!voiceChannel) {
        return m.reply('❌ Kamu harus masuk voice channel dulu sebelum pakai command ini.');
    }

    const existing = getVoiceConnection(m.guild.id);
    if (existing) {
        return m.reply('ℹ️ Bot sudah standby di voice channel server ini.');
    }

    try {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: m.guild.id,
            adapterCreator: m.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false,
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

        setGuildData(m.guild.id, { timeout: null, leaveAt: null, channelId: voiceChannel.id });

        // Kalau koneksi putus/di-disconnect paksa (misal di-kick manual dari VC),
        // bersihin data biar gak nyangkut timer basi.
        connection.on(VoiceConnectionStatus.Disconnected, () => {
            clearGuildData(m.guild.id);
        });

        await m.reply(
            `✅ Bot berhasil masuk ke **${voiceChannel.name}** dan akan standby di sana.\n` +
            `Pakai \`${m.content.startsWith('/') ? '/settime' : '.settime'} jam/hari/bulan <jumlah>\` kalau mau atur durasi standby otomatis.`
        );
    } catch (error) {
        console.error('Voice Guard Join Error:', error);
        await m.reply('❌ *GAGAL MASUK VOICE*\n\n> ' + error.message);
    }
}
