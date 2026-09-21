import { getSession, setSession } from '../../lib/musicStore.js';

const pluginConfig = {
    name: 'resume',
    alias: ['unpause'],
    category: 'music',
    description: 'Lanjutkan lagu yang sedang dijeda',
    usage: '.resume',
    isEnabled: true,
};

async function handler(m) {
    const session = getSession(m.guild?.id);
    if (!session?.player) return m.reply('❌ Gak ada lagu yang lagi diputar.');
    if (!session.paused) return m.reply('▶️ Lagu emang lagi jalan kok, gak dijeda.');

    session.player.unpause();
    setSession(m.guild.id, { paused: false });

    await m.react('▶️').catch(() => {});
    return m.reply('▶️ Musik dilanjutkan.');
}

export { pluginConfig as config, handler };
