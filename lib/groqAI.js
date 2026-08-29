import Groq from 'groq-sdk';
import { config } from '../config.js';

// Tetapan Kunci API Groq
const groqKey = config.groqKey || process.env.GROQ_API_KEY || '';
const groq = groqKey ? new Groq({ apiKey: groqKey.trim() }) : null;

// =========================================================================
// 🧠 LOCAL BRAIN FALLBACK (Sentiasa membalas jika API luar sibuk/limit)
// =========================================================================
const LOCAL_RESPONSES = {
    sapaan: [
        "Hai awak! Tengah lepak ke tu? Jangan lupa ajak Airi minum boba tau~ 🧋✨",
        "Airi kat sini! Ada apa panggil-panggil, rindu Airi ke tuu? 😋🌸",
        "Wassup! Airi tengah pantau grup ni, jangan buat perangai ya! 💨🤍"
    ],
    tanya: [
        "Hehe soalan awak tu mendalam sangat, tapi Airi rasa awak patut fokus kumpul duit dalam bot ni dulu! 😜",
        "Entahlah awak, otak comel Airi kata jawapannya bergantung pada nasib hidup harini~ ✨",
        "Rahsia alam tu awak! Yang penting sekarang joran dah baling belum? 🎣"
    ],
    roast: [
        "Eleh sembang kencang sangat, tengok dompet sendiri ada berapa sen je tu haha! 🤪💨",
        "Duk sibuk bising kat sini, kang Airi sumbat masuk lokap baru tahu! 🔒😋",
        "Koyak ke tuu? Dah kalah lumba haram lepastu nak cari pasal pulak~ 😜"
    ],
    umum: [
        "Hehe comel je awak ni! Tapi jangan kacau Airi sangat, tengah kira duit jualan ikan ni~ 🐟✨",
        "Airi dengar semuanya tau! Siapa buat hal Airi report kat Bos Amar kejap lagi! 👑💨",
        "Chill lah awak, hidup ni rileks-rileks je macam Airi~ 🌸😋"
    ]
};

