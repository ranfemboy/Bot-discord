import { EmbedBuilder } from 'discord.js';
import { lightStreak, listStreaksForUser } from '../../lib/streakStore.js';

const pluginConfig = {
    name: 'streak',
    alias: ['streakku'],
    category: 'fun',
    description: 'Nyalain streak harian sama user lain, atau lihat semua streak kamu',
    usage: '.streak [@user]',
    example: '.streak @Fana',
    isOwner: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    isEnabled: true,
};

const STATUS_EMOJI = { nyala: '🔥', abu: '🌫️', mati: '💀', belum_pernah: '⚪' };
const STATUS_LABEL = { nyala: 'Nyala hari ini', abu: 'Abu-abu, butuh nyalain!', mati: 'Mati', belum_pernah: 'Belum pernah' };

async function handler(m) {
    try {
        const target = m.mentions.users.first();

        // 📋 Mode lihat semua streak
        if (!target) {
            const list = listStreaksForUser(m.author.id);
            if (!list.length) {
                return m.reply('📭 Kamu belum punya streak sama siapapun. Coba `.streak @user` buat mulai! 🔥');
            }

            const lines = list.map((s) => {
                const emoji = STATUS_EMOJI[s.status];
                const label = STATUS_LABEL[s.status];
                const reviveNote = s.status === 'mati' && s.revivesLeft > 0 ? ` _(bisa dipulihin, sisa ${s.revivesLeft}x)_` : '';
                return `${emoji} <@${s.partnerId}> — **${s.streak}** hari _(${label})_${reviveNote}`;
            });

            const embed = new EmbedBuilder()
                .setColor('#E67E22')
                .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
                .setTitle('🔥 STREAK KAMU')
                .setDescription(lines.join('\n').slice(0, 4000))
                .setFooter({ text: 'Ketik .streak @user buat nyalain hari ini' })
                .setTimestamp();

            return m.reply({ embeds: [embed] });
        }

        if (target.bot) return m.reply('❌ Gak bisa streak-an sama bot 😅');
        if (target.id === m.author.id) return m.reply('❌ Gak bisa streak-an sama diri sendiri 😅');

        const result = lightStreak(m.author.id, target.id);

        if (result.status === 'already') {
            return m.reply(`✅ Kalian udah nyalain streak hari ini! Streak sekarang: **${result.streak}** hari 🔥. Besok nyalain lagi ya~`);
        }

        const messages = {
            new: `🔥 Streak baru dimulai sama ${target}! Hari ke-**1**. Jangan lupa nyalain tiap hari ya!`,
            continued: `🔥 Mantap! Streak sama ${target} lanjut ke hari ke-**${result.streak}**!`,
            restarted: `😢 Streak lama sama ${target} udah mati, tapi tenang — mulai lagi dari hari ke-**1**! (Bisa dipulihin lewat \`.pulihkanstreak\` kalau masih ada jatah)`,
        };

        await m.reply(messages[result.status] || `🔥 Streak sama ${target} sekarang: ${result.streak} hari.`);
    } catch (error) {
        console.error('Streak Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };
