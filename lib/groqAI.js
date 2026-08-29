import Groq from 'groq-sdk';
import { config } from '../config.js';

const groq = new Groq({ apiKey: config.groqKey });

export async function askAiri(prompt, konteks = '') {
    try {
        const response = await groq.chat.completions.create({
            messages: [
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
            model: 'llama-3.3-70b-versatile',
            temperature: 0.85,
            max_tokens: 150
        });

        return response.choices[0]?.message?.content || 'Hehe Airi tengah minum air boba jap, satgi kita borak lagi ya! 🧋✨';
    } catch (err) {
        return 'Alamak line internet Airi tersengguk pulak hehe~ 🥺';
    }
}

// 1. Hakim Mahkamah AI (Rayuan Lokap)
export async function judgeCourtAppeal(nama, alasan) {
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Kau Hakim Airi dalam Mahkamah Rendah Cyber. Watak kau hakim comel, suka tersenyum tapi tegas manja.
Nilaikan alasan pesalah sama ada kelakar/kreatif/logik atau mengarut.
Format respons (WAJIB ikuti format):
STATUS: [LEPAS / TOLAK]
ULASAN: [Ulasan comel & ceria 1 ayat]
CONTOH:
STATUS: LEPAS
ULASAN: Alololo kesian dia nak gi beli boba, kali ni Airi lepaskan tau! 🌸`
                },
                { role: 'user', content: `Pesalah: ${nama}\nAlasan Rayuan: "${alasan}"` }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 100
        });

        const output = response.choices[0]?.message?.content || 'STATUS: TOLAK\nULASAN: Alasan tak meyakinkan langsung, duk diam dalam sel tu hehe~ 🔒';
        const isLepas = output.includes('STATUS: LEPAS');
        const ulasan = output.split('ULASAN:')[1]?.trim() || 'Duk dalam sel diam-diam tau!';
        return { isLepas, ulasan };
    } catch {
        return { isLepas: false, ulasan: 'Palu hakim patah pulak, kekal dalam lokap ya! 🔨' };
    }
}

// 2. Tokey Pajak Gadai Auto-Taksir Barang
export async function appraiseItem(namaBarang) {
    try {
        const response = await groq.chat.completions.create({
            messages: [
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
            model: 'llama-3.3-70b-versatile',
            temperature: 0.8,
            max_tokens: 120
        });

        const text = response.choices[0]?.message?.content || '';
        const cerita = text.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang ni ada aura misteri sikit hehe~';
        const hargaMatch = text.match(/HARGA:\s*(\d+)/);
        const harga = hargaMatch ? parseInt(hargaMatch[1]) : 2500;
        return { cerita, harga };
    } catch {
        return { cerita: 'Barang ni nampak berkilat comel je!', harga: 2000 };
    }
}

// 3. Penilai Rima Pantun
export async function verifyPantun(pantunUser) {
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Kau juri pantun comel Airi. Nilaikan pantun pengguna sama ada ada rima (a-b-a-b atau a-a) dan logik santai.
Jawab:
LULUS / GAGAL
ULASAN: [Ulasan 1 ayat comel menyakat]`
                },
                { role: 'user', content: `Pantun: "${pantunUser}"` }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.6,
            max_tokens: 80
        });

        const res = response.choices[0]?.message?.content || '';
        const passed = res.includes('LULUS');
        const ulasan = res.split('ULASAN:')[1]?.trim() || 'Pandai berpantun ya awakk! ✨';
        return { passed, ulasan };
    } catch {
        return { passed: false, ulasan: 'Line tak sampai, pantun hilang kelaut~' };
    }
}
