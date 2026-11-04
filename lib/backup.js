import * as store from './store.js';
import { db } from './database.js';

// 💾 BACKUP MINGGUAN (ringkasan). Simpan 100 pemain teratas (nama, tunai, bank, bilangan badge).
// Ini BUKAN backup penuh. Untuk backup penuh, gunakan Mongo dump dari Atlas.
export async function backupMingguan() {
    const d = new Date(Date.now() + 8 * 3600e3);
    const kunci = `${d.getUTCFullYear()}-W${Math.ceil(d.getUTCDate() / 7)}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (await store.get('backup', 'last', '') === kunci) return false;
    const semua = await db.getAllUsers();
    const ringkas = semua
        .map(u => ({ id: u.id, nama: u.name || '', tunai: u.wallet || 0, bank: u.bank || 0, badge: (u.badges || []).length }))
        .sort((a, b) => (b.tunai + b.bank) - (a.tunai + a.bank))
        .slice(0, 100);
    await store.set('backup', kunci, { t: Date.now(), jumlahPemain: semua.length, ringkas });
    await store.set('backup', 'last', kunci);
    return true;
}
