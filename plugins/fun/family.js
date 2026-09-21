import { AttachmentBuilder } from 'discord.js';
import { getFamily } from '../../lib/familyStore.js';
import { renderFamilyTree } from '../../lib/canvas/familyTreeCanvas.js';

const pluginConfig = {
    name: 'family',
    alias: ['familytree', 'keluarga'],
    category: 'fun',
    description: 'Menampilkan gambar family tree kamu (atau orang lain)',
    usage: '.family [@user]',
    example: '.family / .family @Budi',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

// 🔧 Ubah bentuk data familyStore ({papa, mama, kakak:[], adik:[], anak:[]}) jadi array flat {partnerId, role}
function flattenFamily(fam) {
    const list = [];
    if (fam.papa) list.push({ partnerId: fam.papa, role: 'papa' });
    if (fam.mama) list.push({ partnerId: fam.mama, role: 'mama' });
    fam.kakak.forEach((id) => list.push({ partnerId: id, role: 'kakak' }));
    fam.adik.forEach((id) => list.push({ partnerId: id, role: 'adik' }));
    fam.anak.forEach((id) => list.push({ partnerId: id, role: 'anak' }));
    return list;
}

async function handler(m) {
    try {
        const target = m.mentions.users.first() || m.author;
        const flat = flattenFamily(getFamily(target.id));

        if (!flat.length) {
            return m.reply(
                target.id === m.author.id
                    ? '📭 Family tree kamu masih kosong! Pakai `.addfamily @user | role` buat mulai.\n' +
                      '💡 Inget, orang yang kamu tag harus klik tombol **Terima** dulu di pesan konfirmasinya — kalau belum diklik, relasinya belum kesimpen.'
                    : `📭 ${target} belum punya family tree.`
            );
        }

        const enriched = [];
        for (const rel of flat) {
            const user = await m.client.users.fetch(rel.partnerId).catch(() => null);
            if (!user) continue;
            enriched.push({
                username: user.username,
                avatarURL: user.displayAvatarURL({ extension: 'png', size: 256 }),
                role: rel.role,
            });
        }

        const buffer = await renderFamilyTree({
            center: { username: target.username, avatarURL: target.displayAvatarURL({ extension: 'png', size: 256 }) },
            members: enriched,
        });

        const attachment = new AttachmentBuilder(buffer, { name: 'family.png' });
        await m.reply({ content: `🌳 Family Tree **${target.username}**`, files: [attachment] });
    } catch (error) {
        console.error('Family Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
