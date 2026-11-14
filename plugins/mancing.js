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
const KEDAI = {
    rod: {
        '1': { nama: 'Rod Buluh', harga: 50000, buff_rare: 0.02, ket: '+2% Peluang Ikan Rare' },
        '2': { nama: 'Rod Karbon', harga: 350000, buff_rare: 0.05, ket: '+5% Peluang Ikan Rare' },
        '3': { nama: 'Rod Fiber Kevlar', harga: 1500000, buff_rare: 0.08, ket: '+8% Peluang Ikan Rare' },
        '4': { nama: 'Rod Titanium Pro', harga: 5000000, buff_rare: 0.12, ket: '+12% Peluang Ikan Rare' },
        '5': { nama: 'Rod Naga Emas', harga: 15000000, buff_rare: 0.18, ket: '+18% Peluang Ikan Rare' }
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
        '1': { nama: 'Jala Kain Nilon', harga: 150000, qty: 3, min_tangkapan: 1, max_tangkapan: 2, ket: 'Sauk 1-2 ekor (Ketahanan: 3)' },
        '2': { nama: 'Jala Berantai Besi', harga: 800000, qty: 5, min_tangkapan: 2, max_tangkapan: 3, ket: 'Sauk 2-3 ekor (Ketahanan: 5)' },
        '3': { nama: 'Jala Serat Karbon', harga: 3000000, qty: 6, min_tangkapan: 2, max_tangkapan: 4, bonus_rare: 0.01, ket: 'Sauk 2-4 ekor + Rare (Ketahanan: 6)' },
        '4': { nama: 'Jala Mega Trawler', harga: 10000000, qty: 8, min_tangkapan: 3, max_tangkapan: 5, bonus_rare: 0.02, ket: 'Sauk 3-5 ekor (Ketahanan: 8)' },
        '5': { nama: 'Jala Kuantum Emas', harga: 35000000, qty: 10, min_tangkapan: 4, max_tangkapan: 6, bonus_mitos: 0.002, ket: '+0.2% Sauk Mitos! (Ketahanan: 10)' }
    },
    akuarium: {
        '1': { nama: 'Balang Kaca', harga: 50000, slot: 2, ket: 'Boleh bela 2 Ikan' },
        '2': { nama: 'Akuarium Sederhana', harga: 500000, slot: 4, ket: 'Boleh bela 4 Ikan' },
        '3': { nama: 'Akuarium Premium', harga: 1200000, slot: 6, ket: 'Boleh bela 6 Ikan' },
        '4': { nama: 'Mega Tank Akuatik', harga: 3000000, slot: 8, ket: 'Boleh bela 8 Ikan' },
        '5': { nama: 'Lautan Buatan VVIP', harga: 10000000, slot: 10, ket: 'Boleh bela 10 Ikan' }
    }
};

const SAMPAH = [
    { nama: 'Selipar Jepun Putus 🩴', harga: 10, buff: 'Tiada' }, 
    { nama: 'Tayar Motor Botak 🛞', harga: 15, buff: 'Tiada' },
    { nama: 'Ranting Kayu Reput 🪵', harga: 5, buff: 'Tiada' },
    { nama: 'Tin Milo Kemek 🥫', harga: 2, buff: 'Tiada' },
    { nama: 'Plastik Maggi Kari 🍜', harga: 1, buff: 'Tiada' }
];

