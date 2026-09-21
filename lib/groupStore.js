import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/groupData.json');

const groupData = new Map();

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => groupData.set(key, value));
        }
    } catch (error) {
        console.error('Error loading group data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(groupData), null, 2));
    } catch (error) {
        console.error('Error saving group data:', error);
    }
}

load();

export function getGroup(guildId) {
    return groupData.get(guildId) || {};
}

export function setGroup(guildId, config) {
    groupData.set(guildId, config);
    save();
}
