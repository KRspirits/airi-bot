import * as store from './store.js';
import { pancingDB } from '../plugins/mancing.js';
import { ownedNames } from './fish.js';
import { myt } from './util.js';
import { db } from './database.js';

// =========================================================================
// 🏅 PAPAN MINGGUAN. Tiga kategori: tangkapan, kekayaan, aktiviti.
// Pemenang minggu lepas diumumkan setiap Ahad sekali sahaja.
// =========================================================================

const minggu = () => {
    const d = new Date(Date.now() + 8 * 3600e3);
    const hujung = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const hari = (hujung.getUTCDay() + 6) % 7; // Isnin = 0
    hujung.setUTCDate(hujung.getUTCDate() - hari);
    return hujung.toISOString().slice(0, 10); // tarikh Isnin minggu ini
};

async function kira() {
    const semua = await db.getAllUsers();
    const tangkapan = [], kekayaan = [], aktiviti = [];
    for (const u of semua) {
        const id = u.id;
        const jumlahIkan = pancingDB[id] ? ownedNames(pancingDB[id]).size : 0;
        tangkapan.push({ nama: u.name || id.split('@')[0], nilai: jumlahIkan });
        kekayaan.push({ nama: u.name || id.split('@')[0], nilai: (u.wallet || 0) + (u.bank || 0) });
        const aktif = Object.values(u.stats || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        aktiviti.push({ nama: u.name || id.split('@')[0], nilai: aktif });
    }
    const atas = arr => arr.filter(x => x.nilai > 0).sort((a, b) => b.nilai - a.nilai).slice(0, 3);
    return { tangkapan: atas(tangkapan), kekayaan: atas(kekayaan), aktiviti: atas(aktiviti) };
}

export async function papanSemasa() { return kira(); }

export function teksPapan(data, tajuk) {
    const baris = (arr, unit) => arr.length ? arr.map((x, i) => `${['🥇', '🥈', '🥉'][i]} ${x.nama} · ${unit(x.nilai)}`).join('\n') : 'Belum ada data';
    return `🏅 *${tajuk}*\n\n🎣 Tangkapan (spesies)\n${baris(data.tangkapan, n => `${n} spesies`)}\n\n💰 Kekayaan\n${baris(data.kekayaan, n => `RM ${n.toLocaleString('en-US')}`)}\n\n⚡ Aktiviti\n${baris(data.aktiviti, n => `${n} tindakan`)}`;
}

/** Umum papan minggu lepas sekali setiap Ahad. Simpan ringkasan untuk rujukan. */
export async function weeklyTick(sock, groups) {
    const d = new Date(Date.now() + 8 * 3600e3);
    if (d.getUTCDay() !== 0) return; // Ahad sahaja
    const kunciMinggu = minggu();
    if (await store.get('papan', 'last', '') === kunciMinggu) return;
    const data = await kira();
    await store.set('papan', `minggu_${kunciMinggu}`, data);
    await store.set('papan', 'last', kunciMinggu);
    const teks = teksPapan(data, 'PAPAN MINGGUAN · MINGGU INI');
    for (const g of groups) await sock.sendMessage(g, { text: teks }).catch(() => {});
}
