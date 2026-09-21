import axios from "axios";
import { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { createTtAudioSession, getTtAudioSession } from "../../lib/ttAudioStore.js";

async function tiktokDl(url) {
  function formatNumber(integer) {
    let numb = parseInt(integer);
    return Number(numb).toLocaleString().replace(/,/g, ".");
  }

  function formatDate(n, locale = "en") {
    let d = new Date(n);
    return d.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
  }

  let data = [];
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
      },
    )
  ).data.data;

  if (res?.duration == 0) {
    res.images.forEach((v) => data.push({ type: "photo", url: v }));
  } else {
    data.push(
      { type: "watermark", url: "https://www.tikwm.com" + (res?.wmplay || "/undefined") },
      { type: "nowatermark", url: "https://www.tikwm.com" + (res?.play || "/undefined") },
      { type: "nowatermark_hd", url: "https://www.tikwm.com" + (res?.hdplay || "/undefined") },
    );
  }

  return {
    status: true,
    title: res.title,
    taken_at: formatDate(res.create_time).replace("1970", ""),
    region: res.region,
    id: res.id,
    durations: res.duration,
    duration: res.duration + " Seconds",
    cover: "https://www.tikwm.com" + res.cover,
    data,
    music_info: {
      id: res.music_info.id,
      title: res.music_info.title,
      author: res.music_info.author,
      album: res.music_info.album || null,
      url: "https://www.tikwm.com" + (res.music || res.music_info.play),
    },
    stats: {
      views: formatNumber(res.play_count),
      likes: formatNumber(res.digg_count),
      comment: formatNumber(res.comment_count),
      share: formatNumber(res.share_count),
      download: formatNumber(res.download_count),
    },
    author: {
      id: res.author.id,
      fullname: res.author.unique_id,
      nickname: res.author.nickname,
      avatar: "https://www.tikwm.com" + res.author.avatar,
    },
  };
}

// Bantuan: download file jadi Buffer biar bisa dikirim sebagai attachment Discord
async function downloadBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

const config = {
  name: "tiktok",
  alias: ["tt", "ttmp4", "tiktokdl", "ttdown"],
  category: "download",
  description: "Download video/slide TikTok tanpa watermark",
  usage: ".tiktok <url>",
  example: ".tiktok https://vt.tiktok.com/xxx",
  isOwner: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  isEnabled: true,
};

async function handler(m, { args, prefix }) {
  const text = args.join(" ").trim();

  if (!text) {
    await m.react("❌").catch(() => {});
    return m.reply(`📌 Contoh: *${prefix}${config.name} https://vt.tiktok.com/...*`);
  }

  await m.react("🕕").catch(() => {});

  try {
    const result = await tiktokDl(text);

    if (result.durations > 0 && result.duration !== "0 Seconds") {
      // --- Video ---
      const target = result.data.find((e) => e.type === "nowatermark_hd" || e.type === "nowatermark");
      const videoBuffer = await downloadBuffer(target.url);
      const videoAttachment = new AttachmentBuilder(videoBuffer, { name: "tiktok.mp4" });

      // 🎵 Simpen link audio ke session sementara (link musiknya kepanjangan buat customId)
      const audioSessionId = createTtAudioSession({
        url: result.music_info.url,
        title: result.music_info.title,
        ownerId: m.author.id,
      });

      const embed = new EmbedBuilder()
        .setTitle("🎬 TIKTOK DOWNLOADER")
        .setDescription(result.title || "-")
        .setColor(0x00ff99)
        .setThumbnail(result.cover)
        .addFields(
          { name: "👤 Author", value: `${result.author.nickname} (@${result.author.fullname})`, inline: false },
          { name: "🎵 Music", value: `${result.music_info.title} - ${result.music_info.author}`, inline: false },
          { name: "⏱️ Duration", value: result.duration, inline: true },
          { name: "🌎 Region", value: result.region || "-", inline: true },
          { name: "👀 Views", value: result.stats.views, inline: true },
          { name: "❤️ Likes", value: result.stats.likes, inline: true },
          { name: "💬 Comments", value: result.stats.comment, inline: true },
          { name: "🔁 Shares", value: result.stats.share, inline: true },
        )
        .setFooter({ text: `Uploaded: ${result.taken_at}\n🌿 Mau dapetin audio nya juga? kalau mau bisa tekan tombol dibawah` });

      const audioButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ttaudio_${audioSessionId}`)
          .setLabel('📩 Unduh Audionya')
          .setStyle(ButtonStyle.Danger)
      );

      await m.reply({ embeds: [embed], files: [videoAttachment], components: [audioButton] });
    } else {
      // --- Slide foto ---
      const images = result.data.slice(0, 10); // Discord max 10 attachment per pesan
      const attachments = await Promise.all(
        images.map(async (img, i) => {
          const buf = await downloadBuffer(img.url);
          return new AttachmentBuilder(buf, { name: `tiktok_${i + 1}.jpg` });
        })
      );

      const embed = new EmbedBuilder()
        .setTitle("🖼️ TIKTOK SLIDE DOWNLOADER")
        .setDescription(result.title || "-")
        .setColor(0x00ff99)
        .setFooter({ text: `Uploaded: ${result.taken_at}` });

      await m.reply({ embeds: [embed], files: attachments });
    }

    await m.react("✅").catch(() => {});
  } catch (e) {
    console.error(e);
    await m.react("❌").catch(() => {});
    m.reply("Coba lagi nanti ya, link nya mungkin invalid atau server TikTok lagi sibuk.").catch(() => {});
  }
}

// 🖱 Dipanggil dari handler/interactionHandler.js pas tombol "Unduh Audionya" dipencet
export async function handleTiktokAudioButton(interaction) {
  const sessionId = interaction.customId.replace('ttaudio_', '');
  const session = getTtAudioSession(sessionId);

  if (!session) {
    return interaction.reply({ content: '❌ Link audio ini udah kadaluarsa, download ulang videonya ya~', ephemeral: true });
  }
  if (interaction.user.id !== session.ownerId) {
    return interaction.reply({ content: '❌ Tombol ini bukan buat kamu, Sensei~', ephemeral: true });
  }

  await interaction.deferReply();

  try {
    const buffer = await downloadBuffer(session.url);
    const safeName = (session.title || 'tiktok-audio').replace(/[^\w\s-]/g, '').trim() || 'tiktok-audio';
    const attachment = new AttachmentBuilder(buffer, { name: `${safeName}.mp3` });
    await interaction.editReply({ content: `🎵 **${session.title || 'Audio TikTok'}**`, files: [attachment] });
  } catch (e) {
    console.error('TikTok audio download error:', e);
    await interaction.editReply('❌ Gagal download audio, coba lagi nanti ya.');
  }
}

export { config, handler };
