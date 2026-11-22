// Data kedai pancing: harga, kesan, dan level setiap barang.
export const KEDAI_LV = { rod: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, reel: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, umpan: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, jala: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, akuarium: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } };
export const KEDAI = {
    rod: {
        '1': { nama: 'Rod Buluh', harga: 50000, buff_rare: 0.005, ket: '+0.5% Luck' },
        '2': { nama: 'Rod Karbon', harga: 350000, buff_rare: 0.01, ket: '+1% Luck' },
        '3': { nama: 'Rod Fiber Kevlar', harga: 1500000, buff_rare: 0.02, ket: '+2% Luck' },
        '4': { nama: 'Rod Titanium Pro', harga: 5000000, buff_rare: 0.03, ket: '+3% Luck' },
        '5': { nama: 'Rod Naga Emas', harga: 15000000, buff_rare: 0.04, ket: '+4% Luck' },
        '6': { nama: 'Rod Kristal Samudera', harga: 40000000, buff_luck: 0.05, ket: '+5% Luck' },
        '7': { nama: 'Rod Halilintar Laut', harga: 100000000, buff_luck: 0.06, ket: '+6% Luck' },
        '8': { nama: 'Rod Obsidian Abadi', harga: 250000000, buff_luck: 0.07, ket: '+7% Luck' },
        '9': { nama: 'Rod Bintang Kosmos', harga: 600000000, buff_luck: 0.08, ket: '+8% Luck' },
        '10': { nama: 'Rod Waktu Abadi', harga: 1500000000, buff_luck: 0.1, ket: '+10% Luck' }
    },
    reel: {
        '1': { nama: 'Reel Kayu', harga: 100000, buff_saiz: 0.05, ket: '+5% Saiz Ikan' },
        '2': { nama: 'Reel Aluminium', harga: 800000, buff_saiz: 0.1, ket: '+10% Saiz Ikan' },
        '3': { nama: 'Reel Serat Karbon', harga: 2500000, buff_saiz: 0.15, ket: '+15% Saiz Ikan' },
        '4': { nama: 'Reel Dragster V8', harga: 8000000, buff_saiz: 0.2, ket: '+20% Saiz Ikan' },
        '5': { nama: 'Reel Kuantum Apex', harga: 25000000, buff_saiz: 0.3, ket: '+30% Saiz Ikan' },
        '6': { nama: 'Reel Kristal Biru', harga: 60000000, buff_saiz: 0.35, ket: '+35% Saiz Ikan' },
        '7': { nama: 'Reel Halilintar Titan', harga: 150000000, buff_saiz: 0.4, ket: '+40% Saiz Ikan' },
        '8': { nama: 'Reel Obsidian Gerhana', harga: 350000000, buff_saiz: 0.5, ket: '+50% Saiz Ikan' },
        '9': { nama: 'Reel Bintang Kosmos', harga: 800000000, buff_saiz: 0.6, ket: '+60% Saiz Ikan' },
        '10': { nama: 'Reel Abadi Samudera', harga: 2000000000, buff_saiz: 0.75, ket: '+75% Saiz Ikan' }
    },
    umpan: {
        '1': { nama: 'Sisa Roti', harga: 5000, qty: 10, bonus_all: 0, ket: 'Umpan biasa (10x guna)' },
        '2': { nama: 'Cacing Merah', harga: 20000, qty: 10, bonus_all: 0.01, ket: '+1% Luck (10x guna)' },
        '3': { nama: 'Udang Hidup', harga: 80000, qty: 10, bonus_all: 0.03, ket: '+3% Luck (10x guna)' },
        '4': { nama: 'Palet Premium', harga: 250000, qty: 10, bonus_all: 0.05, ket: '+5% Luck (10x guna)' },
        '5': { nama: 'Umpan VIP Berkilau', harga: 800000, qty: 10, bonus_all: 0.1, ket: '+10% Luck (10x guna)' },
        '6': { nama: 'Umpan Ikan Naga', harga: 2000000, qty: 10, bonus_all: 0.12, ket: '+12% Luck (10x guna)' },
        '7': { nama: 'Umpan Kristal Lautan', harga: 5000000, qty: 10, bonus_all: 0.15, ket: '+15% Luck (10x guna)' },
        '8': { nama: 'Umpan Bintang Malam', harga: 12000000, qty: 10, bonus_all: 0.18, ket: '+18% Luck (10x guna)' },
        '9': { nama: 'Umpan Emas Kosmos', harga: 30000000, qty: 10, bonus_all: 0.22, ket: '+22% Luck (10x guna)' },
        '10': { nama: 'Umpan Abadi Samudera', harga: 80000000, qty: 10, bonus_all: 0.25, ket: '+25% Luck (10x guna)' }
    },
    jala: {
        '1': { nama: 'Jala Kain Nilon', harga: 1500000, qty: 3, min_tangkapan: 1, max_tangkapan: 2, ket: 'Sauk 1-2 ekor (Ketahanan: 3)' },
        '2': { nama: 'Jala Berantai Besi', harga: 8000000, qty: 5, min_tangkapan: 2, max_tangkapan: 3, ket: 'Sauk 2-3 ekor (Ketahanan: 5)' },
        '3': { nama: 'Jala Serat Karbon', harga: 30000000, qty: 6, min_tangkapan: 2, max_tangkapan: 4, bonus_rare: 0.01, ket: 'Sauk 2-4 ekor + Luck (Ketahanan: 6)' },
        '4': { nama: 'Jala Mega Trawler', harga: 100000000, qty: 8, min_tangkapan: 3, max_tangkapan: 5, bonus_rare: 0.02, ket: 'Sauk 3-5 ekor + Luck (Ketahanan: 8)' },
        '5': { nama: 'Jala Kuantum Emas', harga: 350000000, qty: 10, min_tangkapan: 4, max_tangkapan: 6, ket: 'Sauk 4-6 ekor (Ketahanan: 10)' },
        '6': { nama: 'Jala Halimunan', harga: 500000000, qty: 12, min_tangkapan: 3, max_tangkapan: 5, bonus_legend: 0.01, ket: 'Sauk 3-5 ekor + Luck (Ketahanan: 12)' },
        '7': { nama: 'Jala Rantai Kosmos', harga: 1200000000, qty: 14, min_tangkapan: 4, max_tangkapan: 7, bonus_legend: 0.02, ket: 'Sauk 4-7 ekor + Luck (Ketahanan: 14)' },
        '8': { nama: 'Jala Pusaran Abadi', harga: 3000000000, qty: 16, min_tangkapan: 5, max_tangkapan: 8, bonus_secret: 0.005, ket: 'Sauk 5-8 ekor + Luck (Ketahanan: 16)' },
        '9': { nama: 'Jala Gerhana', harga: 8000000000, qty: 18, min_tangkapan: 6, max_tangkapan: 9, bonus_secret: 0.01, ket: 'Sauk 6-9 ekor + Luck (Ketahanan: 18)' },
        '10': { nama: 'Jala Samudera Tanpa Hujung', harga: 20000000000, qty: 20, min_tangkapan: 7, max_tangkapan: 10, bonus_secret: 0.02, ket: 'Sauk 7-10 ekor + Luck (Ketahanan: 20)' }
    },
    akuarium: {
        '1': { nama: 'Balang Kaca', harga: 50000, slot: 2, ket: 'Boleh bela 2 Ikan' },
        '2': { nama: 'Akuarium Sederhana', harga: 500000, slot: 4, ket: 'Boleh bela 4 Ikan' },
        '3': { nama: 'Akuarium Premium', harga: 1200000, slot: 6, ket: 'Boleh bela 6 Ikan' },
        '4': { nama: 'Mega Tank Akuatik', harga: 3000000, slot: 8, ket: 'Boleh bela 8 Ikan' },
        '5': { nama: 'Lautan Buatan VVIP', harga: 10000000, slot: 10, ket: 'Boleh bela 10 Ikan' },
        '6': { nama: 'Akuarium Lagun Kristal', harga: 30000000, slot: 12, luck_legend: 0.005, ket: 'Boleh bela 12 Ikan + 0.5% Luck' },
        '7': { nama: 'Akuarium Bulan Gerhana', harga: 80000000, slot: 14, luck_legend: 0.01, ket: 'Boleh bela 14 Ikan + 1% Luck' },
        '8': { nama: 'Akuarium Samudera Api', harga: 200000000, slot: 16, luck_secret: 0.01, ket: 'Boleh bela 16 Ikan + 1% Luck' },
        '9': { nama: 'Akuarium Kosmos Abadi', harga: 500000000, slot: 18, luck_secret: 0.015, ket: 'Boleh bela 18 Ikan + 1.5% Luck' },
        '10': { nama: 'Akuarium Lautan Dewa', harga: 1500000000, slot: 20, luck_secret: 0.02, ket: 'Boleh bela 20 Ikan + 2% Luck' }
    }
};
