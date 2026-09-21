import { Collection, EmbedBuilder } from 'discord.js';
import { isUserPremium } from '../lib/premiumStore.js';
import { isStaff } from '../lib/staffStore.js';
import { isExtraOwner } from '../lib/ownerStore.js';
import { buildReportButtons } from '../lib/reportStore.js';
import { isChannelAllowed, getAllowedChannels } from '../lib/botChannelStore.js';
import { logReply, logDM } from '../lib/dashboardStore.js';
import { getLockDenyReason } from '../lib/lockStore.js';

const COLOR = { reset: '\x1b[0m', dim: '\x1b[2m', cyan: '\x1b[36m', yellow: '\x1b[33m' };

function logIncomingMessage(message) {
    const time = new Date().toLocaleTimeString('id-ID');
    const attachInfo = message.attachments.size > 0 ? ` (+${message.attachments.size} lampiran)` : '';
    if (!message.guild) {
        console.log(`${COLOR.cyan}┌─ 📩 DM ${COLOR.dim}[${time}]${COLOR.reset}\n${COLOR.yellow}│ Username:${COLOR.reset} ${message.author.tag}\n${COLOR.yellow}│ Msg     :${COLOR.reset} ${message.content || '(kosong)'}${attachInfo}\n${COLOR.cyan}└────────────────────────────${COLOR.reset}`);
        return;
    }
    console.log(`${COLOR.cyan}┌─ 📩 Message ${COLOR.dim}[${time}]${COLOR.reset}\n${COLOR.yellow}│ Server  :${COLOR.reset} ${message.guild.name}\n${COLOR.yellow}│ Channel :${COLOR.reset} #${message.channel.name}\n${COLOR.yellow}│ Username:${COLOR.reset} ${message.author.tag}\n${COLOR.yellow}│ Msg     :${COLOR.reset} ${message.content || '(kosong)'}${attachInfo}\n${COLOR.cyan}└────────────────────────────${COLOR.reset}`);
}

// 👤 Anti-spam sederhana biar auto-reply "owner sibuk" gak ngebanjirin channel
const ownerPingCooldown = new Collection();
const OWNER_PING_COOLDOWN_MS = 30 * 1000; // 30 detik per user per channel

// 🔔 Balas otomatis kalau owner di-tag (@owner beneran, bukan reply-ping), pakai embed foto profil owner + tombol Report
async function handleOwnerMention(m, settings) {
    if (m.author.bot) return;
    if (!settings.idOwner) return;
    if (m.author.id === settings.idOwner) return; // owner nge-tag diri sendiri, skip

    // Cuma proses kalau ada teks `@owner` beneran di pesan.
    // m.mentions.users.has() sengaja gak dipakai sendirian, soalnya Discord juga
    // otomatis nge-flag user itu ke sana kalau pesannya reply ke owner (reply-ping),
    // padahal gak ada @tag beneran di teksnya. Makanya obrolan reply-reply-an ganggu kemarin.
    const ownerTagRegex = new RegExp(`<@!?${settings.idOwner}>`);
    if (!ownerTagRegex.test(m.content)) return;

    const cooldownKey = `${m.channel.id}-${m.author.id}`;
    const lastPing = ownerPingCooldown.get(cooldownKey);
    const now = Date.now();
    if (lastPing && now - lastPing < OWNER_PING_COOLDOWN_MS) return;
    ownerPingCooldown.set(cooldownKey, now);

    try {
        const owner = await m.client.users.fetch(settings.idOwner);

        const embed = new EmbedBuilder()
            .setColor('#FFFFFF')
            .setAuthor({ name: owner.tag, iconURL: owner.displayAvatarURL({ dynamic: true, size: 256 }) })
            .setThumbnail(owner.displayAvatarURL({ dynamic: true, size: 256 }))
            .setDescription(`Halo ${m.author}, Owner sedang sibuk yah nanti di respon kok,ᴊɪᴋᴀ ᴀᴅᴀ ᴇʀᴏʀ ᴍᴏʜᴏɴ ʟᴀᴘᴏʀ ᴊɪᴋᴀ ᴛᴀᴋ ᴅɪ ʀᴇsᴘᴏɴ ʙᴇʀᴀʀᴛɪ ᴍᴏʟᴏʀ 💤 `)
            .setTimestamp();

        const reportRow = buildReportButtons(m);

        await m.reply({ embeds: [embed], components: [reportRow] });
    } catch (error) {
        console.error('Owner Mention Auto-Reply Error:', error);
    }
}

