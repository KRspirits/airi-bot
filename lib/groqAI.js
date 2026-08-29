// =========================================================================
// 🌸 ENJIN GEMINI ROTATION & ANTI-RATE-LIMIT
// =========================================================================

// Mengambil senarai kunci API daripada Render Environment (dipisahkan dengan koma)
const RAW_KEYS = process.env.GEMINI_API_KEY || '';
const API_KEYS = RAW_KEYS.split(',').map(k => k.trim()).filter(Boolean);
let currentKeyIndex = 0;

// Cache ringkas untuk mengelakkan panggilan berulang
const responseCache = new Map();

function getNextKey() {
    if (API_KEYS.length === 0) return '';
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return API_KEYS[currentKeyIndex];
}

async function fetchWithRetry(prompt, systemInstruction = '', retries = 3) {
    if (API_KEYS.length === 0) {
        return 'Alamak, GEMINI_API_KEY belum dimasukkan di Render Environment! 🥺';
    }

    // Semak jika soalan sama baru ditanya dalam masa 30 saat
    const cacheKey = `${prompt.toLowerCase().trim()}`;
    if (responseCache.has(cacheKey)) {
        return responseCache.get(cacheKey);
    }

    for (let attempt = 0; attempt < retries; attempt++) {
        const activeKey = API_KEYS[currentKeyIndex];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;

        try {
            const contents = [];
            if (systemInstruction) {
                contents.push({
                    role: 'user',
                    parts: [{ text: `[SYSTEM DIRECTIVE]: ${systemInstruction}` }]
                });
                contents.push({
                    role: 'model',
                    parts: [{ text: 'Baik, Airi faham! 🌸' }]
                });
            }
            contents.push({
                role: 'user',
                parts: [{ text: prompt }]
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: {
                        temperature: 0.85,
                        maxOutputTokens: 150
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Jika kena Rate Limit (429) atau kuota habis, tukar kunci serta-merta
            if (res.status === 429 || res.status === 403 || res.status === 400) {
                console.warn(`[AI ROTATION] Kunci index ${currentKeyIndex} capai limit (Status ${res.status}). Bertukar ke kunci sandaran...`);
                getNextKey();
                await new Promise(r => setTimeout(r, 1000)); // Tunggu 1 saat sebelum cuba lagi
                continue;
            }

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (reply) {
                // Simpan dalam memori cache selama 30 saat
                responseCache.set(cacheKey, reply);
                setTimeout(() => responseCache.delete(cacheKey), 30000);
                return reply;
            }
        } catch (err) {
            console.error(`[AI ERROR Cubaan ${attempt + 1}]:`, err.message);
            getNextKey();
            await new Promise(r => setTimeout(r, 1200));
        }
    }

    return 'Hehe Airi tengah berehat sekejap sambil minum air boba, satgi kita borak lagi ya! 🧋🌸';
}

const SYSTEM_AIRI = `Nama kau Airi, maskot AI paling comel, periang, manja dan suka menyakat dalam grup WhatsApp Malaysia!
Gaya Bahasa & Watak:
- Sangat comel, periang, santai (guna 'Airi', 'awak', 'weh', 'hehe', emoji ✨🌸😋🤍).
- Bahasa santai KL / rojak Melayu pasar.
- Balas pendek 1-2 baris ayat padat terus pada maksud, jangan buat esei panjang atau formal skema.`;

// 1. Borak Santai & CCTV Interceptor
export async function askAiri(prompt, konteks = '') {
    const system = `${SYSTEM_AIRI}${konteks ? `\nKonteks situasi semasa: ${konteks}` : ''}`;
    return await fetchWithRetry(prompt, system);
}

// 2. Hakim Mahkamah Rayuan Lokap (.rayu)
export async function judgeCourtAppeal(nama, alasan) {
    const system = `Kau Hakim Airi dalam mahkamah comel. Nilaikan alasan pesalah sama ada kreatif/kelakar atau mengarut.
Format jawapan (WAJIB ikut format ini):
STATUS: [LEPAS / TOLAK]
ULASAN: [Ulasan comel 1 ayat padat]`;

    const prompt = `Pesalah: ${nama}\nAlasan Rayuan: "${alasan}"`;
    const output = await fetchWithRetry(prompt, system);

    const isLepas = output.includes('STATUS: LEPAS');
    const ulasan = output.split('ULASAN:')[1]?.trim() || 'Duk dalam sel diam-diam tau! 🔒';
    return { isLepas, ulasan };
}

// 3. Tokey Pajak Gadai (.taksir)
export async function appraiseItem(namaBarang) {
    const system = `Kau Airi tokey pajak gadai comel. Taksir barang dengan cerita dongeng kelakar & beri harga tunai rawak (antara RM 500 hingga RM 50,000).
Format:
CERITA: [Cerita kelakar 1 ayat]
HARGA: [Nombor sahaja tanpa simbol, cth: 12500]`;

    const output = await fetchWithRetry(`Barang: ${namaBarang}`, system);
    const cerita = output.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang antik berkilat comel!';
    const hargaMatch = output.match(/HARGA:\s*(\d+)/);
    const harga = hargaMatch ? parseInt(hargaMatch[1]) : 2500;
    return { cerita, harga };
}

// 4. Penilai Rima Pantun (.pantun_ai)
export async function verifyPantun(pantunUser) {
    const system = `Kau juri pantun comel Airi. Nilaikan pantun pengguna sama ada ada rima bunyi dan maksud santai.
Format:
STATUS: [LULUS / GAGAL]
ULASAN: [Ulasan 1 ayat comel]`;

    const output = await fetchWithRetry(`Pantun: "${pantunUser}"`, system);
    const passed = output.includes('STATUS: LULUS') || output.includes('LULUS');
    const ulasan = output.split('ULASAN:')[1]?.trim() || 'Pandai berpantun ya awak! ✨';
    return { passed, ulasan };
}
