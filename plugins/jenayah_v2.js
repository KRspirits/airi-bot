import { sceneGambar } from '../lib/sceneai.js';

// =========================================================================
// 🕶️ JENAYAH V2. Jenayah boleh dibuat bila-bila masa. Blackmarket (.gelap) jual peralatan
// yang kurangkan risiko atau tambah hasil untuk jenayah seterusnya.
// Kalau kantoi: kena tahan. Ada peguam (.peguam) dan rasuah (.rasuah) untuk keluar.
// =========================================================================

const JENAYAH = [
    { id: 'curi_kereta', nama: 'Curi Kereta', min: 5000, max: 30000, risiko: 0.35, penjara: 20, cd: 10 },
    { id: 'scam', nama: 'Scam Online', min: 3000, max: 25000, risiko: 0.30, penjara: 15, cd: 8 },
    { id: 'peras_ugut', nama: 'Peras Ugut', min: 8000, max: 40000, risiko: 0.38, penjara: 25, cd: 15 },
    { id: 'rompak_kedai', nama: 'Rompak Kedai Runcit', min: 10000, max: 60000, risiko: 0.40, penjara: 30, cd: 20 },
    { id: 'seludup', nama: 'Seludup Barang', min: 50000, max: 200000, risiko: 0.45, penjara: 60, cd: 45 },
    { id: 'godam_kripto', nama: 'Godam Kripto', min: 100000, max: 1000000, risiko: 0.50, penjara: 90, cd: 90 },
    { id: 'rompak_bank', nama: 'Rompak Bank', min: 200000, max: 800000, risiko: 0.55, penjara: 120, cd: 120 },
    { id: 'rompak_kasino', nama: 'Rompak Kasino', min: 500000, max: 2000000, risiko: 0.65, penjara: 240, cd: 240 },
];

const GELAP = [
    { id: 'topeng', nama: 'Topeng & Sarung Tangan', harga: 30000, risiko: -0.10, hasil: 0, penjara: 1, ket: 'Risiko -10%' },
    { id: 'kunci', nama: 'Kunci Ajaib', harga: 60000, risiko: -0.15, hasil: 0, penjara: 1, ket: 'Risiko -15%' },
    { id: 'kereta_lari', nama: 'Kereta Lari', harga: 100000, risiko: 0, hasil: 0.10, penjara: 1, ket: 'Hasil +10%' },
    { id: 'senjata', nama: 'Senjata Haram', harga: 150000, risiko: -0.20, hasil: 0.20, penjara: 1, ket: 'Risiko -20%, hasil +20%' },
    { id: 'dokumen', nama: 'Dokumen Palsu', harga: 250000, risiko: -0.25, hasil: 0, penjara: 1, ket: 'Risiko -25%' },
    { id: 'pemandu', nama: 'Pemandu Upahan', harga: 400000, risiko: -0.30, hasil: 0.15, penjara: 1, ket: 'Risiko -30%, hasil +15%' },
    { id: 'peluru', nama: 'Peluru Emas', harga: 700000, risiko: 0, hasil: 0.40, penjara: 1, ket: 'Hasil +40%' },
    { id: 'pelan', nama: 'Pelan Rompakan', harga: 1200000, risiko: -0.35, hasil: 0.50, penjara: 1, ket: 'Risiko -35%, hasil +50%' },
    { id: 'jaminan', nama: 'Jaminan Bebas Penjara', harga: 2000000, risiko: 0, hasil: 0, penjara: 0.25, ket: 'Kalau kantoi, hukuman tinggal 25%' },
    { id: 'helikopter', nama: 'Helikopter Lari', harga: 5000000, risiko: -0.40, hasil: 1.00, penjara: 1, ket: 'Risiko -40%, hasil +100%' },
];


const PEGUAM = {
    1: { fi: 5000, kurang: 0.25, peluang: 0.60 },
    2: { fi: 20000, kurang: 0.50, peluang: 0.75 },
    3: { fi: 60000, kurang: 0.75, peluang: 0.90 },
};
const RASUAH = { kos: 20000, min: 5000, max: 200000, peluang: 0.35, denda: 10000, lanjut: 30 };
// Peluang naik ikut jumlah rasuah: lebih besar, lebih yakin pegawai terima.
const peluangRasuah = jumlah => jumlah >= 100000 ? 0.65 : jumlah >= 50000 ? 0.5 : 0.35;
const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const minit = ms => Math.ceil(ms / 60e3);
const rawak = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

