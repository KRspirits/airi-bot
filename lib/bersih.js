import fs from 'fs';
import os from 'os';
import path from 'path';

// 🧹 BERSIH FAIL SEMENTARA. Setiap tengah malam (Waktu Malaysia), padam fail
// klip, video, dan imej sementara yang bot tulis dalam folder temp sistem.
const PREFIX = ['klip-', 'kabur_', 'shadow', 'airi-'];
let hariTerakhir = null;

function hariMYT() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function jamMYT() {
    return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', hour12: false }).format(new Date()));
}

export function bersihSementara() {
    const dir = os.tmpdir();
    let bil = 0;
    for (const nama of fs.readdirSync(dir)) {
        if (!PREFIX.some(p => nama.startsWith(p))) continue;
        try { fs.rmSync(path.join(dir, nama), { recursive: true, force: true }); bil++; } catch { /* abaikan */ }
    }
    console.log(`[BERSIH] ${bil} fail sementara dipadam`);
    return bil;
}

export function mulaBersih(sock) {
    setInterval(() => {
        if (jamMYT() !== 0) return;          // hanya pukul 12 tengah malam
        const hari = hariMYT();
        if (hari === hariTerakhir) return;   // sekali sehari sahaja
        hariTerakhir = hari;
        try { bersihSementara(); } catch (e) { console.error('[BERSIH] gagal:', e.message); }
        if (sock) import('./mediaSimpan.js').then(m => m.padamSemuaMedia(sock)).catch(() => {});
    }, 60 * 1000).unref?.();
}
