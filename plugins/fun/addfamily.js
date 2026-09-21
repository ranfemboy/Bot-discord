import { resolveRole, ROLE_LABEL, findRelationRole, isSlotTaken, createFamilyRequest, buildFamilyRequestMessage } from '../../lib/familyStore.js';

const pluginConfig = {
    name: 'addfamily',
    alias: [],
    category: 'fun',
    description: 'Menambahkan user lain ke family tree kamu (butuh konfirmasi tombol)',
    usage: '.addfamily @user | role',
    example: '.addfamily @Budi | kakak',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m, { args }) {
    try {
        const target = m.mentions.users.first();
        if (!target) return m.reply('❌ Mention user-nya! Contoh: `.addfamily @Budi | kakak`');
        if (target.bot) return m.reply('❌ Gak bisa nambahin bot ke family tree.');
        if (target.id === m.author.id) return m.reply('❌ Gak bisa nambahin diri sendiri 😅');

        const raw = args.join(' ');
        if (!raw.includes('|')) {
            return m.reply(
                '❌ Format salah! Gunakan: `.addfamily @user | role`\n\n' +
                'Role yang tersedia: **Papa, Mama, Kakak, Adik, Anak**'
            );
        }

        const rolePart = raw.split('|')[1]?.trim() || '';
        const role = resolveRole(rolePart);
        if (!role) {
            return m.reply('❌ Role gak valid! Pilih salah satu: **Papa, Mama, Kakak, Adik, Anak**');
        }

        if (findRelationRole(m.author.id, target.id)) {
            return m.reply(`❌ Kamu udah punya relasi family sama ${target}. Hapus dulu lewat \`.delfamily @user\` kalau mau ganti.`);
        }

        if (isSlotTaken(m.author.id, role, target.id)) {
            return m.reply(`❌ Slot **${ROLE_LABEL[role]}** kamu udah keisi orang lain! Hapus dulu lewat \`.delfamily\`.`);
        }

        const id = createFamilyRequest(m.guild.id, m.author.id, target.id, role);
        await m.reply(buildFamilyRequestMessage(id, m.author, target, role));
    } catch (error) {
        console.error('Addfamily Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
