import axios from 'axios'
import { EmbedBuilder } from 'discord.js'

const pluginConfig = {
    name: 'amprem',
    alias: ['almo', 'alightmotion', 'ampremverify'],
    category: 'tool',
    description: 'Klaim akun Alight Motion Premium pakai email sendiri lewat magic link',
    usage: '.amprem <email>\n.ampremverify <magic-link>',
    example: '.amprem user@gmail.com',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const BASE_URL = 'https://am.yappi.my.id'

const COOKIE_API = `${BASE_URL}/api/cookie`
const SEND_API = `${BASE_URL}/api/send`
const VERIFY_API = `${BASE_URL}/api/verify`

// ======================================================
// SESSION
// ======================================================
//
// userId => {
//     email,
//     cookie,
//     message,
//     createdAt
// }
//
const sessions = new Map()

const SESSION_TIME = 10 * 60 * 1000

// ======================================================
// EMAIL VALIDATOR
// ======================================================

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ======================================================
// EMBED
// ======================================================

function embed(
    color,
    title,
    description
) {
    return new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
}

// ======================================================
// EDIT MESSAGE
// ======================================================

async function editStatus(
    message,
    color,
    title,
    description
) {
    return message.edit({
        embeds: [
            embed(
                color,
                title,
                description
            )
        ]
    })
}

// ======================================================
// GET COOKIE
// ======================================================

async function getSessionCookie() {

    try {

        const response =
            await axios.get(
                COOKIE_API,
                {
                    timeout: 10000,
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
                    }
                }
            )

        if (
            response.data?.ok &&
            response.data?.cookie
        ) {
            return response.data.cookie
        }

        throw new Error(
            response.data?.error ||
            'Gagal mendapatkan session cookie'
        )

    } catch (error) {

        throw new Error(
            error.response?.data?.error ||
            error.message
        )
    }
}

// ======================================================
// SEND VERIFICATION
// ======================================================

async function sendVerificationLink(
    email,
    cookie
) {

    try {

        const response =
            await axios.post(
                SEND_API,
                {
                    email,
                    cookie
                },
                {
                    timeout: 30000,

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Origin':
                            BASE_URL,

                        'Referer':
                            `${BASE_URL}/`,

                        'User-Agent':
                            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
                    }
                }
            )

        if (response.data?.ok) {
            return true
        }

        throw new Error(
            response.data?.error ||
            'Gagal mengirim verification link'
        )

    } catch (error) {

        throw new Error(
            error.response?.data?.error ||
            error.message
        )
    }
}

// ======================================================
// VERIFY MAGIC LINK
// ======================================================

async function verifyMagicLink(
    email,
    link,
    cookie
) {

    try {

        const response =
            await axios.post(
                VERIFY_API,
                {
                    email,
                    link,
                    cookie
                },
                {
                    timeout: 30000,

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Origin':
                            BASE_URL,

                        'Referer':
                            `${BASE_URL}/`,

                        'User-Agent':
                            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
                    }
                }
            )

        if (response.data?.ok) {
            return response.data
        }

        throw new Error(
            response.data?.error ||
            'Verification gagal'
        )

    } catch (error) {

        throw new Error(
            error.response?.data?.error ||
            error.message
        )
    }
}

// ======================================================
// HANDLER
// ======================================================

