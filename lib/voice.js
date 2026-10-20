import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// =========================================================================
// 🔊 KESAN BUNYI (sound effect), bukan suara. Setiap situasi ada bunyi sendiri:
//   welcome   = loceng ringkas bila ahli baru masuk
//   mythic    = percikan air + sweep rendah bila makhluk mitos muncul
//   purge     = sirin lembut bila hari pembersihan bermula
//   auction   = ketukan tukul bila lelongan dibuka
//   jackpot   = bunga api + confetti (untuk kemenangan besar)
//   jail      = dentuman besi bila kena tangkap
//   eventStart= nota naik bila acara bermula
//   eventEnd  = nota turun bila acara tamat
// Fail ada dalam assets/sfx/*.ogg. Dimuat sekali dan dicache.
// =========================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, '..', 'assets', 'sfx');
export const KINDS = ['welcome', 'mythic', 'purge', 'auction', 'jackpot', 'jail', 'eventStart', 'eventEnd'];
const cache = new Map();

function load(kind) {
    if (!KINDS.includes(kind)) return null;
    if (cache.has(kind)) return cache.get(kind);
    const p = path.join(DIR, kind + '.ogg');
    if (!fs.existsSync(p)) return null;
    const buf = fs.readFileSync(p);
    cache.set(kind, buf);
    return buf;
}

/** Mainkan kesan bunyi untuk situasi tertentu. Pulang false jika jenis tak dikenali atau fail tiada. */
export async function speak(sock, jid, kind, m) {
    const audio = load(kind);
    if (!audio) return false;
    await sock.sendMessage(jid, { audio, mimetype: 'audio/ogg; codecs=opus', ptt: true }, m ? { quoted: m } : undefined);
    return true;
}
