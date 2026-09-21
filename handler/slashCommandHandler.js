import { Collection } from 'discord.js';
import { isChannelAllowed } from '../lib/botChannelStore.js';
import { buildFakeMessage, checkAccess } from '../lib/slashAdapter.js';
import { getLockDenyReason } from '../lib/lockStore.js';

export async function handleSlashCommand(interaction, { client, settings }) {
    try {
        const plugin = client.plugins.find((p) => p.config.name === interaction.commandName);
        if (!plugin) {
            return interaction.reply({ content: '❌ Command gak ketemu.', ephemeral: true });
        }

        const { config, handler } = plugin;

        // 🚫 Channel yang di-block tetep berlaku buat slash command
        if (interaction.guild) {
            try {
                if (!isChannelAllowed(interaction.guild.id, interaction.channel.id)) {
                    return interaction.reply({ content: '❌ Command gak bisa dipake di channel ini.', ephemeral: true });
                }
            } catch (e) {
                console.error('Channel Check Error (slash):', e);
                return;
            }
        }

        // 🔒 CEK LOCK - bot-wide atau per-fitur, konsisten sama prefix command (lihat lockStore.js)
        const lockDenyReason = getLockDenyReason(config, interaction.user.id, settings);
        if (lockDenyReason) {
            return interaction.reply({ content: lockDenyReason, ephemeral: true });
        }

        const denyReason = checkAccess(config, interaction.user.id, !!interaction.guild, settings);
        if (denyReason) {
            return interaction.reply({ content: denyReason, ephemeral: true });
        }

        // ⏳ Cooldown SHARING sama prefix command (client.cooldowns yang sama), biar
        // gak bisa dicurangin cuma dengan gonta-ganti antara `.command` dan `/command`
        if (!client.cooldowns.has(config.name)) {
            client.cooldowns.set(config.name, new Collection());
        }
        const now = Date.now();
        const timestamps = client.cooldowns.get(config.name);
        const cooldownAmount = (config.cooldown || 3) * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                return interaction.reply({ content: `⏳ Tunggu ${timeLeft} detik lagi sebelum memakai *${config.name}* lagi.`, ephemeral: true });
            }
        }
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        const { fakeMessage, args } = await buildFakeMessage(interaction);
        await handler(fakeMessage, { client, args, prefix: settings.prefix, settings });
    } catch (error) {
        console.error('Slash Command Handler Error:', error);
        const payload = { content: '❌ *TERJADI KESALAHAN*\n\n> ' + error.message, ephemeral: true };
        try {
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply(payload);
            } else {
                await interaction.reply(payload);
            }
        } catch {
            // interaction udah gak bisa dibales (expired dll), diemin aja
        }
    }
}
