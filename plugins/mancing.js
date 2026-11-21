import { renderAkuarium } from '../lib/akuariumcard.js';
import { KEDAI, KEDAI_LV } from '../lib/kedaidata.js';
import { renderKedai } from '../lib/kedaicard.js';
import { levelOf } from '../lib/level.js';
import { penggandaMancing, penggandaJala } from '../lib/magnetbuff.js';
import { beriXp } from '../lib/xp.js';
import { renderJalaPages } from '../lib/jalacard.js';
import fs from 'fs';
import path from 'path';
import { renderCatchCard } from '../lib/card.js';
import * as store from '../lib/store.js';
import { activeEvent } from '../lib/state.js';
import { logEvent } from '../lib/log.js';

// Data pancing kini melalui store (MongoDB bila aktif) supaya KEKAL selepas Render restart.
// Disimpan sebagai rentetan JSON (kunci JID mengandungi titik; rentetan lebih selamat untuk Mongo).
const legacyPath = path.resolve('./database_pancing.json');
export let pancingDB = {};
let pancingSiapDibaca = false; // hanya true bila data berjaya dibaca (elak tulis ganti data sebenar dengan data kosong)
try {
    const raw = await store.get('pancing', 'db', null);
    if (raw) pancingDB = JSON.parse(raw);
    else if (fs.existsSync(legacyPath)) pancingDB = JSON.parse(fs.readFileSync(legacyPath, 'utf8')); // migrasi data lama
    pancingSiapDibaca = true;
} catch (err) {
    console.error('[PANCING] Gagal membaca data. Simpanan dihentikan supaya data sedia ada tak ditulis ganti:', err.message);
    pancingDB = {};
}
let saveTimer = null;
export function savePancingDB() {
    if (!pancingSiapDibaca) { console.warn('[PANCING] simpanan dibatalkan: data belum berjaya dibaca'); return; }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.set('pancing', 'db', JSON.stringify(pancingDB)).catch(e => console.error('[PANCING SAVE]', e.message)), 1500);
    saveTimer.unref?.();
}

const cdMancing = new Map();

// --- KATALOG KEDAI PANCING & JALA (HARGA KAYANGAN & NERF BUFF) ---


const SAMPAH = [
    { nama: 'Plastik Maggi Kari 🍜', harga: 5, buff: 'Tiada' }, { nama: 'Tin Milo Kemek 🥫', harga: 7, buff: 'Tiada' },
    { nama: 'Ranting Kayu Reput 🪵', harga: 9, buff: 'Tiada' }, { nama: 'Selipar Jepun Putus 🩴', harga: 11, buff: 'Tiada' },
    { nama: 'Tayar Motor Botak 🛞', harga: 14, buff: 'Tiada' }, { nama: 'Tin Kopi Terbuang 🥫', harga: 16, buff: 'Tiada' },
    { nama: 'Kasut Bola Koyak 👟', harga: 18, buff: 'Tiada' }, { nama: 'Beg Plastik Lusuh 🛍️', harga: 20, buff: 'Tiada' },
];

const IKAN_BIASA = [
    { nama: 'Ikan Bilis 🐟', harga: 1000, buff: 'Tiada' }, { nama: 'Ikan Tamban 🐟', harga: 1120, buff: 'Tiada' },
    { nama: 'Siput Sedut 🐚', harga: 1250, buff: 'Tiada' }, { nama: 'Ikan Siakap 🐟', harga: 1380, buff: 'Tiada' },
    { nama: 'Ikan Kerapu 🐟', harga: 1500, buff: 'Tiada' }, { nama: 'Ikan Tamban Sisik 🐟', harga: 1630, buff: 'Tiada' },
    { nama: 'Ikan Siakap Putih 🐟', harga: 1760, buff: 'Tiada' }, { nama: 'Ikan Kembung 🐟', harga: 1880, buff: 'Tiada' },
    { nama: 'Ikan Selar Kuning 🐟', harga: 2010, buff: 'Tiada' }, { nama: 'Ikan Keli 🐟', harga: 2140, buff: 'Tiada' },
    { nama: 'Ikan Gelama 🐟', harga: 2260, buff: 'Tiada' }, { nama: 'Ikan Kerapu Hitam 🐟', harga: 2390, buff: 'Tiada' },
    { nama: 'Ikan Merah Sumbo 🐟', harga: 2520, buff: 'Tiada' }, { nama: 'Ikan Kerapu Gelama 🐟', harga: 2640, buff: 'Tiada' },
    { nama: 'Ikan Baung 🐟', harga: 2770, buff: 'Tiada' }, { nama: 'Ikan Cencaru 🐟', harga: 2900, buff: 'Tiada' },
    { nama: 'Ikan Kerisi 🐟', harga: 3020, buff: 'Tiada' }, { nama: 'Sotong Katak 🦑', harga: 3150, buff: 'Tiada' },
    { nama: 'Ikan Kedera 🐟', harga: 3280, buff: 'Tiada' }, { nama: 'Ikan Merah 🐟', harga: 3400, buff: 'Tiada' },
    { nama: 'Ketam Bakau 🦀', harga: 3530, buff: 'Tiada' }, { nama: 'Ikan Pari 🐡', harga: 3660, buff: 'Tiada' },
    { nama: 'Ikan Kerapu Harimau 🐟', harga: 3780, buff: 'Tiada' }, { nama: 'Ikan Belanak 🐟', harga: 3910, buff: 'Tiada' },
    { nama: 'Ikan Siakap Batu 🐟', harga: 4040, buff: 'Tiada' }, { nama: 'Ikan Gelama Papan 🐟', harga: 4160, buff: 'Tiada' },
    { nama: 'Ikan Merah Pucat 🐟', harga: 4290, buff: 'Tiada' }, { nama: 'Ikan Haruan 🐟', harga: 4420, buff: 'Tiada' },
    { nama: 'Ikan Mabong 🐟', harga: 4540, buff: 'Tiada' }, { nama: 'Ikan Patin 🐟', harga: 4670, buff: 'Tiada' },
    { nama: 'Ikan Aya / Tongkol 🐟', harga: 4800, buff: 'Tiada' }, { nama: 'Ikan Bawal Putih 🐟', harga: 4930, buff: 'Tiada' },
    { nama: 'Ikan Tongkol Hitam 🐟', harga: 5050, buff: 'Tiada' }, { nama: 'Ikan Bawal 🐟', harga: 5180, buff: 'Tiada' },
    { nama: 'Ikan Bawal Tambak 🐟', harga: 5310, buff: 'Tiada' }, { nama: 'Ikan Belanak Putih 🐟', harga: 5430, buff: 'Tiada' },
    { nama: 'Ikan Tilapia Hitam 🐟', harga: 5560, buff: 'Tiada' }, { nama: 'Ikan Tenggiri 🐟', harga: 5690, buff: 'Tiada' },
    { nama: 'Ikan Tilapia 🐟', harga: 5810, buff: 'Tiada' }, { nama: 'Ketam Nipah 🦀', harga: 5940, buff: 'Tiada' },
    { nama: 'Ikan Kerapu Sunoh 🐟', harga: 6070, buff: 'Tiada' }, { nama: 'Ikan Kerapu Bara 🐟', harga: 6190, buff: 'Tiada' },
    { nama: 'Ikan Toman Bunga 🐟', harga: 6320, buff: 'Tiada' }, { nama: 'Ikan Bujuk 🐟', harga: 6450, buff: 'Tiada' },
    { nama: 'Ikan Kerapu Merah 🐟', harga: 6570, buff: 'Tiada' }, { nama: 'Ikan Jenahak 🐟', harga: 6700, buff: 'Tiada' },
    { nama: 'Ikan Toman 🐟', harga: 6830, buff: 'Tiada' }, { nama: 'Ikan Alu-Alu 🐟', harga: 6950, buff: 'Tiada' },
    { nama: 'Ikan Todak 🐟', harga: 7080, buff: 'Tiada' }, { nama: 'Ikan Pari Ketuka 🐡', harga: 7210, buff: 'Tiada' },
    { nama: 'Sotong 🦑', harga: 7330, buff: 'Tiada' }, { nama: 'Sotong Kurita 🦑', harga: 7460, buff: 'Tiada' },
    { nama: 'Ketam Bunga 🦀', harga: 7590, buff: 'Tiada' }, { nama: 'Udang 🦐', harga: 7710, buff: 'Tiada' },
    { nama: 'Siput Balitong 🐚', harga: 7840, buff: 'Tiada' }, { nama: 'Kupang 🐚', harga: 7970, buff: 'Tiada' },
    { nama: 'Ikan Bawal Emas 🐟', harga: 8090, buff: 'Tiada' }, { nama: 'Ikan Terubok Kecil 🐟', harga: 8220, buff: 'Tiada' },
    { nama: 'Ikan Pelitup 🐟', harga: 8350, buff: 'Tiada' }, { nama: 'Ikan Sebarau 🐟', harga: 8470, buff: 'Tiada' },
    { nama: 'Ikan Lampam 🐟', harga: 8600, buff: 'Tiada' }, { nama: 'Ikan Tembakul 🐟', harga: 8730, buff: 'Tiada' },
    { nama: 'Ikan Kaci 🐟', harga: 8850, buff: 'Tiada' }, { nama: 'Ikan Kerapu Kecil 🐟', harga: 8980, buff: 'Tiada' },
    { nama: 'Ikan Pedang Kecil 🐟', harga: 9110, buff: 'Tiada' }, { nama: 'Ikan Bawal Hijau 🐟', harga: 9230, buff: 'Tiada' },
    { nama: 'Ikan Keli Kecil 🐟', harga: 9360, buff: 'Tiada' }, { nama: 'Ikan Sembilang Kecil 🐟', harga: 9490, buff: 'Tiada' },
    { nama: 'Ikan Parang 🐟', harga: 9620, buff: 'Tiada' }, { nama: 'Ikan Pinjal 🐟', harga: 9740, buff: 'Tiada' },
    { nama: 'Ikan Torpedo 🐟', harga: 9870, buff: 'Tiada' }, { nama: 'Sotong Kecil 🦑', harga: 10000, buff: 'Tiada' },
];

const IKAN_RARE = [
    { nama: 'Ikan Tembakul Ratu 🐡', harga: 100000, buff: 'Tiada' }, { nama: 'Gerutu Emas 🐟', harga: 119140, buff: 'Tiada' },
    { nama: 'Ikan Duri Bisa 🐡', harga: 138290, buff: 'Tiada' }, { nama: 'Ikan Buntal Beracun 🐡', harga: 157440, buff: 'Tiada' },
    { nama: 'Ikan Kelah Gergasi 🐟', harga: 176590, buff: 'Tiada' }, { nama: 'Ikan Sebelah Mata 👁️', harga: 195740, buff: 'Tiada' },
    { nama: 'Pari Hantu 🦇', harga: 214890, buff: 'Tiada' }, { nama: 'Ikan Sumpit 💦', harga: 234040, buff: 'Tiada' },
    { nama: 'Ketam Batu Berlumut 🦀', harga: 253190, buff: 'Tiada' }, { nama: 'Kerapu Harimau 🐠', harga: 272340, buff: 'Tiada' },
    { nama: 'Lobster Biru 🦞', harga: 291480, buff: '+2% Lulus Jenayah' }, { nama: 'Ikan Kaloi Gergasi 🐠', harga: 310630, buff: 'Tiada' },
    { nama: 'Kerapu Harimau 🐅', harga: 329780, buff: 'Tiada' }, { nama: 'Tenggiri Biru 🐟', harga: 348930, buff: 'Tiada' },
    { nama: 'Pari Bunga Lotus 🐡', harga: 368080, buff: 'Tiada' }, { nama: 'Udang Galah Raja 🦐', harga: 387230, buff: 'Tiada' },
    { nama: 'Ikan Layaran 🗡️', harga: 406380, buff: 'Tiada' }, { nama: 'Kerapu Bara 🌋', harga: 425530, buff: 'Tiada' },
    { nama: 'Belut Elektrik Hitam ⚡', harga: 444680, buff: 'Tiada' }, { nama: 'Ikan Pedang 🗡️', harga: 463830, buff: 'Tiada' },
    { nama: 'Pari Bintang ✨', harga: 482970, buff: 'Tiada' }, { nama: 'Sotong Naga 🦑', harga: 502120, buff: 'Tiada' },
    { nama: 'Ketam Raja Alaska 🦀', harga: 521270, buff: 'Tiada' }, { nama: 'Barakuda Ganas 🦈', harga: 540420, buff: 'Tiada' },
    { nama: 'Ikan Terbang Berkaca 🪽', harga: 559570, buff: 'Tiada' }, { nama: 'Pari Karang Berdarah 🦇', harga: 578720, buff: '+5% Lulus Jenayah' },
    { nama: 'Kerapu Naga 🐉', harga: 597870, buff: '+RM1,000 Gaji' }, { nama: 'Sotong Kurita Gergasi 🐙', harga: 617020, buff: '+RM1,000 Gaji Kerja' },
    { nama: 'Ikan Gergaji 🪚', harga: 636170, buff: '+RM1,500 Gaji' }, { nama: 'Ikan Tapah Raksasa 🐟', harga: 655310, buff: '+3% Lulus Jenayah' },
    { nama: 'Ikan Empurau 👑', harga: 674460, buff: '+RM2,500 Gaji Kerja' }, { nama: 'Sotong Vampir 🦑', harga: 693610, buff: '+4% Lulus Jenayah' },
    { nama: 'Kelah Merah 🐟', harga: 712760, buff: '+RM1,500 Gaji' }, { nama: 'Kuda Laut Mahkota 👑', harga: 731910, buff: '+RM2,000 Gaji' },
    { nama: 'Kura-Kura Emas 🐢', harga: 751060, buff: '-5% Peluang Kantoi' }, { nama: 'Terumbu Karang Hidup 🪸', harga: 770210, buff: '+RM3,000 Gaji' },
    { nama: 'Ikan Kaloi Raja 🐟', harga: 789360, buff: 'Tiada' }, { nama: 'Ikan Empurau Biru 🐟', harga: 808510, buff: 'Tiada' },
    { nama: 'Kerapu Mutiara 🐠', harga: 827660, buff: 'Tiada' }, { nama: 'Ketam Karang Emas 🦀', harga: 846800, buff: 'Tiada' },
    { nama: 'Sotong Naga Bulan 🦑', harga: 865950, buff: 'Tiada' }, { nama: 'Pari Halimunan 🐡', harga: 885100, buff: 'Tiada' },
    { nama: 'Belut Api 🐍', harga: 904250, buff: 'Tiada' }, { nama: 'Kuda Laut Pelangi 🐴', harga: 923400, buff: 'Tiada' },
    { nama: 'Ikan Lumba Biru 🐬', harga: 942550, buff: 'Tiada' }, { nama: 'Penyu Karang Raja 🐢', harga: 961700, buff: 'Tiada' },
    { nama: 'Ikan Bunga Api 🐠', harga: 980850, buff: 'Tiada' }, { nama: 'Siakap Gergasi 🐟', harga: 1000000, buff: 'Tiada' },
];

