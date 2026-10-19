// Ujian asap: node test/smoke.mjs  (atau npm test). Tiada WhatsApp/Mongo diperlukan.
// Jika @napi-rs/canvas sebenar dipasang, kad contoh ditulis ke test/out/*.jpg untuk dilihat.
import fs from 'fs'; import path from 'path'; import os from 'os';
process.env.STORE_FILE = path.join(os.tmpdir(), `airi-test-${Date.now()}.json`);
process.env.OWNER_NUMBERS = '60111111111'; process.env.AIRI_VOICE = '0';
// masa pantas: lobi 90s & pameran 120s jadi 10ms
const realST = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...a) => realST(fn, (ms === 90000 || ms === 120000 || ms === 60000) ? 15 : ms, ...a);

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; } else { fail++; console.log('  ❌ GAGAL:', msg); } };
const section = s => console.log('\n▶ ' + s);
const sleep = ms => new Promise(r => realST(r, ms));

const { config } = await import('../config.js');
const cards = await import('../lib/cards.js');
const { renderCatchCard } = await import('../lib/card.js');
const { logEvent, recent } = await import('../lib/log.js');
const { state, initState } = await import('../lib/state.js');
const fx = await import('../lib/effects.js');
const { loadPlugins } = await import('../lib/loader.js');
const util = await import('../lib/util.js');
await initState();

// ---------- db & soket palsu ----------
const users = new Map();
const mk = (id, name, w = 50000) => ({ id, name, wallet: w, bank: 1000, black_money: 0, crypto: { btc: 0, gold: 0 }, jail: { status: false, release_at: 0 }, vehicle: { name: 'Honda EX5' }, stats: { crimes_done: 3, times_jailed: 1, fish_caught: 4, bounty: 9000 }, badges: [], properties: [], inventory: { fish: [] } });
const A = '601111111111@s.whatsapp.net', B = '602222222222@s.whatsapp.net', C = '603333333333@s.whatsapp.net', OWN = '60111111111@s.whatsapp.net';
[[A, 'Amar'], [B, 'Balqis'], [C, 'Chong']].forEach(([i, n]) => users.set(i, mk(i, n)));
users.set(OWN, mk(OWN, 'Owner', 1e6));
const db = { isMongo: () => false, async getUser(id, n) { if (!users.has(id)) users.set(id, mk(id, n || 'Warga')); return structuredClone(users.get(id)); }, async saveUser(u) { users.set(u.id, structuredClone(u)); return u; }, async getAllUsers() { return [...users.values()].map(u => structuredClone(u)); } };
const sent = [];
const sock = { user: { id: '999:1@s.whatsapp.net' }, async sendMessage(jid, c, o) { sent.push({ jid, c, o }); return {}; }, async groupMetadata() { return { subject: "Airi's Corner", participants: [A, B, C, OWN].map(id => ({ id })) }; }, async profilePictureUrl() { throw new Error('tiada'); }, ev: {} };
const G = '120363000000@g.us';
const msg = (from, text, mentioned = []) => ({ key: { remoteJid: G, participant: from, id: 'X' + Math.random() }, pushName: users.get(from)?.name, message: mentioned.length ? { extendedTextMessage: { text, contextInfo: { mentionedJid: mentioned } } } : { conversation: text } });
const last = () => sent[sent.length - 1];
const hasText = (s, re) => sent.slice(-(s || 3)).some(x => re.test(x.c.text || x.c.caption || ''));
const run = async (plugin, from, text, mentioned) => { sent.length = 0; await plugin.execute({ sock, m: msg(from, text, mentioned), user: await db.getUser(from), db }); };

