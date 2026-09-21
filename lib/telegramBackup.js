import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import axios from 'axios';
import FormData from 'form-data';
import settings from '../setting.js';

// 📦 Zip folder "data" (bisa kamu ganti/tambah folder lain yang mau di-backup)
async function createBackupZip() {
    const outputPath = path.join(process.cwd(), `backup-${Date.now()}.zip`);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
        output.on('close', () => resolve(outputPath));
        archive.on('error', reject);

        archive.pipe(output);
        archive.directory(path.join(process.cwd(), 'data'), 'data');
        // archive.file(path.join(process.cwd(), 'setting.js'), { name: 'setting.js' }); // opsional, HATI-HATI ada token bot Discord di sini
        archive.finalize();
    });
}

// 📤 Kirim file zip ke Telegram lewat sendDocument
export async function sendBackupToTelegram(caption = '📦 Auto Backup') {
    const zipPath = await createBackupZip();

    try {
        const form = new FormData();
        form.append('chat_id', settings.telegramChatId);
        form.append('caption', caption);
        form.append('document', fs.createReadStream(zipPath));

        const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendDocument`;
        await axios.post(url, form, { headers: form.getHeaders() });

        return true;
    } finally {
        fs.unlink(zipPath, () => {}); // hapus file zip sementara setelah dikirim
    }
}