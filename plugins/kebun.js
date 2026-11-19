import { beriXp } from '../lib/xp.js';
import { hantarKlip } from '../lib/klipkongsi.js';
import { panelCard } from '../lib/cards.js';
import { TIER, darabGabungan, perluKad, kadVarieti } from '../lib/nadir.js';
import { pilih as pilihAyat, TANAM_OK } from '../lib/suara.js';
import { kadBuah } from '../lib/nadir.js';
import fs from 'fs';
import { drawBuah } from '../lib/buahcard.js';
const TANAMAN = {
    cili: { name: 'Cili Bara Fertigasi 🌶️', price: 1000, growTime: 60 * 1000, returnMin: 2200, returnMax: 3500, illegal: false },
    strawberi: { name: 'Strawberi Cameron Highlands 🍓', price: 3000, growTime: 2 * 60 * 1000, returnMin: 6500, returnMax: 9500, illegal: false },
    kangkung: { name: 'Kangkung Sawah 🥬', price: 300, growTime: 40 * 1000, returnMin: 800, returnMax: 1400, illegal: false },
    durian: { name: 'Durian Musang King', price: 15000, growTime: 5 * 60 * 1000, returnMin: 30000, returnMax: 48000, illegal: false },
    ketum: { name: 'Daun Ubat Tradisional Hijau 🍃', price: 5000, growTime: 90 * 1000, returnMin: 15000, returnMax: 28000, illegal: true },
    epal: { name: 'Epal Fuji Cameron 🍎', price: 2000, growTime: 90 * 1000, returnMin: 4500, returnMax: 7000, illegal: false },
    anggur: { name: 'Anggur Ladang Import 🍇', price: 4000, growTime: 150 * 1000, returnMin: 9000, returnMax: 13000, illegal: false },
    oren: { name: 'Oren Tempatan 🍊', price: 1500, growTime: 90 * 1000, returnMin: 3300, returnMax: 4800, illegal: false },
    limau: { name: 'Limau Nipis Kampung 🍋', price: 400, growTime: 40 * 1000, returnMin: 900, returnMax: 1400, illegal: false },
    pisang: { name: 'Pisang Berangan 🍌', price: 600, growTime: 60 * 1000, returnMin: 1300, returnMax: 2000, illegal: false },
    nanas: { name: 'Nanas Moris 🍍', price: 1200, growTime: 80 * 1000, returnMin: 2600, returnMax: 3900, illegal: false },
    betik: { name: 'Betik Eksotika', price: 800, growTime: 60 * 1000, returnMin: 1700, returnMax: 2600, illegal: false },
    mangga: { name: 'Mangga Harumanis 🥭', price: 6000, growTime: 150 * 1000, returnMin: 13000, returnMax: 19000, illegal: false },
    rambutan: { name: 'Rambutan Binjai', price: 4000, growTime: 150 * 1000, returnMin: 8500, returnMax: 12500, illegal: false },
};

// 🎟️ Tiket benih: bayar sekali, benih yang keluar ditentukan rawak ikut kebarangkalian.
// Ketum tak masuk pool (haram).
const TIKET_BENIH = 1500;
const BERAT = { kangkung: 25, limau: 20, pisang: 15, betik: 10, nanas: 8, oren: 7, epal: 5, cili: 4, strawberi: 3, anggur: 2, mangga: 0.7, rambutan: 0.7, durian: 0.5 };
function pilihBenih() {
    const entri = Object.entries(BERAT);
    const jumlah = entri.reduce((a, [, w]) => a + w, 0);
    let r = Math.random() * jumlah;
    for (const [k, w] of entri) { r -= w; if (r < 0) return k; }
    return entri[entri.length - 1][0];
}

// 🧺 Gred hasil: nilai hasil dikali ikut kualiti. Busuk pun boleh jadi, Raja pun boleh dapat.
const GRED = [
    { nama: 'Busuk 🤢', peluang: 0.08, darab: 0.2 },
    { nama: 'Biasa', peluang: 0.40, darab: 0.7 },
    { nama: 'Baik ✅', peluang: 0.35, darab: 1.0 },
    { nama: 'Premium ⭐', peluang: 0.14, darab: 1.6 },
    { nama: 'Raja 👑', peluang: 0.03, darab: 2.5 },
];
function pilihGred() {
    let r = Math.random();
    for (const g of GRED) { r -= g.peluang; if (r < 0) return g; }
    return GRED[GRED.length - 1];
}

