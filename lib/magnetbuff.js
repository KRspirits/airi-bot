// =========================================================================
// 🧲 MAGNET. Tahap magnet tambah hasil mancing, dan kurangkan hasil jala.
// Mancing: x(1 + 0.25 x (mult-1)). Jala: x(1 - 0.04 x (mult-1)), tak bawah 0.6.
// Nilai mult sama dengan jadual di plugins/magnet.js.
// =========================================================================

const MULT = { 1: 1.0, 2: 1.5, 3: 2.2, 4: 3.5, 5: 5.0 };

export function multMagnet(user) {
    return MULT[user?.magnet?.tier || 1] || 1;
}
export function penggandaMancing(user) {
    return 1 + 0.25 * (multMagnet(user) - 1);
}
export function penggandaJala(user) {
    return Math.max(0.6, 1 - 0.04 * (multMagnet(user) - 1));
}
