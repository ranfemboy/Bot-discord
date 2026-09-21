import { findRelationRole, removeRelation, ROLE_LABEL } from '../../lib/familyStore.js';

const pluginConfig = {
    name: 'delfamily',
    alias: [],
    category: 'fun',
    description: 'Menghapus 1 relasi family kamu sama user lain',
    usage: '.delfamily @user',
    example: '.delfamily @Budi',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    isEnabled: true,
};

async function handler(m) {
    try {
        const target = m.mentions.users.first();
        if (!target) return m.reply('❌ Mention user yang mau dihapus dari family tree kamu!');

        const role = findRelationRole(m.author.id, target.id);
        if (!role) return m.reply(`❌ Kamu gak punya relasi family sama ${target}.`);

        removeRelation(m.author.id, target.id);
        await m.reply(`✅ Relasi **${ROLE_LABEL[role]}** sama ${target} berhasil dihapus.`);
    } catch (error) {
        console.error('Delfamily Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
