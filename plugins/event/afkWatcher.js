/**
 * AFK Watcher — Event Plugin
 * -----------------------------
 * Bagian "checkAfk" dari source code yang dikasih, dipindah jadi event
 * plugin (messageCreate) karena harus jalan di SEMUA pesan (bukan cuma
 * command). Dua hal yang dicek:
 * 1. Kalau si author lagi AFK dan dia ngirim pesan (BUKAN pesan `.afk`
 *    itu sendiri) -> AFK-nya dicabut otomatis + bot ngucapin "welcome back".
 * 2. Kalau ada user yang di-mention lagi AFK -> bot kasih tau ke yang nge-tag.
 */
import { getAfkUser, removeAfkUser, formatDuration } from '../../lib/afkStore.js';

const pluginConfig = {
    name: 'afkWatcher',
    alias: [],
    category: 'event',
    description: 'Deteksi user kembali dari AFK & notifikasi kalau mention user yang sedang AFK',
    usage: 'otomatis (tidak dipanggil via command)',
    example: '-',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

const event = 'messageCreate';

// Command yang SET status afk -> jangan langsung dicabut lagi di pesan yang sama
const AFK_COMMAND_NAMES = ['afk', 'away', 'brb'];

function isAfkCommand(content, prefix) {
    if (!content.startsWith(prefix)) return false;
    const commandName = content.slice(prefix.length).trim().split(/ +/)[0]?.toLowerCase();
    return AFK_COMMAND_NAMES.includes(commandName);
}

async function handler(message, { settings }) {
    try {
        if (message.author.bot) return;

        const prefix = settings.prefix || '.';

        // 1️⃣ User yang lagi AFK ngirim pesan -> cabut status AFK-nya
        const afkData = getAfkUser(message.author.id);
        if (afkData && !isAfkCommand(message.content, prefix)) {
            removeAfkUser(message.author.id);
            const duration = formatDuration(Date.now() - afkData.time);
            await message.reply(
                `👋 *ᴀꜰᴋ ʙᴇʀᴀᴋʜɪʀ*\n\n` +
                `\`\`\`${message.author.username} sudah kembali!\`\`\`\n` +
                `🍀 \`Durasi AFK:\` *${duration}*`
            ).catch(() => {});
        }

        // 2️⃣ Ada user yang di-mention lagi AFK -> kasih tau
        if (message.mentions.users.size > 0) {
            for (const [, mentioned] of message.mentions.users) {
                if (mentioned.bot || mentioned.id === message.author.id) continue;

                const mentionedAfk = getAfkUser(mentioned.id);
                if (mentionedAfk) {
                    const duration = formatDuration(Date.now() - mentionedAfk.time);
                    await message.reply(
                        `💤 *ᴜsᴇʀ ᴀꜰᴋ*\n\n` +
                        `\`\`\`Hustt, jangan di ganggu!\`\`\` <@${mentioned.id}> lagi AFK\n` +
                        `🍀 \`Alasan:\` *${mentionedAfk.reason}*\n` +
                        `🍀 \`Sejak:\` *${duration} yang lalu*`
                    ).catch(() => {});
                }
            }
        }
    } catch (error) {
        console.error('AfkWatcher Error:', error);
    }
}

export { pluginConfig as config, event, handler };
