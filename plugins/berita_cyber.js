import { sendCard } from '../lib/render.js';
import { allow } from '../lib/cooldown.js';
import { myt } from '../lib/util.js';

// =========================================================================
// 📰 BERITA CYBER - ambil tajuk terkini dari RSS keselamatan siber,
// render jadi kad newsCard (THE AIRI TIMES). Guna URL dari env CYBER_RSS
// supaya boleh tukar tanpa edit kod. Jika gagal, jatuh balik ke mesej teks.
// =========================================================================

const DEFAULT_FEEDS = (process.env.CYBER_RSS || 'https://feeds.feedburner.com/TheHackersNews').split(/[\s,]+/).filter(Boolean);

const decode = s => s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#8217;/g, "'")
    .trim();

/** Ambil tajuk dari RSS/Atom. Pulangkan array string (bersih, unik, maks n). */
export function parseTitles(xml, n = 5) {
    const titles = [];
    const re = /<(item|entry)\b[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/gi;
    let m;
    while ((m = re.exec(xml)) && titles.length < n) {
        const t = decode(m[2]).replace(/\s+/g, ' ');
        if (t && !titles.includes(t)) titles.push(t);
    }
    return titles;
}

async function fetchTitles(url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'AiriBot/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseTitles(await res.text(), 5);
}

export default {
    name: 'berita_cyber',
    alias: ['berita_cyber', 'cyber_news', 'cybernews'],
    category: 'berita',
    execute: async ({ sock, m }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        if (!allow(sender + ':berita', 15000)) {
            return sock.sendMessage(jid, { text: '⏳ Berita baru dikemas kini, tunggu sebentar.' }, { quoted: m });
        }

        let items = [];
        for (const url of DEFAULT_FEEDS) {
            try { items = await fetchTitles(url); if (items.length) break; }
            catch (e) { console.error('[BERITA CYBER]', url, e.message); }
        }

        const date = new Intl.DateTimeFormat('ms-MY', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date());
        if (!items.length) {
            return sock.sendMessage(jid, { text: '📰 Maaf, Airi tak dapat tarik berita cyber sekarang. Cuba lagi kemudian.' }, { quoted: m });
        }

        const data = {
            date,
            headline: items[0],
            items: items.slice(1),
            quote: 'Kata-kata cyber hari ini: kemas kini telefon dan kata laluan kau, sebelum penjahat buat dulu.'
        };
        return sendCard(sock, jid, m, 'newsCard', data, `📰 *THE AIRI TIMES* | ${items[0]}`);
    }
};
