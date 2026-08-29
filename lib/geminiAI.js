import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const genAI = new GoogleGenerativeAI(config.geminiKey);

export async function askAiri(prompt, konteks = '') {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "Kau ialah Airi, maskot AI bot paling comel, ceria, periang dan suka menyakat di WhatsApp Malaysia. Gaya bahasa: Santai pasar/KL, ceria, manja, guna emoji comel. ARAHAN WAJIB: Jawab secara terus tanpa intro panjang. Jawab dalam ayat yang lengkap sepenuhnya, jangan sesekali tinggalkan ayat tergantung!"
        });
        const fullPrompt = konteks ? `Konteks Situasi: ${konteks}\nSoalan/Arahan: ${prompt}` : prompt;
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    } catch (err) {
        console.error('Gemini Error:', err);
        return 'Alamak line internet Airi pening sikit hehe, tapi awak tetap hebat! 🥺🤍';
    }
}

export async function judgeCourtAppeal(nama, alasan) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "Kau Hakim Airi yang comel. Tentukan status rayuan pesalah. Format jawapan MESTI:\nSTATUS: [LEPAS / TOLAK]\nULASAN: [1 ayat comel menyakat]"
        });
        const result = await model.generateContent(`Pesalah: ${nama}\nAlasan: "${alasan}"`);
        const output = result.response.text();
        return { isLepas: output.includes('STATUS: LEPAS'), ulasan: output.split('ULASAN:')[1]?.trim() || 'Duk dalam sel tau!' };
    } catch {
        return { isLepas: false, ulasan: 'Palu hakim patah, kekal dalam lokap ya! 🔨' };
    }
}

export async function appraiseItem(namaBarang) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "Kau tokey pajak gadai Airi comel. Taksir barang pelanggan. Format:\nCERITA: [Dongeng 1 ayat comel]\nHARGA: [Nombor rawak 500-50000]"
        });
        const result = await model.generateContent(`Barang: ${namaBarang}`);
        const text = result.response.text();
        const cerita = text.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang ni misteri sangat hehe~';
        const hargaMatch = text.match(/HARGA:\s*(\d+)/);
        return { cerita, harga: hargaMatch ? parseInt(hargaMatch[1]) : 2500 };
    } catch {
        return { cerita: 'Barang ni nampak comel!', harga: 2000 };
    }
}

export async function verifyPantun(pantunUser) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "Kau juri pantun Airi. Nilaikan rima pantun. Jawab:\nLULUS / GAGAL\nULASAN: [Ulasan 1 ayat comel]"
        });
        const result = await model.generateContent(`Pantun: "${pantunUser}"`);
        const res = result.response.text();
        return { passed: res.includes('LULUS'), ulasan: res.split('ULASAN:')[1]?.trim() || 'Pandai awak! ✨' };
    } catch {
        return { passed: false, ulasan: 'Line tak sampai~' };
    }
}
