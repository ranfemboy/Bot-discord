import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/familyData.json');

const store = new Map(); // userId -> { papa, mama, kakak:[], adik:[], anak:[] }
const pending = new Map(); // requestId -> { guildId, fromId, toId, role, createdAt }

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            Object.entries(data).forEach(([key, value]) => {
                // 🩹 Perbaiki record yang shape-nya gak lengkap (jaga-jaga file lama/corrupt)
                const fixed = {
                    papa: value?.papa ?? null,
                    mama: value?.mama ?? null,
                    kakak: Array.isArray(value?.kakak) ? value.kakak : [],
                    adik: Array.isArray(value?.adik) ? value.adik : [],
                    anak: Array.isArray(value?.anak) ? value.anak : [],
                };
                store.set(key, fixed);
            });
        }
    } catch (error) {
        console.error('Error loading family data:', error);
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(store), null, 2));
    } catch (error) {
        console.error('Error saving family data:', error);
    }
}

load();

export const ROLE_LABEL = { papa: 'Papa', mama: 'Mama', kakak: 'Kakak', adik: 'Adik', anak: 'Anak' };

// 🔤 Sinonim biar user gak harus persis ketik "papa"/"mama"/dst
const ROLE_ALIASES = {
    papa: 'papa', ayah: 'papa', bapak: 'papa',
    mama: 'mama', ibu: 'mama', bunda: 'mama',
    kakak: 'kakak', kaka: 'kakak', kak: 'kakak',
    adik: 'adik', adek: 'adik',
    anak: 'anak',
};

// ⚠️ Simplifikasi: karena role gak nge-track gender, "anak" selalu ke-invert jadi "papa".
// Kalau ternyata harusnya "mama", tinggal .delfamily terus add ulang manual.
const INVERSE_ROLE = { papa: 'anak', mama: 'anak', kakak: 'adik', adik: 'kakak', anak: 'papa' };
const ROLE_SINGLE = ['papa', 'mama'];

export function resolveRole(input) {
    return ROLE_ALIASES[input.trim().toLowerCase()] || null;
}

function defaultRecord() {
    return { papa: null, mama: null, kakak: [], adik: [], anak: [] };
}

export function getFamily(userId) {
    if (!store.has(userId)) store.set(userId, defaultRecord());
    return store.get(userId);
}

export function findRelationRole(userId, targetId) {
    const fam = getFamily(userId);
    if (fam.papa === targetId) return 'papa';
    if (fam.mama === targetId) return 'mama';
    if (fam.kakak.includes(targetId)) return 'kakak';
    if (fam.adik.includes(targetId)) return 'adik';
    if (fam.anak.includes(targetId)) return 'anak';
    return null;
}

function setRole(userId, role, targetId) {
    const fam = getFamily(userId);
    if (ROLE_SINGLE.includes(role)) {
        fam[role] = targetId;
    } else if (!fam[role].includes(targetId)) {
        fam[role].push(targetId);
    }
    store.set(userId, fam);
}

function unsetRole(userId, targetId) {
    const fam = getFamily(userId);
    if (fam.papa === targetId) fam.papa = null;
    if (fam.mama === targetId) fam.mama = null;
    fam.kakak = fam.kakak.filter((id) => id !== targetId);
    fam.adik = fam.adik.filter((id) => id !== targetId);
    fam.anak = fam.anak.filter((id) => id !== targetId);
    store.set(userId, fam);
}

// ⚖️ Slot Papa/Mama cuma boleh keisi 1 orang
export function isSlotTaken(userId, role, targetId) {
    if (!ROLE_SINGLE.includes(role)) return false;
    const fam = getFamily(userId);
    return Boolean(fam[role]) && fam[role] !== targetId;
}

export function addRelation(fromId, toId, role) {
    const inverse = INVERSE_ROLE[role];
    setRole(fromId, role, toId);
    setRole(toId, inverse, fromId);
    save();
}

export function removeRelation(userId, targetId) {
    unsetRole(userId, targetId);
    unsetRole(targetId, userId);
    save();
}

// ============================================================
// 🤝 Request/konfirmasi (mirip .duel: tombol Terima/Tolak)
// ============================================================
export function createFamilyRequest(guildId, fromId, toId, role) {
    const id = Math.random().toString(36).slice(2, 10);
    pending.set(id, { guildId, fromId, toId, role, createdAt: Date.now() });
    setTimeout(() => pending.delete(id), 5 * 60 * 1000);
    return id;
}

export function buildFamilyRequestMessage(id, fromUser, toUser, role) {
    const label = ROLE_LABEL[role];
    const embed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('👨‍👩‍👧 PERMINTAAN FAMILY TREE')
        .setDescription(`${fromUser} mau nambahin ${toUser} jadi **${label}**-nya! Terima?`)
        .setFooter({ text: `Cuma ${toUser.username} yang bisa klik tombol ini • Otomatis batal dalam 5 menit` })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`family_accept_${id}`).setLabel('Terima').setEmoji('✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`family_decline_${id}`).setLabel('Tolak').setEmoji('❌').setStyle(ButtonStyle.Danger)
    );

    return { embeds: [embed], components: [row] };
}

export async function handleFamilyButton(interaction) {
    const [, action, id] = interaction.customId.split('_');
    const job = pending.get(id);

    if (!job) {
        return interaction.reply({ content: '❌ Permintaan ini udah kedaluwarsa atau udah diproses.', ephemeral: true });
    }
    if (interaction.user.id !== job.toId) {
        return interaction.reply({ content: '❌ Cuma orang yang diajak yang bisa merespon ini!', ephemeral: true });
    }

    pending.delete(id);

    if (action === 'decline') {
        return interaction.update({
            content: `❌ <@${job.toId}> menolak jadi **${ROLE_LABEL[job.role]}**-nya <@${job.fromId}>.`,
            embeds: [],
            components: [],
        });
    }

    if (findRelationRole(job.fromId, job.toId)) {
        return interaction.update({
            content: '❌ Kalian udah punya relasi keluarga! Pakai `.delfamily` dulu kalau mau ganti.',
            embeds: [],
            components: [],
        });
    }

    if (isSlotTaken(job.fromId, job.role, job.toId)) {
        return interaction.update({
            content: `❌ Slot **${ROLE_LABEL[job.role]}** <@${job.fromId}> udah keisi orang lain!`,
            embeds: [],
            components: [],
        });
    }

    const inverse = INVERSE_ROLE[job.role];
    if (isSlotTaken(job.toId, inverse, job.fromId)) {
        return interaction.update({
            content: `❌ Slot **${ROLE_LABEL[inverse]}** <@${job.toId}> udah keisi orang lain!`,
            embeds: [],
            components: [],
        });
    }

    addRelation(job.fromId, job.toId, job.role);

    return interaction.update({
        content:
            `🎉 Berhasil! <@${job.toId}> sekarang jadi **${ROLE_LABEL[job.role]}**-nya <@${job.fromId}> ` +
            `(dan <@${job.fromId}> jadi **${ROLE_LABEL[inverse]}**-nya <@${job.toId}>).`,
        embeds: [],
        components: [],
    });
}
