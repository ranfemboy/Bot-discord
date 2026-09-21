import { EmbedBuilder } from 'discord.js';

const pluginConfig = {
    name: 'robloxstalk',
    alias: ['rblxstalk', 'rbxstalk', 'stalkroblox', 'stalkrbx'],
    category: 'tool',
    description: 'Stalk akun Roblox berdasarkan username',
    usage: '.robloxstalk <username>',
    example: '.robloxstalk Linkmon99',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true,
};

async function Roblox(username) {
    const search = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`);
    const searchJson = await search.json();

    if (!searchJson.data || !searchJson.data.length) {
        return { error: 'User tidak ditemukan' };
    }

    const user = searchJson.data[0];
    const userId = user.id;

    const [detail, avatar, followers, following, friends, groups, games, badges, inventory] = await Promise.all([
        fetch(`https://users.roblox.com/v1/users/${userId}`).then((r) => r.json()),
        fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`).then((r) => r.json()),
        fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`).then((r) => r.json()),
        fetch(`https://friends.roblox.com/v1/users/${userId}/followings/count`).then((r) => r.json()),
        fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`).then((r) => r.json()),
        fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`).then((r) => r.json()).catch(() => null),
        fetch(`https://games.roblox.com/v2/users/${userId}/games?limit=50`).then((r) => r.json()).catch(() => null),
        fetch(`https://badges.roblox.com/v1/users/${userId}/badges?limit=50`).then((r) => r.json()).catch(() => null),
        fetch(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=50`).then((r) => r.json()).catch(() => null),
    ]);

    let presence = null;
    try {
        const pres = await fetch(`https://presence.roblox.com/v1/presence/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: [userId] }),
        });
        const presJson = await pres.json();
        presence = presJson.userPresences?.[0] || null;
    } catch {
        presence = null;
    }

    return {
        id: detail.id,
        username: detail.name,
        displayName: detail.displayName,
        description: detail.description,
        created: detail.created,
        verified: user.hasVerifiedBadge,
        avatar: avatar?.data?.[0]?.imageUrl,
        social: {
            followers: followers?.count ?? 0,
            following: following?.count ?? 0,
            friends: friends?.count ?? 0,
        },
        groups: groups?.data || [],
        games: games?.data || [],
        badges: badges?.data || [],
        inventory: inventory?.data || null,
        presence,
    };
}

const presenceType = { 0: 'Offline', 1: 'Online', 2: 'In Game', 3: 'In Studio' };

async function handler(m, { args, prefix }) {
    // 🎮 args, bukan m.args yang gak pernah didefinisikan di codebase ini
    const username = args[0]?.trim();

    if (!username) {
        return m.reply(
            `🎮 *ʀᴏʙʟᴏx sᴛᴀʟᴋ*\n\n` + `> Masukkan username Roblox\n\n` + `\`Contoh: ${prefix}robloxstalk Linkmon99\``
        );
    }

    m.react('🔍');

    try {
        const res = await Roblox(username);

        if (res.error) {
            m.react('❌');
            return m.reply(`❌ Username *${username}* tidak ditemukan`);
        }

        const topGroups =
            res.groups?.slice(0, 5).map((v) => `◦ ${v.group.name} (${v.group.memberCount} members) — ${v.role.name}`).join('\n') ||
            '◦ Tidak ada';

        const topGames =
            res.games?.slice(0, 5).map((v) => `◦ ${v.name} (${(v.placeVisits || 0).toLocaleString()} visits)`).join('\n') || '◦ Tidak ada';

        const topBadges =
            res.badges?.slice(0, 5).map((v) => `◦ ${v.name} (${v.statistics?.awardedCount?.toLocaleString() || 0} awarded)`).join('\n') ||
            '◦ Tidak ada';

        const topInventory = Array.isArray(res.inventory)
            ? res.inventory.slice(0, 5).map((v) => `◦ ${v.name} (RAP: ${v.recentAveragePrice?.toLocaleString() || '-'})`).join('\n') || '◦ Tidak ada'
            : '◦ Private / tidak tersedia';

        const presInfo = res.presence
            ? `Status: ${presenceType[res.presence.userPresenceType] || res.presence.userPresenceType}\nLast Location: ${res.presence.lastLocation || '-'}`
            : 'Tidak tersedia';

        const embed = new EmbedBuilder()
            .setTitle('🎮 ʀᴏʙʟᴏx sᴛᴀʟᴋ')
            .setColor('#00A2FF')
            .setThumbnail(res.avatar || null)
            .setURL(`https://roblox.com/users/${res.id}/profile`)
            .addFields(
                {
                    name: '👤 Profile',
                    value:
                        `🆔 ID: ${res.id}\n` +
                        `📛 Username: ${res.username}\n` +
                        `🎭 Display: ${res.displayName}\n` +
                        `✅ Verified: ${res.verified ? 'Ya' : 'Tidak'}\n` +
                        `📅 Created: ${res.created ? new Date(res.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`,
                    inline: false,
                },
                {
                    name: '👥 Social',
                    value: `Friends: ${res.social.friends.toLocaleString()}\nFollowers: ${res.social.followers.toLocaleString()}\nFollowing: ${res.social.following.toLocaleString()}`,
                    inline: false,
                },
                { name: '📡 Presence', value: presInfo, inline: false },
                { name: `👥 Groups (${res.groups.length})`, value: topGroups.slice(0, 1024), inline: false },
                { name: `🎮 Games (${res.games.length})`, value: topGames.slice(0, 1024), inline: false },
                { name: `🏆 Badges (${res.badges.length})`, value: topBadges.slice(0, 1024), inline: false },
                { name: '🎒 Inventory', value: topInventory.slice(0, 1024), inline: false }
            )
            .setDescription(res.description?.substring(0, 300) || '-')
            .setFooter({ text: 'Roblox Stalk' })
            .setTimestamp();

        m.react('✅');
        await m.reply({ embeds: [embed] });
    } catch (e) {
        console.error('Roblox Stalk Error:', e);
        m.react('❌');
        m.reply(`❌ Error: ${e.message}`);
    }
}

export { pluginConfig as config, handler };
