// Enjin AI Pollinations (Percuma, Tanpa Had & Tanpa Perlu API Key)
async function fetchPollinationsAI(prompt, systemInstruction = '') {
    try {
        const fullPrompt = systemInstruction 
            ? `${systemInstruction}\n\nPengguna: ${prompt}` 
            : prompt;

        // Model openai (GPT-4o-Mini) pada Pollinations sangat laju dan lancar
        const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&seed=${Math.floor(Math.random() * 999999)}`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        
        const text = await res.text();
        return text.trim();
    } catch (err) {
        console.error('[POLLINATIONS ERROR]:', err);
        return null;
    }
}

const SYSTEM_AIRI = `Kau ialah Airi, maskot AI paling comel, periang, manja dan suka menyakat dalam grup WhatsApp Malaysia!
Gaya Bahasa & Watak:
- Sangat ceria, comel, santai (guna ganti nama 'Airi', 'awak', 'weh', 'hehe', emoji comel ✨🌸😋🤍).
- Bahasa santai KL / rojak Melayu pasar.
- Balas terus secara bersahaja dan spontan dalam 1-2 baris ayat padat!
- PENTING: Jangan buat jawapan panjang berjela atau formal skema.`;

// 1. Borak & CCTV Interceptor
export async function askAiri(prompt, konteks = '') {
    const system = `${SYSTEM_AIRI}${konteks ? `\nKonteks situasi semasa: ${konteks}` : ''}`;
    const result = await fetchPollinationsAI(prompt, system);
    return result || 'Hehe otak Airi tengah termenung sekejap, cuba panggil lagi sekali! 🧋🌸';
}

// 2. Hakim Mahkamah AI (Rayuan Lokap .rayu)
export async function judgeCourtAppeal(nama, alasan) {
    const system = `Kau Hakim Mahkamah Airi yang comel tapi tegas menyakat. Nilaikan alasan pesalah sama ada kelakar/kreatif/logik atau mengarut.
Format jawapan (WAJIB ikuti format ini):
STATUS: [LEPAS / TOLAK]
ULASAN: [Ulasan comel 1 ayat padat]`;

    const prompt = `Pesalah: ${nama}\nAlasan Rayuan: "${alasan}"`;
    const output = await fetchPollinationsAI(prompt, system);

    if (!output) {
        return { isLepas: false, ulasan: 'Palu hakim patah pulak, kekal dalam lokap ya! 🔨' };
    }

    const isLepas = output.includes('STATUS: LEPAS');
    const ulasan = output.split('ULASAN:')[1]?.trim() || 'Duk dalam sel diam-diam tau!';
    return { isLepas, ulasan };
}

// 3. Tokey Pajak Gadai (.taksir)
export async function appraiseItem(namaBarang) {
    const system = `Kau Airi, pemilik kedai pajak gadai comel. Taksir barang pelanggan dengan cerita dongeng kelakar & tentukan harga tunai rawak (antara RM 500 hingga RM 50,000).
Format jawapan (WAJIB ikuti format ini):
CERITA: [Cerita kelakar comel 1 ayat tentang sejarah barang]
HARGA: [Nombor sahaja tanpa simbol, cth: 15000]`;

    const output = await fetchPollinationsAI(`Barang: ${namaBarang}`, system);

    if (!output) {
        return { cerita: 'Barang ni nampak berkilat comel je!', harga: 2000 };
    }

    const cerita = output.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang ni ada aura misteri sikit hehe~';
    const hargaMatch = output.match(/HARGA:\s*(\d+)/);
    const harga = hargaMatch ? parseInt(hargaMatch[1]) : 2500;
    return { cerita, harga };
}

// 4. Penilai Rima Pantun (.pantun_ai)
export async function verifyPantun(pantunUser) {
    const system = `Kau juri pantun comel Airi. Nilaikan pantun pengguna sama ada ada rima bunyi dan maksud santai.
Format jawapan:
STATUS: [LULUS / GAGAL]
ULASAN: [Ulasan 1 ayat comel menyakat]`;

    const output = await fetchPollinationsAI(`Pantun: "${pantunUser}"`, system);

    if (!output) {
        return { passed: false, ulasan: 'Line tak sampai, pantun hilang kelaut~' };
    }

    const passed = output.includes('LULUS');
    const ulasan = output.split('ULASAN:')[1]?.trim() || 'Pandai berpantun ya awak! ✨';
    return { passed, ulasan };
}