// ================= KAD =================
section('Kad gambar');
const buf = Buffer.from('avatar');
for (const [name, fn, data] of [
    ['welcome', 'welcomeCard', { name: '+60123456789', group: "Airi's Corner", count: 42, avatar: buf }],
    ['menu', 'menuCard', { name: 'Amar', wallet: 12345, event: 'Berkat Bos Amar' }],
    ['profil', 'profileCard', { name: 'Amar', nick: 'Abang Amar', tier: util.tierOf(9e5), net: 9e5, wallet: 5e4, bank: 1e5, black: 200, vehicle: 'Honda', pet: 'Kucing', stats: { crimes_done: 5 }, geng: 'Naga', badges: ['Juara Musim', 'Pakar mitos'], avatar: buf, rank: 2 }],
    ['top', 'topCard', { title: 'PALING KAYA', subtitle: 'Jumlah aset', rows: [1, 2, 3, 4, 5].map(i => ({ name: 'Pemain ' + i, sub: 'sub', value: 'RM ' + i * 1000 })) }],
    ['top-kosong', 'topCard', { title: 'KOSONG', rows: [] }],
    ['wanted', 'wantedCard', { name: 'Chong', bounty: 123456, crimes: 7, avatar: buf }],
    ['wanted-noavatar', 'wantedCard', { name: 'Chong', bounty: 1, crimes: 0 }],
    ['news', 'newsCard', { date: '19/10/2026', headline: 'Amar rajai jalanan, polis garu kepala sehingga botak', items: ['Item satu yang agak panjang untuk menguji pembungkusan baris dalam kad akhbar ini.', 'Item dua', 'Item tiga'], quote: 'Hari ni biasa-biasa, esok mungkin mitos!' }],
    ['panel', 'panelCard', { kicker: 'AMARAN MITOS', title: 'Makhluk mitos muncul di laut!', big: 'K7R2', bigLabel: 'TAIP .tangkap KOD', lines: ['satu', { k: 'Kunci', v: 'nilai', c: '#4ade80' }] }],
    ['panel-avatar', 'panelCard', { kicker: 'LAPORAN', title: 'Siasatan', avatar: null, lines: ['x'] }],
    ['album', 'albumCard', { title: 'ALBUM MITOS', owned: 2, species: Array.from({ length: 20 }, (_, i) => ({ nama: 'Naga Laut ' + i, rarity: ['mitos', 'rare', 'biasa'][i % 3], owned: i < 2 })) }]
]) {
    try { const b = await cards[fn](data); ok(Buffer.isBuffer(b), `${name} bukan Buffer`); } catch (e) { ok(false, `${name}: ${e.message}`); }
}
for (const [n, r] of [['Selipar Jepun 🩴', 'sampah'], ['Ikan Kembung 🐟', 'biasa'], ['Sotong Kurita 🐙', 'rare'], ['Raja Ketam Atlantis 🦀', 'mitos'], ['Penyu Belimbing 🐢', 'mitos'], ['Kraken Emas 🦑', 'mitos']]) {
    try { ok(Buffer.isBuffer(renderCatchCard({ nama: n, rarity: r, harga: 1e6, buff: '+RM1,000', owner: 'Amar' })), n); } catch (e) { ok(false, `${n}: ${e.message}`); }
}
const stub = (await cards.topCard({ rows: [] })).toString() === 'STUB';
if (!stub) { fs.mkdirSync('test/out', { recursive: true }); for (const [n, fn, d] of [['menu', 'menuCard', { name: 'Amar', wallet: 1234 }], ['welcome', 'welcomeCard', { name: '+60123', count: 7 }]]) fs.writeFileSync(`test/out/${n}.jpg`, await cards[fn](d)); fs.writeFileSync('test/out/mitos.jpg', renderCatchCard({ nama: 'Naga Laut Raksasa', rarity: 'mitos', harga: 8e6, buff: '+RM30,000 Gaji', owner: 'Amar' })); console.log('  (kad contoh ditulis ke test/out/)'); }

