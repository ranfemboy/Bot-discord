import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/staffUsers.json');

let staffList = [];

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            staffList = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading staff data:', error);
        staffList = [];
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(staffList, null, 2));
    } catch (error) {
        console.error('Error saving staff data:', error);
    }
}

load();

export function isStaff(userId) {
    return staffList.some((s) => s.userId === userId);
}

export function addStaff(userId, addedBy) {
    if (isStaff(userId)) return false;
    staffList.push({ userId, addedBy, addedAt: Date.now() });
    save();
    return true;
}

export function removeStaff(userId) {
    const before = staffList.length;
    staffList = staffList.filter((s) => s.userId !== userId);
    if (staffList.length === before) return false;
    save();
    return true;
}

export function listStaff() {
    return staffList;
}
