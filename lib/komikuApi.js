import * as cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs';

export const TMP_DIR = './tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const KOMIKU_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
    'Referer': 'https://komiku.org/',
    'Origin': 'https://komiku.org',
};

// Watermark kecil anti-claim, cuma teks biasa yang ditempel di akhir file
const SIGNATURE = Buffer.from([0x4B, 0x79, 0x7A, 0x7A, 0x20, 0x67, 0x61, 0x20, 0x73, 0x75, 0x6B, 0x61, 0x20, 0x64, 0x69, 0x20, 0x63, 0x6C, 0x61, 0x69, 0x6D]);

async function injectSignature(imagePath) {
    try {
        const imgBuffer = await fs.promises.readFile(imagePath);
        const separator = Buffer.from([0xFF, 0xFE, 0xFD, 0xFC]);
        await fs.promises.writeFile(imagePath, Buffer.concat([imgBuffer, separator, SIGNATURE]));
        return true;
    } catch {
        return false;
    }
}

async function injectMetaSignature(pdfPath) {
    try {
        const pdfBuffer = await fs.promises.readFile(pdfPath);
        const marker = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        await fs.promises.writeFile(pdfPath, Buffer.concat([pdfBuffer, marker, SIGNATURE]));
        return true;
    } catch {
        return false;
    }
}

export class KomikuAPI {
    constructor() {
        this.baseUrl = 'https://komiku.org';
        this.apiUrl = 'https://api.komiku.org';
    }

    async search(keyword, page = 1) {
        try {
            const searchUrl = `${this.apiUrl}/?post_type=manga&s=${encodeURIComponent(keyword)}&page=${page}`;
            const response = await axios.get(searchUrl, { headers: KOMIKU_HEADERS, timeout: 30000 });
            const $ = cheerio.load(response.data);
            const items = [];

            $('.bge').each((i, el) => {
                const title = $(el).find('.kan h3').text().trim();
                const mangaUrl = $(el).find('.bgei a').first().attr('href');
                const image = $(el).find('.bgei img').attr('src');
                const type = $(el).find('.tpe1_inf b').text().trim();
                const genre = $(el).find('.tpe1_inf').text().trim().replace(type, '').trim();
                const update = $(el).find('.kan p').text().trim();
                const latestChapterUrl = $(el).find('.new1:last a').attr('href');
                const latestChapterText = $(el).find('.new1:last a span:last-child').text().trim();

                if (title) {
                    items.push({
                        title,
                        url: mangaUrl ? (mangaUrl.startsWith('http') ? mangaUrl : this.baseUrl + mangaUrl) : null,
                        image,
                        type,
                        genre,
                        latest_update: update,
                        latest_chapter: {
                            title: latestChapterText,
                            url: latestChapterUrl ? this.baseUrl + latestChapterUrl : null,
                        },
                    });
                }
            });

            return { status: true, data: items, total: items.length };
        } catch (error) {
            return { status: false, message: error.message };
        }
    }

    async getDetail(url) {
        try {
            const response = await axios.get(url, { headers: KOMIKU_HEADERS, timeout: 30000 });
            const $ = cheerio.load(response.data);

            const thumbnail = $('.ims img').attr('src');
            const judul = $('h1 span').text().trim();
            const judulAlternatif = $('.j2').text().trim();
            const tipe = $('.inftable td').eq(5).text().trim();
            const tema = $('.inftable td').eq(7).text().trim();
            const genre = [];
            $('.genre li a span').each((i, el) => genre.push($(el).text().trim()));
            const author = $('.inftable td').eq(11).text().trim();
            const status = $('.inftable td').eq(13).text().trim();
            const rating = $('.inftable td').eq(15).text().trim();
            const sinopsis = $('.desc').text().trim();

            const chapters = [];
            $('#Daftar_Chapter tbody tr').each((i, el) => {
                const chapterLink = $(el).find('td.judulseries a').attr('href');
                const chapterTitle = $(el).find('td.judulseries a span').text().trim();
                const date = $(el).find('td.tanggalseries').text().trim();
                if (chapterLink && chapterTitle) {
                    chapters.push({ chapter_number: chapterTitle, url: this.baseUrl + chapterLink, date });
                }
            });

            return {
                status: true,
                thumbnail,
                title: judul,
                alternative_title: judulAlternatif,
                type: tipe,
                theme: tema,
                genres: genre,
                author,
                status,
                rating,
                synopsis: sinopsis,
                total_chapters: chapters.length,
                chapters: chapters.reverse(),
            };
        } catch (error) {
            return { status: false, message: error.message };
        }
    }

    async getChapterImages(chapterUrl) {
        try {
            const response = await axios.get(chapterUrl, { headers: KOMIKU_HEADERS, timeout: 30000 });
            const $ = cheerio.load(response.data);

            let chapterData = {};
            const scriptMatch = response.data.match(/var chapterData = ({[\s\S]*?});/);
            if (scriptMatch) {
                try { chapterData = eval('(' + scriptMatch[1] + ')'); } catch {}
            }

            const images = [];
            $('#Baca_Komik img').each((i, el) => {
                const src = $(el).attr('src');
                if (src && !src.includes('lazy.jpg')) images.push(src);
            });

            const seriesTitle = $('.breadcrumb a').eq(1).text().trim() || chapterData.series;
            const chapterTitle = $('h1').first().text().trim();

            return {
                status: true,
                series: seriesTitle,
                chapter: chapterTitle,
                chapter_number: chapterData.chapter,
                total_pages: images.length,
                image_urls: images,
            };
        } catch (error) {
            return { status: false, message: error.message };
        }
    }
}

export async function downloadImageFast(url, savePath) {
    const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        headers: KOMIKU_HEADERS,
        timeout: 60000,
        maxRedirects: 5,
    });

    const writer = fs.createWriteStream(savePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
            await injectSignature(savePath);
            resolve();
        });
        writer.on('error', reject);
    });
}

export async function getBufferFast(url) {
    if (!url) return null;
    try {
        const response = await axios.get(url, {
            headers: KOMIKU_HEADERS,
            responseType: 'arraybuffer',
            timeout: 30000,
            maxRedirects: 5,
        });
        return Buffer.from(response.data);
    } catch {
        return null;
    }
}