// ================= LOG / EFFECTS =================
section('Log & kesan acara');
await logEvent({ type: 'crime', actor: A, target: B, cmd: 'rompak', amount: 100, ok: true, group: G });
ok((await recent({ type: 'crime', target: B })).length === 1, 'log recent');
const u = mk(A, 'Amar'), before = fx.snapshot(u); u.wallet += 1000;
let r = fx.applyEffects({ cmd: 'kerja', isCrime: false, user: u, before, event: { code: 'OVERTIME_FRENZY', name: 'OT' }, purge: false });
ok(u.wallet === 52000, 'OVERTIME 2x'); ok(r.messages.length === 1, 'mesej kesan');
for (const k of ['MYTHIC_TIDE', 'DAILY_FIESTA', 'CASINO_FIESTA', 'ROYAL_AIRDROP', 'AMAR_BLESSING']) ok(fx.supported(k), 'supported ' + k);
const u2 = mk(A, 'x'); const b2 = fx.snapshot(u2); u2.jail = { status: true, release_at: Date.now() + 9e4 };
r = fx.applyEffects({ cmd: 'rompak', isCrime: true, user: u2, before: b2, event: null, purge: true });
ok(u2.jail.status === false, 'purge elak lokap');
const u3 = mk(A, 'x'); u3.wallet = 0; r = fx.applyEffects({ cmd: 'x', isCrime: false, user: u3, before: fx.snapshot(u3), event: { code: 'ROYAL_AIRDROP', name: 'AD' }, purge: false }); ok(u3.wallet === 10000, 'airdrop');

// ================= PLUGIN =================
section('Pemuat plugin');
const L = await loadPlugins(path.resolve('plugins'));
ok(L.plugins >= 40, `plugin dimuat: ${L.plugins}`); console.log(`  ${L.plugins} plugin, ${L.count} command, ${L.conflicts.length} konflik alias`);
for (const c of ['profil', 'roast', 'misi', 'geng', 'heist', 'album', 'gabung', 'tangkap', 'veto', 'siar', 'menu', 'mancing']) ok(L.map.has(c), 'command tiada: ' + c);
ok(L.map.get('wanted').name === 'airi_social', 'wanted guna plugin baharu'); ok(L.map.get('musim').name === 'veto_amar', 'musim');
const P = n => L.map.get(n);

section('Sosial');
await run(P('profil'), A, '.profil'); ok(last().c.image || /Kad profil/.test(last().c.text || last().c.caption || ''), 'profil');
await run(P('top'), A, '.top'); ok(!!last().c.image, 'top kaya'); await run(P('top'), A, '.top geng'); ok(!!last().c, 'top geng');
await run(P('top'), A, '.top salah'); ok(/Pilihan/.test(last().c.text), 'top pilihan salah');
await run(P('wanted'), A, '.wanted'); ok(!!last().c.image, 'wanted senarai');
await run(P('wanted'), A, '.wanted @c', [C]); ok(!!last().c.image && last().c.mentions?.[0] === C, 'wanted poster');
await run(P('roast'), A, '.roast @b', [B]); ok(/ROAST/.test(last().c.text), 'roast');
await run(P('roast'), A, '.roast'); ok(/Tag/.test(last().c.text), 'roast tanpa sasaran');
await run(P('panggil'), A, '.panggil Abang A'); ok(/Abang A/.test(last().c.text), 'panggil');
await run(P('ingat'), A, '.ingat aku suka mee goreng'); ok(/mee goreng/.test(last().c.text), 'ingat');
await run(P('siasat'), A, '.siasat @b', [B]); ok(!!last().c.image, 'siasat');
await run(P('dendam'), B, '.dendam'); ok(/DENDAM/.test(last().c.text), 'dendam senarai');
users.get(B).wallet = 100000;
await run(P('balas'), B, '.balas @a', [A]); ok(/BALAS|rancangan|Rancangan/i.test(last().c.text), 'balas');
await run(P('balas'), B, '.balas @a', [A]); ok(/dah balas/.test(last().c.text), 'balas sekali sehari');
await run(P('balas'), C, '.balas @a', [A]); ok(/tak kacau/.test(last().c.text), 'balas tanpa sebab');
await run(P('misi'), A, '.misi'); ok(!!last().c.image, 'misi'); await run(P('misi'), A, '.misi klaim'); ok(/Belum|siap/.test(last().c.text), 'misi klaim kosong');
await run(P('buletin_cyber'), A, '.buletin_cyber'); ok(!!last().c.image, 'buletin');

