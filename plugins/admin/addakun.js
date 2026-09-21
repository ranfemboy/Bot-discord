import { EmbedBuilder } from 'discord.js';
import { addAccountsFromList, getStats } from '../../lib/amPremStore.js';

export const config = {
    name: 'addakun',
    alias: ['addam', 'addamprem'],
    category: 'admin',
    description: 'Nambahin stok akun Alight Motion dari file .txt (attach langsung / reply / upload sebelumnya) (khusus owner)',
    usage: '.addakun (attach file .txt, atau reply ke pesan yang ada file-nya)',
    example: '.addakun',
    isOwner: true, // cuma owner bot yang boleh restock
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

const FORMAT_HELP =
    '❌ Gak nemu file `.txt`-nya, Sensei~\n' +
    '> Lampirkan langsung di pesan command, reply ke pesan yang ada file-nya, atau kirim `.addakun` gak lama setelah upload file.\n\n' +
    '**Format tiap baris (pilih salah satu):**\n' +
    '`email|password_atau_link` → kalau link/passwordnya beda-beda\n' +
    '`email` doang → otomatis dibikinin link `https://generator.email/<email>`\n\n' +
    '**Contoh isi file:**\n' +
    '```\n' +
    'akun1@email.com|https://generator.email/akun1@email.com\n' +
    'akun2@email.com\n' +
    'akun3@email.com\n' +
    '```';

// 🔎 Cari lampiran .txt: dari pesan ini sendiri -> pesan yang di-reply -> pesan terakhir user di channel
async function findTxtAttachment(m) {
    // 1. Nempel langsung di pesan command
    let attachment = m.attachments.find(a => a.name?.toLowerCase().endsWith('.txt'));
    if (attachment) return attachment;

    // 2. Command dikirim sebagai reply ke pesan yang ada file-nya
    if (m.reference?.messageId) {
        try {
            const refMsg = await m.channel.messages.fetch(m.reference.messageId);
            attachment = refMsg.attachments.find(a => a.name?.toLowerCase().endsWith('.txt'));
            if (attachment) return attachment;
        } catch {
            // pesan reference gak ketemu/kehapus, lanjut ke cara berikutnya
        }
    }

    // 3. File dikirim di pesan terpisah sebelum command (mode upload-dulu-baru-command)
    try {
        const recent = await m.channel.messages.fetch({ limit: 10, before: m.id });
        const fromUser = recent.filter(msg => msg.author.id === m.author.id);
        for (const msg of fromUser.values()) {
            attachment = msg.attachments.find(a => a.name?.toLowerCase().endsWith('.txt'));
            if (attachment) return attachment;
        }
    } catch {
        // abaikan, nanti fallback ke FORMAT_HELP
    }

    return null;
}

export async function handler(m) {
    const attachment = await findTxtAttachment(m);

    if (!attachment) {
        return m.reply(FORMAT_HELP);
    }

    // 📥 Ambil isi file txt-nya
    let text;
    try {
        const res = await fetch(attachment.url);
        text = await res.text();
    } catch (err) {
        console.error('Gagal fetch file addakun:', err);
        return m.reply('❌ Gagal ngambil isi file-nya, coba upload ulang ya.');
    }

    const lines = text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

    if (lines.length === 0) {
        return m.reply('❌ File-nya kosong, Sensei~');
    }

    // 🧩 Parse tiap baris jadi { email, password }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const parsed = [];
    let invalidCount = 0;

    for (const line of lines) {
        const parts = line.split('|').map(p => p.trim()).filter(Boolean);
        let email, password;

        if (parts.length >= 2) {
            email = parts[0];
            password = parts.slice(1).join('|'); // jaga-jaga kalau link-nya sendiri ada karakter "|"
        } else {
            email = parts[0];
            password = `https://generator.email/${email}`;
        }

        if (!emailRegex.test(email)) {
            invalidCount++;
            continue;
        }

        parsed.push({ email, password });
    }

    if (parsed.length === 0) {
        return m.reply('❌ Gak ada baris yang formatnya valid, Sensei~ Cek lagi isi file-nya.\n\n' + FORMAT_HELP);
    }

    // 💾 Masukin ke data amprem (skip yang emailnya udah ada biar gak dobel)
    const result = addAccountsFromList(parsed);
    const stats = getStats();

    const embed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('📥 Stok Akun Alight Motion Berhasil Ditambah')
        .addFields(
            { name: '✅ Baru ditambah', value: `${result.added} akun`, inline: true },
            { name: '⏭️ Duplikat dilewati', value: `${result.skippedDuplicates} akun`, inline: true },
            { name: '⚠️ Format tak valid', value: `${invalidCount} baris`, inline: true },
            { name: '📦 Total stok sekarang', value: `${stats.available} available / ${stats.total} total`, inline: false },
        )
        .setTimestamp();

    await m.reply({ embeds: [embed] });
}
