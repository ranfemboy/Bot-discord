import { reviveStreak } from '../../lib/streakStore.js';

const pluginConfig = {
    name: 'pulihkanstreak',
    alias: ['revivestreak', 'restorestreak'],
    category: 'fun',
    description: 'Memulihkan streak yang sudah mati (maksimal 3x per pasangan)',
    usage: '.pulihkanstreak @user',
    example: '.pulihkanstreak @Fana',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    isEnabled: true,
};

async function handler(m) {
    try {
        const target = m.mentions.users.first();
        if (!target) {
            return m.reply('❌ Tag orang yang streak-nya mau dipulihin! Contoh: `.pulihkanstreak @Fana`');
        }
        if (target.id === m.author.id) {
            return m.reply('❌ Gak valid, kamu gak streak-an sama diri sendiri.');
        }

        const result = reviveStreak(m.author.id, target.id);

        if (!result.ok) {
            if (result.reason === 'not_dead') {
                const label = result.status === 'abu' ? '🌫️ abu-abu' : result.status === 'belum_pernah' ? '⚪ belum pernah dimulai' : '🔥 nyala';
                return m.reply(`❌ Streak kamu sama ${target} statusnya ${label}, gak perlu/gak bisa dipulihin.`);
            }
            if (result.reason === 'no_revives') {
                return m.reply(`❌ Jatah pulihin streak sama ${target} udah abis (0/3). Mulai baru aja lewat \`.streak @user\`.`);
            }
            return m.reply('❌ Gagal memulihkan streak.');
        }

        await m.reply(`✨ Streak sama ${target} berhasil dipulihkan ke **${result.streak}** hari! Sisa jatah pulihkan: **${result.revivesLeft}/3** 🔥`);
    } catch (error) {
        console.error('Pulihkanstreak Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
