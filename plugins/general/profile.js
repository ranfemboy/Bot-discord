import { AttachmentBuilder } from 'discord.js';
import { getUserData, calculateLevel, getGuildLeaderboard } from '../../lib/levelStore.js';
import { getUser } from '../../lib/economyStore.js';
import { renderProfileCard } from '../../lib/canvas/profileCanvas.js';

const pluginConfig = {
    name: 'profile',
    alias: ['rank', 'level', 'me'],
    category: 'general',
    description: 'Menampilkan profil level, exp, senjata & inventory kamu dalam bentuk kartu gambar',
    usage: '.profile [@user]',
    example: '.profile @Budi',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    try {
        const target = m.mentions.users.first() || m.author;
        const levelData = getUserData(m.guild.id, target.id);
        const { level, currentXp, neededXp } = calculateLevel(levelData.xp);

        const leaderboard = getGuildLeaderboard(m.guild.id);
        const rank = leaderboard.findIndex(u => u.userId === target.id) + 1;
        const eco = getUser(m.guild.id, target.id);

        const percentage = Math.round((currentXp / neededXp) * 100);
        const xpLeft = neededXp - currentXp;

        let rankText;
        if (rank === 1) {
            rankText = 'Posisi puncak leaderboard server ini, **#1**! 👑';
        } else if (rank >= 2 && rank <= 3) {
            rankText = `Peringkat **#${rank}** leaderboard server ini, mantap! 🔥`;
        } else if (rank > 3) {
            rankText = `Peringkat **#${rank}** leaderboard server ini.`;
        } else {
            rankText = 'Belum masuk leaderboard, terus kumpulin XP ya!';
        }

        const caption =
            `📊 *Profil ${target.username}*\n\n` +
            `⭐ Level **${level}** — ✨ **${levelData.xp} XP**\n` +
            `📈 Progress: **${percentage}%** (butuh **${xpLeft} XP** lagi ke level berikutnya)\n` +
            `🏆 ${rankText}\n` +
            `💰 Uang: **${eco.money.toLocaleString('id-ID')}** 💵\n` +
            `❤️ HP: **${eco.hp} / ${eco.maxHp}**\n\n` +
            `Ketik *.inventory* buat lihat perlengkapanmu! 🎒`;

        const buffer = await renderProfileCard({
            username: target.username,
            avatarURL: target.displayAvatarURL({ extension: 'png', size: 256 }),
            level,
            currentXp,
            neededXp,
            rank: rank || '-',
            weapons: eco.weapons,
            arrows: eco.arrows,
            potions: eco.potions,
        });

        const attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });
        await m.reply({ content: caption, files: [attachment] });
    } catch (error) {
        console.error('Profile Plugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler }