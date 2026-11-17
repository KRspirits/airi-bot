import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR_MAGNET = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'magnet');
// =========================================================================
// 🧲 ITEM MAGNET: 100 item dalam 4 tier (25 setiap tier), 6 jenis.
// Harga setiap tier sentiasa lebih rendah daripada ikan tier yang sama:
//   Biasa  RM20 - RM800       (ikan biasa bermula RM1,000)
//   Rare   RM900 - RM30,000   (ikan rare bermula RM100,000)
//   Epik   RM31,000 - RM90,000 (ikan rare/epik ke atas)
//   Mitos  RM95,000 - RM900,000 (ikan mitos bermula RM1 juta)
// =========================================================================

const DATA = {
    Biasa: [
        ['Cermin Mata Retak', 'Harian'], ['Jam Tangan Kuno', 'Harian'], ['Payung Patah', 'Harian'],
        ['Kipas Angin Lama', 'Elektronik'], ['Radio Transistor', 'Elektronik'], ['Telefon Bimbit Lama', 'Elektronik'],
        ['Kamera Filem', 'Elektronik'], ['Setor Elektrik Kecil', 'Elektronik'], ['Stereo Kereta Lama', 'Kenderaan'],
        ['Rim Basikal', 'Kenderaan'], ['Helmet Motor Lusuh', 'Kenderaan'], ['Kunci Inggeris', 'Alat'],
        ['Gergaji Tangan', 'Alat'], ['Mangga Berkarat', 'Alat'], ['Pemetik Api Lama', 'Harian'],
        ['Kotak Muzik', 'Seni'], ['Botol Minyak Wangi', 'Harian'], ['Bingkai Gambar', 'Seni'],
        ['Pisau Lipat', 'Alat'], ['Lampu Suluh', 'Alat'], ['Buku Resipi Lusuh', 'Harian'],
        ['Topi Kelab Bola', 'Harian'], ['Bola Sepak Kempis', 'Harian'], ['Kad Permainan Lama', 'Harian'],
        ['Anak Patung Kain', 'Harian'],
    ],
    Rare: [
        ['Gitar Akustik', 'Muzik'], ['Kamera DSLR', 'Elektronik'], ['Telefon Pintar Kedua', 'Elektronik'],
        ['Konsol Permainan Lama', 'Elektronik'], ['Jam Tangan Automatik', 'Perhiasan'], ['Kacamata Jenama', 'Fesyen'],
        ['Beg Tangan Kulit', 'Fesyen'], ['Kasut Lari Edisi Terhad', 'Fesyen'], ['Set Pancing Jenama', 'Sukan'],
        ['Raket Badminton Pro', 'Sukan'], ['Skuter Elektrik', 'Kenderaan'], ['Basikal Gunung', 'Kenderaan'],
        ['Enjin Motosikal', 'Kenderaan'], ['Set Tayar Sport', 'Kenderaan'], ['Lukisan Cat Minyak Kecil', 'Seni'],
        ['Patung Kayu Ukiran', 'Seni'], ['Kotak Ukiran Kayu', 'Seni'], ['Peti Wain Antik', 'Antik'],
        ['Pinggan Porselin Lama', 'Antik'], ['Vas Seramik', 'Antik'], ['Cermin Solek Antik', 'Antik'],
        ['Mesin Jahit Lama', 'Antik'], ['Gramofon Lama', 'Antik'], ['Set Perkakas Kayu', 'Alat'],
        ['Mesin Gerudi Kuasa', 'Alat'],
    ],
    Epik: [
        ['Jam Tangan Mewah', 'Perhiasan'], ['Cincin Emas 916', 'Perhiasan'], ['Rantai Emas Berat', 'Perhiasan'],
        ['Anting Berlian Kecil', 'Perhiasan'], ['Lampu Antik Kristal', 'Antik'], ['Patung Gangsa Lama', 'Antik'],
        ['Pedang Perak Antik', 'Antik'], ['Topeng Emas Tiruan', 'Antik'], ['Lukisan Potret Asli', 'Seni'],
        ['Gitar Elektrik Vintage', 'Muzik'], ['Saksofon Perak', 'Muzik'], ['Piano Kecil', 'Muzik'],
        ['Laptop Gaming', 'Elektronik'], ['Drone Berkamera', 'Elektronik'], ['Kamera Sinematik', 'Elektronik'],
        ['Motosikal Litar', 'Kenderaan'], ['Motosikal Sport 250cc', 'Kenderaan'], ['Set Tayar Rim Aloi', 'Kenderaan'],
        ['Jet Ski Mini', 'Kenderaan'], ['Perahu Layar Kecil', 'Kenderaan'], ['Beg Jenama Mewah', 'Fesyen'],
        ['Kot Kulit Jenama', 'Fesyen'], ['Set Pancing Premium', 'Sukan'], ['Peralatan Selam Lengkap', 'Sukan'],
        ['Jam Dinding Gergasi Antik', 'Antik'],
    ],
    Mitos: [
        ['Peti Harta Karun Terkunci', 'Harta'], ['Mahkota Perak Diraja', 'Harta'], ['Piala Emas Lagenda', 'Harta'],
        ['Kitab Mantera Lama', 'Lagenda'], ['Batu Permata Biru', 'Lagenda'], ['Batu Permata Merah', 'Lagenda'],
        ['Telur Naga Kecil', 'Lagenda'], ['Serpihan Kapal Lanun', 'Lagenda'], ['Kompas Kapten Lanun', 'Lagenda'],
        ['Peta Harta Karun Asli', 'Lagenda'], ['Topeng Gangsa Purba', 'Lagenda'], ['Patung Ganesha Emas', 'Lagenda'],
        ['Mutiara Laut Dalam', 'Lagenda'], ['Keris Pusaka Berukir', 'Lagenda'], ['Pedang Cahaya Gangsa', 'Lagenda'],
        ['Tongkat Penyihir Kayu', 'Lagenda'], ['Jubah Sutera Diraja', 'Harta'], ['Kristal Tenaga Biru', 'Lagenda'],
        ['Kristal Tenaga Ungu', 'Lagenda'], ['Amulet Naga Emas', 'Lagenda'], ['Bingkai Phoenix Emas', 'Seni'],
        ['Lukisan Lama Tak Dikenali', 'Seni'], ['Gelang Permata Diraja', 'Perhiasan'], ['Sarung Keris Emas', 'Lagenda'],
        ['Tabung Emas Kuno', 'Harta'],
    ],
};
const JULAT = { Biasa: [20, 800], Rare: [900, 30000], Epik: [31000, 90000], Mitos: [95000, 900000] };