const IKAN_BIASA = [
    { nama: 'Ikan Kembung 🐟', harga: 400, buff: 'Tiada' }, { nama: 'Ikan Selar 🐟', harga: 450, buff: 'Tiada' },
    { nama: 'Sotong Katak 🦑', harga: 600, buff: 'Tiada' }, { nama: 'Ketam Nipah 🦀', harga: 1250, buff: 'Tiada' },
    { nama: 'Ikan Merah 🐠', harga: 650, buff: 'Tiada' }, { nama: 'Ikan Pari 🐡', harga: 680, buff: 'Tiada' },
    { nama: 'Siakap Laut 🐟', harga: 750, buff: 'Tiada' }, { nama: 'Kerapu Batu 🐠', harga: 1000, buff: 'Tiada' },
    { nama: 'Ikan Sardin 🐟', harga: 250, buff: 'Tiada' }, { nama: 'Ikan Bilis 🐟', harga: 100, buff: 'Tiada' },
    { nama: 'Ikan Cencaru 🐟', harga: 550, buff: 'Tiada' }, { nama: 'Ikan Pelaling 🐟', harga: 480, buff: 'Tiada' },
    { nama: 'Ikan Talapia 🐟', harga: 350, buff: 'Tiada' }, { nama: 'Keli Afrika 🐟', harga: 300, buff: 'Tiada' },
    { nama: 'Ikan Patin 🐟', harga: 900, buff: 'Tiada' }, { nama: 'Ikan Gelama 🐟', harga: 420, buff: 'Tiada' },
    { nama: 'Ikan Kerisi 🐟', harga: 580, buff: 'Tiada' }, { nama: 'Ikan Selayang 🐟', harga: 380, buff: 'Tiada' },
    { nama: 'Ikan Tenggiri 🐟', harga: 1200, buff: 'Tiada' }, { nama: 'Ikan Tongkol 🐟', harga: 800, buff: 'Tiada' },
    { nama: 'Ikan Jenahak 🐟', harga: 1400, buff: 'Tiada' }, { nama: 'Bawal Putih 🐟', harga: 1500, buff: 'Tiada' },
    { nama: 'Bawal Hitam 🐟', harga: 1050, buff: 'Tiada' }, { nama: 'Ikan Senangin 🐟', harga: 1150, buff: 'Tiada' },
    { nama: 'Ikan Belanak 🐟', harga: 700, buff: 'Tiada' }, { nama: 'Ikan Kedera 🐟', harga: 620, buff: 'Tiada' },
    { nama: 'Ikan Puyu 🐟', harga: 200, buff: 'Tiada' }, { nama: 'Ikan Sepat 🐟', harga: 180, buff: 'Tiada' },
    { nama: 'Ikan Haruan 🐟', harga: 780, buff: 'Tiada' }, { nama: 'Ikan Toman 🐟', harga: 1450, buff: 'Tiada' },
    { nama: 'Ikan Bawal Emas 🐟', harga: 1750, buff: 'Tiada' }, { nama: 'Ikan Kerapu Sunoh 🐠', harga: 1250, buff: 'Tiada' },
    { nama: 'Ikan Tenggiri Papan 🐟', harga: 1300, buff: 'Tiada' }, { nama: 'Ikan Selar Kuning 🐟', harga: 420, buff: 'Tiada' },
    { nama: 'Ikan Tamban 🐟', harga: 150, buff: 'Tiada' }, { nama: 'Ikan Kekek 🐟', harga: 220, buff: 'Tiada' },
    { nama: 'Ikan Kitang 🐠', harga: 450, buff: 'Tiada' }, { nama: 'Ikan Gelama Bongkok 🐟', harga: 550, buff: 'Tiada' },
    { nama: 'Ikan Ubi 🐟', harga: 320, buff: 'Tiada' }, { nama: 'Ikan Ketuka 🐡', harga: 400, buff: 'Tiada' },
    { nama: 'Ikan Duri 🐡', harga: 380, buff: 'Tiada' }, { nama: 'Ikan Belukang 🐟', harga: 300, buff: 'Tiada' },
    { nama: 'Ikan Sembilang 🐟', harga: 700, buff: 'Tiada' }, { nama: 'Ikan Lundu 🐟', harga: 280, buff: 'Tiada' },
    { nama: 'Ikan Bulan 🐟', harga: 600, buff: 'Tiada' }, { nama: 'Ikan Terubok 🐟', harga: 1600, buff: 'Tiada' },
    { nama: 'Ikan Kawan 🐟', harga: 480, buff: 'Tiada' }, { nama: 'Ikan Tirusan 🐟', harga: 900, buff: 'Tiada' },
    { nama: 'Ikan Merah Pucat 🐠', harga: 750, buff: 'Tiada' }, { nama: 'Ikan Kachi 🐠', harga: 650, buff: 'Tiada' },
    { nama: 'Ikan Jemuduk 🐟', harga: 1350, buff: 'Tiada' }, { nama: 'Ikan Aruan Tasik 🐟', harga: 1100, buff: 'Tiada' },
    { nama: 'Ikan Todak Biasa 🗡️', harga: 950, buff: 'Tiada' }, { nama: 'Siput Sedut 🐚', harga: 200, buff: 'Tiada' },
    { nama: 'Kupang Laut 🦪', harga: 180, buff: 'Tiada' },
    { nama: 'Tenggiri Batang 🐟', harga: 900, buff: 'Tiada' }, 
    { nama: 'Jenahak 🐠', harga: 1300, buff: 'Tiada' }, { nama: 'Gelama 🐟', harga: 350, buff: 'Tiada' },
    { nama: 'Pari Kebo 🐡', harga: 1450, buff: 'Tiada' }, { nama: 'Sebelah 🐟', harga: 500, buff: 'Tiada' },
    { nama: 'Tamban 🐟', harga: 220, buff: 'Tiada' }, { nama: 'Lomek 🐟', harga: 280, buff: 'Tiada' },
    { nama: 'Duri Seligi 🐠', harga: 700, buff: 'Tiada' }, { nama: 'Parang-parang 🐟', harga: 600, buff: 'Tiada' },
    { nama: 'Kerisi 🐟', harga: 800, buff: 'Tiada' }, { nama: 'Belanak 🐟', harga: 450, buff: 'Tiada' },
    { nama: 'Tilapia Sungai 🐟', harga: 300, buff: 'Tiada' }, { nama: 'Sotong Gurita Kecil 🦑', harga: 950, buff: 'Tiada' },
    { nama: 'Udang Harimau 🦐', harga: 1350, buff: 'Tiada' },
];

