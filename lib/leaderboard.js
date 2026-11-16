import { panelCard } from './cards.js';
import * as store from './store.js';
import { pancingDB } from '../plugins/mancing.js';
import { ownedNames } from './fish.js';
import { myt } from './util.js';
import { db } from './database.js';
import { pemainGroup } from './groupusers.js';

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

async function kira(sock, jid) {
    const semua = await pemainGroup(sock, jid, await db.getAllUsers());
    const tangkapan = [], kekayaan = [], aktiviti = [];
    for (const u of semua) {
        const id = u.id;
        const jumlahIkan = pancingDB[id] ? ownedNames(pancingDB[id]).size : 0;
        tangkapan.push({ id, nama: u.name || id.split('@')[0], nilai: jumlahIkan });
        kekayaan.push({ id, nama: u.name || id.split('@')[0], nilai: (u.wallet || 0) + (u.bank || 0) });
        // kira tindakan sahaja: buang cap masa (nombor besar) dan kunci dalaman
        const aktif = Object.entries(u.stats || {}).reduce((a, [k, b]) => a + (typeof b === 'number' && b < 1e9 && !/^(kad_|last|t_|tarikh|_)/.test(k) ? b : 0), 0);
        aktiviti.push({ id, nama: u.name || id.split('@')[0], nilai: aktif });
    }
    const atas = arr => arr.filter(x => x.nilai > 0).sort((a, b) => b.nilai - a.nilai).slice(0, 3);
    return { tangkapan: atas(tangkapan), kekayaan: atas(kekayaan), aktiviti: atas(aktiviti) };
}

export async function papanSemasa(sock, jid) { return kira(sock, jid); }

export function teksPapan(data, tajuk) {
    const baris = (arr, unit) => arr.length ? arr.map((x, i) => `${['🥇', '🥈', '🥉'][i]} ${x.nama} · ${unit(x.nilai)}`).join('\n') : 'Belum ada data';
    return `🏅 *${tajuk}*\n\n🎣 Tangkapan (spesies)\n${baris(data.tangkapan, n => `${n} spesies`)}\n\n💰 Kekayaan\n${baris(data.kekayaan, n => 'RM ' + Math.round(Number(n) || 0).toLocaleString('en-US'))}\n\n⚡ Aktiviti\n${baris(data.aktiviti, n => `${n} tindakan`)}`;
}

/** Umum papan minggu lepas sekali setiap Ahad. Simpan ringkasan untuk rujukan. */
export async function weeklyTick(sock, groups) {
    for (const g of groups) await weeklyTickGroup(sock, g, [g]);
}

async function weeklyTickGroup(sock, g, groups) {
    const d = new Date(Date.now() + 8 * 3600e3);
    if (d.getUTCDay() !== 0) return; // Ahad sahaja
    const kunciMinggu = minggu();
    if (await store.get('papan', `last_${g}`, '') === kunciMinggu) return;
    const data = await kira(sock, g);
    await store.set('papan', `minggu_${kunciMinggu}_${g}`, data);
    await store.set('papan', `last_${g}`, kunciMinggu);
    // Juara minggu: badge untuk pemenang setiap kategori
    const kategori = ['tangkapan', 'kekayaan', 'aktiviti'];
    for (const k of kategori) {
        const juara = data[k]?.[0];
        if (!juara?.id) continue;
        const u = await db.getUser(juara.id);
        u.badges = Array.isArray(u.badges) ? u.badges : [];
        const badge = `Juara Minggu (${k}) ${kunciMinggu}`;
        if (!u.badges.includes(badge)) { u.badges.push(badge); await db.saveUser(u); }
    }
    const teks = teksPapan(data, 'PAPAN MINGGUAN · MINGGU INI');
    const juara = [data.tangkapan[0], data.kekayaan[0], data.aktiviti[0]].filter(Boolean);
    const kad = await panelCard({
        kicker: 'JUARA MINGGU',
        title: 'PAPAN MINGGUAN',
        lines: [
            `🎣 Tangkapan: ${data.tangkapan[0]?.nama || 'Tiada'}`,
            `💰 Kekayaan: ${data.kekayaan[0]?.nama || 'Tiada'}`,
            `⚡ Aktiviti: ${data.aktiviti[0]?.nama || 'Tiada'}`,
        ],
        accent: '#fbbf24',
        big: juara.length ? 'JUARA' : 'MINGGU INI',
        bigLabel: 'PEMENANG',
        footerText: 'Badge Juara Minggu dah diberikan',
    }).catch(() => null);
    for (const g of groups) {
        if (kad) await sock.sendMessage(g, { image: kad, caption: teks }).catch(() => {});
        else await sock.sendMessage(g, { text: teks }).catch(() => {});
    }
}
