import {
    getAllowedChannels,
    getBlockedChannels,
    addAllowed,
    removeAllowed,
    addBlocked,
    removeBlocked,
    resetChannels,
} from '../../lib/botChannelStore.js';

export const config = {
    name: 'setchannel',
    alias: ['channelbot', 'aturchannel'],
    category: 'admin',
    description: 'Atur channel mana yang boleh/gak boleh dipakai buat command bot (khusus Administrator)',
    usage:
        '.setchannel allow <#channel> — bot CUMA bisa dipake di channel yang di-allow\n' +
        '.setchannel unallow <#channel>\n' +
        '.setchannel block <#channel> — bot GAK BISA dipake di channel ini (channel lain tetep bebas)\n' +
        '.setchannel unblock <#channel>\n' +
        '.setchannel list\n' +
        '.setchannel reset',
    example: '.setchannel block #yapping',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { args, prefix }) {
    if (!m.member.permissions.has('Administrator')) {
        return m.reply('❌ Kamu butuh permission **Administrator** buat pakai command ini.');
    }

    const sub = args[0]?.toLowerCase();

    if (sub === 'list') {
        const allowed = getAllowedChannels(m.guild.id);
        const blocked = getBlockedChannels(m.guild.id);

        const allowedText = allowed.length ? allowed.map((id) => `<#${id}>`).join('\n') : '_(kosong — bebas semua channel, kecuali yang di-block)_';
        const blockedText = blocked.length ? blocked.map((id) => `<#${id}>`).join('\n') : '_(kosong — gak ada yang di-block)_';

        return m.reply(
            `📋 **Pengaturan channel bot:**\n\n` +
            `✅ **Allow list** (kalau diisi, cuma channel ini yang bisa):\n${allowedText}\n\n` +
            `🚫 **Block list** (channel ini selalu ditolak):\n${blockedText}`
        );
    }

    if (sub === 'reset') {
        resetChannels(m.guild.id);
        return m.reply('🔓 Semua batasan dihapus — bot bebas dipakai di semua channel lagi.');
    }

    if (['allow', 'unallow', 'block', 'unblock'].includes(sub)) {
        const channel = m.mentions.channels.first();
        if (!channel) {
            return m.reply(`⚠️ Mention channel-nya ya.\n\n> \`${prefix}setchannel ${sub} #channel\``);
        }

        if (sub === 'allow') {
            addAllowed(m.guild.id, channel.id);
            return m.reply(`✅ ${channel} ditambahin ke **allow list**.\n> ⚠️ Inget, begitu ada 1 channel di-allow, bot CUMA bisa dipake di channel-channel yang di-allow doang.`);
        }
        if (sub === 'unallow') {
            removeAllowed(m.guild.id, channel.id);
            return m.reply(`🗑️ ${channel} dihapus dari allow list.`);
        }
        if (sub === 'block') {
            addBlocked(m.guild.id, channel.id);
            return m.reply(`🚫 ${channel} di-block — bot gak bisa dipake di situ lagi, channel lain tetep normal.`);
        }
        if (sub === 'unblock') {
            removeBlocked(m.guild.id, channel.id);
            return m.reply(`✅ ${channel} di-unblock, bot bisa dipake lagi di situ.`);
        }
    }

    return m.reply(
        `⚠️ Format salah, Sensei~\n\n` +
        `**Cara pakai:**\n` +
        `\`${prefix}setchannel allow #channel\` — whitelist mode\n` +
        `\`${prefix}setchannel unallow #channel\`\n` +
        `\`${prefix}setchannel block #channel\` — blacklist mode (yang Sensei mau ini)\n` +
        `\`${prefix}setchannel unblock #channel\`\n` +
        `\`${prefix}setchannel list\`\n` +
        `\`${prefix}setchannel reset\``
    );
}
