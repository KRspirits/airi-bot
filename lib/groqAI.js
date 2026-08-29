import Groq from 'groq-sdk';
import { config } from '../config.js';

const rawKey = config.groqKey || process.env.GROQ_API_KEY || '';
const cleanKey = rawKey.trim();
const groq = cleanKey ? new Groq({ apiKey: cleanKey }) : null;

// Model rasmi aktif di Groq (Llama 3.2 Series)
const PRIMARY_MODEL = 'llama-3.2-3b-preview';
const FALLBACK_MODEL = 'llama-3.2-1b-preview';

// Enjin Sandaran Percuma Tanpa Had (Pollinations via POST JSON)
async function callPollinationsAI(prompt, systemInstruction) {
    try {
        const res = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: prompt }
                ],
                model: 'openai',
                seed: Math.floor(Math.random() * 1000)
            }),
            signal: AbortSignal.timeout(8000)
        });

        if (res.ok) {
            const reply = await res.text();
            if (reply && reply.trim().length > 0 && !reply.includes('Internal Server Error')) {
                return reply.trim();
            }
        }
    } catch (err) {
        console.warn('[SANDARAN AI WARN]: Gagal menghubungi enjin sandaran:', err?.message || err);
    }
    return null;
}

// =========================================================================
// 🌐 1. FUNGSI TANYA AIRI
// =========================================================================
export async function askAiri(prompt, konteks = '') {
    const sysPrompt = `Nama kau Airi, maskot AI paling comel, ceria, periang dan suka menyakat manja dalam grup WhatsApp Malaysia!
Personaliti:
- Periang, comel, suka guna emoji manja (✨, 🥺, 😋, 🌸, 💨, 🤍).
- Bahasa santai lepak mamak campuran BM + BI pasar (guna 'aku-kau', 'weh', 'hehe', 'koyak ke tuu~').
- Bila membahan tetap bersahaja dan menyakat kelakar.
- Jawapan pendek dan santai (1-2 ayat sahaja).
${konteks ? `Konteks semasa: ${konteks}` : ''}`;

    // A. CUBA GROQ TERLEBIH DAHULU (PRIMARY MODEL)
    if (groq) {
        try {
            const res = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: prompt }
                ],
                model: PRIMARY_MODEL,
                temperature: 0.8,
                max_tokens: 120
            });
            const text = res.choices[0]?.message?.content?.trim();
            if (text) return text;
        } catch (err) {
            console.warn(`⚠️ [GROQ ${PRIMARY_MODEL} FAILED]:`, err?.status, err?.message || err);

            // Cuba Fallback Model Llama 3.2 1B
            try {
                const resFallback = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: sysPrompt },
                        { role: 'user', content: prompt }
                    ],
                    model: FALLBACK_MODEL,
                    temperature: 0.8,
                    max_tokens: 120
                });
                const textFallback = resFallback.choices[0]?.message?.content?.trim();
                if (textFallback) return textFallback;
            } catch (errFallback) {
                console.error('⚠️ [GROQ FALLBACK ERROR]:', errFallback?.status, errFallback?.message || errFallback);
            }
        }
    } else {
        console.warn('⚠️ [GROQ NOTICE]: Kunci GROQ_API_KEY tidak dikesan.');
    }

    // B. JIKA GROQ GAGAL, GUNAKAN ENJIN SANDARAN (POLLINATIONS)
    const backupReply = await callPollinationsAI(prompt, sysPrompt);
    if (backupReply) return backupReply;

    // C. JIKA SEMUA API SIBUK / TERPUTUS
    const jawapanSpontan = [
        "Hehe ada apa panggil Airi ni? Rindu ke tuu~ 😋✨",
        "Airi kat sini lah! Awak jangan buat hal tau, kang Airi panggil polis balai haha~ 🚓💨",
        "Wassup! Sibuk sikit lepak kedai mamak, tapi Airi tetap ada untuk awak! 🧋🌸",
        "Eleh tiber je panggil Airi, nak belanja Airi boba ke tu? 🥺🤍",
        "Airi dengar semuanya tau! Rileks-rileks dulu sambil baling joran mancing sana tu~ 🎣😋"
    ];
    return jawapanSpontan[Math.floor(Math.random() * jawapanSpontan.length)];
}

