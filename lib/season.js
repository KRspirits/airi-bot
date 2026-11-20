import * as store from './store.js';
import { freshUser } from './database.js';
import { pancingDB, savePancingDB } from '../plugins/mancing.js';
import { networth } from './util.js';

// Liga mingguan: ranking ikut PERTAMBAHAN aset sejak musim bermula (adil untuk pemain baru).
export const REWARDS = [100000, 50000, 25000];
async function load() { const s = await store.get('season', 'base', null); return s ? JSON.parse(s) : { t: Date.now(), nets: {} }; }
const save = b => store.set('season', 'base', JSON.stringify(b));

export async function standings(users) {
    const b = await load(); let changed = false;
    for (const u of users) if (b.nets[u.id] === undefined) { b.nets[u.id] = networth(u); changed = true; }
    if (changed) await save(b);
    return users.map(u => ({ id: u.id, name: u.name, gain: networth(u) - b.nets[u.id] })).sort((a, c) => c.gain - a.gain);
}
export async function endSeason(db) {
    const users = await db.getAllUsers(), st = await standings(users), winners = [];
    for (let i = 0; i < REWARDS.length; i++) {
        const w = st[i]; if (!w || w.gain <= 0) break;
        const u = users.find(x => x.id === w.id); u.wallet = (u.wallet || 0) + REWARDS[i];
        if (i === 0 && !u.badges.includes('Juara Musim')) u.badges.push('Juara Musim');
        await db.saveUser(u); winners.push({ ...w, reward: REWARDS[i] });
    }
    const b = { t: Date.now(), nets: {} };
    for (const u of await db.getAllUsers()) b.nets[u.id] = networth(u);
    await save(b);
    // Simpan sejarah musim (20 musim terakhir) supaya pemenang lama tak hilang
    const sejarah = await seasonHistory();
    sejarah.unshift({ t: Date.now(), winners: winners.map(w => ({ name: w.name, gain: w.gain, reward: w.reward })), top: st.slice(0, 3).map(w => ({ name: w.name, gain: w.gain })) });
    await store.set('season', 'history', sejarah.slice(0, 20));
    return { winners, top: st.slice(0, 5), semua: st };
}

export async function seasonHistory() {
    const h = await store.get('season', 'history', []);
    return Array.isArray(h) ? h : [];
}

// RESET SEASON PENUH: kosongkan semua progres pemain (duit, bank, inventori, kenderaan, koleksi ikan).
// Pemenang top 3 dapat badge kekal untuk musim ni. Sejarah disimpan sebagai ringkasan.
// Nombor musim semasa. Season 0 = pra-musim (tak masuk Hall of Fame, tak beri lencana).
export async function getNomorMusim() {
    const n = await store.get('season', 'nomor', 0);
    return Number(n) || 0;
}

export async function wipeSeason(db) {
    const users = await db.getAllUsers();
    const st = await standings(users);
    const musimTamat = await getNomorMusim();
    const berkira = musimTamat >= 1;               // Season 0 tak dikira
    const top = st.filter(w => w.gain > 0).slice(0, 3);

    if (berkira) {
        const sejarah = await seasonHistory();
        sejarah.unshift({
            t: Date.now(), musim: musimTamat, reset: true,
            winners: top.map(w => ({ name: w.name, gain: w.gain, reward: 0 })),
            top: st.slice(0, 3).map(w => ({ name: w.name, gain: w.gain })),
        });
        await store.set('season', 'history', sejarah.slice(0, 20));
    }

    // Lencana: Finisher untuk semua yang aktif, Champion/2nd/3rd untuk top 3
    const label = ['Champion', '2nd Place', '3rd Place'];
    const badgeById = new Map(top.map((w, i) => [w.id, `${label[i]} S${musimTamat}`]));
    const finisher = new Set(st.filter(w => w.gain > 0).map(w => w.id));
    for (const u of users) {
        const kekal = Array.isArray(u.badges) ? [...u.badges] : [];
        if (berkira && finisher.has(u.id) && !kekal.includes(`Finisher S${musimTamat}`)) kekal.push(`Finisher S${musimTamat}`);
        const b = badgeById.get(u.id);
        if (berkira && b && !kekal.includes(b)) kekal.push(b);
        const baru = freshUser(u.id, u.name);
        baru.wallet = 0;
        baru.badges = kekal;
        baru.title = u.title && kekal.includes(u.title) ? u.title : null;
        await db.saveUser(baru);
    }

    for (const k of Object.keys(pancingDB)) delete pancingDB[k];
    await savePancingDB();
    await store.set('season', 'base', JSON.stringify({ t: Date.now(), nets: {} }));
    const musimBaru = musimTamat + 1;
    await store.set('season', 'nomor', musimBaru);
    return { musim: musimBaru, tamat: musimTamat, berkira, winners: top.map(w => ({ name: w.name, gain: w.gain })), users: users.length };
}
