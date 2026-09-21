import moment from 'moment-timezone';
import { getBackupConfig, setBackupConfig } from '../../lib/backupStore.js';
import { sendBackupToTelegram } from '../../lib/telegramBackup.js';

const pluginConfig = {
    name: 'autobackup',
    alias: [],
    category: 'owner',
    description: 'Atur jadwal auto backup harian ke Telegram',
    usage: '.autobackup HH:MM | .autobackup off',
    example: '.autobackup 00:00',
    isOwner: true,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m, { args }) {
    const input = args[0];

    if (!input) {
        const cfg = getBackupConfig();
        return m.reply(
            cfg.enabled
                ? `✅ Auto backup aktif, jadwal jam **${cfg.time}** WIB\n\nKetik \`.autobackup off\` untuk mematikan.`
                : `❌ Auto backup belum diatur.\n\nContoh: \`.autobackup 00:00\``
        );
    }

    if (input.toLowerCase() === 'off') {
        setBackupConfig({ enabled: false });
        return m.reply('🛑 Auto backup dinonaktifkan.');
    }

    if (!/^\d{2}:\d{2}$/.test(input)) {
        return m.reply('❌ Format salah. Contoh: `.autobackup 00:00`');
    }

    setBackupConfig({ enabled: true, time: input });
    return m.reply(`✅ Auto backup diatur setiap jam **${input}** WIB.`);
}

// ⏰ Scheduler: dicek tiap menit, jalan sekali saat menit & jam cocok
let lastRunMinute = null;
setInterval(async () => {
    const cfg = getBackupConfig();
    if (!cfg.enabled || !cfg.time) return;

    const now = moment().tz('Asia/Jakarta').format('HH:mm');
    const stamp = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm');

    if (now === cfg.time && lastRunMinute !== stamp) {
        lastRunMinute = stamp;
        try {
            await sendBackupToTelegram(`📦 Auto Backup Terjadwal\nWaktu: ${stamp} WIB`);
            console.log('✅ Auto backup terkirim ke Telegram');
        } catch (err) {
            console.error('❌ Auto backup gagal:', err);
        }
    }
}, 60 * 1000);

export { pluginConfig as config, handler };