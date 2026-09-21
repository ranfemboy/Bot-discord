/**
 * Nimegami — Discord version
 * -----------------------------
 * Dikonversi dari nimegami.js (tadinya module Express handler + CLI).
 * Bagian req/res Express & CLI dibuang karena gak relevan buat bot Discord,
 * cuma logic scraper-nya (class Nimegami -> lib/nimegamiApi.js) yang dipakai.
 */
import { EmbedBuilder } from 'discord.js';
import { NimegamiAPI } from '../../lib/nimegamiApi.js';

const nimegami = new NimegamiAPI();

export const config = {
    name: 'nimegami',
    alias: ['nime'],
    category: 'anime',
    description: 'Cari anime & lihat detail/link download dari Nimegami',
    usage: '.nimegami <judul> / .nimegami detail <url>',
    example: '.nimegami solo leveling',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 1,
    isEnabled: true,
};

export async function handler(m, { args, prefix }) {
    const subcommand = (args[0] || '').toLowerCase();

    // .nimegami detail <url>
    if (subcommand === 'detail') {
        const url = args[1];
        if (!url) return m.reply(`❌ Sertakan URL-nya.\n\n> \`${prefix}nimegami detail <url>\``);

        const loadingMsg = await m.reply('🔍 Mengambil detail...');
        try {
            const detail = await nimegami.detail(url);
            const embed = new EmbedBuilder()
                .setColor('#FF6B9D')
                .setTitle(detail.title || '-')
                .setDescription((detail.synopsis || '-').slice(0, 500))
                .addFields({
                    name: '📥 Link Download',
                    value: detail.downloads.length
                        ? detail.downloads.map((d) => `[${d.server}](${d.url})`).join('\n').slice(0, 1000)
                        : 'Tidak ada link ditemukan',
                });
            if (detail.video) embed.addFields({ name: '🎬 Streaming', value: detail.video });

            await loadingMsg.edit({ content: '', embeds: [embed] });
        } catch (error) {
            console.error('Nimegami Detail Error:', error);
            await loadingMsg.edit('❌ Gagal mengambil detail: ' + error.message);
        }
        return;
    }

    // .nimegami <judul>
    const keyword = args.join(' ');
    if (!keyword) {
        return m.reply(
            `🎬 **NIMEGAMI**\n\n` +
            `\`${prefix}nimegami <judul>\` — cari anime\n` +
            `\`${prefix}nimegami detail <url>\` — lihat detail & link download\n\n` +
            `Contoh: \`${prefix}nimegami solo leveling\``
        );
    }

    const loadingMsg = await m.reply('🔍 Mencari...');
    try {
        const results = await nimegami.search(keyword);
        if (!results.length) {
            return loadingMsg.edit('❌ Gak ketemu, coba kata kunci lain.');
        }

        const embed = new EmbedBuilder()
            .setColor('#FF6B9D')
            .setTitle(`🎬 Hasil Pencarian: ${keyword}`)
            .setDescription(
                results
                    .map((r, i) => `**${i + 1}. ${r.title}**\n${r.link}`)
                    .join('\n\n')
            )
            .setFooter({ text: `Ketik ${prefix}nimegami detail <url> buat lihat detailnya` });

        if (results[0]?.image) embed.setThumbnail(results[0].image);

        await loadingMsg.edit({ content: '', embeds: [embed] });
    } catch (error) {
        console.error('Nimegami Search Error:', error);
        await loadingMsg.edit('❌ Gagal mencari: ' + error.message);
    }
}
