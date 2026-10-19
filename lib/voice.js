import { spawn } from 'child_process';

// Suara Airi: ceria, nada tinggi macam budak perempuan kecil. Percuma: Google Translate TTS (tanpa key)
// + ffmpeg-static untuk naikkan pic. Jika pakej tiada, jatuh balik ke mp3 biasa; jika TTS gagal, null.
// Hanya TEKS AIRI SENDIRI (dijana/dipilih bot) yang dituturkan, bukan teks mentah pengguna.
const clean = t => String(t || '').replace(/[\p{Extended_Pictographic}\u200d\ufe0f*_~`>#]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 190);

async function tts(text) {
    const api = await import('google-tts-api');
    const parts = await (api.getAllAudioBase64 || api.default.getAllAudioBase64)(text, { lang: 'ms', slow: false, timeout: 10000, splitPunct: ',.?!' });
    return Buffer.concat(parts.map(p => Buffer.from(p.base64, 'base64')));
}
async function pitchUp(mp3) {
    let ff; try { ff = (await import('ffmpeg-static')).default; } catch { return null; }
    if (!ff) return null;
    return new Promise(resolve => {
        const p = spawn(ff, ['-v', 'error', '-i', 'pipe:0', '-af', 'aresample=48000,asetrate=57600,aresample=48000,atempo=0.8333',
            '-ac', '1', '-c:a', 'libopus', '-b:a', '40k', '-f', 'ogg', 'pipe:1']);
        const chunks = []; let done = false;
        const end = v => { if (!done) { done = true; resolve(v); } };
        p.stdout.on('data', c => chunks.push(c));
        p.on('error', () => end(null));
        p.on('close', code => end(code === 0 && chunks.length ? Buffer.concat(chunks) : null));
        p.stdin.on('error', () => {});
        p.stdin.end(mp3);
        setTimeout(() => { p.kill('SIGKILL'); end(null); }, 15000).unref?.();
    });
}

/** @returns {Promise<{audio:Buffer, mimetype:string, ptt:boolean}|null>} */
export async function airiVoice(text) {
    const t = clean(text); if (!t) return null;
    try {
        const mp3 = await tts(t);
        const ogg = await pitchUp(mp3);
        return ogg ? { audio: ogg, mimetype: 'audio/ogg; codecs=opus', ptt: true } : { audio: mp3, mimetype: 'audio/mpeg', ptt: false };
    } catch (e) { console.error('[VOICE]', e.message); return null; }
}
export async function speak(sock, jid, text, m) {
    const v = await airiVoice(text); if (!v) return false;
    await sock.sendMessage(jid, { audio: v.audio, mimetype: v.mimetype, ptt: v.ptt }, m ? { quoted: m } : undefined);
    return true;
}
