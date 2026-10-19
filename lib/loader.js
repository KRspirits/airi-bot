import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// Pemuat plugin. Pembaikan:
//  1) Import TANPA ?query pada muatan pertama, supaya modul sama dikongsi dengan index.js
//     (dahulu keadaan lelongan/event dalam modul terbelah dua => .bida tak nampak lelongan).
//  2) Nama command menang berbanding alias; plugin boleh set `priority` untuk menang alias.
//  3) Konflik dilog supaya nampak.
export async function loadPlugins(dir, { bust = false } = {}) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
    const entries = [];
    for (const f of files) {
        try {
            const href = pathToFileURL(path.join(dir, f)).href + (bust ? `?u=${Date.now()}` : '');
            const mod = await import(href);
            const cmd = mod.default;
            if (cmd?.name && typeof cmd.execute === 'function') entries.push({ cmd, file: f });
        } catch (err) { console.error(`[PLUGIN ERROR] ${f}:`, err.message); }
    }
    entries.sort((a, b) => (a.cmd.priority || 0) - (b.cmd.priority || 0));
    const map = new Map(), conflicts = [];
    for (const e of entries) for (const a of (e.cmd.alias || [])) {
        const k = String(a).toLowerCase(), prev = map.get(k);
        if (prev && prev !== e.cmd) conflicts.push(`.${k}: ${prev.name} -> ${e.cmd.name}`);
        map.set(k, e.cmd);
    }
    for (const e of entries) {
        const k = e.cmd.name.toLowerCase(), prev = map.get(k);
        if (prev && prev !== e.cmd) conflicts.push(`.${k}: ${prev.name} -> ${e.cmd.name} (nama menang)`);
        map.set(k, e.cmd);
    }
    return { map, conflicts, count: map.size, plugins: entries.length };
}
