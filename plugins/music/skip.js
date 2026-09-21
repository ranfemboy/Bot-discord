import { getSession, setSession } from '../../lib/musicStore.js';

const pluginConfig = {
    name: 'skip',
    alias: ['s', 'next'],
    category: 'music',
    description: 'Lewati lagu yang sedang diputar',
    usage: '.skip',
    isEnabled: true,
};

async function handler(m) {
    const session = getSession(m.guild?.id);
    if (!session?.player) return m.reply('❌ Gak ada lagu yang lagi diputar.');

    const title = session.current?.title;
    setSession(m.guild.id, { skipRequested: true });
    session.player.stop();

    await m.react('⏭️').catch(() => {});
    return m.reply(title ? `⏭️ Skip **${title}**.` : '⏭️ Skip lagu saat ini.');
}

export { pluginConfig as config, handler };