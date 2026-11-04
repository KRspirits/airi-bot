import { getAvatar } from '../lib/render.js';
import { extractText, parseCmd, mentions, num, rm, pick, rand } from '../lib/util.js';
import { sendCard } from '../lib/render.js';
import { renderCatchCard } from '../lib/card.js';
import { CATALOG, ensureP, ownedNames, rarityOf, savePancingDB } from '../lib/fish.js';
import { standings } from '../lib/season.js';
import { claim } from '../lib/mythic.js';
import { logEvent } from '../lib/log.js';

// Koleksi: album, gabung ikan (hibrid), liga mingguan, tangkap makhluk mitos.
const ORDER = ['sampah', 'biasa', 'rare', 'mitos'];
// Hadiah lengkap set (sekali je per set). Besar sengaja, ikut arahan owner.
const SET_REWARD = { biasa: 1000000, rare: 10000000, mitos: 100000000 }; // dikurangkan 10x supaya tetap bermakna
// Nombor album: 1 = biasa, 2 = rare, 3 = mitos.
const ALBUM_NO = { '1': 'biasa', '2': 'rare', '3': 'mitos' };
const ALBUM_LABEL = { biasa: 'ALBUM 1 · BIASA', rare: 'ALBUM 2 · RARE', mitos: 'ALBUM 3 · MITOS' };
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
            const users = await db.getAllUsers(), st = (await standings(users)).slice(0, 8);
            return sendCard(sock, jid, m, 'topCard', { title: 'LIGA MINGGUAN', subtitle: 'Pertambahan aset minggu ini  •  tamat Ahad 11 malam', accent: '#fbbf24',
                rows: st.map((r, i) => ({ name: r.name, sub: i < 3 ? `Hadiah RM ${[100000, 50000, 25000][i].toLocaleString('en-US')}` : '', value: (r.gain >= 0 ? '+' : '-') + rm(Math.abs(r.gain)) })) }, '🏆 Liga mingguan Airi\'s Corner');
        }

        if (cmd === 'album') {
            const pd = ensureP(sender), owned = ownedNames(pd);
            let sub = (args[0] || 'mitos').toLowerCase();
            if (sub === 'klaim') {
                user.album_claim ||= {}; let total = 0; const got = [];
                for (const r of ['biasa', 'rare', 'mitos']) {
                    if (user.album_claim[r] || !CATALOG[r].every(f => owned.has(f.nama))) continue;
                    user.album_claim[r] = true; total += SET_REWARD[r]; got.push(r);
                    const b = `Pakar ${r}`; if (!user.badges.includes(b)) user.badges.push(b);
                }
                if (!total) return reply('Belum ada set yang lengkap 100%. Teruskan memancing! 🎣');
                user.wallet += total; await db.saveUser(user);
                return reply(`🎉 *ALBUM LENGKAP!* Set ${got.join(', ')} siap. Hadiah ${rm(total)} + lencana baru!`);
            }
            sub = ALBUM_NO[sub] || sub;
            if (!CATALOG[sub] || sub === 'sampah') return reply('Pilihan: `.album 1` (biasa) | `.album 2` (rare) | `.album 3` (mitos) | `.album klaim`\nTambah nombor halaman, contoh: `.album mitos 2`');
            const semua = CATALOG[sub].map(f => ({ nama: f.nama, rarity: sub, owned: owned.has(f.nama) }));
            const PER = 12;
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
