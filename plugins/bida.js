import fs from 'fs';
import { beritaPasaran } from './pasaran.js';
import { VEHICLES, PHONE_DEVICES } from '../lib/gamedata.js';
import { toItem, kadBarang } from '../lib/items.js';
import { withUserLock } from '../lib/money.js';
import { speak } from '../lib/voice.js';
import { config } from '../config.js';
import { line } from '../lib/airi_lines.js';
// State lelongan global (Diubah kepada objek per-group untuk elak timer crash)
export const auctionState = {};

// Senarai Hadiah Kontena Misteri (50 Barang: Hanya Barang Fizikal Bernilai & Tunai Murni)
export const GARAJ_LOOT = [
    { name: 'Mesin Basuh Terpakai', value: 2500, type: 'untung', desc: 'Masih boleh pakai, tapi bunyi sikit masa spin' },
    { name: 'Set Pinggan Kaca', value: 800, type: 'untung', desc: 'Lengkap 6 keping, ada yang retak sikit' },
    { name: 'Basikal Lipat', value: 4500, type: 'untung', desc: 'Tayar sedikit kempis, rantai okay' },
    { name: 'Televisyen CRT', value: 3000, type: 'untung', desc: 'Berat macam batu, gambar berkabus' },
    { name: 'Kotak Kabel Tak Dikenali', value: 50, type: 'rugi', desc: 'Penuh kabel yang tak tahu guna untuk apa' },
    { name: 'Peti Ikan Kosong', value: 10, type: 'rugi', desc: 'Bau pun tak sedap' },
];

export const PREMIUM_LOOT = [
    { name: 'Jam Tangan Mewah', value: 250000, type: 'untung', desc: 'Jenama terkenal, masih ada kotak asal' },
    { name: 'Kereta Antik Rosak', value: 800000, type: 'untung', desc: 'Enjin perlu baik pulih, tapi koleksi tetap berharga' },
    { name: 'Kad Ahli Eksklusif', value: 1200000, type: 'untung', desc: 'Kad ahli kelab peribadi, pemilik lama tak pernah guna' },
    { name: 'Kotak Penuh Pasir', value: 0, type: 'rugi', desc: 'Berat, tapi isinya pasir bangunan sahaja' },
];

