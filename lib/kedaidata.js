// Data kedai pancing: harga, kesan, dan level setiap barang.
export const KEDAI_LV = { rod: { 1: 4, 2: 7, 3: 10, 4: 13, 5: 16 }, reel: { 1: 5, 2: 8, 3: 11, 4: 14, 5: 17 }, umpan: { 1: 1, 2: 3, 3: 5, 4: 7, 5: 9 }, jala: { 1: 8, 2: 11, 3: 14, 4: 17, 5: 20 }, akuarium: { 1: 1, 2: 4, 3: 7, 4: 10, 5: 13 } };
export const KEDAI = {
    rod: {
        '1': { nama: 'Rod Buluh', harga: 50000, buff_rare: 0.005, ket: '+0.5% Peluang Ikan Rare' },
        '2': { nama: 'Rod Karbon', harga: 350000, buff_rare: 0.01, ket: '+1% Peluang Ikan Rare' },
        '3': { nama: 'Rod Fiber Kevlar', harga: 1500000, buff_rare: 0.02, ket: '+2% Peluang Ikan Rare' },
        '4': { nama: 'Rod Titanium Pro', harga: 5000000, buff_rare: 0.03, ket: '+3% Peluang Ikan Rare' },
        '5': { nama: 'Rod Naga Emas', harga: 15000000, buff_rare: 0.04, ket: '+4% Peluang Ikan Rare' }
    },
    reel: {
        '1': { nama: 'Reel Kayu', harga: 100000, buff_mitos: 0.002, ket: '+0.2% Peluang Mitos' },
        '2': { nama: 'Reel Aluminium', harga: 800000, buff_mitos: 0.005, ket: '+0.5% Peluang Mitos' },
        '3': { nama: 'Reel Serat Karbon', harga: 2500000, buff_mitos: 0.010, ket: '+1.0% Peluang Mitos' },
        '4': { nama: 'Reel Dragster V8', harga: 8000000, buff_mitos: 0.020, ket: '+2.0% Peluang Mitos' },
        '5': { nama: 'Reel Kuantum Apex', harga: 25000000, buff_mitos: 0.035, ket: '+3.5% Peluang Mitos' }
    },
    umpan: {
        '1': { nama: 'Sisa Roti', harga: 5000, qty: 10, bonus_all: 0, ket: 'Umpan biasa (10x guna)' },
        '2': { nama: 'Cacing Merah', harga: 20000, qty: 10, bonus_all: 0.01, ket: '+1% Tarik Ikan (10x guna)' },
        '3': { nama: 'Udang Hidup', harga: 80000, qty: 10, bonus_all: 0.03, ket: '+3% Tarik Ikan (10x guna)' },
        '4': { nama: 'Palet Premium', harga: 250000, qty: 10, bonus_all: 0.05, ket: '+5% Tarik Ikan (10x guna)' },
        '5': { nama: 'Umpan VIP Berkilau', harga: 800000, qty: 10, bonus_all: 0.10, ket: '+10% Tarik Ikan (10x guna)' }
    },
    jala: {
        '1': { nama: 'Jala Kain Nilon', harga: 1500000, qty: 3, min_tangkapan: 1, max_tangkapan: 2, ket: 'Sauk 1-2 ekor (Ketahanan: 3)' },
        '2': { nama: 'Jala Berantai Besi', harga: 8000000, qty: 5, min_tangkapan: 2, max_tangkapan: 3, ket: 'Sauk 2-3 ekor (Ketahanan: 5)' },
        '3': { nama: 'Jala Serat Karbon', harga: 30000000, qty: 6, min_tangkapan: 2, max_tangkapan: 4, bonus_rare: 0.01, ket: 'Sauk 2-4 ekor + Rare (Ketahanan: 6)' },
        '4': { nama: 'Jala Mega Trawler', harga: 100000000, qty: 8, min_tangkapan: 3, max_tangkapan: 5, bonus_rare: 0.02, ket: 'Sauk 3-5 ekor (Ketahanan: 8)' },
        '5': { nama: 'Jala Kuantum Emas', harga: 350000000, qty: 10, min_tangkapan: 4, max_tangkapan: 6, bonus_mitos: 0.002, ket: '+0.2% Sauk Mitos! (Ketahanan: 10)' }
    },
    akuarium: {
        '1': { nama: 'Balang Kaca', harga: 50000, slot: 2, ket: 'Boleh bela 2 Ikan' },
        '2': { nama: 'Akuarium Sederhana', harga: 500000, slot: 4, ket: 'Boleh bela 4 Ikan' },
        '3': { nama: 'Akuarium Premium', harga: 1200000, slot: 6, ket: 'Boleh bela 6 Ikan' },
        '4': { nama: 'Mega Tank Akuatik', harga: 3000000, slot: 8, ket: 'Boleh bela 8 Ikan' },
        '5': { nama: 'Lautan Buatan VVIP', harga: 10000000, slot: 10, ket: 'Boleh bela 10 Ikan' }
    }
};
