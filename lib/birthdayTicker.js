import moment from 'moment-timezone';
import { EmbedBuilder } from 'discord.js';
import { getBirthdaysOn, formatBirthdayDate, calculateAge } from './birthdayStore.js';
import { getAllConfiguredGuilds, markAnnouncedToday } from './birthdayConfigStore.js';

const TZ = 'Asia/Jakarta';
const CHECK_INTERVAL_MS = 60 * 1000;

let tickTimer = null;

async function runBirthdayCheck(client) {
    const now = moment().tz(TZ);
    const todayStr = now.format('YYYY-MM-DD');
    const day = now.date();
    const month = now.month() + 1;

    const birthdaysToday = getBirthdaysOn(day, month);
    if (birthdaysToday.length === 0) return;

    const guildConfigs = getAllConfiguredGuilds();

    for (const cfg of guildConfigs) {
        if (cfg.lastAnnouncedDate === todayStr) continue;

        try {
            const guild = await client.guilds.fetch(cfg.guildId).catch(() => null);
            if (!guild) continue;

            const channel = await client.channels.fetch(cfg.channelId).catch(() => null);
            if (!channel) continue;

            const membersHere = [];
            for (const b of birthdaysToday) {
                const member = await guild.members.fetch(b.userId).catch(() => null);
                if (member) membersHere.push({ ...b, member });
            }

            if (membersHere.length === 0) {
                markAnnouncedToday(cfg.guildId, todayStr);
                continue;
            }

            const description = membersHere
                .map((b) => {
                    const age = calculateAge(b, now.toDate());
                    const ageText = age !== null ? ` (${age} tahun)` : '';
                    return `🎂 ${b.member}${ageText} — ${formatBirthdayDate(b)}`;
                })
                .join('\n');

            const embed = new EmbedBuilder()
                .setColor('#FF9ECD')
                .setTitle('🎉 Selamat Ulang Tahun! 🎉')
                .setDescription(
                    `Yuk kita ucapin selamat ulang tahun buat member kita hari ini~ 🌸\n\n${description}\n\n` +
                        `Semoga panjang umur, sehat selalu, dan makin sukses! 🎈✨`
                )
                .setTimestamp();

            const mentionsText = membersHere.map((b) => `${b.member}`).join(' ');

            await channel.send({
                content: `@everyone 🎂 ${mentionsText}`,
                embeds: [embed],
                allowedMentions: { parse: ['everyone', 'users'] },
            });

            markAnnouncedToday(cfg.guildId, todayStr);
        } catch (error) {
            console.error(`Birthday Ticker Error (guild ${cfg.guildId}):`, error);
        }
    }
}

export function startBirthdayTicker(client) {
    if (tickTimer) return;

    runBirthdayCheck(client).catch((e) => console.error('Birthday Ticker Initial Check Error:', e));

    tickTimer = setInterval(() => {
        runBirthdayCheck(client).catch((e) => console.error('Birthday Ticker Error:', e));
    }, CHECK_INTERVAL_MS);
}

export function stopBirthdayTicker() {
    if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
    }
}