export const AUCTION_LOOT_POOL = [
    // --- 35 BARANG FIZIKAL & TUNAI TINGGI (UNTUNG) ---
    { name: "Peti Jongkong Emas 999 Padu (10KG) 🪙", value: 3500000, type: "untung", desc: "Emas tulen berkilau yang sangat berat!" },
    { name: "Kunci Lamborghini Huracan EVO V10 🏎️", value: 1600000, type: "untung", desc: "Supercar idaman siap geran rasmi!" },
    { name: "Cek Tunai Bersih Bank Pusat 💵", value: 1500000, type: "untung", desc: "Wang tunai fizikal dalam sampul rasmi!" },
    { name: "Cold Wallet Mengandungi 5 BTC ₿", value: 1400000, type: "untung", desc: "Dompet kripto fizikal berserta peranti perkakasan." },
    { name: "Blueprint Rahsia Jentera Shadow Legion X 🖥️", value: 1200000, type: "untung", desc: "Fail fizikal pelan prototaip peranti gaming." },
    { name: "Geran Banglo Mewah TRX Skyview 🏙️", value: 3500000, type: "untung", desc: "Dokumen hak milik hartanah fizikal." },
    { name: "Sijil Saham Korporat Shadow Legacy 📜", value: 2500000, type: "untung", desc: "Sijil fizikal pegangan saham syarikat." },
    { name: "Beg Tangan Birkin Original 👜", value: 350000, type: "untung", desc: "Beg tangan fizikal jenama mewah antarabangsa." },
    { name: "Cincin Berlian 10 Karat 💍", value: 250000, type: "untung", desc: "Barang kemas fizikal bertatahkan berlian asli." },
    { name: "Superbike Ducati Panigale V4 🏍️", value: 180000, type: "untung", desc: "Motosikal berkuasa tinggi dalam kontena." },
    { name: "Jongkong Perak 50KG 🥈", value: 100000, type: "untung", desc: "Bongkah perak fizikal tulen." },
    { name: "Set Meja Biliard Emas 🎱", value: 75000, type: "untung", desc: "Meja snuker fizikal disalut kemasan emas." },
    { name: "Lukisan Seni Klasik Terkenal 🖼️", value: 50000, type: "untung", desc: "Karya seni fizikal berserta bingkai antik." },
    { name: "Jam Tangan Rolex Daytona ⌚", value: 45000, type: "untung", desc: "Jam tangan fizikal mewah berantai emas." },
    { name: "Setup PC Gaming RTX 4090 🖥️", type: "untung", value: 45000, desc: "Rig komputer fizikal lengkap dengan perkakasan." },
    { name: "Koleksi Kasut Sneaker Rare 👟", value: 40000, type: "untung", desc: "Kotak fizikal berisi kasut edisi terhad." },
    { name: "Tiket Penerbangan First Class (Fizikal) 🎫", value: 25000, type: "untung", desc: "Tiket fizikal fizikal eksklusif." },
    { name: "Minyak Wangi Jenama Mewah 🧴", value: 20000, type: "untung", desc: "Botol fizikal pati wangian import." },
    { name: "Kotak Cerut Cuba Premium 🚬", value: 15000, type: "untung", desc: "Kotak fizikal berisi cerut tembakau asli." },
    { name: "Mesin Kira Duit Automatik 📠", value: 5000, type: "untung", desc: "Peranti perkakasan mesin fizikal." },
    { name: "Jubah Besi Kesatria Purba 🛡️", value: 80000, type: "untung", desc: "Pakaian perlindungan fizikal antik." },
    { name: "Peti Harta Karun Besi 🏴‍☠️", value: 500000, type: "untung", desc: "Peti fizikal berisi syiling logam lama." },
    { name: "Bot Laju Peribadi (Yacht) 🛥️", value: 3000000, type: "untung", desc: "Kenderaan air fizikal bersaiz besar." },
    { name: "Helikopter Peribadi 🚁", value: 4500000, type: "untung", desc: "Kenderaan udara fizikal." },
    { name: "Server Kuantum Fizikal 💾", value: 800000, type: "untung", desc: "Kabinet pelayan komputer fizikal." },
    { name: "Lesen Perniagaan Emas (Fizikal) 🪪", value: 600000, type: "untung", desc: "Kad lesen fizikal rasmi." },
    { name: "Bekas Artifak Purba 🏺", value: 450000, type: "untung", desc: "Pasu tembikar fizikal bersejarah." },
    { name: "Drone Pengintip Profesional 🛸", value: 120000, type: "untung", desc: "Gajet dron fizikal berkamera tinggi." },
    { name: "Telefon Pintar Flagship 📱", value: 6500, type: "untung", desc: "Peranti telefon pintar fizikal dalam kotak." },
    { name: "Pembesar Suara Pintar 🔊", value: 3500, type: "untung", desc: "Perangkat pembesar suara fizikal." },
    { name: "Tetikus Gaming E-Sukan 🖱️", value: 1200, type: "untung", desc: "Perkakasan tetikus fizikal berkomputer." },
    { name: "Wang Tunai Fizikal (RM50,000) 💵", value: 50000, type: "untung", desc: "Ikatan nota wang fizikal kertas." },
    { name: "Wang Tunai Fizikal (RM100,000) 💵", value: 100000, type: "untung", desc: "Koleksi wang kertas fizikal dalam beg." },
    { name: "Wang Tunai Fizikal (RM250,000) 💵", value: 250000, type: "untung", desc: "Pendapatan tunai fizikal bertompok." },
    { name: "Wang Tunai Fizikal (RM500,000) 💵", value: 500000, type: "untung", desc: "Peti keselamatan padat berisi wang fizikal." },

    // --- 15 BARANG SCAM / SAMPAH FIZIKAL (RUGI TERUK) ---
    { name: "Sekotak Habuk Kayu & Pasir Sungai 💨", value: 10, type: "rugi", desc: "Kotak fizikal yang hanya dipenuhi habuk." },
    { name: "Bata Merah Rumah Pembinaan 🧱", value: 50, type: "rugi", desc: "Seketul bata fizikal berat tanpa nilai." },
    { name: "Rim Basikal Karat Terpakai 🛞", value: 20, type: "rugi", desc: "Sisa besi fizikal yang sudah berkarat." },
    { name: "Selipar Jepun Sebelah Kiri 🩴", value: 2, type: "rugi", desc: "Sebelah kasut getah fizikal terpakai." },
    { name: "Kunci Mangga Rosak Tanpa Anak 🔒", value: 5, type: "rugi", desc: "Peralatan besi fizikal yang sudah patah." },
    { name: "Mouse Pad Koyak Rabak 🖱️", value: 3, type: "rugi", desc: "Kain alas fizikal yang sudah rosak." },
    { name: "Bateri Kereta Sudah Kong 🔋", value: 20, type: "rugi", desc: "Kotak bateri fizikal berat yang kering asid." },
    { name: "Botol Kicap Kaca Kosong 🍾", value: 2, type: "rugi", desc: "Botol fizikal terpakai buangan." },
    { name: "Kabel USB Putus Dalam 🔌", value: 4, type: "rugi", desc: "Wayar fizikal bersalut plastik rosak." },
    { name: "Kertas Pembalut Gula-gula 🍬", value: 1, type: "rugi", desc: "Sisa plastik fizikal ringan." },
    { name: "Skrin Telefon Pecah Seribu 📱", value: 50, type: "rugi", desc: "Serpihan kaca fizikal peranti rosak." },
    { name: "Surat Saman Mahkamah Orang Lain 📄", value: 0, type: "rugi", desc: "Kertas fizikal dokumen terbuang." },
    { name: "Bangkai Ikan Buntal Kering 🐡", value: 0, type: "rugi", desc: "Sisa fizikal biologi berbau busuk." },
    { name: "Beras Hancur Berulat 1KG 🍚", value: 3, type: "rugi", desc: "Bahan makanan fizikal rosak bertarikh." },
    { name: "Akaun Fizikal Kad Sim Toksik 📱", value: 5, type: "rugi", desc: "Kepingan kad plastik fizikal terpakai." }
];

