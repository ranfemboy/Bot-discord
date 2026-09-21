import { EmbedBuilder } from 'discord.js';
import { getUser } from '../../lib/economyStore.js';

const pluginConfig = {
    name: 'inventory',
    alias: ['inv', 'tas'],
    category: 'rpg',
    description: 'Melihat isi inventory kamu',
    usage: '.inventory [@user]',
    example: '.inventory',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

async function handler(m) {
    try {
        const target = m.mentions.users.first() || m.author;
        const data = getUser(m.guild.id, target.id);

        const pedangLine = data.weapons.pedang
            ? `🗡️ Pedang ${cap(data.weapons.pedang)}`
            : '🚫 Tidak ada';

        const pickaxeLine = data.weapons.pickaxe
            ? `⛏️ Pickaxe ${cap(data.weapons.pickaxe)}`
            : '🚫 Tidak ada';

        const busurLine = data.weapons.busur
            ? `🏹 Busur\n🎯 Anak Panah : ${data.arrows}x`
            : '🚫 Tidak ada';

        const potionLine = data.potions.heal > 0
            ? `🧪 Potion Heal : ${data.potions.heal}x`
            : '🚫 Tidak ada';

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('🎒 INVENTORY')
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: '⚔️ Senjata', value: pedangLine, inline: true },
                { name: '⛏️ Pickaxes', value: pickaxeLine, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: '🏹 Busur', value: busurLine, inline: true },
                { name: '🧪 Potion', value: potionLine, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: '💰 Uang', value: `${data.money.toLocaleString('id-ID')} 💵`, inline: true },
                { name: '❤️ HP', value: `${data.hp} / ${data.maxHp}`, inline: true }
            )
            .setFooter({ text: 'Ketik .shop buat belanja perlengkapan! 🛍️' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Inventory Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
