import { PermissionsBitField } from 'discord.js';
import { isToxicFilterEnabled, getCustomWords } from '../../lib/toxicStore.js';

const pluginConfig = {
    name: 'antiToxic',
    alias: [],
    category: 'event',
    description: 'Menghapus pesan berisi kata-kata toxic/kasar dan memperingatkan pengirimnya (bisa di-on/off per server)',
    usage: 'otomatis (tidak dipanggil via command)',
    example: '-',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
};

const event = 'messageCreate';

// ⚠️ STARTER LIST bawaan — admin server bisa nambahin sendiri lewat .addtoxic
const BASE_TOXIC_WORDS = [
    'anjing','bangsat', 'bangsad', 'kontol', 'memek', 'ngentot',
    'goblok', 'tolol', 'bego', 'idiot', 'asu', 'babi', 'kampret', 'tai',
    'kimak', 'jancok', 'jancuk', 'pekok', 'sialan', 'setan','anying',
];

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRegexForGuild(guildId) {
    const words = [...BASE_TOXIC_WORDS, ...getCustomWords(guildId)].map(escapeRegex);
    return new RegExp(`\\b(${words.join('|')})\\b`, 'i');
}

async function handler(message) {
    try {
        if (message.author.bot) return;
        if (!message.guild) return;
        if (!message.content) return;

        if (!isToxicFilterEnabled(message.guild.id)) return;

        const toxicRegex = buildRegexForGuild(message.guild.id);
        if (!toxicRegex.test(message.content)) return;

        const isMod = message.member?.permissions?.has(PermissionsBitField.Flags.ManageMessages);
        if (isMod) return;

        const canDelete = message.guild.members.me?.permissions?.has(PermissionsBitField.Flags.ManageMessages);
        if (canDelete) {
            await message.delete().catch(() => {});
        }

        await message.channel.send(
            `Kamu jangn toxic lagi yah (╬ Ò ‸ Ó) <@${message.author.id}>`
        ).catch(() => {});
    } catch (error) {
        console.error('AntiToxic Error:', error);
    }
}

export { pluginConfig as config, event, handler };