const IKAN_MITOS = [
    { nama: 'Penyu Purba Mata Ruby 🐢', harga: 1000000, buff: 'Tiada' }, { nama: 'Penyu Gergasi Purba 🐢', harga: 1290320, buff: '-10% Peluang Kantoi' },
    { nama: 'Jerung Putih Besar 🦈', harga: 1580640, buff: '+15% Lulus Jenayah' }, { nama: 'Duyung Sesat 🧜‍♀️', harga: 1870960, buff: '+RM20,000 Gaji Kerja' },
    { nama: 'Tapak Sulaiman Magma 🌋', harga: 2161290, buff: '+18% Lulus Jenayah' }, { nama: 'Megalodon Purba 🦖', harga: 2451610, buff: '+30% Lulus Jenayah' },
    { nama: 'Jerung Megamulut 🦈', harga: 2741930, buff: '+RM25,000 Gaji Kerja' }, { nama: 'Jerung Tukul Besi 🦈', harga: 3032250, buff: '+22% Lulus Jenayah' },
    { nama: 'Ikan Emas Lagenda 🐠', harga: 3322580, buff: '+20% Lulus Jenayah & Curi' }, { nama: 'Ular Laut Obsidian 🐍', harga: 3612900, buff: '+RM28,000 Gaji' },
    { nama: 'Naga Laut Bersisik Emas 🐉', harga: 3903220, buff: 'Tiada' }, { nama: 'Ikan Paus Biru 🐋', harga: 4193540, buff: '+18% Lulus Jenayah' },
    { nama: 'Ikan Purba Coelacanth 🐟', harga: 4483870, buff: '+25% Lulus Jenayah' }, { nama: 'Pari Manta Nilam 🦇', harga: 4774190, buff: '+35% Lulus Jenayah' },
    { nama: 'Kraken Emas 🦑', harga: 5064510, buff: '+25% Lulus Jenayah' }, { nama: 'Naga Laut Raksasa 🐉', harga: 5354830, buff: '+RM30,000 Gaji Kerja' },
    { nama: 'Gurita Bulan Purnama 🐙', harga: 5645160, buff: 'Tiada' }, { nama: 'Paus Orca Bintang 🐋', harga: 5935480, buff: '+RM35,000 Gaji' },
    { nama: 'Cumi-Cumi Kosmik 🦑', harga: 6225800, buff: '+RM40,000 Gaji' }, { nama: 'Leviathan Penjaga Arus 🐲', harga: 6516120, buff: '+RM50,000 Gaji Kerja' },
    { nama: 'Ikan Tuah Kaca Dewa 🐟', harga: 6806450, buff: 'Tiada' }, { nama: 'Raja Ketam Atlantis 🦀', harga: 7096770, buff: '+RM45,000 Gaji' },
    { nama: 'Penyu Belimbing Berlian 🐢', harga: 7387090, buff: '-20% Peluang Kantoi' }, { nama: 'Ikan Duyung Hitam 🧜‍♀️', harga: 7677410, buff: '+RM60,000 Gaji' },
    { nama: 'Naga Laut Api 🐉', harga: 7967740, buff: 'Tiada' }, { nama: 'Duyung Emas 🧜', harga: 8258060, buff: 'Tiada' },
    { nama: 'Jerung Kristal 🦈', harga: 8548380, buff: 'Tiada' }, { nama: 'Gurita Bayangan 🐙', harga: 8838710, buff: 'Tiada' },
    { nama: 'Ikan Dewa Laut 🐟', harga: 9129030, buff: 'Tiada' }, { nama: 'Penyu Abadi 🐢', harga: 9419350, buff: 'Tiada' },
    { nama: 'Ular Laut Kaca 🐍', harga: 9709670, buff: 'Tiada' }, { nama: 'Burung Helang Laut 🦅', harga: 10000000, buff: 'Tiada' },
];

const BELI_CMD = { beli_rod: 'rod', beli_reel: 'reel', beli_umpan: 'umpan', beli_jala: 'jala', beli_akuarium: 'akuarium' };

