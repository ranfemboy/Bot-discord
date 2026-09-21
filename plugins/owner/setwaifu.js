/**
 * Set Waifu — Owner Only
 * -----------------------------
 * Paksa nikahin user tertentu sama waifu pilihan, tanpa lewat proses gacha.
 * Otomatis ngurus registry exclusivity (lepas kepemilikan lama kalau ada
 * yang udah "punya" waifu itu, dan lepas istri lama target kalau beda).
 */
import { getUser, setUser, setIstri, clearIstri, getWaifuOwner, registerWaifuMarriage, releaseWaifuMarriage } from '../../lib/waifuStore.js';
import { findWaifuByName, RARITIES } from '../../lib/customWaifuStore.js';
import { rarityEmoji } from '../../lib/waifuData.js';

export const config = {
    name: 'setwaifu',
    alias: ['setistri', 'forcewaifu'],
    category: 'owner',
    description: 'Paksa set istri (waifu) untuk user tertentu (owner only)',
    usage: '.setwaifu @user <nama waifu>',
    example: '.setwaifu @Budi Rem',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

export async function handler(m, { args }) {
    try {
        const target = m.mentions?.users?.first();
        if (!target) {
            return m.reply(
                `📌 *CARA PAKAI .setwaifu*\n\n` +
                `\`.setwaifu @user <nama waifu>\`\n\n` +
                `📝 Contoh:\n\`.setwaifu @Budi Rem\`\n\n` +
                `Waifu-nya harus udah ada di pool (bawaan atau hasil *.addwaifu*).`
            );
        }

        // Buang bagian mention dari args, sisanya nama waifu
        const nama = args.filter((a) => !a.startsWith('<@')).join(' ').trim();
        if (!nama) {
            return m.reply('❌ Nama waifu belum diisi. Contoh: `.setwaifu @Budi Rem`');
        }

        const waifuInfo = findWaifuByName(nama);
        if (!waifuInfo) {
            return m.reply(
                `❌ Waifu *${nama}* gak ketemu di pool.\n\n` +
                `Kalau ini waifu baru, tambahin dulu pakai:\n\`.addwaifu ${nama}|<anime>|<rarity>\`\n\n` +
                `🎲 Rarity valid: ${RARITIES.join(', ')}`
            );
        }

        const guildId = m.guild.id;

        // 🔓 Kalau waifu ini udah "diambil" orang lain, lepas dulu kepemilikan lamanya
        const currentOwner = getWaifuOwner(guildId, waifuInfo.name);
        if (currentOwner && currentOwner.userId !== target.id) {
            const prevUser = getUser(guildId, currentOwner.userId);
            if (prevUser.istri?.name?.toLowerCase() === waifuInfo.name.toLowerCase()) {
                clearIstri(guildId, currentOwner.userId);
            }
            releaseWaifuMarriage(guildId, waifuInfo.name);
        }

        // 💔 Kalau target udah punya istri lain, lepas registry istri lamanya
        const targetUser = getUser(guildId, target.id);
        if (targetUser.istri?.name && targetUser.istri.name.toLowerCase() !== waifuInfo.name.toLowerCase()) {
            releaseWaifuMarriage(guildId, targetUser.istri.name);
        }

        const istri = setIstri(guildId, target.id, {
            name: waifuInfo.name,
            anime: waifuInfo.anime,
            rarity: waifuInfo.rarity,
            affection: 0,
            totalDate: 0,
            totalGift: 0,
        });
        registerWaifuMarriage(guildId, istri.name, target.id);

        // 📦 Pastiin waifu ini juga masuk koleksi target biar konsisten sama .koleksiwaifu
        const refreshedUser = getUser(guildId, target.id);
        if (!refreshedUser.collection.some((w) => w.name.toLowerCase() === istri.name.toLowerCase())) {
            refreshedUser.collection.push(istri);
            setUser(guildId, target.id, refreshedUser);
        }

        let text = `✅ *SET WAIFU BERHASIL* ✅\n\n`;
        text += `👤 User : <@${target.id}>\n`;
        text += `💍 Waifu : *${istri.name}* (${istri.anime}) ${rarityEmoji(istri.rarity)}\n\n`;
        text += `<@${target.id}> sekarang resmi menikah dengan *${istri.name}*! 💕`;

        return m.reply(text);
    } catch (err) {
        console.error('setwaifu error:', err);
        return m.reply('❌ ERROR\n\n> ' + err.message);
    }
}
