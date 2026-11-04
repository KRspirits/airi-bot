import { panelCard } from './cards.js';

// =========================================================================
// 🎁 BARANG SEBENAR. Barang hasil lelongan masuk ke senarai barang pemain (bukan tunai).
// Setiap barang ada nadir, kategori, nilai asas, dan harga beli. Jualan kadar 60%-110%
// nilai asas, jadi pemain boleh untung atau rugi berbanding harga bida.
// =========================================================================

function kategoriDan(nama) {
    const n = nama.toLowerCase();
    if (/lamborghini|ducati|yacht|helikopter|drone|banglo|geran/.test(n)) return 'Kenderaan & Hartanah';
    if (/emas|berlian|jongkong|peti|cincin/.test(n)) return 'Logam & Permata';
    if (/wang tunai|cek|saham|lesen|cold wallet|btc/.test(n)) return 'Aset Kewangan';
    if (/rolex|birkin|jam|minyak|kasut|cerut|lukisan|jubah|beg/.test(n)) return 'Barang Mewah';
    if (/telefon|server|tetikus|pembesar|blueprint|kabel|skrin|bateri|kad sim/.test(n)) return 'Elektronik';
    return 'Barang Harian';
}

function nadirDari(nilai) {
    if (nilai >= 1000000) return 'LEGENDARI';
    if (nilai >= 250000) return 'EPIK';
    if (nilai >= 50000) return 'LANGKA';
    if (nilai >= 5000) return 'BIASA';
    return 'SAMPAH';
}

/** Tukar entri lelongan jadi barang pemain. */
export function toItem(loot, hargaBida) {
    return {
        id: Date.now().toString(36).slice(-6) + Math.floor(Math.random() * 99).toString(36),
        nama: loot.name,
        desc: loot.desc || '',
        nilai: Number(loot.value) || 0,
        bida: Number(hargaBida) || 0,
        kategori: loot.kind === 'vehicle' ? 'Kenderaan' : loot.kind === 'phone' ? 'Telefon' : kategoriDan(loot.name),
        kind: loot.kind || 'barang',
        ref: loot.ref || null,
        nadir: nadirDari(Number(loot.value) || 0),
        t: Date.now(),
    };
}

/** Kadar jualan rawak 60%-110% (pasaran turun naik). */
export function kadarJual() {
    return 0.6 + Math.random() * 0.5;
}

export async function kadBarang(item) {
    const bersih = item.nilai - item.bida;
    const lines = [
        `Kategori: ${item.kategori}`,
        `Nadir: ${item.nadir}`,
        `Nilai asas: RM ${item.nilai.toLocaleString('en-US')}`,
        `Harga bida: RM ${item.bida.toLocaleString('en-US')}`,
        `Bersih (ikut nilai asas): ${bersih >= 0 ? '+' : '-'}RM ${Math.abs(bersih).toLocaleString('en-US')}`,
        item.desc ? `Catatan: ${item.desc}` : '',
    ].filter(Boolean);
    return panelCard({
        kicker: 'BARANG LELONGAN',
        title: item.nama.slice(0, 40),
        lines,
        accent: item.nadir === 'LEGENDARI' ? '#fbbf24' : item.nadir === 'EPIK' ? '#c084fc' : item.nadir === 'LANGKA' ? '#38bdf8' : '#94a3b8',
        big: `RM ${item.nilai.toLocaleString('en-US')}`,
        bigLabel: 'NILAI ASAS',
        footerText: `ID ${item.id} · taip .item untuk senarai, .jual_item ${item.id} untuk jual`,
    });
}
