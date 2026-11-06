import { aiArt } from './aiart.js';
import { sceneCard } from './scene.js';

// =========================================================================
// 🎬 ADEGAN REAL (pilihan). Kalau AI_SCENE=1 di Render, gambar adegan dijana oleh Gemini
// (guna GEMINI_API_KEY, cache per jenis, had harian dikongsi dengan gambar mitos).
// Kalau tak aktif atau gagal, bot guna lukisan sedia ada. Tiada ralat dihantar kepada pemain.
// =========================================================================

const PROMPT = {
    tangkap: 'Photorealistic night photo of a Malaysian police car with red and blue lights flashing on a city street, cinematic, no text, no watermark.',
    rompak: 'Photorealistic night photo of a masked thief running with a bag of cash through a city street, cinematic, no text, no watermark.',
};

export async function sceneGambar(jenis) {
    if (process.env.AI_SCENE === '1' && PROMPT[jenis]) {
        const buf = await aiArt(`scene_${jenis}`, PROMPT[jenis]);
        if (buf) return buf;
    }
    return sceneCard(jenis);
}
