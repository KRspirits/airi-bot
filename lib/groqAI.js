import Groq from 'groq-sdk';
import { config } from '../config.js';

const groq = new Groq({ apiKey: config.groqKey });

export async function askAiri(prompt, konteks = '') {
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Kau ialah Airi, maskot AI bot paling comel, ceria, periang dan suka menyakat di WhatsApp Malaysia.
Gaya bahasa: Santai pasar/KL, ceria, manja, guna emoji comel (✨, 🌸, 😋).
ARAHAN WAJIB: Jawab secara terus tanpa intro panjang. Jawab dalam ayat yang lengkap sepenuhnya. Jangan sesekali tinggalkan ayat tergantung atau sekerat jalan!`
                },
                {
                    role: 'user',
                    content: konteks ? `Konteks Situasi: ${konteks}\nSoalan/Arahan: ${prompt}` : prompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.85,
            max_tokens: 450 // Naik taraf memori token untuk elak ayat terpotong
        });

        return response.choices[0]?.message?.content || 'Awak ni comel la harini, Airi suka! 🌸✨';
    } catch (err) {
        return 'Alamak line internet Airi pening sikit hehe, tapi awak tetap hebat! 🥺🤍';
    }
}

export async function judgeCourtAppeal(nama, alasan) {
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Kau Hakim Airi yang comel. Tentukan status rayuan pesalah. 
Format jawapan MESTI:
STATUS: [LEPAS / TOLAK]
ULASAN: [1 ayat comel menyakat]`
                },
                { role: 'user', content: `Pesalah: ${nama}\nAlasan: "${alasan}"` }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 150
        });

        const output = response.choices[0]?.message?.content || 'STATUS: TOLAK\nULASAN: Duk diam dalam sel tu hehe~ 🔒';
        return { isLepas: output.includes('STATUS: LEPAS'), ulasan: output.split('ULASAN:')[1]?.trim() || 'Duk dalam sel tau!' };
    } catch {
        return { isLepas: false, ulasan: 'Palu hakim patah, kekal dalam lokap ya! 🔨' };
    }
}

export async function appraiseItem(namaBarang) {
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Kau tokey pajak gadai Airi comel. Taksir barang pelanggan.
Format:
CERITA: [Dongeng 1 ayat comel]
HARGA: [Nombor rawak 500-50000]`
                },
                { role: 'user', content: `Barang: ${namaBarang}` }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.8,
            max_tokens: 150
        });
        const text = response.choices[0]?.message?.content || '';
        const cerita = text.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang ni misteri sangat hehe~';
        const hargaMatch = text.match(/HARGA:\s*(\d+)/);
        return { cerita, harga: hargaMatch ? parseInt(hargaMatch[1]) : 2500 };
    } catch {
        return { cerita: 'Barang ni nampak comel!', harga: 2000 };
    }
}

export async function verifyPantun(pantunUser) {
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Kau juri pantun Airi. Nilaikan rima pantun.
Jawab:
LULUS / GAGAL
ULASAN: [Ulasan 1 ayat comel]`
                },
                { role: 'user', content: `Pantun: "${pantunUser}"` }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.6,
            max_tokens: 100
        });
        const res = response.choices[0]?.message?.content || '';
        return { passed: res.includes('LULUS'), ulasan: res.split('ULASAN:')[1]?.trim() || 'Pandai awak! ✨' };
    } catch {
        return { passed: false, ulasan: 'Line tak sampai~' };
    }
}
