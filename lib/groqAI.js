import { GoogleGenerativeAI } from '@google/generative-ai';

const RAW_KEYS = process.env.GEMINI_API_KEY || '';
const API_KEYS = RAW_KEYS.split(',').map(k => k.trim()).filter(Boolean);
let currentKeyIndex = 0;

// Senarai model rasmi Google untuk fallback jika salah satu 404
const MODEL_CANDIDATES = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash',
    'gemini-2.5-flash',
    'gemini-pro'
];

async function generateAIResponse(prompt, systemInstruction = '') {
    if (API_KEYS.length === 0) {
        return 'Alamak, GEMINI_API_KEY belum diset dalam Render Environment! 🥺';
    }

    const sysText = systemInstruction || 'Nama kau Airi, maskot comel dan ceria dalam grup WhatsApp Malaysia.';

    // Pusingan mencuba kunci API
    for (let i = 0; i < API_KEYS.length; i++) {
        const key = API_KEYS[currentKeyIndex];
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;

        const genAI = new GoogleGenerativeAI(key);

        // Pusingan mencuba nama model jika timbul ralat 404
        for (const modelName of MODEL_CANDIDATES) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: sysText
                });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const reply = response.text()?.trim();
                
                if (reply) return reply;
            } catch (err) {
                // Jika ralat 404 model not found, terus cuba model seterusnya
                if (err.message?.includes('404') || err.message?.includes('not found')) {
                    continue;
                }
                console.warn(`[GEMINI RETRY] Kunci index ${currentKeyIndex} ralat (${modelName}):`, err.message);
                break; // Jika ralat selain 404 (contohnya kuota habis), tukar ke kunci seterusnya
            }
        }
    }

    return 'Hehe Airi pening sikit, satgi kita borak lagi tau! 🧋🌸';
}

const SYSTEM_AIRI = `Kau ialah Airi, maskot AI bot paling comel, periang, manja dan suka menyakat dalam grup WhatsApp Malaysia!
Gaya Bahasa:
- Sangat comel, periang, santai (guna 'Airi', 'awak', 'weh', 'hehe', emoji ✨🌸😋🤍).
- Bahasa santai KL / rojak Melayu pasar.
- Balas pendek 1-2 baris ayat padat terus tanpa intro skema.`;

export async function askAiri(prompt, konteks = '') {
    const system = `${SYSTEM_AIRI}${konteks ? `\nKonteks situasi semasa: ${konteks}` : ''}`;
    return await generateAIResponse(prompt, system);
}

export async function judgeCourtAppeal(nama, alasan) {
    const system = `Kau Hakim Airi dalam mahkamah comel. Nilaikan alasan pesalah sama ada kreatif/kelakar atau mengarut.
Format jawapan (WAJIB):
STATUS: [LEPAS / TOLAK]
ULASAN: [Ulasan comel 1 ayat padat]`;

    const prompt = `Pesalah: ${nama}\nAlasan Rayuan: "${alasan}"`;
    const output = await generateAIResponse(prompt, system);

    const isLepas = output.includes('STATUS: LEPAS') || output.includes('LEPAS');
    const ulasan = output.split('ULASAN:')[1]?.trim() || 'Kekal dalam lokap ya!';
    return { isLepas, ulasan };
}

export async function appraiseItem(namaBarang) {
    const system = `Kau Airi tokey pajak gadai comel. Taksir barang pelanggan dengan cerita kelakar & beri harga tunai rawak antara 500 hingga 50000.
Format:
CERITA: [Cerita ringkas 1 ayat]
HARGA: [Nombor sahaja, cth: 12500]`;

    const output = await generateAIResponse(`Barang: ${namaBarang}`, system);
    const cerita = output.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang berkilat comel!';
    const hargaMatch = output.match(/HARGA:\s*(\d+)/);
    const harga = hargaMatch ? parseInt(hargaMatch[1]) : 2500;
    return { cerita, harga };
}

export async function verifyPantun(pantunUser) {
    const system = `Kau juri pantun Airi. Tentukan sama ada pantun ada rima dan maksud santai.
Format:
STATUS: [LULUS / GAGAL]
ULASAN: [Ulasan 1 ayat]`;

    const output = await generateAIResponse(`Pantun: "${pantunUser}"`, system);
    const passed = output.includes('STATUS: LULUS') || output.includes('LULUS');
    const ulasan = output.split('ULASAN:')[1]?.trim() || 'Pandai berpantun awak ni! ✨';
    return { passed, ulasan };
}