// Fungsi Memulakan Lelongan (Dipanggil oleh Loop Random Event)
// Jenis lelongan: harga tapak rendah untuk semua orang, kenaikan minimum, dan pool barang sendiri.
export const LELONGAN = {
    garaj: { nama: 'LELONGAN GARAJ', tapak: [1000, 2000, 3000, 5000], step: 500, pool: 'garaj', berat: 50,
        cerita: 'Garaj lama di Kepong dikosongkan. Barang-barang tu dilelong untuk sesiapa yang berani.' },
    kontena: { nama: 'LELONGAN KONTENA MISTERI', tapak: [20000, 50000, 100000, 250000], step: 1000, pool: 'kontena', berat: 35,
        cerita: 'Kontena tersadai dari Pelabuhan Klang dibuka untuk bidaan!' },
    premium: { nama: 'LELONGAN PREMIUM', tapak: [100000, 250000], step: 5000, pool: 'premium', berat: 15,
        cerita: 'Koleksi barang mewah dari rumah banglo dibuka untuk bidaan eksklusif.' },
};
const POOL = { kontena: () => AUCTION_LOOT_POOL, garaj: () => GARAJ_LOOT, premium: () => PREMIUM_LOOT };

const pilihRawak = arr => arr[Math.floor(Math.random() * arr.length)];
const lootKenderaan = v => ({ name: v.name, value: v.price, type: 'untung', desc: `Kelajuan ${v.speed} km/h · kelas ${v.type}`, kind: 'vehicle', ref: v.id });

// Barang lelongan: kadang-kadang kenderaan atau telefon sebenar (boleh dipakai atau dijual).
function pickLoot(jenis) {
    const r = Math.random();
    if (jenis === 'garaj' && r < 0.35) {
        if (Math.random() < 0.6) { const p = pilihRawak(PHONE_DEVICES); return { name: p.name, value: p.price, type: 'untung', desc: p.bonus, kind: 'phone', ref: p.id }; }
        const murah = VEHICLES.filter(v => v.price <= 50000);
        if (murah.length) return lootKenderaan(pilihRawak(murah));
    }
    if (jenis === 'premium' && r < 0.5) {
        const mahal = VEHICLES.filter(v => v.price > 50000);
        if (mahal.length) return lootKenderaan(pilihRawak(mahal));
    }
    const pool = (POOL[jenis] || POOL.kontena)();
    return pilihRawak(pool);
}

function pilihJenis() {
    const jumlah = Object.values(LELONGAN).reduce((a, j) => a + j.berat, 0);
    let r = Math.random() * jumlah;
    for (const [kunci, j] of Object.entries(LELONGAN)) { r -= j.berat; if (r < 0) return kunci; }
    return 'garaj';
}

import * as store from '../lib/store.js';
import { db } from '../lib/database.js';

// Simpan keadaan lelongan supaya bida tak hilang bila bot restart
function simpanLelong() {
    store.set('lelong', 'aktif', JSON.stringify(auctionState)).catch(() => {});
}

/** Dipanggil bila bot sambung semula: pulangkan bida lelongan yang tergantung. */
export async function pulihLelong(sock) {
    let data = null;
    try { data = JSON.parse((await store.get('lelong', 'aktif', null)) || 'null'); } catch { data = null; }
    if (!data) return;
    for (const [chatId, l] of Object.entries(data)) {
        if (l?.highestBidder && l.currentBid) {
            const u = await db.getUser(l.highestBidder);
            u.wallet = (u.wallet || 0) + l.currentBid;
            await db.saveUser(u);
            await sock.sendMessage(chatId, { text: `♻️ Lelongan terganggu (bot restart). Bida RM ${l.currentBid.toLocaleString()} dipulangkan kepada pembida.` }).catch(() => {});
        }
    }
    await store.set('lelong', 'aktif', JSON.stringify({}));
}

