import { EmbedBuilder } from 'discord.js';
import { getUser, setUser } from '../../lib/economyStore.js';

const HEAL_AMOUNT = 40;

const pluginConfig = {
    name: 'heal',
    alias: ['minumpotion'],
    category: 'rpg',
    description: 'Menggunakan Potion Heal untuk memulihkan HP',
    usage: '.heal',
    example: '.heal',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m) {
    try {
        const user = getUser(m.guild.id, m.author.id);

        if (user.potions.heal <= 0) {
            return m.reply('❌ Kamu tidak punya **Potion Heal** 🧪! Beli dulu di `.shop`.');
        }
        if (user.hp >= user.maxHp) {
            return m.reply('✅ HP kamu sudah penuh ❤️, gak perlu minum potion dulu.');
        }

        user.potions.heal -= 1;
        user.hp = Math.min(user.maxHp, user.hp + HEAL_AMOUNT);
        setUser(m.guild.id, m.author.id, user);

        const embed = new EmbedBuilder()
            .setColor('#E91E63')
            .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
            .setTitle('🧪 Potion Heal Digunakan!')
            .addFields(
                { name: '❤️ HP Sekarang', value: `${user.hp} / ${user.maxHp}`, inline: true },
                { name: '🧪 Sisa Potion', value: `${user.potions.heal}x`, inline: true }
            )
            .setTimestamp();

        await m.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Heal Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
