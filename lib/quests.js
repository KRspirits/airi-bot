import { rng, hash } from './card.js';
import { myt } from './util.js';

export const CRIME_ALIASES = ['rompak', 'hackbank', 'santau', 'curi_kereta', 'ketuk_chassis', 'jenayah', 'scam', 'peras_ugut', 'seludup', 'jual_maklumat', 'seludup_senjata', 'godam_kripto', 'rompak_bank', 'rompak_kasino', 'rompak_jongkong'];
const POOL = [
    { id: 'mancing', txt: 'Mancing 5 kali', cmd: ['mancing'], need: 5, reward: 15000 },
    { id: 'kerja', txt: 'Pergi kerja 2 kali', cmd: ['kerja', 'work'], need: 2, reward: 10000 },
    { id: 'daily', txt: 'Tuntut hadiah harian', cmd: ['daily', 'harian', 'tuntut'], need: 1, reward: 5000 },
    { id: 'jenayah', txt: 'Cuba 1 jenayah', cmd: CRIME_ALIASES, need: 1, reward: 12000 },
    { id: 'slot', txt: 'Main slot 3 kali', cmd: ['slot', 'judi', 'spin'], need: 3, reward: 8000 },
    { id: 'kutip', txt: 'Kutip trak duit atau bida lelongan', cmd: ['kutip', 'grab', 'ambil', 'bida'], need: 1, reward: 9000 },
    { id: 'kebun', txt: 'Tuai hasil kebun', cmd: ['tuai'], need: 1, reward: 8000 },
    { id: 'album', txt: 'Semak album koleksi', cmd: ['album'], need: 1, reward: 3000 },
    { id: 'gabung', txt: 'Gabung dua ikan jadi hibrid', cmd: ['gabung'], need: 1, reward: 10000 },
    { id: 'geng', txt: 'Semak geng awak', cmd: ['geng'], need: 1, reward: 3000 },
    { id: 'profil', txt: 'Tengok kad profil', cmd: ['profil', 'profile', 'me'], need: 1, reward: 3000 },
    { id: 'transfer', txt: 'Bagi duit kepada kawan', cmd: ['transfer', 'pay', 'sedekah'], need: 1, reward: 6000 }
];
export function genQuests(seed) {
    const r = rng(hash(String(seed))), pool = [...POOL], out = [];
    while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out.map(q => ({ ...q }));
}
/** Dipanggil selepas setiap command (index.js). */
export function bump(user, cmd) {
    const day = myt().day;
    if (user.cnt?.day !== day) user.cnt = { day, c: {} };
    user.cnt.c[cmd] = (user.cnt.c[cmd] || 0) + 1;
}
export const progress = (user, q) => (user.cnt?.day === myt().day ? q.cmd.reduce((n, c) => n + (user.cnt.c[c] || 0), 0) : 0);
export function ensureQuests(user, jid) {
    const day = myt().day;
    if (user.misi?.day !== day) user.misi = { day, list: genQuests(`${jid}|${day}`), claimed: {} };
    return user.misi;
}
