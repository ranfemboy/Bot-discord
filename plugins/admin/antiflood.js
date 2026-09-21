import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginConfig = {
    name: 'antiflood',
    alias: ['af', 'flood'],
    category: 'admin',
    description: 'Mencegah spam dengan membatasi jumlah pesan per detik',
    usage: '.antiflood <on/off> [limit] [time]',
    example: '.antiflood on 5 10',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 1,
    isEnabled: true
}

// Data antiflood per server
const floodData = new Map();
const userMessages = new Map();
const warningCooldown = new Map();

// Load data dari file
function loadFloodData() {
    try {
        const dataPath = path.join(__dirname, '../../data/antifloodData.json');
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => {
                floodData.set(key, value);
            });
        }
    } catch (error) {
        console.error('Error loading flood data:', error);
    }
}

// Save data ke file
function saveFloodData() {
    try {
        const dataPath = path.join(__dirname, '../../data/antifloodData.json');
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const data = Object.fromEntries(floodData);
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving flood data:', error);
    }
}

// Load data saat startup
loadFloodData();

// Fungsi untuk memeriksa flood
function checkFlood(guildId, userId, config) {
    const now = Date.now();
    const key = `${guildId}_${userId}`;
    
    if (!userMessages.has(key)) {
        userMessages.set(key, []);
    }
    
    const messages = userMessages.get(key);
    const timeWindow = config.time || 10; // default 10 detik
    const limit = config.limit || 5; // default 5 pesan
    
    // Filter pesan dalam time window
    const recentMessages = messages.filter(timestamp => 
        now - timestamp < timeWindow * 1000
    );
    
    // Tambahkan pesan baru
    recentMessages.push(now);
    userMessages.set(key, recentMessages);
    
    // Cek apakah melebihi limit
    if (recentMessages.length > limit) {
        // Reset counter untuk user ini
        userMessages.set(key, []);
        return true; // Terdeteksi flood
    }
    
    return false;
}

// Fungsi untuk membersihkan data usermessages secara periodik
function cleanupUserMessages() {
    const now = Date.now();
    for (const [key, timestamps] of userMessages) {
        const filtered = timestamps.filter(t => now - t < 30000); // 30 detik
        if (filtered.length === 0) {
            userMessages.delete(key);
        } else {
            userMessages.set(key, filtered);
        }
    }
}

// Cleanup setiap 30 detik
setInterval(cleanupUserMessages, 30000);

// Fungsi untuk mengirim warning
async function sendWarning(message, user, config) {
    const warnKey = `${message.guild.id}_${user.id}`;
    const now = Date.now();
    
    // Cooldown warning 10 detik
    if (warningCooldown.has(warnKey)) {
        const lastWarn = warningCooldown.get(warnKey);
        if (now - lastWarn < 10000) {
            return;
        }
    }
    
    warningCooldown.set(warnKey, now);
    
    const warningMessage = config.warningMessage || 
        `⚠️ **PERINGATAN!**\n\n` +
        `@${user.username} jangan spam ya!\n` +
        `Batas: ${config.limit || 5} pesan per ${config.time || 10} detik`;
    
    try {
        const warnMsg = await message.channel.send(warningMessage);
        setTimeout(() => {
            warnMsg.delete().catch(() => {});
        }, 5000);
    } catch (error) {
        console.error('Error sending warning:', error);
    }
}

