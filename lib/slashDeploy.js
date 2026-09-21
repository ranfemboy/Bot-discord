import { REST, Routes, SlashCommandBuilder, ApplicationIntegrationType, InteractionContextType } from 'discord.js';

// Discord cuma nerima nama command: lowercase, 1-32 karakter, huruf/angka/-/_ doang
function isValidSlashName(name) {
    return /^[a-z0-9_-]{1,32}$/.test(name || '');
}

// 🎛️ Setiap command otomatis dikasih 1 opsi teks bebas ("input") buat nampung argumen
// kayak `.play judul lagu` atau `.duel @user` (mention tetep bisa dipilih dari situ juga).
// Kategori yang sengaja GAK didaftarin jadi slash command (biar hemat kuota 100 command
// dari Discord). Edit array ini sendiri kalau mau ganti kategori yang di-skip.
const EXCLUDED_SLASH_CATEGORIES = ['owner'];

// Batas keras dari Discord: maksimal 100 slash command per bot. JANGAN diubah,
// ini bukan angka bebas — kalau lebih dari ini pas didaftarin, request-nya ditolak semua.
const MAX_SLASH_COMMANDS = 100;

function buildCommandList(client) {
    const commands = [];
    const skipped = [];

    const eligible = [];
    for (const plugin of client.plugins.values()) {
        const { config } = plugin;
        if (!isValidSlashName(config.name)) {
            skipped.push(`${config.name} (nama gak valid buat slash)`);
            continue;
        }
        if (config.noSlash) {
            skipped.push(`${config.name} (ditandai noSlash)`);
            continue;
        }
        if (EXCLUDED_SLASH_CATEGORIES.includes(config.category)) {
            skipped.push(`${config.name} (kategori "${config.category}" di-exclude)`);
            continue;
        }
        eligible.push(plugin);
    }

    // 🩹 Safety net: kalau masih kelebihan 100 walau udah di-exclude, potong sisanya
    // biar tetep bisa deploy (skip yang paling belakang), bukan bikin semua gagal.
    const overflow = eligible.slice(MAX_SLASH_COMMANDS);
    overflow.forEach((plugin) => skipped.push(`${plugin.config.name} (kelebihan limit 100)`));
    const finalList = eligible.slice(0, MAX_SLASH_COMMANDS);

    for (const plugin of finalList) {
        const { config } = plugin;
        const desc = (config.description || 'Tidak ada deskripsi').slice(0, 100);

        const builder = new SlashCommandBuilder()
            .setName(config.name)
            .setDescription(desc)
            // 📲 Bisa dipasang ke server (kayak biasa) MAUPUN ke akun pribadi user (User App)
            .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
            // 🌍 Bisa dipake di server, DM langsung sama bot, dan DM biasa antar user
            .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel);

        // 🎛️ Plugin yang butuh opsi bernama sendiri (misal /confess pesan: image:) bisa
        // declare `config.slashOptions = [{ name, type: 'string'|'attachment', description, required }]`
        // buat override opsi generik "input" di bawah.
        if (Array.isArray(config.slashOptions) && config.slashOptions.length) {
            for (const opt of config.slashOptions) {
                const optDesc = (opt.description || opt.name).slice(0, 100);
                if (opt.type === 'attachment') {
                    builder.addAttachmentOption((o) => o.setName(opt.name).setDescription(optDesc).setRequired(!!opt.required));
                } else {
                    builder.addStringOption((o) => o.setName(opt.name).setDescription(optDesc).setRequired(!!opt.required));
                }
            }
        } else {
            builder.addStringOption((opt) =>
                opt.setName('input').setDescription('Argumen tambahan (contoh: judul lagu, @user, dll)').setRequired(false)
            );
        }

        commands.push(builder.toJSON());
    }

    return { commands, skipped };
}

/**
 * Daftarin semua plugin jadi slash command ke Discord.
 * @param {import('discord.js').Client} client
 * @param {object} settings
 * @param {{ global?: boolean, guildId?: string }} opts - global:true daftar ke semua server (bisa 1 jam kepropagate),
 *   guildId dikasih kalau mau instan tapi cuma di 1 server itu aja.
 */
export async function deploySlashCommands(client, settings, opts = {}) {
    const { commands, skipped } = buildCommandList(client);
    const rest = new REST({ version: '10' }).setToken(settings.token);

    if (opts.guildId) {
        await rest.put(Routes.applicationGuildCommands(client.user.id, opts.guildId), { body: commands });
    } else {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    }

    return { total: commands.length, skipped };
}