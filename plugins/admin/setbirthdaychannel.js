import { setBirthdayChannel, getBirthdayConfig } from '../../lib/birthdayConfigStore.js';

const pluginConfig = {
    name: 'setbirthdaychannel',
    alias: ['aturchannelultah', 'birthdaychannel'],
    category: 'admin',
    description: 'Atur channel buat notif ulang tahun otomatis (khusus Administrator)',
    usage: '.setbirthdaychannel <#channel>',
    example: '.setbirthdaychannel #general',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { prefix }) {
    if (!m.member.permissions.has('Administrator')) {
        return m.reply('❌ Kamu butuh permission **Administrator** buat pakai command ini.');
    }

    const channel = m.mentions.channels.first();
    if (!channel) {
        const current = getBirthdayConfig(m.guild.id);
        return m.reply(
            `🎂 *SET BIRTHDAY CHANNEL*\n\n` +
                `Channel notif ulang tahun sekarang: ${current.channelId ? `<#${current.channelId}>` : '_(belum di-set)_'}\n\n` +
                `Format: \`${prefix}setbirthdaychannel #channel\`\n` +
                `*Contoh:* \`${prefix}setbirthdaychannel #general\`\n\n` +
                `⚠️ Pastikan bot punya permission **Mention Everyone** di channel itu biar tag \`@everyone\` beneran nge-ping.`
        );
    }

    setBirthdayChannel(m.guild.id, channel.id);

    return m.reply(
        `✅ Channel notif ulang tahun di-set ke ${channel}!\n` +
            `Mulai sekarang, member yang ulang tahun bakal di-tag otomatis jam **00:00 WIB** di channel itu~ 🎉`
    );
}

export { pluginConfig as config, handler };