const IKAN_RARE = [
    { nama: 'Lobster Biru 🦞', harga: 19500, buff: '+2% Lulus Jenayah' }, { nama: 'Pari Hantu 🦇', harga: 16250, buff: 'Tiada' },
    { nama: 'Ikan Buntal Beracun 🐡', harga: 14300, buff: 'Tiada' }, { nama: 'Kerapu Harimau 🐅', harga: 20800, buff: 'Tiada' },
    { nama: 'Sotong Kurita Gergasi 🐙', harga: 36400, buff: '+RM1,000 Gaji Kerja' }, { nama: 'Ikan Layaran 🗡️', harga: 22750, buff: 'Tiada' },
    { nama: 'Kerapu Bara 🌋', harga: 23400, buff: 'Tiada' }, { nama: 'Kelah Merah 🐟', harga: 52000, buff: '+RM1,500 Gaji' },
    { nama: 'Ikan Empurau 👑', harga: 45500, buff: '+RM2,500 Gaji Kerja' }, { nama: 'Ketam Raja Alaska 🦀', harga: 27300, buff: 'Tiada' },
    { nama: 'Ikan Pedang 🗡️', harga: 25350, buff: 'Tiada' }, { nama: 'Barakuda Ganas 🦈', harga: 28600, buff: 'Tiada' },
    { nama: 'Ikan Duri Bisa 🐡', harga: 13650, buff: 'Tiada' }, { nama: 'Ikan Sumpit 💦', harga: 16900, buff: 'Tiada' },
    { nama: 'Pari Karang Berdarah 🦇', harga: 32500, buff: '+5% Lulus Jenayah' },
    { nama: 'Kerapu Naga 🐉', harga: 32500, buff: '+RM1,000 Gaji' }, { nama: 'Ikan Tapah Raksasa 🐟', harga: 41600, buff: '+3% Lulus Jenayah' },
    { nama: 'Kura-Kura Emas 🐢', harga: 58500, buff: '-5% Peluang Kantoi' }, { nama: 'Belut Elektrik Hitam ⚡', harga: 24050, buff: 'Tiada' },
    { nama: 'Pari Bintang ✨', harga: 25350, buff: 'Tiada' }, { nama: 'Ketam Batu Berlumut 🦀', harga: 18200, buff: 'Tiada' },
    { nama: 'Tenggiri Biru 🐟', harga: 21450, buff: 'Tiada' }, { nama: 'Sotong Vampir 🦑', harga: 49400, buff: '+4% Lulus Jenayah' },
    { nama: 'Ikan Gergaji 🪚', harga: 37700, buff: '+RM1,500 Gaji' }, { nama: 'Kuda Laut Mahkota 👑', harga: 53300, buff: '+RM2,000 Gaji' },
    { nama: 'Ikan Kaloi Gergasi 🐠', harga: 19500, buff: 'Tiada' }, { nama: 'Udang Galah Raja 🦐', harga: 22100, buff: 'Tiada' },
    { nama: 'Ikan Sebelah Mata 👁️', harga: 15600, buff: 'Tiada' }, { nama: 'Ikan Terbang Berkaca 🪽', harga: 29900, buff: 'Tiada' },
    { nama: 'Terumbu Karang Hidup 🪸', harga: 65000, buff: '+RM3,000 Gaji' },
    { nama: 'Gerutu Emas 🐟', harga: 12000, buff: 'Tiada' }, { nama: 'Kerapu Harimau 🐠', harga: 18500, buff: 'Tiada' },
    { nama: 'Ikan Tembakul Ratu 🐡', harga: 9800, buff: 'Tiada' }, { nama: 'Pari Bunga Lotus 🐡', harga: 22000, buff: 'Tiada' },
    { nama: 'Ikan Kelah Gergasi 🐟', harga: 15500, buff: 'Tiada' }, { nama: 'Sotong Naga 🦑', harga: 27000, buff: 'Tiada' },
];

