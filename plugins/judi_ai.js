import { resolveJid } from '../lib/lidmap.js';
import { hantarKlip } from '../lib/klipkongsi.js';
import { sceneCard } from '../lib/scene.js';
import { panelCard } from '../lib/cards.js';
import { sendCard } from '../lib/render.js';
import { allow } from '../lib/cooldown.js';
import { num } from '../lib/util.js';

// =========================================================================
// 🎰 JUDI AI - permainan ekonomi ringkas dengan kad hasil & komen AI.
// Duit guna pattern sedia ada: wallet ditolak bila taruhan, ditambah bila menang.
// Had taruhan: min RM100, maks RM5,000. Cooldown 15 saat per user.
// Setiap permainan ada kadar pulangan (RTP) < 100%, jadi rumah sentiasa ada kelebihan.
// Komen AI optional: jika Gemini tak sedia, guna ayat simpanan. Permainan tetap jalan.
// =========================================================================

export const MIN_BET = 100;
export const MAX_BET = 5000;

// ---------- logik permainan (pure, boleh diuji tanpa WhatsApp) ----------
// rng: fungsi pulang nombor 0..1. Pulang { mult, label } (mult 0 = kalah).

export const GAMES = {
    tekaan: {
        desc: 'Teka nombor 1-10. Betul = x8.',
        parse: a => ({ pilih: parseInt(a[0]) }),
        valid: p => p.pilih >= 1 && p.pilih <= 10,
        settle: (p, rng) => {
            const keluar = Math.floor(rng() * 10) + 1;
            return { mult: keluar === p.pilih ? 8 : 0, label: `Nombor keluar: ${keluar}` };
        }
    },
    roda: {
        desc: 'Putar roda nasib.',
        parse: () => ({}),
        valid: () => true,
        settle: (_, rng) => {
            // berat (weight) : pelbagai pulangan, jumlah berat 100
            const roda = [[40, 0], [25, 0.5], [15, 1], [10, 2], [6, 3], [3, 5], [1, 10]];
            let r = rng() * 100, acc = 0;
            for (const [w, mult] of roda) { acc += w; if (r < acc) return { mult, label: `Roda berhenti di x${mult}` }; }
            return { mult: 0, label: 'Roda berhenti di x0' };
        }
    },
    kad_besar: {
        desc: 'Kad seterusnya lebih tinggi (h) atau rendah (r)? Sama = kalah. Menang = x1.9.',
        parse: a => ({ arah: (a[0] || '').toLowerCase() }),
        valid: p => p.arah === 'h' || p.arah === 'r',
        settle: (p, rng) => {
            const k1 = Math.floor(rng() * 13) + 1, k2 = Math.floor(rng() * 13) + 1;
            const menang = k2 !== k1 && ((p.arah === 'h' && k2 > k1) || (p.arah === 'r' && k2 < k1));
            return { mult: menang ? 1.9 : 0, label: `Kad ${k1} lawan ${k2}` };
        }
    },
    dadu7: {
        desc: 'Dua dadu. atas (8-12) x1.9, bawah (2-6) x1.9, tujuh x4.',
        parse: a => ({ pilihan: (a[0] || '').toLowerCase() }),
        valid: p => ['atas', 'bawah', 'tujuh'].includes(p.pilihan),
        settle: (p, rng) => {
            const jumlah = (Math.floor(rng() * 6) + 1) + (Math.floor(rng() * 6) + 1);
            const hasil = jumlah === 7 ? 'tujuh' : jumlah > 7 ? 'atas' : 'bawah';
            // Untuk "atas"/"bawah", tujuh ialah kalah (rumah ambil).
            const mult = p.pilihan === hasil ? (hasil === 'tujuh' ? 4 : 1.9) : 0;
            return { mult, label: `Dadu jumlah ${jumlah} (${hasil})` };
        }
    },
    peti: {
        desc: 'Pilih 1 peti daripada 5. Satu ada x3, satu ada x1, selebihnya kosong.',
        parse: a => ({ pilih: parseInt(a[0]) }),
        valid: p => p.pilih >= 1 && p.pilih <= 5,
        settle: (p, rng) => {
            const slot = [3, 1, 0, 0, 0];
            for (let i = slot.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [slot[i], slot[j]] = [slot[j], slot[i]]; }
            return { mult: slot[p.pilih - 1], label: `Peti ${p.pilih}: x${slot[p.pilih - 1]}` };
        }
    },
    kupon: {
        desc: 'Kupon gosok. 3 simbol sama = x10, 2 sama = x1.5.',
        parse: () => ({}),
        valid: () => true,
        settle: (_, rng) => {
            const sym = ['🍒', '🐟', '💎', '🎀', '⭐', '🔥'];
            const s = [0, 0, 0].map(() => sym[Math.floor(rng() * sym.length)]);
            const same = Number(s[0] === s[1]) + Number(s[1] === s[2]) + Number(s[0] === s[2]);
            const mult = same === 3 ? 10 : same >= 1 ? 1.5 : 0;
            return { mult, label: s.join(' ') };
        }
    }
};

/** Kira pulangan (RTP) secara simulasi. Dipakai untuk semakan, bukan dalam bot. */
export function simulateRTP(name, args, n = 100000, rng = Math.random) {
    const g = GAMES[name];
    const p = g.parse(args);
    let total = 0;
    for (let i = 0; i < n; i++) total += g.settle(p, rng).mult;
    return total / n;
}

// ---------- komen AI dengan fallback ----------
const FALLBACK = {
    menang: ['Ehhh bertuah betul! Airi pun rasa cemburu~ 🎉', 'Wah, tangan awak panas hari ni! 🔥'],
    kalah: ['Alamak, duit masuk poket rumah. Sabar ya~ 🥲', 'Jangan risau, Airi simpan kuih untuk awak. 🍪']
};

