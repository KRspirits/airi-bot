import { myt } from './util.js';

// Blackmarket dibuka hanya 10 malam hingga 4 pagi (masa Malaysia).
export function bmBuka(ts = Date.now()) {
    const jam = myt(ts).h;
    return jam >= 22 || jam < 4;
}

export const BM_BUKA_TEKS = 'Blackmarket buka dari 10 malam hingga 4 pagi sahaja.';