// =========================================================================
// ⚖️ 2. HAKIM MAHKAMAH AIRI
// =========================================================================
export async function judgeCourtAppeal(nama, alasan) {
    const sysPrompt = `Bertindak sebagai Hakim Mahkamah Airi yang comel tapi tegas.
Pesalah: ${nama}
Alasan Rayuan: "${alasan}"
Format Jawapan (WAJIB IKUT FORMAT):
STATUS: [LEPAS / TOLAK]
ULASAN: [Ulasan comel 1 ayat ringkas]`;

    if (groq) {
        try {
            const res = await groq.chat.completions.create({
                messages: [{ role: 'user', content: sysPrompt }],
                model: PRIMARY_MODEL,
                temperature: 0.7,
                max_tokens: 100
            });
            const out = res.choices[0]?.message?.content || '';
            const isLepas = out.includes('STATUS: LEPAS');
            const ulasan = out.split('ULASAN:')[1]?.trim() || 'Duk diam dalam lokap tu ya hehe~ 🔒';
            return { isLepas, ulasan };
        } catch (e) {
            console.error('⚠️ [COURT GROQ ERROR]:', e?.message);
        }
    }

    const backupOut = await callPollinationsAI(sysPrompt, "Format: STATUS: [LEPAS / TOLAK] dan ULASAN: [teks]");
    if (backupOut) {
        const isLepas = backupOut.includes('STATUS: LEPAS');
        const ulasan = backupOut.split('ULASAN:')[1]?.trim() || 'Duk diam dalam sel lokap tu dulu! 🔒';
        return { isLepas, ulasan };
    }

    const autoLepas = Math.random() < 0.35;
    return {
        isLepas: autoLepas,
        ulasan: autoLepas 
            ? 'Airi kesian tengok muka awak, kali ni Airi bebaskan! Jangan buat jahat lagi tau~ ✨' 
            : 'Alasan tak masuk akal, duduk renung dinding lokap tu dulu! 🔒'
    };
}

// =========================================================================
// 💎 3. AUTO-TAKSIR PAJAK GADAI
// =========================================================================
export async function appraiseItem(namaBarang) {
    const sysPrompt = `Bertindak sebagai Airi pemilik kedai pajak gadai comel.
Taksir nilai barang: "${namaBarang}".
Format Jawapan:
CERITA: [Cerita kelakar 1 ayat]
HARGA: [Nombor sahaja antara 1000 hingga 50000]`;

    if (groq) {
        try {
            const res = await groq.chat.completions.create({
                messages: [{ role: 'user', content: sysPrompt }],
                model: PRIMARY_MODEL,
                temperature: 0.8,
                max_tokens: 120
            });
            const text = res.choices[0]?.message?.content || '';
            const cerita = text.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang ni ada ukiran misteri zaman dulu!';
            const match = text.match(/HARGA:\s*(\d+)/);
            const harga = match ? parseInt(match[1]) : Math.floor(Math.random() * 25000) + 1500;
            return { cerita, harga };
        } catch (e) {
            console.error('⚠️ [APPRAISE GROQ ERROR]:', e?.message);
        }
    }

    return {
        cerita: `Barang ${namaBarang} ni nampak berkilat macam khazanah purba!`,
        harga: Math.floor(Math.random() * 25000) + 2000
    };
}

// =========================================================================
// 📜 4. PENILAI PANTUN
// =========================================================================
export async function verifyPantun(pantunUser) {
    if (pantunUser.length < 15) {
        return { passed: false, ulasan: 'Pendek sangat pantun tu awak, tak cukup rangkap hehe~' };
    }
    return { 
        passed: true, 
        ulasan: 'Wah pandai berpantun! Airi bagi markah penuh untuk rima awak ni~ 🌸✨' 
    };
}