async function komen(nama, menang, label) {
    try {
        const { askPlain } = await import('../lib/geminiAI.js');
        const out = await askPlain(`Tulis 1 ayat pendek, lucu dan ceria dalam Bahasa Melayu untuk seseorang yang ${menang ? 'menang' : 'kalah'} permainan ${nama}. Hasil: ${label}. Jangan menggoda.`);
        if (out) return out.split('\n')[0].slice(0, 200);
    } catch { /* guna fallback */ }
    const pool = menang ? FALLBACK.menang : FALLBACK.kalah;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ---------- pengendali command ----------
const ALIAS = [...Object.keys(GAMES), 'tarung'];

export default {
    name: 'judi_ai',
    alias: ALIAS,
    category: 'judi',
    execute: async ({ sock, m, db }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const reply = (text, extra = {}) => sock.sendMessage(jid, { text, ...extra }, { quoted: m });
        try {
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const parts = teks.trim().split(/\s+/);
            const cmd = parts[0].slice(1).toLowerCase();
            const args = parts.slice(1);
            if (!ALIAS.includes(cmd)) return;

            if (!allow(sender + ':judi_ai', 15000)) return reply('⏳ Sabar, meja tengah sibuk. Cuba 15 saat lagi.');

            if (cmd === 'tarung') return tarung(sock, m, db, sender, jid, args);

            const game = GAMES[cmd];
            const betRaw = args[args.length - 1]; // taruhan ialah nombor TERAKHIR
            const bet = /^\d+$/.test(betRaw || '') ? Number(betRaw) : 0;
            if (!bet || bet < MIN_BET || bet > MAX_BET) return reply(`❌ Taruhan antara RM ${MIN_BET.toLocaleString()} hingga RM ${MAX_BET.toLocaleString()}.`);
            const p = game.parse(args.slice(0, -1));
            if (!game.valid(p)) return reply(`❌ ${game.desc}\nContoh: \`.${cmd} ...\``);

            const user = await db.getUser(sender);
            if ((user.wallet || 0) < bet) return reply(`❌ Duit poket tak cukup. Awak ada RM ${num(user.wallet || 0)}.`);

            user.wallet -= bet;
            const { mult, label } = game.settle(p, Math.random);
            const payout = Math.round(bet * mult);
            user.wallet += payout;
            user.stats = user.stats || {};
            user.stats.judi_ai = (user.stats.judi_ai || 0) + 1;
            await db.saveUser(user);

            const net = payout - bet;
            const menang = net > 0;
            const cerita = await komen(cmd, menang, label);
            const card = await panelCard({
                kicker: 'JUDI AI',
                title: cmd.toUpperCase().replace('_', ' '),
                lines: [`Hasil: ${label}`, `Taruhan: RM ${bet.toLocaleString('en-US')}`, `Baki: RM ${Number(user.wallet).toLocaleString('en-US')}`],
                accent: menang ? '#4ade80' : '#fb7185',
                big: `${net >= 0 ? '+' : '-'}RM ${Math.abs(net).toLocaleString('en-US')}`,
                bigLabel: menang ? 'MENANG' : 'KALAH',
                footerText: `💬 Airi: ${cerita}`
            });
            const gambarKeputusan = mult >= 8 ? sceneCard('jackpot') : card;
            if (mult >= 8) hantarKlip(sock, jid, m, 'jackpot', { pengganda: mult }, '🎰 JACKPOT!').catch(() => {});
            return sock.sendMessage(jid, { image: gambarKeputusan, caption: `🎰 ${cmd} | ${menang ? 'Menang' : 'Kalah'}` }, { quoted: m });
        } catch (e) {
            console.error('[JUDI AI]', e.message);
            return reply('⚠️ Meja kasino tersekat sekejap. Cuba lagi.');
        }
    }
};

async function tarung(sock, m, db, sender, jid, args) {
    const reply = (text, extra = {}) => sock.sendMessage(jid, { text, ...extra }, { quoted: m });
    const betRaw = args[args.length - 1];
    const bet = /^\d+$/.test(betRaw || '') ? Number(betRaw) : 0;
    const target = resolveJid(m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]);
    if (!target || target === sender) return reply('❌ Format: `.tarung @nama [jumlah]`. Tag lawan awak.');
    if (!bet || bet < MIN_BET || bet > MAX_BET) return reply(`❌ Taruhan antara RM ${MIN_BET.toLocaleString()} hingga RM ${MAX_BET.toLocaleString()}.`);
    const a = await db.getUser(sender), b = await db.getUser(target);
    if ((a.wallet || 0) < bet) return reply('❌ Duit awak tak cukup untuk tarung.');
    if ((b.wallet || 0) < bet) return reply('❌ Lawan awak tak cukup duit untuk tarung ni.');
    a.wallet -= bet; b.wallet -= bet;
    const menangA = Math.random() < 0.5;
    const winner = menangA ? a : b, loser = menangA ? b : a;
    winner.wallet += bet * 2; // pemenang ambil kedua-dua taruhan
    await db.saveUser(a); await db.saveUser(b);
    const cerita = await komen('tarung', true, `${num(winner === a ? sender : target)} lawan ${num(loser === a ? sender : target)}`);
    return reply(`⚔️ *TARUNG AI*\nTaruhan: RM ${bet.toLocaleString()} setiap orang\n🏆 Pemenang: @${num(winner === a ? sender : target)} (+RM ${bet.toLocaleString()})\n💀 Kalah: @${num(loser === a ? sender : target)}\n\n💬 Airi: ${cerita}`, { mentions: [sender, target] });
}

export { GAMES as _games };
