import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/welcomeData.json');

const welcomeData = new Map();

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => welcomeData.set(key, value));
        }
    } catch (error) {
        console.error('Error loading welcome data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(welcomeData), null, 2));
    } catch (error) {
        console.error('Error saving welcome data:', error);
    }
}

load();

export function getWelcomeConfig(guildId) {
    return welcomeData.get(guildId);
}

export function setWelcomeConfig(guildId, config) {
    welcomeData.set(guildId, config);
    save();
}
