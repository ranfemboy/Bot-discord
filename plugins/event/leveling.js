import { getUserData, setUserData, calculateLevel } from '../../lib/levelStore.js';
import { getGuildLevelConfig, renderLevelMessage } from '../../lib/levelConfigStore.js';
import { getRoleForLevel } from '../../lib/levelRoleStore.js';

const pluginConfig = {
    name: 'leveling',
    alias: [],
    category: 'event',
    description: 'Menambah XP otomatis setiap user chat, lalu naik level',
    usage: 'otomatis (tidak dipanggil via command)',
    example: '-',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

const event = 'messageCreate';
const XP_COOLDOWN = 1 * 60 * 60 * 1000; // jeda 1 jam
const XP_MIN = 15;
const XP_MAX = 25;

async function handler(m) {
    try {
        if (m.author.bot) return;
        if (!m.guild) return; // XP cuma dihitung di server, bukan DM

        const data = getUserData(m.guild.id, m.author.id);
        const now = Date.now();

        if (now - (data.lastMessage || 0) < XP_COOLDOWN) return;

        const gainedXp = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
        const beforeLevel = calculateLevel(data.xp).level;

        data.xp += gainedXp;
        data.lastMessage = now;
        setUserData(m.guild.id, m.author.id, data);

        const afterLevel = calculateLevel(data.xp).level;

        if (afterLevel > beforeLevel) {
            // 🎁 Cek apakah level ini punya role reward yang di-setting lewat .setrolelevel.
            // Sengaja SILENT — role ditambahin diem-diem di background, gak diumumin/di-tag di chat.
            const roleId = getRoleForLevel(m.guild.id, afterLevel);
            if (roleId) {
                try {
                    const role = m.guild.roles.cache.get(roleId) ?? (await m.guild.roles.fetch(roleId).catch(() => null));
                    if (role) {
                        await m.member.roles.add(role);
                    }
                } catch (roleError) {
                    console.error('Level Role Reward Error:', roleError);
                }
            }

            // 📍 Ambil setting server: channel tujuan & template pesan (di-atur lewat .setlevel)
            const { channelId, message } = getGuildLevelConfig(m.guild.id);
            const targetChannel = channelId ? m.guild.channels.cache.get(channelId) : null;
            const sendTo = targetChannel ?? m.channel; // fallback: kirim di channel chat biasa kalau belum di-set

            const finalMessage = renderLevelMessage(message, {
                user: `${m.author}`, // mention user yang bersangkutan
                level: afterLevel,
            });

            await sendTo.send(finalMessage).catch(() => {});
        }
    } catch (error) {
        console.error('Leveling Plugin Error:', error);
    }
}

export { pluginConfig as config, handler, event }