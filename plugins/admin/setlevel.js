import {
    getGuildLevelConfig,
    setLevelChannel,
    setLevelMessage,
    resetLevelConfig,
    DEFAULT_MESSAGE,
} from '../../lib/levelConfigStore.js';

export const config = {
    name: 'setlevel',
    alias: ['levelconfig'],
    category: 'admin',
    description: 'Atur channel tujuan & template pesan notifikasi naik level',
    usage: 'channel #channel | message <template> | info | reset',
    example: 'setlevel channel #level-up',
    isOwner: false,
    isPremium: false,
    isGroup: true, // cuma masuk akal di server
    isPrivate: false,
    cooldown: 3,
    isEnabled: true,
};

export async function handler(m, { args, prefix }) {
    // 🔒 Cuma admin (Manage Guild) atau owner bot yang boleh atur ini
    const isAdmin = m.member?.permissions.has('ManageGuild') ?? false;
    if (!isAdmin) {
        return m.reply('❌ Cuma admin server (izin *Manage Guild*) yang bisa atur setting level ini, Sensei~');
    }

    const sub = (args[0] || '').toLowerCase();

    // 📍 .setlevel channel #channel
    if (sub === 'channel') {
        const targetChannel = m.mentions.channels.first();
        if (!targetChannel) {
            return m.reply(`❌ Tag channel-nya dong. Contoh: \`${prefix}setlevel channel #level-up\``);
        }
        setLevelChannel(m.guild.id, targetChannel.id);
        return m.reply(`✅ Notifikasi naik level sekarang bakal dikirim ke ${targetChannel} biar gak ganggu obrolan lain~`);
    }

    // ✏️ .setlevel message <template>
    if (sub === 'message') {
        const template = args.slice(1).join(' ');
        if (!template) {
            return m.reply(
                `❌ Tulis template pesannya dong. Contoh:\n` +
                `\`${prefix}setlevel message Selamat {user} sudah level {level} yah!\`\n\n` +
                `Placeholder yang bisa dipakai: \`{user}\` (mention), \`{level}\` (angka level)`
            );
        }
        setLevelMessage(m.guild.id, template);
        return m.reply(`✅ Template pesan level-up berhasil diubah jadi:\n> ${template}`);
    }

    // ↩️ .setlevel reset
    if (sub === 'reset') {
        resetLevelConfig(m.guild.id);
        return m.reply('✅ Setting level-up server ini dibalikin ke default (kirim di channel chat biasa, pesan bawaan).');
    }

    // ℹ️ .setlevel / .setlevel info -> tampilin config sekarang
    const cfg = getGuildLevelConfig(m.guild.id);
    const channelText = cfg.channelId ? `<#${cfg.channelId}>` : '_(sama kayak channel chat biasa)_';

    return m.reply(
        `⚙️ **Setting Level Server Ini**\n\n` +
        `📍 Channel notif: ${channelText}\n` +
        `✏️ Template pesan: ${cfg.message}\n\n` +
        `Cara ubah:\n` +
        `\`${prefix}setlevel channel #channel\`\n` +
        `\`${prefix}setlevel message <template>\`\n` +
        `\`${prefix}setlevel reset\``
    );
}
