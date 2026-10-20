// =========================================================================
// 💰 KUNCI DUIT PER PEMAIN. Satu command sahaja untuk satu pemain pada satu masa.
// Tanpa ni, dua command serentak boleh baca baki yang sama, dan salah satu
// perubahan (contoh: tolak taruhan atau tambah hadiah) akan tertimpa.
// =========================================================================

const locks = new Map(); // id -> hujung rantai

/** Jalankan fn secara bersiri untuk id yang sama. Untuk id berbeza, berjalan serentak. */
export async function withUserLock(id, fn) {
    const key = String(id || 'anon');
    const prev = locks.get(key) || Promise.resolve();
    let release;
    const current = new Promise(r => { release = r; });
    const tail = prev.then(() => current);
    locks.set(key, tail);
    await prev;
    try {
        return await fn();
    } finally {
        release();
        if (locks.get(key) === tail) locks.delete(key);
    }
}

/** Baki masa cooldown (ms). 0 bermakna boleh guna sekarang. */
export function cooldownLeft(lastAt, ms) {
    return Math.max(0, ms - (Date.now() - (Number(lastAt) || 0)));
}