async function handler(
    m,
    {
        client,
        settings,
        args,
        command: rawCommand
    }
) {

    try {

        // ==================================================
        // COMMAND
        // ==================================================

        const command =
            String(
                rawCommand || ''
            ).toLowerCase().trim()

        // ==================================================
        // USER ID
        // ==================================================

        const sender =
            m.author?.id

        if (!sender) {
            return
        }

        // ==================================================
        // AMPRem (nama utama + alias, TAPI bukan ampremverify)
        // ==================================================

        const amremCommands = [
            pluginConfig.name,
            'almo',
            'alightmotion'
        ]

        if (amremCommands.includes(command)) {

            // ----------------------------------------------
            // AMBIL EMAIL DARI args
            // ----------------------------------------------

            const email =
                args?.[0]?.trim()

            // ----------------------------------------------
            // EMAIL KOSONG
            // ----------------------------------------------

            if (!email) {

                return m.reply(
                    `❌ *EMAIL BELUM DIBERIKAN*\n\n` +
                    `Gunakan:\n` +
                    `\`${settings.prefix}amprem email@gmail.com\``
                )
            }

            // ----------------------------------------------
            // VALIDASI
            // ----------------------------------------------

            if (!isValidEmail(email)) {

                return m.reply(
                    `❌ *FORMAT EMAIL TIDAK VALID*\n\n` +
                    `Email yang diterima:\n` +
                    `\`${email}\``
                )
            }

            // ----------------------------------------------
            // SESSION LAMA
            // ----------------------------------------------

            const oldSession =
                sessions.get(sender)

            if (oldSession) {

                const expired =
                    Date.now() -
                    oldSession.createdAt >
                    SESSION_TIME

                if (!expired) {

                    return m.reply(
                        `⚠️ *SESSION MASIH AKTIF*\n\n` +
                        `Email: \`${oldSession.email}\`\n\n` +
                        `Silakan cek inbox dan gunakan:\n` +
                        `\`${settings.prefix}ampremverify <magic-link>\``
                    )
                }

                sessions.delete(sender)
            }

            // ----------------------------------------------
            // CREATE MESSAGE
            // ----------------------------------------------

            const statusMessage =
                await m.reply({
                    embeds: [
                        embed(
                            '#FEE75C',
                            '⏳ Menginisialisasi...',
                            'Sedang menyiapkan session AMPRem.\n\n' +
                            'Mohon tunggu...'
                        )
                    ]
                })

            // ----------------------------------------------
            // GET COOKIE
            // ----------------------------------------------

            await editStatus(
                statusMessage,
                '#FEE75C',
                '⏳ Mengambil Session...',
                'Sedang menghubungkan ke server.\n\n' +
                'Mohon tunggu...'
            )

            const cookie =
                await getSessionCookie()
            await editStatus(
                statusMessage,
                '#FEE75C',
                '📨 Mengirim Verification Link...',
                `Sedang mengirim verification link ke:\n\n` +
                `📧 **${email}**`
            )

            await sendVerificationLink(
                email,
                cookie
            )
            sessions.set(
                sender,
                {
                    email,
                    cookie,
                    message: statusMessage,
                    createdAt: Date.now()
                }
            )
            return editStatus(
                statusMessage,
                '#57F287',
                '✅ Verification Link Terkirim!',
                `Verification link berhasil dikirim ke:\n\n` +
                `📧 **${email}**\n\n` +
                `📩 Silakan cek inbox email kamu.\n\n` +
                `Setelah mendapatkan magic link, gunakan:\n\n` +
                `\`${settings.prefix}ampremverify <magic-link>\`\n\n` +
                `⏳ Session berlaku selama **10 menit**.`
            )
        }
        if (command === 'ampremverify') {
            const link =
                args?.join(' ')?.trim()

            if (!link) {

                return m.reply(
                    `❌ *MAGIC LINK BELUM DIBERIKAN*\n\n` +
                    `Gunakan:\n` +
                    `\`${settings.prefix}ampremverify <magic-link>\``
                )
            }
            const session =
                sessions.get(sender)

            if (!session) {

                return m.reply(
                    `❌ *SESSION TIDAK DITEMUKAN*\n\n` +
                    `Gunakan terlebih dahulu:\n\n` +
                    `\`${settings.prefix}amprem email@gmail.com\``
                )
            }

            if (
                Date.now() -
                session.createdAt >
                SESSION_TIME
            ) {

                sessions.delete(sender)

                try {

                    return await editStatus(
                        session.message,
                        '#ED4245',
                        '⌛ Session Expired',
                        `Session verifikasi sudah kedaluwarsa.\n\n` +
                        `Silakan gunakan:\n` +
                        `\`${settings.prefix}amprem email@gmail.com\``
                    )

                } catch {

                    return m.reply(
                        `⌛ *SESSION EXPIRED*\n\n` +
                        `Silakan gunakan \`${settings.prefix}amprem email@gmail.com\` lagi.`
                    )
                }
            }

            await editStatus(
                session.message,
                '#FEE75C',
                '⏳ Memverifikasi...',
                'Magic link sedang diverifikasi.\n\n' +
                'Mohon tunggu...'
            )

            await verifyMagicLink(
                session.email,
                link,
                session.cookie
            )

            sessions.delete(sender)

            return editStatus(
                session.message,
                '#57F287',
                '✅ VERIFICATION SUCCESSFUL!',
                'Verifikasi berhasil dilakukan.\n\n' +
                'Silakan lihat **Alight Motion** kamu.'
            )
        }

    } catch (error) {

        console.error(
            '[AMPREM] Plugin Error:',
            error
        )
        const sender =
            m.author?.id

        const session =
            sessions.get(sender)

        if (session?.message) {

            try {

                await editStatus(
                    session.message,
                    '#ED4245',
                    '❌ GAGAL',
                    `Terjadi kesalahan:\n\n` +
                    `> ${error.message}`
                )

                sessions.delete(sender)

                return

            } catch (editError) {

                console.error(
                    '[AMPREM] Edit Error:',
                    editError
                )
            }
        }

        return m.reply(
            `❌ *AMPREM GAGAL*\n\n` +
            `> ${error.message}`
        )
    }
}

export {
    pluginConfig as config,
    handler
}
