import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import { randomUUID } from 'crypto';

// Nyimpen sementara data laporan/request yang lagi "pending" (belum diisi / belum direspon owner)
// key: reportId -> { kind, reporterId, reporterTag, channelId, guildId, guildName, channelName, message, expireTimer }
const pendingReports = new Map();

// ⏰ Durasi kadaluarsa tiap tahap
const BUTTON_EXPIRY_MS = 15 * 60 * 1000;             // 15 menit: tombol belum diisi
const AWAITING_RESPOND_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 jam: udah masuk tapi owner belum respon

// 🎨 Konfigurasi tiap "kind" (jenis) tombol — tinggal nambah entry baru kalau mau tipe lain
const KIND_CONFIG = {
    report: {
        buttonLabel: 'Report',
        buttonStyle: ButtonStyle.Secondary, // abu-abu (Discord gak punya style "putih")
        modalTitle: 'Form Laporan Fitur',
        inputLabel: 'Jelaskan masalah anda',
        inputPlaceholder: 'Contoh: command !play error pas dipakai di voice channel...',
        submitConfirm: '✅ Report anda akan di kirimkan ke owner. Terima kasih atas laporan nya, nanti akan di respon.',
        embedTitle: '📩 LAPORAN MASUK',
        embedColor: '#FF5555',
        forwardIntro: 'Laporan Anda sudah di respon oleh owner',
    },
    request: {
        buttonLabel: 'Request Fitur',
        buttonStyle: ButtonStyle.Success, // hijau
        modalTitle: 'Form Request Fitur',
        inputLabel: 'Jelaskan fitur yang diinginkan',
        inputPlaceholder: 'Contoh: mau ada fitur auto-role pas member join...',
        submitConfirm: '✅ Request anda akan di kirimkan ke owner. Terima kasih atas masukannya, nanti akan di respon.',
        embedTitle: '💡 REQUEST FITUR MASUK',
        embedColor: '#57F287',
        forwardIntro: 'Request fitur Anda sudah di respon oleh owner',
    },
    amprem: {
        buttonLabel: '🏷️ Owner',
        buttonStyle: ButtonStyle.Success, // hijau
        modalTitle: 'Kendala Akun Alight Motion',
        inputLabel: 'Jelaskan kendala anda',
        inputPlaceholder: 'Contoh: gak bisa login, email/password ditolak, dll...',
        submitConfirm: '✅ Kendala anda akan di kirimkan ke owner. Terima kasih, nanti akan di respon.',
        embedTitle: '⚠️ KENDALA AKUN PREMIUM',
        embedColor: '#FEE75C',
        forwardIntro: 'Kendala akun Alight Motion Anda sudah di respon oleh owner',
    },
};

// Reset/pasang ulang timer kadaluarsa buat 1 reportId
function scheduleExpiry(reportId, durationMs) {
    const data = pendingReports.get(reportId);
    if (!data) return;

    if (data.expireTimer) clearTimeout(data.expireTimer);

    data.expireTimer = setTimeout(() => {
        pendingReports.delete(reportId);
    }, durationMs);
}

/**
 * Bikin tombol sesuai `kinds` yang diminta, ditaruh dalam 1 row.
 * Default: 'report' + 'request' (dipake di auto-reply owner-mention).
 * Buat kind lain (misal 'amprem'), tinggal panggil buildReportButtons(message, ['amprem']).
 */
export function buildReportButtons(message, kinds = ['report', 'request']) {
    const buttons = kinds.map((kind) => {
        const cfg = KIND_CONFIG[kind];
        const reportId = randomUUID();

        pendingReports.set(reportId, {
            kind,
            reporterId: message.author.id,
            reporterTag: message.author.tag,
            channelId: message.channel.id,
            guildId: message.guild.id,
            guildName: message.guild.name,
            channelName: message.channel.name,
        });
        scheduleExpiry(reportId, BUTTON_EXPIRY_MS);

        return new ButtonBuilder()
            .setCustomId(`${kind}_${reportId}`)
            .setLabel(cfg.buttonLabel)
            .setStyle(cfg.buttonStyle);
    });

    return new ActionRowBuilder().addComponents(...buttons);
}

// Backward-compatible alias kalau ada kode lain yang masih manggil nama lama
export const buildReportButton = buildReportButtons;

/**
 * User klik tombol "Report" atau "Request Fitur" -> munculin modal buat isi teks.
 * customId formatnya: `${kind}_${reportId}` (kind udah pasti 'report' / 'request')
 */
