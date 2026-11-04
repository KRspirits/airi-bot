import crypto from 'crypto';
import { allow } from '../lib/cooldown.js';
import { myt, pick, rand } from '../lib/util.js';

// =========================================================================
// 🎀 FUN50 - 50 command ringan untuk Airi's Corner.
// Semua tanpa API luar dan tanpa sentuh duit/ekonomi, jadi selamat untuk Render.
// Satu plugin, banyak alias. Cooldown 3 saat per user untuk elak spam.
// =========================================================================

const DATA = {
    fakta: [
        'Madu tak pernah reput. Ada madu dalam makam Mesir yang masih boleh dimakan.',
        'Pisang secara teknikal ialah beri, tapi strawberi bukan.',
        'Oktopus ada tiga jantung dan darahnya biru.',
        'Kucing tak boleh rasa manis.',
        'Lebah boleh kenal muka manusia.'
    ],
    motivasi: [
        'Hari ni tak perlu sempurna. Cukup awak mula.',
        'Awak dah jauh lebih kuat daripada masa awak mula dulu.',
        'Kerja kecil setiap hari lebih kuat daripada usaha besar sekali je.',
        'Rehat itu bukan kalah. Awak tetap boleh teruskan selepas tu.'
    ],
    horoskop: [
        'Hari ni bintang awak cerah. Ada peluang kecil yang buat awak senyum.',
        'Elak bergaduh dalam group. Diam kadang-kadang lebih menang.',
        'Duit datang perlahan. Jangan belanja semua sekali.',
        'Ada seseorang yang rindu awak. Cuba mesej dia.'
    ],
    ramalan: [
        'Esok ada kejutan kecil yang positif.',
        'Jangan terlalu percaya mesej "last minute" hari ni.',
        'Makan sedap hari ni, tapi jangan lupa bayar hutang.',
        'Peluang besar akan sampai bila awak berhenti tunggu.'
    ],
    jokes: [
        'Kenapa ikan tak pernah main tenis? Takut tersangkut di jaring.',
        'Apa beza kopi dengan Airi? Kopi buat awak bangun, Airi buat awak lapar.',
        'Doktor: awak perlu kurang makan. Pesakit: tapi saya tak makan pun. Doktor: itu sebab kurang tu.',
        'Kenapa komputer sejuk? Sebab ada banyak Windows terbuka.'
    ],
    quotes: [
        'Yang penting bukan laju, tapi konsisten.',
        'Kawan sejati ialah yang tegur awak sebelum orang lain mengutuk.',
        'Jangan takut mula dari kecil.'
    ],
    teka: [
        ['Ada kota, tiada rumah. Ada gunung, tiada pokok. Ada air, tiada ikan. Apa tu?', 'peta'],
        ['Makin banyak awak ambil, makin besar lubang. Apa tu?', 'lubang'],
        ['Saya ada leher tapi tak ada kepala. Saya ada badan tapi tak ada tangan. Apa saya?', 'botol'],
        ['Hijau di luar, merah di dalam, ramai suka tapi bukan semua. Apa tu?', 'tembikai']
    ],
    cerita: [
        'Ada seekor ikan kembung yang bercita-cita jadi jerung. Setiap hari dia berlatih melawan arus, sampai satu hari dia sedar arus tu hanyalah kolam air mandi kucing.',
        'Seorang pemancing sabar menunggu lapan jam. Ikan pertama yang naik ialah selipar. Dia tetap gelak dan mengumpulnya untuk dijual.'
    ],
    warna: ['Merah jambu', 'Biru laut', 'Hijau pucuk', 'Kuning kunyit', 'Ungu lavender', 'Oren senja', 'Putih susu', 'Hitam malam'],
    emoji: ['🌸', '🐟', '✨', '🎀', '🔥', '🌊', '🍜', '🦑', '💎', '🌙'],
    tips: [
        'Tulis 3 benda yang awak nak siap hari ni, bukan 10.',
        'Tutup notifikasi 25 minit sekali untuk fokus.',
        'Minum air dulu sebelum buka telefon pagi-pagi.',
        'Simpan duit dulu, belanja kemudian.'
    ],
    gelaran: ['Ratu Lorong Belakang', 'Ahli Kopi Tiga Kosong', 'Tuan Pancing Subuh', 'Jeneral Selipar', 'Dewi Group Chat', 'Sultan Tengah Malam'],
    ucapanPagi: ['Selamat pagi! Jangan lupa sarapan ya 🌸', 'Pagi! Hari baru, peluang baru ✨'],
    ucapanMalam: ['Selamat malam. Tidur cukup, esok kita main lagi 🌙', 'Malam ni rehat dulu ya, Airi tunggu esok 🎀'],
    doa: [
        'Ya Allah, permudahkan urusan kami hari ini. Amin.',
        'Ya Allah, berkatilah rezeki yang Engkau beri. Amin.'
    ],
    pantun: [
        'Pergi pasar beli ikan,\nBawa pulang dalam raga,\nJangan simpan rasa marah,\nKita kongsi tawa saja.',
        'Pagi-pagi minum kopi,\nSambil baca berita hari ini,\nKalau rindu jangan malu,\nTaip sahaja, Airi di sini.'
    ]
};