function getLocalReply(text) {
    const t = text.toLowerCase();
    let pool = LOCAL_RESPONSES.umum;
    if (t.includes('hai') || t.includes('hello') || t.includes('assalam') || t.includes('pagi') || t.includes('malam')) {
        pool = LOCAL_RESPONSES.sapaan;
    } else if (t.includes('siapa') || t.includes('apa') || t.includes('kenapa') || t.includes('bila') || t.includes('mana')) {
        pool = LOCAL_RESPONSES.tanya;
    } else if (t.includes('kalah') || t.includes('koyak') || t.includes('benci') || t.includes('sengkek')) {
        pool = LOCAL_RESPONSES.roast;
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

// =========================================================================
// 🌐 1. TANYA AIRI (GROQ -> POLLINATIONS -> LOCAL BRAIN)
// =========================================================================
export async function askAiri(prompt, konteks = '') {
    const systemPrompt = `Nama kau Airi, maskot AI paling comel, ceria, periang dan suka menyakat manja dalam grup WhatsApp Malaysia!
Personaliti & Gaya Bahasa:
- Periang, comel, suka guna emoji manja (✨, 🥺, 😋, 🌸, 💨, 🤍).
- Bahasa santai lepak mamak campuran BM + BI pasar (guna 'aku-kau', 'weh', 'hehe', 'alaaa', 'tiber', 'koyak ke tuu~').
- Bila membahan orang tetap kedengaran comel dan menyakat kelakar.
- Ayat pendek, padat, dan bersahaja (1-2 ayat maksimum).
${konteks ? `Konteks situasi semasa: ${konteks}` : ''}`;

    // Percubaan 1: Groq AI (Model Gemma 2 9B IT)
    if (groq) {
        try {
            const res = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                model: 'gemma2-9b-it',
                temperature: 0.85,
                max_tokens: 120
            });
            const answer = res.choices[0]?.message?.content?.trim();
            if (answer) return answer;
        } catch (err) {
            console.warn('[GROQ LIMIT/ERROR] Beralih ke sandaran tanpa had...');
        }
    }

    // Percubaan 2: Pollinations AI (Sandaran Percuma Tanpa Had Kunci API)
    try {
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?system=${encodeURIComponent(systemPrompt)}&model=openai`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (res.ok) {
            const data = await res.text();
            if (data && data.trim().length > 0) return data.trim();
        }
    } catch (err) {
        console.warn('[POLLINATIONS TIMEOUT] Beralih ke respon tempatan...');
    }

    // Sandaran 3: Local Brain (Kalis ralat tersengguk)
    return getLocalReply(prompt);
}

// =========================================================================
// ⚖️ 2. HAKIM MAHKAMAH AIRI
// =========================================================================
export async function judgeCourtAppeal(nama, alasan) {
    const sysPrompt = `Kau Hakim Airi dalam Mahkamah Rendah Cyber. Watak kau hakim comel tapi tegas manja.
Nilaikan alasan pesalah sama ada kelakar/kreatif/logik atau mengarut.
Pesalah: ${nama}
Alasan Rayuan: "${alasan}"
WAJIB JAWAB IKUT FORMAT INI:
STATUS: [LEPAS / TOLAK]
ULASAN: [Ulasan 1 ayat comel]`;

    if (groq) {
        try {
            const res = await groq.chat.completions.create({
                messages: [{ role: 'user', content: sysPrompt }],
                model: 'gemma2-9b-it',
                temperature: 0.7,
                max_tokens: 100
            });
            const out = res.choices[0]?.message?.content || '';
            const isLepas = out.includes('STATUS: LEPAS');
            const ulasan = out.split('ULASAN:')[1]?.trim() || 'Duk diam dalam sel tu hehe~ 🔒';
            return { isLepas, ulasan };
        } catch (e) {}
    }

    // Fallback automatik Mahkamah jika API luar sibuk
    const lepassanRawak = Math.random() < 0.35;
    return {
        isLepas: lepassanRawak,
        ulasan: lepassanRawak 
            ? 'Airi rasa kesian tengok muka awak, kali ni Airi lepaskan! Jangan buat hal lagi tau~ ✨' 
            : 'Alasan mengarut sangat tu awak, duk diam-diam dalam sel fikir masa depan hehe~ 🔒'
    };
}

// =========================================================================
// 💎 3. TOKEY PAJAK GADAI AUTO-TAKSIR
// =========================================================================
export async function appraiseItem(namaBarang) {
    const sysPrompt = `Kau Airi tokey pajak gadai comel.
Taksir barang yang dibawa pelanggan dengan cerita dongeng kelakar & tentukan harga tunai rawak (antara RM 1,000 hingga RM 50,000).
Barang: ${namaBarang}
WAJIB FORMAT:
CERITA: [Cerita kelakar 1 ayat]
HARGA: [Nombor bulat sahaja]`;

    if (groq) {
        try {
            const res = await groq.chat.completions.create({
                messages: [{ role: 'user', content: sysPrompt }],
                model: 'gemma2-9b-it',
                temperature: 0.8,
                max_tokens: 120
            });
            const text = res.choices[0]?.message?.content || '';
            const cerita = text.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang ni ada ukiran misteri zaman dulu kala!';
            const match = text.match(/HARGA:\s*(\d+)/);
            const harga = match ? parseInt(match[1]) : Math.floor(Math.random() * 25000) + 2000;
            return { cerita, harga };
        } catch (e) {}
    }

    // Fallback automatik Pajak Gadai
    const rawakHarga = Math.floor(Math.random() * 30000) + 1500;
    return {
        cerita: `Kata orang tua-tua, ${namaBarang} ni pernah tercicir masa zaman perang angkasa dulu!`,
        harga: rawakHarga
    };
}

// =========================================================================
// 📜 4. PENILAI PANTUN
// =========================================================================
export async function verifyPantun(pantunUser) {
    if (pantunUser.length < 15) {
        return { passed: false, ulasan: 'Pendek sangat ni awak, tak cukup syarat rangkap pantun hehe~' };
    }
    return { 
        passed: true, 
        ulasan: 'Wah berpuitis sungguh! Airi bagi markah penuh untuk rima awak ni~ 🌸✨' 
    };
}
