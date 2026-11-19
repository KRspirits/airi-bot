import { db } from './database.js';
import { resolveAsync } from './lidmap.js';

// =========================================================================
// 🎯 CARI SASARAN. Pemain boleh disasarkan dengan:
//   1. Tag (@) — diutamakan
//   2. Nombor telefon ditaip, contoh: .rob 60123456789
//   3. Nama/username pemain dalam group, contoh: .rob ali
// Carian nama hanya dalam ahli group (tak keluar pemain group lain).
// =========================================================================

const norm = s => String(s || '').toLowerCase().replace(/^@/, '').replace(/\s+/g, ' ').trim();

function teksArahan(m) {
    return (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
}

/** Pulang JID sasaran (nombor telefon), atau null kalau tak jumpa. */
export async function sasaranJid(sock, m) {
    const jid = m.key.remoteJid;
    // 1. tag
    const tag = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (tag) return await resolveAsync(tag, sock);

    const hujung = teksArahan(m).split(/\s+/).slice(1).join(' ').trim();
    if (!hujung) return null;

    // 2. nombor telefon
    const digit = hujung.replace(/[^\d]/g, '');
    if (/^\d{7,15}$/.test(digit) && /^[\d+\s-@]+$/.test(hujung.replace(/@.*$/, ''))) {
        return `${digit}@s.whatsapp.net`;
    }

    // 3. nama / username dalam group
    if (!String(jid).endsWith('@g.us')) return null;
    const meta = await sock.groupMetadata(jid).catch(() => null);
    const ahli = new Set();
    for (const p of meta?.participants || []) ahli.add(await resolveAsync(p.id, sock));
    const cari = norm(hujung);
    const senarai = (await db.getAllUsers()).filter(u => ahli.has(u.id));
    const padan = senarai.filter(u => norm(u.name) === cari || norm(u.pushName) === cari || norm(u.username) === cari);
    if (padan.length === 1) return padan[0].id;
    return null;
}
