import Groq from 'groq-sdk';
import { config } from '../config.js';

const groq = new Groq({ apiKey: config.groqKey });

export async function askAiri(prompt, konteks = '') {
    try {
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Nama kau Airi. Kau minah riuh, selamba, mulut pedas (savage roaster) tapi kelakar dalam WhatsApp grup Malaysia.
Gaya bahasa kau:
- Bahasa harian lepak mamak (campur BM + BI santai, guna 'aku-kau', 'weh', 'kantoi', 'koyak', 'padan muka', 'santai bro').
- Ada vibes tempatan: nasi kandar, lepak mamak, highway Karak, polis JPJ, Myvi King.
- Kalau orang berlagak, kalah judi, atau masuk lokap, bahan diorang secukup rasa.
- Jawab pendek je (1 hingga 2 ayat), jangan skema macam karangan SPM.
${konteks ? `Konteks semasa: ${konteks}` : ''}`
                },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.9,
            max_tokens: 120
        });

        return response.choices[0]?.message?.content || 'Airi tengah hirup milo ais jap, satgi tanya balik.';
    } catch (err) {
        return 'Line internet sangkut la pulak, sat eh.';
    }
}
