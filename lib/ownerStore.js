import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/extraOwners.json');

let ownerList = [];

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            ownerList = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading extra owner data:', error);
        ownerList = [];
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(ownerList, null, 2));
    } catch (error) {
        console.error('Error saving extra owner data:', error);
    }
}

load();

export function isExtraOwner(userId) {
    return ownerList.some((o) => o.userId === userId);
}

export function addOwner(userId, addedBy) {
    if (isExtraOwner(userId)) return false;
    ownerList.push({ userId, addedBy, addedAt: Date.now() });
    save();
    return true;
}

export function removeOwner(userId) {
    const before = ownerList.length;
    ownerList = ownerList.filter((o) => o.userId !== userId);
    if (ownerList.length === before) return false;
    save();
    return true;
}

export function listOwners() {
    return ownerList;
}
