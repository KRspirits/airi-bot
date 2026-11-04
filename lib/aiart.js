import { GoogleGenerativeAI } from '@google/generative-ai';
import * as store from './store.js';

// =========================================================================
// 🎨 GAMBAR DARI GEMINI (untuk ikan mitos sahaja).
// - Guna kunci dari GEMINI_API_KEY (boleh banyak, asingkan dengan koma).
// - Model gambar: env IMAGE_MODEL dahulu, kemudian sandaran.
// - Setiap spesies dijana SEKALI sahaja, disimpan dalam store (cache).
// - Had 25 gambar sehari untuk jaga kuota. Gagal = pulang null, bot guna kad biasa.
// =========================================================================

const MODELS = [process.env.IMAGE_MODEL, 'gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'].filter(Boolean);
const HARIAN_MAX = 25;
const TIMEOUT_MS = 30000;
const kunci = () => (process.env.GEMINI_API_KEY || '').split(/[\s,]+/).filter(Boolean);

async function hadHarian() {
    const hari = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
    const k = await store.get('art', 'count', { day: '', n: 0 });
    if (k.day !== hari) return { hari, n: 0, boleh: true };
    return { hari, n: k.n, boleh: k.n < HARIAN_MAX };
}

export async function aiArt(cacheKey, prompt) {
    try {
        const simpan = await store.get('art', cacheKey, null);
        if (typeof simpan === 'string' && simpan) return Buffer.from(simpan, 'base64');
        const had = await hadHarian();
        if (!had.boleh) return null;
        const keys = kunci();
        if (!keys.length) return null;

        for (const model of MODELS) {
            try {
                const genAI = new GoogleGenerativeAI(keys[Math.floor(Math.random() * keys.length)]);
                const m = genAI.getGenerativeModel({ model });
                const res = await Promise.race([
                    m.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'] } }),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS))
                ]);
                const bahagian = res.response?.candidates?.[0]?.content?.parts || [];
                const gambar = bahagian.find(p => p.inlineData?.data);
                if (!gambar) continue;
                await store.set('art', cacheKey, gambar.inlineData.data);
                await store.set('art', 'count', { day: had.hari, n: had.n + 1 });
                return Buffer.from(gambar.inlineData.data, 'base64');
            } catch (err) {
                console.error(`[AIART] ${model}:`, err.message);
            }
        }
        return null;
    } catch (err) {
        console.error('[AIART]', err.message);
        return null;
    }
}

export async function aiFishArt(nama) {
    const bersih = String(nama).replace(/[\p{Extended_Pictographic}]/gu, '').trim();
    const cacheKey = 'mitos_' + bersih.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 60);
    return aiArt(cacheKey, `Photorealistic image of a mythical fish: ${bersih}. Dramatic deep-sea lighting, dark ocean background, highly detailed, no text, no watermark.`);
}
