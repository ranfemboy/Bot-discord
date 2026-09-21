/**
 * Webtoon Search — Discord version
 * -----------------------------
 * Fitur baru sesuai webtoon_search.txt: sama polanya kayak plugins/anime/komiku.js
 * tapi pakai API https://api.azbry.com/api/library/webtoon-search.
 *
 * ⚠️ PENTING: saya tidak berhasil menemukan dokumentasi resmi API azbry.com
 * ini, jadi lib/webtoonApi.js ditulis defensif (nyoba beberapa nama field
 * yang umum). Kalau nanti hasil `.webtoon <judul>` datanya kosong/aneh,
 * cek console log error-nya (bakal nampilin raw response API), lalu
 * sesuaikan daftar field di `normalizeItem()` pada lib/webtoonApi.js.
 */
import { EmbedBuilder } from 'discord.js';
import { searchWebtoon } from '../../lib/webtoonApi.js';

export const config = {
    name: 'webtoon',
    alias: ['toon'],
    category: 'anime',
    description: 'Cari webtoon/manhwa dari library Azbry',
    usage: '.webtoon <judul>',
    example: '.webtoon tower of god',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true,
};

export async function handler(m, { args, prefix }) {
    const keyword = args.join(' ');

    if (!keyword) {
        return m.reply(
            `📖 **WEBTOON SEARCH**\n\n` +
            `\`${prefix}webtoon <judul>\`\n\n` +
            `Contoh: \`${prefix}webtoon tower of god\``
        );
    }

    const loadingMsg = await m.reply('🔍 Mencari...');

    try {
        const results = await searchWebtoon(keyword);

        const embed = new EmbedBuilder()
            .setColor('#00D563')
            .setTitle(`📖 Hasil Pencarian: ${keyword}`)
            .setDescription(
                results
                    .slice(0, 10)
                    .map((r, i) => `**${i + 1}. ${r.title}**\n${r.genre !== '-' ? `🏷️ ${r.genre} • ` : ''}${r.status}\n${r.url || ''}`)
                    .join('\n\n')
            );

        if (results[0]?.thumbnail) embed.setThumbnail(results[0].thumbnail);

        await loadingMsg.edit({ content: '', embeds: [embed] });
    } catch (error) {
        console.error('Webtoon Search Error:', error, error.rawResponse ? { rawResponse: error.rawResponse } : '');
        await loadingMsg.edit(
            '❌ Gagal mencari webtoon: ' + error.message +
            '\n> (owner: cek log console, kemungkinan format response API berubah)'
        );
    }
}
