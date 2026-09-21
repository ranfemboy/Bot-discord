/*
✦ Profile Card Canvas — RPG stats (Exp, Level, Inventory)
✦ Background: art final milik Sensei sendiri → assets/images/profile-background.png
   (versi bersih, tanpa teks placeholder "Nama Discord" / "nama_barang | Jumlah")
✦ Koordinat di bawah ini diukur dari background.png (1920x1080).
   Kalau background diganti ukuran/layout beda, koordinat ini WAJIB disesuaikan ulang.
*/
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BG_LOCAL = join(__dirname, '..', '..', 'assets', 'images', 'profile-background.png');
const FONTS_DIR = join(__dirname, 'fonts');

let fontsRegistered = false;
function registerFonts() {
    if (fontsRegistered) return;
    GlobalFonts.registerFromPath(join(FONTS_DIR, 'Inter-Regular.ttf'), 'Inter');
    GlobalFonts.registerFromPath(join(FONTS_DIR, 'Inter-Medium.ttf'), 'Inter Medium');
    GlobalFonts.registerFromPath(join(FONTS_DIR, 'Inter-SemiBold.ttf'), 'Inter SemiBold');
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

function cap(s) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// === Koordinat hasil ukur dari background.png (1920x1080) ===
const LAYOUT = {
    avatar: { cx: 233, cy: 256, r: 128 },
    username: { x: 415, yBaseline: 275 },
    expBar: { x: 109, y: 482, w: 836, h: 58 },
    levelBar: { x: 983, y: 482, w: 882, h: 58 },
    inventory: {
        colX: [139, 627],
        rowYBaseline: [730, 811, 899],
    },
};

/**
 * Render profile card RPG jadi PNG buffer.
 * @param {object} p
 * @param {string} p.username
 * @param {string} p.avatarURL
 * @param {number} p.level
 * @param {number} p.currentXp     - XP di level sekarang (progress)
 * @param {number} p.neededXp      - XP dibutuhin buat naik level
 * @param {number} p.levelCap      - opsional, cap buat bar Level (default 100)
 * @param {object} p.weapons       - { pedang, pickaxe, busur }
 * @param {number} p.arrows
 * @param {object} p.potions       - { heal }
 */
export async function renderProfileCard(p) {
    if (!existsSync(BG_LOCAL)) {
        throw new Error('Background belum ada, Sensei~! Taruh di: assets/images/profile-background.png');
    }
    registerFonts();

    const bgImg = await loadImage(BG_LOCAL);
    const W = bgImg.width;
    const H = bgImg.height;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bgImg, 0, 0, W, H);

    // === Avatar bulat ===
    const { cx, cy, r } = LAYOUT.avatar;
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
        // kalau gagal load avatar, biarin circle background aja
    }

    // === Username ===
    const uname = LAYOUT.username;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 64px Inter SemiBold';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    let name = p.username;
    while (ctx.measureText(name).width > 900 && name.length > 3) {
        name = name.slice(0, -1);
    }
    if (name !== p.username) name += '…';
    ctx.fillText(name, uname.x, uname.yBaseline);
    ctx.restore();

    // === Exp bar ===
    const eb = LAYOUT.expBar;
    const expRatio = Math.min(1, Math.max(0, p.currentXp / p.neededXp));
    ctx.save();
    ctx.fillStyle = 'rgba(140,140,140,1)';
    drawRoundedRect(ctx, eb.x, eb.y, eb.w, eb.h, eb.h / 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, eb.x, eb.y, Math.max(eb.h, eb.w * expRatio), eb.h, eb.h / 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#2B2B2B';
    ctx.font = '600 22px Inter SemiBold';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${p.currentXp} / ${p.neededXp} XP`, eb.x + eb.w / 2, eb.y + eb.h / 2 + 1);
    ctx.restore();

    // === Level bar ===
    // Catatan asumsi: bar "Level" nunjukin progres level kamu menuju levelCap (default 100).
    const lb = LAYOUT.levelBar;
    const levelCap = p.levelCap || 100;
    const levelRatio = Math.min(1, Math.max(0, p.level / levelCap));
    ctx.save();
    ctx.fillStyle = 'rgba(140,140,140,1)';
    drawRoundedRect(ctx, lb.x, lb.y, lb.w, lb.h, lb.h / 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, lb.x, lb.y, Math.max(lb.h, lb.w * levelRatio), lb.h, lb.h / 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#2B2B2B';
    ctx.font = '600 22px Inter SemiBold';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Level ${p.level}`, lb.x + lb.w / 2, lb.y + lb.h / 2 + 1);
    ctx.restore();

    // === Inventory items ===
    const inv = LAYOUT.inventory;
    const w = p.weapons || {};
    const potions = p.potions || {};

    const items = [];
    if (w.pedang) items.push({ emoji: '🗡️', label: `Pedang ${cap(w.pedang)}`, value: '1x' });
    if (w.busur) items.push({ emoji: '🏹', label: 'Busur', value: '1x' });
    if (w.pickaxe) items.push({ emoji: '⛏️', label: `Pickaxe ${cap(w.pickaxe)}`, value: '1x' });
    items.push({ emoji: '🎯', label: 'Anak Panah', value: `${p.arrows ?? 0}x` });
    items.push({ emoji: '🧪', label: 'Potion Heal', value: `${potions.heal ?? 0}x` });

    // isi grid 2 kolom x 3 baris (maks 6 slot)
    let slot = 0;
    for (const item of items) {
        if (slot >= inv.colX.length * inv.rowYBaseline.length) break;
        const col = slot % inv.colX.length;
        const row = Math.floor(slot / inv.colX.length);
        const x = inv.colX[col];
        const yBase = inv.rowYBaseline[row];

        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '500 30px Inter Medium';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`${item.emoji} ${item.label}  |  ${item.value}`, x, yBase);
        ctx.restore();

        slot++;
    }

    return await canvas.encode('png');
}