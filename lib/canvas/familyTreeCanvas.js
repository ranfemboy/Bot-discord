/*
✦ Family Tree Canvas — full self-drawn (gradient + shapes), TIDAK butuh asset gambar
✦ Layout: Papa/Mama di atas, Kamu + Kakak/Adik di tengah, Anak di bawah
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
    const medium = join(FONTS_DIR, 'Inter-Medium.ttf');
    if (existsSync(semibold)) GlobalFonts.registerFromPath(semibold, 'Inter SemiBold');
    if (existsSync(medium)) GlobalFonts.registerFromPath(medium, 'Inter Medium');
    fontsRegistered = true;
}

async function loadAvatarImage(avatarURL) {
    const res = await axios.get(avatarURL, { responseType: 'arraybuffer' });
    return loadImage(Buffer.from(res.data));
}

function drawAvatarCircle(ctx, img, cx, cy, r, borderColor) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = borderColor;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
}

const ROLE_LABEL = { papa: 'Papa', mama: 'Mama', kakak: 'Kakak', adik: 'Adik', anak: 'Anak' };

/**
 * Render family tree jadi PNG buffer.
 * @param {object} p
 * @param {{username:string, avatarURL:string}} p.center
 * @param {Array<{username:string, avatarURL:string, role:string}>} p.members
 */
export async function renderFamilyTree(p) {
    registerFonts();

    const W = 1400;
    const H = 900;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1F2937');
    grad.addColorStop(1, '#4CA1AF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '700 42px Inter SemiBold';
    ctx.textAlign = 'center';
    ctx.fillText('🌳 FAMILY TREE', W / 2, 60);
    ctx.restore();

    const centerX = W / 2;
    const centerY = 470;
    const r = 85;

    const parents = p.members.filter((m) => m.role === 'papa' || m.role === 'mama').slice(0, 2);
    const kakak = p.members.filter((m) => m.role === 'kakak').slice(0, 3);
    const adik = p.members.filter((m) => m.role === 'adik').slice(0, 3);
    const anak = p.members.filter((m) => m.role === 'anak').slice(0, 5);

    const parentY = 190;
    const anakY = 760;
    const anakStartX = centerX - ((anak.length - 1) * 260) / 2;

    // === Garis penghubung (digambar duluan biar avatar nutup ujungnya) ===
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 4;

    parents.forEach((mem, i) => {
        const x = parents.length === 1 ? centerX : centerX + (i === 0 ? -220 : 220);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - r);
        ctx.lineTo(x, parentY + r);
        ctx.stroke();
    });
    kakak.forEach((mem, i) => {
        const x = centerX - (i + 1) * 260;
        ctx.beginPath();
        ctx.moveTo(centerX - r, centerY);
        ctx.lineTo(x + r, centerY);
        ctx.stroke();
    });
    adik.forEach((mem, i) => {
        const x = centerX + (i + 1) * 260;
        ctx.beginPath();
        ctx.moveTo(centerX + r, centerY);
        ctx.lineTo(x - r, centerY);
        ctx.stroke();
    });
    anak.forEach((mem, i) => {
        const x = anakStartX + i * 260;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + r);
        ctx.lineTo(x, anakY - r);
        ctx.stroke();
    });

    // === Gambar avatar + label ===
    async function drawMember(mem, x, y, isCenter) {
        try {
            const img = await loadAvatarImage(mem.avatarURL);
            drawAvatarCircle(ctx, img, x, y, isCenter ? r + 10 : r, isCenter ? '#F1C40F' : '#FFFFFF');
        } catch {
            // gagal load avatar -> skip, tetep lanjut nampilin label
        }

        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `600 ${isCenter ? 30 : 26}px Inter SemiBold`;
        ctx.textAlign = 'center';
        let name = mem.username;
        while (ctx.measureText(name).width > 220 && name.length > 3) name = name.slice(0, -1);
        if (name !== mem.username) name += '…';
        ctx.fillText(name, x, y + r + (isCenter ? 48 : 42));
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#F1C40F';
        ctx.font = '600 20px Inter Medium';
        ctx.textAlign = 'center';
        ctx.fillText(isCenter ? '🌟 KAMU' : ROLE_LABEL[mem.role] || mem.role, x, y - r - 20);
        ctx.restore();
    }

    const tasks = [drawMember(p.center, centerX, centerY, true)];
    parents.forEach((mem, i) => {
        const x = parents.length === 1 ? centerX : centerX + (i === 0 ? -220 : 220);
        tasks.push(drawMember(mem, x, parentY, false));
    });
    kakak.forEach((mem, i) => tasks.push(drawMember(mem, centerX - (i + 1) * 260, centerY, false)));
    adik.forEach((mem, i) => tasks.push(drawMember(mem, centerX + (i + 1) * 260, centerY, false)));
    anak.forEach((mem, i) => tasks.push(drawMember(mem, anakStartX + i * 260, anakY, false)));

    await Promise.all(tasks);

    return await canvas.encode('png');
}