section('Geng, heist, pameran');
await run(P('geng'), A, '.geng buat Naga Laut'); ok(/ditubuhkan/.test(last().c.text), 'geng buat');
await run(P('geng'), B, '.geng sertai Naga Laut'); ok(/sertai geng/.test(last().c.text), 'geng sertai');
await run(P('geng'), A, '.geng derma 1000'); ok(/derma/.test(last().c.text), 'geng derma');
await run(P('geng'), B, '.geng ambil 500'); ok(/Ketua/.test(last().c.text), 'bukan ketua tak boleh ambil');
await run(P('geng'), A, '.geng'); ok(!!last().c.image, 'geng info');
await run(P('geng'), C, '.geng sertai Tiada'); ok(/tak wujud/.test(last().c.text), 'geng tak wujud');
await run(P('heist'), A, '.heist'); ok(!!last().c.image, 'heist buka');
await run(P('sertai_heist'), B, '.sertai_heist'); ok(/sertai heist/.test(last().c.text), 'sertai heist');
sent.length = 0; await sleep(120); ok(sent.some(x => x.c.image && /HEIST/.test(x.c.caption || '')), 'heist selesai');
users.get(C).wallet = 100; await run(P('heist'), C, '.heist'); ok(/tak cukup/.test(last().c.text), 'heist duit tak cukup');
const crew = P('heist'); const fishA = { nama: 'Ikan Kembung 🐟', harga: 800, buff: 'Tiada' };
const { ensureP } = await import('../lib/fish.js'); ensureP(A).tong_ikan.push({ ...fishA }, { nama: 'Kraken Emas 🦑', harga: 7500000, buff: '+25% Lulus Jenayah' }); ensureP(B).tong_ikan.push({ ...fishA });
await run(crew, A, '.pameran 1'); ok(sent.some(x => x.c.image), 'pameran entri');
await run(crew, B, '.pameran 1'); await run(crew, C, '.undi_pameran 1'); ok(/direkod/.test(last().c.text), 'undi pameran');
await run(crew, C, '.undi_pameran 2'); ok(/dah mengundi/.test(last().c.text), 'undi sekali');
sent.length = 0; await sleep(120); ok(sent.some(x => /PEMENANG/.test(x.c.caption || '')), 'pameran selesai');

section('Koleksi & mitos');
await run(P('album'), A, '.album mitos'); ok(!!last().c.image, 'album'); await run(P('album'), A, '.album klaim'); ok(/Belum/.test(last().c.text), 'album klaim belum');
await run(P('gabung'), A, '.gabung 1 2'); ok(!!last().c.image && /GABUNGAN/.test(last().c.caption), 'gabung'); await run(P('gabung'), A, '.gabung 1 1'); ok(/Gabung dua/.test(last().c.text), 'gabung sama');
await run(P('liga'), A, '.liga'); ok(!!last().c.image, 'liga');
const mythic = await import('../lib/mythic.js'); sent.length = 0;
ok(await mythic.trigger(sock, G), 'mitos muncul'); const code = (last().c.caption || '').match(/tangkap (\w{4})/)?.[1]; ok(!!code, 'kod mitos');
await run(P('tangkap'), B, '.tangkap ZZZZ'); ok(last().c.react, 'kod salah react');
await run(P('tangkap'), B, '.tangkap ' + code); ok(!!last().c.image && /BERITA UTAMA/.test(last().c.caption), 'tangkap berjaya');
await run(P('tangkap'), C, '.tangkap ' + code); ok(/Tiada makhluk/.test(last().c.text), 'tangkap lewat');

