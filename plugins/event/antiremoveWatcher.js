import axios from 'axios';
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { getGroup } from '../../lib/groupStore.js';

const config = {
    name: 'antiremoveWatcher',
    alias: [],
    category: 'event',
    description: 'Mem-forward ulang pesan (teks/gambar/video/sticker) yang dihapus jika antiremove aktif',
    usage: 'otomatis (tidak dipanggil via command)',
    example: '-',
    isOwner: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    isEnabled: true,
};

// Jalan otomatis via event Discord saat ada pesan yang dihapus
const event = 'messageDelete';

// Bantuan: download file jadi Buffer biar attachment (termasuk video) bisa langsung diputar ulang
async function downloadBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(res.data);
}

async function handler(message, { client }) {
    try {
        if (!message.guild) return;
        if (message.author?.bot) return;

        const group = getGroup(message.guild.id);
        if (group.antiremove !== 'on') return;

        const content = message.content || '*(tidak ada teks)*';
        const attachments = [...(message.attachments?.values() || [])];
        const stickers = [...(message.stickers?.values() || [])];

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Pesan Terhapus Terdeteksi')
            .setColor(0xff5555)
            .addFields(
                { name: '👤 Pengirim', value: message.author ? `<@${message.author.id}>` : 'Tidak diketahui', inline: true },
                { name: '📍 Channel', value: `<#${message.channel.id}>`, inline: true },
                { name: '📝 Isi Pesan', value: content.slice(0, 1000) }
            )
            .setTimestamp();

        // Siapkan file attachment (gambar/video ikut didownload ulang biar bisa langsung diputar/dilihat)
        const files = [];
        for (const att of attachments) {
            try {
                const buf = await downloadBuffer(att.url);
                files.push(new AttachmentBuilder(buf, { name: att.name || 'file' }));
            } catch (e) {
                // Kalau gagal didownload (misal link kadaluarsa), fallback kirim link aja
                embed.addFields({ name: '📎 Lampiran (link)', value: att.url });
            }
        }

        // Sticker: bot gak bisa "kirim ulang" sticker orang lain secara native,
        // jadi kita tampilkan preview gambarnya + namanya di embed
        if (stickers.length > 0) {
            const stickerList = stickers.map((s) => `• ${s.name}`).join('\n');
            embed.addFields({ name: '🎭 Sticker', value: stickerList });
            embed.setImage(stickers[0].url); // preview sticker pertama
        } else if (files.length > 0 && /\.(png|jpe?g|gif|webp)$/i.test(attachments[0]?.name || '')) {
            embed.setImage(`attachment://${attachments[0].name}`);
        }

        // Kirim ke channel log yang sudah di-set lewat `.antiremove channel #channel`.
        // Kalau belum pernah di-set, baru fallback ke channel asal pesan (perilaku lama).
        let targetChannel = message.channel;
        if (group.antiremoveChannel) {
            const configured = message.guild.channels.cache.get(group.antiremoveChannel)
                || await message.guild.channels.fetch(group.antiremoveChannel).catch(() => null);
            if (configured) {
                targetChannel = configured;
            } else {
                console.error(`AntiRemove Watcher: channel log ${group.antiremoveChannel} tidak ditemukan, fallback ke channel asal.`);
            }
        }

        await targetChannel.send({ embeds: [embed], files });
    } catch (error) {
        console.error('AntiRemove Watcher Error:', error);
    }
}

export { config, handler, event };