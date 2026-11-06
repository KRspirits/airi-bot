import { withUserLock } from './money.js';

// Had pindahan: minimum RM1, maksimum RM10,000,000 sekali pindah.
export const PINDAH_MAX = 10000000;

/** Sahkan jumlah pindahan. Pulang null kalau sah, atau mesej ralat. */
export function sahkanJumlah(jumlah, baki) {
    if (!Number.isInteger(jumlah) || jumlah <= 0) return 'Jumlah mesti nombor bulat dan lebih dari RM0.';
    if (jumlah > PINDAH_MAX) return `Had satu kali pindah ialah RM ${PINDAH_MAX.toLocaleString('en-US')}.`;
    if (jumlah > (Number(baki) || 0)) return `Duit poket tak cukup. Kau ada RM ${(Number(baki) || 0).toLocaleString('en-US')}.`;
    return null;
}

/** Pindah duit dari pengirim ke penerima. Penerima dibaca semula supaya data tak lapuk. */
export async function pindahDuit(db, pengirim, kepadaJid, jumlah) {
    const ralat = sahkanJumlah(jumlah, pengirim.wallet);
    if (ralat) return { ok: false, mesej: ralat };
    if (pengirim.id === kepadaJid) return { ok: false, mesej: 'Tak boleh pindah duit kepada diri sendiri.' };
    return withUserLock(pengirim.id, async () => {
        const penerima = await db.getUser(kepadaJid);
        pengirim.wallet = (pengirim.wallet || 0) - jumlah;
        penerima.wallet = (penerima.wallet || 0) + jumlah;
        await db.saveUser(penerima);
        await db.saveUser(pengirim);
        return { ok: true, penerima };
    });
}
