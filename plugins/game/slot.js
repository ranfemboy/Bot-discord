// plugins/casino/slot.js
/**
 * Slot Machine — Discord version
 * -----------------------------
 * Judi slot 3 gulungan, 5000 💵 sekali putar (potong dari economyStore).
 * Simbol kombinasi menang: 🍌🍌🍌 (Common), 🍇🍇🍇 (Epic), 💎💎💎 (Legendary).
 * Pesan awal di-reply lalu di-edit jadi hasil akhir, semua pakai embed.
 */
import { EmbedBuilder } from 'discord.js';
import { getUser, removeMoney, addMoney } from '../../lib/economyStore.js';

const SLOT_COST = 5000;

// 🎰 Simbol + bobot kemunculan (makin besar weight, makin sering muncul)
const SYMBOLS = [
    { emoji: '🍒', weight: 25 },
    { emoji: '🍋', weight: 25 },
    { emoji: '🔔', weight: 20 },
    { emoji: '🍌', weight: 15 }, // Common
    { emoji: '🍇', weight: 10 }, // Epic
    { emoji: '💎', weight: 5 },  // Legendary
];

// 🏆 Kombinasi menang: 3 simbol sama
const WIN_TABLE = {
    '🍌': { label: 'COMMON', emoji: '⚪', reward: 1000 },
    '🍇': { label: 'EPIC', emoji: '💎', reward: 1500 },
    '💎': { label: 'LEGENDARY', emoji: '🌟', reward: 2500 },
};

export const config = {
    name: 'slot',
    alias: ['slotmachine', 'judi'],
    category: 'game',
    description: 'Judi mesin slot, 5000 💵 sekali putar',
    usage: '.slot',
    example: '.slot',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

function spinSymbol() {
    const totalWeight = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const s of SYMBOLS) {
        if (roll < s.weight) return s.emoji;
        roll -= s.weight;
    }
    return SYMBOLS[0].emoji;
}

function spinReels() {
    return [spinSymbol(), spinSymbol(), spinSymbol()];
}

function loadingEmbed(m) {
    return new EmbedBuilder()
        .setColor('#95A5A6')
        .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
        .setTitle('🎰 SLOT MACHINE')
        .setDescription('```\n[ 🎲 | 🎲 | 🎲 ]\n```\n🌀 Memutar gulungan...');
}

function resultEmbed(m, { reels, win, remaining }) {
    const reelText = `\`\`\`\n[ ${reels[0]} | ${reels[1]} | ${reels[2]} ]\n\`\`\``;

    const embed = new EmbedBuilder()
        .setAuthor({ name: m.author.username, iconURL: m.author.displayAvatarURL({ dynamic: true }) })
        .setTitle('🎰 SLOT MACHINE')
        .setDescription(reelText)
        .addFields(
            { name: '💸 Modal Putar', value: `${SLOT_COST.toLocaleString('id-ID')} 💵`, inline: true },
            { name: '💰 Sisa Uang', value: `${remaining.toLocaleString('id-ID')} 💵`, inline: true }
        )
        .setTimestamp();

    if (win) {
        embed.setColor('#2ECC71');
        embed.addFields({
            name: `🎉 JACKPOT! ${win.emoji} ${win.label}`,
            value: `+${win.reward.toLocaleString('id-ID')} 💵`,
        });
    } else {
        embed.setColor('#E74C3C');
        embed.addFields({ name: '😔 Coba Lagi', value: 'Gulungan tidak cocok, uang taruhan hangus.' });
    }

    return embed;
}

export async function handler(m) {
    try {
        const user = getUser(m.guild.id, m.author.id);
        if (user.money < SLOT_COST) {
            return m.reply(
                `❌ Uang kamu tidak cukup!\n\n` +
                `💸 Butuh : ${SLOT_COST.toLocaleString('id-ID')} 💵\n` +
                `💰 Kamu punya : ${user.money.toLocaleString('id-ID')} 💵`
            );
        }

        removeMoney(m.guild.id, m.author.id, SLOT_COST);

        const sent = await m.reply({ embeds: [loadingEmbed(m)] });

        setTimeout(async () => {
            try {
                const reels = spinReels();
                let win = null;

                if (reels[0] === reels[1] && reels[1] === reels[2] && WIN_TABLE[reels[0]]) {
                    win = WIN_TABLE[reels[0]];
                    addMoney(m.guild.id, m.author.id, win.reward);
                }

                const remaining = getUser(m.guild.id, m.author.id).money;

                await sent.edit({ embeds: [resultEmbed(m, { reels, win, remaining })] });
            } catch (err) {
                console.error('slot spin error:', err);
            }
        }, 1500);
    } catch (err) {
        console.error('slot error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}