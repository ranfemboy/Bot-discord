import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'voicexp.json');

// ⚙️ Konfigurasi — gampang diubah sesuai selera
const XP_PER_MINUTE = 2;            // XP yang didapat tiap 1 menit nongkrong di voice
const TICK_INTERVAL_MS = 60 * 1000; // ticker jalan tiap 1 menit
const MIN_MEMBERS_TO_EARN = 2;      // minimal jumlah manusia (termasuk dia) di channel biar XP jalan (anti-AFK farming sendirian)

// userId -> { guildId, channelId }  → user yang lagi aktif connect voice (bukan AFK channel, bukan bot)
const activeVoice = new Map();

let xpData = {};      // userId -> { xp, totalMinutes, level }
let tickTimer = null;
let dataLoaded = false;

function ensureDataDir() {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadData() {
    if (dataLoaded) return;
    ensureDataDir();
    if (fs.existsSync(DATA_PATH)) {
        try {
            xpData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        } catch {
            xpData = {};
        }
    }
    dataLoaded = true;
}

function saveData() {
    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(xpData, null, 2));
}

// 📈 Rumus level: makin tinggi level, makin banyak XP yang dibutuhin (formula umum bot leveling)
function xpForLevel(level) {
    return 50 * level * level + 50 * level;
}

function calculateLevel(xp) {
    let level = 0;
    while (xp >= xpForLevel(level + 1)) level++;
    return level;
}

function getUser(userId) {
    loadData();
    if (!xpData[userId]) {
        xpData[userId] = { xp: 0, totalMinutes: 0, level: 0 };
    }
    return xpData[userId];
}

/** Ambil profil XP voice 1 user (buat command !voicerank) */
export function getVoiceProfile(userId) {
    loadData();
    const user = getUser(userId);
    const currentLevelXp = xpForLevel(user.level);
    const nextLevelXp = xpForLevel(user.level + 1);
    return {
        ...user,
        xpToNextLevel: nextLevelXp - user.xp,
        currentLevelXp,
        nextLevelXp,
    };
}

/** Ambil leaderboard top N (buat command !voicetop) */
export function getLeaderboard(limit = 10) {
    loadData();
    return Object.entries(xpData)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit);
}

/**
 * Dipanggil dari event `voiceStateUpdate`.
 * Nge-track siapa aja yang lagi aktif nongkrong di voice channel (skip AFK channel & bot).
 */
export function handleVoiceStateUpdate(oldState, newState) {
    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild;
    const afkChannelId = guild.afkChannelId;
    const isInRealChannel = newState.channelId && newState.channelId !== afkChannelId;

    if (isInRealChannel) {
        activeVoice.set(member.id, { guildId: guild.id, channelId: newState.channelId });
    } else {
        activeVoice.delete(member.id); // keluar voice / pindah ke AFK channel
    }
}

/**
 * Isi ulang `activeVoice` dari state sekarang — dipanggil pas bot baru nyala/restart,
 * biar orang yang udah lebih dulu di voice sebelum bot online tetep kehitung.
 */
export function primeActiveVoiceFromClient(client) {
    for (const guild of client.guilds.cache.values()) {
        for (const [, voiceState] of guild.voiceStates.cache) {
            if (voiceState.member && !voiceState.member.user.bot && voiceState.channelId && voiceState.channelId !== guild.afkChannelId) {
                activeVoice.set(voiceState.member.id, { guildId: guild.id, channelId: voiceState.channelId });
            }
        }
    }
}

/**
 * Jalanin ticker XP — panggil SEKALI aja pas bot ready.
 */
export function startVoiceXpTicker(client, { onLevelUp } = {}) {
    loadData();
    if (tickTimer) return; // udah jalan, jangan dobel jalanin

    tickTimer = setInterval(() => {
        for (const [userId, session] of activeVoice.entries()) {
            const guild = client.guilds.cache.get(session.guildId);
            const channel = guild?.channels.cache.get(session.channelId);
            if (!channel) { activeVoice.delete(userId); continue; }

            const humanCount = channel.members.filter(m => !m.user.bot).size;
            if (humanCount < MIN_MEMBERS_TO_EARN) continue; // sendirian doang, gak dapet XP

            const user = getUser(userId);
            const oldLevel = user.level;

            user.xp += XP_PER_MINUTE;
            user.totalMinutes += 1;
            user.level = calculateLevel(user.xp);

            if (user.level > oldLevel && onLevelUp) {
                onLevelUp({ userId, guildId: session.guildId, channelId: session.channelId, newLevel: user.level });
            }
        }
        saveData();
    }, TICK_INTERVAL_MS);
}

export function stopVoiceXpTicker() {
    if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
    }
}
