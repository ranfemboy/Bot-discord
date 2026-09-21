import { EmbedBuilder } from 'discord.js';
import { resolveShopItem } from '../../lib/pokemonData.js';
import { isRegistered, getAccount, removeCoins, addPokeball, addPotion } from '../../lib/pokemonStore.js';

const pluginConfig = {
    name: 'buypoke',
    alias: ['belipoke'],
    category: 'pokemon',
    description: 'Membeli Pokeball atau Potion dari Poke Shop',
    usage: '.buypoke nama barang | jumlah',
    example: '.buypoke great ball | 3',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    isEnabled: true,
};

async function handler(m, { args }) {
    try {
        const guildId = m.guild.id;
        const userId = m.author.id;

        if (!isRegistered(guildId, userId)) {
            return m.reply('❌ Kamu belum daftar! Ketik `.daftar nama | umur | gender` dulu ya.');
        }

        const raw = args.join(' ');
        if (!raw.includes('|')) {
            return m.reply(
                '🛒 *CARA BELI*\n\n> `.buypoke nama barang | jumlah`\n> Contoh: `.buypoke great ball | 3`\n\nKetik `.pokeshop` buat lihat daftar barang 📋'
            );
        }

        let [namePart, qtyPart] = raw.split('|').map((s) => s.trim());
        let qty = parseInt(qtyPart, 10);
        if (!qtyPart || isNaN(qty) || qty < 1) qty = 1;
        if (qty > 20) qty = 20;

        const resolved = resolveShopItem(namePart);
        if (!resolved) {
            return m.reply(`❌ Barang **${namePart}** tidak ditemukan di Poke Shop. Ketik \`.pokeshop\` buat lihat daftarnya 📋`);
        }

        const { key, item } = resolved;
        const total = item.price * qty;
        const acc = getAccount(guildId, userId);

        if (acc.coins < total) {
            return m.reply(`❌ Coin kamu tidak cukup! Butuh **${total.toLocaleString('id-ID')} 🪙**, kamu punya **${acc.coins.toLocaleString('id-ID')} 🪙**.`);
        }

        removeCoins(guildId, userId, total);
        if (item.type === 'ball') {
            addPokeball(guildId, userId, key, qty);
        } else {
            addPotion(guildId, userId, key, qty);
        }

        const remaining = getAccount(guildId, userId).coins;

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
            .setTitle('✅ PEMBELIAN BERHASIL')
            .addFields(
                { name: '📦 Barang', value: `${item.emoji} ${item.label} x${qty}`, inline: true },
                { name: '💸 Total Bayar', value: `${total.toLocaleString('id-ID')} 🪙`, inline: true },
                { name: '🪙 Sisa Coin', value: `${remaining.toLocaleString('id-ID')} 🪙`, inline: true }
            )
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Buypoke Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
