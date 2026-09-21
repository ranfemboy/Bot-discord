import { getSession, deleteSession } from '../../lib/musicStore.js';

const pluginConfig = {
    name: 'stop',
    alias: ['leave', 'disconnect'],
    category: 'music',
    description: 'Hentikan musik, kosongkan antrian, dan keluar dari voice channel',
    usage: '.stop',
    isEnabled: true,
};

async function handler(m) {
    const session = getSession(m.guild?.id);
    if (!session?.connection) return m.reply('❌ Bot lagi gak ada di voice channel.');

    session.ytProcess?.kill?.('SIGKILL');
    session.player?.stop();
    session.connection.destroy();
    deleteSession(m.guild.id);

    await m.react('⏹️').catch(() => {});
    return m.reply('⏹️ Musik dihentikan, antrian dikosongkan, dan bot keluar dari voice channel.');
}

export { pluginConfig as config, handler };
