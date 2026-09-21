import { setLevelRole, removeLevelRole, getGuildLevelRoles } from '../../lib/levelRoleStore.js';

export const config = {
    name: 'setrolelevel',
    alias: ['rolelevel', 'levelrole'],
    category: 'admin',
    description: 'Atur role reward otomatis pas member nyampe level tertentu (khusus Manage Guild)',
    usage: '.setrolelevel <level> @role | remove <level> | list',
    example: '.setrolelevel 10 @Member Aktif',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { args, prefix }) {
    const isAdmin = m.member?.permissions.has('ManageGuild') ?? false;
    if (!isAdmin) {
        return m.reply('❌ Cuma admin server (izin *Manage Guild*) yang bisa atur role level ini, Sensei~');
    }

    const sub = (args[0] || '').toLowerCase();

    if (sub === 'list') {
        const roles = getGuildLevelRoles(m.guild.id);
        if (roles.length === 0) {
            return m.reply(`ℹ️ Belum ada role reward yang di-setting. Contoh: \`${prefix}setrolelevel 10 @Member\``);
        }
        const list = roles.map((r) => `• Level **${r.level}** → <@&${r.roleId}>`).join('\n');
        return m.reply(`🎁 **Role Reward per Level**\n\n${list}`);
    }

    if (sub === 'remove') {
        const level = parseInt(args[1], 10);
        if (!Number.isInteger(level)) {
            return m.reply(`❌ Sebutin level-nya dong. Contoh: \`${prefix}setrolelevel remove 10\``);
        }
        const success = removeLevelRole(m.guild.id, level);
        return m.reply(success ? `✅ Role reward buat level ${level} berhasil dihapus.` : `ℹ️ Belum ada role reward buat level ${level}.`);
    }

    const level = parseInt(args[0], 10);
    const role = m.mentions.roles.first();

    if (!Number.isInteger(level) || !role) {
        return m.reply(
            `🎁 *SET ROLE LEVEL*\n\n` +
                `Format: \`${prefix}setrolelevel <level> @role\`\n\n` +
                `*Contoh:*\n` +
                `\`${prefix}setrolelevel 10 @Member Aktif\` — kasih role pas nyampe level 10\n` +
                `\`${prefix}setrolelevel remove 10\` — hapus reward level 10\n` +
                `\`${prefix}setrolelevel list\` — lihat semua reward yang udah di-setting`
        );
    }

    if (level < 1) {
        return m.reply('❌ Level minimal 1.');
    }

    if (role.managed) {
        return m.reply('❌ Role itu dikelola otomatis oleh integrasi/bot lain, gak bisa dipakai buat reward manual.');
    }

    if (role.position >= m.guild.members.me.roles.highest.position) {
        return m.reply('❌ Role itu posisinya lebih tinggi/sejajar dari role bot ini, jadi bot gak bisa assign role itu. Naikkan posisi role bot dulu ya.');
    }

    setLevelRole(m.guild.id, level, role.id);

    return m.reply(`✅ Sip! Member yang nyampe **level ${level}** bakal otomatis dikasih role ${role}~ 🎉`);
}