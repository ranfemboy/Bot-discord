import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/birthdayConfig.json');

let data = {};

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading birthday config:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving birthday config:', error);
    }
}

load();

function ensureGuild(guildId) {
    if (!data[guildId]) data[guildId] = { channelId: null, lastAnnouncedDate: null };
    return data[guildId];
}

export function getBirthdayConfig(guildId) {
    return ensureGuild(guildId);
}

export function setBirthdayChannel(guildId, channelId) {
    ensureGuild(guildId).channelId = channelId;
    save();
}

export function getAllConfiguredGuilds() {
    return Object.entries(data)
        .filter(([, cfg]) => cfg.channelId)
        .map(([guildId, cfg]) => ({ guildId, ...cfg }));
}

export function markAnnouncedToday(guildId, dateStr) {
    ensureGuild(guildId).lastAnnouncedDate = dateStr;
    save();
}