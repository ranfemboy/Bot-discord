import { EmbedBuilder } from 'discord.js';
import { getSession } from '../../lib/musicStore.js';

const pluginConfig = {
    name: 'queue',
    alias: ['q', 'antrian'],
    category: 'music',
    description: 'Lihat antrian lagu',
    usage: '.queue',
    isEnabled: true,
};

async function handler(m) {
    const session = getSession(m.guild?.id);
    if (!session?.current && !(session?.queue?.length)) {
        return m.reply('❌ Gak ada lagu yang lagi diputar ataupun antrian.');
    }

    const queue = session.queue || [];
    const list = queue.length
        ? queue.map((t, i) => `**${i + 1}.** ${t.title}`).join('\n')
        : '_Antrian kosong._';

    const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle('🎶 Antrian Musik')
        .setDescription(
            `**Sedang diputar:**\n${session.current ? session.current.title : '_Tidak ada._'}\n\n` +
            `**Berikutnya:**\n${list}`
        )
        .setFooter({ text: `${queue.length} lagu dalam antrian` });

    return m.reply({ embeds: [embed] });
}

export { pluginConfig as config, handler };
