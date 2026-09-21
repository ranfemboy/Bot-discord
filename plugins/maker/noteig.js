import axios from 'axios';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AttachmentBuilder } from 'discord.js';

const pluginConfig = {
    name: 'noteig',
    alias: ['nig', 'ig-note'],
    category: 'maker',
    description: 'Buat Instagram Note style',
    usage: '.noteig nama|note|waktu',
    example: '.noteig ranzx imup|text|3m',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 2,
    isEnabled: true
}

async function handler(m, { args, prefix }) {
    const text = args.join(' ');
    if (!text) {
        return m.reply(
            `*Format salah!*\n\nContoh penggunaan:\n${prefix}noteig ranzx imup|text|3m\n\n` +
            `Max 7 kata ya soalnya nanti kepanjangan 😅`
        );
    }

    const [userPayload, notePayload, timePayload] = text.split('|');
    const username = userPayload ? userPayload.trim() : (m.member?.displayName ?? m.author.username);
    let noteText = notePayload ? notePayload.trim() : 'Jujur ini janggal';
    const timeStr = timePayload ? timePayload.trim() : '3m';

    await m.react('🕐').catch(() => {});

    try {
        const words = noteText.trim().split(/\s+/).filter(Boolean);
        if (words.length > 7) {
            noteText = 'max';
        }

        const BG_URL = 'https://raw.githubusercontent.com/ryyntwx/allimagerin/refs/heads/main/bf3903f6-ae57-4d75-96a4-5c2e00c441c1.png';
        const DEFAULT_AVATAR = 'https://i.ibb.co/4pDNDk1/avatar.png';

        const ASSETS_DIR = join(process.cwd(), 'assets', 'ignotes');
        const FONTS_DIR = join(ASSETS_DIR, 'fonts');
        const BG_LOCAL = join(ASSETS_DIR, 'template.png');
        const TMP_DIR = join(process.cwd(), 'tmp');

        await mkdir(FONTS_DIR, { recursive: true });
        await mkdir(TMP_DIR, { recursive: true });

        const INTER_FONTS = [
            { url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2', file: 'Inter-Medium.ttf' },
            { url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2', file: 'Inter-SemiBold.ttf' }
        ];

        for (const font of INTER_FONTS) {
            const fontPath = join(FONTS_DIR, font.file);
            if (!existsSync(fontPath)) {
                const fRes = await axios.get(font.url, { responseType: 'arraybuffer' });
                await writeFile(fontPath, Buffer.from(fRes.data));
            }
            GlobalFonts.registerFromPath(fontPath, 'InterCustom');
        }

        if (!existsSync(BG_LOCAL)) {
            const res = await axios.get(BG_URL, { responseType: 'arraybuffer' });
            await writeFile(BG_LOCAL, Buffer.from(res.data));
        }

        let ppUrl = null;

        if (m.reference) {
            try {
                const repliedMsg = await m.channel.messages.fetch(m.reference.messageId);
                const attachment = repliedMsg.attachments.find(a => a.contentType?.startsWith('image/'));
                if (attachment) ppUrl = attachment.url;
            } catch { /* abaikan kalau gagal fetch */ }
        }

        if (!ppUrl && m.mentions.users.first()) {
            ppUrl = m.mentions.users.first().displayAvatarURL({ extension: 'png', size: 512 });
        }

        if (!ppUrl) {
            ppUrl = m.author.displayAvatarURL({ extension: 'png', size: 512 });
        }

        let ppBuffer;
        try {
            const ppRes = await axios.get(ppUrl, { responseType: 'arraybuffer' });
            ppBuffer = Buffer.from(ppRes.data);
        } catch {
            const ppRes = await axios.get(DEFAULT_AVATAR, { responseType: 'arraybuffer' });
            ppBuffer = Buffer.from(ppRes.data);
        }

        const canvas = createCanvas(1080, 1920);
        const ctx = canvas.getContext('2d');

        const bgImg = await loadImage(BG_LOCAL);
        ctx.drawImage(bgImg, 0, 0, 1080, 1920);
        const ppImg = await loadImage(ppBuffer);

        const ppX = 310, ppY = 779, ppRadius = 75;
        const userX = 534, userY = 624, userSize = 36;
        const cardX = 384, cardY = 777, baseTextSize = 40;
        const msgX = 78, msgY = 1011, msgSize = 46;
        const fontName = 'InterCustom';

        ctx.save();
        ctx.beginPath();
        ctx.arc(ppX, ppY, ppRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(ppImg, ppX - ppRadius, ppY - ppRadius, ppRadius * 2, ppRadius * 2);
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = `600 ${userSize}px ${fontName}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${username}  ·  ${timeStr}`, userX, userY);

        ctx.font = `500 ${baseTextSize}px ${fontName}`;
        const textMetrics = ctx.measureText(noteText).width;
        const paddingX = 32;
        const paddingY = 20;
        const bubbleW = textMetrics + (paddingX * 2);
        const bubbleH = baseTextSize + (paddingY * 2);
        const radius = bubbleH / 2;

        ctx.fillStyle = '#434954';
        ctx.beginPath();
        ctx.roundRect(cardX, cardY - (bubbleH / 2), bubbleW, bubbleH, radius);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cardX - 6, cardY + 2, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(noteText, cardX + paddingX, cardY);

        ctx.fillStyle = '#727272';
        ctx.font = `500 ${msgSize}px ${fontName}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Message ${username}`, msgX, msgY);

        const outPath = join(TMP_DIR, `ignote-${Date.now()}.png`);
        await writeFile(outPath, await canvas.encode('png'));

        const file = new AttachmentBuilder(outPath, { name: 'noteig.png' });
        await m.reply({
            content: `*Instagram Note Berhasil 🤤*\n\n👤 ${username}\n📝 ${noteText}\n⏰ ${timeStr}`,
            files: [file]
        });

        await m.react('✅').catch(() => {});

    } catch (e) {
        console.error('Note IG Error:', e);
        await m.react('❌').catch(() => {});
        await m.reply(`❌ *GAGAL*\n\n> ${e.message}`);
    }
}

export { pluginConfig as config, handler }