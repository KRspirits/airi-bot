import fs from 'fs';
import * as store from './store.js';

// =========================================================================
// 🔑 KOSONGKAN SESI WHATSAPP.
// Mod Mongo: padam SEMUA kunci dalam namespace 'auth' (creds + pre-key + session).
// Kalau cuma padam creds, kunci lama tak sepadan dengan QR baru dan sesi jadi tak stabil.
// Mod fail: padam folder session_airi.
// =========================================================================

export async function clearSession(isMongo) {
    try {
        if (isMongo) {
            const semua = await store.all('auth');
            for (const key of Object.keys(semua || {})) {
                await store.del('auth', key).catch(() => {});
            }
        }
        if (fs.existsSync('./session_airi')) {
            fs.rmSync('./session_airi', { recursive: true, force: true });
        }
        return true;
    } catch (err) {
        console.error('[SESI] Ralat kosongkan sesi:', err.message);
        return false;
    }
}
