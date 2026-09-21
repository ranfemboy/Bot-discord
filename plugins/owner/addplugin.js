import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const pluginConfig = {
    name: 'addplugin',
    alias: ['addpl', 'tambahplugin'],
    category: 'owner',
    description: 'Tambah plugin baru dari code yang di-reply',
    usage: '.addplugin [namafile] [folder]',
    example: '.addplugin bliblidl downloader',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    isEnabled: true,
};

function extractPluginInfo(code) {
    const info = { name: null, category: null };
    const nameMatch = code.match(/name:\s*['"`]([^'"`]+)['"`]/i);
    if (nameMatch) info.name = nameMatch[1];
    const categoryMatch = code.match(/category:\s*['"`]([^'"`]+)['"`]/i);
    if (categoryMatch) info.category = categoryMatch[1];
    return info;
}

// Buang wrapper ```js ... ``` kalau code dikirim sebagai code block di pesan Discord
function stripCodeBlock(text) {
    const match = text.match(/```(?:js|javascript|ts)?\n?([\s\S]*?)```/i);
    return match ? match[1].trim() : text.trim();
}

async function handler(m, { client, settings, args }) {
    // 🔒 Double-check owner meski pluginConfig.isOwner udah dicek di messageHandler,
    // ini lapisan kedua khusus buat command sensitif (code execution).
    if (m.author.id !== settings.idOwner) {
        return m.reply('❌ *AKSES DITOLAK*\n\n> Fitur ini khusus owner bot.');
    }

    if (!m.reference) {
        return m.reply(
            `📦 *ADD PLUGIN*\n\n` +
            `Reply pesan berisi code plugin (teks/code block atau attachment .js) dengan caption:\n` +
            `\`${settings.prefix}addplugin\` - Auto detect\n` +
            `\`${settings.prefix}addplugin namafile\` - Custom nama\n` +
            `\`${settings.prefix}addplugin namafile folder\` - Custom nama + folder`
        );
    }

    let quoted;
    try {
        quoted = await m.fetchReference();
    } catch (e) {
        return m.reply('❌ *GAGAL*\n\nGagal mengambil pesan yang di-reply.');
    }

    let code = quoted.content || '';

    // Kalau ada attachment .js, prioritaskan itu daripada teks pesan
    const jsAttachment = quoted.attachments.find(
        (a) => a.name?.endsWith('.js') || a.contentType === 'application/javascript'
    );

    if (jsAttachment) {
        try {
            const res = await fetch(jsAttachment.url);
            code = await res.text();
        } catch (e) {
            return m.reply('❌ *GAGAL*\n\nGagal download attachment file.');
        }
    } else {
        code = stripCodeBlock(code);
    }

    if (!code || code.length < 50) {
        return m.reply('❌ *GAGAL*\n\nCode terlalu pendek atau tidak valid.');
    }

    // Project ini pakai ES Module (import/export), bukan CommonJS
    const hasExport = code.includes('export ');
    const hasConfig = code.includes('pluginConfig') || code.includes('config');
    if (!hasExport || !hasConfig) {
        return m.reply(
            '❌ *GAGAL*\n\nCode bukan format plugin yang valid.\nHarus ada `export` dan `config`.'
        );
    }

    const extracted = extractPluginInfo(code);

    let fileName = args?.[0] || extracted.name;
    let folderName = args?.[1] || extracted.category;

    if (!fileName) {
        return m.reply(
            `❌ *GAGAL*\n\nTidak bisa mendeteksi nama plugin.\nGunakan \`${settings.prefix}addplugin <namafile>\``
        );
    }

    if (!folderName) folderName = 'other';

    fileName = fileName.toLowerCase().replace(/[^a-z0-9\-_]/g, '');
    folderName = folderName.toLowerCase().replace(/[^a-z0-9\-_]/g, '');

    if (!fileName) {
        return m.reply('❌ *GAGAL*\n\nNama file tidak valid.');
    }

    await m.react('🕕');

    try {
        const pluginsDir = path.join(process.cwd(), 'plugins');
        const folderPath = path.join(pluginsDir, folderName);
        const filePath = path.join(folderPath, `${fileName}.js`);

        // 🔒 Cegah path traversal
        if (!filePath.startsWith(pluginsDir)) {
            await m.react('❌');
            return m.reply('❌ *GAGAL*\n\nNama file/folder tidak valid.');
        }

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        if (fs.existsSync(filePath)) {
            await m.react('❌');
            return m.reply(
                `❌ *GAGAL*\n\n` +
                `File \`${fileName}.js\` sudah ada di folder \`${folderName}\`\n\n` +
                `💡 Ganti nama file atau hapus dulu file lama sebelum menambah ulang.`
            );
        }

        fs.writeFileSync(filePath, code);

        // ♻️ "Hot reload": import langsung modul barunya dan daftarkan ke client.plugins.
        let reloadSuccess = false;
        try {
            const mod = await import(pathToFileURL(filePath).href + `?v=${Date.now()}`);
            if (mod.config && mod.handler) {
                client.plugins.set(mod.config.name, mod);
                reloadSuccess = true;
            }
        } catch (err) {
            console.error('Hot reload gagal:', err);
        }

        console.log(
            `[ADDPLUGIN] ${m.author.tag} (${m.author.id}) menambahkan plugin "${fileName}.js" di folder "${folderName}"`
        );

        await m.react('✅');
        return m.reply(
            `✅ *PLUGIN DITAMBAH*\n\n` +
            `╭─〔 *DETAIL* 〕───⬣\n` +
            `│ File: \`${fileName}.js\`\n` +
            `│ Folder: \`${folderName}\`\n` +
            `│ Size: \`${code.length} bytes\`\n` +
            `│ Hot Reload: ${reloadSuccess ? '✅ Sukses' : '⚠️ Perlu restart manual'}\n` +
            `╰───────⬣\n\n` +
            `Plugin sudah aktif dan siap digunakan!`
        );
    } catch (error) {
        await m.react('☢');
        console.error('Addplugin Error:', error);
        await m.reply('❌ *GAGAL*\n\n> ' + error.message);
    }
}

export { pluginConfig as config, handler };