import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

function formatTime(sec = 0) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function progressBar(current, total, length = 15) {
  const ratio = total > 0 ? Math.min(current / total, 1) : 0;
  const filled = Math.round(length * ratio);
  const bar = '━'.repeat(filled) + '●' + '─'.repeat(Math.max(0, length - filled));
  return `${formatTime(current)} ${bar} ${formatTime(total)}`;
}

function volumeBar(vol = 100, length = 10) {
  const filled = Math.round((vol / 100) * length);
  return '▮'.repeat(filled) + '▯'.repeat(length - filled);
}

export function nowPlayingEmbed({ title, thumbnail, current = 0, duration = 0, requestedBy, volume = 100, paused = false }) {
  return new EmbedBuilder()
    .setColor(paused ? '#888888' : '#1DB954')
    .setAuthor({ name: paused ? '⏸️ Paused' : '🎵 Listening to' })
    .setTitle(title)
    .setThumbnail(thumbnail)
    .setDescription(
      `${progressBar(current, duration)}\n\n` +
      `ılıılıılıılıılıılı\n\n` +
      `**Volume**\n${volumeBar(volume)} ${volume}%`
    )
    .setFooter({ text: requestedBy ? `Diminta oleh ${requestedBy}` : '' });
}

export function musicButtons(paused = false) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music_return').setLabel('Return').setEmoji('⏮️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_toggle').setLabel(paused ? 'Play' : 'Pause').setEmoji(paused ? '▶️' : '⏸️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music_voldown').setLabel('Vol -').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_volup').setLabel('Vol +').setEmoji('🔊').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_off').setLabel('Off').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
  );
  return [row1, row2];
}