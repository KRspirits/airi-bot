import { beritaPasaran } from '../plugins/pasaran.js';
import { aiFishArt } from './aiart.js';
import { line } from './airi_lines.js';
import { panelCard } from './cards.js';
import { sendCard } from './render.js';
import { renderCatchCard } from './card.js';
import { speak } from './voice.js';
import { config } from '../config.js';
import { logEvent } from './log.js';
import { CATALOG, ensureP, savePancingDB } from './fish.js';
import { pick } from './util.js';

// Makhluk mitos muncul secara rawak: siapa taip .tangkap KOD dulu, dia dapat.
const active = new Map(); // jid -> { code, fish, expires, timer }
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');

export const isActive = jid => !!active.get(jid) && Date.now() < active.get(jid).expires;

export async function trigger(sock, jid) {
    if (isActive(jid)) return false;
    const fish = pick(CATALOG.mitos), code = makeCode(), expires = Date.now() + 60_000;
    const timer = setTimeout(async () => {
        if (active.get(jid)?.code !== code) return;
        active.delete(jid);
        await sock.sendMessage(jid, { text: 'Alamak, makhluk tu dah lesap dalam laut. Tak sempat sesiapa tangkap. Sabar, nanti muncul lagi!' }).catch(() => {});
    }, 60_000);
    timer.unref?.();
    active.set(jid, { code, fish, expires, timer });
    await sendCard(sock, jid, null, 'panelCard', {
        kicker: 'AMARAN MITOS', title: 'Makhluk mitos muncul di laut!', big: code, bigLabel: 'TAIP  .tangkap KOD  (ADA 60 SAAT)',
        lines: ['Siapa taip dulu, dia yang dapat!', 'Spesies: ??? (rahsia sampai ditangkap)'], accent: '#fbbf24', footerText: 'Cepat, cepat, cepat!'
    }, '🌊 *MAKHLUK MITOS MUNCUL!* Taip `.tangkap ' + code + '` sekarang!');
    if (config.voice) speak(sock, jid, 'mythic').catch(() => {});
    return true;
}

export async function claim({ sock, m, user, db, code }) {
    const jid = m.key.remoteJid, sender = m.key.participant || jid, a = active.get(jid);
    if (!a || Date.now() > a.expires) return sock.sendMessage(jid, { text: 'Tak ada makhluk mitos buat masa ni. Nanti aku bagitahu kalau dia muncul.' }, { quoted: m });
    if (String(code || '').toUpperCase() !== a.code) return sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
    clearTimeout(a.timer); active.delete(jid);
    const fish = { ...a.fish, rarity: 'mitos' }, p = ensureP(sender);
    p.tong_ikan.push(fish); p.dex[fish.nama] = true; savePancingDB();
    await logEvent({ type: 'mitos', actor: sender, nama: fish.nama, group: jid });
    const img = (await aiFishArt(fish.nama)) || renderCatchCard({ nama: fish.nama, rarity: 'mitos', harga: fish.harga, buff: fish.buff, owner: user.name });
    sock.sendMessage(jid, { text: `🎉 ${user.name || 'Seseorang'} dapat ikan mitos *${fish.nama}*!` }).catch(() => {});
    beritaPasaran('btc', 0.02);
    return sock.sendMessage(jid, {
        image: img, mentions: [sender],
        caption: `🚨🚨 *BERITA UTAMA!* @${sender.split('@')[0]} paling pantas dan berjaya tangkap *${fish.nama}*! 🚨🚨\n\nIkan masuk ke \`.ikan\` kau.`
    }, { quoted: m });
}
