import { ringkasanTick } from './ringkasan.js';
import { eventAutoTick } from './eventauto.js';
import { musimTick } from './musimkerja.js';
import { tickMarket } from '../plugins/pasaran.js';
import { isActive, pengirimAktif } from './activity.js';
import * as store from './store.js';
import { hariKhas } from './calendar.js';
import { weeklyTick } from './leaderboard.js';
import { backupMingguan } from './backup.js';
import { line } from './airi_lines.js';
import { config } from '../config.js';
import { state, saveState, purgeActive, activeEvent } from './state.js';
import { myt, pick } from './util.js';
import { sendCard } from './render.js';
import { speak } from './voice.js';
import { makeBulletin } from './news.js';
import { endSeason } from './season.js';
import * as mythic from './mythic.js';
import { db } from './database.js';

// Penjadual: semua tugas berkala di satu tempat. Dipanggil SEKALI sahaja dari index.js.
// Guna getSock() supaya sentiasa pakai soket terkini selepas reconnect.
let started = false;
const G = () => state.groups.slice();
const safe = async (name, fn) => { try { await fn(); } catch (e) { console.error(`[SCHED ${name}]`, e.message); } };

async function purgeTick(sock) {
    const t = myt(), end = state.purgeUntil || 0;
    if (config.purgeAuto && t.dow === 5 && t.h === 21 && state.lastPurgeDay !== t.day && !purgeActive()) {
        state.lastPurgeDay = t.day; state.purgeUntil = Date.now() + 3600e3; state.purgeEndPending = true; saveState();
        for (const g of G()) {
            await sendCard(sock, g, null, 'panelCard', {
                kicker: 'HARI PEMBERSIHAN', title: 'Polis cuti selama SEJAM!', accent: '#fb7185', big: '1 JAM', bigLabel: 'JENAYAH BEBAS',
                lines: ['Tiada lokap untuk semua jenayah', 'Ganjaran jenayah +50%', 'Berhati-hati, kawan pun boleh jadi musuh!'], footerText: 'Bermula sekarang!'
            }, '🔥 *HARI PEMBERSIHAN BERMULA!* Polis cuti sejam. Jenayah bebas, ganjaran +50%!');
            if (config.voice) await speak(sock, g, 'purge').catch(() => {});
        }
    }
    if (state.purgeEndPending && end && Date.now() > end) {
        state.purgeEndPending = false; saveState();
        for (const g of G()) await sock.sendMessage(g, { text: '🕊️ *Hari Pembersihan dah habis.* Polis dah masuk kerja balik. Semua boleh tarik nafas lega.' }).catch(() => {});
    }
}

async function bulletinTick(sock) {
    const t = myt();
    if (t.h !== 22 || state.lastBulletinDay === t.day) return;
    state.lastBulletinDay = t.day; saveState();
    for (const g of G()) {
        const data = await makeBulletin(db, g);
        await sendCard(sock, g, null, 'newsCard', data, `📰 *THE AIRI TIMES* | ${data.headline}`);
        if (config.voice) await speak(sock, g, 'eventStart').catch(() => {});
    }
}

async function seasonTick(sock) {
    const t = myt();
    if (t.dow !== 0 || t.h !== 23 || state.lastSeasonDay === t.day) return;
    state.lastSeasonDay = t.day; saveState();
    const res = await endSeason(db);
    if (!res.top.length) return;
    for (const g of G()) {
        await sendCard(sock, g, null, 'topCard', {
            title: 'LIGA TAMAT!', subtitle: 'Juara mingguan Airi\'s Corner', accent: '#fbbf24',
            rows: res.top.map((r, i) => ({ name: r.name, sub: i < 3 && r.gain > 0 ? `Hadiah RM ${[100000, 50000, 25000][i].toLocaleString('en-US')}` : '', value: (r.gain >= 0 ? '+' : '-') + 'RM ' + Math.abs(Math.round(r.gain)).toLocaleString('en-US') }))
        }, '🏆 *LIGA MINGGUAN TAMAT!* Tahniah kepada semua juara. Musim baru bermula sekarang!');
    }
}