export async function handleReportButton(interaction) {
    const kind = Object.keys(KIND_CONFIG).find(k => interaction.customId.startsWith(`${k}_`)) ?? 'report';
    const reportId = interaction.customId.replace(`${kind}_`, '');
    const data = pendingReports.get(reportId);
    const cfg = KIND_CONFIG[kind];

    if (!data) {
        return interaction.reply({ content: '❌ Tombol ini sudah kadaluarsa (lebih dari 15 menit), silakan tag ulang owner ya.', ephemeral: true });
    }

    if (interaction.user.id !== data.reporterId) {
        return interaction.reply({ content: '❌ Tombol ini bukan buat kamu, Sensei~', ephemeral: true });
    }

    const modal = new ModalBuilder()
        .setCustomId(`${kind}Modal_${reportId}`)
        .setTitle(cfg.modalTitle);

    const input = new TextInputBuilder()
        .setCustomId('reportMessage')
        .setLabel(cfg.inputLabel)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(cfg.inputPlaceholder)
        .setRequired(true)
        .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

/**
 * User submit modal (report/request) -> kirim ke DM owner + kasih tombol "Respon".
 * customId formatnya: `${kind}Modal_${reportId}`
 */
export async function handleReportModalSubmit(interaction, { client, settings }) {
    const kind = Object.keys(KIND_CONFIG).find(k => interaction.customId.startsWith(`${k}Modal_`)) ?? 'report';
    const reportId = interaction.customId.replace(`${kind}Modal_`, '');
    const data = pendingReports.get(reportId);
    const cfg = KIND_CONFIG[kind];

    if (!data) {
        return interaction.reply({ content: '❌ Ini sudah kadaluarsa.', ephemeral: true });
    }

    const reportMessage = interaction.fields.getTextInputValue('reportMessage');
    data.message = reportMessage;
    scheduleExpiry(reportId, AWAITING_RESPOND_EXPIRY_MS);

    await interaction.reply({
        content: cfg.submitConfirm,
        ephemeral: true,
    });

    try {
        const owner = await client.users.fetch(settings.idOwner);

        const embed = new EmbedBuilder()
            .setColor(cfg.embedColor)
            .setTitle(cfg.embedTitle)
            .addFields(
                { name: 'User', value: `${data.reporterTag} (${data.reporterId})` },
                { name: 'Server', value: data.guildName },
                { name: 'Channel', value: `#${data.channelName}` },
                { name: 'Pesan', value: reportMessage },
            )
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`reportRespond_${reportId}`)
                .setLabel('Respon')
                .setStyle(ButtonStyle.Success),
        );

        await owner.send({ embeds: [embed], components: [row] });
    } catch (err) {
        console.error('Gagal mengirim ke owner:', err);
    }
}

/**
 * Dipakai oleh command `.req <komentar>` (bukan lewat tombol/modal, tapi langsung dari pesan).
 * Bikin entry pending baru (kind selalu 'request') lalu langsung kirim ke DM owner + tombol "Respon".
 * `imageUrl` opsional: kalau ada, ditempel sebagai gambar di embed yang dikirim ke owner.
 */
export async function createRequestFromCommand(message, commentText, { client, settings, imageUrl } = {}) {
    const cfg = KIND_CONFIG.request;
    const reportId = randomUUID();

    const data = {
        kind: 'request',
        reporterId: message.author.id,
        reporterTag: message.author.tag,
        channelId: message.channel.id,
        guildId: message.guild?.id ?? null,
        guildName: message.guild?.name ?? 'DM',
        channelName: message.guild ? message.channel.name : 'DM',
        message: commentText,
    };

    pendingReports.set(reportId, data);
    scheduleExpiry(reportId, AWAITING_RESPOND_EXPIRY_MS);

    const owner = await client.users.fetch(settings.idOwner);

    const embed = new EmbedBuilder()
        .setColor(cfg.embedColor)
        .setTitle(cfg.embedTitle)
        .addFields(
            { name: 'User', value: `${data.reporterTag} (${data.reporterId})` },
            { name: 'Server', value: data.guildName },
            { name: 'Channel', value: data.guildName === 'DM' ? 'DM' : `#${data.channelName}` },
            { name: 'Komentar', value: commentText },
        )
        .setTimestamp();

    if (imageUrl) embed.setImage(imageUrl);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`reportRespond_${reportId}`)
            .setLabel('Respon')
            .setStyle(ButtonStyle.Success),
    );

    await owner.send({ embeds: [embed], components: [row] });
    return reportId;
}

/**
 * Owner klik tombol "Respon" di DM -> munculin modal buat isi balasan.
 * (Dipakai bareng buat report maupun request, customId-nya sama-sama `reportRespond_`)
 */
export async function handleReportRespondButton(interaction, { settings }) {
    if (interaction.user.id !== settings.idOwner) {
        return interaction.reply({ content: '❌ Cuma owner yang bisa merespon ini.', ephemeral: true });
    }

    const reportId = interaction.customId.replace('reportRespond_', '');
    const data = pendingReports.get(reportId);

    if (!data) {
        return interaction.reply({ content: '❌ Ini sudah kadaluarsa atau sudah pernah direspon.', ephemeral: true });
    }

    const modal = new ModalBuilder()
        .setCustomId(`reportRespondModal_${reportId}`)
        .setTitle('Balas');

    const input = new TextInputBuilder()
        .setCustomId('respondMessage')
        .setLabel('Balasan untuk pengirim')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

/**
 * Owner submit modal balasan -> forward ke channel/server asal report/request.
 */
export async function handleReportRespondModalSubmit(interaction, { client }) {
    const reportId = interaction.customId.replace('reportRespondModal_', '');
    const data = pendingReports.get(reportId);

    if (!data) {
        return interaction.reply({ content: '❌ Ini sudah kadaluarsa atau sudah pernah direspon.', ephemeral: true });
    }

    const cfg = KIND_CONFIG[data.kind] ?? KIND_CONFIG.report;
    const responseText = interaction.fields.getTextInputValue('respondMessage');

    await interaction.reply({
        content: '✅ Pesan anda akan di forward ke user dan channel/server asalnya.',
        ephemeral: true,
    });

    const forwardText =
        `Hallo <@${data.reporterId}>, ${cfg.forwardIntro}\n\n` +
        `**Pesan owner:**\n${responseText}`;

    try {
        const channel = await client.channels.fetch(data.channelId);
        await channel.send({ content: forwardText });
    } catch (err) {
        console.error('Gagal forward respon ke channel, coba DM user:', err);
        try {
            const reporter = await client.users.fetch(data.reporterId);
            await reporter.send({ content: forwardText });
        } catch (e) {
            console.error('Gagal DM fallback ke reporter:', e);
        }
    }

    if (data.expireTimer) clearTimeout(data.expireTimer);
    pendingReports.delete(reportId);
}