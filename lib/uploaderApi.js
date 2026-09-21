import FormData from 'form-data';

// ☁️ Multi-host uploader — dikonversi dari tourl.js (plugin WA, puluhan host).
// Sengaja DIPANGKAS jadi 5 host yang paling stabil & sering aktif, biar
// gagal-satu-gagal-semua-nya kecil dan gampang dites/di-maintain. Kalau mau
// nambah host lain, tinggal bikin fungsi baru dengan pola yang sama lalu
// masukin ke array UPLOADERS di bawah.
//
// 🐛 FIX PENTING (dulu semua link rusak): `fetch` bawaan Node.js (undici)
// akan GAGAL kalau body-nya berupa STREAM (yang otomatis dibikin form-data
// waktu langsung di-pass sebagai body) tanpa opsi `duplex: 'half'`. Daripada
// mengandalkan opsi itu, di sini form-nya di-convert dulu jadi BUFFER utuh
// (`form.getBuffer()`) + header Content-Length yang bener
// (`form.getLengthSync()`) — jadi request-nya biasa aja kayak POST JSON
// biasa, gak ada isu stream/duplex sama sekali.

const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36';

function guessContentType(filename) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    const map = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
        webp: 'image/webp', mp4: 'video/mp4', mov: 'video/quicktime', mp3: 'audio/mpeg',
        ogg: 'audio/ogg', wav: 'audio/wav', pdf: 'application/pdf', zip: 'application/zip',
    };
    return map[ext] || 'application/octet-stream';
}

// 🔧 Helper: bikin form-data lalu balikin { body, headers } berupa BUFFER
// (bukan stream), biar aman dipakai langsung ke `fetch` tanpa perlu
// `duplex: 'half'`.
function buildFormBody(form, extraHeaders = {}) {
    return {
        body: form.getBuffer(),
        headers: {
            ...form.getHeaders(),
            'Content-Length': form.getLengthSync(),
            ...extraHeaders,
        },
    };
}

async function uploadToCatbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename, contentType: guessContentType(filename) });
    const { body, headers } = buildFormBody(form);

    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body, headers });
    if (!res.ok) throw new Error(`Catbox gagal (HTTP ${res.status})`);
    const url = (await res.text()).trim();
    if (!url.startsWith('http')) throw new Error('Respons Catbox tidak valid: ' + url.slice(0, 100));
    return { host: 'Catbox', url, expires: 'Permanen' };
}

async function uploadToLitterbox(buffer, filename) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('time', '72h');
    form.append('fileToUpload', buffer, { filename, contentType: guessContentType(filename) });
    const { body, headers } = buildFormBody(form);

    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body, headers });
    if (!res.ok) throw new Error(`Litterbox gagal (HTTP ${res.status})`);
    const url = (await res.text()).trim();
    if (!url.startsWith('http')) throw new Error('Respons Litterbox tidak valid: ' + url.slice(0, 100));
    return { host: 'Litterbox', url, expires: '72 jam' };
}

async function uploadToQuax(buffer, filename) {
    const form = new FormData();
    form.append('file', buffer, { filename, contentType: guessContentType(filename) });
    const { body, headers } = buildFormBody(form);

    const res = await fetch('https://qu.ax/upload.php', { method: 'POST', body, headers });
    if (!res.ok) throw new Error(`Qu.ax gagal (HTTP ${res.status})`);
    const data = await res.json();
    if (!data?.success || !data?.files?.[0]?.url) throw new Error('Respons Qu.ax tidak valid');
    return { host: 'Qu.ax', url: data.files[0].url, expires: 'Permanen' };
}

async function uploadToKappa(buffer, filename) {
    const form = new FormData();
    form.append('file', buffer, { filename, contentType: guessContentType(filename) });
    const { body, headers } = buildFormBody(form, { 'User-Agent': UA, Origin: 'https://kappa.lol', Referer: 'https://kappa.lol/' });

    const res = await fetch('https://kappa.lol/api/upload', { method: 'POST', body, headers });
    if (!res.ok) throw new Error(`Kappa gagal (HTTP ${res.status})`);
    const data = await res.json();
    if (!data?.link) throw new Error('Respons Kappa tidak valid');
    return { host: 'Kappa', url: data.link, expires: 'Permanen' };
}

async function uploadTo0x0(buffer, filename) {
    const form = new FormData();
    form.append('file', buffer, { filename, contentType: guessContentType(filename) });
    const { body, headers } = buildFormBody(form, { 'User-Agent': UA });

    const res = await fetch('https://0x0.st', { method: 'POST', body, headers });
    if (!res.ok) throw new Error(`0x0.st gagal (HTTP ${res.status})`);
    const url = (await res.text()).trim();
    if (!url.startsWith('http')) throw new Error('Respons 0x0.st tidak valid: ' + url.slice(0, 100));
    return { host: '0x0.st', url, expires: '1-2 minggu' };
}

const UPLOADERS = [
    { name: 'Catbox', fn: uploadToCatbox },
    { name: 'Litterbox', fn: uploadToLitterbox },
    { name: 'Qu.ax', fn: uploadToQuax },
    { name: 'Kappa', fn: uploadToKappa },
    { name: '0x0.st', fn: uploadTo0x0 },
];

// 🚀 Upload buffer yang sama ke semua host, kumpulin yang berhasil + yang gagal
// beserta PESAN ERROR-nya (biar ketauan host mana yang error-nya apa kalau
// masih ada yang gagal lagi ke depannya).
export async function uploadToAllHosts(buffer, filename) {
    const results = [];
    const failed = [];

    for (const uploader of UPLOADERS) {
        try {
            const result = await uploader.fn(buffer, filename);
            results.push(result);
        } catch (err) {
            console.error(`Upload ke ${uploader.name} gagal:`, err.message);
            failed.push(`${uploader.name} (${err.message})`);
        }
    }

    return { results, failed };
}

// 🚀 Upload ke SATU host tercepat/pertama yang berhasil (dipakai fitur lain
// yang butuh 1 URL publik doang)
export async function uploadToSingleHost(buffer, filename) {
    for (const uploader of UPLOADERS) {
        try {
            return await uploader.fn(buffer, filename);
        } catch (err) {
            console.error(`Upload ke ${uploader.name} gagal:`, err.message);
            continue;
        }
    }
    throw new Error('Semua host upload gagal, coba lagi nanti.');
}
