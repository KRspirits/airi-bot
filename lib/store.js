import fs from 'fs';
import path from 'path';

// Simpanan kunci-nilai: JSON fail (lalai) atau MongoDB (didaftarkan oleh database.js).
// SEMUA ciri baharu guna ini, jadi data kekal selepas Render restart bila Mongo aktif.
const FILE = path.resolve(process.env.STORE_FILE || './store.json');
let backend = null, mem = null, timer = null;

function load() {
    if (mem) return mem;
    try { mem = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { mem = {}; }
    return mem;
}
function flush() {
    timer = null;
    try { const tmp = FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(mem)); fs.renameSync(tmp, FILE); }
    catch (e) { console.error('[STORE]', e.message); }
}
const jsonBackend = {
    async get(ns, key) { return load()[ns]?.[key]; },
    async set(ns, key, val) { const m = load(); (m[ns] ||= {})[key] = val; if (!timer) { timer = setTimeout(flush, 1500); timer.unref?.(); } },
    async all(ns) { return { ...(load()[ns] || {}) }; },
    async del(ns, key) { const m = load(); if (m[ns]) delete m[ns][key]; if (!timer) { timer = setTimeout(flush, 1500); timer.unref?.(); } }
};
const B = () => backend || jsonBackend;
const clone = v => (v === undefined || v === null ? v : structuredClone(v));

export function useBackend(b) { backend = b; }
export const usingMongo = () => !!backend;
export async function get(ns, key, def = null) { const v = await B().get(ns, key); return v === undefined || v === null ? def : clone(v); }
export async function set(ns, key, val) { return B().set(ns, key, clone(val)); }
export async function del(ns, key) { return B().del(ns, key); }
export async function all(ns) { return clone(await B().all(ns)) || {}; }
export function flushNow() { if (!backend && mem) flush(); }
