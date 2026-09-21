import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';
import settings from './setting.js';
import { startVoiceXpTicker, primeActiveVoiceFromClient } from './lib/voiceXpStore.js';
import { startBirthdayTicker } from './lib/birthdayTicker.js';
import { scanPlugins, loadPlugins, bindEventPlugins } from './handler/pluginLoader.js';
import { handleMessage } from './handler/messageHandler.js';
import { handleInteraction } from './handler/interactionHandler.js';
import { patchMessageReply } from './lib/supportButton.js';
import { startDashboardApi } from './lib/dashboardApi.js';
import { deploySlashCommands } from './lib/slashDeploy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel, Partials.Message]
});

client.plugins = new Collection();
client.cooldowns = new Collection();

const pluginsPath = path.join(__dirname, 'plugins');

client.once('ready', async () => {
    console.log(`🤖 ${settings.botName} online sebagai ${client.user.tag}`);
    client.user.setActivity(`${settings.prefix}menu | ${settings.botName}`);

    try {
        const { total, skipped } = await deploySlashCommands(client, settings, { global: true });
        console.log(`⌨️  Slash command ke-deploy: ${total} command${skipped.length ? ` (${skipped.length} di-skip: ${skipped.join(', ')})` : ''}`);
    } catch (err) {
        console.error('Gagal deploy slash command:', err.message);
    }
    primeActiveVoiceFromClient(client);
    startVoiceXpTicker(client);
    startBirthdayTicker(client);
    startDashboardApi(client, 10000, settings);
});

client.on('messageCreate', (m) => handleMessage(m, { client, settings }));

client.on('interactionCreate', (interaction) => handleInteraction(interaction, { client, settings }));

(async () => {
    patchMessageReply();

    const pluginFiles = scanPlugins(pluginsPath);
    await loadPlugins(client, pluginsPath, pluginFiles);
    await bindEventPlugins(client, pluginsPath, pluginFiles, settings);

    client.login(settings.token);
})();