async function mythicTick(sock) {
    const tide = activeEvent()?.code === 'MYTHIC_TIDE';
    // Mitos jarang: minimum 3 jam (kecuali MYTHIC_TIDE), dan hanya 35% peluang bila tiba masa.
    const every = Math.max(tide ? 60 : 180, tide ? Math.round(config.mythicEveryMin / 5) : config.mythicEveryMin) * 60e3;
    const aktif = G().filter(g => isActive(g, 2));
    if (!aktif.length || Date.now() - (state.lastMythicAt || 0) < every) return;
    state.lastMythicAt = Date.now(); saveState();
    if (!tide && Math.random() > 0.35) return;
    await mythic.trigger(sock, pick(aktif));
}

// Acara rawak 12 minit (dari index.js asal), kini guna senarai grup yang disimpan.
async function randomEventTick(sock) {
    const groups = G().filter(g => isActive(g, 2));
    if (!groups.length) { console.log('[ACARA] tiada group aktif (perlu 2 pengirim dalam 30 minit)'); return; }
    const target = pick(groups), rng = Math.random();
    if (rng < 0.2) return (await import('../plugins/kutip.js')).triggerSpeedDrop(sock, target);
    if (rng < 0.4) return (await import('../plugins/bida.js')).triggerRandomAuction(sock, target);
    // Kolam pemain: ahli group + pengirim aktif (termasuk yang belum pernah guna command).
    const meta = await sock.groupMetadata(target).catch(() => null);
    const ahli = meta?.participants ? meta.participants.map(p => p.id) : [];
    const aktif = pengirimAktif(target);
    const semua = [...new Set([...ahli, ...aktif])];
    const { RANDOM_EVENTS } = await import('./randomEvents.js');
    const pool = (await db.getAllUsers()).filter(u => semua.includes(u.id));
    const dalamPool = new Set(pool.map(u => u.id));
    for (const id of aktif) {
        if (dalamPool.has(id)) continue;
        const baru = await db.getUser(id, id.split('@')[0]).catch(() => null);
        if (baru) { pool.push(baru); dalamPool.add(id); }
    }
    if (!pool.length) { console.log('[ACARA] kolam pemain kosong untuk', target.slice(0, 15)); return; }
    const u = pick(pool), ev = pick(RANDOM_EVENTS), n = Math.floor(Math.random() * (ev.max - ev.min + 1)) + ev.min, win = ev.type === 'untung';
    u.wallet = win ? u.wallet + n : Math.max(0, u.wallet - n); await db.saveUser(u);
    await sock.sendMessage(target, {
        text: `┌───「 ${win ? '🎁 𝗥𝗘𝗭𝗘𝗞𝗜 𝗥𝗔𝗪𝗔𝗞' : '💀 𝗕𝗘𝗡𝗖𝗔𝗡𝗔 𝗥𝗔𝗪𝗔𝗞'} 」\n├ 👤 @${u.id.split('@')[0]}\n├ 📝 ${ev.task}\n├ ${win ? '💵 Untung: +' : '💸 Rugi: -'}RM ${n.toLocaleString('en-US')}\n└───────────────────────────\n💬 𝗔𝗶𝗿𝗶: "${ev.roast}"`,
        mentions: [u.id]
    });
}

// Umum tarikh khas sekali sehari ke semua group aktif.
async function calendarTick(sock) {
    const hari = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
    const sudah = await store.get('calendar', 'last', '');
    if (sudah === hari) return;
    const nama = hariKhas(hari);
    if (!nama) return;
    await store.set('calendar', 'last', hari);
    for (const g of G()) await sock.sendMessage(g, { text: `🎉 Hari ni ${nama}! Jom main, ada bonus khas untuk acara ni.` }).catch(() => {});
}

export function startScheduler(getSock) {
    if (started) return; started = true;
    const run = fn => () => { const s = getSock(); if (s) safe(fn.name, () => fn(s)); };
    setInterval(() => { const s = getSock(); if (!s) return; safe('purge', () => purgeTick(s)); safe('calendar', () => calendarTick(s)); safe('papan', () => weeklyTick(s, G())); safe('market', () => tickMarket()); safe('musim', () => musimTick(s, G())); safe('eventauto', () => eventAutoTick(s, G())); safe('ringkasan', () => ringkasanTick(s, G())); safe('backup', () => backupMingguan()); safe('bulletin', () => bulletinTick(s)); safe('season', () => seasonTick(s)); safe('mythic', () => mythicTick(s)); }, 60e3).unref?.();
    setInterval(run(randomEventTick), 12 * 60e3).unref?.();
}
export const _ticks = { purgeTick, bulletinTick, seasonTick, mythicTick };
