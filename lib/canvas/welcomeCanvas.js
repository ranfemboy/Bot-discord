/*
✦ Welcome Canvas — lingkaran avatar + @username bergaya pixel
✦ Background: assets/images/welcome-canvas-bg.png (WAJIB ada, ini yang "gak bisa diubah
   kecuali pembuat script" — ganti file-nya langsung kalau mau ganti background)
✦ Koordinat LAYOUT di bawah diukur dari background 1920x1080.
   Kalau background diganti ukuran/posisi lingkaran beda, sesuaikan LAYOUT ini.
*/
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BG_LOCAL = join(__dirname, '..', '..', 'assets', 'images', 'welcome-canvas-bg.png');
const FONTS_DIR = join(__dirname, 'fonts');

let fontsRegistered = false;
function registerFonts() {
    if (fontsRegistered) return;
    const pixelFontPath = join(FONTS_DIR, 'PressStart2P.ttf');
    if (existsSync(pixelFontPath)) {
        GlobalFonts.registerFromPath(pixelFontPath, 'Pixel');
    }
    fontsRegistered = true;
}

async function loadAvatarImage(avatarURL) {
    const res = await axios.get(avatarURL, { responseType: 'arraybuffer' });
    return loadImage(Buffer.from(res.data));
}

// === Koordinat hasil ukur dari gambar contoh (1920x1080) — SILAKAN DIUBAH kalau meleset ===
const LAYOUT = {
    avatar: { cx: 976, cy: 435, r: 250, borderWidth: 18 },
    username: { cx: 976, y: 940, fontSize: 100 },
};

/**
 * Render welcome canvas jadi PNG buffer.
 * @param {object} p
 * @param {string} p.username   - ditampilkan sebagai @username
 * @param {string} p.avatarURL  - URL avatar Discord member
 */
export async function renderWelcomeCanvas(p) {
    if (!existsSync(BG_LOCAL)) {
        throw new Error('Background welcome canvas belum ada! Taruh di: assets/images/welcome-canvas-bg.png');
    }
    registerFonts();

    const bgImg = await loadImage(BG_LOCAL);
    const W = bgImg.width;
    const H = bgImg.height;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bgImg, 0, 0, W, H);

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
        // kalau avatar gagal dimuat, biarin lingkaran putih polos
    }

    // === Username pixel style: @username ===
    const uname = LAYOUT.username;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${uname.fontSize}px Pixel`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`@${p.username}`, uname.cx, uname.y);
    ctx.restore();

    return await canvas.encode('png');
}