/**
 * Cap Watcher — Event Plugin
 * -----------------------------
 * Kalau user yang punya julukan (cap) ngirim pesan, bot nyeletuk otomatis
 * nyebut julukannya.
 *
 * 🐛 FIX: sekarang cap cuma berlaku SATU KALI PAKAI. Begitu orangnya kirim
 * pesan dan bot udah nyeletuk (di hari itu), cap-nya langsung DIHAPUS —
 * gak nempel/roasting terus-terusan tiap hari. Kalau mau di-cap lagi,
 * tinggal `.cap @user <julukan>` ulang.
 */
import { getCap, removeCap } from '../../lib/capStore.js';

const pluginConfig = {
    name: 'capWatcher',
    alias: [],
    category: 'event',
    description: 'Bot menyeletuk sekali memakai julukan (cap) seseorang lalu cap-nya otomatis hilang',
    usage: 'otomatis (tidak dipanggil via command)',
    example: '-',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

const event = 'messageCreate';

const CAP_REACTIONS = [
    'lariii ada {cap} 🤓',
    'awas ada {cap} lewat!',
    'eh {cap} nongol lagi 👀',
    'waduh, {cap} dateng 😭',
];

async function handler(message) {
    try {
        if (message.author.bot) return;
        if (!message.guild) return;

        const cap = getCap(message.guild.id, message.author.id);
        if (!cap) return;

        // Langsung hapus cap-nya SEBELUM reply, biar gak keproses dobel
        // kalau ada 2 pesan masuk hampir bersamaan.
        removeCap(message.guild.id, message.author.id);

        const template = CAP_REACTIONS[Math.floor(Math.random() * CAP_REACTIONS.length)];
        await message.reply(template.replace('{cap}', cap.label));
    } catch (error) {
        console.error('CapWatcher Error:', error);
    }
}

export { pluginConfig as config, event, handler };
