import { beriXp } from '../lib/xp.js';
import { BANDAR } from '../lib/peta.js';
import { hantarKlip } from '../lib/klipkongsi.js';
import * as store from '../lib/store.js';
import { KERJA, suasana, kiraGaji, cdMinit, syaratGagal, bayaranApp } from '../lib/jobs.js';
import { mulUntuk } from '../lib/musimkerja.js';
import { kadPekerja } from '../lib/kadkerja.js';
import { hasApp, APPS } from '../lib/apps.js';
import { pilih, KERJA_SIAP } from '../lib/suara.js';
import { panelCard } from '../lib/cards.js';

// =========================================================================
// 💼 .job [id]  — satu pintu untuk semua kerja.
//   .job            senarai semua kerja
//   .job grab       mohon / lihat kerja GRAB (perlu telefon + GrabApp + kereta)
//   .job foodpanda  mohon / lihat kerja FOODPANDA (perlu telefon + app + kereta)
//   .job kurier     kerja kurier (perlu telefon + Kurier Pantas + kereta)
//   .job runcit     kerja biasa (terus buat, gaji masuk)
//   .job kad [id]   tunjuk kad pekerja (satu untuk setiap kerja)
// =========================================================================

const RIDER = {
    grab: { nama: 'Rider GRAB (penumpang)', app: 'grab', ket: 'Hantar penumpang dengan kereta' },
    foodpanda: { nama: 'Rider FOODPANDA (makanan)', app: 'foodpanda', ket: 'Hantar makanan pelanggan' },
    ojol: { nama: 'Rider OJOL (penumpang, ID)', app: 'ojol', ket: 'Hantar penumpang di Indonesia' },
    gojek: { nama: 'Rider GOJEK (makanan, ID)', app: 'gojek', ket: 'Hantar makanan di Indonesia' },
};
const PINTAS = { food: 'foodpanda' };
const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

async function keKad(sock, jid, m, user, kerjaId, jawatan, sender) {
    const kunci = `kad_${kerjaId}`;
    if (user.stats[kunci]) return false;             // satu kad sahaja untuk setiap kerja
    user.stats[kunci] = true;
    return kadPekerja({ nama: user.name || sender.split('@')[0], jawatan, userId: sender, kerjaId, tahap: 1 });
}