export const IKAN_LEGEND = [
    { nama: 'Ikan Pari Kristal Biru', harga: 1000000, buff: 'Tiada' }, { nama: 'Jerung Bayang Samudera', harga: 1020200, buff: 'Tiada' },
    { nama: 'Ikan Kaca Berlapis Perak', harga: 1040400, buff: 'Tiada' }, { nama: 'Siakap Mahkota Karang', harga: 1060610, buff: 'Tiada' },
    { nama: 'Kerapu Sisik Zamrud', harga: 1080810, buff: 'Tiada' }, { nama: 'Ikan Layar Gerhana', harga: 1101010, buff: 'Tiada' },
    { nama: 'Tenggiri Petir Laut', harga: 1121210, buff: 'Tiada' }, { nama: 'Ikan Bulan Pasang', harga: 1141410, buff: 'Tiada' },
    { nama: 'Barakuda Api Biru', harga: 1161620, buff: 'Tiada' }, { nama: 'Ikan Kelisa Gergasi', harga: 1181820, buff: 'Tiada' },
    { nama: 'Ikan Gelombang Perak', harga: 1202020, buff: 'Tiada' }, { nama: 'Ikan Sirip Kristal', harga: 1222220, buff: 'Tiada' },
    { nama: 'Ikan Bunga Karang Emas', harga: 1242420, buff: 'Tiada' }, { nama: 'Ikan Arus Pusaran', harga: 1262630, buff: 'Tiada' },
    { nama: 'Kerapu Taring Besi', harga: 1282830, buff: 'Tiada' }, { nama: 'Ikan Layang Bintang', harga: 1303030, buff: 'Tiada' },
    { nama: 'Ikan Mutiara Samudera', harga: 1323230, buff: 'Tiada' }, { nama: 'Ikan Tanduk Laut', harga: 1343430, buff: 'Tiada' },
    { nama: 'Ikan Sisik Obsidian', harga: 1363640, buff: 'Tiada' }, { nama: 'Ikan Pelangi Pusar', harga: 1383840, buff: 'Tiada' },
    { nama: 'Ikan Kabus Biru', harga: 1404040, buff: 'Tiada' }, { nama: 'Siakap Kilat Malam', harga: 1424240, buff: 'Tiada' },
    { nama: 'Ikan Ombak Berapi', harga: 1444440, buff: 'Tiada' }, { nama: 'Ikan Taming Sari', harga: 1464650, buff: 'Tiada' },
    { nama: 'Ikan Paus Kecil Berkilau', harga: 1484850, buff: 'Tiada' }, { nama: 'Sotong Gerhana', harga: 1505050, buff: 'Tiada' },
    { nama: 'Sotong Kaca Biru', harga: 1525250, buff: 'Tiada' }, { nama: 'Gurita Arus Hitam', harga: 1545450, buff: 'Tiada' },
    { nama: 'Gurita Bintang Laut', harga: 1565660, buff: 'Tiada' }, { nama: 'Sotong Lava', harga: 1585860, buff: 'Tiada' },
    { nama: 'Gurita Permata', harga: 1606060, buff: 'Tiada' }, { nama: 'Sotong Berlian', harga: 1626260, buff: 'Tiada' },
    { nama: 'Gurita Ombak Perak', harga: 1646460, buff: 'Tiada' }, { nama: 'Sotong Halilintar', harga: 1666670, buff: 'Tiada' },
    { nama: 'Gurita Kabus Ungu', harga: 1686870, buff: 'Tiada' }, { nama: 'Ketam Karang Obsidian', harga: 1707070, buff: 'Tiada' },
    { nama: 'Ketam Mutiara Biru', harga: 1727270, buff: 'Tiada' }, { nama: 'Udang Galah Api', harga: 1747470, buff: 'Tiada' },
    { nama: 'Udang Kristal Malam', harga: 1767680, buff: 'Tiada' }, { nama: 'Ketam Ombak Emas', harga: 1787880, buff: 'Tiada' },
    { nama: 'Udang Bunga Karang', harga: 1808080, buff: 'Tiada' }, { nama: 'Ketam Batu Lava', harga: 1828280, buff: 'Tiada' },
    { nama: 'Udang Pelangi Dasar', harga: 1848480, buff: 'Tiada' }, { nama: 'Ketam Gerhana', harga: 1868690, buff: 'Tiada' },
    { nama: 'Udang Karang Sakti', harga: 1888890, buff: 'Tiada' }, { nama: 'Penyu Samudera Berbintang', harga: 1909090, buff: 'Tiada' },
    { nama: 'Penyu Karang Lava', harga: 1929290, buff: 'Tiada' }, { nama: 'Penyu Kristal Biru', harga: 1949490, buff: 'Tiada' },
    { nama: 'Kura-Kura Gerhana', harga: 1969700, buff: 'Tiada' }, { nama: 'Penyu Mutiara Pusar', harga: 1989900, buff: 'Tiada' },
    { nama: 'Lumba-Lumba Kabus', harga: 2010100, buff: 'Tiada' }, { nama: 'Paus Bayang Biru', harga: 2030300, buff: 'Tiada' },
    { nama: 'Ular Laut Halilintar', harga: 2050510, buff: 'Tiada' }, { nama: 'Belut Kristal Dasar', harga: 2070710, buff: 'Tiada' },
    { nama: 'Kuda Laut Api', harga: 2090910, buff: 'Tiada' }, { nama: 'Karang Bercahaya Emas', harga: 2111110, buff: 'Tiada' },
    { nama: 'Anemon Kristal Biru', harga: 2131310, buff: 'Tiada' }, { nama: 'Bunga Karang Halilintar', harga: 2151520, buff: 'Tiada' },
    { nama: 'Karang Api Lagenda', harga: 2171720, buff: 'Tiada' }, { nama: 'Terumbu Pelangi Abadi', harga: 2191920, buff: 'Tiada' },
    { nama: 'Anemon Gerhana', harga: 2212120, buff: 'Tiada' }, { nama: 'Karang Mutiara Malam', harga: 2232320, buff: 'Tiada' },
    { nama: 'Lumut Laut Bercahaya', harga: 2252530, buff: 'Tiada' }, { nama: 'Rumpai Laut Perak', harga: 2272730, buff: 'Tiada' },
    { nama: 'Karang Obsidian', harga: 2292930, buff: 'Tiada' }, { nama: 'Ikan Kunang-Kunang Laut', harga: 2313130, buff: 'Tiada' },
    { nama: 'Ikan Lentera Dasar', harga: 2333330, buff: 'Tiada' }, { nama: 'Ikan Pendar Biru', harga: 2353540, buff: 'Tiada' },
    { nama: 'Ikan Bintang Berkilau', harga: 2373740, buff: 'Tiada' }, { nama: 'Ikan Suluh Malam', harga: 2393940, buff: 'Tiada' },
    { nama: 'Ikan Sinar Pasang', harga: 2414140, buff: 'Tiada' }, { nama: 'Ikan Lampu Samudera', harga: 2434340, buff: 'Tiada' },
    { nama: 'Ikan Kilau Bulan', harga: 2454550, buff: 'Tiada' }, { nama: 'Ikan Pendar Ungu', harga: 2474750, buff: 'Tiada' },
    { nama: 'Ikan Lentera Gerhana', harga: 2494950, buff: 'Tiada' }, { nama: 'Ikan Bara Laut', harga: 2515150, buff: 'Tiada' },
    { nama: 'Ikan Lava Samudera', harga: 2535350, buff: 'Tiada' }, { nama: 'Ikan Api Pusaran', harga: 2555560, buff: 'Tiada' },
    { nama: 'Ikan Merah Halilintar', harga: 2575760, buff: 'Tiada' }, { nama: 'Ikan Obor Dasar', harga: 2595960, buff: 'Tiada' },
    { nama: 'Ikan Bara Kristal', harga: 2616160, buff: 'Tiada' }, { nama: 'Ikan Api Gerhana', harga: 2636360, buff: 'Tiada' },
    { nama: 'Ikan Cendana Api', harga: 2656570, buff: 'Tiada' }, { nama: 'Ikan Kobaran Laut', harga: 2676770, buff: 'Tiada' },
    { nama: 'Ikan Bara Emas', harga: 2696970, buff: 'Tiada' }, { nama: 'Ikan Hantu Dasar', harga: 2717170, buff: 'Tiada' },
    { nama: 'Ikan Bayang Kabus', harga: 2737370, buff: 'Tiada' }, { nama: 'Ikan Roh Samudera', harga: 2757580, buff: 'Tiada' },
    { nama: 'Ikan Kabut Abadi', harga: 2777780, buff: 'Tiada' }, { nama: 'Ikan Tengkorak Laut', harga: 2797980, buff: 'Tiada' },
    { nama: 'Ikan Hitam Gerhana', harga: 2818180, buff: 'Tiada' }, { nama: 'Ikan Bisikan Ombak', harga: 2838380, buff: 'Tiada' },
    { nama: 'Ikan Kabus Ungu', harga: 2858590, buff: 'Tiada' }, { nama: 'Ikan Bayu Laut', harga: 2878790, buff: 'Tiada' },
    { nama: 'Ikan Sunyi Dasar', harga: 2898990, buff: 'Tiada' }, { nama: 'Ikan Bayang Kristal', harga: 2919190, buff: 'Tiada' },
    { nama: 'Ikan Penjaga Dasar', harga: 2939390, buff: 'Tiada' }, { nama: 'Ikan Pembisik Karang', harga: 2959600, buff: 'Tiada' },
    { nama: 'Ikan Pelindung Abadi', harga: 2979800, buff: 'Tiada' }, { nama: 'Ikan Kabus Biru Malam', harga: 3000000, buff: 'Tiada' },
];

