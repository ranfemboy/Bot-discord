import { Collection } from 'discord.js';
import { isUserPremium } from './premiumStore.js';
import { isStaff } from './staffStore.js';

/*
✦ Kenapa perlu adapter ini:
  Semua plugin yang udah ada dibikin buat nerima objek `m` (Message) dari prefix
  command (`.play judul lagu`), pakai `m.author`, `m.mentions.users`, `m.reply()`, dll.
  Slash command dari Discord ngasihnya `interaction`, bukan `message` — bentuknya beda.
  Daripada nulis ulang 50+ plugin, adapter ini "nyamar" jadi Message palsu yang
  isinya diambil dari interaction, jadi handler yang sama persis bisa dipanggil dari
  prefix command MAUPUN slash command.
*/

// 🎭 Bikin objek mirip Message dari ChatInputCommandInteraction
export async function buildFakeMessage(interaction) {
    const inputText = interaction.options.getString('input') || '';

    // 🔍 Parse mention manual dari teks (`<@id>` / `<@!id>`) — slash command string
    // option gak otomatis punya `.mentions` kayak message biasa, jadi di-fetch manual
    const mentionIds = [...new Set([...inputText.matchAll(/<@!?(\d+)>/g)].map((match) => match[1]))];
    const mentionUsers = new Collection();
    for (const id of mentionIds) {
        const user = await interaction.client.users.fetch(id).catch(() => null);
        if (user) mentionUsers.set(id, user);
    }

    const fakeMessage = {
        author: interaction.user,
        member: interaction.member,
        guild: interaction.guild,
        channel: interaction.channel,
        client: interaction.client,
        content: `/${interaction.commandName} ${inputText}`.trim(),
        mentions: { users: mentionUsers },
        attachments: new Collection(),

        // 🎛️ Buat plugin yang pakai `config.slashOptions` custom (misal /confess pesan: image:),
        // opsi mentah dari Discord disediain di sini. Contoh: m.slashOptions.getString('pesan'),
        // m.slashOptions.getAttachment('image'). Prefix command gak punya ini (selalu undefined).
        slashOptions: interaction.options,

        // 🔁 m.reply(...) -> interaction.reply() pas pertama, editReply() abis itu.
        // Balikin objek yang punya .edit() juga, biar pola `const x = await m.reply(...); x.edit(...)`
        // yang dipake di beberapa plugin (misal plugins/music/play.js) tetep jalan normal.
        async reply(payload) {
            if (typeof payload === 'string') payload = { content: payload };
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply(payload);
            } else {
                await interaction.editReply(payload);
            }
            return {
                edit: async (editPayload) => {
                    if (typeof editPayload === 'string') editPayload = { content: editPayload };
                    return interaction.editReply(editPayload);
                },
            };
        },
    };

    const args = inputText.length ? inputText.split(/ +/) : [];
    return { fakeMessage, args };
}

// ✅ Cek akses (owner/staff/premium/group/private) — logicnya disamain persis kayak messageHandler.js,
// biar aturan aksesnya konsisten baik dipanggil dari prefix command atau slash command.
export function checkAccess(config, userId, isInGuild, settings) {
    if (config.isOwner && userId !== settings.idOwner) {
        const allowedAsStaff = config.isStaffAllowed && isStaff(userId);
        if (!allowedAsStaff) return '❌ *AKSES DITOLAK*\n\n> Fitur ini khusus untuk owner bot.';
    }
    if (config.isPremium && userId !== settings.idOwner && !isUserPremium(userId)) {
        return '⭐ *KHUSUS PREMIUM*\n\n> Fitur ini cuma bisa dipakai user premium. Hubungi owner buat upgrade ya~';
    }
    if (config.isGroup && !isInGuild) {
        return '❌ Fitur ini hanya bisa digunakan di dalam server.';
    }
    if (config.isPrivate && isInGuild) {
        return '❌ Fitur ini hanya bisa digunakan lewat DM (private chat).';
    }
    return null;
}
