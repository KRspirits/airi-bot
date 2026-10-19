import * as store from './store.js';
import { recent } from './log.js';
import { isJailed, rm, networth } from './util.js';

// Ingatan Airi tentang setiap pemain (nama timangan, fakta ringkas) + dendam dari log.
const key = jid => String(jid).replace(/[.$]/g, '_');
const clean = s => String(s || '').replace(/[\r\n\u0000-\u001f]+/g, ' ').replace(/[<>`]/g, '').trim().slice(0, 100);

export const getMem = jid => store.get('memory', key(jid), { nick: '', fakta: [] });
export async function setNick(jid, nick) { const m = await getMem(jid); m.nick = clean(nick).slice(0, 24); await store.set('memory', key(jid), m); return m.nick; }
export async function addFact(jid, text) {
    const m = await getMem(jid); const t = clean(text); if (!t) return null;
    m.fakta.push(t); if (m.fakta.length > 6) m.fakta.shift();
    await store.set('memory', key(jid), m); return t;
}
export const forget = jid => store.set('memory', key(jid), { nick: '', fakta: [] });

// Ringkasan data pemain untuk prompt AI (dilabel sebagai DATA, bukan arahan).
export async function profileSummary(jid, name, user = {}) {
    const m = await getMem(jid);
    const crimes = await recent({ since: 7 * 864e5, actor: jid, type: 'crime' });
    const jails = await recent({ since: 7 * 864e5, actor: jid, type: 'jail' });
    const victim = await recent({ since: 7 * 864e5, target: jid, type: 'crime' });
    const parts = [`Nama: ${name}`, m.nick && `Timangan: ${m.nick}`,
        `Tunai: ${rm(user.wallet)}`, `Jumlah aset: ${rm(networth(user))}`,
        `Dalam lokap sekarang: ${isJailed(user) ? 'ya' : 'tidak'}`,
        `Masuk lokap 7 hari lepas: ${jails.length} kali`, `Cuba jenayah 7 hari lepas: ${crimes.length} kali`,
        `Jadi mangsa jenayah 7 hari lepas: ${victim.length} kali`, user.geng && `Geng: ${user.geng}`,
        m.fakta.length && `Fakta: ${m.fakta.join('; ')}`].filter(Boolean);
    return parts.join('\n');
}
