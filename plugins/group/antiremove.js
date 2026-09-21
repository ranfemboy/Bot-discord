import { getGroup, setGroup } from '../../lib/groupStore.js';

const config = {
    name: 'antiremove',
    alias: ['antidelete', 'antihapus', 'ar'],
    category: 'group',
    description: 'Mengaktifkan/menonaktifkan anti hapus pesan di server',
    usage: '.antiremove <on/off>',
    example: '.antiremove on',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    isEnabled: true,
};

async function handler(m, { args }) {
    const action = (args[0] || '').toLowerCase();
    const group = getGroup(m.guild.id);

    if (!action) {
        const status = group.antiremove || 'off';
        const channelInfo = group.antiremoveChannel ? `<#${group.antiremoveChannel}>` : '_(belum diatur, pakai channel asal pesan)_';
        await m.reply(
            `🗑️ *AntiRemove*\n\n` +
            `> Status: *${status === 'on' ? '✅ Aktif' : '❌ Nonaktif'}*\n` +
            `> Channel Log: ${channelInfo}\n\n` +
            `> \`.antiremove on/off\`\n` +
            `> \`.antiremove channel #channel\``
        );
        return;
    }

    if (action === 'on') {
        setGroup(m.guild.id, { ...group, antiremove: 'on' });
        await m.react('✅').catch(() => {});
        await m.reply(`✅ *AntiRemove diaktifkan*\n> Pesan yang dihapus akan di-forward ulang.`);
        return;
    }

    if (action === 'off') {
        setGroup(m.guild.id, { ...group, antiremove: 'off' });
        await m.react('❌').catch(() => {});
        await m.reply(`❌ *AntiRemove dinonaktifkan*`);
        return;
    }

    if (action === 'channel' || action === 'set' || action === 'setchannel') {
        // Cari channel dari mention ATAU dari ID yang ditulis manual
        const mentioned = m.mentions?.channels?.first();
        const byId = args[1] ? m.guild.channels.cache.get(args[1].replace(/[<#>]/g, '')) : null;
        const channel = mentioned || byId;

        if (!channel) {
            await m.reply(
                `❌ Mention channel atau masukkan ID channel yang valid.\n` +
                `> Contoh: \`.antiremove channel #logs\``
            );
            return;
        }

        // PENTING: disimpan di key terpisah (antiremoveChannel), BUKAN dicampur ke key "antiremove"
        // supaya status on/off tidak ketimpa dan log tidak "nyasar" ke channel lain.
        setGroup(m.guild.id, { ...group, antiremoveChannel: channel.id });
        await m.react('✅').catch(() => {});
        await m.reply(`✅ *Channel log AntiRemove diatur ke* <#${channel.id}>`);
        return;
    }

    await m.reply(
        `❌ Gunakan:\n` +
        `> \`.antiremove on\` / \`.antiremove off\`\n` +
        `> \`.antiremove channel #channel\``
    );
}

export { config, handler };
