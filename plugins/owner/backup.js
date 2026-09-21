import { sendBackupToTelegram } from '../../lib/telegramBackup.js';

const pluginConfig = {
    name: 'backup',
    alias: [],
    category: 'owner',
    description: 'Backup manual data bot ke Telegram',
    usage: '.backup',
    example: '.backup',
    isOwner: true,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

async function handler(m) {
    try {
        const msg = await m.reply('⏳ Sedang membuat backup...');
        await sendBackupToTelegram(`📦 Backup Manual\nDiminta oleh: ${m.author.tag}\nWaktu: ${new Date().toLocaleString('id-ID')}`);
        await msg.edit('✅ Backup berhasil dikirim ke Telegram!');
    } catch (error) {
        console.error('Backup Plugin Error:', error);
        await m.reply('❌ *GAGAL BACKUP*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };