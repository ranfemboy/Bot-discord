import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import { EmbedBuilder, AttachmentBuilder } from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  name: "ttmp3",
  alias: ["ttmusic", "tiktokmusic"],
  category: "download",
  description: "Download audio TikTok",
  usage: ".ttmp3 <url>",
  example: ".ttmp3 https://vt.tiktok.com/xxx",
  isOwner: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
};

// ─── Ambil data TikTok (sama kayak plugins/download/tiktok.js, pakai API tikwm) ───
async function tiktokDl(url) {
  const domain = "https://www.tikwm.com/api/";
  const res = (
    await axios.post(
      domain,
      {},
      {
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Origin: "https://www.tikwm.com",
          Referer: "https://www.tikwm.com/",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
        },
        params: { url, count: 12, cursor: 0, web: 1, hd: 1 },
      }
    )
  ).data.data;

  if (!res) throw new Error("Data TikTok tidak ditemukan, cek lagi link-nya.");

  return {
    title: res.title,
    cover: "https://www.tikwm.com" + res.cover,
    video_nowm_hd: res.hdplay ? "https://www.tikwm.com" + res.hdplay : null,
    video_nowm: res.play ? "https://www.tikwm.com" + res.play : null,
    music_info: {
      title: res.music_info?.title,
      author: res.music_info?.author,
      url:
        res.music || res.music_info?.play
          ? "https://www.tikwm.com" + (res.music || res.music_info.play)
          : null,
    },
  };
}

function getTempDir() {
  const tmpDir = path.join(__dirname, "../../tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  return tmpDir;
}

async function downloadBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

// 🎛️ Fallback: extract audio dari video pakai ffmpeg-static, kalau API gak ngasih link mp3 langsung
async function extractAudioFromVideo(videoUrl) {
  const tmpDir = getTempDir();
  const stamp = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const inputFile = path.join(tmpDir, `ttmp3_${stamp}.mp4`);
  const outputFile = path.join(tmpDir, `ttmp3_${stamp}.mp3`);

  const videoBuffer = await downloadBuffer(videoUrl);
  fs.writeFileSync(inputFile, videoBuffer);

  await new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ["-i", inputFile, "-vn", "-acodec", "libmp3lame", "-y", outputFile]);
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg keluar dengan kode ${code}`));
    });
  });

  if (!fs.existsSync(outputFile) || fs.statSync(outputFile).size <= 0) {
    throw new Error("Gagal mengekstrak audio TikTok");
  }

  return {
    buffer: fs.readFileSync(outputFile),
    files: [inputFile, outputFile],
  };
}

async function handler(m, { args, prefix }) {
  const url = args.join(" ").trim();
  let cleanupFiles = [];

  const cleanupTempFiles = () => {
    for (const file of cleanupFiles) {
      if (!file) continue;
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch {}
    }
    cleanupFiles = [];
  };

  if (!url) {
    await m.react("❌").catch(() => {});
    return m.reply(
      `🎵 **TIKTOK AUDIO DOWNLOADER**\n\nUsage: \`${prefix}${config.name} <url>\`\nContoh: \`${prefix}${config.name} https://vt.tiktok.com/xxx\``
    );
  }

  if (!/tiktok\.com|vt\.tiktok/i.test(url)) {
    await m.react("❌").catch(() => {});
    return m.reply("❌ URL tidak valid. Gunakan link TikTok.");
  }

  await m.react("🕕").catch(() => {});

  try {
    const result = await tiktokDl(url);

    let audioBuffer;
    if (result.music_info.url) {
      audioBuffer = await downloadBuffer(result.music_info.url);
    } else {
      const videoUrl = result.video_nowm_hd || result.video_nowm;
      if (!videoUrl) throw new Error("Audio TikTok tidak ditemukan.");
      const extracted = await extractAudioFromVideo(videoUrl);
      cleanupFiles = extracted.files;
      audioBuffer = extracted.buffer;
    }

    const attachment = new AttachmentBuilder(audioBuffer, { name: `TikTok_Audio_${Date.now()}.mp3` });

    const embed = new EmbedBuilder()
      .setTitle("🎵 TIKTOK AUDIO DOWNLOADER")
      .setDescription(result.title || "-")
      .setColor(0x00ff99)
      .setThumbnail(result.cover)
      .addFields(
        { name: "🎼 Judul Audio", value: result.music_info.title || "-", inline: true },
        { name: "🎤 Artist", value: result.music_info.author || "-", inline: true }
      );

    await m.reply({ embeds: [embed], files: [attachment] });
    await m.react("✅").catch(() => {});
  } catch (err) {
    console.error("[TTMP3] Error:", err);
    await m.react("❌").catch(() => {});
    m.reply(`❌ *GAGAL MENGUNDUH*\n\n> ${err.message}`).catch(() => {});
  } finally {
    cleanupTempFiles();
  }
}

export { config, handler };