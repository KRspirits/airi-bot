import * as store from './store.js';
import { myt } from './util.js';

// =========================================================================
// 🎯 QUEST HARIAN. 3 quest setiap hari. Progres dikira dari command yang pemain guna.
// Setiap quest sekali sahaja untuk setiap hari. Hadiah dituntut dengan .misi_harian claim.
// =========================================================================

export const QUEST = [
    { id: 'kerja3', ket: 'Guna .kerja 3 kali', cmd: ['kerja'], n: 3, hadiah: 3000 },
    { id: 'judi5', ket: 'Main 5 permainan judi', cmd: ['kupon', 'roda', 'tekaan', 'kad_besar', 'dadu7', 'peti', 'tarung'], n: 5, hadiah: 4000 },
    { id: 'mancing5', ket: 'Mancing 5 kali', cmd: ['mancing'], n: 5, hadiah: 3500 },
];

const kunci = jid => `${myt().day}:${jid}`;

/** Panggil dari dispatch setiap command. Tambah progres quest yang berkaitan. */
export async function trackQuest(jid, cmd) {
    const sebut = String(cmd || '').toLowerCase();
    const padan = QUEST.filter(q => q.cmd.includes(sebut));
    if (!padan.length) return;
    const k = kunci(jid);
    const data = await store.get('quest', k, {});
    for (const q of padan) data[q.id] = Math.min(q.n, (data[q.id] || 0) + 1);
    await store.set('quest', k, data);
}

export async function progres(jid) {
    return store.get('quest', kunci(jid), {});
}
