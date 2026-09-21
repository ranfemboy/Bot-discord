import { EmbedBuilder } from 'discord.js';

const pluginConfig = {
    name: 'totalfitur',
    alias: ['totalfeature', 'totalcmd', 'countplugin', 'distribusi'],
    category: 'general',
    description: 'Lihat total fitur/command bot',
    usage: '.totalfitur',
    example: '.totalfitur',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    isEnabled: true
}

const ICONS = {
    main: '🏠', tools: '🔧', downloader: '📥', download: '📥', sticker: '🎨',
    ai: '🤖', media: '📷', game: '🎮', rpg: '⚔️', maker: '🖼️', fun: '🎭',
    group: '👥', owner: '👑', premium: '💎', info: '📊', search: '🔍',
    canvas: '🎨', anime: '🌸', general: 'ℹ️', utility: '🛠️', economy: '💰',
    admin: '🛠️', event: '📢', store: '🛒', convert: '🔄', other: '📦'
}

async function handler(m, { client }) {
    try {
        const cats = {}
        let total = 0, enabled = 0

        client.plugins.forEach(plugin => {
            if (!plugin.config) return
            const cat = plugin.config.category || 'other'
            if (!cats[cat]) cats[cat] = { total: 0, enabled: 0 }
            cats[cat].total++
            total++
            if (plugin.config.isEnabled !== false) {
                cats[cat].enabled++
                enabled++
            }
        })

        await m.react('📊')

        const sorted = Object.entries(cats).sort((a, b) => b[1].total - a[1].total)

        // Discord gak punya sendTable, jadi tabelnya dirender manual pakai code block monospace
        const rows = sorted.map(([cat, data]) => {
            const pct = ((data.total / total) * 100).toFixed(1)
            const label = `${ICONS[cat] || '📦'} ${cat.toUpperCase()}`.padEnd(18, ' ')
            const jumlah = data.total.toString().padEnd(7, ' ')
            return `${label}${jumlah}${pct}%`
        })

        const table =
            'Kategori'.padEnd(18, ' ') + 'Jumlah'.padEnd(7, ' ') + 'Persen\n' +
            '─'.repeat(34) + '\n' +
            rows.join('\n')

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📊 Distribusi Fitur')
            .setDescription('```' + table + '```')
            .addFields({
                name: 'Ringkasan',
                value: `Total: **${total}** | Aktif: **${enabled}** | Kategori: **${sorted.length}**`
            })
            .setFooter({ text: `Total ${total} fitur tersedia` })
            .setTimestamp()

        await m.reply({ embeds: [embed] })

    } catch (error) {
        await m.react('☢')
        console.error('Totalfitur Plugin Error:', error)
        await m.reply('❌ *GAGAL*\n\n> Terjadi kesalahan saat mengambil data fitur.')
    }
}

export { pluginConfig as config, handler }