// 🌿 Varieti setiap tanaman. Peluang dalam peratus (jumlah 100). Nadir: Biasa, Langka, Epik, Legenda.
const NADIR_DARAB = Object.fromEntries(Object.entries(TIER).map(([k, v]) => [k, v.darab]));
const VARIETI = {
    cili: [['Cili Padi Kampung', 60, 'Biasa'], ['Cili Bara Fertigasi', 30, 'Langka'], ['Cili Hantu', 9, 'Epik'], ['Cili Jepun Sakti', 1, 'Legenda']],
    strawberi: [['Sweet Charlie', 60, 'Biasa'], ['Festival', 30, 'Langka'], ['Cameron Gold', 10, 'Epik']],
    kangkung: [['Kangkung Air', 70, 'Biasa'], ['Kangkung Belacan', 25, 'Langka'], ['Kangkung Sawah Emas', 5, 'Epik']],
    durian: [['D24', 30, 'Biasa'], ['Musang King (D197)', 40, 'Langka'], ['Black Thorn', 20, 'Epik'], ['Musang King Gold', 9, 'Epik'], ['Raja Durian D600', 1, 'Legenda']],
    epal: [['Fuji', 50, 'Biasa'], ['Gala', 35, 'Biasa'], ['Royal Gala', 12, 'Langka'], ['Granny Smith', 3, 'Epik']],
    oren: [['Valencia', 60, 'Biasa'], ['Sunkist', 30, 'Langka'], ['Blood Orange', 9, 'Epik'], ['Oren Berastagi Emas', 1, 'Legenda']],
    anggur: [['Thompson', 60, 'Biasa'], ['Crimson', 30, 'Langka'], ['Red Globe', 9, 'Epik'], ['Anggur Kilat Ladang', 1, 'Legenda']],
    mangga: [['Chokanan', 35, 'Biasa'], ['Harumanis', 55, 'Langka'], ['Nam Doc Mai', 9, 'Epik'], ['Mangga Emas Raja', 1, 'Legenda']],
    rambutan: [['Binjai', 55, 'Biasa'], ['Gula Batu', 35, 'Langka'], ['Rongrien', 9, 'Epik'], ['Rambutan Raja', 1, 'Legenda']],
    limau: [['Limau Nipis', 70, 'Biasa'], ['Limau Kasturi', 25, 'Langka'], ['Limau Purut', 5, 'Epik']],
    pisang: [['Berangan', 60, 'Biasa'], ['Rastali', 30, 'Langka'], ['Pisang Emas', 9, 'Epik'], ['Pisang Raja', 1, 'Legenda']],
    nanas: [['Moris', 60, 'Biasa'], ['Josapine', 30, 'Langka'], ['Sarawak', 9, 'Epik'], ['Nanas Emas', 1, 'Legenda']],
    betik: [['Eksotika', 70, 'Biasa'], ['Sekaki', 25, 'Langka'], ['Merah', 5, 'Epik']],
};
function pilihVarieti(crop) {
    const senarai = VARIETI[crop];
    if (!senarai) return { nama: 'Standard', nadir: 'Biasa' };
    let r = Math.random() * senarai.reduce((a, v) => a + v[1], 0);
    for (const [nama, w, nadir] of senarai) { r -= w; if (r < 0) return { nama, nadir }; }
    const [nama, , nadir] = senarai[senarai.length - 1];
    return { nama, nadir };
}

