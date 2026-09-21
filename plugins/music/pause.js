import { getSession, setSession } from '../../lib/musicStore.js';

const pluginConfig = {
    name: 'pause',
    category: 'music',
    description: 'Jeda lagu yang sedang diputar',
    usage: '.pause',
    isEnabled: true,
};

async function handler(m) {
    const session = getSession(m.guild?.id);
    if (!session?.player) return m.reply('❌ Gak ada lagu yang lagi diputar.');
    if (session.paused) return m.reply('⏸️ Lagu udah dijeda dari tadi.');

    session.player.pause();
    setSession(m.guild.id, { paused: true });

    await m.react('⏸️').catch(() => {});
    return m.reply('⏸️ Musik dijeda.');
}

export { pluginConfig as config, handler };
