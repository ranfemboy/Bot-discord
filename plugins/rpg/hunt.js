import { getUser } from '../../lib/economyStore.js';
import { ANIMALS, resolveAnimal } from '../../lib/rpgData.js';
import { createHuntJob, buildInitialHuntMessage } from '../../lib/huntStore.js';

const pluginConfig = {
    name: 'hunt',
    alias: ['berburu'],
    category: 'rpg',
    description: 'Berburu hewan pakai Pedang atau Busur untuk dapat uang',
    usage: '.hunt <nama hewan>',
    example: '.hunt ayam',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 8,
    isEnabled: true,
};

async function handler(m, { args }) {
    try {
        const query = args.join(' ').trim();
        if (!query) {
            const list = Object.values(ANIMALS)
                .map((a) => `${a.emoji} **${a.label}** — butuh ${a.arrows} 🎯 panah (kalau pakai Busur)`)
                .join('\n');
            return m.reply(`🐾 *DAFTAR HEWAN BURUAN*\n\n${list}\n\nContoh: \`.hunt ayam\``);
        }

        const resolved = resolveAnimal(query);
        if (!resolved) {
            return m.reply(`❌ Hewan **${query}** tidak dikenal. Ketik \`.hunt\` buat lihat daftarnya 🐾`);
        }
        const { key: animalKey, animal } = resolved;

        const user = getUser(m.guild.id, m.author.id);

        if (!user.weapons.busur && !user.weapons.pedang) {
            return m.reply('❌ Kamu belum punya senjata! Beli **Pedang** 🗡️ atau **Busur** 🏹 dulu di `.shop`.');
        }
        if (user.hp <= 0) {
            return m.reply('💀 HP kamu habis! Gunakan `.heal` dulu sebelum berburu lagi.');
        }

        const jobId = createHuntJob(animalKey, m.author.id, m.guild.id);
        await m.reply(buildInitialHuntMessage(jobId, animal));
    } catch (error) {
        console.error('Hunt Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };