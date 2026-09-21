/*
✦ Support Button — nempelin tombol link "Server Support" secara OTOMATIS
   ke semua m.reply() di seluruh bot, tanpa perlu edit tiap plugin satu-satu.
✦ Dipasang sekali di index.js lewat patchMessageReply(), bukan dipanggil manual di plugin.
*/
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message } from 'discord.js';
import settings from '../setting.js';

const MAX_ACTION_ROWS = 5; // batas Discord: maksimal 5 action row per pesan


function buildSupportRow() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel('Server Support')
            .setEmoji(settings.supportEmoji || '🛠️')
            .setStyle(ButtonStyle.Link)
            .setURL(settings.supportServerUrl)
    );
}

function attachSupportButton(options) {
    if (!settings.supportServerUrl) return options;

    const normalized = typeof options === 'string' ? { content: options } : { ...options };
    const existingRows = normalized.components ? [...normalized.components] : [];

    if (existingRows.length < MAX_ACTION_ROWS) {
        existingRows.push(buildSupportRow());
    }

    normalized.components = existingRows;
    return normalized;
}

export function patchMessageReply() {
    const originalReply = Message.prototype.reply;
    Message.prototype.reply = function (options) {
        return originalReply.call(this, attachSupportButton(options));
    };
}