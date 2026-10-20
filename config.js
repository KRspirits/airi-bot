import 'dotenv/config';

// Nombor owner dibaca dari env (OWNER_NUMBERS=601xxxx,1xxxx,lid...) supaya tak terdedah di GitHub.
const owners = (process.env.OWNER_NUMBERS || '')
    .split(/[\s,]+/).map(s => s.replace(/\D/g, '')).filter(Boolean);
// Nombor owner utama (format antarabangsa: 0 di depan ditukar kepada 60).
// Ditambah terus dalam kod, digabung dengan OWNER_NUMBERS dari env.
const OWNER_UTAMA = '601166533534';
if (!owners.includes(OWNER_UTAMA)) owners.push(OWNER_UTAMA);

export const config = {
    port: process.env.PORT || 3000,
    prefix: '.',
    ownerNumbers: owners,
    geminiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    mongoUri: process.env.MONGO_URI || '',
    voice: process.env.AIRI_VOICE !== '0',          // suara Airi
    purgeAuto: process.env.PURGE_AUTO !== '0',      // Hari Pembersihan automatik (Jumaat malam)
    mythicEveryMin: Number(process.env.MYTHIC_EVERY_MIN || 90),
    bossEveryMin: Number(process.env.BOSS_EVERY_MIN || 240)
};

// Padanan TEPAT sahaja (kod lama guna includes() yang boleh dipintas).
export function isOwner(jid) {
    const n = String(jid || '').replace(/@.*$/, '').replace(/:.*$/, '').replace(/\D/g, '');
    return !!n && owners.includes(n);
}

// Semak SEMUA pengenal dalam mesej. WhatsApp boleh hantar LID dalam group,
// dan nombor telefon ada dalam participantAlt / remoteJidAlt.
export function isOwnerMsg(m) {
    const k = m?.key || {};
    return [k.participant, k.participantAlt, k.remoteJidAlt, k.remoteJid].some(isOwner);
}

