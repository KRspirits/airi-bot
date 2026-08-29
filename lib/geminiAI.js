import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const rawKeys = process.env.GEMINI_API_KEY || config.geminiKey || '';
const apiKeys = rawKeys.split(/[\s,]+/).filter(k => k.trim().length > 0);
let currentKeyIndex = 0;

function getNextModel() {
    if (apiKeys.length === 0) {
        throw new Error("Tiada API Key Gemini dijumpai dalam Environment Render!");
    }
    const activeKey = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    const genAI = new GoogleGenerativeAI(activeKey);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export async function askAiri(prompt, konteks = '') {
    try {
        const model = getNextModel();
        const fullPrompt = (konteks ? `Konteks: ${konteks}\n` : '') + `Soalan: ${prompt}`;
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    } catch (err) {
        // Hantar mesej ralat sebenar terus ke WhatsApp untuk kita semak
        return `🚨 [DIAGNOSTIC ERROR]:\n${err.message}`;
    }
}

export async function judgeCourtAppeal(nama, alasan) {
    try {
        const model = getNextModel();
        const result = await model.generateContent(`Hakim Airi. Format:\nSTATUS: [LEPAS / TOLAK]\nULASAN: [1 ayat]. Pesalah: ${nama}, Alasan: ${alasan}`);
        const output = result.response.text();
        return { isLepas: output.includes('LEPAS'), ulasan: output.split('ULASAN:')[1]?.trim() || 'Duk sel!' };
    } catch (err) {
        return { isLepas: false, ulasan: `Error: ${err.message}` };
    }
}

export async function appraiseItem(namaBarang) {
    try {
        const model = getNextModel();
        const result = await model.generateContent(`Tokey pajak Airi. Barang: ${namaBarang}. Format:\nCERITA: [Dongeng]\nHARGA: [Nombor]`);
        const text = result.response.text();
        const hargaMatch = text.match(/HARGA:\s*(\d+)/);
        return { cerita: text.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Misteri.', harga: hargaMatch ? parseInt(hargaMatch[1]) : 2500 };
    } catch (err) {
        return { cerita: `Error: ${err.message}`, harga: 0 };
    }
}

export async function verifyPantun(pantunUser) {
    try {
        const model = getNextModel();
        const result = await model.generateContent(`Juri pantun: "${pantunUser}". Jawab:\nLULUS / GAGAL\nULASAN: [Komen]`);
        const res = result.response.text();
        return { passed: res.includes('LULUS'), ulasan: res.split('ULASAN:')[1]?.trim() || 'Hebat!' };
    } catch (err) {
        return { passed: false, ulasan: `Error: ${err.message}` };
    }
}
