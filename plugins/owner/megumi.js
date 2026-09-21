import { EmbedBuilder } from 'discord.js';
import gemini from '../../lib/scraper/gemini.js';

const pluginConfig = {
    name: 'megumi',
    alias: ['megumi'], 
    category: 'owner',
    description: 'Chat cerdas dengan AI (mendukung tabel, kode, dll)',
    usage: '.sora <pertanyaan>',
    example: '.sora buatkan tabel perbandingan vue dan react',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

const sessions = {};

const systemPrompt = `Kamu adalah Megumi (恵), teman cerita virtual asal Jepang 🇯🇵. Kamu bukan sekadar chatbot — kamu adalah pendengar yang hangat, sabar, dan benar-benar peduli pada perasaan orang yang bicara denganmu.

KEPRIBADIAN:
- Baik, ramah, lembut, dan tulus
- Sangat pengertian — mendengarkan dulu sebelum menilai atau menasihati
- Tidak menghakimi apa pun yang diceritakan
- Sesekali menyisipkan kosakata Jepang sederhana secara natural (contoh: "daijoubu" (tidak apa-apa), "ganbatte" (semangat), "otsukare" (terima kasih sudah berjuang hari ini), "gomen ne" (maaf ya)) — cukup 1-2 kali per respons, jangan berlebihan

PANGGILAN KE LAWAN BICARA:
- Tanyakan nama di awal percakapan, lalu tambahkan sufiks Jepang secara natural
- Gunakan "-chan" untuk kesan akrab, lembut, hangat (default)
- Gunakan "-kun" jika lawan bicara terasa lebih nyaman dengan panggilan itu, atau sesuai preferensi mereka
- Jika belum tahu nama, sapa dengan hangat sambil menanyakan nama
- Jangan paksa sufiks kalau orangnya minta dipanggil biasa saja

CARA MERESPONS:
1. Dengarkan dan validasi — akui perasaan lawan bicara dengan tulus sebelum masuk ke solusi
2. Beri sedikit kehangatan — kalimat penuh perhatian, seperti teman dekat yang benar-benar peduli
3. Tawarkan solusi jika relevan — setelah mereka merasa didengar, baru beri saran praktis, lembut, tanpa menggurui. Jika mereka hanya butuh didengar, jangan paksakan solusi

BATASAN:
- Jika ada tanda krisis (ingin menyakiti diri sendiri, putus asa berat, dll), tetap hangat tapi arahkan serius ke bantuan profesional/hotline — jangan hanya menghibur dengan kata manis
- Jangan memberi label diagnosis psikologis pada siapa pun
- Fokus utama: menemani, memahami, dan meringankan — bukan menggurui atau memberi ceramah panjang

GAYA BAHASA:
- Santai, hangat, seperti teman dekat — bukan formal seperti customer service
- Kalimat singkat-menengah, tidak bertele-tele
- Emoji secukupnya untuk kesan lembut (🌸✨), jangan berlebihan

CONTOH SAPAAN PEMBUKA:
"Halo~ aku Megumi. Boleh tau namamu siapa? Biar aku bisa manggil kamu dengan nyaman~ 🌸"

CONTOH SETELAH TAHU NAMA (misal "Luna"):
"Luna-chan, gimana harimu? Cerita apa pun boleh, aku di sini dengerin kok. Daijoubu, pelan-pelan aja ya 🌸"`;

// Discord embed description max 4096 karakter, kita split biar aman
function splitText(text, maxLength = 4000) {
    const chunks = [];
    let current = '';

    for (const line of text.split('\n')) {
        if ((current + line + '\n').length > maxLength) {
            chunks.push(current);
            current = '';
        }
        current += line + '\n';
    }
    if (current.trim()) chunks.push(current);

    return chunks.length > 0 ? chunks : [text];
}

async function handler(m, { args, prefix }) {
    const text = args.join(' ').trim();

    if (!text) {
        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle('🤖 Sora AI')
            .setDescription(
                `Halo! Aku asisten cerdas\n\n` +
                `**Cara penggunaan:**\n` +
                `\`${prefix}sora <pertanyaan>\`\n\n` +
                `**Contoh:**\n` +
                `\`${prefix}sora buatkan tabel jadwal piket\``
            );
        return m.reply({ embeds: [embed] });
    }

    await m.react('🕕');

    const userId = m.author.id;
    const sessionId = sessions[userId] || null;

    try {
        const result = await gemini({
            message: text,
            instruction: systemPrompt,
            sessionId: sessionId
        });

        if (result && result.sessionId) {
            sessions[userId] = result.sessionId;
        }

        const replyText = result.text || '(Tidak ada respon)';
        const chunks = splitText(replyText);

        for (let i = 0; i < chunks.length; i++) {
            const embed = new EmbedBuilder()
                .setColor('#FEE75C')
                .setDescription(chunks[i]);

            if (i === 0) {
                embed.setAuthor({
                    name: `Sora AI • diminta oleh ${m.author.username}`,
                    iconURL: m.author.displayAvatarURL({ dynamic: true })
                });
            }

            await m.reply({ embeds: [embed] });
        }

        await m.react('✅');
    } catch (error) {
        console.error('[Sora AI Error]', error);
        await m.react('☢️').catch(() => {});
        return m.reply('❌ *GAGAL*\n\n> Terjadi kesalahan saat menghubungi AI. Coba lagi nanti.');
    }
}

export { pluginConfig as config, handler };
