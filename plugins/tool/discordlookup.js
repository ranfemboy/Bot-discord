/**
 * Discord ID Lookup — Discord version
 * -----------------------------
 * Dikonversi dari discord_stalker.js (CLI readline pakai id.rappytv.com)
 * jadi command bot. Info yang ditampilkan cuma data PUBLIK yang emang bisa
 * diturunkan dari ID Discord itu sendiri (tanggal buat akun & badge) —
 * bukan data pribadi (nama asli/alamat/dsb).
 */
import { EmbedBuilder } from 'discord.js';
import { lookupDiscordId } from '../../lib/discordLookupApi.js';

export const config = {
    name: 'discordlookup',
    alias: ['dcinfo', 'cekdc'],
    category: 'tool',
    description: 'Cek info publik akun Discord dari ID (tanggal buat akun, badge)',
    usage: '.discordlookup <user_id>',
    example: '.discordlookup 123456789012345678',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true,
};

export async function handler(m, { args, prefix }) {
    const targetId = m.mentions.users.first()?.id || args[0];

    if (!targetId) {
        return m.reply(
            `🔍 **DISCORD LOOKUP**\n\n` +
            `> \`${prefix}discordlookup <user_id>\`\n` +
            `> \`${prefix}discordlookup @user\`\n\n` +
            `Contoh: \`${prefix}discordlookup 123456789012345678\``
        );
    }

    const loadingMsg = await m.reply('🔎 Mencari...');

    try {
        const data = await lookupDiscordId(targetId);

        if (data.status !== 'success') {
            return loadingMsg.edit('❌ Data gak ketemu, atau ID-nya salah.');
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🔍 Discord ID Lookup')
            .setThumbnail(data.avatar || null)
            .addFields(
                { name: '🆔 ID', value: `${data.id}`, inline: true },
                { name: '👤 Username', value: `${data.username}`, inline: true },
                { name: '📅 Dibuat', value: `${data.created}`, inline: false },
                { name: '🎖️ Badges', value: `${data.badges}`, inline: false },
            )
            .setFooter({ text: 'Data publik, diambil dari id.rappytv.com' })
            .setTimestamp();

        await loadingMsg.edit({ content: '', embeds: [embed] });
    } catch (error) {
        console.error('Discord Lookup Error:', error);
        await loadingMsg.edit('❌ *GAGAL*\n\n> ' + error.message);
    }
}
