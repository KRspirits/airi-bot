import * as store from '../lib/store.js';
import { myt } from '../lib/util.js';
import { jarakKm, BANDAR } from '../lib/peta.js';
import { VEHICLES, PHONE_DEVICES } from '../lib/gamedata.js';
import { renderAppOrders } from '../lib/appcard.js';
import { KERJA, suasana, kiraGaji, cdMinit, syaratGagal } from '../lib/jobs.js';
import { mulUntuk, musimSemasa } from '../lib/musimkerja.js';

// =========================================================================
// 🛵 KERJA HALAL. Dua jenis kerja:
//   GRAB (GrabFood brand hijau): hantar PENUMPANG dengan kereta.
//   FOODPANDA (merah jambu): hantar MAKANAN.
// Mesti mohon kerja dulu dengan .job apply grab|food. Mesti ada telefon dan kereta.
// Orang yang buat order tak boleh terima order sendiri. Penghantaran siap serta-merta bila diterima.
// =========================================================================

const KERETA_MAX = 60000;
const HARIAN_MAX = 30;
const KEDAI = ['Nasi Lemak Kak Esah', 'Mamak Ali Tarik', 'Ayam Gorengan Pak Mail', 'Roti John Hujung Kampung',
    'Mee Goreng Mamak Bistro', 'Kopitiam Kak Ros', 'Bubur Ayam Seberang Jalan', 'Pizza Kampung Mangga'];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const hari = () => myt().day;

function ada(user) {
    if (!user.inventory?.phone) return 'Perlukan telefon dulu. Beli di `.device`.';
    const v = VEHICLES.find(x => x.name === user.vehicle?.name);
    if (!v || v.price > KERETA_MAX) return `Perlukan kereta murah (RM ${KERETA_MAX.toLocaleString('en-US')} ke bawah). Beli di \`.showroom\`.`;
    return null;
}

export async function getOrders() {
    const tetingkap = Math.floor(Date.now() / (3 * 60e3));
    let data = await store.get('kerja', 'orders', null);
    if (!data || data.tetingkap !== tetingkap) {
        const bandar = Object.keys(BANDAR);
        const senarai = Array.from({ length: 8 }, (_, i) => {
            const dari = pick(bandar);
            let ke = pick(bandar); while (ke === dari) ke = pick(bandar);
            const jarak = Math.round(jarakKm(dari, ke) * 1.3 * 10) / 10;
            const ride = i % 2 === 0;
            return ride
                ? { id: `G${tetingkap % 1000}${i}`, jenis: 'grab', brand: 'GrabFood', kedai: 'Penumpang', dari, ke, jarak, bayar: Math.round(5 + jarak * 1.6 + rnd(0, 3)), tuntut: null, pemesan: null }
                : { id: `F${tetingkap % 1000}${i}`, jenis: 'food', brand: 'foodpanda', kedai: pick(KEDAI), dari, ke, jarak, bayar: Math.round(6 + jarak * 1.8 + rnd(0, 4)), tuntut: null, pemesan: null };
        });
        senarai.forEach(o => { o.eta = Math.round(o.jarak * 2) + 3 + Math.floor(rnd(0, 4)); o.rating = (4.4 + rnd(0, 0.6)).toFixed(1); });
        data = { tetingkap, senarai };
        await store.set('kerja', 'orders', data);
    }
    return data;
}

