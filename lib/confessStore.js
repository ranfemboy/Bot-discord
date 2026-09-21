import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    LabelBuilder,
    FileUploadBuilder,
    resolveColor,
} from 'discord.js';
import { getConfessConfig } from './confessConfigStore.js';
import { recordConfession, getConfessionRecord } from './confessionRecordStore.js';
import { isUserPremium } from './premiumStore.js';

// 💌 State pending confess (di-approve/reject sama staff lewat tombol di log channel)
const pending = new Map();
const EXPIRE_MS = 24 * 60 * 60 * 1000; // 24 jam, biar Map gak numpuk kalau gak pernah direspon

export function createConfess(senderId, message, imageUrl = null, customColor = null) {
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    pending.set(id, { senderId, message, imageUrl, customColor, createdAt: Date.now() });
    setTimeout(() => pending.delete(id), EXPIRE_MS);
    return id;
}

export function buildConfessLogMessage(id, sender, message, imageUrl = null, customColor = null) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`confessApprove_${id}`).setLabel('Perbolehkan').setEmoji('✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`confessReject_${id}`).setLabel('Tolak').setEmoji('❌').setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
        .setTitle('💌 Confess Pending Approval')
        .setDescription(message || '_(tidak ada pesan teks, cuma gambar)_')
        .setColor('#FFB6C1')
        .addFields({ name: '📤 Pengirim', value: `<@${sender.id}>`, inline: false })
        .setFooter({ text: sender.username, iconURL: sender.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

    if (imageUrl) embed.setImage(imageUrl);
    if (customColor) embed.addFields({ name: '🎨 Warna Custom (kalau di-approve)', value: customColor, inline: false });

    return { embeds: [embed], components: [row] };
}

// 🔘 Dipanggil dari handler/interactionHandler.js tiap ada tombol confessApprove_/confessReject_
export async function handleConfessButton(interaction) {
    const isApprove = interaction.customId.startsWith('confessApprove_');
    const id = interaction.customId.replace('confessApprove_', '').replace('confessReject_', '');
    const data = pending.get(id);

    if (!data) {
        return interaction.reply({ content: '❌ Confess ini sudah kedaluwarsa atau sudah diproses.', ephemeral: true });
    }

    if (isApprove) {
        pending.delete(id);
        return handleConfessApprove(interaction, data, id);
    }

    // ❌ Tolak: jangan hapus dulu dari Map, baru dihapus pas modal alasan disubmit
    const modal = new ModalBuilder()
        .setCustomId(`confessRejectModal_${id}`)
        .setTitle('Tolak Confess');

    const input = new TextInputBuilder()
        .setCustomId('rejectReason')
        .setLabel('Alasan penolakan')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Contoh: Mengandung kata kasar, spam, atau melanggar aturan server')
        .setRequired(true)
        .setMaxLength(500);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    await interaction.showModal(modal);
}

// ✅ Disetujui -> kirim publik ke channel "kirim confess" (anonim, gak nge-tag siapa-siapa)
async function handleConfessApprove(interaction, data, id) {
    try {
        const cfg = getConfessConfig(interaction.guildId);
        const sendChannel = cfg.sendChannelId
            ? await interaction.client.channels.fetch(cfg.sendChannelId).catch(() => null)
            : null;

        if (!sendChannel) {
            await interaction.reply({
                content: '⚠️ Disetujui, tapi channel pengiriman confess belum di-setup! Jalanin `.confession` dulu ya, Sensei.',
                ephemeral: true,
            });
        } else {
            // 🎨 Pakai custom color kalau si pengirim premium & set warna pas submit, fallback default
            let embedColor = '#FFB6C1';
            if (data.customColor) {
                try {
                    resolveColor(data.customColor);
                    embedColor = data.customColor;
                } catch {
                    // warna gak valid, tetep pakai default
                }
            }

            const publicEmbed = new EmbedBuilder()
                .setTitle('💌 Confess Anonim')
                .setDescription(data.message || '_(tidak ada pesan teks, cuma gambar)_')
                .setColor(embedColor)
                .setTimestamp();

            if (data.imageUrl) publicEmbed.setImage(data.imageUrl);

            const sentMessage = await sendChannel.send({ embeds: [publicEmbed] });

            // 🔢 Catat nomor urut confess ini (dipakai buat nama thread balasan & ditampilin di footer)
            const confessNumber = recordConfession(interaction.guildId, sendChannel.id, sentMessage.id);

            // 🧵 Fitur Reply: bikin thread otomatis di tiap confess yang tayang, biar orang
            // bisa nanggepin/reply confess itu tanpa nge-spam channel utama.
            let threadId = null;
            try {
                const thread = await sentMessage.startThread({
                    name: `💬 Balasan Confess #${confessNumber}`.slice(0, 100),
                    autoArchiveDuration: 1440, // 24 jam
                    reason: 'Thread balasan otomatis untuk confess',
                });
                threadId = thread.id;
            } catch (threadError) {
                console.error('Confess Thread Create Error:', threadError);
            }

            if (threadId) {
                const guildData = getConfessionRecord(interaction.guildId, confessNumber);
                if (guildData) guildData.threadId = threadId;
            }

            // 🔘 Tombol "Submit Confession" biar orang lain gampang ikut kirim confess baru
            publicEmbed
                .setFooter({ text: `Dari: Anonymous • Confess #${confessNumber}` });

            await sentMessage.edit({
                embeds: [publicEmbed],
                components: [buildConfessSubmitButtonRow()],
            });

            await interaction.reply({ content: `✅ Disetujui! Confess sudah dikirim ke ${sendChannel}.`, ephemeral: true });
        }

        // 👤 Catat siapa yang approve, biar keliatan jelas di log channel
        await interaction.message.edit({
            content: `✅ **[APPROVED]** oleh ${interaction.user}`,
            embeds: interaction.message.embeds,
            components: [],
        });
    } catch (e) {
        console.error('Confess Approve Error:', e);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: `❌ Error: ${e.message}`, ephemeral: true }).catch(() => {});
        }
    }
}

