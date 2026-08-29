import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const rawKeys = process.env.GEMINI_API_KEY || config.geminiKey || '';
const apiKeys = rawKeys.split(/[\s,]+/).filter(k => k.trim().length > 0);

let currentKeyIndex = 0;

function getNextModel() {
    if (apiKeys.length === 0) {
        throw new Error("Tiada API Key Gemini dikesan di dalam Environment!");
    }
    const activeKey = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    
    const genAI = new GoogleGenerativeAI(activeKey);
    // Menggunakan model tersuai yang stabil untuk servis organisasi Google Cloud
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
}

export async function askAiri(prompt, konteks = '') {
    try {
        const model = getNextModel();
        const systemPrompt = "Kau ialah Airi, maskot AI bot paling comel, ceria, periang dan suka menyakat di WhatsApp Malaysia. Jawab dalam ayat yang lengkap sepenuhnya.\n\n";
        const fullPrompt = systemPrompt + (konteks ? `Konteks Situasi: ${konteks}\nSoalan: ${prompt}` : `Soalan: ${prompt}`);
        
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    } catch (err) {
        console.error('Gemini Error:', err);
        return `⚠️ *RALAT AI AIRI:* ${err.message}`;
    }
}

export async function judgeCourtAppeal(nama, alasan) {
    try {
        const model = getNextModel();
        const result = await model.generateContent(`Kau Hakim Airi. Tentukan status rayuan. Format:\nSTATUS: [LEPAS / TOLAK]\nULASAN: [1 ayat comel]. Pesalah: ${nama}, Alasan: ${alasan}`);
        const output = result.response.text();
        return { isLepas: output.includes('LEPAS'), ulasan: output.split('ULASAN:')[1]?.trim() || 'Duk dalam sel!' };
    } catch {
        return { isLepas: false, ulasan: 'Palu hakim patah, kekal dalam lokap ya! 🔨' };
    }
}

export async function appraiseItem(namaBarang) {
    try {
        const model = getNextModel();
        const result = await model.generateContent(`Kau tokey pajak gadai Airi. Taksir barang ini: ${namaBarang}. Format:\nCERITA: [Dongeng]\nHARGA: [Nombor]`);
        const text = result.response.text();
        const hargaMatch = text.match(/HARGA:\s*(\d+)/);
        return { cerita: text.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang misteri!', harga: hargaMatch ? parseInt(hargaMatch[1]) : 2500 };
    } catch {
        return { cerita: 'Barang ni nampak comel!', harga: 2000 };
    }
}

export async function verifyPantun(pantunUser) {
    try {
        const model = getNextModel();
        const result = await model.generateContent(`Nilaikan rima pantun ini: "${pantunUser}". Jawab:\nLULUS / GAGAL\nULASAN: [Komen]`);
        const res = result.response.text();
        return { passed: res.includes('LULUS'), ulasan: res.split('ULASAN:')[1]?.trim() || 'Pandai awak! ✨' };
    } catch {
        return { passed: false, ulasan: 'Line tak sampai~' };
    }
}