section('Veto');
await run(P('veto'), A, '.veto'); ok(/AKSES DITOLAK/.test(last().c.text), 'bukan owner ditolak');
await run(P('start_event'), A, '.start_event AMAR_BLESSING 1'); ok(sent.length === 0, 'bukan owner senyap');
await run(P('veto'), OWN, '.veto'); ok(/PANGKALAN VETO/.test(last().c.text), 'owner menu');
await run(P('start_event'), OWN, '.start_event EGG_HATCH_SPEED 1'); ok(/belum ada kesan/.test(last().c.text), 'acara belum aktif ditolak');
await run(P('start_event'), OWN, '.start_event MYTHIC_TIDE 2'); ok(state.event?.code === 'MYTHIC_TIDE', 'acara bermula');
await run(P('musim'), A, '.musim'); ok(/MYTHIC|Pasang/.test(last().c.text), 'musim status');
await run(P('give_cash'), OWN, '.give_cash @a 500', [A]); ok(/Suntikan/.test(last().c.text), 'give_cash');
await run(P('purge'), OWN, '.purge on'); ok(util && state.purgeUntil > Date.now(), 'purge on');
await run(P('maintenance'), OWN, '.maintenance on'); ok(state.maintenance === true, 'maintenance'); await run(P('maintenance'), OWN, '.maintenance off');
await run(P('testwelcome'), OWN, '.testwelcome'); ok(sent.some(x => x.c.image), 'testwelcome');
await run(P('stop_event'), OWN, '.stop_event'); ok(state.event === null, 'stop_event');

section('Welcome');
sent.length = 0; const wl = await import('../lib/welcome.js');
await wl.handleParticipants(sock, { id: G, participants: ['604444444444@s.whatsapp.net'], action: 'add' }); ok(!!last().c.image && /Airi's Corner/.test(last().c.caption), 'welcome kad');
await wl.handleParticipants(sock, { id: G, participants: ['604444444444@s.whatsapp.net'], action: 'remove' }); ok(/Bye/.test(last().c.text), 'goodbye');

section('Penjadual & musim');
const sched = await import('../lib/scheduler.js'); const realNow = Date.now;
state.groups = [G]; state.purgeUntil = 0; state.lastPurgeDay = '';
Date.now = () => Date.UTC(2026, 9, 23, 13, 5); sent.length = 0; // Jumaat 21:05 MYT
await sched._ticks.purgeTick(sock); ok(sent.some(x => /PEMBERSIHAN/.test(x.c.caption || '')), 'purge automatik'); ok(util.myt().dow === 5, 'hari Jumaat');
Date.now = () => Date.UTC(2026, 9, 23, 14, 10); sent.length = 0; await sched._ticks.purgeTick(sock); ok(sent.some(x => /tamat/.test(x.c.text || '')), 'purge tamat');
Date.now = () => Date.UTC(2026, 9, 19, 14, 5); sent.length = 0; state.lastBulletinDay = ''; await sched._ticks.bulletinTick(sock); ok(sent.some(x => x.c.image), 'buletin 10 malam'); // 22:05 MYT
sent.length = 0; await sched._ticks.bulletinTick(sock); ok(sent.length === 0, 'buletin sekali sehari');
Date.now = () => Date.UTC(2026, 9, 25, 15, 5); sent.length = 0; state.lastSeasonDay = ''; users.get(A).wallet += 500000; // Ahad 23:05 MYT
await sched._ticks.seasonTick(sock); ok(sent.some(x => /LIGA/.test(x.c.caption || '')), 'liga tamat'); Date.now = realNow;
state.lastMythicAt = 0; sent.length = 0; await sched._ticks.mythicTick(sock); ok(sent.length > 0, 'mitos berjadual');

console.log(`\n${fail ? '❌' : '✅'} ${pass} lulus, ${fail} gagal`);
fs.rmSync(process.env.STORE_FILE, { force: true });
process.exit(fail ? 1 : 0);
