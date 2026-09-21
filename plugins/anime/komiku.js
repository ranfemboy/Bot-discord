import fs from 'fs';
import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    AttachmentBuilder,
} from 'discord.js';
import { KomikuAPI, getBufferFast, downloadImageFast, TMP_DIR } from '../../lib/komikuApi.js';
import { createSession, getSession, getPageItems, goToNextPage } from '../../lib/komikuSessionStore.js';

const komiku = new KomikuAPI();

export const config = {
    name: 'komiku',
    alias: ['manga'],
    category: 'anime',
    description: 'Cari & download manga/manhwa/manhua dari Komiku',
    usage: 'search <judul>',
    example: 'komiku search one piece',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

// ────────────────────────────────
// 🧩 Helper bikin komponen (select menu + tombol next page)
// ────────────────────────────────

function buildSearchComponents(sessionId, pageData) {
    const options = pageData.items.map((item, idx) => ({
        label: (item.title || 'Tanpa judul').slice(0, 100),
        description: `${item.type || 'Manga'} • ${(item.latest_chapter?.title || 'No chapter').slice(0, 70)}`,
        value: `${sessionId}:${pageData.page * 25 + idx}`,
    }));

    const rows = [
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`komikuSearchSelect_${sessionId}`)
                .setPlaceholder('📖 Pilih series buat lihat detail')
                .addOptions(options)
        ),
    ];

    if (pageData.hasNext) {
        rows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`komikuSearchPage_${sessionId}`)
                    .setLabel('Halaman berikutnya ➡')
                    .setStyle(ButtonStyle.Success)
            )
        );
    }

    return rows;
}

function buildChapterComponents(sessionId, pageData) {
    const options = pageData.items.map((ch, idx) => ({
        label: (ch.chapter_number || `Chapter ${idx + 1}`).slice(0, 100),
        description: (ch.date || 'No date').slice(0, 100),
        value: `${sessionId}:${pageData.page * 25 + idx}`,
    }));

    const rows = [
        new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`komikuChapterSelect_${sessionId}`)
                .setPlaceholder('📥 Pilih chapter buat download')
                .addOptions(options)
        ),
    ];

    if (pageData.hasNext) {
        rows.push(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`komikuChapterPage_${sessionId}`)
                    .setLabel('Halaman berikutnya ➡')
                    .setStyle(ButtonStyle.Success)
            )
        );
    }

    return rows;
}

function footerPage(pageData) {
    return `Halaman ${pageData.page + 1}/${pageData.totalPages}`;
}

// ────────────────────────────────
// 💬 Command: .komiku search <judul>
// ────────────────────────────────

export async function handler(m, { args, prefix }) {
    const subcommand = (args[0] || '').toLowerCase();
    const keyword = args.slice(1).join(' ');

    if (subcommand !== 'search' || !keyword) {
        return m.reply(
            `📚 **KOMIKU**\n\n` +
            `\`${prefix}komiku search <judul>\`\n` +
            `Cari manga/manhwa/manhua — hasil & chapter-nya tinggal dipilih lewat menu yang muncul.\n\n` +
            `Contoh: \`${prefix}komiku search one piece\``
        );
    }

    const loadingMsg = await m.reply('🔍 Mencari...');

    const result = await komiku.search(keyword);
    if (!result.status || !result.data.length) {
        return loadingMsg.edit('❌ Gak ketemu, Sensei~ Coba kata kunci lain.');
    }

    const sessionId = createSession({ type: 'search', title: keyword, items: result.data, ownerId: m.author.id });
    const pageData = getPageItems(sessionId);

    const embed = new EmbedBuilder()
        .setColor('#FEE75C')
        .setTitle(`📚 Hasil Pencarian: ${keyword}`)
        .setDescription(`Total **${result.total}** ditemukan. Pilih lewat menu di bawah ya~`)
        .setFooter({ text: footerPage(pageData) });

    await loadingMsg.edit({ content: '', embeds: [embed], components: buildSearchComponents(sessionId, pageData) });
}