export default {
    name: 'job',
    alias: ['job'],
    category: 'kerja',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        user.stats = user.stats || {};
        const kerjaRider = await store.get('kerja', 'pekerja', {});
        const diri = kerjaRider[sender] || { jenis: null, harian: { day: '', n: 0 } };

        // senarai
        if (!args[0]) {
            const sua = suasana();
            const baris = [
                ...Object.entries(RIDER).map(([id, r]) => `🛵 \`.job ${id}\` — ${r.nama}\n   ${r.ket} · perlu telefon, ${APPS[r.app].nama}, kereta`),
                ...KERJA.map(k => `💼 \`.job ${k.id}\` — ${k.nama}\n   RM ${k.gaji[0]}–${k.gaji[1]} · cd ${cdMinit(k, sua)} min${k.app ? ` · perlu ${APPS[k.app].nama}` : ''}${k.syarat === 'kereta' ? ' · perlu kereta' : ''}`),
            ];
            return reply(`📋 *SENARAI KERJA*\n\n${baris.join('\n\n')}\n\nSuasana: ${sua.label.length ? sua.label.join(' · ') : 'biasa'}\nKad pekerja: \`.job kad [id]\``);
        }

        const id = PINTAS[args[0].toLowerCase()] || args[0].toLowerCase();

        // kad pekerja
        if (id === 'kad') {
            const pilihan = PINTAS[(args[1] || '').toLowerCase()] || (args[1] || '').toLowerCase();
            const kerjaKad = pilihan || Object.keys(RIDER).find(r => diri.jenis === r) || KERJA.find(k => user.stats[`kad_${k.id}`])?.id;
            if (!kerjaKad) return reply('Belum ada kad pekerja. Cuba `.job grab` atau `.job runcit` dulu.');
            const jawatan = RIDER[kerjaKad]?.nama || KERJA.find(k => k.id === kerjaKad)?.nama || kerjaKad;
            if (!user.stats[`kad_${kerjaKad}`]) return reply(`Kau belum ada kad untuk ${jawatan}. Mula kerja dulu.`);
            const img = await kadPekerja({ nama: user.name || sender.split('@')[0], jawatan, userId: sender, kerjaId: kerjaKad, tahap: 1 });
            return sock.sendMessage(jid, { image: img, caption: `🪪 ${jawatan}` }, { quoted: m });
        }

        // rider (grab / foodpanda)
        if (RIDER[id]) {
            const r = RIDER[id];
            if (!user.inventory?.phone) return reply('📱 Perlukan telefon dulu. Beli di `.device`.');
            if (!hasApp(user, r.app)) return reply(`📲 Pasang *${APPS[r.app].nama}* dulu: \`.app pasang ${r.app}\``);
            const vehicle = await syaratGagal({ syarat: 'kereta' }, user);
            if (vehicle) return reply(`🚗 ${vehicle}`);
            if (diri.jenis === id) return reply(`🛵 Kau dah rider *${r.nama}*. Taip \`.${id}\` untuk tengok order.`);
            diri.jenis = id;
            kerjaRider[sender] = diri;
            await store.set('kerja', 'pekerja', kerjaRider);
            const kad = await keKad(sock, jid, m, user, id, r.nama, sender);
            await db.saveUser(user);
            if (kad) await sock.sendMessage(jid, { image: kad, caption: `🪪 Kad pekerja baharu: ${r.nama}` }, { quoted: m });
            return reply(`✅ Kau dah jadi *${r.nama}*.\nTaip \`.${id}\` untuk tengok order.`);
        }

        // kerja biasa (termasuk kurier)
        const k = KERJA.find(x => x.id === id);
        if (!k) return reply('❌ Kerja tu tak ada. Taip `.job` untuk senarai.');
        if (k.app && !user.inventory?.phone) return reply('📱 Perlukan telefon dulu. Beli di `.device`.');
        if (k.app && !hasApp(user, k.app)) return reply(`📲 Pasang *${APPS[k.app].nama}* dulu: \`.app pasang ${k.app}\``);
        const gagal = syaratGagal(k, user);
        if (gagal) return reply(`❌ ${gagal}`);
        const sua = suasana();
        const kunciCd = `jobcd_${k.id}`;
        const tinggal = (user.stats[kunciCd] || 0) + cdMinit(k, sua) * 60e3 - Date.now();
        if (tinggal > 0) return reply(`⏳ ${k.nama} sekejap lagi. Tunggu ${Math.ceil(tinggal / 60e3)} minit ya.`);
        // kerja app: bayaran ikut jarak (asas + kadar x km), bukan julat tetap
        const jarakApp = k.app ? Math.round((2 + Math.random() * 20) * 10) / 10 : 0;
        const { gaji: asasTetap, tip } = kiraGaji(k, sua);
        const asas = k.app ? bayaranApp(k.app, jarakApp) : asasTetap;
        const gaji = Math.round(asas * mulUntuk(k.id));
        user.wallet = (user.wallet || 0) + gaji + tip;
        beriXp(user, k.app ? 30 : 10, 'job');
        user.stats[kunciCd] = Date.now();
        const kadBaharu = await keKad(sock, jid, m, user, k.id, k.nama, sender);
        await db.saveUser(user);
        const kad = await panelCard({ kicker: 'KERJA SIAP', title: k.nama, lines: [`Gaji: ${rp(gaji)}`, tip ? `Tip: ${rp(tip)}` : 'Tiada tip kali ni', sua.label.length ? sua.label.join(' · ') : 'Suasana biasa', `Baki: ${rp(user.wallet)}`], accent: '#38bdf8', big: rp(gaji), bigLabel: 'GAJI', footerText: pilih(KERJA_SIAP) });
        if (k.id === 'kurier') {
            const sen = Object.keys(BANDAR);
            const dari = sen[Math.floor(Math.random() * sen.length)];
            let ke = sen[Math.floor(Math.random() * sen.length)]; while (ke === dari) ke = sen[Math.floor(Math.random() * sen.length)];
            hantarKlip(sock, jid, m, 'rider', { dari, ke, bayar: gaji, brand: 'poslaju' }, '📦 Pos Laju · penghantaran selesai').catch(() => {});
        }
        // satu gambar sahaja: kad pekerja untuk kali pertama, kalau tidak kad hasil kerja
        return sock.sendMessage(jid, { image: kadBaharu || kad, caption: kadBaharu ? `🪪 Kad pekerja baharu · gaji ${rp(gaji)}` : pilih(KERJA_SIAP) }, { quoted: m });
    }
};
