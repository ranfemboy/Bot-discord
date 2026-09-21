// 🔊 Store shared buat plugin voice-guard (join/settime/leave).
// Nyimpen state per-guild: kapan timer auto-leave-nya, biar bisa
// di-cancel/di-reset dari plugin lain (settime bisa dipanggil ulang,
// leave bisa dipanggil kapan aja).
const guildData = new Map();

export function getGuildData(guildId) {
    return guildData.get(guildId) || null;
}

export function setGuildData(guildId, data) {
    guildData.set(guildId, data);
}

export function clearGuildData(guildId) {
    const data = guildData.get(guildId);
    if (data?.timeout) clearTimeout(data.timeout);
    guildData.delete(guildId);
}

// ⏱️ Konversi satuan waktu (jam/hari/bulan) ke milidetik
export function toMs(satuan, jumlah) {
    const jam = 60 * 60 * 1000;
    switch (satuan) {
        case 'jam':
            return jumlah * jam;
        case 'hari':
            return jumlah * 24 * jam;
        case 'bulan':
            // Perkiraan 30 hari per bulan, bukan tanggal kalender presisi
            return jumlah * 30 * 24 * jam;
        default:
            return null;
    }
}

// 🕐 Format sisa waktu jadi teks yang gampang dibaca (contoh: "2 hari 3 jam")
export function formatSisaWaktu(ms) {
    const totalMinutes = Math.round(ms / 60000);
    const hari = Math.floor(totalMinutes / (60 * 24));
    const jam = Math.floor((totalMinutes % (60 * 24)) / 60);
    const menit = totalMinutes % 60;
    const bagian = [];
    if (hari > 0) bagian.push(`${hari} hari`);
    if (jam > 0) bagian.push(`${jam} jam`);
    if (menit > 0 || bagian.length === 0) bagian.push(`${menit} menit`);
    return bagian.join(' ');
}