// 📝 Dipanggil dari handler/interactionHandler.js pas staff submit modal alasan tolak
// customId formatnya: confessRejectModal_<id>
export async function handleConfessRejectModalSubmit(interaction) {
    const id = interaction.customId.replace('confessRejectModal_', '');
    const data = pending.get(id);

    if (!data) {
        return interaction.reply({ content: '❌ Confess ini sudah kedaluwarsa atau sudah diproses.', ephemeral: true });
    }

    pending.delete(id);
    const reason = interaction.fields.getTextInputValue('rejectReason');

    try {
        const senderUser = await interaction.client.users.fetch(data.senderId).catch(() => null);

        if (senderUser) {
            const dmEmbed = new EmbedBuilder()
                .setTitle('❌ Confess Kamu Ditolak')
                .setDescription(data.message || '_(tidak ada pesan teks, cuma gambar)_')
                .addFields({ name: '📝 Alasan', value: reason })
                .setColor('#FF6B6B')
                .setTimestamp();

            if (data.imageUrl) dmEmbed.setThumbnail(data.imageUrl);

            await senderUser.send({ embeds: [dmEmbed] }).catch(() => {});
        }

        await interaction.reply({ content: '❌ Confess ditolak, alasannya sudah dicatat & dikirim ke pengirim.', ephemeral: true });

        // 👤 Catat siapa yang nolak, biar keliatan jelas di log channel
        await interaction.message.edit({
            content: `❌ **[REJECTED]** oleh ${interaction.user}\n📝 Alasan: ${reason}`,
            embeds: interaction.message.embeds,
            components: [],
        });
    } catch (e) {
        console.error('Confess Reject Modal Error:', e);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: `❌ Error: ${e.message}`, ephemeral: true }).catch(() => {});
        }
    }
}

// 🔘 Tombol "Submit Confession" yang nempel di tiap confess publik — buat orang lain
// yang liat confess ini jadi kepengen ikut kirim confession BARU miliknya sendiri.
function buildConfessSubmitButtonRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('confessSubmitOpen')
            .setLabel('Submit Confession')
            .setEmoji('💌')
            .setStyle(ButtonStyle.Primary)
    );
}

