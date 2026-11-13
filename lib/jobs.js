import { myt } from './util.js';
import { VEHICLES } from './gamedata.js';

// =========================================================================
// 💼 KERJA BIASA (berdiri sendiri) + SUASANA MALAYSIA.
// Cuaca hujan, waktu sibuk, waktu malam, jem, dan tip rawak mengubah gaji dan cooldown.
// =========================================================================

export const KERJA = [
    { id: 'runcit', nama: 'Kedai Runcit', gaji: [80, 220], cd: 2, ket: 'Jaga kaunter kedai runcit kampung' },
    { id: 'kafe', nama: 'Pembantu Kafe', gaji: [90, 260], cd: 3, ket: 'Hantar kopi dan kemas meja' },
    { id: 'cuci', nama: 'Cuci Kereta', gaji: [120, 300], cd: 3, ket: 'Cuci kereta pelanggan di hujung jalan' },
    { id: 'kebun', nama: 'Kebun Kampung', gaji: [100, 350], cd: 4, ket: 'Siram dan kutip sayur di kebun' },
    { id: 'gerai', nama: 'Jaga Gerai Pasar Malam', gaji: [150, 400], cd: 5, ket: 'Tolong jaga gerai malam' },
    { id: 'keselamatan', nama: 'Pengawal Keselamatan', gaji: [180, 380], cd: 6, syarat: 'level2', ket: 'Jaga pintu bangunan (level 2)' },
    { id: 'teksi', nama: 'Pemandu Teksi', gaji: [200, 500], cd: 8, syarat: 'kereta', ket: 'Bawa penumpang (perlu kereta)' },
    { id: 'kurier', nama: 'Pos Laju (Real Life)', gaji: [200, 450], cd: 5, syarat: 'kereta', app: 'kurier', ket: 'Hantar pakej dari depot ke rumah pelanggan dalam bandar (perlu kereta & app)' },
];

/** Suasana semasa. Hujan tukar setiap 30 minit, tetap untuk tetingkap masa yang sama. */
export function suasana(ts = Date.now()) {
    const jam = myt(ts).h;
    const sibuk = (jam >= 12 && jam < 14) || (jam >= 17 && jam < 20);
    const malam = jam >= 0 && jam < 6;
    const tetingkap = Math.floor(ts / (30 * 60e3));
    const hujan = (tetingkap * 7919) % 100 < 25;
    const pengganda = (sibuk ? 1.15 : 1) * (malam ? 1.10 : 1) * (hujan ? 1.20 : 1);
    const label = [sibuk && '🍱 Waktu sibuk', malam && '🌙 Waktu malam', hujan && '🌧️ Hujan (gaji naik, jem)'].filter(Boolean);
    return { sibuk, malam, hujan, pengganda, label, cdTambah: hujan ? 1 : 0 };
}

/** Kira gaji sebenar: julat asas x suasana + tip rawak 10%. Pure, boleh diuji. */
export function kiraGaji(kerja, sua, rand = Math.random) {
    const [min, max] = kerja.gaji;
    const asas = min + rand() * (max - min);
    const tip = rand() < 0.10 ? Math.round(5 + rand() * 25) : 0;
    return { gaji: Math.round(asas * sua.pengganda), tip };
}

export function cdMinit(kerja, sua) {
    return kerja.cd + sua.cdTambah;
}

/** Semak syarat kerja. Pulang null kalau layak, atau mesej kenapa tak layak. */
export function syaratGagal(kerja, user) {
    if (kerja.syarat === 'level2' && (Number(user.xp) || 0) < 200) return 'Perlukan level 2 (200 XP). Kumpul XP dengan `.kerja` dan `.daily`.';
    if (kerja.syarat === 'kereta') {
        const ada = VEHICLES.find(v => v.name === user.vehicle?.name);
        if (!ada) return 'Perlukan kereta. Beli di `.showroom` dulu.';
    }
    return null;
}
