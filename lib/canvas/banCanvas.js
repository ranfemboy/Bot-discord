/*
✦ Ban Canvas — mirip pola welcomeCanvas.js (lingkaran avatar + teks username),
   bedanya background di sini digambar langsung pakai canvas (gradient merah polos),
   BUKAN dari file gambar. Jadi gak butuh asset tambahan di assets/images/.
✦ Ukuran fix 1280x720, semua koordinat di LAYOUT diukur dari situ.
*/
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = join(__dirname, 'fonts');

let fontsRegistered = false;
function registerFonts() {
    if (fontsRegistered) return;
    const semiBold = join(FONTS_DIR, 'Inter-SemiBold.ttf');
    const regular = join(FONTS_DIR, 'Inter-Regular.ttf');
    if (existsSync(semiBold)) GlobalFonts.registerFromPath(semiBold, 'Inter SemiBold');
    if (existsSync(regular)) GlobalFonts.registerFromPath(regular, 'Inter');
    fontsRegistered = true;
}

async function loadAvatarImage(avatarURL) {
    const res = await axios.get(avatarURL, { responseType: 'arraybuffer' });
    return loadImage(Buffer.from(res.data));
}

const W = 1280;
const H = 720;

const LAYOUT = {
    avatar: { cx: W / 2, cy: 260, r: 130, borderWidth: 10 },
    title: { cx: W / 2, y: 470, fontSize: 64 },
    username: { cx: W / 2, y: 525, fontSize: 34 },
    reason: { cx: W / 2, y: 590, fontSize: 26, maxWidth: W - 160 },
    moderator: { cx: W / 2, y: 650, fontSize: 22 },
};

// 📝 Pecah teks jadi beberapa baris biar gak keluar dari canvas (alasan ban bisa panjang)
function wrapText(ctx, text, maxWidth) {
    const words = text.split(/ +/);
    const lines = [];
    let current = '';

    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines.slice(0, 2); // max 2 baris biar layout gak berantakan
}

/**
 * Render ban canvas jadi PNG buffer.
 * @param {object} p
 * @param {string} p.username    - ditampilkan sebagai @username yang kena ban
 * @param {string} p.avatarURL   - URL avatar Discord member yang kena ban
 * @param {string} [p.reason]    - alasan ban
 * @param {string} [p.moderator] - tag moderator yang ngeban
 */
export async function renderBanCanvas(p) {
    registerFonts();

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // === Background gradient merah simple ===
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#3A0000');
    gradient.addColorStop(0.5, '#8B0000');
    gradient.addColorStop(1, '#3A0000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Sedikit vignette biar gak flat banget
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H / 4, W / 2, H / 2, H);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // === Lingkaran avatar + border putih ===
    const { cx, cy, r, borderWidth } = LAYOUT.avatar;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + borderWidth, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();

    try {
        const avatarImg = await loadAvatarImage(p.avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg, cx - r, cy - r, r * 2, r * 2);
        ctx.restore();
    } catch {
        // avatar gagal dimuat, biarin lingkaran putih polos
    }

    // === Judul "BANNED" ===
    const title = LAYOUT.title;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${title.fontSize}px "Inter SemiBold"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('BANNED', title.cx, title.y);
    ctx.restore();

    // === Username ===
    const uname = LAYOUT.username;
    ctx.save();
    ctx.fillStyle = '#FFD6D6';
    ctx.font = `${uname.fontSize}px "Inter SemiBold"`;
    ctx.textAlign = 'center';
    ctx.fillText(`@${p.username}`, uname.cx, uname.y);
    ctx.restore();

    // === Alasan ===
    if (p.reason) {
        const reasonLayout = LAYOUT.reason;
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${reasonLayout.fontSize}px Inter`;
        ctx.textAlign = 'center';
        const lines = wrapText(ctx, `Alasan: ${p.reason}`, reasonLayout.maxWidth);
        lines.forEach((line, i) => {
            ctx.fillText(line, reasonLayout.cx, reasonLayout.y + i * (reasonLayout.fontSize + 6));
        });
        ctx.restore();
    }

    // === Moderator ===
    if (p.moderator) {
        const mod = LAYOUT.moderator;
        ctx.save();
        ctx.fillStyle = '#FFB3B3';
        ctx.font = `${mod.fontSize}px Inter`;
        ctx.textAlign = 'center';
        ctx.fillText(`Dieksekusi oleh: ${p.moderator}`, mod.cx, mod.y + (p.reason ? 40 : 0));
        ctx.restore();
    }

    return await canvas.encode('png');
}
