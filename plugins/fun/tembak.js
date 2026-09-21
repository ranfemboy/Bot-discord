/**
 * Tembak — Discord version
 * -----------------------------
 * Dikonversi dari tembak.js (WA, pakai JID/global.tembakSessions/db custom).
 * Di Discord: target lewat mention (@user), data disimpan per-guild lewat
 * lib/coupleStore.js (JSON file, pola sama kayak lib/economyStore.js).
 */
import { getUser, setUser, createTembakSession, deleteSession } from '../../lib/coupleStore.js';

export const config = {
    name: 'tembak',
    alias: ['nembak', 'propose'],
    category: 'fun',
    description: 'Menembak seseorang untuk pacaran',
    usage: '.tembak @user',
    example: '.tembak @Budi',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true,
};

export async function handler(m, { prefix }) {
    const target = m.mentions.users.first();

    if (!target) {
        return m.reply(
            `⚠️ **CARA PAKAI**\n\n` +
            `> \`${prefix}tembak @user\`\n\n` +
            `Contoh: \`${prefix}tembak @Budi\``
        );
    }

    if (target.id === m.author.id) {
        return m.reply('❌ Tidak bisa menembak diri sendiri!');
    }

    if (target.bot) {
        return m.reply('❌ Bot tidak bisa pacaran!');
    }

    const guildId = m.guild.id;
    const sender = getUser(guildId, m.author.id);
    const targetData = getUser(guildId, target.id);

    // Sender udah punya pasangan?
    if (sender.pasangan) {
        const partner = getUser(guildId, sender.pasangan);
        if (partner.pasangan === m.author.id) {
            return m.reply(
                `❌ **SUDAH PUNYA PASANGAN**\n\n` +
                `Pasanganmu: <@${sender.pasangan}>\n` +
                `Putus dulu ya sebelum menembak orang lain.`
            );
        }
    }

    // Target udah punya pasangan?
    if (targetData.pasangan && targetData.pasangan !== m.author.id) {
        const targetPartner = getUser(guildId, targetData.pasangan);
        if (targetPartner.pasangan === target.id) {
            return m.reply(`💔 **DIA SUDAH PACARAN**\n\nPasangannya: <@${targetData.pasangan}>`);
        }
    }

    // Kalau ternyata target juga lagi nembak balik / udah nunggu jawaban dari sender -> langsung jadian
    if (targetData.tembakTarget === m.author.id || targetData.pasangan === m.author.id) {
        sender.pasangan = target.id;
        targetData.pasangan = m.author.id;
        setUser(guildId, m.author.id, sender);
        setUser(guildId, target.id, targetData);
        deleteSession(guildId, m.channel.id, target.id);

        await m.react('💕').catch(() => {});
        return m.reply(`💕 **CIE CIEE!**\n\n<@${m.author.id}> dan <@${target.id}> resmi pacaran! Semoga langgeng yak! 💍`);
    }

    sender.tembakTarget = target.id;
    sender.tembakCount = (sender.tembakCount || 0) + 1;
    setUser(guildId, m.author.id, sender);

    createTembakSession(guildId, m.channel.id, m.author.id, target.id);

    await m.react('💘').catch(() => {});
    await m.reply(
        `💘 **ADA YANG NEMBAK NIH!**\n\n` +
        `Hei <@${target.id}>, kamu ditembak oleh <@${m.author.id}> nih!\n\n` +
        `⏱️ Berlaku **1 jam** dari sekarang\n` +
        `Gunakan: \`${prefix}terima\` atau \`${prefix}tolak\``
    );
}
