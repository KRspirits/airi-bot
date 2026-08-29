// =========================================================================
// 🌸 ENJIN POLLINATIONS AI (POST JSON - STABIL, PERCUMA & ANTI-402)
// =========================================================================

async function fetchPollinationsAI(prompt, systemInstruction = '') {
    // Senarai model 100% percuma di Pollinations (tiada sekatan 402)
    const models = ['mistral', 'qwen', 'deepseek', 'hypnosis-trance'];
    
    for (const model of models) {
        try {
            const messages = [];
            if (systemInstruction) {
                messages.push({ role: 'system', content: systemInstruction });
            }
            messages.push({ role: 'user', content: prompt });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 saat timeout

            const res = await fetch('https://text.pollinations.ai/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages,
                    model: model,
                    temperature: 0.8,
                    seed: Math.floor(Math.random() * 888888)
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.status === 402 || res.status === 429) {
                console.warn(`[POLLINATIONS] Model ${model} status ${res.status}, mencuba model sandaran...`);
                continue; // Cuba model percuma seterusnya
            }

            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.status}`);
            }

            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content?.trim();
            if (reply) return reply;
        } catch (err) {
            console.error(`[POLLINATIONS FAIL - ${model}]:`, err.message);
        }
    }

    // Jika kesemua model luaran sibuk, gunakan sandaran kecemasan (Fallback Offline)
    return null;
}

const SYSTEM_AIRI = `Kau ialah Airi, maskot AI paling comel, periang, ceria dan suka menyakat dalam grup WhatsApp Malaysia!
Gaya Bahasa & Watak:
- Sangat comel, ceria, manja (guna 'Airi', 'awak', 'weh', 'hehe', emoji comel ✨🌸😋🤍).
- Bahasa santai lepak mamak / Melayu pasar.
- Jawab pendek 1-2 baris ayat padat, terus pada topik tanpa intro skema.`;

// 1. Borak Santai (.airi) & CCTV Interceptor
export async function askAiri(prompt, konteks = '') {
    const system = `${SYSTEM_AIRI}${konteks ? `\nKonteks situasi semasa: ${konteks}` : ''}`;
    const result = await fetchPollinationsAI(prompt, system);
    return result || 'Hehe Airi tengah basuh motor jap, satgi kita borak lagi tau! 🌸✨';
}

// 2. Hakim Mahkamah Rayuan Lokap (.rayu)
export async function judgeCourtAppeal(nama, alasan) {
    const system = `Kau Hakim Airi dalam mahkamah comel. Nilaikan alasan pesalah sama ada kreatif/kelakar atau mengarut.
Format jawapan (WAJIB ikut):
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
    const system = `Kau Airi tokey pajak gadai comel. Taksir barang pelanggan dengan cerita dongeng kelakar & letak harga tunai rawak (antara RM 500 hingga RM 50,000).
Format jawapan (WAJIB ikut):
CERITA: [Cerita kelakar 1 ayat]
HARGA: [Nombor sahaja, cth: 12500]`;

    const output = await fetchPollinationsAI(`Barang: ${namaBarang}`, system);

    if (!output) {
        return { cerita: 'Barang ni nampak berkilat comel je!', harga: 2500 };
    }

    const cerita = output.split('CERITA:')[1]?.split('HARGA:')[0]?.trim() || 'Barang antik ada gaya tersendiri hehe~';
    const hargaMatch = output.match(/HARGA:\s*(\d+)/);
    const harga = hargaMatch ? parseInt(hargaMatch[1]) : 3000;
    return { cerita, harga };
}

// 4. Penilai Rima Pantun (.pantun_ai)
export async function verifyPantun(pantunUser) {
    const system = `Kau juri pantun comel Airi. Nilaikan pantun pengguna sama ada ada rima bunyi dan maksud santai.
Format jawapan:
STATUS: [LULUS / GAGAL]
ULASAN: [Ulasan 1 ayat comel]`;

    const output = await fetchPollinationsAI(`Pantun: "${pantunUser}"`, system);

    if (!output) {
        return { passed: false, ulasan: 'Line tak sampai, pantun hilang kelaut~' };
    }

    const passed = output.includes('LULUS');
    const ulasan = output.split('ULASAN:')[1]?.trim() || 'Pandai berpantun ya awak! ✨';
    return { passed, ulasan };
}
