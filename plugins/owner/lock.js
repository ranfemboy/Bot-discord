import { EmbedBuilder } from 'discord.js';
import { lockBot, lockFeature, getBotLockInfo, getFeatureLockInfo } from '../../lib/lockStore.js';

const pluginConfig = {
    name: 'lock',
    alias: ['kunci'],
    category: 'owner',
    description: 'Mengunci fitur tertentu atau seluruh bot sementara (khusus owner)',
    usage:
        '.lock fitur <namaFitur> alasan: <alasan>\n' +
        '.lock bot alasan: <alasan>',
    example:
        '.lock fitur play alasan: Sedang masa perbaikan\n' +
        '.lock bot alasan: Sedang update, mohon menunggu',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

// 🔎 Ambil bagian alasan setelah kata "alasan:" (case-insensitive), sisanya dianggap nama fitur
function splitReason(text) {
    const match = text.match(/alasan\s*:\s*/i);
    if (!match) return { before: text.trim(), reason: null };
    const idx = match.index;
    return {
        before: text.slice(0, idx).trim(),
        reason: text.slice(idx + match[0].length).trim() || null,
    };
}

async function handler(m, { args, prefix, client }) {
    if (args.length === 0) {
        return m.reply(
            `🔒 *SISTEM LOCK*\n\n` +
            `Format:\n` +
            `\`${prefix}lock fitur <namaFitur> alasan: <alasan>\`\n` +
            `\`${prefix}lock bot alasan: <alasan>\`\n\n` +
            `*Contoh:*\n` +
            `\`${prefix}lock fitur play alasan: Sedang masa perbaikan\`\n` +
            `\`${prefix}lock bot alasan: Sedang update, mohon menunggu\``
        );
    }

    const sub = args[0].toLowerCase();
    const rest = args.slice(1).join(' ');

    if (sub === 'bot') {
        const { reason } = splitReason(rest);

        const already = getBotLockInfo();
        if (already.locked) {
            return m.reply(`⚠️ Bot udah dikunci duluan sama <@${already.lockedBy}>.\n📝 Alasan: ${already.reason}`);
        }

        lockBot(reason, m.author.id);

        const embed = new EmbedBuilder()
            .setColor('#FF4C4C')
            .setTitle('🔒 BOT DIKUNCI SEMENTARA')
            .setDescription('Semua fitur bot gak bisa dipakai user biasa sampai di-unlock lagi.')
            .addFields(
                { name: '📝 Alasan', value: reason || 'Tidak ada alasan', inline: false },
                { name: '👤 Dikunci Oleh', value: `${m.author}`, inline: false }
            )
            .setFooter({ text: `Pakai ${prefix}unlock bot buat buka lagi` })
            .setTimestamp();

        return m.reply({ embeds: [embed] });
    }

    if (sub === 'fitur' || sub === 'feature') {
        const { before: featureNameRaw, reason } = splitReason(rest);
        const featureName = featureNameRaw.split(/ +/)[0];

        if (!featureName) {
            return m.reply(`❌ Sebutkan nama fiturnya!\n\n> \`${prefix}lock fitur play alasan: Sedang masa perbaikan\``);
        }

        const targetPlugin = client.plugins.find(
            (p) => p.config.name.toLowerCase() === featureName.toLowerCase() ||
                (p.config.alias && p.config.alias.some((a) => a.toLowerCase() === featureName.toLowerCase()))
        );

        if (!targetPlugin) {
            return m.reply(`❌ Fitur \`${featureName}\` gak ketemu. Cek lagi nama command-nya ya, Sensei~`);
        }

        const realName = targetPlugin.config.name;
        const already = getFeatureLockInfo(realName);
        if (already) {
            return m.reply(`⚠️ Fitur \`${realName}\` udah dikunci duluan sama <@${already.lockedBy}>.\n📝 Alasan: ${already.reason}`);
        }

        lockFeature(realName, reason, m.author.id);

        const embed = new EmbedBuilder()
            .setColor('#FF4C4C')
            .setTitle('🔒 FITUR DIKUNCI')
            .setDescription(`Fitur \`${realName}\` sekarang gak bisa dipakai user biasa.`)
            .addFields(
                { name: '📝 Alasan', value: reason || 'Tidak ada alasan', inline: false },
                { name: '👤 Dikunci Oleh', value: `${m.author}`, inline: false }
            )
            .setFooter({ text: `Pakai ${prefix}unlock fitur ${realName} buat buka lagi` })
            .setTimestamp();

        return m.reply({ embeds: [embed] });
    }

    return m.reply(`❌ Subcommand gak dikenal. Pakai \`fitur\` atau \`bot\`.\n\n> \`${prefix}lock fitur play alasan: ...\`\n> \`${prefix}lock bot alasan: ...\``);
}

export { pluginConfig as config, handler };
