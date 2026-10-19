import { line } from './airi_lines.js';
import { sendCard, getAvatar } from './render.js';
import { speak } from './voice.js';
import { config } from '../config.js';
import { pick } from './util.js';

const WELCOME = [
    n => `Yeay! Selamat datang ke *Airi's Corner*, @${n}! 🌸\n\nAku Airi, kawan baru kau kat sini. Mula dengan taip *.menu*, tuntut hadiah harian dengan *.daily*, lepas tu cuba *.mancing* (mana tahu dapat ikan mitos!).\n\nJaga adab, jaga duit, jaga kawan-kawan ya~ ✨`,
    n => `Hai hai @${n}! Akhirnya sampai juga! 🎀\n\nSelamat datang ke *Airi's Corner*, tempat kita berniaga, memancing dan bergaduh manja. Taip *.menu* untuk tengok semua, dan jangan lupa *.daily* hari-hari tau!`,
    n => `Wah, ada ahli baru! Selamat datang @${n} ke *Airi's Corner*! 🌟\n\nAiri dah siapkan RM sikit untuk kau, taip *.daily*. Kalau sesat, taip *.menu*. Jom sembang dan main sama-sama!`
];

export async function handleParticipants(sock, ev) {
    const { id: jid, participants = [], action } = ev;
    if (!jid?.endsWith('@g.us')) return;
    const meta = await sock.groupMetadata(jid).catch(() => null);
    const group = meta?.subject || "Airi's Corner";
    if (action === 'add') {
        for (const raw of participants) {
            const p = typeof raw === 'string' ? raw : raw.id;
            if (!p || p.startsWith(String(sock.user?.id || '').split(':')[0])) continue;
            const num = p.split('@')[0], av = await getAvatar(sock, p);
            await sendCard(sock, jid, null, 'welcomeCard', { name: '+' + num, group, count: meta?.participants?.length, avatar: av },
                pick(WELCOME)(num), { mentions: [p] });
            if (config.voice) speak(sock, jid, line('welcome', { group, nama: 'kawan baru' })).catch(() => {});
        }
    } else if (action === 'remove' && participants.length) {
        const p = typeof participants[0] === 'string' ? participants[0] : participants[0].id;
        await sock.sendMessage(jid, { text: `Bye bye @${String(p).split('@')[0]}... Airi akan rindu~ 🥺🌸`, mentions: [p] }).catch(() => {});
    }
}
