import fs from 'fs';
import path from 'path';

// --- DATABASE LOKAL KHAS UNTUK PANCING ---
const dbPath = path.resolve('./database_pancing.json');
let pancingDB = {};

try {
    if (fs.existsSync(dbPath)) {
        pancingDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
} catch (err) {
    console.error("Gagal membaca database_pancing.json", err);
    pancingDB = {};
}

function savePancingDB() {
    fs.writeFileSync(dbPath, JSON.stringify(pancingDB, null, 2));
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
        '1': { nama: 'Jala Kain Nilon', harga: 150000, qty: 3, min_tangkapan: 2, max_tangkapan: 4, ket: 'Sauk 2-4 ekor (Ketahanan: 3)' },
        '2': { nama: 'Jala Berantai Besi', harga: 800000, qty: 5, min_tangkapan: 3, max_tangkapan: 5, ket: 'Sauk 3-5 ekor (Ketahanan: 5)' },
        '3': { nama: 'Jala Serat Karbon', harga: 3000000, qty: 6, min_tangkapan: 4, max_tangkapan: 7, bonus_rare: 0.03, ket: 'Sauk 4-7 ekor + Rare (Ketahanan: 6)' },
        '4': { nama: 'Jala Mega Trawler', harga: 10000000, qty: 8, min_tangkapan: 5, max_tangkapan: 9, bonus_rare: 0.06, ket: 'Sauk 5-9 ekor (Ketahanan: 8)' },
        '5': { nama: 'Jala Kuantum Emas', harga: 35000000, qty: 10, min_tangkapan: 6, max_tangkapan: 12, bonus_mitos: 0.01, ket: '+1% Sauk Mitos! (Ketahanan: 10)' }
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
    { nama: 'Ikan Kembung 🐟', harga: 800, buff: 'Tiada' }, { nama: 'Ikan Selar 🐟', harga: 900, buff: 'Tiada' },
    { nama: 'Sotong Katak 🦑', harga: 1200, buff: 'Tiada' }, { nama: 'Ketam Nipah 🦀', harga: 2500, buff: 'Tiada' },
    { nama: 'Ikan Merah 🐠', harga: 1300, buff: 'Tiada' }, { nama: 'Ikan Pari 🐡', harga: 1350, buff: 'Tiada' },
    { nama: 'Siakap Laut 🐟', harga: 1500, buff: 'Tiada' }, { nama: 'Kerapu Batu 🐠', harga: 2000, buff: 'Tiada' },
    { nama: 'Ikan Sardin 🐟', harga: 500, buff: 'Tiada' }, { nama: 'Ikan Bilis 🐟', harga: 200, buff: 'Tiada' },
    { nama: 'Ikan Cencaru 🐟', harga: 1100, buff: 'Tiada' }, { nama: 'Ikan Pelaling 🐟', harga: 950, buff: 'Tiada' },
    { nama: 'Ikan Talapia 🐟', harga: 700, buff: 'Tiada' }, { nama: 'Keli Afrika 🐟', harga: 600, buff: 'Tiada' },
    { nama: 'Ikan Patin 🐟', harga: 1800, buff: 'Tiada' }, { nama: 'Ikan Gelama 🐟', harga: 850, buff: 'Tiada' },
    { nama: 'Ikan Kerisi 🐟', harga: 1150, buff: 'Tiada' }, { nama: 'Ikan Selayang 🐟', harga: 750, buff: 'Tiada' },
    { nama: 'Ikan Tenggiri 🐟', harga: 2400, buff: 'Tiada' }, { nama: 'Ikan Tongkol 🐟', harga: 1600, buff: 'Tiada' },
    { nama: 'Ikan Jenahak 🐟', harga: 2800, buff: 'Tiada' }, { nama: 'Bawal Putih 🐟', harga: 3000, buff: 'Tiada' },
    { nama: 'Bawal Hitam 🐟', harga: 2100, buff: 'Tiada' }, { nama: 'Ikan Senangin 🐟', harga: 2300, buff: 'Tiada' },
    { nama: 'Ikan Belanak 🐟', harga: 1400, buff: 'Tiada' }, { nama: 'Ikan Kedera 🐟', harga: 1250, buff: 'Tiada' },
    { nama: 'Ikan Puyu 🐟', harga: 400, buff: 'Tiada' }, { nama: 'Ikan Sepat 🐟', harga: 350, buff: 'Tiada' },
    { nama: 'Ikan Haruan 🐟', harga: 1550, buff: 'Tiada' }, { nama: 'Ikan Toman 🐟', harga: 2900, buff: 'Tiada' },
    { nama: 'Ikan Bawal Emas 🐟', harga: 3500, buff: 'Tiada' }, { nama: 'Ikan Kerapu Sunoh 🐠', harga: 2500, buff: 'Tiada' },
    { nama: 'Ikan Tenggiri Papan 🐟', harga: 2600, buff: 'Tiada' }, { nama: 'Ikan Selar Kuning 🐟', harga: 850, buff: 'Tiada' },
    { nama: 'Ikan Tamban 🐟', harga: 300, buff: 'Tiada' }, { nama: 'Ikan Kekek 🐟', harga: 450, buff: 'Tiada' },
    { nama: 'Ikan Kitang 🐠', harga: 900, buff: 'Tiada' }, { nama: 'Ikan Gelama Bongkok 🐟', harga: 1100, buff: 'Tiada' },
    { nama: 'Ikan Ubi 🐟', harga: 650, buff: 'Tiada' }, { nama: 'Ikan Ketuka 🐡', harga: 800, buff: 'Tiada' },
    { nama: 'Ikan Duri 🐡', harga: 750, buff: 'Tiada' }, { nama: 'Ikan Belukang 🐟', harga: 600, buff: 'Tiada' },
    { nama: 'Ikan Sembilang 🐟', harga: 1400, buff: 'Tiada' }, { nama: 'Ikan Lundu 🐟', harga: 550, buff: 'Tiada' },
    { nama: 'Ikan Bulan 🐟', harga: 1200, buff: 'Tiada' }, { nama: 'Ikan Terubok 🐟', harga: 3200, buff: 'Tiada' },
    { nama: 'Ikan Kawan 🐟', harga: 950, buff: 'Tiada' }, { nama: 'Ikan Tirusan 🐟', harga: 1800, buff: 'Tiada' },
    { nama: 'Ikan Merah Pucat 🐠', harga: 1500, buff: 'Tiada' }, { nama: 'Ikan Kachi 🐠', harga: 1300, buff: 'Tiada' },
    { nama: 'Ikan Jemuduk 🐟', harga: 2700, buff: 'Tiada' }, { nama: 'Ikan Aruan Tasik 🐟', harga: 2200, buff: 'Tiada' },
    { nama: 'Ikan Todak Biasa 🗡️', harga: 1900, buff: 'Tiada' }, { nama: 'Siput Sedut 🐚', harga: 400, buff: 'Tiada' },
    { nama: 'Kupang Laut 🦪', harga: 350, buff: 'Tiada' }
];

const IKAN_RARE = [
    { nama: 'Lobster Biru 🦞', harga: 150000, buff: '+2% Lulus Jenayah' }, { nama: 'Pari Hantu 🦇', harga: 125000, buff: 'Tiada' },
    { nama: 'Ikan Buntal Beracun 🐡', harga: 110000, buff: 'Tiada' }, { nama: 'Kerapu Harimau 🐅', harga: 160000, buff: 'Tiada' },
    { nama: 'Sotong Kurita Gergasi 🐙', harga: 280000, buff: '+RM1,000 Gaji Kerja' }, { nama: 'Ikan Layaran 🗡️', harga: 175000, buff: 'Tiada' },
    { nama: 'Kerapu Bara 🌋', harga: 180000, buff: 'Tiada' }, { nama: 'Kelah Merah 🐟', harga: 400000, buff: '+RM1,500 Gaji' },
    { nama: 'Ikan Empurau 👑', harga: 350000, buff: '+RM2,500 Gaji Kerja' }, { nama: 'Ketam Raja Alaska 🦀', harga: 210000, buff: 'Tiada' },
    { nama: 'Ikan Pedang 🗡️', harga: 195000, buff: 'Tiada' }, { nama: 'Barakuda Ganas 🦈', harga: 220000, buff: 'Tiada' },
    { nama: 'Ikan Duri Bisa 🐡', harga: 105000, buff: 'Tiada' }, { nama: 'Ikan Sumpit 💦', harga: 130000, buff: 'Tiada' },
    { nama: 'Pari Karang Berdarah 🦇', harga: 250000, buff: '+5% Lulus Jenayah' },
    { nama: 'Kerapu Naga 🐉', harga: 250000, buff: '+RM1,000 Gaji' }, { nama: 'Ikan Tapah Raksasa 🐟', harga: 320000, buff: '+3% Lulus Jenayah' },
    { nama: 'Kura-Kura Emas 🐢', harga: 450000, buff: '-5% Peluang Kantoi' }, { nama: 'Belut Elektrik Hitam ⚡', harga: 185000, buff: 'Tiada' },
    { nama: 'Pari Bintang ✨', harga: 195000, buff: 'Tiada' }, { nama: 'Ketam Batu Berlumut 🦀', harga: 140000, buff: 'Tiada' },
    { nama: 'Tenggiri Biru 🐟', harga: 165000, buff: 'Tiada' }, { nama: 'Sotong Vampir 🦑', harga: 380000, buff: '+4% Lulus Jenayah' },
    { nama: 'Ikan Gergaji 🪚', harga: 290000, buff: '+RM1,500 Gaji' }, { nama: 'Kuda Laut Mahkota 👑', harga: 410000, buff: '+RM2,000 Gaji' },
    { nama: 'Ikan Kaloi Gergasi 🐠', harga: 150000, buff: 'Tiada' }, { nama: 'Udang Galah Raja 🦐', harga: 170000, buff: 'Tiada' },
    { nama: 'Ikan Sebelah Mata 👁️', harga: 120000, buff: 'Tiada' }, { nama: 'Ikan Terbang Berkaca 🪽', harga: 230000, buff: 'Tiada' },
    { nama: 'Terumbu Karang Hidup 🪸', harga: 500000, buff: '+RM3,000 Gaji' }
];

const IKAN_MITOS = [
    { nama: 'Jerung Putih Besar 🦈', harga: 4000000, buff: '+15% Lulus Jenayah' }, { nama: 'Ikan Paus Biru 🐋', harga: 6500000, buff: '+18% Lulus Jenayah' },
    { nama: 'Megalodon Purba 🦖', harga: 5000000, buff: '+30% Lulus Jenayah' }, { nama: 'Naga Laut Raksasa 🐉', harga: 8000000, buff: '+RM30,000 Gaji Kerja' },
    { nama: 'Kraken Emas 🦑', harga: 7500000, buff: '+25% Lulus Jenayah' }, { nama: 'Leviathan Penjaga Arus 🐲', harga: 10000000, buff: '+RM50,000 Gaji Kerja' },
    { nama: 'Penyu Gergasi Purba 🐢', harga: 3500000, buff: '-10% Peluang Kantoi' }, { nama: 'Duyung Sesat 🧜‍♀️', harga: 4500000, buff: '+RM20,000 Gaji Kerja' },
    { nama: 'Ikan Emas Lagenda 🐠', harga: 6000000, buff: '+20% Lulus Jenayah & Curi' }, { nama: 'Jerung Megamulut 🦈', harga: 5500000, buff: '+RM25,000 Gaji Kerja' },
    { nama: 'Paus Orca Bintang 🐋', harga: 8500000, buff: '+RM35,000 Gaji' }, { nama: 'Ikan Purba Coelacanth 🐟', harga: 6500000, buff: '+25% Lulus Jenayah' },
    { nama: 'Cumi-Cumi Kosmik 🦑', harga: 9000000, buff: '+RM40,000 Gaji' }, { nama: 'Pari Manta Nilam 🦇', harga: 7000000, buff: '+35% Lulus Jenayah' },
    { nama: 'Penyu Belimbing Berlian 🐢', harga: 12000000, buff: '-20% Peluang Kantoi' }, { nama: 'Jerung Tukul Besi 🦈', harga: 5500000, buff: '+22% Lulus Jenayah' },
    { nama: 'Ular Laut Obsidian 🐍', harga: 6000000, buff: '+RM28,000 Gaji' }, { nama: 'Ikan Duyung Hitam 🧜‍♀️', harga: 15000000, buff: '+RM60,000 Gaji' },
    { nama: 'Tapak Sulaiman Magma 🌋', harga: 4500000, buff: '+18% Lulus Jenayah' }, { nama: 'Raja Ketam Atlantis 🦀', harga: 11000000, buff: '+RM45,000 Gaji' }
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
                if (now - (cdMancing.get(senderId) || 0) < 35000) {
                    return sock.sendMessage(jid, { text: `⏳ Ikan tengah riki umpan tu! Sabar ${Math.ceil((35000 - (now - (cdMancing.get(senderId) || 0))) / 1000)} saat lagi.` }, { quoted: m });
                }

                if (!pData.umpan || pData.umpan.qty <= 0) {
                    return sock.sendMessage(jid, { text: `❌ Kotak umpan kosong! Pergi borong di \`.kedai_pancing\` dulu.` }, { quoted: m });
                }

                cdMancing.set(senderId, now);
                pData.umpan.qty -= 1; 

                // NERF PELUANG: Mitos (0.2%), Rare (5%), Biasa (60%)
                const rng = Math.random();
                let ikanDapat = rng < (0.002 + (pData.reel.buff_mitos || 0) + (pData.umpan.bonus_all || 0)) ? IKAN_MITOS[Math.floor(Math.random() * IKAN_MITOS.length)] :
                                rng < (0.050 + (pData.rod.buff_rare || 0) + (pData.umpan.bonus_all || 0)) ? IKAN_RARE[Math.floor(Math.random() * IKAN_RARE.length)] :
                                rng < 0.60 ? IKAN_BIASA[Math.floor(Math.random() * IKAN_BIASA.length)] : SAMPAH[Math.floor(Math.random() * SAMPAH.length)];

                pData.tong_ikan.push(ikanDapat);

                if (pData.umpan.qty <= 0) {
                    pData.umpan = { nama: 'Tiada', qty: 0, bonus_all: 0 };
                }

                savePancingDB();
                
                let displayBuff = ikanDapat.buff !== 'Tiada' ? `\n⚡ Buff: ${ikanDapat.buff}` : '';

                return sock.sendMessage(jid, { 
                    text: `🎣 *TANGKAPAN JORAN*\n\n🐟 *${ikanDapat.nama}*\n💵 Nilai: RM ${ikanDapat.harga.toLocaleString()}${displayBuff}\n\n🎣 Sisa Umpan (${pData.umpan.nama || 'Tiada'}): ${pData.umpan.qty}x` 
                }, { quoted: m });
            }

            if (cmd === 'jala') {
                const now = Date.now();
                // Cooldown jala Hardcore: 3 Minit (180,000 ms)
                if (now - (cdMancing.get(senderId + '_jala') || 0) < 180000) {
                    return sock.sendMessage(jid, { text: `⏳ Jala sedang dikeringkan! Tunggu ${Math.ceil((180000 - (now - (cdMancing.get(senderId + '_jala') || 0))) / 1000)} saat lagi.` }, { quoted: m });
                }

                if (!pData.jala || pData.jala.qty <= 0) {
                    return sock.sendMessage(jid, { text: `❌ Jala kau tiada atau dah koyak! Pergi beli jala baharu di \`.kedai_pancing\`.` }, { quoted: m });
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

                for (let i = 0; i < jumlahTangkapan; i++) {
                    const rngJala = Math.random();
                    // Drop rate Hardcore untuk Jala
                    let tangkapan = rngJala < (0.002 + (pData.jala.bonus_mitos || 0)) ? IKAN_MITOS[Math.floor(Math.random() * IKAN_MITOS.length)] :
                                    rngJala < (0.050 + (pData.jala.bonus_rare || 0)) ? IKAN_RARE[Math.floor(Math.random() * IKAN_RARE.length)] :
                                    rngJala < 0.60 ? IKAN_BIASA[Math.floor(Math.random() * IKAN_BIASA.length)] : SAMPAH[Math.floor(Math.random() * SAMPAH.length)];

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

                return sock.sendMessage(jid, { text: `🌊 Kau masukkan *${ikanPilihan.nama}* ke dalam ${ak.nama}.\n🔥 Buff diaktifkan!` }, { quoted: m });
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

                return sock.sendMessage(jid, { text: `💸 Kau lepaskan *${ikanJual.nama}* dari akuarium ke pasaran gelap dengan harga *RM ${ikanJual.harga.toLocaleString()}*!` }, { quoted: m });
            }

        } catch (err) {
            console.error("Mancing & Jala Mega Error:", err);
        }
    }
};
