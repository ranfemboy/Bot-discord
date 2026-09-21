/**
 * Pinterest Search — Discord version
 * -----------------------------
 * Converted from WhatsApp (ESM) plugin by Hilman
 * API : https://api.nexray.eu.cc
 *
 * Fitur: cari gambar Pinterest, dikirim 10 gambar per halaman sebagai attachment (bukan embed),
 * ada tombol hijau "Halaman Berikutnya" sampai maksimal 5 halaman (50 gambar).
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import axios from 'axios';
import { createSession, getSession, getPageItems, goToNextPage, PAGE_SIZE } from '../../lib/pinterestSessionStore.js';

const MAX_PAGES = 5; // maksimal 5 halaman (5 x 10 = 50 gambar)

export const config = {
    name: 'pinterest',
    alias: ['pin'],
    category: 'download',
    description: 'Cari gambar dari Pinterest, hasil dikirim 10 gambar per halaman',
    usage: '.pinterest <query>',
    example: '.pinterest kucing lucu',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

async function pinterestApi(query) {
    try {
        const { data } = await axios.get('https://api.nexray.eu.cc/search/pinterest', {
            params: { q: query },
            timeout: 10000,
        });

        if (!data?.status) {
            console.log('Pinterest API status false:', data);
            return [];
        }

        return data.result
            .map((v, i) => ({
                title: v.grid_title || `Gambar ${i + 1}`,
                image: v.images_url,
            }))
            .filter((v) => v.image);
    } catch (e) {
        console.log('Pinterest Error:', e.response?.status, e.response?.data || e.message);
        return [];
    }
}

// Konten teks halaman (bukan embed)
function buildPageContent(query, pageData) {
    const start = pageData.page * PAGE_SIZE;
    const end = start + pageData.items.length;

    let text = `📌 **Pinterest Search** — *${query}*\n`;
    text += `📄 Menampilkan ${start + 1}-${end} • Halaman ${pageData.page + 1}/${pageData.totalPages}\n\n`;
    pageData.items.forEach((item, idx) => {
        text += `❀ ${start + idx + 1}. ${item.title}\n`;
    });

    return text;
}

// Gambar dikirim langsung sebagai attachment/file, bukan embed
function buildPageFiles(pageData) {
    const start = pageData.page * PAGE_SIZE;
    return pageData.items.map((item, idx) =>
        new AttachmentBuilder(item.image, { name: `pinterest_${start + idx + 1}.jpg` })
    );
}

function buildComponents(sessionId, pageData) {
    const cappedHasNext = pageData.hasNext && pageData.page + 1 < MAX_PAGES;
    if (!cappedHasNext) return [];

    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`pinterestPage_${sessionId}`)
                .setLabel('Halaman Berikutnya ➡')
                .setStyle(ButtonStyle.Success)
        ),
    ];
}

export async function handler(m, { args }) {
    const text = args.join(' ');

    if (!text) {
        return m.reply('✨ Mau cari apa di Pinterest, Sensei~? Contoh: `.pinterest kucing lucu`');
    }

    const loadingMsg = await m.reply('🔍 Mencari di Pinterest...');

    const results = await pinterestApi(text);
    if (!results.length) {
        return loadingMsg.edit('❌ Tidak ada hasil ditemukan.');
    }

    const limited = results.slice(0, MAX_PAGES * PAGE_SIZE);

    const sessionId = createSession({ query: text, items: limited, ownerId: m.author.id });
    const pageData = getPageItems(sessionId);

    await loadingMsg.edit({
        content: buildPageContent(text, pageData),
        files: buildPageFiles(pageData),
        components: buildComponents(sessionId, pageData),
    });
}

// ────────────────────────────────
// 🖱 Interaction handler tombol "Halaman Berikutnya" (dipanggil dari index.js)
// ────────────────────────────────
export async function handlePinterestPage(interaction) {
    const sessionId = interaction.customId.replace('pinterestPage_', '');
    const session = getSession(sessionId);

    if (!session) {
        return interaction.reply({ content: '❌ Sesi pencarian ini udah kadaluarsa, coba search ulang ya.', ephemeral: true });
    }
    if (interaction.user.id !== session.ownerId) {
        return interaction.reply({ content: '❌ Tombol ini bukan buat kamu, Sensei~', ephemeral: true });
    }

    const pageData = goToNextPage(sessionId);

    // attachments: [] wajib biar file lama diganti total, bukan numpuk
    await interaction.update({
        content: buildPageContent(session.query, pageData),
        files: buildPageFiles(pageData),
        attachments: [],
        components: buildComponents(sessionId, pageData),
    });
}