import { getCustomWords } from '../../lib/toxicStore.js';

export const config = {
    name: 'listtoxic',
    alias: ['toxiclist'],
    category: 'admin',
    description: 'Liat daftar kata toxic custom yang ditambahin di server ini',
    usage: '.listtoxic',
    example: '.listtoxic',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
};

export async function handler(m) {
    const words = getCustomWords(m.guild.id);
    if (!words.length) {
        return m.reply('📭 Belum ada kata toxic custom yang ditambahin di server ini.\n> (Filter bawaan tetep jalan walau list ini kosong)');
    }
    return m.reply(`📋 **Kata toxic custom** (${words.length}):\n${words.map((w) => `\`${w}\``).join(', ')}`);
}