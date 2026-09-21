import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/confessionRecords.json');

// 📦 Struktur: { "guildId": { nextNumber: N, records: { "N": { channelId, messageId, threadId } } } }
let data = {};

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading confession records:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving confession records:', error);
    }
}

load();

function ensureGuild(guildId) {
    if (!data[guildId]) data[guildId] = { nextNumber: 1, records: {} };
    return data[guildId];
}

export function recordConfession(guildId, channelId, messageId, threadId = null) {
    const guildData = ensureGuild(guildId);
    const number = guildData.nextNumber;
    guildData.records[number] = { channelId, messageId, threadId };
    guildData.nextNumber += 1;
    save();
    return number;
}

export function getConfessionRecord(guildId, number) {
    const guildData = data[guildId];
    if (!guildData) return null;
    return guildData.records[number] || null;
}

export function parseConfessionRef(input) {
    const trimmed = (input || '').trim();
    if (!trimmed) return null;

    const linkMatch = trimmed.match(/discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
    if (linkMatch) {
        return { type: 'link', channelId: linkMatch[2], messageId: linkMatch[3] };
    }

    const numberMatch = trimmed.match(/^\d+$/);
    if (numberMatch) {
        return { type: 'number', number: parseInt(trimmed, 10) };
    }

    return null;
}