export async function triggerRandomAuction(sock, chatId) {
    if (auctionState[chatId] && auctionState[chatId].active) return false; // lelongan lain masih berjalan

    const jenis = pilihJenis();
    const cfg = LELONGAN[jenis];
    const tapak = cfg.tapak[Math.floor(Math.random() * cfg.tapak.length)];

    auctionState[chatId] = {
        active: true,
        jenis,
        step: cfg.step,
        startPrice: tapak,
        currentBid: tapak,
        highestBidder: null,
        highestBidderName: 'Tiada',
        endsAt: Date.now() + 60000 // 60 saat durasi
    };

    const notis = `
┌───「 📦 ${cfg.nama} 」
│ _${cfg.cerita}_
├───────────────────────────
├ 💵 Harga Tapak   : RM ${tapak.toLocaleString()}
├ 📈 Kenaikan min  : RM ${cfg.step.toLocaleString()}
├ 👤 Pembida Teratas: Tiada
├ ⏳ Tempoh        : 60 Saat Sahaja!
└───────────────────────────
⚠️ Isi boleh jadi barang berharga, tunai, atau sampah. Nasib-nasib!
👉 Taip: \`.bida [jumlah_rm]\` untuk membida. Pemula pun boleh join!`;

    // Poster lelongan (assets/lelong/<jenis>.jpg). Kalau tak ada, guna teks sahaja.
    const posterFail = new URL(`../assets/lelong/${jenis}.jpg`, import.meta.url);
    if (fs.existsSync(posterFail)) {
        await sock.sendMessage(chatId, { image: fs.readFileSync(posterFail), caption: notis }).catch(() => sock.sendMessage(chatId, { text: notis }));
    } else {
        await sock.sendMessage(chatId, { text: notis }).catch(() => {});
    }
    if (config.voice) speak(sock, chatId, 'auction').catch(() => {});

    // Tamat Lelongan Selepas 60 Saat
    setTimeout(async () => {
        const lelong = auctionState[chatId];
        if (!lelong || !lelong.active) return;
        lelong.active = false;

        if (!lelong.highestBidder) {
            delete auctionState[chatId]; simpanLelong();
            return sock.sendMessage(chatId, { text: '🔔 *Lelongan dah habis!* Tak ada sesiapa bida langsung. Kontena tu balik ke asal.' });
        }

        const { db } = await import('../lib/database.js');
        // Rugi dikurangkan: kalau kena rugi, 60% peluang diundi semula sekali
        let hasilLoot = pickLoot(lelong.jenis);
        if (hasilLoot.type === 'rugi' && Math.random() < 0.6) hasilLoot = pickLoot(lelong.jenis);
        // Untung mesti sekurang-kurangnya bernilai bida: kalau tak, bayar tunai 125% bida
        if (hasilLoot.type === 'untung' && hasilLoot.value < lelong.currentBid) {
            hasilLoot = { name: 'Pulangan tunai lelongan', value: Math.round(lelong.currentBid * 1.25), type: 'untung', desc: 'Tunai masuk terus ke wallet', kind: 'cash' };
        }
        const itemBaru = hasilLoot.kind === 'cash' ? null : toItem(hasilLoot, lelong.currentBid);
        await withUserLock(lelong.highestBidder, async () => {
        const pemenang = await db.getUser(lelong.highestBidder);

        pemenang.items = Array.isArray(pemenang.items) ? pemenang.items : [];
        if (itemBaru) pemenang.items.push(itemBaru);
        else pemenang.wallet = (pemenang.wallet || 0) + hasilLoot.value;
        if (lelong.jenis === 'premium') beritaPasaran('emas', 0.015);
        pemenang.stats = pemenang.stats || {};
        pemenang.stats.lelong_menang = (pemenang.stats.lelong_menang || 0) + 1;
        await db.saveUser(pemenang);
        });

        const roaster = hasilLoot.type === "untung"
            ? "PERGHHH KAYA RAYA! Rezeki terpijak dapat barang fizikal bernilai tinggi atau tunai kontang!"
            : "HAHAHAHA KENA SCAM! Bida ratus ribu last-last dalam kontena cuma ada sampah fizikal!";

        const teksMenang = `
┌───「 🏆 𝗞𝗘𝗣𝗨𝗧𝗨𝗦𝗔𝗡 𝗟𝗘𝗟𝗢𝗡𝗚𝗔𝗡 𝗞𝗢𝗡𝗧𝗘𝗡𝗔 」
├ 👤 𝗣𝗲𝗺𝗲𝗻𝗮𝗻𝗴 : @${lelong.highestBidder.split('@')[0]}
├ 💸 𝗛𝗮𝗿𝗴𝗮 𝗕𝗶𝗱𝗮 : RM ${lelong.currentBid.toLocaleString()}
├ 📊 𝗕𝗲𝗿𝘀𝗶𝗵    : RM ${(hasilLoot.value - lelong.currentBid).toLocaleString()}
├───────────────────────────
├ 📦 𝗜𝘀𝗶 𝗞𝗼𝗻𝘁𝗲𝗻𝗮: *${hasilLoot.name}*
├ 💵 𝗡𝗶𝗹𝗮𝗶 𝗦𝗲𝗯𝗲𝗻𝗮𝗿: RM ${hasilLoot.value.toLocaleString()}
├ 📝 𝗞𝗲𝘁𝗲𝗿𝗮𝗻𝗴𝗮𝗻 : ${hasilLoot.desc}
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "${roaster}"`;

        await sock.sendMessage(chatId, { text: teksMenang, mentions: [lelong.highestBidder] });
        try { if (!itemBaru) throw new Error('tunai'); const kad = await kadBarang(itemBaru); await sock.sendMessage(chatId, { image: kad, caption: `🎁 ${lelong.highestBidderName || 'Pemenang'} dapat *${itemBaru.nama}* (ID ${itemBaru.id})` }); } catch (e) { console.error('[KAD BARANG]', e.message); }
        delete auctionState[chatId]; simpanLelong();
    }, 60000);
    simpanLelong();
    return true;
}

