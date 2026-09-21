import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { dashboardEvents, getReplies, getDMList, getDMHistory, logDM } from './dashboardStore.js';

export function startDashboardApi(client, port = 3000) {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, { cors: { origin: '*' } });

    app.use(cors());
    app.use(express.json());

    // --- Pesan: reply ke bot ---
    app.get('/api/replies', (req, res) => res.json(getReplies()));

    app.post('/api/replies/send', async (req, res) => {
        const { channelId, content } = req.body;
        if (!channelId || !content) return res.status(400).json({ error: 'channelId & content wajib diisi' });
        try {
            const channel = await client.channels.fetch(channelId);
            await channel.send(content);
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // --- Pesan: DM ---
    app.get('/api/dms', (req, res) => res.json(getDMList()));
    app.get('/api/dms/:userId', (req, res) => res.json(getDMHistory(req.params.userId)));

    app.post('/api/dms/:userId', async (req, res) => {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'content wajib diisi' });
        try {
            const user = await client.users.fetch(req.params.userId);
            await user.send(content);
            logDM(user.id, user.tag, user.displayAvatarURL({ dynamic: true, size: 128 }), { fromBot: true, content, timestamp: Date.now() });
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // --- List Server ---
    app.get('/api/servers', (req, res) => {
        res.json([...client.guilds.cache.values()].map((g) => ({ id: g.id, name: g.name, memberCount: g.memberCount, icon: g.iconURL({ size: 128 }) })));
    });

    app.get('/api/servers/:guildId/channels', (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.status(404).json({ error: 'Server gak ketemu' });
        res.json(guild.channels.cache.filter((c) => c.isTextBased?.() && !c.isThread()).map((c) => ({ id: c.id, name: c.name })));
    });

    // 🏷️ List sticker custom milik 1 server (buat fitur kirim sticker)
    app.get('/api/servers/:guildId/stickers', async (req, res) => {
        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.status(404).json({ error: 'Server gak ketemu' });
        try {
            const stickers = await guild.stickers.fetch();
            res.json(stickers.map((s) => ({ id: s.id, name: s.name, url: s.url })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Kirim pesan biasa ATAU sticker ke channel tertentu
    app.post('/api/servers/:guildId/send', async (req, res) => {
        const { channelId, content, stickerId } = req.body;
        if (!channelId || (!content && !stickerId)) return res.status(400).json({ error: 'channelId & (content/stickerId) wajib diisi' });

        const guild = client.guilds.cache.get(req.params.guildId);
        if (!guild) return res.status(404).json({ error: 'Server gak ketemu' });
        const channel = guild.channels.cache.get(channelId);
        if (!channel?.isTextBased?.()) return res.status(404).json({ error: 'Channel gak ketemu' });

        try {
            const payload = {};
            if (content) payload.content = content;
            if (stickerId) payload.stickers = [stickerId];
            await channel.send(payload);
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 😀 Semua custom emoji yang bot punya akses (dari semua server yang di-join, termasuk "external")
    app.get('/api/emojis', (req, res) => {
        const emojis = [...client.emojis.cache.values()].slice(0, 300).map((e) => ({
            id: e.id,
            name: e.name,
            url: e.imageURL({ size: 32 }),
            animated: e.animated,
        }));
        res.json(emojis);
    });

    io.on('connection', (socket) => socket.emit('init', { replies: getReplies(), dms: getDMList() }));
    dashboardEvents.on('newReply', (entry) => io.emit('newReply', entry));
    dashboardEvents.on('newDM', (payload) => io.emit('newDM', payload));

    httpServer.listen(port, '0.0.0.0', () => {
        console.log(`📡 Dashboard API jalan di port ${port} (bisa diakses dari luar)`);
    });
}