import axios from 'axios';

const OWNER = 'cakrasukacoding';
const REPO = 'bot-assets';

const GITHUB_TOKEN = '';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const cache = new Map(); // key: folder path -> { files: string[], fetchedAt: number }

function isImageFile(name) {
    const lower = name.toLowerCase();
    return IMAGE_EXT.some((ext) => lower.endsWith(ext));
}

async function fetchFolderFiles(path) {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;

    const headers = { Accept: 'application/vnd.github+json' };
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

    const { data } = await axios.get(url, { headers, timeout: 15000 });

    if (!Array.isArray(data)) {
        throw new Error(`Folder "${path}" gak ketemu di repo ${OWNER}/${REPO} (cek nama folder/repo-nya)`);
    }

    // Balikin { name, url } (bukan cuma url), biar bisa dicocokin nama filenya
    // sama folder pasangannya (lihat matchByFilename() di bawah).
    return data
        .filter((item) => item.type === 'file' && isImageFile(item.name))
        .map((item) => ({ name: item.name, url: item.download_url }));
}

async function getFolderFiles(path) {
    const cached = cache.get(path);
    const isStale = !cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS;

    if (!isStale) return cached.files;

    try {
        const files = await fetchFolderFiles(path);
        cache.set(path, { files, fetchedAt: Date.now() });
        return files;
    } catch (err) {
        // Kalau refresh gagal (misal lagi kena rate limit) tapi masih ada cache
        // LAMA, mending pakai yang lama daripada total gagal.
        if (cached) return cached.files;
        throw err;
    }
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Ambil 1 pasang foto random dari folder cowo/ dan cewe/, DICOCOKIN
 * berdasarkan NAMA FILE yang sama di kedua folder (misal "1.jpg" di cowo/
 * dipasangin sama "1.jpg" di cewe/) — bukan independen random lagi, biar
 * pasangannya beneran "nyambung" sesuai yang emang kamu rancang.
 *
 * ⚠️ SUPAYA INI JALAN: nama file di folder cowo/ dan cewe/ HARUS SAMA PERSIS
 * per pasangan (boleh beda ekstensi, contoh cowo/1.jpg + cewe/1.png tetep
 * kecocok karena yang dibandingin cuma nama TANPA ekstensi).
 */
export async function getRandomCouplePair() {
    const [cowoFiles, ceweFiles] = await Promise.all([
        getFolderFiles('cowo'),
        getFolderFiles('cewe'),
    ]);

    if (!cowoFiles.length) throw new Error('Folder "cowo" di repo GitHub kosong/gak ada file gambar.');
    if (!ceweFiles.length) throw new Error('Folder "cewe" di repo GitHub kosong/gak ada file gambar.');

    const stripExt = (name) => name.replace(/\.[^.]+$/, '').toLowerCase();

    const ceweByBaseName = new Map(ceweFiles.map((f) => [stripExt(f.name), f]));
    const matchedPairs = cowoFiles
        .filter((f) => ceweByBaseName.has(stripExt(f.name)))
        .map((f) => ({ cowo: f, cewe: ceweByBaseName.get(stripExt(f.name)) }));

    if (matchedPairs.length > 0) {
        const pair = pickRandom(matchedPairs);
        return { cowo: pair.cowo.url, cewe: pair.cewe.url };
    }

    // ⚠️ FALLBACK: gak ada nama file yang cocok sama sekali di kedua folder
    // (berarti penamaan file cowo/cewe belum sepasang-sepasang) -> daripada
    // gagal total, sementara pakai random independen kayak sebelumnya, TAPI
    // rekomendasi kuat: samain nama file per pasangan di GitHub biar
    // matching-nya beneran jalan.
    console.warn('[ppcouple] Gak ada nama file yang cocok antara folder cowo/ dan cewe/ — pairing sementara pakai random independen.');
    return { cowo: pickRandom(cowoFiles).url, cewe: pickRandom(ceweFiles).url };
}
