import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { spawn } from 'child_process';
import path from 'path';
import spotifyUrlInfo from 'spotify-url-info';
import { getSession, setSession, pushHistory, shiftQueue, addQueue } from '../../lib/musicStore.js';
import { nowPlayingEmbed, musicButtons } from '../../lib/musicEmbed.js';

const { getData: getSpotifyData, getTracks: getSpotifyTracks } = spotifyUrlInfo(fetch);

const pluginConfig = {
    name: 'play',
    alias: ['p'],
    category: 'music',
    description: 'Putar lagu dari YouTube, atau link/playlist Spotify, di voice channel',
    usage: '.play <judul lagu | link YouTube | link Spotify>',
    isEnabled: true,
};

const COOKIES_PATH = path.resolve('cookies.txt');
const YTDLP_BIN = path.resolve('bin/yt-dlp');
const DENO_BIN = path.resolve('.deno/bin/deno');
const JS_RUNTIME_ARGS = ['--js-runtimes', `deno:${DENO_BIN}`];

const SPOTIFY_TRACK_RE = /open\.spotify\.com\/(?:intl-\w+\/)?track\/[a-zA-Z0-9]+/;
const SPOTIFY_PLAYLIST_RE = /open\.spotify\.com\/(?:intl-\w+\/)?(playlist|album)\/[a-zA-Z0-9]+/;
const MAX_PLAYLIST_TRACKS = 25;

function spotifyTrackToQuery(t) {
    const artists = t.artists?.map((a) => a.name).join(', ') || t.artist || '';
    return artists ? `${artists} - ${t.name || t.title}` : (t.name || t.title);
}

