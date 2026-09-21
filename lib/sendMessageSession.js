// Simpan sementara data broadcast (owner -> pilih server -> pilih channel -> kirim)
// Disimpan di memori aja karena cuma dipakai sebentar (selama proses pilih server/channel)

const sessions = new Map();

// Otomatis dibuang kalau kelamaan gak dipakai (10 menit) biar gak numpuk di memori
const SESSION_TTL = 10 * 60 * 1000;

export function createSession(id, data) {
    sessions.set(id, { ...data, createdAt: Date.now() });
    setTimeout(() => sessions.delete(id), SESSION_TTL);
}

export function getSession(id) {
    return sessions.get(id);
}

export function deleteSession(id) {
    sessions.delete(id);
}
