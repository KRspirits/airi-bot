import { VEHICLES } from './gamedata.js';

// =========================================================================
// 🚗 BUFF KENDERAAN. Kenderaan yang dimiliki memberi kesan kecil:
//   - Kereta: pendapatan kerja app (Grab, foodpanda, kurier) +10%
//   - Motor: pendapatan kerja app +5%
//   - Kenderaan bernilai RM50,000 ke atas: risiko jenayah -5%
// Kenderaan yang bukan dari showroom (contoh Motosikal Asas) tak dapat buff.
// =========================================================================

export function buffKenderaan(user) {
    const nama = user?.vehicle?.name;
    if (!nama) return {};
    const info = VEHICLES.find(v => v.name === nama);
    if (!info) return {};
    const buff = {};
    if (info.type === 'Kereta') buff.app = 1.10;
    else if (info.type === 'Motor') buff.app = 1.05;
    if (info.price >= 50000) buff.jenayah = -0.05;
    return buff;
}
