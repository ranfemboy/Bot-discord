import { getSession, setSession } from '../../lib/musicStore.js';

const pluginConfig = {
    name: 'volume',
    alias: ['vol'],
    category: 'music',
    description: 'Atur atau cek volume musik (0-100)',
    usage: '.volume <0-100>',
    isEnabled: true,
};

async function handler(m, { args }) {
    const session = getSession(m.guild?.id);
    if (!session?.player) return m.reply('❌ Gak ada lagu yang lagi diputar.');

    if (!args[0]) return m.reply(`🔊 Volume sekarang: **${session.volume || 100}%**`);

    const vol = parseInt(args[0], 10);
    if (isNaN(vol) || vol < 0 || vol > 100) {
        return m.reply('❌ Volume harus angka antara 0-100, contoh: `.volume 80`');
    }

    session.resource?.volume?.setVolume(vol / 100);
    setSession(m.guild.id, { volume: vol });

    await m.react('🔊').catch(() => {});
    return m.reply(`🔊 Volume diatur ke **${vol}%**.`);
}

export { pluginConfig as config, handler };
