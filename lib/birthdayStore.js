import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/birthdayData.json');

let data = {};

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading birthday data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving birthday data:', error);
    }
}

load();

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function parseBirthdayInput(text) {
    const parts = (text || '').trim().split('-').map((p) => p.trim());
    if (parts.length !== 2 && parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parts.length === 3 ? parseInt(parts[2], 10) : null;

    if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > DAYS_IN_MONTH[month - 1]) return null;
    if (year !== null) {
        if (!Number.isInteger(year)) return null;
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) return null;
    }

    return { day, month, year };
}

export function setBirthday(userId, day, month, year = null) {
    data[userId] = { day, month, year, setAt: Date.now() };
    save();
}

export function getBirthday(userId) {
    return data[userId] || null;
}

export function deleteBirthday(userId) {
    if (!data[userId]) return false;
    delete data[userId];
    save();
    return true;
}

export function getBirthdaysOn(day, month) {
    return Object.entries(data)
        .filter(([, b]) => b.day === day && b.month === month)
        .map(([userId, b]) => ({ userId, ...b }));
}

export function formatBirthdayDate({ day, month, year }) {
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const base = `${day} ${monthNames[month - 1]}`;
    return year ? `${base} ${year}` : base;
}

export function calculateAge({ month, day, year }, now = new Date()) {
    if (!year) return null;
    let age = now.getFullYear() - year;
    const hasHadBirthdayThisYear =
        now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day);
    if (!hasHadBirthdayThisYear) age -= 1;
    return age;
}