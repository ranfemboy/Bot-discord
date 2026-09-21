import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// 📁 Scan folder plugins/ secara rekursif, biar plugin yang udah dikelompokkan
// per kategori (plugins/rpg/, plugins/ai/, dst) tetep ke-detect semua.
export function scanPlugins(pluginsPath) {
    let results = [];
    for (const entry of fs.readdirSync(pluginsPath, { withFileTypes: true })) {
        const fullPath = path.join(pluginsPath, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(scanPlugins(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

function toRelative(pluginsPath, absoluteFiles) {
    return absoluteFiles.map(f => path.relative(pluginsPath, f));
}

// Muat semua plugin sebagai command (dipanggil lewat prefix)
export async function loadPlugins(client, pluginsPath, absoluteFiles) {
    const pluginFiles = toRelative(pluginsPath, absoluteFiles);

    for (const file of pluginFiles) {
        const filePath = path.join(pluginsPath, file);
        try {
            const plugin = await import(pathToFileURL(filePath).href);
            if (!plugin.config || !plugin.handler) {
                console.log(`⚠️  Plugin ${file} tidak memiliki config/handler yang valid, dilewati.`);
                continue;
            }
            if (plugin.config.isEnabled === false) {
                console.log(`⏭️  Plugin ${plugin.config.name} dinonaktifkan, dilewati.`);
                continue;
            }
            // Plugin yang punya "event" akan di-bind terpisah, bukan sebagai command
            if (plugin.event) continue;

            client.plugins.set(plugin.config.name, plugin);
            console.log(`✅ Plugin loaded: ${plugin.config.name}`);
        } catch (err) {
            console.error(`❌ Gagal load plugin ${file}:`, err);
        }
    }
}

// Muat plugin berbasis event (contoh: welcome.js -> guildMemberAdd)
export async function bindEventPlugins(client, pluginsPath, absoluteFiles, settings) {
    const pluginFiles = toRelative(pluginsPath, absoluteFiles);

    for (const file of pluginFiles) {
        const filePath = path.join(pluginsPath, file);
        const plugin = await import(pathToFileURL(filePath).href);
        if (plugin.event && plugin.handler && plugin.config?.isEnabled !== false) {
            client.on(plugin.event, (...args) => plugin.handler(...args, { client, settings }));
            console.log(`🔗 Event bound: ${plugin.event} -> ${file}`);
        }
    }
}
