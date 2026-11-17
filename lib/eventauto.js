import * as store from './store.js';
import { state, saveState } from './state.js';
import { panelCard } from './cards.js';
import { isActive } from './activity.js';
import { VETO_EVENTS } from '../plugins/veto.js';

// =========================================================================
// 🎲 ACARA AUTO. Bot pilih sendiri acara dari senarai, mulakan ikut masa rawak,
// dan hantar kad yang terangkan UNTUNG dan RUGI. Acara veto (.start_event) tetap boleh
// digunakan owner, dan acara owner yang sedang berjalan tak diganggu.
// Jarak antara acara: 6-12 jam. Tempoh: 2-6 jam.
// =========================================================================

export const AUTO = {
    GOLD_RUSH: { untung: 'Jual emas, ikan, akuarium & besi dapat 3x hasil', rugi: 'Cukai 15% atas setiap hasil jualan tu' },
    FESTIVAL_IKAN: { untung: 'Jual ikan & akuarium dapat 2x hasil', rugi: 'Cukai 10% atas hasil jualan ikan' },
    HARI_JUDI_GILA: { untung: 'Menang judi (tekaan, roda, kad, dadu, peti, kupon) dapat 1.5x', rugi: 'Cukai 20% atas kemenangan judi' },
    OVERTIME_FRENZY: { untung: 'Gaji kerja dan kerja lebih masa dapat 2x', rugi: 'Cukai 10% atas gaji kerja' },
    TANAMAN_BOOM: { untung: 'Tuai tanaman dapat 2x hasil', rugi: 'Cukai 10% atas hasil tuai' },
    SPEED_DEMON: { untung: 'Hasil lumba dapat 4x', rugi: 'Cukai 20% atas hasil lumba' },
    CASINO_FIESTA: { untung: 'Kemenangan slot dapat 2x', rugi: 'Cukai 25% atas kemenangan kasino' },
};

const PANJANG_MIN = 2 * 60, PANJANG_MAX = 6 * 60;      // minit
const JARAK_MIN = 6 * 60, JARAK_MAX = 12 * 60;         // minit
const rnd = (a, b) => a + Math.random() * (b - a);

let cache = null;
async function muat() {
    if (!cache) cache = await store.get('eventauto', 'state', { seterusnya: 0 });
    return cache;
}

function kadAcara(kod, tempohJam) {
    const info = AUTO[kod];
    const v = VETO_EVENTS[kod];
    return panelCard({
        kicker: 'ACARA AUTO',
        title: v.name.replace(/[^\p{L}\p{N} ]/gu, '').trim().slice(0, 36),
        lines: [`✅ UNTUNG: ${info.untung}`, `⚠️ RUGI: ${info.rugi}`, `⏳ Tempoh: ${tempohJam} jam`],
        accent: '#fbbf24',
        big: `${tempohJam} JAM`,
        bigLabel: 'TEMPOH',
        footerText: 'Acara auto · dihantar bot sendiri',
    });
}

/** Dipanggil oleh scheduler. Mulakan acara auto bila tiba masa, dan tamatkan yang dah habis. */
export async function eventAutoTick(sock, groups) {
    await muat();
    const kini = Date.now();
    // Umum tamat guna cache sendiri, sebab activeEvent() boleh kosongkan state.event dahulu.
    if (cache.tamatAt && kini >= cache.tamatAt) {
        cache.tamatAt = 0; await store.set('eventauto', 'state', cache);
        for (const g of groups.filter(g => isActive(g, 2))) await sock.sendMessage(g, { text: '🏁 Acara auto dah tamat. Harga dan ganjaran kembali biasa.' }).catch(() => {});
    }
    if (state.event?.auto && state.event.expiresAt <= kini) { state.event = null; saveState(); }
    if (state.event) return;                         // ada acara lain (owner atau auto) sedang berjalan
    if (!cache.seterusnya) { cache.seterusnya = kini + rnd(JARAK_MIN, JARAK_MAX) * 60e3; await store.set('eventauto', 'state', cache); return; }
    if (kini < cache.seterusnya) return;

    const kodList = Object.keys(AUTO);
    const kod = kodList[Math.floor(Math.random() * kodList.length)];
    const tempohMin = Math.round(rnd(PANJANG_MIN, PANJANG_MAX));
    const tempohJam = Math.round(tempohMin / 60);
    state.event = { ...VETO_EVENTS[kod], code: kod, expiresAt: kini + tempohMin * 60e3, days: tempohMin / 1440, auto: true };
    saveState();
    cache.seterusnya = kini + rnd(JARAK_MIN, JARAK_MAX) * 60e3;
    cache.tamatAt = kini + tempohMin * 60e3;
    await store.set('eventauto', 'state', cache);
    const img = await kadAcara(kod, tempohJam);
    for (const g of groups.filter(g => isActive(g, 2))) await sock.sendMessage(g, { image: img, caption: `🎲 *${VETO_EVENTS[kod].name}* sekarang aktif untuk ${tempohJam} jam!` }).catch(() => {});
}
