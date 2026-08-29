// =========================================================================
// 🌸 ENJIN GEMINI REST API (SOKONGAN KUNCI BAHARU AQ... & AUTO-ROTATION)
// =========================================================================

const RAW_KEYS = process.env.GEMINI_API_KEY || '';
const API_KEYS = RAW_KEYS.split(',').map(k => k.trim()).filter(Boolean);
let currentKeyIndex = 0;

// Model rasmi disyorkan
const MODEL_NAME = 'gemini-2.5-flash';

async function generateWithREST(prompt, systemInstruction = '', retries = 3) {
    if (API_KEYS.length === 0) {
        return 'Alamak, GEMINI_API_KEY belum diset dalam Render Environment! 🥺';
    }

    for (let attempt = 0; attempt < retries; attempt++) {
        const activeKey = API_KEYS[currentKeyIndex];
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;

        // Panggilan terus ke endpoint v1 rasmi
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${activeKey}`;

        try {
            const bodyPayload = {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 200
                }
            };

            if (systemInstruction) {
                bodyPayload.systemInstruction = {
                    parts: [{ text: systemInstruction }]
                };
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyPayload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.status === 429 || res.status === 403 || res.status === 400) {
                console.warn(`[GEMINI] Kunci index ${currentKeyIndex} status ${res.status}. Bertukar ke kunci sandaran...`);
                continue;
            }

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`HTTP ${res.status}: ${errText}`);
            }

            const data = await res.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (reply) return reply;
        } catch (err) {
            console.error(`[GEMINI ATTEMPT ${attempt + 1} FAIL]:`, err.message);
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    return 'Hehe otak Airi tengah termenung sekejap, cuba tegur lagi sekali tau! 🧋🌸';
}

const SYSTEM_AIRI = `Kau ialah Airi, maskot AI paling comel, periang, manja dan suka menyakat dalam grup WhatsApp Malaysia!
Gaya Bahasa & Watak:
- Sangat comel, periang, santai (guna 'Airi', 'awak', 'weh', 'hehe', emoji comel ✨🌸😋🤍).
- Bahasa santai KL / rojak Melayu pasar.
- Balas pendek 1-2 baris ayat padat terus pada topik tanpa intro skema.`;

// 1. Borak Santai & CCTV Interceptor
export async function askAiri(prompt, konteks = '') {
    const system = `${SYSTEM_AIRI}${konteks ? `\nKonteks situasi semasa: ${konteks}` : ''}`;
    return await generateWithREST(prompt, system);
}

// 2. Hakim Mahkamah Rayuan Lokap (.rayu)
export async function judgeCourtAppeal(nama, alasan) {
    const system = `Kau Hakim Airi dalam mahkamah comel. Nilaikan alasan pesalah sama ada kreatif/kelakar atau mengarut.
Format jawapan (WAJIB ikut):
STATUS: [LEPAS / TOLAK]
ULASAN: [Ulasan comel 1 ayat padat]`;

    const prompt = `Pesalah: ${nama}\nAlasan Rayuan: "${alasan}"`;
    const output = await generateWithREST(prompt, system);

    const isLepas = output.includes('STATUS: LEPAS') || output.includes('LEPAS');
    const ulasan = output.split('ULASAN:')[1]?.trim() || 'Duk dalam sel diam-diam tau!';
    return { isLepas, ulasan };
}

// 3. Tokey Pajak Gadai (.taksir)
export async function appraiseItem(namaBarang) {
    const system = `Kau Airi tokey pajak gadai comel. Taksir barang pelanggan dengan cerita kelakar & beri harga tunai rawak (antara RM 500 hingga RM 50,000).
Format:
CERITA: [Cerita ringkas 1 ayat]
HARGA: [Nombor sahaja tanpa simbol, cth: 12500]`;

    const output = await generateWithREST(`Barang: ${namaBarang}`, system);
    const cerita = output.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang antik berkilat comel!';
    const hargaMatch = output.match(/HARGA:\s*(\d+)/);
    const harga = hargaMatch ? parseInt(hargaMatch[1]) : 2500;
    return { cerita, harga };
}

// 4. Penilai Rima Pantun (.pantun_ai)
export async function verifyPantun(pantunUser) {
    const system = `Kau juri pantun comel Airi. Tentukan sama ada pantun ada rima dan maksud santai.
Format:
STATUS: [LULUS / GAGAL]
ULASAN: [Ulasan 1 ayat comel]`;

    const output = await generateWithREST(`Pantun: "${pantunUser}"`, system);
    const passed = output.includes('STATUS: LULUS') || output.includes('LULUS');
    const ulasan = output.split('ULASAN:')[1]?.trim() || 'Pandai berpantun awak ni! ✨';
    return { passed, ulasan };
}
