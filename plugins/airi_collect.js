import { pemainGroup } from '../lib/groupusers.js';
import { getAvatar } from '../lib/render.js';
import { extractText, parseCmd, mentions, num, rm, pick, rand } from '../lib/util.js';
import { sendCard } from '../lib/render.js';
import { renderCatchCard } from '../lib/card.js';
import { CATALOG, ensureP, ownedNames, rarityOf, savePancingDB } from '../lib/fish.js';
import { standings } from '../lib/season.js';
import { claim } from '../lib/mythic.js';
import { logEvent } from '../lib/log.js';
import { VEHICLES } from '../lib/gamedata.js';

// Koleksi: album, gabung ikan (hibrid), liga mingguan, tangkap makhluk mitos.
const ORDER = ['sampah', 'biasa', 'rare', 'mitos'];
// Hadiah lengkap set (sekali je per set). Besar sengaja, ikut arahan owner.
const SET_REWARD = { biasa: 1000000, rare: 10000000, legend: 50000000, mitos: 100000000, secret: 1000000000, fossil: 500000000 }; // ganjaran set penuh
const PAGE_REWARD = { biasa: 500000, rare: 3000000, legend: 25000000, mitos: 20000000, secret: 250000000, fossil: 100000000 };  // ganjaran setiap halaman (12 ikan) lengkap
const IKAN_PER_HALAMAN = 12;
// Nombor album: 1 = biasa, 2 = rare, 3 = mitos.
const ALBUM_NO = { '1': 'biasa', '2': 'rare', '3': 'legend', '4': 'mitos', '5': 'secret', '6': 'fossil' };
const ALBUM_LABEL = { biasa: 'ALBUM 1 · BIASA', rare: 'ALBUM 2 · RARE', legend: 'ALBUM 3 · LEGEND', mitos: 'ALBUM 4 · MYTHIC', secret: 'ALBUM 5 · SECRET', fossil: 'ALBUM 6 · FOSSIL' };
const TIER_TAJUK = { biasa: 'Biasa', rare: 'Rare', legend: 'Legend', mitos: 'Mythic', secret: 'Secret', fossil: 'Fossil' };
const hadiahAlbum = sub => `🎁 *Hadiah ${TIER_TAJUK[sub] || sub}*\n📄 Setiap halaman lengkap (${IKAN_PER_HALAMAN} ikan): RM ${(PAGE_REWARD[sub] || 0).toLocaleString('en-US')}\n📚 Set penuh: RM ${(SET_REWARD[sub] || 0).toLocaleString('en-US')}`;
const noEmoji = s => String(s || '').replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '').trim();
const part = (n, first) => { const w = noEmoji(n).replace(/^(Ikan|Pari|Bawal|Keli)\s+/i, '').split(/\s+/); return first ? w[0] : w[w.length - 1]; };

