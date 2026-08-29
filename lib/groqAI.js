import Groq from 'groq-sdk';
import { config } from '../config.js';

function getGroqClient() {
    const key = config.groqKey || process.env.GROQ_API_KEY || process.env.GROQ_KEY;
    if (!key) {
        console.error('[GROQ FATAL] Kunci API Groq TIDAK DIJUMPAI dalam environment!');
        return null;
    }
    return new Groq({ apiKey: key.trim() });
}

let activeModelCache = null;

// Fungsi mencari model chat teks yang sah & aktif dalam akaun Groq anda
async function resolveWorkingModel(groq) {
    if (activeModelCache) return activeModelCache;

    try {
        const modelList = await groq.models.list();
        const availableIds = (modelList.data || []).map(m => m.id);
        console.log('[GROQ INFO] Senarai Model Tersedia:', availableIds);

        // Keutamaan model teks perbualan terkini
        const candidateModels = [
            'llama-3.3-70b-versatile',
            'llama-3.3-70b-specdec',
            'mixtral-8x7b-32768',
            'gemma2-9b-it',
            'llama3-70b-8192',
            'llama3-8b-8192'
        ];

        for (const candidate of candidateModels) {
            if (availableIds.includes(candidate)) {
                activeModelCache = candidate;
                console.log(`[GROQ SUCCESS] Model aktif dipilih: ${activeModelCache}`);
                return activeModelCache;
            }
        }

        // Jika tiada yang sepadan dalam senarai, pilih model teks pertama yang aktif
        const anyTextModel = availableIds.find(id => !id.includes('whisper') && !id.includes('vision') && !id.includes('guard'));
        if (anyTextModel) {
            activeModelCache = anyTextModel;
            console.log(`[GROQ SUCCESS] Menggunakan model sandaran aktif: ${activeModelCache}`);
            return activeModelCache;
        }
    } catch (err) {
        console.warn('[GROQ WARN] Gagal mengambil senarai model dinamik:', err?.message || err);
    }

    // Fallback terakhir
    return 'llama-3.3-70b-versatile';
}

async function createChat(groq, messages, temperature = 0.8, max_tokens = 150) {
    const selectedModel = await resolveWorkingModel(groq);
    return await groq.chat.completions.create({
        messages,
        model: selectedModel,
        temperature,
        max_tokens
    });
}

export async function askAiri(prompt, konteks = '') {
    const groq = getGroqClient();
    if (!groq) {
        return 'Alamak, API Key Groq Airi belum diset dalam Render Environment lah! 🥺';
    }

    try {
        const response = await createChat(
            groq,
            [
                {
                    role: 'system',
                    content: `Nama kau Airi, maskot AI paling comel, ceria, periang dan suka menyakat manja dalam grup WhatsApp Malaysia!
Personaliti & Gaya Bahasa:
- Periang, comel, suka guna emoji manja (✨, 🥺, 😋, 🌸, 💨, 🤍).
- Bahasa santai lepak mamak campuran BM + BI pasar (guna 'aku-kau', 'weh', 'hehe', 'alaaa', 'tiber', 'koyak ke tuu~').
- Bila membahan orang tetap kedengaran comel dan comel-annoying (bukan marah kasar, tapi menyakat kelakar).
- Ayat pendek, padat, dan bersahaja (1-2 ayat maksimum).
${konteks ? `Konteks situasi semasa: ${konteks}` : ''}`
                },
                { role: 'user', content: prompt }
            ],
            0.85,
            150
        );

        return response.choices[0]?.message?.content || 'Hehe Airi tengah minum air boba jap, satgi kita borak lagi ya! 🧋✨';
    } catch (err) {
        console.error('==================== [GROQ ERROR DETAIL] ====================');
        console.error('Mesej Ralat:', err?.message || err);
        console.error('Status Code:', err?.status);
        console.error('============================================================');

        if (err?.status === 401) {
            return 'API Key Groq Airi salah atau tak sah lah awak! Cuba semak kat console.groq.com 🥺';
        } else if (err?.status === 429) {
            return 'Airi dah terlebih cakap harini sampai kena had kuota hehe, rehat jap ya! 💨';
        }

        return 'Alamak line internet Airi tersengguk pulak hehe~ 🥺';
    }
}

