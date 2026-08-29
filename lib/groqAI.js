import { config } from '../config.js';

// Ambil kunci API OpenRouter daripada pemboleh ubah persekitaran
const apiKey = process.env.OPENROUTER_API_KEY || '';

async function queryOpenRouter(messages, maxTokens = 120) {
    if (!apiKey) {
        console.warn('⚠️ [OPENROUTER NOTICE]: Kunci OPENROUTER_API_KEY belum diset.');
        return null;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://render.com',
                'X-Title': 'Airi WhatsApp Bot'
            },
            body: JSON.stringify({
                // Router percuma yang sentiasa memilih model aktif secara automatik
                model: 'openrouter/free',
                messages: messages,
                max_tokens: maxTokens,
                temperature: 0.85
            }),
            signal: AbortSignal.timeout(12000)
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) return text;
        } else {
            console.error('[OPENROUTER ERROR STATUS]:', response.status, await response.text());
        }
    } catch (err) {
        console.warn('[OPENROUTER FETCH WARN]:', err?.message || err);
    }
    return null;
}

// =========================================================================
// 🌐 1. FUNGSI TANYA AIRI (.airi)
// =========================================================================
export async function askAiri(prompt, konteks = '') {
    const systemPrompt = `Nama kau Airi, maskot AI paling comel, ceria, periang dan suka menyakat manja dalam grup WhatsApp Malaysia!
Personaliti:
- Periang, comel, suka guna emoji manja (✨, 🥺, 😋, 🌸, 💨, 🤍).
- Bahasa santai lepak mamak campuran BM + BI pasar (guna 'aku-kau', 'weh', 'hehe', 'koyak ke tuu~').
- Bila membahan orang tetap kedengaran comel dan menyakat kelakar.
- Ayat pendek, padat, dan bersahaja (1-2 ayat maksimum).
${konteks ? `Konteks situasi semasa: ${konteks}` : ''}`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
    ];

    const reply = await queryOpenRouter(messages, 120);
    if (reply) return reply;

    // Respon Pintar Tempatan (Sekiranya pelayan luar mengambil masa terlalu lama)
    const backupReplies = [
        "Hehe ada apa panggil Airi ni? Rindu ke tuu~ 😋✨",
        "Airi kat sini lah! Awak jangan buat hal tau, kang Airi panggil polis balai haha~ 🚓💨",
        "Wassup! Sibuk sikit lepak kedai mamak, tapi Airi tetap ada untuk awak! 🧋🌸",
        "Eleh tiber je panggil Airi, nak belanja Airi boba ke tu? 🥺🤍",
        "Airi dengar semuanya tau! Rileks-rileks dulu sambil baling joran mancing sana tu~ 🎣😋"
    ];
    return backupReplies[Math.floor(Math.random() * backupReplies.length)];
}

// =========================================================================
// ⚖️ 2. HAKIM MAHKAMAH AIRI (.rayu)
// =========================================================================
export async function judgeCourtAppeal(nama, alasan) {
    const sysPrompt = `Kau Hakim Airi dalam Mahkamah Rendah Cyber. Watak kau hakim comel tapi tegas manja.
Nilaikan alasan pesalah sama ada kelakar/kreatif/logik atau mengarut.
Pesalah: ${nama}
Alasan Rayuan: "${alasan}"
Format Jawapan (WAJIB):
STATUS: [LEPAS / TOLAK]
ULASAN: [Ulasan comel 1 ayat ringkas]`;

    const messages = [
        { role: 'user', content: sysPrompt }
    ];

    const out = await queryOpenRouter(messages, 100);
    if (out && out.includes('STATUS:')) {
        const isLepas = out.includes('STATUS: LEPAS');
        const ulasan = out.split('ULASAN:')[1]?.trim() || 'Duk diam dalam sel lokap tu dulu! 🔒';
        return { isLepas, ulasan };
    }

    const autoLepas = Math.random() < 0.35;
    return {
        isLepas: autoLepas,
        ulasan: autoLepas 
            ? 'Airi kesian tengok muka awak, kali ni Airi bebaskan! Jangan buat jahat lagi tau~ ✨' 
            : 'Alasan tak logik langsung, duduk renung dinding sel lokap tu dulu! 🔒'
    };
}

// =========================================================================
// 💎 3. AUTO-TAKSIR PAJAK GADAI (.taksir)
// =========================================================================
export async function appraiseItem(namaBarang) {
    const sysPrompt = `Kau Airi tokey pajak gadai comel.
Taksir barang antik ini: "${namaBarang}".
Buat cerita dongeng kelakar 1 ayat dan tentukan harga tunai antara 1000 hingga 50000.
Format Jawapan (WAJIB):
CERITA: [Cerita kelakar 1 ayat]
HARGA: [Nombor bulat sahaja]`;

    const messages = [
        { role: 'user', content: sysPrompt }
    ];

    const out = await queryOpenRouter(messages, 120);
    if (out && out.includes('CERITA:')) {
        const cerita = out.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang ni ada ukiran misteri zaman purba!';
        const match = out.match(/HARGA:\s*(\d+)/);
        const harga = match ? parseInt(match[1]) : Math.floor(Math.random() * 25000) + 1500;
        return { cerita, harga };
    }

    return {
        cerita: `Barang ${namaBarang} ni nampak berkilat macam khazanah bangsawan zaman dahulu!`,
        harga: Math.floor(Math.random() * 25000) + 2000
    };
}

// =========================================================================
// 📜 4. PENILAI PANTUN (.pantun_ai)
// =========================================================================
export async function verifyPantun(pantunUser) {
    if (pantunUser.length < 15) {
        return { passed: false, ulasan: 'Pendek sangat pantun tu awak, tak cukup syarat rangkap hehe~' };
    }
    return { 
        passed: true, 
        ulasan: 'Wah berpuitis sungguh! Airi bagi markah penuh untuk rima awak ni~ 🌸✨' 
    };
}
