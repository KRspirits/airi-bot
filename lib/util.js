// Utiliti kongsi. Tiada dependency luar supaya senang diuji.
export const num = jid => String(jid || '').replace(/@.*$/, '').replace(/:.*$/, '');
import { mataSemasa, IDR_PER_RM } from './konteks.js';
export const rm = n => mataSemasa() === 'IDR'
    ? 'Rp ' + Math.round((Number(n) || 0) * IDR_PER_RM).toLocaleString('id-ID') + ' (RM ' + Math.round(Number(n) || 0).toLocaleString('en-US') + ')'
    : 'RM ' + Math.round(Number(n) || 0).toLocaleString('en-US');
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Buka bungkusan mesej (ephemeral / viewOnce / dokumen) supaya semua plugin nampak teks.
export function unwrap(message) {
    let msg = message;
    for (let i = 0; i < 5 && msg; i++) {
        const inner = msg.ephemeralMessage?.message || msg.viewOnceMessage?.message ||
            msg.viewOnceMessageV2?.message || msg.documentWithCaptionMessage?.message || msg.editedMessage?.message;
        if (!inner) break;
        msg = inner;
    }
    return msg;
}
export function extractText(message) {
    const msg = unwrap(message) || {};
    return msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption ||
        msg.videoMessage?.caption || msg.documentMessage?.caption || '';
}
export function mentions(m) {
    const msg = unwrap(m.message) || {};
    const ctx = msg.extendedTextMessage?.contextInfo || msg.imageMessage?.contextInfo || msg.videoMessage?.contextInfo;
    const list = [...(ctx?.mentionedJid || [])];
    if (!list.length && ctx?.participant) list.push(ctx.participant); // reply = sasaran
    return list;
}
export function parseCmd(text, prefix = '.') {
    if (!text || !text.startsWith(prefix)) return null;
    const parts = text.slice(prefix.length).trim().split(/\s+/);
    const cmd = (parts.shift() || '').toLowerCase();
    return cmd ? { cmd, args: parts } : null;
}
// Masa Malaysia (UTC+8)
export function myt(ts = Date.now()) {
    const d = new Date(ts + 8 * 3600e3);
    return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), dow: d.getUTCDay(), h: d.getUTCHours(), mi: d.getUTCMinutes(),
        day: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}` };
}
export function fmtDur(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    if (s < 60) return s + ' saat';
    const m = Math.floor(s / 60);
    if (m < 60) return m + ' minit';
    return Math.floor(m / 60) + ' jam ' + (m % 60) + ' minit';
}
export const TIERS = [
    [0, 'Gelandangan Siber'], [5e3, 'Rider Part-Time'], [5e4, 'Tauke Kecil'], [5e5, 'Datuk Segera'],
    [5e6, 'Taikun Siber'], [5e7, 'Raja Bawah Tanah'], [5e8, 'Dewa Sindiket']
];
export function tierOf(net) {
    let i = 0;
    for (let k = 0; k < TIERS.length; k++) if (net >= TIERS[k][0]) i = k;
    const next = TIERS[i + 1];
    return { name: TIERS[i][1], next: next ? next[1] : null, from: TIERS[i][0], to: next ? next[0] : TIERS[i][0],
        frac: next ? clamp((net - TIERS[i][0]) / (next[0] - TIERS[i][0]), 0, 1) : 1 };
}
export const networth = u => (u.wallet || 0) + (u.bank || 0) + (u.black_money || 0) + (u.duit_gelap || 0);
export const isJailed = u => !!(u.jail?.status && Date.now() < (u.jail.release_at || 0));
export const slug = s => String(s || '').replace(/[.$\s]+/g, '_').slice(0, 60);