// 1. Hakim Mahkamah AI (Rayuan Lokap)
export async function judgeCourtAppeal(nama, alasan) {
    const groq = getGroqClient();
    if (!groq) return { isLepas: false, ulasan: 'Kunci mahkamah hilang, kekal dalam sel!' };

    try {
        const response = await createChat(
            groq,
            [
                {
                    role: 'system',
                    content: `Kau Hakim Airi dalam Mahkamah Rendah Cyber. Watak kau hakim comel, suka tersenyum tapi tegas manja.
Nilaikan alasan pesalah sama ada kelakar/kreatif/logik atau mengarut.
Format respons (WAJIB ikuti format):
STATUS: [LEPAS / TOLAK]
ULASAN: [Ulasan comel & ceria 1 ayat]`
                },
                { role: 'user', content: `Pesalah: ${nama}\nAlasan Rayuan: "${alasan}"` }
            ],
            0.7,
            100
        );

        const output = response.choices[0]?.message?.content || 'STATUS: TOLAK\nULASAN: Alasan tak meyakinkan langsung, duk diam dalam sel tu hehe~ 🔒';
        const isLepas = output.includes('STATUS: LEPAS');
        const ulasan = output.split('ULASAN:')[1]?.trim() || 'Duk dalam sel diam-diam tau!';
        return { isLepas, ulasan };
    } catch (err) {
        console.error('[COURT ERROR]:', err?.message || err);
        return { isLepas: false, ulasan: 'Palu hakim patah pulak, kekal dalam lokap ya! 🔨' };
    }
}

// 2. Tokey Pajak Gadai Auto-Taksir Barang
export async function appraiseItem(namaBarang) {
    const groq = getGroqClient();
    if (!groq) return { cerita: 'Barang misteri tak ternilai!', harga: 1500 };

    try {
        const response = await createChat(
            groq,
            [
                {
                    role: 'system',
                    content: `Kau Airi, pemilik comel kedai pajak gadai barang antik.
Taksir barang yang dibawa pelanggan dengan cerita dongeng kelakar & tentukan harga tunai rawak (antara RM 500 hingga RM 50,000).
Format:
CERITA: [Cerita kelakar comel 1 ayat tentang sejarah barang]
HARGA: [Nombor sahaja, cth: 12500]`
                },
                { role: 'user', content: `Barang: ${namaBarang}` }
            ],
            0.8,
            120
        );

        const text = response.choices[0]?.message?.content || '';
        const cerita = text.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang ni ada aura misteri sikit hehe~';
        const hargaMatch = text.match(/HARGA:\s*(\d+)/);
        const harga = hargaMatch ? parseInt(hargaMatch[1]) : 2500;
        return { cerita, harga };
    } catch (err) {
        console.error('[APPRAISE ERROR]:', err?.message || err);
        return { cerita: 'Barang ni nampak berkilat comel je!', harga: 2000 };
    }
}

// 3. Penilai Rima Pantun
export async function verifyPantun(pantunUser) {
    const groq = getGroqClient();
    if (!groq) return { passed: false, ulasan: 'Juri pantun tengah berehat sekejap~' };

    try {
        const response = await createChat(
            groq,
            [
                {
                    role: 'system',
                    content: `Kau juri pantun comel Airi. Nilaikan pantun pengguna sama ada ada rima (a-b-a-b atau a-a) dan logik santai.
Jawab:
LULUS / GAGAL
ULASAN: [Ulasan 1 ayat comel menyakat]`
                },
                { role: 'user', content: `Pantun: "${pantunUser}"` }
            ],
            0.6,
            80
        );

        const res = response.choices[0]?.message?.content || '';
        const passed = res.includes('LULUS');
        const ulasan = res.split('ULASAN:')[1]?.trim() || 'Pandai berpantun ya awakk! ✨';
        return { passed, ulasan };
    } catch (err) {
        console.error('[PANTUN ERROR]:', err?.message || err);
        return { passed: false, ulasan: 'Line tak sampai, pantun hilang kelaut~' };
    }
}
