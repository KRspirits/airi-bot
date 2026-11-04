import { extractText, parseCmd, mentions, num, rm, pick, rand, slug } from '../lib/util.js';
import { sendCard } from '../lib/render.js';
import { logEvent } from '../lib/log.js';
import { purgeActive, activeEvent } from '../lib/state.js';
import { ensureP, rarityOf, savePancingDB } from '../lib/fish.js';
import { renderCatchCard } from '../lib/card.js';
import * as store from '../lib/store.js';

// Kerja berpasukan: geng/sindiket, heist bersama dan pameran ikan.
const HEIST_FEE = 2000, HEIST_MS = 90_000, GANG_COST = 5000, GANG_MAX = 15, EXPO_MS = 120_000;
const lobbies = new Map(), expos = new Map();
const tag = j => '@' + num(j);
const gkey = n => slug(String(n).toLowerCase());
const cleanName = s => String(s || '').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16);
const noJail = () => purgeActive() || activeEvent()?.code === 'ZERO_JAIL_DAY';

async function resolveHeist(sock, jid, db) {
    const L = lobbies.get(jid); if (!L) return; lobbies.delete(jid);
    const ids = [...L.members.keys()], users = await Promise.all(ids.map(id => db.getUser(id)));
    if (ids.length < 2) {
        for (const u of users) { u.wallet += HEIST_FEE; await db.saveUser(u); }
        return sock.sendMessage(jid, { text: '🚫 Heist batal, orang tak cukup (minimum 2). Duit masuk dah dipulangkan.' });
    }
    const roles = ['Hacker', 'Pemandu', 'Penjaga', 'Pemecah Peti', 'Pengintip'];
    const chance = Math.min(0.8, 0.3 + 0.08 * ids.length + (purgeActive() ? 0.1 : 0));
    const ok = Math.random() < chance, lines = [];
    if (ok) {
        const total = Math.round(ids.length * rand(12000, 30000) * (1 + ids.length * 0.15)), share = Math.floor(total / ids.length);
        for (const [i, u] of users.entries()) {
            u.wallet += share; u.stats = u.stats || {}; u.stats.crimes_done = (u.stats.crimes_done || 0) + 1; await db.saveUser(u);
            await logEvent({ type: 'crime', actor: u.id, cmd: 'heist', amount: share, ok: true, group: jid });
            lines.push({ k: `${u.name} (${roles[i % roles.length]})`, v: '+' + rm(share), c: '#4ade80' });
        }
        return sendCard(sock, jid, null, 'panelCard', { kicker: 'HEIST BERJAYA', title: 'Rompakan bank siber berjaya!', accent: '#4ade80', big: rm(total), bigLabel: `HASIL DIBAHAGI ${ids.length} ORANG`, lines: lines.slice(0, 6) },
            `💰 *HEIST BERJAYA!* ${ids.map(tag).join(' ')} kongsi ${rm(total)}!`, { mentions: ids });
    }
    for (const [i, u] of users.entries()) {
        u.stats = u.stats || {}; u.stats.crimes_done = (u.stats.crimes_done || 0) + 1;
        if (!noJail()) { u.jail = { status: true, release_at: Date.now() + 90_000, reason: 'Heist gagal', vote_free: 0, vote_jail: 0, voters: [] }; u.stats.times_jailed = (u.stats.times_jailed || 0) + 1; await logEvent({ type: 'jail', actor: u.id, cmd: 'heist', group: jid }); }
        await db.saveUser(u); await logEvent({ type: 'crime', actor: u.id, cmd: 'heist', amount: 0, ok: false, group: jid });
        lines.push({ k: `${u.name} (${roles[i % roles.length]})`, v: noJail() ? 'terlepas' : 'lokap 90s', c: '#fb7185' });
    }
    return sendCard(sock, jid, null, 'panelCard', { kicker: 'HEIST GAGAL', title: 'Polis tiba lebih awal!', accent: '#fb7185', lines: lines.slice(0, 6), big: 'GAGAL', bigLabel: `PELUANG TADI ${Math.round(chance * 100)}%` },
        `🚨 *HEIST GAGAL!* ${ids.map(tag).join(' ')}`, { mentions: ids });
}

