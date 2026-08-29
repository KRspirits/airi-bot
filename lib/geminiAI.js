import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

// Semak jika key wujud
const apiKey = config.geminiKey || "TIADA_KEY";
const genAI = new GoogleGenerativeAI(apiKey);

export async function askAiri(prompt, konteks = '') {
    try {
        if (apiKey === "TIADA_KEY") {
            return "❌ *RALAT SISTEM:* GEMINI_API_KEY tidak dijumpai atau kosong di dalam tetapan Render Environment!";
        }

        // Kita buang systemInstruction dan gabung terus dalam teks (lebih selamat untuk semua versi SDK)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const systemPrompt = "Kau ialah Airi, maskot AI bot paling comel, ceria, periang dan suka menyakat di WhatsApp Malaysia. Jawab dalam 2 ayat lengkap.\n\n";
        const fullPrompt = systemPrompt + (konteks ? `Konteks Situasi: ${konteks}\nSoalan: ${prompt}` : `Soalan: ${prompt}`);
        
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    } catch (err) {
        // Ini akan hantar punca ralat SEBENAR ke WhatsApp
        return `⚠️ *RALAT GOOGLE GEMINI:*\n${err.message}\n\n_(Cek semula API Key di Render)_`;
    }
}

export async function judgeCourtAppeal(nama, alasan) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Kau Hakim Airi. Tentukan status rayuan. Format: \nSTATUS: [LEPAS/TOLAK]\nULASAN: [1 ayat]. Pesalah: ${nama}, Alasan: ${alasan}`);
        const output = result.response.text();
        return { isLepas: output.includes('LEPAS'), ulasan: output.split('ULASAN:')[1]?.trim() || 'Duk dalam sel!' };
    } catch (err) {
        return { isLepas: false, ulasan: `Ralat Sistem Mahkamah: ${err.message}` };
    }
}

export async function appraiseItem(namaBarang) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Kau tokey pajak gadai Airi. Taksir barang ini: ${namaBarang}. Format:\nCERITA: [Dongeng]\nHARGA: [Nombor]`);
        const text = result.response.text();
        const hargaMatch = text.match(/HARGA:\s*(\d+)/);
        return { cerita: text.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang pelik.', harga: hargaMatch ? parseInt(hargaMatch[1]) : 2500 };
    } catch (err) {
        return { cerita: `Ralat Kedai Pajak: ${err.message}`, harga: 0 };
    }
}

export async function verifyPantun(pantunUser) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Nilaikan rima pantun ini: "${pantunUser}". Jawab:\nLULUS / GAGAL\nULASAN: [Komen]`);
        const res = result.response.text();
        return { passed: res.includes('LULUS'), ulasan: res.split('ULASAN:')[1]?.trim() || 'Hebat!' };
    } catch (err) {
        return { passed: false, ulasan: `Ralat Pantun: ${err.message}` };
    }
}
