/**
 * Cek Femboy — Discord version
 * -----------------------------
 * Dikonversi dari cekfemboy.js (m/sock-based, WA).
 * Perbedaan utama:
 *  - fs/ffmpeg helper custom (queueFFmpeg, fetchBuffer, te) diganti pakai
 *    axios + ffmpeg-static langsung, karena project ini gak punya helper itu.
 *  - sock.sendMedia() diganti AttachmentBuilder + m.reply({ files }).
 *  - target user pakai m.mentions.users.first() (pola project ini), bukan m.mentionedJid.
 */
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegPath from 'ffmpeg-static';
import { AttachmentBuilder } from 'discord.js';
import cekfemboy from '../../lib/scraper/cekfemboy.js';

const execFileAsync = promisify(execFile);

export const config = {
    name: 'cekfemboy',
    alias: ['femboy'],
    category: 'fun',
    description: 'Cek seberapa femboy kamu',
    usage: '.cekfemboy <nama> / .cekfemboy @user',
    example: '.cekfemboy Budi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

async function fetchBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    return Buffer.from(res.data);
}

async function convertGifToMp4(buffer) {
    const tempPath = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });

    const id = Date.now();
    const gifPath = path.join(tempPath, `cekfemboy-${id}.gif`);
    const mp4Path = path.join(tempPath, `cekfemboy-${id}.mp4`);

    try {
        fs.writeFileSync(gifPath, buffer);
        await execFileAsync(ffmpegPath, [
            '-y', '-ignore_loop', '0', '-i', gifPath,
            '-t', '30',
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
            '-movflags', 'faststart', '-preset', 'ultrafast', '-an',
            mp4Path,
        ]);
        if (!fs.existsSync(mp4Path)) throw new Error('Gagal convert GIF');
        return fs.readFileSync(mp4Path);
    } finally {
        try { if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath); } catch {}
        try { if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path); } catch {}
    }
}

export async function handler(m, { args }) {
    const target = m.mentions.users.first();
    const nama = target ? target.username : (args.join(' ').trim() || m.author.username);

    const result = cekfemboy(nama);

    let buffer = null;
    try {
        buffer = await fetchBuffer(result.gif);
    } catch (e) {
        // gif gagal diambil, lanjut kirim teks aja
    }

    let videoBuffer = null;
    if (buffer) {
        try {
            videoBuffer = await convertGifToMp4(buffer);
        } catch (e) {
            // convert gagal, fallback ke teks
        }
    }

    const txt = target
        ? `Kamu ingin ngecek tingkat kefemboyan <@${target.id}> yak?\n\n${result.hasil}`
        : `${result.hasil}`;

    if (videoBuffer) {
        const file = new AttachmentBuilder(videoBuffer, { name: 'cekfemboy.mp4' });
        return m.reply({ content: txt, files: [file] });
    }

    return m.reply(txt);
}