async function resolveExpo(sock, jid, db) {
    const E = expos.get(jid); if (!E) return; expos.delete(jid);
    const ranked = E.entries.map((e, i) => ({ ...e, n: i + 1, votes: E.votes.filter(v => v.entry === i).length })).sort((a, b) => b.votes - a.votes || a.n - b.n);
    if (!ranked.length || ranked[0].votes === 0) return sock.sendMessage(jid, { text: '🖼️ Pameran ikan tamat, tapi tiada undian. Tiada pemenang kali ni~' });
    const w = ranked[0], u = await db.getUser(w.owner), prize = Math.min(300000, Math.round((w.fish.harga || 0) * 0.2) + w.votes * 5000);
    u.wallet += prize; await db.saveUser(u);
    const img = renderCatchCard({ nama: w.fish.nama, rarity: rarityOf(w.fish), harga: w.fish.harga, buff: w.fish.buff, owner: u.name });
    return sock.sendMessage(jid, { image: img, mentions: [w.owner], caption: `🏆 *PEMENANG PAMERAN IKAN!*\n${tag(w.owner)} dengan *${w.fish.nama}* (${w.votes} undi)\nHadiah: ${rm(prize)}\n\n${ranked.map(r => `#${r.n} ${r.fish.nama} - ${r.votes} undi`).join('\n')}` });
}

export default {
    name: 'airi_crew', priority: 10,
    alias: ['geng', 'heist', 'sertai_heist', 'pameran', 'undi_pameran'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid, sender = m.key.participant || jid;
        const p = parseCmd(extractText(m.message)); if (!p) return;
        const { cmd, args } = p, reply = (text, extra = {}) => sock.sendMessage(jid, { text, ...extra }, { quoted: m });
        if (!jid.endsWith('@g.us')) return reply('Command ni untuk dalam group sahaja ya! 🌸');

        // ================= GENG =================
        if (cmd === 'geng') {
            const sub = (args[0] || 'info').toLowerCase(), rest = args.slice(1).join(' ');
            const mine = user.geng ? await store.get('geng', gkey(user.geng)) : null;
            if (user.geng && !mine) { user.geng = null; await db.saveUser(user); }
            if (sub === 'buat') {
                const name = cleanName(rest); if (name.length < 2) return reply('Nama geng 2-16 huruf. Contoh: `.geng buat Naga Laut`');
                if (user.geng) return reply('Awak dah ada geng. Keluar dulu dengan `.geng keluar`.');
                if (await store.get('geng', gkey(name))) return reply('Nama geng tu dah diambil orang!');
                if (user.wallet < GANG_COST) return reply(`Duit tak cukup. Buat geng kos ${rm(GANG_COST)}.`);
                user.wallet -= GANG_COST; user.geng = name; await db.saveUser(user);
                await store.set('geng', gkey(name), { name, leader: sender, members: [sender], bank: 0, created: Date.now() });
                return reply(`🏴 Geng *${name}* ditubuhkan! Ajak kawan: \`.geng sertai ${name}\``);
            }
            if (sub === 'sertai') {
                if (user.geng) return reply('Awak dah ada geng.');
                const g = await store.get('geng', gkey(rest)); if (!g) return reply('Geng tu tak wujud. Semak ejaan ya.');
                if (g.members.length >= GANG_MAX) return reply('Geng tu dah penuh!');
                g.members.push(sender); user.geng = g.name; await db.saveUser(user); await store.set('geng', gkey(g.name), g);
                return reply(`🎉 Awak sertai geng *${g.name}*! Selamat datang~`);
            }
            if (!mine) return reply('Awak belum ada geng. `.geng buat [nama]` atau `.geng sertai [nama]`');
            if (sub === 'keluar') {
                mine.members = mine.members.filter(x => x !== sender); user.geng = null; await db.saveUser(user);
                if (!mine.members.length) await store.del('geng', gkey(mine.name));
                else { if (mine.leader === sender) mine.leader = mine.members[0]; await store.set('geng', gkey(mine.name), mine); }
                return reply('Awak dah keluar geng. Semoga berjumpa lagi~ 👋');
            }
            if (sub === 'derma') {
                const n = Math.floor(Number(args[1])); if (!n || n <= 0 || n > user.wallet) return reply('Jumlah tak sah atau duit tak cukup. `.geng derma [jumlah]`');
                user.wallet -= n; mine.bank += n; await db.saveUser(user); await store.set('geng', gkey(mine.name), mine);
                return reply(`💝 Awak derma ${rm(n)} ke kas *${mine.name}*. Kas sekarang ${rm(mine.bank)}.`);
            }
            if (sub === 'ambil') {
                if (mine.leader !== sender) return reply('Ketua geng sahaja boleh ambil duit kas!');
                const n = Math.floor(Number(args[1])); if (!n || n <= 0 || n > mine.bank) return reply('Jumlah tak sah. `.geng ambil [jumlah]`');
                mine.bank -= n; user.wallet += n; await db.saveUser(user); await store.set('geng', gkey(mine.name), mine);
                return reply(`Ketua ambil ${rm(n)} dari kas. Baki ${rm(mine.bank)}.`);
            }
            const names = await Promise.all(mine.members.slice(0, 5).map(async id => (await db.getUser(id)).name));
            return sendCard(sock, jid, m, 'panelCard', { kicker: 'GENG', title: mine.name, accent: '#ff7ac8', big: rm(mine.bank), bigLabel: 'KAS GENG',
                lines: [{ k: 'Ketua', v: (await db.getUser(mine.leader)).name }, { k: 'Ahli', v: `${mine.members.length} / ${GANG_MAX}` }, ...names.map(n => '• ' + n), 'Derma: .geng derma [jumlah]  |  Keluar: .geng keluar'] }, `🏴 Geng ${mine.name}`);
        }

        // ================= HEIST =================
        if (cmd === 'heist' || cmd === 'sertai_heist') {
            let L = lobbies.get(jid);
            if (cmd === 'heist' && L) return reply(`Lobi heist dah dibuka! Taip \`.sertai_heist\` (${Math.ceil((L.endsAt - Date.now()) / 1000)} saat lagi).`);
            if (cmd === 'sertai_heist' && !L) return reply('Tiada lobi heist. Buka dengan `.heist`!');
            if (user.jail?.status && Date.now() < (user.jail.release_at || 0)) return reply('Awak dalam lokap, mana boleh join heist! 🔒');
            if (L?.members.has(sender)) return reply('Awak dah ada dalam pasukan!');
            if (user.wallet < HEIST_FEE) return reply(`Duit tak cukup. Yuran masuk ${rm(HEIST_FEE)}.`);
            user.wallet -= HEIST_FEE; await db.saveUser(user);
            if (!L) {
                L = { members: new Map(), endsAt: Date.now() + HEIST_MS }; lobbies.set(jid, L);
                const t = setTimeout(() => resolveHeist(sock, jid, db).catch(e => console.error('[HEIST]', e.message)), HEIST_MS); t.unref?.();
                L.members.set(sender, true);
                return sendCard(sock, jid, m, 'panelCard', { kicker: 'HEIST', title: 'Rompakan Bank Siber', accent: '#fb7185', big: rm(HEIST_FEE), bigLabel: 'YURAN MASUK  •  TAIP .sertai_heist',
                    lines: ['Lobi dibuka 90 saat', 'Minimum 2 orang', 'Lagi ramai, lagi tinggi peluang berjaya', 'Gagal = masuk lokap!'] }, `🚨 ${tag(sender)} buka heist! Join dalam 90 saat dengan \`.sertai_heist\``, { mentions: [sender] });
            }
            L.members.set(sender, true);
            return reply(`✅ ${tag(sender)} sertai heist! Pasukan: ${L.members.size} orang.`, { mentions: [sender] });
        }

        // ================= PAMERAN IKAN =================
        if (cmd === 'pameran') {
            const idx = parseInt(args[0]) - 1, pd = ensureP(sender);
            if (isNaN(idx) || !pd.tong_ikan[idx]) return reply('Pilih ikan dari tong: `.pameran [nombor]` (rujuk `.ikan`).');
            let E = expos.get(jid);
            if (E?.entries.some(e => e.owner === sender)) return reply('Awak dah hantar ikan untuk pameran ni.');
            const fish = pd.tong_ikan[idx];
            if (!E) {
                E = { entries: [], votes: [], endsAt: Date.now() + EXPO_MS }; expos.set(jid, E);
                const t = setTimeout(() => resolveExpo(sock, jid, db).catch(e => console.error('[EXPO]', e.message)), EXPO_MS); t.unref?.();
                await sock.sendMessage(jid, { text: `🖼️ *PAMERAN IKAN DIBUKA!* (2 minit)\nHantar ikan awak: \`.pameran [nombor]\`\nUndi: \`.undi_pameran [nombor entri]\`` });
            }
            E.entries.push({ owner: sender, fish });
            const n = E.entries.length;
            return sock.sendMessage(jid, { image: renderCatchCard({ nama: fish.nama, rarity: rarityOf(fish), harga: fish.harga, buff: fish.buff, owner: user.name }), mentions: [sender],
                caption: `🖼️ *Entri #${n}* oleh ${tag(sender)}\nUndi dengan \`.undi_pameran ${n}\`` }, { quoted: m });
        }
        if (cmd === 'undi_pameran') {
            const E = expos.get(jid); if (!E) return reply('Tiada pameran sekarang. Buka dengan `.pameran [nombor ikan]`.');
            const i = parseInt(args[0]) - 1; if (isNaN(i) || !E.entries[i]) return reply('Nombor entri tak sah.');
            if (E.entries[i].owner === sender) return reply('Tak boleh undi ikan sendiri! 😜');
            if (E.votes.some(v => v.voter === sender)) return reply('Awak dah mengundi.');
            E.votes.push({ voter: sender, entry: i });
            return reply(`🗳️ Undi untuk entri #${i + 1} direkod. Terima kasih!`);
        }
        void savePancingDB; void pick;
    }
};