export default {
    name: 'kerja_halal',
    alias: ['job', 'grab', 'foodpanda', 'terima'],
    category: 'kerja',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const cmd = teks.trim().split(/\s+/)[0].slice(1).toLowerCase();
        user.stats = user.stats || {};

        const kerja = await store.get('kerja', 'pekerja', {});
        const diri = kerja[sender] || { jenis: null, job: null, harian: { day: '', n: 0 } };
        if (diri.harian.day !== hari()) diri.harian = { day: hari(), n: 0 };

        if (cmd === 'job') {
            const sub = (args[0] || '').toLowerCase();
            if (sub === 'buat') {
                const kerjaPilih = KERJA.find(x => x.id === (args[1] || '').toLowerCase());
                if (!kerjaPilih) return reply('❌ Kerja tu tak ada. Taip `.job` untuk senarai.');
                const gagal = syaratGagal(kerjaPilih, user);
                if (gagal) return reply(`❌ ${gagal}`);
                const sua = suasana();
                const kunci = `jobcd_${kerjaPilih.id}`;
                const tinggal = (user.stats[kunci] || 0) + cdMinit(kerjaPilih, sua) * 60e3 - Date.now();
                if (tinggal > 0) return reply(`⏳ Kerja ${kerjaPilih.nama} belum boleh. Tunggu ${Math.ceil(tinggal / 60e3)} minit.`);
                const { gaji: gajiAsas, tip } = kiraGaji(kerjaPilih, sua);
                const gaji = Math.round(gajiAsas * mulUntuk(kerjaPilih.id));
                user.wallet = (user.wallet || 0) + gaji + tip;
                user.xp = (user.xp || 0) + 5;
                user.stats[kunci] = Date.now();
                await db.saveUser(user);
                const suasanaTxt = sua.label.length ? `\nSuasana: ${sua.label.join(' · ')}` : '';
                return reply(`💼 *${kerjaPilih.nama}* siap!\nGaji: ${rp(gaji)}${tip ? `\n🎁 Tip: ${rp(tip)}` : ''}${suasanaTxt}\nBaki: ${rp(user.wallet)}`);
            }
            if (!sub) {
                const sua = suasana();
                const senarai = KERJA.map(k => `• \`.job buat ${k.id}\` — ${k.nama}\n   RM ${k.gaji[0]}–${k.gaji[1]} · cd ${cdMinit(k, sua)} min${k.syarat ? ' · ' + (k.syarat === 'kereta' ? 'perlu kereta' : 'perlu level 2') : ''}`);
                const rider = diri.jenis ? `\n🛵 Kerja rider: *${diri.jenis === 'grab' ? 'GRAB' : 'FOODPANDA'}* (hari ini ${diri.harian.n}/${HARIAN_MAX})` : '\n🛵 Rider: `.job apply grab` atau `.job apply food`';
                return reply(`💼 *SENARAI KERJA*\n\n${senarai.join('\n')}\n\nSuasana sekarang: ${sua.label.length ? sua.label.join(' · ') : 'biasa'}${rider}`);
            }
            if (sub === 'apply') {
                const jenis = (args[1] || '').toLowerCase();
                if (!['grab', 'food'].includes(jenis)) return reply('Format: `.job apply grab` (penumpang) atau `.job apply food` (makanan).');
                const err = ada(user);
                if (err) return reply(`❌ ${err}`);
                diri.jenis = jenis;
                kerja[sender] = diri;
                await store.set('kerja', 'pekerja', kerja);
                return reply(`✅ Kau dah jadi rider *${jenis === 'grab' ? 'GRAB (penumpang)' : 'FOODPANDA (makanan)'}*.\nTaip \`.${jenis === 'grab' ? 'grab' : 'foodpanda'}\` untuk tengok order.`);
            }
            if (!diri.jenis) return reply('Belum kerja. Mohon dengan `.job apply grab` atau `.job apply food`.');
            return reply(`🛵 Kerja kau: *${diri.jenis === 'grab' ? 'GRAB' : 'FOODPANDA'}*\nHari ini: ${diri.harian.n}/${HARIAN_MAX} order siap.`);
        }

        if (cmd === 'grab' || cmd === 'foodpanda') {
            const jenis = cmd === 'grab' ? 'grab' : 'food';
            const err = ada(user);
            if (err) return reply(`❌ ${err}`);
            if (diri.jenis !== jenis) return reply(`❌ Kau belum jadi rider ${jenis === 'grab' ? 'GRAB' : 'FOODPANDA'}. Taip \`.job apply ${jenis}\` dulu.`);
            const data = await getOrders();
            const senarai = data.senarai.filter(o => o.jenis === jenis && !o.tuntut).sort(() => Math.random() - 0.5).slice(0, 4);
            const img = renderAppOrders(jenis === 'grab' ? 'GrabFood' : 'foodpanda', senarai, senarai.length ? 'Pilih satu, taip .terima [id]' : 'Tunggu order baharu');
            return sock.sendMessage(jid, { image: img, caption: `${jenis === 'grab' ? 'GRAB' : 'FOODPANDA'}: ${senarai.length} order tersedia` }, { quoted: m });
        }

        if (cmd === 'terima') {
            if (!diri.jenis) return reply('Belum kerja. Mohon dengan `.job apply grab` atau `.job apply food`.');
            if (diri.harian.n >= HARIAN_MAX) return reply(`Had ${HARIAN_MAX} order sehari dah penuh. Esok boleh ambil lagi.`);
            const err = ada(user);
            if (err) return reply(`❌ ${err}`);
            const data = await getOrders();
            const o = data.senarai.find(x => x.id === args[0]);
            if (!o) return reply('❌ Order tu tak wujud. Taip `.grab` atau `.foodpanda` untuk senarai.');
            if (o.jenis !== diri.jenis) return reply('❌ Order tu bukan untuk kerja kau.');
            if (o.tuntut) return reply('❌ Order tu dah diambil.');
            if (o.pemesan === sender) return reply('😅 Awak tak boleh terima order sendiri.');
            o.tuntut = sender;
            await store.set('kerja', 'orders', data);
            const bayar = Math.round((o.bayar + Math.round(rnd(0, 4))) * mulUntuk(o.jenis === 'grab' ? 'teksi' : 'kafe'));
            user.wallet = (user.wallet || 0) + bayar;
            diri.harian.n += 1;
            kerja[sender] = diri;
            await store.set('kerja', 'pekerja', kerja);
            await db.saveUser(user);
            return reply(`✅ *${o.jenis === 'grab' ? 'Penumpang dihantar' : 'Makanan dihantar'}!* [${o.id}]\n${o.dari} → ${o.ke} (${o.jarak} km)\nBayaran: ${rp(bayar)}\nBaki: ${rp(user.wallet)}`);
        }
        return reply('❌ Arahan tak dikenali. Taip `.job` untuk mula.');
    }
};