// Handler untuk command
async function handler(m, { client, args, prefix, settings }) {
    try {
        const subCommand = args[0]?.toLowerCase();
        const guildId = m.guild.id;
        
        // Cek permission
        if (!m.member.permissions.has('Administrator') && !m.member.permissions.has('ManageMessages')) {
            return m.reply('❌ Anda memerlukan permission **Administrator** atau **Manage Messages** untuk menggunakan perintah ini!');
        }
        
        // Tampilkan status
        if (!subCommand) {
            const config = floodData.get(guildId);
            const status = config?.enabled ? '🟢 **AKTIF**' : '🔴 **MATI**';
            const limit = config?.limit || 5;
            const time = config?.time || 10;
            
            return m.reply(
                `📋 **STATUS ANTI-FLOOD**\n\n` +
                `Status: ${status}\n` +
                `Batas: ${limit} pesan per ${time} detik\n` +
                `Peringatan: ${config?.warningMessage ? '✅ Diatur' : '❌ Default'}\n\n` +
                `📝 **Penggunaan:**\n` +
                `• ${prefix}antiflood on [limit] [time] - Mengaktifkan\n` +
                `• ${prefix}antiflood off - Menonaktifkan\n` +
                `• ${prefix}antiflood setlimit [jumlah] - Ubah batas\n` +
                `• ${prefix}antiflood settime [detik] - Ubah waktu\n` +
                `• ${prefix}antiflood setwarn [pesan] - Ubah pesan peringatan`
            );
        }
        
        // ON
        if (subCommand === 'on') {
            const limit = parseInt(args[1]) || 5;
            const time = parseInt(args[2]) || 10;
            
            if (limit < 1 || limit > 20) {
                return m.reply('❌ Batas pesan harus antara 1-20!');
            }
            if (time < 1 || time > 60) {
                return m.reply('❌ Waktu harus antara 1-60 detik!');
            }
            
            const config = floodData.get(guildId) || {};
            config.enabled = true;
            config.limit = limit;
            config.time = time;
            
            if (!config.warningMessage) {
                config.warningMessage = `⚠️ **PERINGATAN!**\n\n` +
                    `@${m.author.username} jangan spam ya!\n` +
                    `Batas: ${limit} pesan per ${time} detik`;
            }
            
            floodData.set(guildId, config);
            saveFloodData();
            
            return m.reply(
                `✅ **ANTI-FLOOD AKTIF!**\n\n` +
                `📊 **Pengaturan:**\n` +
                `• Limit: ${limit} pesan\n` +
                `• Waktu: ${time} detik\n` +
                `• Peringatan: ${config.warningMessage ? '✅ Diatur' : '❌ Default'}\n\n` +
                `🛡️ Server aman dari spam!`
            );
        }
        
        // OFF
        if (subCommand === 'off') {
            const config = floodData.get(guildId);
            if (!config) {
                return m.reply('❌ Anti-flood belum diaktifkan!');
            }
            
            config.enabled = false;
            floodData.set(guildId, config);
            saveFloodData();
            
            // Bersihkan data user messages untuk server ini
            for (const [key] of userMessages) {
                if (key.startsWith(guildId)) {
                    userMessages.delete(key);
                }
            }
            
            return m.reply('🔴 **ANTI-FLOOD NONAKTIF!**\n\nServer sudah tidak terproteksi dari spam.');
        }
        
        // SETLIMIT
        if (subCommand === 'setlimit') {
            const limit = parseInt(args[1]);
            if (!limit || limit < 1 || limit > 20) {
                return m.reply('❌ Masukkan batas yang valid (1-20)!');
            }
            
            const config = floodData.get(guildId);
            if (!config || !config.enabled) {
                return m.reply('❌ Anti-flood belum diaktifkan! Gunakan `.antiflood on` terlebih dahulu.');
            }
            
            config.limit = limit;
            floodData.set(guildId, config);
            saveFloodData();
            
            return m.reply(`✅ Batas pesan diubah menjadi **${limit}** pesan per ${config.time} detik!`);
        }
        
        // SETTIME
        if (subCommand === 'settime') {
            const time = parseInt(args[1]);
            if (!time || time < 1 || time > 60) {
                return m.reply('❌ Masukkan waktu yang valid (1-60 detik)!');
            }
            
            const config = floodData.get(guildId);
            if (!config || !config.enabled) {
                return m.reply('❌ Anti-flood belum diaktifkan! Gunakan `.antiflood on` terlebih dahulu.');
            }
            
            config.time = time;
            floodData.set(guildId, config);
            saveFloodData();
            
            return m.reply(`✅ Waktu diubah menjadi **${time}** detik!`);
        }
        
        // SETWARN
        if (subCommand === 'setwarn') {
            const warningMessage = args.slice(1).join(' ');
            if (!warningMessage) {
                return m.reply('❌ Masukkan pesan peringatan!\nContoh: `.antiflood setwarn Jangan spam ya!`');
            }
            
            const config = floodData.get(guildId);
            if (!config || !config.enabled) {
                return m.reply('❌ Anti-flood belum diaktifkan! Gunakan `.antiflood on` terlebih dahulu.');
            }
            
            config.warningMessage = warningMessage;
            floodData.set(guildId, config);
            saveFloodData();
            
            return m.reply(`✅ Pesan peringatan diubah menjadi:\n\n${warningMessage}`);
        }
        
        // Reset
        if (subCommand === 'reset') {
            floodData.delete(guildId);
            saveFloodData();
            
            // Bersihkan data user messages untuk server ini
            for (const [key] of userMessages) {
                if (key.startsWith(guildId)) {
                    userMessages.delete(key);
                }
            }
            
            return m.reply('🔄 **ANTI-FLOOD DI-RESET!**\n\nSemua pengaturan telah dihapus.');
        }
        
        return m.reply(
            `❌ Perintah tidak dikenal!\n\n` +
            `📝 **Penggunaan:**\n` +
            `• ${prefix}antiflood on [limit] [time] - Mengaktifkan\n` +
            `• ${prefix}antiflood off - Menonaktifkan\n` +
            `• ${prefix}antiflood setlimit [jumlah] - Ubah batas\n` +
            `• ${prefix}antiflood settime [detik] - Ubah waktu\n` +
            `• ${prefix}antiflood setwarn [pesan] - Ubah pesan peringatan\n` +
            `• ${prefix}antiflood reset - Reset semua pengaturan`
        );
        
    } catch (error) {
        console.error('AntiFlood Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

// Middleware untuk mengecek flood
async function floodMiddleware(message, client) {
    try {
        if (!message.guild) return true;
        if (message.author.bot) return true;
        
        const guildId = message.guild.id;
        const config = floodData.get(guildId);
        
        // Cek apakah antiflood aktif
        if (!config || !config.enabled) return true;
        
        // Skip untuk admin
        if (message.member.permissions.has('Administrator') || 
            message.member.permissions.has('ManageMessages')) {
            return true;
        }
        
        // Cek flood
        const isFlooding = checkFlood(guildId, message.author.id, config);
        
        if (isFlooding) {
            // Hapus pesan spam
            await message.delete().catch(() => {});
            
            // Kirim peringatan
            await sendWarning(message, message.author, config);
            
            // Log
            console.log(`🚫 Flood detected: ${message.author.tag} in ${message.guild.name}`);
            
            return false; // Blokir pesan
        }
        
        return true;
        
    } catch (error) {
        console.error('Flood Middleware Error:', error);
        return true; // Jika error, izinkan pesan
    }
}

export { 
    pluginConfig as config, 
    handler,
    floodMiddleware
}