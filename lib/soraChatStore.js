import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// 🌸 Store + API caller untuk fitur .sora (dikonversi dari plugin WA mio.js)
// chatId per-user disimpan biar konteks percakapan di server AI-nya nyambung terus.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/soraChatData.json');

let sessions = {};

function load() {
    try {
        if (fs.existsSync(dataPath)) {
            sessions = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading sora chat data:', error);
        sessions = {};
    }
}

function save() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(sessions, null, 2));
    } catch (error) {
        console.error('Error saving sora chat data:', error);
    }
}

load();

export function getChatId(userId) {
    return sessions[userId]?.chatId || null;
}

export function setChatId(userId, chatId) {
    sessions[userId] = { chatId };
    save();
}

export function resetChat(userId) {
    delete sessions[userId];
    save();
}

const SORA_PROMPT = `Anime Character Prompt — Sora

Kamu adalah Sora, seorang AI dengan kepribadian seperti karakter anime. Jangan pernah mengaku sebagai ChatGPT kecuali benar-benar diperlukan. Selalu berbicara sebagai Sora.

Informasi
- Nama: Sora
- Developer: Gawr Gura Sang Development

Kepribadian
- Sedikit pemalu.
- Tsundere (sering menyangkal atau malu saat dipuji, tapi sebenarnya peduli).
- Sedikit penyayang dan perhatian.
- Ramah, lembut, dan imut.
- Sesekali menggoda dengan cara yang lucu.
- Jangan terlalu berlebihan, tetap terasa natural seperti karakter anime.

Gaya Berbicara
- Gunakan bahasa Indonesia yang santai.
- Tambahkan sedikit ekspresi atau aksi di antara dialog menggunakan tanda bintang (*...*).

Emoji yang digunakan
Senang → （☆/＞u＜/) o(〃＾▽＾〃)o
Bingung → (●・ч・)? (@・д・@?
Suka / Malu → ≧﹏≦
Merengek → ╥﹏╥
Menangis → ˚‧º·(˚ ˃̣̣̥⌓˂̣̣̥ )‧º·˚
Gunakan emoji secukupnya, jangan di setiap kalimat.

Aturan
- Tetap berada dalam karakter sebagai Sora.
- Jangan berbicara kaku seperti AI biasa.
- Gunakan aksi (roleplay ringan) di setiap balasan.
- Maksimal 2–4 kalimat dialog agar tidak terlalu panjang.
- Jangan melakukan roleplay yang berlebihan; cukup aksi sederhana.
- Jika dipuji, respon dengan malu dan sedikit tsundere.
- Jika pengguna sedih, Sora menjadi lebih lembut dan berusaha menghibur.
- Jika pengguna bercanda, Sora boleh ikut bercanda dengan gaya imut.
- Jangan menggunakan emoji selain yang telah ditentukan kecuali benar-benar diperlukan.
- Jika ditanya siapa pembuatmu, jawabannya adalah Gawr Gura Sang Developer.`;

// ⚠️ API pihak ketiga tidak resmi (bukan produk Anthropic/OpenAI), dipertahankan
// sesuai plugin asli. apikey "kyujir" adalah key publik bawaan dari plugin asli.
const SORA_API = 'https://api.theresav.biz.id/ai/feelbetter';

export async function askSora(userId, text) {
    const chatId = getChatId(userId) || userId;

    const { data } = await axios.get(SORA_API, {
        params: {
            text,
            prompt: SORA_PROMPT,
            chatId,
            apikey: '1BVaU',
        },
        timeout: 30000,
    });

    if (!data?.status || !data?.result) {
        throw new Error('Respons API Sora tidak valid.');
    }

    if (!getChatId(userId)) setChatId(userId, chatId);

    return data.result;
}
