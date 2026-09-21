import { EmbedBuilder } from 'discord.js';
import { isRegistered, getAccount, addCoins } from '../../lib/pokemonStore.js';

const pluginConfig = {
    name: 'addcoinpokemon',
    alias: ['addcoinpoke', 'addpokecoin'],
    category: 'owner',
    description: 'Menambahkan Coin Pokemon ke akun user tertentu (khusus owner)',
    usage: '.addcoinpokemon @user <jumlah>',
    example: '.addcoinpokemon @Budi 5000',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { args }) {
    try {
        const target = m.mentions.users.first();
        if (!target) {
            return m.reply('❌ Mention user-nya! Contoh: `.addcoinpokemon @Budi 5000`');
        }

        const amountRaw = args.find((a) => !a.startsWith('<@'));
        const amount = parseInt(amountRaw, 10);
        if (!amountRaw || isNaN(amount) || amount <= 0) {
            return m.reply('❌ Jumlah coin gak valid! Contoh: `.addcoinpokemon @Budi 5000`');
        }

        const guildId = m.guild.id;
        if (!isRegistered(guildId, target.id)) {
            return m.reply(`❌ ${target} belum daftar akun Pokemon (\`.daftar\`), gak bisa ditambahin coin.`);
        }

        addCoins(guildId, target.id, amount);
        const acc = getAccount(guildId, target.id);

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('🪙 COIN POKEMON DITAMBAHKAN')
            .addFields(
                { name: '➕ Ditambahkan', value: `${amount.toLocaleString('id-ID')} 🪙`, inline: true },
                { name: '💰 Total Sekarang', value: `${acc.coins.toLocaleString('id-ID')} 🪙`, inline: true }
            )
            .setFooter({ text: `Ditambahkan oleh ${m.author.username}` })
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Addcoinpokemon Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
