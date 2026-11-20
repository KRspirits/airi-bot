import { klipScene } from './klip.js';

// Hantar klip ke group dengan had masa setiap jenis (elak banjir video).
const had = { rider: 2 * 60e3, crypto: 5 * 60e3, jackpot: 3 * 60e3, buah: 3 * 60e3 };
const lepas = new Map(); // `${jenis}|${jid}` -> masa terakhir

export async function hantarKlip(sock, jid, m, jenis, params, caption) {
    const kunci = `${jenis}|${jid}`;
    const kini = Date.now();
    if (kini - (lepas.get(kunci) || 0) < (had[jenis] || 0)) return;
    lepas.set(kunci, kini);
    const buf = await klipScene(jenis, params);
    if (!buf) return;
    await sock.sendMessage(jid, { video: buf, mimetype: 'video/mp4', caption }, { quoted: m }).catch(() => {});
}
