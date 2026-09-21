import { AttachmentBuilder } from 'discord.js';
import { renderShipCard } from '../../lib/canvas/shipCanvas.js';
import { hashPercent, getShipLabel } from '../../lib/shipUtil.js';

const pluginConfig = {
    name: 'ship',
    alias: ['jodohin'],
    category: 'fun',
    description: 'Ship 2 user, tampilin persentase kecocokan pake gambar canvas',
    usage: '.ship @user / .ship @user1 @user2',
    example: '.ship @Fana @Budi',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m) {
    try {
        const mentions = [...m.mentions.users.values()];
        let userA, userB;

        if (mentions.length >= 2) {
            [userA, userB] = mentions;
        } else if (mentions.length === 1) {
            userA = m.author;
            userB = mentions[0];
        } else {
            return m.reply('❌ Tag minimal 1 user! Contoh: `.ship @Fana` atau `.ship @A @B`');
        }

        if (userA.id === userB.id) return m.reply('❌ Gak bisa ship 1 orang sama diri sendiri 😅');
        if (userA.bot || userB.bot) return m.reply('❌ Gak bisa ship sama bot wkwk');

        const percent = hashPercent(userA.id, userB.id);
        const label = getShipLabel(percent);

        const buffer = await renderShipCard({
            userA: { username: userA.username, avatarURL: userA.displayAvatarURL({ extension: 'png', size: 256 }) },
            userB: { username: userB.username, avatarURL: userB.displayAvatarURL({ extension: 'png', size: 256 }) },
            percent,
            label,
        });

        const attachment = new AttachmentBuilder(buffer, { name: 'ship.png' });
        await m.reply({ content: `💘 **${userA.username}** x **${userB.username}**`, files: [attachment] });
    } catch (error) {
        console.error('Ship Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
