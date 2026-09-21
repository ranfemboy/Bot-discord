import { EmbedBuilder } from 'discord.js';
import { SHOP_ITEMS } from '../../lib/pokemonData.js';

const pluginConfig = {
    name: 'pokeshop',
    alias: ['tokopoke', 'shoppoke'],
    category: 'pokemon',
    description: 'Menampilkan katalog Pokeball & Potion di shop Pokemon',
    usage: '.pokeshop',
    example: '.pokeshop',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

function fmt(n) {
    return `${n.toLocaleString('id-ID')} 🪙`;
}

async function handler(m) {
    try {
        const balls = Object.values(SHOP_ITEMS).filter((i) => i.type === 'ball');
        const potions = Object.values(SHOP_ITEMS).filter((i) => i.type === 'potion');

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('🛍️ POKE SHOP')
            .setThumbnail(m.author.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                {
                    name: '🎯 Pokeball',
                    value: balls.map((b) => `${b.emoji} **${b.label}** — ${fmt(b.price)} _(catch x${b.catchMult})_`).join('\n'),
                    inline: false,
                },
                {
                    name: '🧪 Potion',
                    value: potions.map((p) => `${p.emoji} **${p.label}** — ${fmt(p.price)} _(heal +${p.heal} HP)_`).join('\n'),
                    inline: false,
                },
                {
                    name: '📖 Cara Beli',
                    value:
                        '`.buypoke nama barang | jumlah`\n' +
                        'Contoh: `.buypoke great ball | 3`\n' +
                        '_Maksimal 20 item per transaksi._',
                    inline: false,
                }
            )
            .setFooter({ text: 'Kumpulkan Coin lewat .eksplor & .duel!' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Pokeshop Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
