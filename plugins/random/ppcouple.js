/**
 * PP Couple — Discord version
 * -----------------------------
 * Dikonversi dari plugin WA couple.js (pakai `sock`/`albumMessage`) ke
 * format command Discord.js bot ini (config + handler(m, {client, args})).
 * Karena Discord gak punya konsep "album message" kayak WA, dua gambar
 * dikirim sebagai 2 embed sekaligus dalam 1 pesan (ke-render bertumpuk).
 *
 * 🔄 UPDATE: sumber foto diganti dari API eksternal (api.deline.web.id)
 * jadi ambil langsung dari folder GitHub repo sendiri
 * (github.com/cakrasukacoding/bot-assets, folder cowo/ & cewe/) lewat
 * lib/githubImageStore.js.
 */
import { EmbedBuilder } from 'discord.js';
import { getRandomCouplePair } from '../../lib/githubImageStore.js';

export const config = {
    name: 'ppcouple',
    alias: ['cp', 'ppcp'],
    category: 'random',
    description: 'Random gambar pp couple (foto profil pasangan)',
    usage: '.ppcouple',
    example: '.ppcouple',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true,
};

export async function handler(m) {
    try {
        const data = await getRandomCouplePair();

        const embedCowo = new EmbedBuilder().setColor('#89CFF0').setImage(data.cowo);
        const embedCewe = new EmbedBuilder().setColor('#FFB6C1').setImage(data.cewe);

        await m.reply({ content: '💑 **PP COUPLE**', embeds: [embedCowo, embedCewe] });
    } catch (error) {
        console.error('PPCouple Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}