export default {
    name: 'jenayah_v2',
    alias: ['jenayah', 'gelap', 'beli_gelap', 'peguam', 'rasuah', 'lokap'],
    category: 'jenayah',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const cmd = teks.trim().split(/\s+/)[0].slice(1).toLowerCase();
        const now = Date.now();
        user.stats = user.stats || {};
        user.bm_items = Array.isArray(user.bm_items) ? user.bm_items : [];
        const dalamLokap = user.jail?.status && (user.jail.release_at || 0) > now;
        const sisaLokap = dalamLokap ? user.jail.release_at - now : 0;

        if (cmd === 'gelap') {
            const senarai = GELAP.map(g => `• \`.beli_gelap ${g.id}\` — ${g.nama}\n   ${rp(g.harga)} · ${g.ket}`);
            return reply(`🕶️ *BLACKMARKET*\n\nBarang yang dijual bawah meja:\n\n${senarai.join('\n')}\n\nPeralatan dipakai sekali untuk jenayah seterusnya.`);
        }

        if (cmd === 'beli_gelap') {
            const g = GELAP.find(x => x.id === (args[0] || '').toLowerCase());
            if (!g) return reply('❌ Barang tu tak ada. Taip `.gelap` untuk senarai.');
            if ((user.wallet || 0) < g.harga) return reply(`❌ Duit tak cukup. Perlu ${rp(g.harga)}.`);
            user.wallet -= g.harga;
            user.bm_items.push({ id: g.id, nama: g.nama, risiko: g.risiko, hasil: g.hasil, penjara: g.penjara });
            await db.saveUser(user);
            return reply(`🕶️ Beli *${g.nama}* dengan ${rp(g.harga)}. ${g.ket}.`);
        }

        if (cmd === 'lokap') {
            if (!dalamLokap) return reply('✅ Awak tak dalam lokap sekarang. Jenayah jalan terus.');
            return reply(`⛓️ *DALAM LOKAP*\nSisa masa: ${minit(sisaLokap)} minit\n\n• \`.peguam 1\` — ${rp(PEGUAM[1].fi)}, kurang ${PEGUAM[1].kurang * 100}% (peluang ${PEGUAM[1].peluang * 100}%)\n• \`.peguam 2\` — ${rp(PEGUAM[2].fi)}, kurang ${PEGUAM[2].kurang * 100}% (peluang ${PEGUAM[2].peluang * 100}%)\n• \`.peguam 3\` — ${rp(PEGUAM[3].fi)}, kurang ${PEGUAM[3].kurang * 100}% (peluang ${PEGUAM[3].peluang * 100}%)\n• \`.rasuah\` — ${rp(RASUAH.kos)}, peluang ${RASUAH.peluang * 100}% keluar serta-merta. Gagal: denda ${rp(RASUAH.denda)} dan tambah ${RASUAH.lanjut} minit.\n\nPeguam hanya boleh guna sekali setiap tahanan.`);
        }

        if (cmd === 'peguam') {
            if (!dalamLokap) return reply('✅ Awak tak dalam lokap, tak perlu peguam.');
            if (user.jail.peguam_guna) return reply('❌ Peguam dah digunakan untuk tahanan ni.');
            const pilih = PEGUAM[parseInt(args[0])];
            if (!pilih) return reply('❌ Format: `.peguam 1`, `.peguam 2`, atau `.peguam 3`.');
            if ((user.wallet || 0) < pilih.fi) return reply(`❌ Yuran peguam ${rp(pilih.fi)} tak cukup.`);
            user.wallet -= pilih.fi;
            user.jail.peguam_guna = true;
            if (Math.random() < pilih.peluang) {
                const baru = Math.round(sisaLokap * (1 - pilih.kurang));
                user.jail.release_at = now + baru;
                await db.saveUser(user);
                return reply(`⚖️ *PEGUAM BERJAYA!* Hukuman dikurangkan. Sisa baru ${minit(baru)} minit.`);
            }
            await db.saveUser(user);
            return reply(`⚖️ Peguam kalah dalam perbicaraan. Yuran ${rp(pilih.fi)} hangus, hukuman kekal.`);
        }

        if (cmd === 'rasuah') {
            if (!dalamLokap) return reply('✅ Awak tak dalam lokap.');
            const cdTinggal = (user.stats.rasuah_last || 0) + 60 * 60e3 - now;
            if (cdTinggal > 0) return reply(`⏳ Pegawai tu belum boleh dihubungi, tunggu ${minit(cdTinggal)} minit lagi.`);
            const jumlahRasuah = args[0] ? parseInt(args[0], 10) : RASUAH.kos;
            if (!Number.isInteger(jumlahRasuah) || jumlahRasuah < RASUAH.min || jumlahRasuah > RASUAH.max) return reply(`❌ Jumlah rasuah mesti antara ${rp(RASUAH.min)} dan ${rp(RASUAH.max)}. Contoh: \`.rasuah 50000\``);
            if ((user.wallet || 0) < jumlahRasuah) return reply(`❌ Duit tak cukup untuk rasuah ${rp(jumlahRasuah)}.`);
            user.wallet -= jumlahRasuah;
            user.stats.rasuah_last = now;
            if (Math.random() < peluangRasuah(jumlahRasuah)) {
                user.jail = { ...user.jail, status: false, release_at: 0 };
                await db.saveUser(user);
                return reply(`🤝 *BERJAYA!* Pegawai tu terima duit, awak keluar sekarang. Ingat, jangan kantoi lagi.`);
            }
            const denda = Math.min(user.wallet || 0, RASUAH.denda);
            user.wallet -= denda;
            user.jail.release_at = user.jail.release_at + RASUAH.lanjut * 60e3;
            await db.saveUser(user);
            return reply(`🚨 Rasuah gagal! Pegawai tu rakam semuanya. Denda ${rp(denda)} dan hukuman tambah ${RASUAH.lanjut} minit.`);
        }

        // ---------------- JENAYAH ----------------
        const pilih = (args[0] || '').toLowerCase();
        if (!pilih) {
            const senarai = JENAYAH.map(j => `• \`.jenayah ${j.id}\` — ${j.nama}\n   Hasil ${rp(j.min)} – ${rp(j.max)} · Risiko ${Math.round(j.risiko * 100)}% · Penjara ${j.penjara} minit`);
            return reply(`🕶️ *SENARAI JENAYAH*\n\n${senarai.join('\n')}\n\nBoleh buat bila-bila masa. Beli peralatan di \`.gelap\`.`);
        }
        const j = JENAYAH.find(x => x.id === pilih);
        if (!j) return reply('❌ Jenayah tu tak ada. Taip `.jenayah` untuk senarai.');
        if (dalamLokap) return reply(`⛓️ Awak dalam lokap. Sisa ${minit(sisaLokap)} minit. Guna \`.peguam\` atau \`.rasuah\`, atau tunggu.`);
        const cdTinggal = (user.stats[`jen_${j.id}`] || 0) + j.cd * 60e3 - now;
        if (cdTinggal > 0) return reply(`⏳ ${j.nama} belum boleh, tunggu ${minit(cdTinggal)} minit lagi.`);

        // guna peralatan blackmarket sekali
        let risiko = j.risiko, hasilMul = 1, pjMul = 1;
        const guna = user.bm_items.filter(b => b.risiko || b.hasil || (b.penjara && b.penjara < 1)).slice(0, 2);
        for (const b of guna) {
            risiko += b.risiko || 0;
            hasilMul += b.hasil || 0;
            if (b.penjara && b.penjara < pjMul) pjMul = b.penjara;
        }
        user.bm_items = user.bm_items.filter(b => !guna.includes(b));
        const namaGuna = guna.map(b => b.nama).join(' + ');
        risiko = Math.min(0.9, Math.max(0.05, risiko));
        user.stats[`jen_${j.id}`] = now;

        if (Math.random() >= risiko) {
            const hasil = Math.round(rawak(j.min, j.max) * hasilMul);
            user.wallet = (user.wallet || 0) + hasil;
            await db.saveUser(user);
            const gambar = await sceneGambar('rompak');
            return sock.sendMessage(jid, { image: gambar, caption: `🏴‍☠️ *${j.nama.toUpperCase()} BERJAYA!*\nHasil: ${rp(hasil)}${guna.length ? `\n🕶️ Peralatan: ${namaGuna}` : ''}\nBaki: ${rp(user.wallet)}` }, { quoted: m });
        }
        const denda = Math.min(user.wallet || 0, Math.round(rawak(j.min, j.max) * 0.1));
        user.wallet -= denda;
        user.jail = { status: true, release_at: now + Math.round(j.penjara * pjMul * 60e3), reason: j.nama, peguam_guna: false };
        await db.saveUser(user);
        const gambarTangkap = await sceneGambar('tangkap');
        return sock.sendMessage(jid, { image: gambarTangkap, caption: `🚨 *KANTOI! ${j.nama.toUpperCase()}*\nDenda ${rp(denda)}. Kena tahan ${j.penjara} minit.\n\nOpsyen: \`.peguam 1-3\`, \`.rasuah\`, atau \`.lokap\` untuk tengok sisa masa.` }, { quoted: m });
    }
};
