import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 💬 Store untuk fitur .addrespon (addrespon.txt)
// Struktur tiap entry: { trigger, type: 'text'|'sticker'|'media', content, guildId, addedBy }
// - type 'text'   -> content = teks balasan
// - type 'sticker'/'media' -> content = URL attachment Discord (dari pesan yang di-reply)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/autoResponData.json');

let responses = [];

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            responses = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading auto respon data:', error);
        responses = [];
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(responses, null, 2));
    } catch (error) {
        console.error('Error saving auto respon data:', error);
    }
}

load();

export function addResponse(guildId, trigger, type, content, addedBy) {
    // Trigger unik per-guild (case-insensitive). Kalau udah ada, di-replace/update.
    const normalizedTrigger = trigger.trim().toLowerCase();
    const existingIndex = responses.findIndex(
        (r) => r.guildId === guildId && r.trigger === normalizedTrigger
    );

    const entry = { guildId, trigger: normalizedTrigger, type, content, addedBy, addedAt: Date.now() };

    if (existingIndex >= 0) {
        responses[existingIndex] = entry;
    } else {
        responses.push(entry);
    }
    save();
    return entry;
}

export function removeResponse(guildId, trigger) {
    const normalizedTrigger = trigger.trim().toLowerCase();
    const before = responses.length;
    responses = responses.filter((r) => !(r.guildId === guildId && r.trigger === normalizedTrigger));
    save();
    return responses.length < before;
}

export function listResponses(guildId) {
    return responses.filter((r) => r.guildId === guildId);
}

// 🔎 Cari trigger yang PERSIS sama (bukan substring) dengan isi pesan, biar
// gak ke-trigger kalau kata "pagi" cuma numpang lewat di kalimat panjang.
export function findResponse(guildId, messageContent) {
    const normalized = messageContent.trim().toLowerCase();
    return responses.find((r) => r.guildId === guildId && r.trigger === normalized) || null;
}