export const MAGNET_ITEMS = [];
for (const tier of ['Biasa', 'Rare', 'Epik', 'Mitos']) {
    const senarai = DATA[tier];
    const [lo, hi] = JULAT[tier];
    senarai.forEach(([nama, jenis], i) => {
        const harga = Math.round(lo + (hi - lo) * (i / (senarai.length - 1)));
        MAGNET_ITEMS.push({ id: `${tier[0]}${String(i + 1).padStart(2, '0')}`, nama, tier, jenis, harga });
    });
}

// Peluang tier ikut tahap magnet (1 hingga 5). Tahap tinggi tambah peluang Rare/Epik/Mitos.
const PERATUS = { Biasa: 70, Rare: 22, Epik: 7, Mitos: 1 };
const TAMBAH = { Rare: 2, Epik: 1.2, Mitos: 0.5 }; // setiap tahap di atas 1
export function undiItem(tahapMagnet) {
    const naik = Math.max(0, (tahapMagnet || 1) - 1);
    const w = {
        Biasa: PERATUS.Biasa - naik * (TAMBAH.Rare + TAMBAH.Epik + TAMBAH.Mitos),
        Rare: PERATUS.Rare + naik * TAMBAH.Rare,
        Epik: PERATUS.Epik + naik * TAMBAH.Epik,
        Mitos: PERATUS.Mitos + naik * TAMBAH.Mitos,
    };
    const jumlah = w.Biasa + w.Rare + w.Epik + w.Mitos;
    let r = Math.random() * jumlah, tier = 'Biasa';
    for (const t of ['Biasa', 'Rare', 'Epik', 'Mitos']) { r -= w[t]; if (r < 0) { tier = t; break; } }
    const pool = MAGNET_ITEMS.filter(it => it.tier === tier);
    return pool[Math.floor(Math.random() * pool.length)];
}

/** Gambar item (Buffer) atau null kalau fail belum ada. */
export function gambarItem(item) {
    const f = path.join(DIR_MAGNET, `${item.id}.png`);
    return fs.existsSync(f) ? fs.readFileSync(f) : null;
}