// 🔘 Dipanggil pas user klik tombol "Submit Confession" -> buka modal buat submit confession BARU
export async function handleConfessSubmitOpen(interaction) {
    if (!interaction.guild) {
        return interaction.reply({ content: '❌ Fitur ini cuma bisa dipakai di dalam server.', ephemeral: true });
    }

    const modal = new ModalBuilder().setCustomId('confessSubmitModal').setTitle('Submit a Confession');

    const confessionLabel = new LabelBuilder()
        .setLabel('Confession')
        .setTextInputComponent(
            new TextInputBuilder()
                .setCustomId('confession')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(2000)
        );

    const fileLabel = new LabelBuilder()
        .setLabel('Attachment (optional)')
        .setFileUploadComponent(
            new FileUploadBuilder().setCustomId('attachment').setRequired(false).setMaxValues(1)
        );

    const colorLabel = new LabelBuilder()
        .setLabel('Custom Color (user premium only)')
        .setTextInputComponent(
            new TextInputBuilder()
                .setCustomId('customColor')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setPlaceholder('Ex: ff0000, #ff0000, or red')
        );

    modal.addLabelComponents(confessionLabel, fileLabel, colorLabel);

    await interaction.showModal(modal);
}

// 📝 Dipanggil pas user submit modal "Submit a Confession" -> jalan persis kayak .confess
// (masuk antrian approval), cuma sumbernya dari tombol, bukan command teks.
export async function handleConfessSubmitModalSubmit(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
        return interaction.editReply('❌ Fitur ini cuma bisa dipakai di dalam server.');
    }

    const confessionText = interaction.fields.getTextInputValue('confession').trim();
    const colorInput = interaction.fields.getTextInputValue('customColor') || '';
    const uploadedFiles = interaction.fields.getUploadedFiles?.('attachment') || [];
    const attachment = uploadedFiles[0] || null;
    const imageUrl = attachment?.url || null;

    if (!confessionText && !imageUrl) {
        return interaction.editReply('❌ Isi minimal salah satu ya: pesan confession atau lampiran gambar!');
    }

    let customColor = null;
    if (colorInput) {
        if (!isUserPremium(interaction.user.id)) {
            await interaction.followUp({
                content: '⚠️ Custom color cuma buat user **Premium**, confession kamu tetep dikirim pakai warna default ya~',
                ephemeral: true,
            }).catch(() => {});
        } else {
            try {
                resolveColor(colorInput);
                customColor = colorInput;
            } catch {
                try {
                    const capitalized = colorInput.charAt(0).toUpperCase() + colorInput.slice(1).toLowerCase();
                    resolveColor(capitalized);
                    customColor = capitalized;
                } catch {
                    await interaction.followUp({
                        content: `⚠️ Warna "${colorInput}" gak valid, dipakein warna default ya~`,
                        ephemeral: true,
                    }).catch(() => {});
                }
            }
        }
    }

    const cfg = getConfessConfig(interaction.guildId);
    if (!cfg.approvalChannelId) {
        return interaction.editReply('❌ Fitur confess belum di-setup di server ini. Minta admin jalanin `.confession` dulu ya!');
    }

    const logChannel = await interaction.client.channels.fetch(cfg.approvalChannelId).catch(() => null);
    if (!logChannel) {
        return interaction.editReply('❌ Channel approval confess tidak ditemukan lagi! Minta admin setting ulang lewat `.confession`.');
    }

    try {
        const confessId = createConfess(interaction.user.id, confessionText, imageUrl, customColor);
        const logPayload = buildConfessLogMessage(confessId, interaction.user, confessionText, imageUrl, customColor);

        await logChannel.send(logPayload);

        await interaction.editReply('✅ Confess kamu udah dikirim, tunggu di-approve staff yaa~ 🌸');
    } catch (error) {
        console.error('Confess Submit Modal Error:', error);
        await interaction.editReply(`❌ Error: ${error.message}`);
    }
}