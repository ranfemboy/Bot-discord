import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'backupConfig.json');

function ensureFile() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ enabled: false, time: null }, null, 2));
    }
}

export function getBackupConfig() {
    ensureFile();
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function setBackupConfig(data) {
    ensureFile();
    const current = getBackupConfig();
    const merged = { ...current, ...data };
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
    return merged;
}