export default {
    name: 'bida',
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        
        const lelong = auctionState[jid];

        if (!lelong || !lelong.active) {
            return sock.sendMessage(jid, { text: '❌ Tak ada lelongan kontena sekarang. Tunggu kejap lagi.' }, { quoted: m });
        }

        const amaunBida = parseInt(args[0]);
        if (isNaN(amaunBida)) {
            return sock.sendMessage(jid, {
                text: `❌ Masukkan angka bidaan!\nBidaan semasa: *RM ${lelong.currentBid.toLocaleString()}*\nContoh: \`.bida ${lelong.currentBid + 10000}\``
            }, { quoted: m });
        }

        const minBida = lelong.highestBidder ? lelong.currentBid + (lelong.step || 1000) : lelong.currentBid;
        if (amaunBida < minBida) {
            return sock.sendMessage(jid, {
                text: `❌ Bidaan minimum RM ${minBida.toLocaleString()} (semasa RM ${lelong.currentBid.toLocaleString()}, kenaikan RM ${(lelong.step || 1000).toLocaleString()}).`
            }, { quoted: m });
        }

        // Ambil data segar (elak baki lama menimpa perubahan lain)
        const fresh = await db.getUser(senderJid);
        // Jika pembida sama bida semula, bidaan lamanya dipulangkan dulu dan boleh dikira sebagai baki
        const bidaSendiri = lelong.highestBidder === senderJid ? lelong.currentBid : 0;
        if ((fresh.wallet + bidaSendiri) < amaunBida) {
            return sock.sendMessage(jid, { text: `❌ Duit poket awak tak cukup! Awak ada RM ${fresh.wallet.toLocaleString()}` }, { quoted: m });
        }
        // Pulangkan bidaan pembida sebelumnya (berlaku juga jika pembida sama)
        if (lelong.highestBidder && lelong.highestBidder !== senderJid) {
            const prevUser = await db.getUser(lelong.highestBidder);
            prevUser.wallet += lelong.currentBid;
            await db.saveUser(prevUser);
        }
        fresh.wallet += bidaSendiri;
        fresh.wallet -= amaunBida;
        await db.saveUser(fresh);
        user.wallet = fresh.wallet;

        lelong.currentBid = amaunBida;
        lelong.highestBidder = senderJid;
        lelong.highestBidderName = m.pushName || 'Warga Gelap';
        simpanLelong();

        return sock.sendMessage(jid, {
            text: `📈 *BIDAAN BAHARU DITERIMA!*\n👤 @${senderJid.split('@')[0]} meletakkan tawaran: *RM ${amaunBida.toLocaleString()}*!\nAda siapa lagi nak lawan? Taip \`.bida [nilai]\`!`,
            mentions: [senderJid]
        });
    }
};
