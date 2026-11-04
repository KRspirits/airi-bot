import { line } from './airi_lines.js';
import { sendCard, getAvatar } from './render.js';
import { speak } from './voice.js';
import { db } from './database.js';
import { kadUntuk } from '../plugins/achievement.js';
import { config } from '../config.js';
import { pick } from './util.js';

const WELCOME = [
    n => `Yeay! Selamat datang ke *Airi's Corner*, @${n}! 🌸\n\nAku Airi, kawan baru awak kat sini. Mula dengan taip *.menu*, tuntut hadiah harian dengan *.daily*, lepas tu cuba *.mancing* (mana tahu dapat ikan mitos!).\n\nJaga adab, jaga duit, jaga kawan-kawan ya~ ✨`,
    n => `Hai hai @${n}! Akhirnya sampai juga! 🎀\n\nSelamat datang ke *Airi's Corner*, tempat kita berniaga, memancing dan bergaduh manja. Taip *.menu* untuk tengok semua, dan jangan lupa *.daily* hari-hari tau!`,
    n => `Wah, ada ahli baru! Selamat datang @${n} ke *Airi's Corner*! 🌟\n\nAiri dah siapkan RM sikit untuk awak, taip *.daily*. Kalau sesat, taip *.menu*. Jom sembang dan main sama-sama!`
];

const TUTOR = "Mula main di Airi's Corner:\n1. .kerja  (gaji tiap 3 minit, dapat XP)\n2. .daily  (bonus harian, streak naik)\n3. .menu  (papan panduan penuh)\nLevel 3 untuk .mancing. Taip .level untuk tengok progres.";

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
            if (config.voice) speak(sock, jid, 'welcome').catch(() => {});
            await sock.sendMessage(jid, { text: TUTOR }).catch(() => {});
            // Ahli Baru: dapat sekali sahaja, masa join sebenar. Hadiah RM 2,000.
            try {
                const jidBaru = typeof raw === 'string' ? raw : raw?.id;
                if (jidBaru) {
                    const u = await db.getUser(jidBaru, 'Ahli Baru');
                    u.badges = Array.isArray(u.badges) ? u.badges : [];
                    if (!u.badges.includes('Ahli Baru')) {
                        u.badges.push('Ahli Baru');
                        u.wallet = (u.wallet || 0) + 2000;
                        await db.saveUser(u);
                        const img = await kadUntuk(sock, jidBaru, u).catch(() => null);
                        const teks = `🎉 @${String(jidBaru).split('@')[0]} dapat achievement *Ahli Baru*! Hadiah RM 2,000.`;
                        if (img) await sock.sendMessage(jid, { image: img, caption: teks, mentions: [jidBaru] }).catch(() => {});
                        else await sock.sendMessage(jid, { text: teks, mentions: [jidBaru] }).catch(() => {});
                    }
                }
            } catch (e) { console.error('[AHLI BARU]', e.message); }
        }
    } else if (action === 'remove' && participants.length) {
        const p = typeof participants[0] === 'string' ? participants[0] : participants[0].id;
        await sock.sendMessage(jid, { text: `Bye @${String(p).split('@')[0]}, jaga diri ya. Kitorang rindu awak 🌸`, mentions: [p] }).catch(() => {});
    }
}
