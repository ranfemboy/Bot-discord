import axios from 'axios';
import moment from 'moment-timezone';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { renderPinkQuote } from './canvas/iqcCanvas.js';

// 🗂️ Nyimpen teks sementara antara command `.iqc` dijalankan dan tombol tema diklik
const pending = new Map();

export function createIqcJob(text, authorId) {
    const id = Math.random().toString(36).slice(2, 10);
    pending.set(id, { text, authorId, createdAt: Date.now() });
    // Auto hapus kalau gak dipilih dalam 5 menit
    setTimeout(() => pending.delete(id), 5 * 60 * 1000);
    return id;
}

function buildThemeRow(jobId, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`iqc_biasa_${jobId}`)
            .setLabel('Biasa')
            .setEmoji('🔵')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`iqc_pink_${jobId}`)
            .setLabel('Pink')
            .setEmoji('💗')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
    );
}

export function buildInitialIqcMessage(jobId) {
    return {
        content: '📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\nPilih tema chat yang mau dibuat:',
        components: [buildThemeRow(jobId)],
    };
}

// 🔵 Tema "Biasa" -> generate lewat API nexray
async function generateBiasa(text) {
    const time = moment().tz('Asia/Jakarta').format('HH:mm');
    const apiUrl = `https://api.nexray.eu.cc/maker/v1/iqc?text=${encodeURIComponent(text)}&provider=INDOSAT&jam=${encodeURIComponent(time)}&baterai=100`;

    const res = await axios.get(apiUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
    });

    if (res.headers['content-type'] && !res.headers['content-type'].includes('image')) {
        throw new Error('Gagal membuat IQC, format bukan gambar');
    }

    return Buffer.from(res.data);
}

// 💗 Tema "Pink" -> generate lewat canvas
async function generatePink(text) {
    const time = moment().tz('Asia/Jakarta').format('HH.mm');
    return await renderPinkQuote(text, time);
}

export async function handleIqcButton(interaction) {
    const [, theme, jobId] = interaction.customId.split('_');
    const job = pending.get(jobId);

    if (!job) {
        return interaction.reply({ content: '❌ Sesi sudah kedaluwarsa, ketik ulang commandnya ya.', ephemeral: true });
    }
    if (interaction.user.id !== job.authorId) {
        return interaction.reply({ content: '❌ Ini bukan permintaan kamu!', ephemeral: true });
    }

    await interaction.deferUpdate();

    try {
        const buffer = theme === 'pink' ? await generatePink(job.text) : await generateBiasa(job.text);
        const attachment = new AttachmentBuilder(buffer, { name: `iqc_${theme}.png` });

        await interaction.editReply({
            content: `📱 *ɪǫᴄ ᴄʜᴀᴛ* — Tema: ${theme === 'pink' ? '💗 Pink' : '🔵 Biasa'}`,
            components: [buildThemeRow(jobId, true)],
            files: [attachment],
        });
    } catch (error) {
        console.error('[IQC Button]', error);
        await interaction.editReply({
            content: '😔 *Gagal membuat gambar chat.*\n\nSistem gagal menghubungi server pembuat chat. Silakan coba beberapa saat lagi ya.',
            components: [buildThemeRow(jobId, true)],
        });
    } finally {
        pending.delete(jobId);
    }
}
