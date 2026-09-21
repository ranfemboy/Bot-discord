import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/streakData.json');

const store = new Map();
const MAX_REVIVES = 3;

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => store.set(key, value));
        }
    } catch (error) {
        console.error('Error loading streak data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(store), null, 2));
    } catch (error) {
        console.error('Error saving streak data:', error);
    }
}

load();

function pairKey(idA, idB) {
    return [idA, idB].sort().join('_');
}

function otherUser(key, userId) {
    const [a, b] = key.split('_');
    return a === userId ? b : a;
}

// 📅 Tanggal hari ini format YYYY-MM-DD pakai zona waktu Asia/Jakarta (biar konsisten semua user)
function todayStr() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const map = {};
    parts.forEach((p) => (map[p.type] = p.value));
    return `${map.year}-${map.month}-${map.day}`;
}

function daysBetween(dateStrOld, dateStrNew) {
    const d1 = new Date(dateStrOld + 'T00:00:00Z');
    const d2 = new Date(dateStrNew + 'T00:00:00Z');
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function defaultRecord() {
    return { streak: 0, frozenStreak: 0, lastLitDate: null, revivesLeft: MAX_REVIVES };
}

function getStreakRecord(idA, idB) {
    const key = pairKey(idA, idB);
    if (!store.has(key)) store.set(key, defaultRecord());
    return { key, record: store.get(key) };
}

// 🔥 Status api dihitung on-the-fly dari selisih hari lastLitDate vs hari ini (gak butuh cron job)
// 'belum_pernah' -> 'nyala' (hari ini) -> 'abu' (kelewat 1 hari) -> 'mati' (kelewat 2+ hari)
export function getFlameStatus(record) {
    if (!record.lastLitDate) return 'belum_pernah';
    const diff = daysBetween(record.lastLitDate, todayStr());
    if (diff <= 0) return 'nyala';
    if (diff === 1) return 'abu';
    return 'mati';
}

// 🔥 Nyalain streak hari ini antara 2 user
export function lightStreak(idA, idB) {
    const { key, record } = getStreakRecord(idA, idB);
    const today = todayStr();

    if (record.lastLitDate === today) {
        return { status: 'already', streak: record.streak };
    }

    const status = getFlameStatus(record);

    if (status === 'belum_pernah' || status === 'mati') {
        record.streak = 1;
        record.frozenStreak = 1;
        record.lastLitDate = today;
        store.set(key, record);
        save();
        return { status: status === 'mati' ? 'restarted' : 'new', streak: 1 };
    }

    // status 'nyala' atau 'abu' -> lanjut nambah
    record.streak += 1;
    record.frozenStreak = record.streak;
    record.lastLitDate = today;
    store.set(key, record);
    save();
    return { status: 'continued', streak: record.streak };
}

// 💉 Pulihkan streak yang udah mati (maksimal 3x per pasangan, gabungan siapapun yang mulai)
export function reviveStreak(idA, idB) {
    const { key, record } = getStreakRecord(idA, idB);
    const status = getFlameStatus(record);

    if (status !== 'mati') {
        return { ok: false, reason: 'not_dead', status };
    }
    if (record.revivesLeft <= 0) {
        return { ok: false, reason: 'no_revives' };
    }

    record.streak = record.frozenStreak;
    record.lastLitDate = todayStr();
    record.revivesLeft -= 1;
    store.set(key, record);
    save();
    return { ok: true, streak: record.streak, revivesLeft: record.revivesLeft };
}

// 📋 List semua streak yang melibatkan 1 user, diurutin dari yang paling tinggi
export function listStreaksForUser(userId) {
    const result = [];
    for (const [key, record] of store.entries()) {
        const [a, b] = key.split('_');
        if (a !== userId && b !== userId) continue;

        const partnerId = otherUser(key, userId);
        const status = getFlameStatus(record);
        const displayStreak = status === 'mati' ? 0 : record.streak;
        result.push({ partnerId, streak: displayStreak, frozenStreak: record.frozenStreak, status, revivesLeft: record.revivesLeft });
    }
    return result.sort((x, y) => y.streak - x.streak);
}
