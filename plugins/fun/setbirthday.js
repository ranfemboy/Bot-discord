import { parseBirthdayInput, setBirthday, formatBirthdayDate } from '../../lib/birthdayStore.js';

const pluginConfig = {
    name: 'setbirthday',
    alias: ['ultah', 'setultah'],
    category: 'fun',
    description: 'Daftarin tanggal ulang tahun kamu biar di-notif otomatis pas harinya',
    usage: '.setbirthday <tanggal-bulan-tahun>',
    example: '.setbirthday 17-08-2000  atau  .setbirthday 17-08 (tanpa tahun, privasi)',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
};

async function handler(m, { args, prefix }) {
    const input = args.join(' ').trim();

    if (!input) {
        return m.reply(
            `🎂 *SET BIRTHDAY*\n\n` +
                `Format: \`${prefix}setbirthday tanggal-bulan-tahun\`\n\n` +
                `*Contoh:*\n` +
                `\`${prefix}setbirthday 17-08-2000\` — dengan tahun\n` +
                `\`${prefix}setbirthday 17-08\` — tanpa tahun (biar privasi, umur gak ditampilin)`
        );
    }

    const parsed = parseBirthdayInput(input);
    if (!parsed) {
        return m.reply(
            `❌ Format tanggal gak valid!\n\n` +
                `Pakai format: \`tanggal-bulan-tahun\` atau \`tanggal-bulan\`\n` +
                `*Contoh:* \`${prefix}setbirthday 17-08-2000\` atau \`${prefix}setbirthday 17-08\``
        );
    }

    setBirthday(m.author.id, parsed.day, parsed.month, parsed.year);

    return m.reply(
        `✅ Ulang tahun kamu berhasil disimpan: **${formatBirthdayDate(parsed)}**\n` +
            `Nanti bakal di-tag otomatis pas harinya di server yang udah setting channel ulang tahun~ 🎉`
    );
}

export { pluginConfig as config, handler };