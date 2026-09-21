import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 📦 FIX: sebelumnya akun cuma ditandain `taken: true` tapi TETAP nangkring
// di file data (gak pernah beneran hilang dari pool). Sekarang begitu
// diklaim, akun-nya beneran DIHAPUS dari pool (accounts) dan dipindah ke
// log klaim terpisah (claims) — biar jelas & gak ada risiko email yang
// sama kepake berkali-kali ke orang yang beda.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'data', 'amprem.json');

// accounts = pool akun yang MASIH TERSEDIA (belum diklaim siapapun)
// claims   = log siapa udah dapat akun yang mana (buat lookup "akun saya" & histori)
let accounts = [];
let claims = [];
let loaded = false;

function ensureDataDir() {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadData() {
    if (loaded) return;
    ensureDataDir();

    if (fs.existsSync(DATA_PATH)) {
        try {
            const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

            if (Array.isArray(raw)) {
                // 🔄 Migrasi dari format lama (array datar dengan field taken/takenBy)
                accounts = raw.filter((a) => !a.taken).map(({ id, email, password }) => ({ id, email, password }));
                claims = raw
                    .filter((a) => a.taken)
                    .map((a) => ({
                        accountId: a.id,
                        email: a.email,
                        password: a.password,
                        userId: a.takenBy,
                        claimedAt: a.takenAt || Date.now(),
                    }));
                saveData();
            } else {
                accounts = raw.accounts || [];
                claims = raw.claims || [];
            }
        } catch {
            accounts = [];
            claims = [];
        }
    } else {
        // Belum ada file-nya -> bikinin 1 contoh biar Sensei tau formatnya, tinggal edit/tambah manual
        accounts = [{ id: 'am-1', email: 'contoh1@email.com', password: 'password-akun-1' }];
        claims = [];
        saveData();
    }

    loaded = true;
}

function saveData() {
    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify({ accounts, claims }, null, 2));
}

/** Ambil 1 akun yang masih available (belum diklaim siapapun) */
export function getAvailableAccount() {
    loadData();
    return accounts[0] ?? null;
}

/**
 * Klaim 1 akun buat user tertentu.
 * Akun-nya BENERAN DIHAPUS dari pool `accounts` (bukan cuma ditandain),
 * lalu dicatat di `claims` biar user yang sama tetap bisa lihat akun yang
 * udah dia dapat kalau manggil command-nya lagi.
 */
export function claimAccount(accountId, userId) {
    loadData();
    const index = accounts.findIndex((a) => a.id === accountId);
    if (index === -1) return null;

    const [acc] = accounts.splice(index, 1); // 🗑️ hapus permanen dari pool
    const claimed = { ...acc, claimedBy: userId, claimedAt: Date.now() };

    claims.push({ accountId: acc.id, email: acc.email, password: acc.password, userId, claimedAt: claimed.claimedAt });
    saveData();
    return claimed;
}

/** Cek apakah user ini udah pernah klaim akun sebelumnya (biar gak ambil baru lagi) */
export function findClaimedAccountByUser(userId) {
    loadData();
    const claim = claims.find((c) => c.userId === userId);
    if (!claim) return null;
    return { id: claim.accountId, email: claim.email, password: claim.password };
}

/** Tambahin banyak akun sekaligus dari hasil parsing file .txt (skip yang emailnya udah ada di pool ATAU udah pernah diklaim) */
export function addAccountsFromList(list) {
    loadData();

    const existingEmails = new Set([
        ...accounts.map((a) => a.email.toLowerCase()),
        ...claims.map((c) => c.email.toLowerCase()),
    ]);

    // Cari nomor id terakhir biar id baru lanjut urut (am-66, am-67, dst), bukan numpuk/dobel
    let maxNum = 0;
    for (const acc of [...accounts, ...claims.map((c) => ({ id: c.accountId }))]) {
        const match = /^am-(\d+)$/.exec(acc.id);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
        }
    }

    let added = 0;
    let skippedDuplicates = 0;

    for (const { email, password } of list) {
        if (existingEmails.has(email.toLowerCase())) {
            skippedDuplicates++;
            continue;
        }

        maxNum += 1;
        accounts.push({ id: `am-${maxNum}`, email, password });
        existingEmails.add(email.toLowerCase());
        added++;
    }

    saveData();
    return { added, skippedDuplicates };
}

/** Statistik stok (buat command cek stok kalau perlu) */
export function getStats() {
    loadData();
    return {
        total: accounts.length + claims.length,
        available: accounts.length,
        taken: claims.length,
    };
}
