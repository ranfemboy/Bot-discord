/**
 * Voice Guard — Leave
 * -----------------------------
 * Suruh bot keluar dari voice channel server ini.
 */
import { getVoiceConnection } from '@discordjs/voice';
import { clearGuildData } from '../../lib/voiceGuardStore.js';

export const config = {
    name: 'leave',
    alias: ['vleave', 'leavevc', 'stop'],
    category: 'owner',
    description: 'Bot keluar dari voice channel server ini',
    usage: '.leave',
    example: '.leave',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

export async function handler(m) {
    if (!m.guild) {
        return m.reply('❌ Fitur ini cuma bisa dipakai di dalam server.');
    }

    const connection = getVoiceConnection(m.guild.id);
    if (!connection) {
        return m.reply('❌ Bot memang lagi gak di voice channel manapun di server ini.');
    }

    clearGuildData(m.guild.id);
    connection.destroy();

    await m.reply('✅ Bot keluar dari voice channel.');
}
