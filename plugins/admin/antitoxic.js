import { setToxicFilterEnabled, isToxicFilterEnabled } from '../../lib/toxicStore.js';

export const config = {
    name: 'antitoxic',
    alias: [],
    category: 'admin',
    description: 'Nyalain/matiin filter anti-toxic di server ini (khusus Administrator)',
    usage: '.antitoxic on / .antitoxic off',
    example: '.antitoxic off',
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

    if (sub === 'on') {
        setToxicFilterEnabled(m.guild.id, true);
        return m.reply('✅ Anti-toxic filter **dinyalain** di server ini.');
    }
    if (sub === 'off') {
        setToxicFilterEnabled(m.guild.id, false);
        return m.reply('🔕 Anti-toxic filter **dimatiin** di server ini.');
    }

    const status = isToxicFilterEnabled(m.guild.id) ? '✅ Nyala' : '🔕 Mati';
    return m.reply(
        `Status anti-toxic sekarang: **${status}**\n\n` +
        `Cara pakai:\n\`${prefix}antitoxic on\`\n\`${prefix}antitoxic off\``
    );
}