import { EmbedBuilder } from 'discord.js';
import { unlockBot, unlockFeature } from '../../lib/lockStore.js';

const pluginConfig = {
    name: 'unlock',
    alias: ['bukakunci'],
    category: 'owner',
    description: 'Membuka kunci fitur tertentu atau seluruh bot (khusus owner)',
    usage:
        '.unlock fitur <namaFitur>\n' +
        '.unlock bot',
    example: '.unlock fitur play\n.unlock bot',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { args, prefix }) {
    if (args.length === 0) {
        return m.reply(
            `🔓 *SISTEM UNLOCK*\n\n` +
            `Format:\n` +
            `\`${prefix}unlock fitur <namaFitur>\`\n` +
            `\`${prefix}unlock bot\`\n\n` +
            `*Contoh:*\n` +
            `\`${prefix}unlock fitur play\`\n` +
            `\`${prefix}unlock bot\``
        );
    }

    const sub = args[0].toLowerCase();

    if (sub === 'bot') {
        const wasLocked = unlockBot();
        if (!wasLocked) {
            return m.reply('ℹ️ Bot emang lagi gak dikunci kok, Sensei~');
        }

        const embed = new EmbedBuilder()
            .setColor('#4CAF50')
            .setTitle('🔓 BOT DIBUKA')
            .setDescription('Bot udah bisa dipakai normal lagi sama semua orang.')
            .addFields({ name: '👤 Dibuka Oleh', value: `${m.author}`, inline: false })
            .setTimestamp();

        return m.reply({ embeds: [embed] });
    }

    if (sub === 'fitur' || sub === 'feature') {
        const featureName = args[1];
        if (!featureName) {
            return m.reply(`❌ Sebutkan nama fiturnya!\n\n> \`${prefix}unlock fitur play\``);
        }

        const success = unlockFeature(featureName);
        if (!success) {
            return m.reply(`ℹ️ Fitur \`${featureName}\` emang lagi gak dikunci kok, Sensei~`);
        }

        const embed = new EmbedBuilder()
            .setColor('#4CAF50')
            .setTitle('🔓 FITUR DIBUKA')
            .setDescription(`Fitur \`${featureName}\` udah bisa dipakai normal lagi.`)
            .addFields({ name: '👤 Dibuka Oleh', value: `${m.author}`, inline: false })
            .setTimestamp();

        return m.reply({ embeds: [embed] });
    }

    return m.reply(`❌ Subcommand gak dikenal. Pakai \`fitur\` atau \`bot\`.`);
}

export { pluginConfig as config, handler };
