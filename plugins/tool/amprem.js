import axios from 'axios'
import crypto from 'crypto'

const pluginConfig = {
    name: 'amprem',
    alias: ['amp'],
    category: 'tool',
    description: 'Alight Motion Premium',
    usage: '.amprem send <email> | .amprem verif <email>|<link>',
    example: '.amprem send user@gmail.com',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const cfg = {
    key: 'AIzaSyDtG1AU22ErnQD60AzBAcaknySiz9_CEq0',
    idt: 'https://www.googleapis.com/identitytoolkit/v3/relyingparty',
    vfy: 'https://us-central1-alight-creative.cloudfunctions.net/verifyPurchase'
}

const dip = () => [1, 0, 0, 1].map(() => crypto.randomInt(1, 255)).join('.')
const sp = (h) => ({
    ...h,
    'x-forwarded-for': dip(),
    'x-real-ip': dip(),
    'client-ip': dip(),
    'x-client-ip': dip(),
    'x-originating-ip': dip(),
    'x-cluster-client-ip': dip()
})

const h1 = {
    'content-type': 'application/json',
    'x-android-package': 'com.alightcreative.motion',
    'x-android-cert': 'ECA6BF91B8715A6F810ED0BBFC65B6CD578F52A8',
    'user-agent': 'dalvik/2.1.0 (linux; u; android 15; 23127pn0cc build/bp1a.250505.005)'
}
const h2 = {
    'content-type': 'application/json; charset=utf-8',
    'user-agent': 'okhttp/3.12.1'
}

const bad = (e) => {
    const d = e.response?.data
    return d ? (typeof d === 'object' ? JSON.stringify(d) : String(d)) : e.message
}

async function link(email) {
    try {
        await axios.post(`${cfg.idt}/createAuthUri?key=${cfg.key}`,
            { identifier: email, continueUri: 'http://localhost' },
            { headers: sp(h1) })
        const r = await axios.post(`${cfg.idt}/getOobConfirmationCode?key=${cfg.key}`, {
            requestType: 6, email,
            androidInstallApp: true, canHandleCodeInApp: true,
            continueUrl: 'https://alightcreative.com?ui_sid=0366624874&ui_sd=0',
            iosBundleId: 'com.alightcreative.motion',
            androidPackageName: 'com.alightcreative.motion',
            androidMinimumVersion: '585',
            clientType: 'CLIENT_TYPE_ANDROID'
        }, { headers: sp(h1) })
        return { ok: true, r: r.data }
    } catch (e) { return { ok: false, why: bad(e) } }
}

function parseCode(raw) {
    if (!raw) return null
    let s = String(raw).replace(/&/g, '&')
    try { s = decodeURIComponent(s) } catch {}
    const m = s.match(/oobCode=([a-zA-Z0-9_-]+)/i)
    if (m) return m[1]
    try {
        const u = new URL(s)
        const c = u.searchParams.get('oobCode')
        if (c) return c.replace(/[^a-zA-Z0-9_-]/g, '')
    } catch {}
    const t = raw.trim()
    if (/^[a-zA-Z0-9_-]{10,}$/.test(t) && !t.includes('://')) return t
    return null
}

async function auth(email, raw) {
    const c = parseCode(raw)
    if (!c) return { ok: false, why: 'Code tidak ditemukan' }
    try {
        const a = await axios.post(`${cfg.idt}/emailLinkSignin?key=${cfg.key}`, {
            email, oobCode: c, clientType: 'CLIENT_TYPE_ANDROID'
        }, { headers: sp(h1) })
        return {
            ok: true, email,
            id: a.data.idToken, ref: a.data.refreshToken,
            uid: a.data.localId, baru: !!a.data.isNewUser
        }
    } catch (e) { return { ok: false, why: bad(e) } }
}

async function pro(id) {
    const o = 'neo-' + crypto.randomBytes(6).toString('hex')
    try {
        const r = await axios.post(cfg.vfy, {
            data: {
                productId: 'am.full.sub.annual.19q4',
                token: 'mmgaobamlahbbeccfplmbkbb.AO-J1OzqG0or_GJJIx-ms8GrTm-jaglCRfhQSRPUZKpl2YspYS-oN7_94uv8RC5vQbvd_Ios2pPDStZ2n7F0hLE3FiOU7HS3R6Fquulv5xLXFECSv4ctElw',
                skuType: 'subs', orderId: o
            }
        }, {
            headers: {
                ...h2,
                authorization: 'Bearer ' + id,
                'firebase-instance-id-token': 'cSDnCyp3T-uwp07z3tL86T:APA91bFkmvvsHw5nnqa1SBFci-99DRsKClLiETdRrVcJjS5yBx1v_FbCb1d8WhBuea_zmwnYBktyTIzcRhN4b6uNOUur9wPc0gKXmJDoZic0LhNq5V2s0xI'
            }
        })
        return { ok: true, order: o, r: r.data }
    } catch (e) { return { ok: false, why: bad(e) } }
}

const sessions = new Map()

// ðŸ”’ Hapus pesan user (buat keamanan)
async function safeDelete(m) {
    try {
        if (m.deletable !== false) await m.delete()
    } catch {}
}

// ðŸ“¤ Kirim pesan biasa (BUKAN reply) biar gak refer ke pesan yang udah dihapus
async function sendMsg(m, content) {
    try {
        return await m.channel.send({ content, allowedMentions: { repliedUser: false } })
    } catch (e) {
        console.error('sendMsg error:', e.message)
        return null
    }
}

// âœï¸ Edit pesan (aman, di-try/catch)
async function editMsg(msg, content) {
    if (!msg) return null
    try {
        return await msg.edit({ content })
    } catch (e) {
        console.error('editMsg error:', e.message)
        return null
    }
}

async function handler(m, { args, prefix, command }) {
    const sub = (args[0] || '').toLowerCase()
    const rest = args.slice(1).join(' ').trim()

    // ============ SEND ============
    if (sub === 'send') {
        if (!rest.includes('@')) {
            return sendMsg(m, `Usage: \`${prefix}${command} send <email>\``)
        }

        // ðŸ—‘ï¸ Hapus pesan user dulu (email = sensitif)
        await safeDelete(m)

        // ðŸ“¤ Kirim status (bukan reply, karena pesan asli udah hilang)
        const status = await sendMsg(m, 'â³ Mengirim link...')
        if (!status) return

        const r = await link(rest)
        if (!r.ok) return editMsg(status, `âŒ Gagal: ${r.why}`)

        const sid = m.author?.id
        if (sid) sessions.set(sid, { email: rest })

        return editMsg(
            status,
            `âœ… Link terkirim ke \`${rest}\`\n` +
            `ðŸ“‹ Copy link di email, lalu: \`${prefix}${command} verif <email>|<link>\``
        )
    }

    // ============ VERIF ============
    if (sub === 'verif') {
        let email, linkUrl
        if (rest.includes('|')) {
            const p = rest.split('|')
            email = p[0].trim()
            linkUrl = p.slice(1).join('|').trim()
        } else {
            email = sessions.get(m.author?.id)?.email
            linkUrl = rest
        }

        if (!email || !linkUrl) {
            return sendMsg(m, `Usage: \`${prefix}${command} verif <email>|<link>\``)
        }

        // ðŸ—‘ï¸ Hapus pesan user dulu (link verifikasi = sangat sensitif!)
        await safeDelete(m)

        const status = await sendMsg(m, 'â³ Verifikasi...')
        if (!status) return

        const v = await auth(email, linkUrl)
        if (!v.ok) return editMsg(status, `âŒ Gagal: ${v.why}`)

        const q = await pro(v.id)
        if (!q.ok) return editMsg(status, `âŒ Premium gagal: ${q.why}`)

        sessions.set(m.author?.id, { email, uid: v.uid, pro: true })

        return editMsg(
            status,
            `âœ… **Premium aktif**\n` +
            `ðŸ“§ \`${email}\`\n` +
            `ðŸ†” \`${v.uid}\`\n` +
            `ðŸŽ« \`${q.order}\``
        )
    }

    // ============ HELP ============
    return sendMsg(m,
        `ðŸŽ¬ *Alight Motion Premium*\n` +
        `\`${prefix}${command} send <email>\`\n` +
        `\`${prefix}${command} verif <email>|<link>\``
    )
}

export { pluginConfig as config, handler }