// 💬 Handler utama untuk setiap pesan yang masuk (dipanggil dari index.js lewat event messageCreate)
export async function handleMessage(m, { client, settings }) {
    try {
        if (m.author.bot) return;

        logIncomingMessage(m);

        // 🔔 Cek dulu apakah owner di-tag, tetep jalan meski pesan bukan command
        await handleOwnerMention(m, settings);

        if (!m.content.startsWith(settings.prefix)) return;

        const args = m.content.slice(settings.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const plugin = client.plugins.find(p =>
            p.config.name === commandName ||
            (p.config.alias && p.config.alias.includes(commandName))
        );

        if (!plugin) return;

        // 🚫 CEK CHANNEL BLOCK - Pengecekan penting!
        if (m.guild) {
            try {
                if (!isChannelAllowed(m.guild.id, m.channel.id)) {
                    return; // channel di-block, diam aja gak usah balas
                }
            } catch (e) {
                console.error('Channel Check Error:', e);
                return; // Jika ada error, lebih aman diam
            }
        }

        const { config, handler } = plugin;

        // 🔒 CEK LOCK - bot-wide atau per-fitur (owner/extra-owner selalu lolos, lihat lockStore.js)
        const lockDenyReason = getLockDenyReason(config, m.author.id, settings);
        if (lockDenyReason) {
            return m.reply(lockDenyReason);
        }

        if (config.isOwner && m.author.id !== settings.idOwner && !isExtraOwner(m.author.id)) {
            // 👔 Staff dikecualikan kalau plugin-nya secara eksplisit isStaffAllowed (saat ini cuma .addprem)
            const allowedAsStaff = config.isStaffAllowed && isStaff(m.author.id);
            if (!allowedAsStaff) {
                return m.reply('❌ *AKSES DITOLAK*\n\n> Fitur ini khusus untuk owner bot.');
            }
        }

        if (config.isPremium && m.author.id !== settings.idOwner && !isUserPremium(m.author.id)) {
            return m.reply('⭐ *KHUSUS PREMIUM*\n\n> Fitur ini cuma bisa dipakai user premium. Hubungi owner buat upgrade ya~');
        }

        if (config.isGroup && !m.guild) {
            return m.reply('❌ Fitur ini hanya bisa digunakan di dalam server.');
        }

        if (config.isPrivate && m.guild) {
            return m.reply('❌ Fitur ini hanya bisa digunakan lewat DM (private chat).');
        }

        if (!client.cooldowns.has(config.name)) {
            client.cooldowns.set(config.name, new Collection());
        }
        const now = Date.now();
        const timestamps = client.cooldowns.get(config.name);
        const cooldownAmount = (config.cooldown || 3) * 1000;

        if (timestamps.has(m.author.id)) {
            const expirationTime = timestamps.get(m.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                return m.reply(`⏳ Tunggu ${timeLeft} detik lagi sebelum memakai *${config.name}* lagi.`);
            }
        }
        timestamps.set(m.author.id, now);
        setTimeout(() => timestamps.delete(m.author.id), cooldownAmount);

        await handler(m, { client, args, command: commandName, prefix: settings.prefix, settings });

    } catch (error) {
        console.error('Handler Error:', error);
        m.reply('❌ *TERJADI KESALAHAN*\n\n> ' + error.message).catch(() => {});
    }
}