export default {
    name: 'kebun',
    alias: ['tanam', 'tuai'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();
        const now = Date.now();

        // 1. TUAI HASIL TANAMAN (.tuai)
        if (cmd === 'tuai') {
            if (!user.farm || !user.farm.crop) {
                return sock.sendMessage(jid, { text: '❌ Petak kebun awak kosong! Tanam benih guna `.tanam [cili/strawberi/ketum]`.' }, { quoted: m });
            }

            if (now < user.farm.harvest_at) {
                const bakiSaat = Math.ceil((user.farm.harvest_at - now) / 1000);
                return sock.sendMessage(jid, { text: `⏳ Tanaman belum matang! Tunggu lagi ${bakiSaat} saat untuk dituai.` }, { quoted: m });
            }

            const info = TANAMAN[user.farm.crop];

            // Risiko Serbuan AADK jika tanaman haram (30% kebarangkalian)
            if (info.illegal && Math.random() < 0.30) {
                user.farm.crop = null;
                user.jail.status = true;
                user.jail.release_at = now + (4 * 60 * 1000);
                user.jail.reason = "Membina Ladang Bahan Terlarang";
                await db.saveUser(user);

                return sock.sendMessage(jid, {
                    text: `🚨 *SERBUAN DRON PENGUATKUASA!*\nLadang daun hijau awak dikesan dari udara! Semua pokok ditebas dan awak disumbat ke lokap (4 Minit)!`
                }, { quoted: m });
            }

            const cropTuai = user.farm.crop;
            const asas = Math.floor(Math.random() * (info.returnMax - info.returnMin + 1)) + info.returnMin;
            const gred = pilihGred();
            const varietiPilih = pilihVarieti(cropTuai);
            const untung = Math.round(asas * darabGabungan(varietiPilih.nadir, gred.darab));
            const nadirTinggi = perluKad(varietiPilih.nadir);
            const patutGambar = nadirTinggi || gred.darab >= 1.6;
            user.wallet += untung;
            user.farm.crop = null;
            beriXp(user, 10, 'kebun');
            await db.saveUser(user);

            if (patutGambar) {
                try {
                    const gambar = await drawBuah({ crop: cropTuai, nama: info.name, varieti: varietiPilih.nama, nadir: varietiPilih.nadir, gred: gred.nama, nilai: untung });
                    await sock.sendMessage(jid, { image: gambar, caption: `🍉 Hasil istimewa: ${varietiPilih.nama} (${varietiPilih.nadir})` }, { quoted: m });
                } catch (e) { console.error('[KAD BUAH]', e.message); }
            }
            return sock.sendMessage(jid, {
                text: `
┌───「 🌾 𝗛𝗔𝗦𝗜𝗟 𝗧𝗨𝗔𝗜𝗔𝗡 𝗞𝗘𝗕𝗨𝗡 」
├ 📦 𝗧𝗮𝗻𝗮𝗺𝗮𝗻 : ${info.name}
├ 🌿 𝗩𝗮𝗿𝗶𝗲𝘁𝗶 : ${varietiPilih.nama} (${varietiPilih.nadir})
├ 🏷️ 𝗚𝗿𝗲𝗱 : ${gred.nama} (x${gred.darab})
├ 💵 𝗣𝘂𝗹𝗮𝗻𝗴𝗮𝗻 : +RM ${untung.toLocaleString()} Masuk Poket!
└───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Subur betul tanaman awak! Dapat duit bersih hasil tanah."`
            }, { quoted: m });
        }

        // 2. PILIH BENIH TANAMAN (.tanam [jenis])
        if (cmd === 'tanam') {
            const pilih = (args[0] || '').toLowerCase();
            if (pilih === 'odds') {
                const jumlah = Object.values(BERAT).reduce((x, y) => x + y, 0);
                const baris = Object.entries(BERAT).sort((x, y) => y[1] - x[1])
                    .map(([k, w]) => `• ${TANAMAN[k].name} — ${((w / jumlah) * 100).toFixed(1)}%`).join('\n');
                return sock.sendMessage(jid, { text: `🎲 *KEBARANGKALIAN TIKET RAWAK* (RM ${TIKET_BENIH.toLocaleString('en-US')})\n\n${baris}` }, { quoted: m });
            }
            if (user.farm && user.farm.crop) {
                return sock.sendMessage(jid, { text: `❌ Kebun masih ada tanaman *${TANAMAN[user.farm.crop].name}*! Taip \`.tuai\` dahulu.` }, { quoted: m });
            }
            // Senarai: setiap buah ada baris sendiri
            if (!pilih) {
                const senarai = Object.entries(TANAMAN).filter(([, t]) => !t.illegal)
                    .map(([k, t]) => `${t.name}\n   \`.tanam ${k}\` · RM ${t.price.toLocaleString('en-US')} · ${Math.round(t.growTime / 1000)} saat · ${(VARIETI[k] || []).length} varieti`);
                return sock.sendMessage(jid, { text: `🌱 *PILIH BENIH*\n\n${senarai.join('\n\n')}\n\n🎟️ Mahu nasib? \`.tanam rawak\` (RM ${TIKET_BENIH.toLocaleString('en-US')}, benih rawak)\n🎲 Kebarangkalian: \`.tanam odds\`` }, { quoted: m });
            }
            // Tanam buah pilihan
            if (pilih === 'rawak') {
                if (user.wallet < TIKET_BENIH) return sock.sendMessage(jid, { text: `❌ Tiket benih RM ${TIKET_BENIH.toLocaleString('en-US')} tak cukup.` }, { quoted: m });
                const benihRawak = pilihBenih();
                const tRawak = TANAMAN[benihRawak];
                user.wallet -= TIKET_BENIH;
                user.farm = { crop: benihRawak, planted_at: Date.now(), harvest_at: Date.now() + tRawak.growTime, is_illegal: tRawak.illegal };
                await db.saveUser(user);
                return sock.sendMessage(jid, { text: `🎟️ Tiket RM ${TIKET_BENIH.toLocaleString('en-US')} dibeli.\n🌱 Benih keluar: *${tRawak.name}*\nMasa matang: *${Math.round(tRawak.growTime / 1000)} saat*\nTaip \`.tuai\` bila dah masak.` }, { quoted: m });
            }
            const target = TANAMAN[pilih];
            if (!target || target.illegal) return sock.sendMessage(jid, { text: '❌ Benih tu tak ada. Taip `.tanam` untuk senarai.' }, { quoted: m });
            if (user.wallet < target.price) return sock.sendMessage(jid, { text: `😅 Duit awak belum cukup untuk ${target.name} (RM ${target.price.toLocaleString('en-US')}). Cari duit dulu ya.` }, { quoted: m });
            user.wallet -= target.price;
            user.farm = { crop: pilih, planted_at: Date.now(), harvest_at: Date.now() + target.growTime, is_illegal: false };
            await db.saveUser(user);
            const kad = await panelCard({ kicker: 'DAH DITANAM', title: target.name, lines: [`Modal: RM ${target.price.toLocaleString('en-US')}`, `Masa matang: ${Math.round(target.growTime / 1000)} saat`, pilihAyat(TANAM_OK)], accent: '#22c55e', big: 'TANAM', bigLabel: 'STATUS', footerText: 'Taip .tuai bila masak' });
            const gambarTanam = kadBuah('', user.farm.crop);
            if (gambarTanam) return sock.sendMessage(jid, { image: fs.readFileSync(gambarTanam), caption: `🌱 ${target.name} dah ditanam` }, { quoted: m });
            return sock.sendMessage(jid, { image: kad, caption: `🌱 ${target.name} dah ditanam` }, { quoted: m });
        }

        // 3. SEMAK STATUS KEBUN (.kebun)
        if (!user.farm || !user.farm.crop) {
            return sock.sendMessage(jid, { text: '🏡 Kebun awak sunyi sepi bertanah lapang. Taip `.tanam` untuk mula berkebun.' }, { quoted: m });
        }

        const info = TANAMAN[user.farm.crop];
        const statusTumbuh = now >= user.farm.harvest_at ? '✅ Sudah Matang (Sedia Dituai)' : `⏳ Membesar (${Math.ceil((user.farm.harvest_at - now)/1000)}s lagi)`;

        return sock.sendMessage(jid, {
            text: `🏡 *STATUS KEBUN ANDA*\nTanaman: ${info.name}\nStatus: ${statusTumbuh}\nTaip \`.tuai\` jika sudah matang!`
        }, { quoted: m });
    }
};
