// =========================================================================
// 📱 APP TELEFON. Kerja tertentu perlukan app dipasang dalam telefon.
// Perlu telefon (.device) dulu. Pasang dengan `.app pasang [id]`.
// =========================================================================

export const APPS = {
    grab: { nama: 'GrabApp', harga: 500, ket: 'Kerja GRAB: hantar penumpang dengan kereta' },
    foodpanda: { nama: 'foodpanda', harga: 500, ket: 'Kerja FOODPANDA: hantar makanan' },
    kurier: { nama: 'Pos Laju', harga: 800, ket: 'Kerja kurier: hantar pakej dalam bandar' },
};

export const hasApp = (user, id) => !!user.apps?.[id];

/** Pasang app. Pulang { ok, mesej }. */
export async function pasangApp(db, user, id) {
    const app = APPS[id];
    if (!app) return { ok: false, mesej: 'App tu tak wujud. Taip `.app` untuk senarai.' };
    if (!user.inventory?.phone) return { ok: false, mesej: 'Beli telefon dulu di `.device`.' };
    user.apps = user.apps || {};
    if (user.apps[id]) return { ok: false, mesej: `${app.nama} dah dipasang.` };
    if ((user.wallet || 0) < app.harga) return { ok: false, mesej: `Perlu RM ${app.harga.toLocaleString('en-US')} untuk pasang ${app.nama}.` };
    user.wallet -= app.harga;
    user.apps[id] = true;
    await db.saveUser(user);
    return { ok: true, mesej: `✅ ${app.nama} dah dipasang dalam telefon.` };
}