// ────────────────────────────────
// 🖱 Interaction handlers (dipanggil dari index.js)
// ────────────────────────────────

function isOwnerOfSession(interaction, session) {
    return interaction.user.id === session.ownerId;
}

export async function handleKomikuSearchPage(interaction) {
    const sessionId = interaction.customId.replace('komikuSearchPage_', '');
    const session = getSession(sessionId);
    if (!session) return interaction.reply({ content: '❌ Sesi pencarian ini udah kadaluarsa, coba search ulang ya.', ephemeral: true });
    if (!isOwnerOfSession(interaction, session)) return interaction.reply({ content: '❌ Menu ini bukan buat kamu, Sensei~', ephemeral: true });

    const pageData = goToNextPage(sessionId);
    const embed = EmbedBuilder.from(interaction.message.embeds[0]).setFooter({ text: footerPage(pageData) });

    await interaction.update({ embeds: [embed], components: buildSearchComponents(sessionId, pageData) });
}

export async function handleKomikuChapterPage(interaction) {
    const sessionId = interaction.customId.replace('komikuChapterPage_', '');
    const session = getSession(sessionId);
    if (!session) return interaction.reply({ content: '❌ Sesi ini udah kadaluarsa.', ephemeral: true });
    if (!isOwnerOfSession(interaction, session)) return interaction.reply({ content: '❌ Menu ini bukan buat kamu, Sensei~', ephemeral: true });

    const pageData = goToNextPage(sessionId);
    const embed = EmbedBuilder.from(interaction.message.embeds[0]).setFooter({ text: footerPage(pageData) });

    await interaction.update({ embeds: [embed], components: buildChapterComponents(sessionId, pageData) });
}

export async function handleKomikuSearchSelect(interaction) {
    const sessionId = interaction.customId.replace('komikuSearchSelect_', '');
    const session = getSession(sessionId);
    if (!session) return interaction.reply({ content: '❌ Sesi pencarian ini udah kadaluarsa, coba search ulang ya.', ephemeral: true });
    if (!isOwnerOfSession(interaction, session)) return interaction.reply({ content: '❌ Menu ini bukan buat kamu, Sensei~', ephemeral: true });

    const [, indexStr] = interaction.values[0].split(':');
    const item = session.items[parseInt(indexStr, 10)];
    if (!item) return interaction.reply({ content: '❌ Data gak ketemu, coba search ulang.', ephemeral: true });

    await interaction.deferUpdate();

    const detail = await komiku.getDetail(item.url);
    if (!detail.status) {
        return interaction.followUp({ content: '❌ Gagal ambil detail. Mungkin server Komiku lagi bermasalah.', ephemeral: true });
    }
    if (!detail.chapters?.length) {
        return interaction.followUp({ content: '⚠️ Series ini belum ada chapter yang tersedia.', ephemeral: true });
    }

    const chapterSessionId = createSession({
        type: 'chapter',
        title: detail.title,
        items: detail.chapters,
        ownerId: interaction.user.id,
    });
    const pageData = getPageItems(chapterSessionId);

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(detail.title || '-')
        .setDescription((detail.synopsis || '-').slice(0, 400))
        .addFields(
            { name: '🎭 Tipe', value: detail.type || '-', inline: true },
            { name: '📊 Status', value: detail.status || '-', inline: true },
            { name: '⭐ Rating', value: detail.rating || '-', inline: true },
            { name: '✍️ Author', value: detail.author || '-', inline: true },
            { name: '🏷️ Genre', value: (detail.genres?.join(', ') || '-').slice(0, 1000), inline: false },
            { name: '📚 Total Chapter', value: `${detail.total_chapters}`, inline: true },
        )
        .setFooter({ text: footerPage(pageData) });

    const payload = { embeds: [embed], components: buildChapterComponents(chapterSessionId, pageData) };

    const thumbBuffer = await getBufferFast(detail.thumbnail);
    if (thumbBuffer) {
        payload.files = [new AttachmentBuilder(thumbBuffer, { name: 'thumbnail.jpg' })];
        embed.setImage('attachment://thumbnail.jpg');
    }

    await interaction.editReply(payload);
}