export default {
    name: 'airi_collect', priority: 10,
    alias: ['album', 'gabung', 'liga', 'tangkap'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid, sender = m.key.participant || jid;
        const p = parseCmd(extractText(m.message)); if (!p) return;
        const { cmd, args } = p, reply = (text, extra = {}) => sock.sendMessage(jid, { text, ...extra }, { quoted: m });

        if (cmd === 'tangkap') return claim({ sock, m, user, db, code: args[0] });

        if (cmd === 'liga') {
            const users = await pemainGroup(sock, m.key.remoteJid, await db.getAllUsers()), st = (await standings(users)).slice(0, 8);
            return sendCard(sock, jid, m, 'topCard', { title: 'LIGA MINGGUAN', subtitle: 'Pertambahan aset minggu ini  •  tamat Ahad 11 malam', accent: '#fbbf24',
                rows: st.map((r, i) => ({ name: r.name, sub: i < 3 ? `Hadiah RM ${[100000, 50000, 25000][i].toLocaleString('en-US')}` : '', value: (r.gain >= 0 ? '+' : '-') + rm(Math.abs(r.gain)) })) }, '🏆 Liga mingguan Airi\'s Corner');
        }

        if (cmd === 'album') {
            const pd = ensureP(sender), owned = ownedNames(pd);
            let sub = (args[0] || 'mitos').toLowerCase();
            if (sub === 'klaim') {
                user.album_claim ||= {}; user.album_page_claim ||= {};
                let total = 0; const got = [], halaman = [];
                for (const r of ['biasa', 'rare', 'mitos']) {
                    // ganjaran per halaman yang lengkap
                    const bilHalaman = Math.ceil(CATALOG[r].length / IKAN_PER_HALAMAN);
                    for (let p = 1; p <= bilHalaman; p++) {
                        const kunci = `${r}_${p}`;
                        const ikanHalaman = CATALOG[r].slice((p - 1) * IKAN_PER_HALAMAN, p * IKAN_PER_HALAMAN);
                        if (user.album_page_claim[kunci] || !ikanHalaman.every(f => owned.has(f.nama))) continue;
                        user.album_page_claim[kunci] = true; total += PAGE_REWARD[r]; halaman.push(`${r} hal.${p}`);
                    }
                    // ganjaran set penuh
                    if (user.album_claim[r] || !CATALOG[r].every(f => owned.has(f.nama))) continue;
                    user.album_claim[r] = true; total += SET_REWARD[r]; got.push(r);
                    const b = `Pakar ${r}`; if (!user.badges.includes(b)) user.badges.push(b);
                }
                // album penuh: ketiga-tiga set siap -> kenderaan paling mahal dalam showroom (barang, boleh pakai)
                let kenderaanTxt = '';
                if (!user.album_kenderaan && ['biasa', 'rare', 'legend', 'mitos', 'secret', 'fossil'].every(r => user.album_claim[r])) {
                    const v = [...VEHICLES].sort((a, b) => b.price - a.price)[0];
                    user.items = Array.isArray(user.items) ? user.items : [];
                    user.items.push({ id: 'AL' + Date.now().toString(36).slice(-4), nama: v.name, desc: 'Ganjaran album penuh', nilai: v.price, bida: 0, kategori: 'Kenderaan', nadir: 'LEGENDARI', kind: 'vehicle', ref: v.id, t: Date.now() });
                    user.album_kenderaan = true;
                    kenderaanTxt = `\n🚗 Ganjaran album penuh: *${v.name}* (lihat di \`.item\`)`;
                }
                if (!total && !kenderaanTxt) return reply('Belum ada halaman atau set yang lengkap. Teruskan memancing! 🎣');
                user.wallet += total; await db.saveUser(user);
                const bahagian = [];
                if (halaman.length) bahagian.push(`📄 Halaman: ${halaman.join(', ')}`);
                if (got.length) bahagian.push(`📚 Set: ${got.join(', ')}`);
                return reply(`🎉 *GANJARAN ALBUM!*\n${bahagian.join('\n')}\nHadiah tunai: ${rm(total)}${kenderaanTxt}`);
            }
            sub = ALBUM_NO[sub] || sub;
            if (!CATALOG[sub] || sub === 'sampah') return reply('Pilihan: `.album 1` (biasa) | `.album 2` (rare) | `.album 3` (legend) | `.album 4` (mythic) | `.album 5` (secret) | `.album 6` (fossil) | `.album klaim`');
            await reply(hadiahAlbum(sub));
            const semua = CATALOG[sub].map(f => ({ nama: f.nama, rarity: sub, owned: owned.has(f.nama) }));
            semua.sort((a, b) => Number(b.owned) - Number(a.owned)); // yang dah dapat dulu
            const PER = 200; // semua ikan dalam satu gambar (tak ada halaman lagi)
            const pages = Math.max(1, Math.ceil(semua.length / PER));
            const page = Math.min(pages, Math.max(1, parseInt(args[1]) || 1));
            const species = semua.slice((page - 1) * PER, page * PER);
            const dimiliki = semua.filter(x => x.owned);
            const senaraiNama = dimiliki.map(x => x.nama).join(', ') || 'belum ada';
            const av = await getAvatar(sock, sender).catch(() => null);
            return sendCard(sock, jid, m, 'albumCard', { avatar: av, title: ALBUM_LABEL[sub] || `ALBUM ${sub.toUpperCase()}`, species, owned: dimiliki.length, total: semua.length, page, pages,
                accent: { biasa: '#38bdf8', rare: '#c084fc', mitos: '#fbbf24' }[sub] }, `📖 Album ${sub} (halaman ${page}/${pages})\nDah dapat: ${senaraiNama}\n${page < pages ? `Halaman seterusnya: .album ${sub} ${page + 1}` : ''}Lengkapkan set untuk hadiah: \`.album klaim\``);
        }

        if (cmd === 'gabung') {
            const pd = ensureP(sender), a = parseInt(args[0]) - 1, b = parseInt(args[1]) - 1;
            if (isNaN(a) || isNaN(b) || a === b || !pd.tong_ikan[a] || !pd.tong_ikan[b]) return reply('Gabung dua ikan dari tong: `.gabung [no1] [no2]` (rujuk `.ikan`).');
            const A = pd.tong_ikan[a], B = pd.tong_ikan[b], ra = ORDER.indexOf(rarityOf(A)), rb = ORDER.indexOf(rarityOf(B));
            if (Math.max(ra, rb) === 0) return reply('Sampah tak boleh digabung. Cari ikan sebenar dulu! 🗑️');
            let level = Math.max(ra, rb); if (level < 3 && Math.random() < 0.35) level++;
            const rarity = ORDER[level], harga = Math.round((A.harga + B.harga) * (rarity === 'mitos' ? 1.5 : 1.25));
            const buffSrc = [A, B].find(x => x.buff && x.buff !== 'Tiada');
            const fish = { nama: `${part(A.nama, true)}-${part(B.nama, false)} Hibrid 🧬`, harga, buff: buffSrc ? buffSrc.buff : 'Tiada', rarity, hybrid: true };
            pd.tong_ikan = pd.tong_ikan.filter((_, i) => i !== a && i !== b); pd.tong_ikan.push(fish); pd.dex[fish.nama] = true; savePancingDB();
            if (rarity === 'mitos') await logEvent({ type: 'mitos', actor: sender, nama: fish.nama, group: jid });
            return sock.sendMessage(jid, { image: renderCatchCard({ nama: fish.nama, rarity, harga, buff: fish.buff, owner: user.name }),
                caption: `🧬 *GABUNGAN BERJAYA!* ${noEmoji(A.nama)} + ${noEmoji(B.nama)} = *${fish.nama}* (${rarity.toUpperCase()})` }, { quoted: m });
        }
        void num; void pick; void rand; void mentions;
    }
};
