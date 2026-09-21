import { EmbedBuilder } from 'discord.js';
import { SHOP_ITEMS } from '../../lib/rpgData.js';

const pluginConfig = {
    name: 'shop',
    alias: ['toko'],
    category: 'rpg',
    description: 'Menampilkan daftar barang yang bisa dibeli',
    usage: '.shop',
    example: '.shop',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

function fmt(n) {
    return `${n.toLocaleString('id-ID')} 💵`;
}

async function handler(m) {
    try {
        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🛍️ SHOP')
            .setThumbnail(m.author.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                {
                    name: '🗡️ Pedang',
                    value:
                        `🪵 Kayu : ${fmt(SHOP_ITEMS['pedang kayu'].price)}\n` +
                        `⚙️ Besi : ${fmt(SHOP_ITEMS['pedang besi'].price)}\n` +
                        `🥇 Emas : ${fmt(SHOP_ITEMS['pedang emas'].price)}\n` +
                        `💎 Berlian : ${fmt(SHOP_ITEMS['pedang berlian'].price)}`,
                    inline: true,
                },
                {
                    name: '🏹 Busur',
                    value:
                        `🏹 Busur : ${fmt(SHOP_ITEMS['busur'].price)}\n` +
                        `🎯 Anak Panah : ${fmt(SHOP_ITEMS['anak panah'].price)} /pcs`,
                    inline: true,
                },
                {
                    name: '⛏️ Pickaxe',
                    value:
                        `🪵 Kayu : ${fmt(SHOP_ITEMS['pickaxe kayu'].price)}\n` +
                        `⚙️ Besi : ${fmt(SHOP_ITEMS['pickaxe besi'].price)}\n` +
                        `🥇 Emas : ${fmt(SHOP_ITEMS['pickaxe emas'].price)}\n` +
                        `💎 Berlian : ${fmt(SHOP_ITEMS['pickaxe berlian'].price)}`,
                    inline: true,
                },
                {
                    name: '🧪 Potion',
                    value: `❤️ Potion Heal : ${fmt(SHOP_ITEMS['potion heal'].price)}`,
                    inline: false,
                },
                {
                    name: '📖 Cara Beli',
                    value:
                        '`.buy nama barang | jumlah`\n' +
                        'Contoh: `.buy anak panah | 5`\n' +
                        '_Maksimal 10 item per transaksi. Beli tier senjata/pickaxe lebih tinggi otomatis meng-upgrade punya kamu._',
                    inline: false,
                }
            )
            .setFooter({ text: '💰 Kumpulkan uangmu, lengkapi perlengkapan berburu!' })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Shop Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
