const LABELS = [
    { max: 10, text: 'Gak Ada Chemistry 💀' },
    { max: 30, text: 'Cuma Temenan Aja 🫥' },
    { max: 50, text: 'Lumayan Sih 🤔' },
    { max: 70, text: 'Ada Potensi Nih 👀' },
    { max: 85, text: 'Serasi Banget! 💕' },
    { max: 95, text: 'Jodoh Dunia Akhirat 💞' },
    { max: 100, text: 'SOULMATE SEJATI 🔥💍' },
];

// 🔢 Persentase konsisten buat pasangan yang sama (hash sederhana dari ID, bukan random tiap panggil)
export function hashPercent(idA, idB) {
    const str = [idA, idB].sort().join('-');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return hash % 101;
}

export function getShipLabel(percent) {
    return LABELS.find((l) => percent <= l.max)?.text || LABELS[LABELS.length - 1].text;
}
