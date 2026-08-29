// Enjin AI Gemini Flash (Laju, Percuma & Stabil di Render)
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

async function askGemini(prompt, systemInstruction = '') {
    if (!GEMINI_KEY) {
        return 'Alamak, GEMINI_API_KEY belum dimasukkan kat Render Environment! 🥺';
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
        
        const contents = [];
        if (systemInstruction) {
            contents.push({
                role: 'user',
                parts: [{ text: `[SYSTEM INSTRUCTION / WATAK]: ${systemInstruction}` }]
            });
            contents.push({
                role: 'model',
                parts: [{ text: 'Faham, Airi akan bertindak mengikut watak ini! 🌸' }]
            });
        }
        contents.push({
            role: 'user',
            parts: [{ text: prompt }]
        });

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.85,
                    maxOutputTokens: 200
                }
            })
        });

        if (!res.ok) {
            throw new Error(`Gemini Error: ${res.status}`);
        }

        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Hehe Airi termenung sekejap~ 🌸';
    } catch (err) {
        console.error('[GEMINI FAIL]:', err.message);
        return 'Line Airi tersengguk sikit, cuba tanya lagi sekali ya! 🥺';
    }
}

const SYSTEM_AIRI = `Nama kau Airi, maskot AI bot WhatsApp Malaysia paling comel, periang, manja dan suka menyakat!
Gaya Bahasa:
- Sangat ceria, bersahaja (guna 'Airi', 'awak', 'weh', 'hehe', emoji comel ✨🌸😋🤍).
- Bahasa santai KL / rojak Melayu pasar.
- Balas pendek 1-2 ayat terus tanpa intro skema atau panjang berjela.`;

// 1. Borak Santai & CCTV Interceptor
export async function askAiri(prompt, konteks = '') {
    const system = `${SYSTEM_AIRI}${konteks ? `\nKonteks situasi: ${konteks}` : ''}`;
    return await askGemini(prompt, system);
}

// 2. Hakim Mahkamah Rayuan Lokap (.rayu)
export async function judgeCourtAppeal(nama, alasan) {
    const system = `Kau Hakim Airi dalam mahkamah comel. Nilaikan alasan pesalah sama ada logik/kelakar atau mengarut.
Format jawapan (WAJIB ikut format ini):
STATUS: [LEPAS / TOLAK]
ULASAN: [Ulasan comel 1 ayat padat]`;

    const prompt = `Pesalah: ${nama}\nAlasan Rayuan: "${alasan}"`;
    const output = await askGemini(prompt, system);

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

    const output = await askGemini(`Barang: ${namaBarang}`, system);
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

    const output = await askGemini(`Pantun: "${pantunUser}"`, system);
    const passed = output.includes('STATUS: LULUS') || output.includes('LULUS');
    const ulasan = output.split('ULASAN:')[1]?.trim() || 'Pandai berpantun ya awak! ✨';
    return { passed, ulasan };
}