export const IKAN_SECRET = [
    { nama: 'Naga Kristal Kosmik', harga: 10000000, buff: 'Tiada' }, { nama: 'Jerung Tanpa Bayang', harga: 10816330, buff: 'Tiada' },
    { nama: 'Ikan Dewa Waktu', harga: 11632650, buff: 'Tiada' }, { nama: 'Leviathan Berbisik', harga: 12448980, buff: 'Tiada' },
    { nama: 'Duyung Abadi Kosmos', harga: 13265310, buff: 'Tiada' }, { nama: 'Sotong Tanpa Mata', harga: 14081630, buff: 'Tiada' },
    { nama: 'Gurita Dimensi', harga: 14897960, buff: 'Tiada' }, { nama: 'Ikan Matahari Hitam', harga: 15714290, buff: 'Tiada' },
    { nama: 'Penyu Ribuan Zaman', harga: 16530610, buff: 'Tiada' }, { nama: 'Kraken Berbintang', harga: 17346940, buff: 'Tiada' },
    { nama: 'Ikan Bintang Terakhir', harga: 18163270, buff: 'Tiada' }, { nama: 'Ikan Tujuh Lautan', harga: 18979590, buff: 'Tiada' },
    { nama: 'Ikan Rahsia Dasar Abadi', harga: 19795920, buff: 'Tiada' }, { nama: 'Naga Samudera Biru Tua', harga: 20612240, buff: 'Tiada' },
    { nama: 'Burung Ombak Abadi', harga: 21428570, buff: 'Tiada' }, { nama: 'Ikan Kiamat Perak', harga: 22244900, buff: 'Tiada' },
    { nama: 'Ikan Mahkota Bulan Hitam', harga: 23061220, buff: 'Tiada' }, { nama: 'Penyu Permata Kosmos', harga: 23877550, buff: 'Tiada' },
    { nama: 'Ikan Zamrud Abadi', harga: 24693880, buff: 'Tiada' }, { nama: 'Jerung Kabut Purba', harga: 25510200, buff: 'Tiada' },
    { nama: 'Ikan Cermin Samudera', harga: 26326530, buff: 'Tiada' }, { nama: 'Gurita Mahkota Bintang', harga: 27142860, buff: 'Tiada' },
    { nama: 'Ikan Kunci Dasar', harga: 27959180, buff: 'Tiada' }, { nama: 'Naga Lautan Tanpa Hujung', harga: 28775510, buff: 'Tiada' },
    { nama: 'Duyung Kristal Hitam', harga: 29591840, buff: 'Tiada' }, { nama: 'Ikan Api Kosmik', harga: 30408160, buff: 'Tiada' },
    { nama: 'Leviathan Gerhana Bulan', harga: 31224490, buff: 'Tiada' }, { nama: 'Ikan Waktu Berputar', harga: 32040820, buff: 'Tiada' },
    { nama: 'Sotong Kosmos Sakti', harga: 32857140, buff: 'Tiada' }, { nama: 'Ikan Halimunan Lautan', harga: 33673470, buff: 'Tiada' },
    { nama: 'Ikan Rubi Abadi', harga: 34489800, buff: 'Tiada' }, { nama: 'Penyu Bintang Hitam', harga: 35306120, buff: 'Tiada' },
    { nama: 'Jerung Bulan Tenggelam', harga: 36122450, buff: 'Tiada' }, { nama: 'Ikan Jiwa Samudera', harga: 36938780, buff: 'Tiada' },
    { nama: 'Gurita Waktu Lama', harga: 37755100, buff: 'Tiada' }, { nama: 'Ikan Angin Dasar Laut', harga: 38571430, buff: 'Tiada' },
    { nama: 'Naga Kristal Biru Malam', harga: 39387760, buff: 'Tiada' }, { nama: 'Ikan Hujan Kosmos', harga: 40204080, buff: 'Tiada' },
    { nama: 'Penyu Kabus Purba', harga: 41020410, buff: 'Tiada' }, { nama: 'Ikan Gelombang Abadi', harga: 41836730, buff: 'Tiada' },
    { nama: 'Ikan Cahaya Kosmik', harga: 42653060, buff: 'Tiada' }, { nama: 'Jerung Kristal Bintang', harga: 43469390, buff: 'Tiada' },
    { nama: 'Ikan Lukisan Dasar', harga: 44285710, buff: 'Tiada' }, { nama: 'Duyung Abadi Hitam', harga: 45102040, buff: 'Tiada' },
    { nama: 'Ikan Mahkota Samudera', harga: 45918370, buff: 'Tiada' }, { nama: 'Gurita Kabus Kosmik', harga: 46734690, buff: 'Tiada' },
    { nama: 'Naga Bintang Lautan', harga: 47551020, buff: 'Tiada' }, { nama: 'Ikan Jam Dasar', harga: 48367350, buff: 'Tiada' },
    { nama: 'Penyu Tujuh Bintang', harga: 49183670, buff: 'Tiada' }, { nama: 'Ikan Takdir Samudera', harga: 50000000, buff: 'Tiada' },
];

