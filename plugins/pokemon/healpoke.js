import { EmbedBuilder } from 'discord.js';
import { SHOP_ITEMS } from '../../lib/pokemonData.js';
import { isRegistered, getAccount, getPokemon, healWithPotion } from '../../lib/pokemonStore.js';

const pluginConfig = {
    name: 'healpoke',
    alias: ['obatipoke', 'potionpoke'],
    category: 'pokemon',
    description: 'Menggunakan Potion untuk menyembuhkan HP salah satu Pokemon kamu',
    usage: '.healpoke <uid> | <potion/superpotion>',
    example: '.healpoke p3 | potion',
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
                '🧪 *CARA HEAL*\n\n> `.healpoke <uid> | <potion/superpotion>`\n> Contoh: `.healpoke p3 | potion`\n\nKetik `.kandang` buat lihat UID Pokemon kamu.'
            );
        }

        const [uidPart, potionPart] = raw.split('|').map((s) => s.trim().toLowerCase());
        const potionKey = potionPart === 'superpotion' ? 'superpotion' : 'potion';
        const potionItem = SHOP_ITEMS[potionKey];

        const mon = getPokemon(guildId, userId, uidPart);
        if (!mon) {
            return m.reply(`❌ Pokemon dengan UID **${uidPart}** tidak ditemukan. Cek \`.kandang\` buat lihat daftar Pokemon kamu.`);
        }

        const result = healWithPotion(guildId, userId, mon.uid, potionKey, potionItem.heal);

        if (!result.ok) {
            if (result.reason === 'no_potion') return m.reply(`❌ Kamu tidak punya **${potionItem.label}** ${potionItem.emoji}! Beli dulu di \`.pokeshop\`.`);
            if (result.reason === 'full_hp') return m.reply('✅ HP Pokemon ini sudah penuh, gak perlu dipakein potion dulu.');
            return m.reply('❌ Gagal menyembuhkan Pokemon.');
        }

        const acc = getAccount(guildId, userId);
        const embed = new EmbedBuilder()
            .setColor('#E91E63')
            .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
            .setTitle(`${potionItem.emoji} Potion Digunakan!`)
            .addFields(
                { name: '🆔 UID', value: result.mon.uid, inline: true },
                { name: '❤️ HP Sekarang', value: `${result.mon.currentHp} / ${result.mon.maxHp}`, inline: true },
                { name: `${potionItem.emoji} Sisa ${potionItem.label}`, value: `${acc.potions[potionKey]}x`, inline: true }
            )
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Healpoke Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