export async function handleKomikuChapterSelect(interaction) {
    const sessionId = interaction.customId.replace('komikuChapterSelect_', '');
    const session = getSession(sessionId);
    if (!session) return interaction.reply({ content: '❌ Sesi ini udah kadaluarsa.', ephemeral: true });
    if (!isOwnerOfSession(interaction, session)) return interaction.reply({ content: '❌ Menu ini bukan buat kamu, Sensei~', ephemeral: true });

    const [, indexStr] = interaction.values[0].split(':');
    const chapter = session.items[parseInt(indexStr, 10)];
    if (!chapter) return interaction.reply({ content: '❌ Data gak ketemu.', ephemeral: true });

    await interaction.reply(`📥 Mengambil **${chapter.chapter_number}**, mohon tunggu...`);

    const chapterData = await komiku.getChapterImages(chapter.url);
    if (!chapterData.status || !chapterData.image_urls.length) {
        return interaction.editReply('❌ Gagal ambil gambar chapter ini. Mungkin chapter-nya udah dihapus.');
    }

    const images = chapterData.image_urls;
    const cleanName = (chapterData.series || 'komiku').replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');

    const imgPaths = [];

    try {
        const limit = 10;
        for (let i = 0; i < images.length; i += limit) {
            const batch = images.slice(i, i + limit);
            const downloadPromises = batch.map((img, idx) => {
                const savePath = `${TMP_DIR}/${Date.now()}-${i + idx}-${Math.floor(Math.random() * 1000)}.jpg`;
                return downloadImageFast(img, savePath).then(() => savePath);
            });
            const results = await Promise.all(downloadPromises);
            imgPaths.push(...results);
            await interaction.editReply(`🖼️ Mengunduh halaman... **${imgPaths.length}/${images.length}**`);
        }

        if (!imgPaths.length) {
            return interaction.editReply('❌ Semua gambar gagal diunduh, coba lagi nanti.');
        }

        // 📩 Kirim per grup 10 gambar (batas maksimal attachment per pesan di Discord)
        const GROUP_SIZE = 10;
        const totalGroups = Math.ceil(imgPaths.length / GROUP_SIZE);

        for (let g = 0; g < totalGroups; g++) {
            const groupPaths = imgPaths.slice(g * GROUP_SIZE, g * GROUP_SIZE + GROUP_SIZE);
            const attachments = groupPaths.map((p, idx) =>
                new AttachmentBuilder(p, { name: `${cleanName}-hal-${g * GROUP_SIZE + idx + 1}.jpg` })
            );

            const isFirstGroup = g === 0;
            const caption =
                isFirstGroup
                    ? `📖 **${chapterData.series}**\n📑 ${chapterData.chapter}\n📄 Total ${chapterData.total_pages} halaman (${totalGroups} pesan)\n\n✨ Enjoy reading!`
                    : `📄 Halaman ${g * GROUP_SIZE + 1}-${Math.min((g + 1) * GROUP_SIZE, imgPaths.length)}`;

            if (isFirstGroup) {
                await interaction.editReply({ content: caption, files: attachments });
            } else {
                await interaction.followUp({ content: caption, files: attachments });
            }
        }
    } catch (err) {
        console.error('Komiku download error:', err);
        await interaction.editReply('❌ Gagal mengunduh atau mengirim gambar. Mungkin salah satu halaman rusak atau server Komiku lagi lambat.').catch(() => {});
    } finally {
        for (const img of imgPaths) {
            try { if (fs.existsSync(img)) fs.unlinkSync(img); } catch {}
        }
    }
}