export default {
    name: 'mancing',
    alias: ['ikan', 'akuarium', 'bela_ikan', 'jual_ikan', 'jual_akuarium', 'kedai_pancing', 'beli_pancing', 'beli_rod', 'beli_reel', 'beli_umpan', 'beli_jala', 'beli_akuarium', 'jala'],
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const senderId = m.key.participant || jid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const args = teks.trim().split(' ').slice(1);
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            // SUNTIKAN SISTEM: Daftar User dalam Local JSON Database jika belum wujud
            if (!pancingDB[senderId]) {
                pancingDB[senderId] = {
                    rod: { nama: 'Tali Rafia', buff_rare: 0 },
                    reel: { nama: 'Tiada', buff_mitos: 0 },
                    umpan: { nama: 'Tiada', qty: 0, bonus_all: 0 },
                    jala: { nama: 'Tiada', qty: 0, min_tangkapan: 0, max_tangkapan: 0 },
                    akuarium: { nama: 'Balang Kuih (Percuma)', slot: 1, ikan: [] },
                    tong_ikan: []
                };
                savePancingDB();
            }

            const pData = pancingDB[senderId];

            if (cmd === 'kedai_pancing') {
                let ui = `╔═════════════════════════════╗\n    🎣 𝗞𝗘𝗗𝗔𝗜 𝗣𝗔𝗡𝗖𝗜𝗡𝗚 𝗣𝗥𝗢 (𝗛𝗔𝗥𝗗𝗖𝗢𝗥𝗘)\n╠═════════════════════════════╣\n\n`;
                const gambar = await renderKedai();
                return sock.sendMessage(jid, {
                    image: gambar,
                    caption: '🛒 *Cara beli:* `.beli_rod [no]` · `.beli_reel [no]` · `.beli_umpan [no]` · `.beli_jala [no]` · `.beli_akuarium [no]`',
                }, { quoted: m });
            }

            if (cmd === 'beli_pancing' || BELI_CMD[cmd]) {
                const kategori = BELI_CMD[cmd] || args[0]?.toLowerCase();
                const id = BELI_CMD[cmd] ? args[0] : args[1];
                if (!['rod', 'reel', 'umpan', 'jala', 'akuarium'].includes(kategori) || !id) return sock.sendMessage(jid, { text: `❌ Format: \`.beli_pancing [rod/reel/umpan/jala/akuarium] [nombor]\`` }, { quoted: m });
                
                const item = KEDAI[kategori][id];
                if (!item) return sock.sendMessage(jid, { text: `❌ Kod nombor tak wujud dalam kedai.` }, { quoted: m });
                const perluLv = KEDAI_LV[kategori]?.[id] || 1;
                if (levelOf(user) < perluLv) return sock.sendMessage(jid, { text: `🔒 ${item.nama} dibuka pada level ${perluLv}. Level awak sekarang ${levelOf(user)}.` }, { quoted: m });
                if ((user.wallet || 0) < item.harga) return sock.sendMessage(jid, { text: `❌ Duit poket tak cukup RM ${item.harga.toLocaleString()}!` }, { quoted: m });

                user.wallet -= item.harga;
                
                if (kategori === 'akuarium') {
                    const ikanLama = pData.akuarium.ikan || [];
                    pData.akuarium = { nama: item.nama, slot: item.slot, ikan: ikanLama };
                } else if (kategori === 'umpan' || kategori === 'jala') {
                    if (pData[kategori].nama === item.nama) {
                        pData[kategori].qty += item.qty;
                    } else {
                        pData[kategori] = { 
                            nama: item.nama, 
                            qty: item.qty, 
                            bonus_all: item.bonus_all || 0,
                            min_tangkapan: item.min_tangkapan || 0,
                            max_tangkapan: item.max_tangkapan || 0,
                            bonus_rare: item.bonus_rare || 0,
                            bonus_mitos: item.bonus_mitos || 0
                        };
                    }
                } else {
                    pData[kategori] = { nama: item.nama, [`buff_${kategori === 'rod'?'rare':'mitos'}`]: item[`buff_${kategori === 'rod'?'rare':'mitos'}`] };
                }

                savePancingDB(); 
                await db.saveUser(user);

                return sock.sendMessage(jid, { text: `✅ Pembayaran disahkan!\n\nKau telah membeli *${item.nama}*.\n${item.ket || ''}` }, { quoted: m });
            }

            if (cmd === 'mancing') {
                const now = Date.now();

                // Newbie (akaun <= 7 hari): 3 cast percuma tanpa umpan
                user.stats = user.stats || {};
                const baruAkaun = user.createdAt && (now - user.createdAt) < 7 * 864e5;
                if (user.stats.free_mancing === undefined && baruAkaun) user.stats.free_mancing = 3;
                const percuma = (user.stats.free_mancing || 0) > 0;

                if (!percuma && (!pData.umpan || pData.umpan.qty <= 0)) {
                    return sock.sendMessage(jid, { text: `❌ Kotak umpan kosong! Pergi borong di \`.kedai_pancing\` dulu.` }, { quoted: m });
                }
                if (percuma) { user.stats.free_mancing -= 1; await db.saveUser(user); }
                else { pData.umpan.qty -= 1; }


                // NERF PELUANG: Mitos (0.2%), Rare (5%), Biasa (60%)
                const rng = Math.random();
                const pilih = arr => arr[Math.floor(Math.random() * arr.length)];
                let rarity, ikanDapat;
                const ev = activeEvent(), tide = ev?.code === 'MYTHIC_TIDE' ? 0.03 : 0, frenzy = ev?.code === 'MEGA_HARVEST' ? 0.08 : 0;
                // Kadar tangkapan (jumlah 100%): secret 0.05%, mythic 0.45%, legend 1.5%, rare 12%, biasa 65%, sampah selebihnya
                const bufMitos = (pData.reel.buff_mitos || 0) + (pData.umpan.bonus_all || 0) * 0.1;
                const rareBuf = Math.min(0.02, frenzy + (pData.rod.buff_rare || 0) + (pData.umpan.bonus_all || 0) * 0.3);
                const T_SECRET = 0.0005 + bufMitos * 0.1;
                const T_MITOS = T_SECRET + 0.0045 + tide + bufMitos;
                const T_LEGEND = T_MITOS + 0.015;
                const T_RARE = T_LEGEND + 0.12 + rareBuf;
                const T_BIASA = T_RARE + 0.65;
                if (rng < T_SECRET) { rarity = 'secret'; ikanDapat = pilih(IKAN_SECRET); }
                else if (rng < T_MITOS) { rarity = 'mitos'; ikanDapat = pilih(IKAN_MITOS); }
                else if (rng < T_LEGEND) { rarity = 'legend'; ikanDapat = pilih(IKAN_LEGEND); }
                else if (rng < T_RARE) { rarity = 'rare'; ikanDapat = pilih(IKAN_RARE); }
                else if (rng < T_BIASA) { rarity = 'biasa'; ikanDapat = pilih(IKAN_BIASA); }
                else { rarity = 'sampah'; ikanDapat = pilih(SAMPAH); }

                ikanDapat = { ...ikanDapat, rarity, harga: Math.round(ikanDapat.harga * penggandaMancing(user)) };
                (pData.dex ||= {})[ikanDapat.nama] = true;
                beriXp(user, rarity === 'secret' ? 120 : rarity === 'mitos' ? 50 : rarity === 'legend' ? 30 : rarity === 'rare' ? 15 : 5, 'mancing');
                pData.tong_ikan.push(ikanDapat);
                try {
                    user.stats = user.stats || {}; user.stats.fish_caught = (user.stats.fish_caught || 0) + 1;
                    await db.saveUser(user);
                    if (rarity === 'mitos') await logEvent({ type: 'mitos', actor: senderId, nama: ikanDapat.nama, group: jid });
                } catch (e) { console.error('[MANCING STAT]', e.message); }

                if (pData.umpan.qty <= 0) {
                    pData.umpan = { nama: 'Tiada', qty: 0, bonus_all: 0 };
                }

                savePancingDB();
                
                let displayBuff = '';

let caption = `🎣 *TANGKAPAN JORAN*\n\n🐟 *${ikanDapat.nama}*\n💵 Nilai: RM ${ikanDapat.harga.toLocaleString()}${displayBuff}\n\n🎣 Sisa Umpan (${pData.umpan.nama || 'Tiada'}): ${pData.umpan.qty}x`;
                try {
                    const img = renderCatchCard({ nama: ikanDapat.nama, rarity, harga: ikanDapat.harga, owner: user?.name || 'Warga Gelap', arahan: 'SIMPAN: .ikan  |  .akuarium [no]     JUAL: .jual_ikan' });
                    const tag = rarity === 'mitos' ? `🚨🚨 *BERITA UTAMA!* @${senderId.split('@')[0]} tangkap *${ikanDapat.nama}*! 🚨🚨\n\n` : '';
                    return sock.sendMessage(jid, { image: img, caption: tag + caption, mentions: rarity === 'mitos' ? [senderId] : [] }, { quoted: m });
                } catch (e) {
                    console.error('[CARD ERROR]', e.message);
                }
                return sock.sendMessage(jid, { text: caption }, { quoted: m });
            }

            if (cmd === 'jala') {
                const now = Date.now();
                // Cooldown jala: 2 minit (120,000 ms)
                if (now - (cdMancing.get(senderId + '_jala') || 0) < 120000) {
                    return sock.sendMessage(jid, { text: `⏳ Jala sedang dikeringkan! Tunggu ${Math.ceil((120000 - (now - (cdMancing.get(senderId + '_jala') || 0))) / 1000)} saat lagi.` }, { quoted: m });
                }

                if (!pData.jala || pData.jala.qty <= 0) {
                    return sock.sendMessage(jid, { text: `❌ Jala awak tiada atau dah koyak! Pergi beli jala baharu di \`.kedai_pancing\`.` }, { quoted: m });
                }

                cdMancing.set(senderId + '_jala', now);
                
                let statusJala = "✅ Jala masih elok tanpa calar.";
                
                // NERF KETAHANAN: 45% peluang jala koyak setiap tebaran
                if (Math.random() < 0.45) { 
                    pData.jala.qty -= 1;
                    statusJala = "⚠️ Jala tersangkut karang! (Ketahanan -1)";
                }

                const minT = pData.jala.min_tangkapan || 2;
                const maxT = pData.jala.max_tangkapan || 4;
                const jumlahTangkapan = Math.floor(Math.random() * (maxT - minT + 1)) + minT;

                let hasilJalaTeks = `🕸️ *TEBARAN JALA BERJAYA!* 🕸️\nKau sauk air laut dan naikkan:\n\n`;
                let totalHarga = 0;
                const koleksiJala = [];

                for (let i = 0; i < jumlahTangkapan; i++) {
                    const rngJala = Math.random();
                    // Drop rate Hardcore untuk Jala
                    const jSecret = 0.0005, jMitos = jSecret + 0.0045 + (pData.jala.bonus_mitos || 0), jLegend = jMitos + 0.015, jRare = jLegend + 0.12 + Math.min(0.02, pData.jala.bonus_rare || 0), jBiasa = jRare + 0.65;
                    let tangkapan = rngJala < jSecret ? IKAN_SECRET[Math.floor(Math.random() * IKAN_SECRET.length)] :
                                    rngJala < jMitos ? IKAN_MITOS[Math.floor(Math.random() * IKAN_MITOS.length)] :
                                    rngJala < jLegend ? IKAN_LEGEND[Math.floor(Math.random() * IKAN_LEGEND.length)] :
                                    rngJala < jRare ? IKAN_RARE[Math.floor(Math.random() * IKAN_RARE.length)] :
                                    rngJala < jBiasa ? IKAN_BIASA[Math.floor(Math.random() * IKAN_BIASA.length)] : SAMPAH[Math.floor(Math.random() * SAMPAH.length)];

                    const rarJala = IKAN_SECRET.includes(tangkapan) ? 'secret' : IKAN_MITOS.includes(tangkapan) ? 'mitos' : IKAN_LEGEND.includes(tangkapan) ? 'legend' : IKAN_RARE.includes(tangkapan) ? 'rare' : SAMPAH.includes(tangkapan) ? 'sampah' : 'biasa';
                    tangkapan = { ...tangkapan, rarity: rarJala, harga: Math.round(tangkapan.harga * penggandaJala(user)) };
                    koleksiJala.push({ nama: tangkapan.nama, harga: tangkapan.harga, rarity: rarJala });
                    pData.tong_ikan.push(tangkapan);
                    totalHarga += tangkapan.harga;
                    
                    // Paparkan buff jika ada
                    let displayBuff = tangkapan.buff !== 'Tiada' ? ` ⚡ [${tangkapan.buff}]` : '';
                    hasilJalaTeks += `▪️ ${tangkapan.nama} (RM ${tangkapan.harga.toLocaleString()})${displayBuff}\n`;
                }

                let sisaJalaDisplay = pData.jala.qty;
                if (pData.jala.qty <= 0) {
                    statusJala = "💥 Jala koyak rabak sepenuhnya dan tak boleh diguna lagi!";
                    sisaJalaDisplay = 0;
                    pData.jala = { nama: 'Tiada', qty: 0, min_tangkapan: 0, max_tangkapan: 0 };
                }

                savePancingDB();

                hasilJalaTeks += `\n📦 Jumlah Tangkapan: *${jumlahTangkapan} Ekor*\n` +
                                 `💵 Anggaran Nilai Pasaran: *RM ${totalHarga.toLocaleString()}*\n\n` +
                                 `[ ${statusJala} ]\n🕸️ Sisa Ketahanan: ${sisaJalaDisplay}x`;

                if (koleksiJala.length) {
                    for (const halaman of renderJalaPages(koleksiJala)) await sock.sendMessage(jid, { image: halaman }, { quoted: m }).catch(() => {});
                }
                return sock.sendMessage(jid, { text: hasilJalaTeks }, { quoted: m });
            }

            if (cmd === 'ikan') {
                if (!pData.tong_ikan || pData.tong_ikan.length === 0) return sock.sendMessage(jid, { text: `🐟 Tong ikan kosong.` }, { quoted: m });
                let senarai = `╔═════════════════════════════╗\n    🐟 𝗧𝗢𝗡𝗚 𝗜𝗞𝗔𝗡\n╠═════════════════════════════╣\n`;
                pData.tong_ikan.forEach((i, idx) => senarai += `║ [${idx + 1}] ${i.nama} (RM ${i.harga.toLocaleString()})\n║ ↳ Buff: ${i.buff}\n`);
                senarai += `╚═════════════════════════════╝\n💡 Guna: \`.bela_ikan [no]\` atau \`.jual_ikan\``;
                return sock.sendMessage(jid, { text: senarai }, { quoted: m });
            }

            if (cmd === 'akuarium') {
                const ak = pData.akuarium;
                const gambar = await renderAkuarium(ak);
                const senarai = ak.ikan.map((i, idx) => `${idx + 1}. ${i.nama} · ${i.buff}`).join('\n') || 'Belum ada ikan.';
                return sock.sendMessage(jid, { image: gambar, caption: `🌊 *${ak.nama}* [${ak.ikan.length}/${ak.slot}]\n${senarai}\n\n💡 Jual ikan berharga: \`.jual_akuarium [no]\`` }, { quoted: m });
            }

            if (cmd === 'bela_ikan') {
                const ak = pData.akuarium;
                const indeks = parseInt(args[0]) - 1;
                
                if (isNaN(indeks) || !pData.tong_ikan[indeks]) return sock.sendMessage(jid, { text: `❌ Nombor ikan tak sah. Rujuk \`.ikan\`` }, { quoted: m });
                if (ak.ikan.length >= ak.slot) return sock.sendMessage(jid, { text: `❌ ${ak.nama} dah penuh! Kena upgrade akuarium kat kedai.` }, { quoted: m });

                const ikanPilihan = pData.tong_ikan[indeks];
                if (ikanPilihan.buff === 'Tiada') return sock.sendMessage(jid, { text: `❌ Ikan ni takde buff, buang masa je bela. Jual!` }, { quoted: m });

                ak.ikan.push(ikanPilihan);
                pData.tong_ikan.splice(indeks, 1);
                savePancingDB();

                return sock.sendMessage(jid, { text: `🌊 Awak masukkan *${ikanPilihan.nama}* ke dalam ${ak.nama}.\nIkan disimpan dalam akuarium.` }, { quoted: m });
            }

            if (cmd === 'jual_ikan') {
                if (!pData.tong_ikan || pData.tong_ikan.length === 0) return sock.sendMessage(jid, { text: '❌ Tong ikan kosong.' }, { quoted: m });
                let untung = 0;
                pData.tong_ikan.forEach(i => untung += i.harga);
                user.wallet += untung;
                pData.tong_ikan = []; 
                
                savePancingDB();
                await db.saveUser(user);
                
                return sock.sendMessage(jid, { text: `💸 Semua tangkapan dijual! Untung Bersih: *RM ${untung.toLocaleString()}*` }, { quoted: m });
            }

            if (cmd === 'jual_akuarium') {
                const ak = pData.akuarium;
                const indeks = parseInt(args[0]) - 1;
                
                if (isNaN(indeks) || !ak.ikan[indeks]) return sock.sendMessage(jid, { text: `❌ Nombor tak sah. Rujuk \`.akuarium\` dulu.` }, { quoted: m });

                const ikanJual = ak.ikan[indeks];
                user.wallet += ikanJual.harga;
                ak.ikan.splice(indeks, 1);
                
                savePancingDB();
                await db.saveUser(user);

                return sock.sendMessage(jid, { text: `💸 Awak lepaskan *${ikanJual.nama}* dari akuarium ke pasaran gelap dengan harga *RM ${ikanJual.harga.toLocaleString()}*!` }, { quoted: m });
            }

        } catch (err) {
            console.error("Mancing & Jala Mega Error:", err);
        }
    }
};

export { SAMPAH, IKAN_BIASA, IKAN_RARE, IKAN_MITOS };