const SUIT = ['batu', 'gunting', 'kertas'];
const SUIT_WIN = { batu: 'gunting', gunting: 'kertas', kertas: 'batu' };
const BOLA8 = ['Ya, tanpa ragu.', 'Mungkin.', 'Tanya lagi nanti.', 'Tak mungkin.', 'Jangan harap.', 'Sangat mungkin!', 'Sudah tentu tidak.', 'Fokus dan tanya semula.'];
const RATE_LABEL = n => n >= 9 ? 'Legenda' : n >= 7 ? 'Power' : n >= 5 ? 'Okay je' : n >= 3 ? 'Perlu usaha' : 'Kena cuba lagi';
const KIRA_OPS = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, 'x': (a, b) => a * b, '/': (a, b) => (b === 0 ? NaN : a / b) };

const seedOf = s => crypto.createHash('md5').update(String(s)).digest().readUInt32BE(0);
const seededPick = (arr, seed) => arr[seed % arr.length];
const seededInt = (seed, a, b) => (seed % (b - a + 1)) + a;

// Helper untuk reply.
const say = (sock, jid, m, text, extra = {}) => sock.sendMessage(jid, { text, ...extra }, { quoted: m });

const HANDLERS = {
    dadu: (a) => `🎲 Dadu: *${rand(1, 6)}*`,
    dadu2: () => `🎲🎲 ${rand(1, 6)} + ${rand(1, 6)}`,
    koin: () => `🪙 *${Math.random() < 0.5 ? 'KEPALA' : 'EKOR'}*`,
    bola8: (a) => a.length ? `🎱 ${pick(BOLA8)}` : '❌ Tanya soalan dulu, contoh: `.bola8 esok hujan?`',
    suit: (a) => {
        const pilihan = (a[0] || '').toLowerCase();
        if (!SUIT.includes(pilihan)) return '❌ Format: `.suit batu/gunting/kertas`';
        const bot = pick(SUIT);
        const hasil = pilihan === bot ? 'Seri!' : SUIT_WIN[pilihan] === bot ? 'Awak menang! 🎉' : 'Airi menang! 😜';
        return `✊ Awak: *${pilihan}* | Airi: *${bot}*\n${hasil}`;
    },
    pilihan: (a) => {
        const opts = a.join(' ').split('|').map(s => s.trim()).filter(Boolean);
        if (opts.length < 2) return '❌ Format: `.pilihan makan nasi|makan mee`';
        return `🎯 Airi pilih: *${pick(opts)}*`;
    },
    ship: (a) => {
        if (a.length < 2) return '❌ Format: `.ship nama1 nama2`';
        const p = seedOf(a.join('|').toLowerCase()) % 101;
        return `💞 ${a[0]} x ${a[1]}\nPeratus padanan: *${p}%*`;
    },
    rate: (a) => {
        const subjek = a.join(' ') || 'awak';
        const n = seedOf(subjek.toLowerCase()) % 11;
        return `⭐ Rating untuk *${subjek}*: ${n}/10 (${RATE_LABEL(n)})`;
    },
    mood: (a) => {
        const subjek = a.join(' ') || 'awak';
        const mood = ['ceria', 'mengantuk', 'bersemangat', 'lapar', 'serabut', 'tenang'];
        return `🌈 Mood *${subjek}* hari ni: ${seededPick(mood, seedOf(subjek + myt().day))}`;
    },
    horoskop: (a) => {
        const z = a.join(' ') || 'awak';
        return `🔮 Horoskop *${z}*: ${seededPick(DATA.horoskop, seedOf(z + myt().day))}`;
    },
    zodiak: (a) => {
        const z = ['Kambing', 'Lembu', 'Kembar', 'Ketam', 'Singa', 'Dara', 'Penimbang', 'Kala', 'Memanah', 'Tugu', 'Air', 'Ikan'];
        const nama = a.join(' ') || 'awak';
        return `♈ Zodiak *${nama}*: ${seededPick(z, seedOf(nama))}`;
    },
    ramal: (a) => `🔮 ${seededPick(DATA.ramalan, seedOf((a.join(' ') || 'awak') + myt().day))}`,
    motivasi: () => `💪 ${pick(DATA.motivasi)}`,
    fakta: () => `🧠 ${pick(DATA.fakta)}`,
    joke: () => `😂 ${pick(DATA.jokes)}`,
    quote: () => `📜 "${pick(DATA.quotes)}"`,
    bmi: (a) => {
        const kg = parseFloat(a[0]), cm = parseFloat(a[1]);
        if (!kg || !cm) return '❌ Format: `.bmi 70 170` (kg, cm)';
        const bmi = kg / ((cm / 100) ** 2);
        const label = bmi < 18.5 ? 'Kurang berat' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Berlebihan' : 'Obes';
        return `⚖️ BMI awak: *${bmi.toFixed(1)}* (${label})`;
    },
    umur: (a) => {
        const d = new Date(a[0]);
        if (isNaN(d)) return '❌ Format: `.umur 2000-05-17`';
        const now = new Date();
        let y = now.getFullYear() - d.getFullYear();
        if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) y--;
        return y < 0 ? '❌ Tarikh masa depan.' : `🎂 Umur: *${y} tahun*`;
    },
    hari: () => `📅 Hari ini: *${new Intl.DateTimeFormat('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())}*`,
    jam: () => `🕒 Jam di Malaysia: *${new Intl.DateTimeFormat('ms-MY', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())}*`,
    hitung: (a) => `🔢 Jumlah perkataan: *${a.join(' ').trim().split(/\s+/).filter(Boolean).length}*`,
    besar: (a) => (a.join(' ').toUpperCase() || '❌ Tulis teks.'),
    kecil: (a) => (a.join(' ').toLowerCase() || '❌ Tulis teks.'),
    terbalik: (a) => [...(a.join(' ') || '❌ Tulis teks.')].reverse().join(''),
    mock: (a) => [...a.join(' ')].map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join('') || '❌ Tulis teks.',
    base64enc: (a) => a.length ? Buffer.from(a.join(' ')).toString('base64') : '❌ Tulis teks.',
    base64dec: (a) => a.length ? Buffer.from(a.join(' '), 'base64').toString('utf8') : '❌ Tulis teks base64.',
    hash: (a) => a.length ? `🔐 MD5: ${crypto.createHash('md5').update(a.join(' ')).digest('hex')}` : '❌ Tulis teks.',
    passgen: (a) => {
        const len = Math.min(Math.max(parseInt(a[0]) || 12, 6), 32);
        const set = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
        const bytes = crypto.randomBytes(len);
        return `🔑 Password (${len}): \`${[...bytes].map(b => set[b % set.length]).join('')}\``;
    },
    rawak: (a) => {
        const lo = parseInt(a[0]) || 1, hi = parseInt(a[1]) || 100;
        return `🎰 Nombor rawak (${Math.min(lo, hi)}-${Math.max(lo, hi)}): *${rand(Math.min(lo, hi), Math.max(lo, hi))}*`;
    },
    lotot: () => {
        const set = new Set();
        while (set.size < 6) set.add(rand(1, 49));
        return `🎟️ Nombor lotot: *${[...set].sort((x, y) => x - y).join(' - ')}*`;
    },
    kad: () => {
        const nilai = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const sut = ['♠️', '♥️', '♦️', '♣️'];
        return `🃏 Kad awak: *${pick(nilai)}${pick(sut)}*`;
    },
    teka: () => {
        const [soalan] = pick(DATA.teka);
        return `🧩 ${soalan}\n_Jawab dengan \`.jawab_teka [jawapan]\`_`;
    },
    jawab_teka: (a) => {
        const jawapan = (a[0] || '').toLowerCase();
        const current = DATA.teka.find(([, j]) => j === jawapan);
        return current ? '✅ Betul! Pandai awak.' : '❌ Belum tepat. Cuba lagi!';
    },
    ucapan: () => {
        const jam = myt().h;
        return jam < 12 ? pick(DATA.ucapanPagi) : pick(DATA.ucapanMalam);
    },
    selamatpagi: () => pick(DATA.ucapanPagi),
    selamatmalam: () => pick(DATA.ucapanMalam),
    doa: () => `🤲 ${pick(DATA.doa)}`,
    emoji: () => pick(DATA.emoji),
    kira: (a) => {
        const [x, op, y] = a;
        const fn = KIRA_OPS[op];
        const na = Number(x), nb = Number(y);
        if (!fn || isNaN(na) || isNaN(nb)) return '❌ Format: `.kira 12 + 5` (guna + - * / )';
        const r = fn(na, nb);
        return isNaN(r) ? '❌ Tak boleh bahagi dengan 0.' : `🧮 ${na} ${op} ${nb} = *${Number(r.toFixed(4))}*`;
    },
    peratus: (a) => {
        const bahagian = parseFloat(a[0]), jumlah = parseFloat(a[1]);
        if (!jumlah || isNaN(bahagian)) return '❌ Format: `.peratus 25 200`';
        return `📊 ${bahagian} daripada ${jumlah} = *${((bahagian / jumlah) * 100).toFixed(2)}%*`;
    },
    tukarc: (a) => {
        const c = parseFloat(a[0]);
        return isNaN(c) ? '❌ Format: `.tukarc 30`' : `🌡️ ${c}°C = *${(c * 9 / 5 + 32).toFixed(1)}°F*`;
    },
    tukarkg: (a) => {
        const kg = parseFloat(a[0]);
        return isNaN(kg) ? '❌ Format: `.tukarkg 70`' : `⚖️ ${kg} kg = *${(kg * 2.20462).toFixed(2)} lb*`;
    },
    bintang: (a) => {
        const n = Math.max(1, Math.min(5, parseInt(a[0]) || rand(1, 5)));
        return `⭐ ${'⭐'.repeat(n - 1)}${'☆'.repeat(5 - n)} (${n}/5)`;
    },
    warna: () => `🎨 Warna hari ni: *${pick(DATA.warna)}*`,
    gelar: (a) => `👑 Gelaran untuk *${a.join(' ') || 'awak'}*: ${seededPick(DATA.gelaran, seedOf(a.join(' ') || 'awak'))}`,
    kira_hari: (a) => {
        const t = new Date(a[0]);
        if (isNaN(t)) return '❌ Format: `.kira_hari 2026-12-31`';
        const beza = Math.ceil((t - new Date()) / 86400000);
        return beza >= 0 ? `⏳ Lagi *${beza} hari* ke ${a[0]}` : `⏳ Dah lepas *${-beza} hari* dari ${a[0]}`;
    },
    putar: (a) => {
        const pilihan = a.join(' ').split('|').map(s => s.trim()).filter(Boolean);
        if (pilihan.length < 2) return '❌ Format: `.putar merah|biru|hijau`';
        return `🎡 Roda berhenti di: *${pick(pilihan)}*`;
    },
    tips: () => `💡 ${pick(DATA.tips)}`,
    cerita: () => `📖 ${pick(DATA.cerita)}`
};

const ALIAS = Object.keys(HANDLERS);

export default {
    name: 'fun50',
    alias: ALIAS,
    category: 'fun',
    execute: async ({ sock, m }) => {
        try {
            const jid = m.key.remoteJid;
            const sender = m.key.participant || jid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const parts = teks.trim().split(/\s+/);
            const cmd = parts[0].slice(1).toLowerCase();
            const args = parts.slice(1);
            const handler = HANDLERS[cmd];
            if (!handler) return;
            if (!allow(sender + ':fun50', 3000)) return;
            const out = handler(args);
            return say(sock, jid, m, typeof out === 'string' ? out : String(out));
        } catch (e) {
            console.error('[FUN50]', e.message);
        }
    }
};

export { HANDLERS as _handlers, ALIAS as _aliases };
