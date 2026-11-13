// =========================================================================
// ⭐ SATU PINTU XP. Semua XP masuk melalui beriXp(). Had 300 XP sehari setiap pemain
// (dari semua sumber digabung), supaya tak ada cara yang boleh menyerang level.
// =========================================================================

export const HAD_XP_HARIAN = 1500;

export function beriXp(user, jumlah, sebab = '') {
    const hariIni = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
    if (!user.xpHari || user.xpHari.day !== hariIni) user.xpHari = { day: hariIni, n: 0 };
    const boleh = Math.max(0, HAD_XP_HARIAN - user.xpHari.n);
    const tambah = Math.min(boleh, Math.max(0, Math.round(Number(jumlah) || 0)));
    user.xpHari.n += tambah;
    user.xp = (Number(user.xp) || 0) + tambah;
    return { tambah, sebab };
}
