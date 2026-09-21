/*
✦ Ship Canvas — full self-drawn (gradient + hati manual pake bezier), gak butuh asset gambar
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
    const semibold = join(FONTS_DIR, 'Inter-SemiBold.ttf');
    if (existsSync(semibold)) GlobalFonts.registerFromPath(semibold, 'Inter SemiBold');
    fontsRegistered = true;
}

async function loadAvatarImage(avatarURL) {
    const res = await axios.get(avatarURL, { responseType: 'arraybuffer' });
    return loadImage(Buffer.from(res.data));
}

function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawHeart(ctx, cx, cy, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const top = size * 0.3;
    ctx.moveTo(cx, cy + top);
    ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + top);
    ctx.bezierCurveTo(cx - size / 2, cy + (size + top) / 2, cx, cy + (size + top) / 1.3, cx, cy + size);
    ctx.bezierCurveTo(cx, cy + (size + top) / 1.3, cx + size / 2, cy + (size + top) / 2, cx + size / 2, cy + top);
    ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + top);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function pickColor(percent) {
    if (percent >= 80) return '#FF4D6D';
    if (percent >= 50) return '#FF8FA3';
    if (percent >= 20) return '#B0B0B0';
    return '#6C7A89';
}

/**
 * Render ship card jadi PNG buffer.
 * @param {object} p
 * @param {{username:string, avatarURL:string}} p.userA
 * @param {{username:string, avatarURL:string}} p.userB
 * @param {number} p.percent - 0-100
 * @param {string} p.label
 */
export async function renderShipCard(p) {
    registerFonts();

    const W = 1000;
    const H = 560;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#3E0C46');
    grad.addColorStop(1, '#7B2D6E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const heartColor = pickColor(p.percent);
    const avatarR = 150;
    const cyAvatar = 220;
    const cxA = 260;
    const cxB = W - 260;

    async function drawAvatar(user, cx) {
        try {
            const img = await loadAvatarImage(user.avatarURL);
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cyAvatar, avatarR + 8, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cyAvatar, avatarR, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, cx - avatarR, cyAvatar - avatarR, avatarR * 2, avatarR * 2);
            ctx.restore();
        } catch {
            // avatar gagal load -> biarin circle putih polos
        }

        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 32px Inter SemiBold';
        ctx.textAlign = 'center';
        let name = user.username;
        while (ctx.measureText(name).width > 340 && name.length > 3) name = name.slice(0, -1);
        if (name !== user.username) name += '…';
        ctx.fillText(name, cx, cyAvatar + avatarR + 55);
        ctx.restore();
    }

    await Promise.all([drawAvatar(p.userA, cxA), drawAvatar(p.userB, cxB)]);

    drawHeart(ctx, W / 2, cyAvatar - 70, 140, heartColor);

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 46px Inter SemiBold';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${p.percent}%`, W / 2, cyAvatar - 15);
    ctx.restore();

    const barX = 120, barY = 430, barW = W - 240, barH = 40;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    drawRoundedRect(ctx, barX, barY, barW, barH, barH / 2);
    ctx.fill();
    ctx.fillStyle = heartColor;
    drawRoundedRect(ctx, barX, barY, Math.max(barH, (barW * p.percent) / 100), barH, barH / 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 34px Inter SemiBold';
    ctx.textAlign = 'center';
    ctx.fillText(p.label, W / 2, 510);
    ctx.restore();

    return await canvas.encode('png');
}
