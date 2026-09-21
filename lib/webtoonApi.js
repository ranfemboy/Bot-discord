import axios from 'axios';

// 📖 Wrapper untuk https://api.azbry.com/api/library/webtoon-search
// CATATAN PENTING: azbry.com tidak punya dokumentasi publik yang bisa saya
// akses untuk memastikan bentuk JSON persis dari API ini. Fungsi di bawah
// ditulis DEFENSIF — nyoba beberapa nama field yang umum dipakai API scraper
// Indonesia (result/data/results, title/judul, thumbnail/image/cover, dst).
// 🧪 WAJIB DITES dulu sebelum dipakai serius: jalankan `.webtoon <judul>` dan
// cek console log kalau parsing meleset, lalu sesuaikan `pickField()` di bawah
// sama nama field asli yang muncul di response.
const BASE_URL = 'https://api.azbry.com/api/library/webtoon-search';

function pickField(obj, keys, fallback = null) {
    for (const key of keys) {
        if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
            return obj[key];
        }
    }
    return fallback;
}

function normalizeItem(raw) {
    return {
        title: pickField(raw, ['title', 'judul', 'name'], 'Tanpa judul'),
        thumbnail: pickField(raw, ['thumbnail', 'thumb', 'image', 'cover', 'img'], ''),
        url: pickField(raw, ['url', 'link', 'href'], ''),
        genre: pickField(raw, ['genre', 'genres', 'category'], '-'),
        status: pickField(raw, ['status'], '-'),
        synopsis: pickField(raw, ['synopsis', 'sinopsis', 'description'], ''),
    };
}

export async function searchWebtoon(query) {
    if (!query) throw new Error('Query wajib diisi');

    const { data } = await axios.get(BASE_URL, {
        params: { q: query, query, search: query, keyword: query },
        timeout: 20000,
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    // Coba beberapa kemungkinan bentuk wrapper hasil (status+result, status+data, langsung array, dst)
    const rawList =
        (Array.isArray(data) && data) ||
        data?.result ||
        data?.data ||
        data?.results ||
        data?.webtoons ||
        null;

    if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
        const err = new Error('Data tidak ditemukan atau format response API berubah.');
        err.rawResponse = data;
        throw err;
    }

    return rawList.slice(0, 10).map(normalizeItem);
}