const IKAN_MITOS = [
    { nama: 'Jerung Putih Besar 🦈', harga: 120000, buff: '+15% Lulus Jenayah' }, { nama: 'Ikan Paus Biru 🐋', harga: 195000, buff: '+18% Lulus Jenayah' },
    { nama: 'Megalodon Purba 🦖', harga: 150000, buff: '+30% Lulus Jenayah' }, { nama: 'Naga Laut Raksasa 🐉', harga: 240000, buff: '+RM30,000 Gaji Kerja' },
    { nama: 'Kraken Emas 🦑', harga: 225000, buff: '+25% Lulus Jenayah' }, { nama: 'Leviathan Penjaga Arus 🐲', harga: 300000, buff: '+RM50,000 Gaji Kerja' },
    { nama: 'Penyu Gergasi Purba 🐢', harga: 105000, buff: '-10% Peluang Kantoi' }, { nama: 'Duyung Sesat 🧜‍♀️', harga: 135000, buff: '+RM20,000 Gaji Kerja' },
    { nama: 'Ikan Emas Lagenda 🐠', harga: 180000, buff: '+20% Lulus Jenayah & Curi' }, { nama: 'Jerung Megamulut 🦈', harga: 165000, buff: '+RM25,000 Gaji Kerja' },
    { nama: 'Paus Orca Bintang 🐋', harga: 255000, buff: '+RM35,000 Gaji' }, { nama: 'Ikan Purba Coelacanth 🐟', harga: 195000, buff: '+25% Lulus Jenayah' },
    { nama: 'Cumi-Cumi Kosmik 🦑', harga: 270000, buff: '+RM40,000 Gaji' }, { nama: 'Pari Manta Nilam 🦇', harga: 210000, buff: '+35% Lulus Jenayah' },
    { nama: 'Penyu Belimbing Berlian 🐢', harga: 360000, buff: '-20% Peluang Kantoi' }, { nama: 'Jerung Tukul Besi 🦈', harga: 165000, buff: '+22% Lulus Jenayah' },
    { nama: 'Ular Laut Obsidian 🐍', harga: 180000, buff: '+RM28,000 Gaji' }, { nama: 'Ikan Duyung Hitam 🧜‍♀️', harga: 450000, buff: '+RM60,000 Gaji' },
    { nama: 'Tapak Sulaiman Magma 🌋', harga: 135000, buff: '+18% Lulus Jenayah' }, { nama: 'Raja Ketam Atlantis 🦀', harga: 330000, buff: '+RM45,000 Gaji' },
    { nama: 'Naga Laut Bersisik Emas 🐉', harga: 180000, buff: 'Tiada' }, { nama: 'Gurita Bulan Purnama 🐙', harga: 240000, buff: 'Tiada' },
    { nama: 'Penyu Purba Mata Ruby 🐢', harga: 95000, buff: 'Tiada' }, { nama: 'Ikan Tuah Kaca Dewa 🐟', harga: 300000, buff: 'Tiada' },
];