function ytdlpSearch(query) {
    return new Promise((resolve, reject) => {
        const proc = spawn(YTDLP_BIN, [
            `ytsearch1:${query}`,
            '--dump-single-json',
            '--no-warnings',
            '--flat-playlist',
            '--cookies', COOKIES_PATH,
            '--remote-components', 'ejs:github',
            ...JS_RUNTIME_ARGS,
        ]);

        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (chunk) => { stdout += chunk; });
        proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

        proc.on('error', (err) => reject(err));
        proc.on('close', (exitCode) => {
            if (exitCode !== 0) {
                console.error(`[yt-dlp search stderr] ${stderr.trim()}`);
                return reject(new Error(`yt-dlp keluar dengan kode ${exitCode}`));
            }
            try {
                resolve(JSON.parse(stdout));
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function ensureVoiceSession(guildId, voiceChannel, guild) {
    let session = getSession(guildId);
    if (session?.connection) return session;

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: guild.voiceAdapterCreator,
    });

    connection.on('stateChange', (oldState, newState) => {
        console.log(`[VoiceConnection | ${guildId}] ${oldState.status} -> ${newState.status}`);
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
    } catch (err) {
        connection.destroy();
        throw new Error('VOICE_CONNECT_TIMEOUT');
    }

    const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
    connection.subscribe(player);
    player.on('error', (error) => {
        console.error(`[AudioPlayer error | ${guildId}]`, error.message);
    });

    setSession(guildId, { connection, player, queue: [], volume: 100 });
    return getSession(guildId);
}

export async function playTrack(guild, channel, track, requestedBy) {
    const session = getSession(guild.id);

    const ytProcess = spawn(YTDLP_BIN, [
        `https://www.youtube.com/watch?v=${track.id}`,
        '-f', 'bestaudio',
        '-o', '-',
        '--cookies', COOKIES_PATH,
        '--remote-components', 'ejs:github',
        ...JS_RUNTIME_ARGS,
    ]);

    ytProcess.stderr.on('data', (chunk) => {
        console.error(`[yt-dlp stderr | ${guild.id}] ${chunk.toString().trim()}`);
    });
    ytProcess.on('error', (err) => {
        console.error(`[yt-dlp spawn error | ${guild.id}]`, err.message);
        channel.send('❌ Ada masalah pas mutar lagu ini, coba lagu lain dulu ya.').catch(() => {});
    });

    const resource = createAudioResource(ytProcess.stdout, { inlineVolume: true });
    resource.volume.setVolume((session.volume || 100) / 100);

    session.player.play(resource);
    setSession(guild.id, { current: track, resource, ytProcess, startedAt: Date.now(), paused: false });

    session.player.once(AudioPlayerStatus.Playing, async () => {
        const embed = nowPlayingEmbed({
            title: track.title,
            thumbnail: `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`,
            duration: track.duration || 0,
            requestedBy,
            volume: session.volume || 100,
        });
        const components = musicButtons(false);

        const currentSession = getSession(guild.id);
        if (currentSession?.nowPlayingMessage) {
            try {
                await currentSession.nowPlayingMessage.edit({ embeds: [embed], components });
                return;
            } catch (err) {
                // pesan lama gak ketemu/kehapus, lanjut kirim baru di bawah
            }
        }

        const msg = await channel.send({ embeds: [embed], components });
        setSession(guild.id, { nowPlayingMessage: msg });
    });

    session.player.once(AudioPlayerStatus.Idle, () => {
        const currentSession = getSession(guild.id);
        const loopMode = currentSession?.loopMode || 'off';
        const wasSkipped = currentSession?.skipRequested;

        if (wasSkipped) {
            setSession(guild.id, { skipRequested: false });
        }

        if (loopMode === 'song' && !wasSkipped) {
            playTrack(guild, channel, track, requestedBy);
            return;
        }

        pushHistory(guild.id, track);

        if (loopMode === 'queue') {
            addQueue(guild.id, track);
        }

        const next = shiftQueue(guild.id);
        if (next) playTrack(guild, channel, next, requestedBy);
    });
}

async function handler(m, { args }) {
    const query = args.join(' ').trim();
    if (!query) return m.reply('❌ Kasih judul lagu, link YouTube, atau link Spotify. Contoh: `.play nama lagu`');

    const voiceChannel = m.member?.voice?.channel;
    if (!voiceChannel) return m.reply('❌ Kamu harus join voice channel dulu.');

    if (SPOTIFY_PLAYLIST_RE.test(query)) {
        return handleSpotifyPlaylist(m, voiceChannel, query);
    }

    let searchQuery = query;
    if (SPOTIFY_TRACK_RE.test(query)) {
        await m.react('🎧').catch(() => {});
        try {
            const data = await getSpotifyData(query);
            searchQuery = spotifyTrackToQuery(data);
        } catch (err) {
            console.error(`[Spotify track error | ${m.guild.id}]`, err.message);
            await m.react('❌').catch(() => {});
            return m.reply('❌ Gagal ambil info dari link Spotify itu. Pastikan link-nya valid dan publik.');
        }
    }

    await m.react('🕕').catch(() => {});

    let info;
    try {
        info = await ytdlpSearch(searchQuery);
    } catch (err) {
        console.error(`[Search error | ${m.guild.id}]`, err.message);
        await m.react('❌').catch(() => {});
        return m.reply('❌ Gagal mencari lagunya, coba lagi beberapa saat lagi ya.');
    }
    const track = info.entries?.[0];
    if (!track) {
        await m.react('❌').catch(() => {});
        return m.reply('❌ Lagu tidak ditemukan.');
    }

    let session;
    try {
        session = await ensureVoiceSession(m.guild.id, voiceChannel, m.guild);
    } catch (err) {
        await m.react('❌').catch(() => {});
        return m.reply('❌ Gagal masuk ke voice channel, coba lagi ya.');
    }

    if (session.player && session.player.state.status !== AudioPlayerStatus.Idle) {
        addQueue(m.guild.id, track);
        await m.react('➕').catch(() => {});
        return m.reply(`➕ Ditambahkan ke antrian: **${track.title}**`);
    }

    await m.react('✅').catch(() => {});
    await playTrack(m.guild, m.channel, track, m.author?.username);
}

async function handleSpotifyPlaylist(m, voiceChannel, url) {
    await m.react('🎧').catch(() => {});

    let spotifyTracks;
    try {
        spotifyTracks = await getSpotifyTracks(url);
    } catch (err) {
        console.error(`[Spotify playlist error | ${m.guild.id}]`, err.message);
        await m.react('❌').catch(() => {});
        return m.reply('❌ Gagal ambil daftar lagu dari playlist/album Spotify itu. Pastikan link-nya valid dan publik.');
    }

    if (!spotifyTracks?.length) {
        await m.react('❌').catch(() => {});
        return m.reply('❌ Playlist/album ini kosong atau gak bisa diakses.');
    }

    const limited = spotifyTracks.slice(0, MAX_PLAYLIST_TRACKS);
    const skipped = spotifyTracks.length - limited.length;

    await m.reply(
        `🎧 Ketemu **${spotifyTracks.length}** lagu di playlist${skipped > 0 ? ` (cuma **${MAX_PLAYLIST_TRACKS}** lagu pertama yang diproses)` : ''}. ` +
        `Lagi nyariin satu-satu di YouTube, sabar ya, Sensei...`
    );

    let session;
    try {
        session = await ensureVoiceSession(m.guild.id, voiceChannel, m.guild);
    } catch (err) {
        await m.react('❌').catch(() => {});
        return m.reply('❌ Gagal masuk ke voice channel, coba lagi ya.');
    }

    let addedCount = 0;
    for (const spotifyTrack of limited) {
        const searchQuery = spotifyTrackToQuery(spotifyTrack);

        let ytInfo;
        try {
            ytInfo = await ytdlpSearch(searchQuery);
        } catch (err) {
            console.error(`[Spotify->YT search gagal | ${m.guild.id}] "${searchQuery}":`, err.message);
            continue;
        }
        const ytTrack = ytInfo.entries?.[0];
        if (!ytTrack) continue;

        if (session.player.state.status !== AudioPlayerStatus.Idle) {
            addQueue(m.guild.id, ytTrack);
        } else {
            await playTrack(m.guild, m.channel, ytTrack, m.author?.username);
        }
        addedCount++;
    }

    await m.react('✅').catch(() => {});
    return m.channel.send(`✅ Selesai! **${addedCount}** dari ${limited.length} lagu berhasil ditambahkan ke antrian.`);
}

export { pluginConfig as config, handler };