import axios from 'axios';
import * as cheerio from 'cheerio';

// 🔍 Lookup info PUBLIK akun Discord berdasarkan ID (creation date, badge)
// lewat id.rappytv.com — dikonversi dari discord_stalker.js (tadinya CLI readline).
// Info yang diambil semuanya sudah publik/bisa diturunkan dari ID (snowflake)
// itu sendiri, jadi bukan data pribadi/doxxing (tidak ada nama asli/alamat).
const BASE_URL = 'https://id.rappytv.com';

async function fetchHtml(id) {
    try {
        const { data } = await axios.get(`${BASE_URL}/${id}`, {
            headers: {
                'user-agent':
                    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36',
                referer: BASE_URL,
                'accept-language': 'id-ID',
            },
            timeout: 15000,
        });
        return data;
    } catch {
        return null;
    }
}

function parseHtml(html) {
    try {
        const $ = cheerio.load(html || '');
        const res = $('.resulth');
        return {
            status: html ? 'success' : 'failed',
            id: $(res[0])?.text()?.trim() || 'n/a',
            username: $(res[1])?.text()?.trim() || 'unknown',
            avatar: $('.avyimg')?.attr('src') || null,
            created: $(res[2])?.text()?.trim() || 'unknown',
            badges: $('p:contains("Badges")')?.text()?.split(':')?.[1]?.trim() || '-',
        };
    } catch {
        return { status: 'failed' };
    }
}

export async function lookupDiscordId(id) {
    if (!id || !/^\d{15,25}$/.test(id)) {
        throw new Error('ID Discord tidak valid. Harus berupa angka (snowflake), contoh: 123456789012345678');
    }
    const html = await fetchHtml(id);
    const parsed = parseHtml(html);
    return { ...parsed, timestamp: new Date().toISOString() };
}