export default {
    name: 'mancing',
    alias: ['ikan', 'akuarium', 'bela_ikan', 'jual_ikan', 'jual_akuarium', 'kedai_pancing', 'beli_pancing', 'jala'],
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
                const susunKatalog = (title, category) => {
                    let text = `*📍 ${title}*\n`;
                    for (const [id, item] of Object.entries(KEDAI[category])) {
                        text += `${id}. ${item.nama} (RM ${item.harga.toLocaleString()})\n   └ ${item.ket}\n`;
                    }
                    return text + '\n';
                };

                ui += susunKatalog('ROD (Tarik Ikan Rare)', 'rod');
                ui += susunKatalog('REEL (Tarik Ikan Mitos)', 'reel');
                ui += susunKatalog('UMPAN (Peluang Joran)', 'umpan');
                ui += susunKatalog('JALA (Tangkapan Pukal Massal)', 'jala');
                ui += susunKatalog('AKUARIUM (Slot Buff)', 'akuarium');
                
                ui += `🛒 *Cara Beli:* \`.beli_pancing [kategori] [nombor]\`\nContoh: \`.beli_pancing jala 1\``;
                return sock.sendMessage(jid, { text: ui }, { quoted: m });
            }

            if (cmd === 'beli_pancing') {
                const kategori = args[0]?.toLowerCase();
                const id = args[1];
                if (!['rod', 'reel', 'umpan', 'jala', 'akuarium'].includes(kategori) || !id) return sock.sendMessage(jid, { text: `❌ Format: \`.beli_pancing [rod/reel/umpan/jala/akuarium] [nombor]\`` }, { quoted: m });
                
                const item = KEDAI[kategori][id];
                if (!item) return sock.sendMessage(jid, { text: `❌ Kod nombor tak wujud dalam kedai.` }, { quoted: m });
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
                const ev = activeEvent(), tide = ev?.code === 'MYTHIC_TIDE' ? 0.03 : 0, frenzy = ev?.code === 'MEGA_HARVEST' ? 0.45 : 0;
                if (rng < (0.0005 + tide + (pData.reel.buff_mitos || 0) + (pData.umpan.bonus_all || 0))) { rarity = 'mitos'; ikanDapat = pilih(IKAN_MITOS); }
                else if (rng < (0.0105 + frenzy + (pData.rod.buff_rare || 0) + (pData.umpan.bonus_all || 0))) { rarity = 'rare'; ikanDapat = pilih(IKAN_RARE); }
                else if (rng < 0.60) { rarity = 'biasa'; ikanDapat = pilih(IKAN_BIASA); }
                else { rarity = 'sampah'; ikanDapat = pilih(SAMPAH); }

                ikanDapat = { ...ikanDapat, rarity };
                (pData.dex ||= {})[ikanDapat.nama] = true;
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
                
                let displayBuff = ikanDapat.buff !== 'Tiada' ? `\n⚡ Buff: ${ikanDapat.buff}` : '';

const caption = `🎣 *TANGKAPAN JORAN*\n\n🐟 *${ikanDapat.nama}*\n💵 Nilai: RM ${ikanDapat.harga.toLocaleString()}${displayBuff}\n\n🎣 Sisa Umpan (${pData.umpan.nama || 'Tiada'}): ${pData.umpan.qty}x`;
                try {
                    const img = renderCatchCard({ nama: ikanDapat.nama, rarity, harga: ikanDapat.harga, buff: ikanDapat.buff, owner: user?.name || 'Warga Gelap' });
                    const tag = rarity === 'mitos' ? `🚨🚨 *BERITA UTAMA!* @${senderId.split('@')[0]} tangkap *${ikanDapat.nama}*! 🚨🚨\n\n` : '';
                    return sock.sendMessage(jid, { image: img, caption: tag + caption, mentions: rarity === 'mitos' ? [senderId] : [] }, { quoted: m });
                } catch (e) {
                    console.error('[CARD ERROR]', e.message);
                }
                return sock.sendMessage(jid, { text: caption }, { quoted: m });
            }

            if (cmd === 'jala') {
                const now = Date.now();
                // Cooldown jala Hardcore: 3 Minit (180,000 ms)
                if (now - (cdMancing.get(senderId + '_jala') || 0) < 600000) {
                    return sock.sendMessage(jid, { text: `⏳ Jala sedang dikeringkan! Tunggu ${Math.ceil((600000 - (now - (cdMancing.get(senderId + '_jala') || 0))) / 1000)} saat lagi.` }, { quoted: m });
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
                    let tangkapan = rngJala < (0.0005 + (pData.jala.bonus_mitos || 0)) ? IKAN_MITOS[Math.floor(Math.random() * IKAN_MITOS.length)] :
                                    rngJala < (0.0105 + (pData.jala.bonus_rare || 0)) ? IKAN_RARE[Math.floor(Math.random() * IKAN_RARE.length)] :
                                    rngJala < 0.60 ? IKAN_BIASA[Math.floor(Math.random() * IKAN_BIASA.length)] : SAMPAH[Math.floor(Math.random() * SAMPAH.length)];

                    const rarJala = IKAN_MITOS.includes(tangkapan) ? 'mitos' : IKAN_RARE.includes(tangkapan) ? 'rare' : SAMPAH.includes(tangkapan) ? 'sampah' : 'biasa';
                    tangkapan = { ...tangkapan, rarity: rarJala };
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
                let ui = `╔═════════════════════════════╗\n    🌊 ${ak.nama.toUpperCase()} [${ak.ikan.length}/${ak.slot}]\n╠═════════════════════════════╣\n`;
                if (ak.ikan.length === 0) ui += `║ 🪹 Air kosong je...\n`;
                ak.ikan.forEach((i, idx) => ui += `║ ${idx + 1}. ${i.nama}\n║ ⚡ ${i.buff}\n`);
                ui += `╚═════════════════════════════╝\n💡 Nak jual ikan berharga? Taip \`.jual_akuarium [no]\``;
                return sock.sendMessage(jid, { text: ui }, { quoted: m });
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

                return sock.sendMessage(jid, { text: `🌊 Awak masukkan *${ikanPilihan.nama}* ke dalam ${ak.nama}.\n🔥 Buff diaktifkan!` }, { quoted: m });
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
