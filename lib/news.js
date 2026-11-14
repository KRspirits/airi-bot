import { recent } from './log.js';
import { askPlain } from './geminiAI.js';
import { networth, rm, pick, myt } from './util.js';

const clean = s => String(s || '').replace(/[*_`#"\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
const QUOTES = ['Rezeki jangan ditolak, ikan mitos jangan dilepaskan.', 'Kalau dompet kosong, jangan risau, esok ada .daily!', 'Jaga duit, jaga kawan, jaga mulut.', 'Hari ni biasa-biasa, esok mungkin mitos!'];

/** Bina buletin harian daripada log kejadian. Pulangkan data untuk newsCard. */
export async function makeBulletin(db, group) {
    const users = await db.getAllUsers(), name = jid => users.find(u => u.id === jid)?.name || 'Seorang warga';
    const ev = await recent({ since: 24 * 3600e3, group });
    const crimes = ev.filter(e => e.type === 'crime'), jails = ev.filter(e => e.type === 'jail'), mitos = ev.filter(e => e.type === 'mitos');
    const tally = (list, key) => { const m = new Map(); for (const e of list) if (e[key]) m.set(e[key], (m.get(e[key]) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
    const items = [], richest = [...users].sort((a, b) => networth(b) - networth(a))[0];
    if (richest) items.push(`${richest.name} kekal tokoh terkaya dengan aset ${rm(networth(richest))}.`);
    const topC = tally(crimes, 'actor')[0];
    if (topC) items.push(`${name(topC[0])} cuba ${topC[1]} jenayah hari ini (${crimes.filter(e => e.actor === topC[0] && e.ok).length} berjaya).`);
    const topV = tally(crimes, 'target')[0];
    if (topV) items.push(`${name(topV[0])} paling malang: jadi mangsa ${topV[1]} kali.`);
    if (jails.length) items.push(`${jails.length} kes masuk lokap. Antara yang kena: ${[...new Set(jails.map(e => name(e.actor)))].slice(0, 3).join(', ')}.`);
    for (const e of mitos.slice(0, 2)) items.push(`${name(e.actor)} berjaya menangkap ${String(e.nama).replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '').trim()}! Seluruh laut gempar.`);
    if (!items.length) items.push('Hari yang tenang. Terlalu tenang. Airi mula curiga.');
    let headline = await askPlain(`Tulis SATU tajuk berita akhbar yang kelakar dan mesra (maksimum 12 patah perkataan, tanpa tanda petik) berdasarkan fakta berikut:\n${items.join('\n')}`);
    headline = clean(headline).slice(0, 120);
    if (!headline || /RALAT|error|berehat sekejap/i.test(headline)) headline = topC ? `${name(topC[0])} rajai jalanan, polis garu kepala` : richest ? `${richest.name} sambung rajai senarai terkaya` : 'Sunyi sepi di Airi\'s Corner';
    const d = myt();
    return { date: `${d.d}/${d.mo}/${d.y}`, headline, items, quote: pick(QUOTES), voiceText: `Berita malam ni! ${headline}` };
}
