import { EmbedBuilder } from 'discord.js';
import { getUser, setUser, TIER_RANK } from '../../lib/economyStore.js';
import { resolveItem } from '../../lib/rpgData.js';

const pluginConfig = {
    name: 'buy',
    alias: ['beli'],
    category: 'rpg',
    description: 'Membeli barang dari shop',
    usage: '.buy nama barang | jumlah',
    example: '.buy anak panah | 5',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    isEnabled: true,
};

async function handler(m, { args }) {
    try {
        const raw = args.join(' ');
        if (!raw.includes('|')) {
            return m.reply(
                '🛒 *CARA BELI*\n\n> `.buy nama barang | jumlah`\n> Contoh: `.buy anak panah | 5`\n\nKetik `.shop` buat lihat daftar barang 📋'
            );
        }

        let [namePart, qtyPart] = raw.split('|').map((s) => s.trim());
        let qty = parseInt(qtyPart, 10);
        if (!qtyPart || isNaN(qty) || qty < 1) qty = 1;
        if (qty > 10) qty = 10;

        const resolved = resolveItem(namePart);
        if (!resolved) {
            return m.reply(`❌ Barang **${namePart}** tidak ditemukan di shop. Ketik \`.shop\` buat lihat daftarnya 📋`);
        }

        const { item } = resolved;
        const user = getUser(m.guild.id, m.author.id);

        // 🗡️⛏️ Senjata / pickaxe / busur -> upgrade slot, bukan stack
        if (item.slot) {
            if (item.slot === 'busur') {
                if (user.weapons.busur) {
                    return m.reply('❌ Kamu sudah punya **Busur** 🏹, gak perlu beli lagi.');
                }
                const total = item.price;
                if (user.money < total) {
                    return m.reply(`❌ Uang kamu tidak cukup! Butuh **${total.toLocaleString('id-ID')} 💵**, kamu punya **${user.money.toLocaleString('id-ID')} 💵**.`);
                }
                user.money -= total;
                user.weapons.busur = true;
                setUser(m.guild.id, m.author.id, user);

                return m.reply({
                    embeds: [successEmbed(m, `${item.emoji} ${item.label}`, 1, total, user.money)],
                });
            }

            const currentTier = user.weapons[item.slot];
            const currentRank = currentTier ? TIER_RANK[currentTier] : 0;
            const newRank = TIER_RANK[item.tier];

            if (newRank <= currentRank) {
                return m.reply(`❌ Senjata **${item.slot}** kamu sudah setingkat atau lebih tinggi dari **${item.label}** ${item.emoji}.`);
            }

            const total = item.price;
            if (user.money < total) {
                return m.reply(`❌ Uang kamu tidak cukup! Butuh **${total.toLocaleString('id-ID')} 💵**, kamu punya **${user.money.toLocaleString('id-ID')} 💵**.`);
            }

            user.money -= total;
            user.weapons[item.slot] = item.tier;
            setUser(m.guild.id, m.author.id, user);

            const upgradeNote = currentTier ? `\n⬆️ Upgrade dari **${cap(currentTier)}** ke **${cap(item.tier)}**!` : '';
            return m.reply({
                embeds: [successEmbed(m, `${item.emoji} ${item.label}`, 1, total, user.money, upgradeNote)],
            });
        }

        // 🧪🏹 Barang konsumsi -> nambah stock
        if (item.type === 'consumable') {
            const total = item.price * qty;
            if (user.money < total) {
                return m.reply(`❌ Uang kamu tidak cukup! Butuh **${total.toLocaleString('id-ID')} 💵**, kamu punya **${user.money.toLocaleString('id-ID')} 💵**.`);
            }
            user.money -= total;

            if (item.key === 'arrows') {
                user.arrows += qty;
            } else {
                user.potions[item.key] = (user.potions[item.key] || 0) + qty;
            }
            setUser(m.guild.id, m.author.id, user);

            return m.reply({
                embeds: [successEmbed(m, `${item.emoji} ${item.label}`, qty, total, user.money)],
            });
        }
    } catch (error) {
        console.error('Buy Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function successEmbed(m, itemLabel, qty, total, remaining, extraNote = '') {
    return new EmbedBuilder()
        .setColor('#F1C40F')
        .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
        .setTitle('✅ PEMBELIAN BERHASIL')
        .addFields(
            { name: '📦 Barang', value: `${itemLabel} x${qty}`, inline: true },
            { name: '💸 Total Bayar', value: `${total.toLocaleString('id-ID')} 💵`, inline: true },
            { name: '💰 Sisa Uang', value: `${remaining.toLocaleString('id-ID')} 💵`, inline: true }
        )
        .setDescription(extraNote || null)
        .setTimestamp();
}

export { pluginConfig as config, handler };
