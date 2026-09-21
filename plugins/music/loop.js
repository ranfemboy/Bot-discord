import { getSession, setSession } from '../../lib/musicStore.js';

const pluginConfig = {
    name: 'loop',
    alias: ['repeat'],
    category: 'music',
    description: 'Atur mode ulang lagu: mati, ulang 1 lagu, atau ulang seluruh antrian',
    usage: '.loop <off|song|queue>',
    isEnabled: true,
};

const MODES = ['off', 'song', 'queue'];
const MODE_LABEL = {
    off: '➡️ Loop dimatikan.',
    song: '🔂 Loop 1 lagu diaktifkan — lagu ini bakal muter terus.',
    queue: '🔁 Loop seluruh antrian diaktifkan — antrian bakal muter terus dari awal.',
};
const MODE_EMOJI = { off: '➡️', song: '🔂', queue: '🔁' };

async function handler(m, { args }) {
    const session = getSession(m.guild?.id);
    if (!session?.player) return m.reply('❌ Gak ada lagu yang lagi diputar.');

    const input = args[0]?.toLowerCase();
    let newMode;

    if (!input) {
        const idx = MODES.indexOf(session.loopMode || 'off');
        newMode = MODES[(idx + 1) % MODES.length];
    } else if (MODES.includes(input)) {
        newMode = input;
    } else {
        return m.reply('❌ Pilihan gak valid. Pakai `.loop off`, `.loop song`, atau `.loop queue`.');
    }

    setSession(m.guild.id, { loopMode: newMode });
    await m.react(MODE_EMOJI[newMode]).catch(() => {});
    return m.reply(MODE_LABEL[newMode]);
}

export { pluginConfig as config, handler };