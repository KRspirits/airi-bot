import { QUEST, progres } from '../lib/quest.js';
import * as store from '../lib/store.js';
import { myt } from '../lib/util.js';

// 🎯 .misi_harian  -> tunjuk progres
// 🎯 .misi_harian claim -> tuntut hadiah quest yang dah siap
export default {
    name: 'misi_harian',
    alias: ['quest', 'quest_harian'],
    category: 'ekonomi',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        const data = await progres(sender);
        if ((args[0] || '').toLowerCase() === 'claim') {
            const hari = myt().day;
            const tuntut = await store.get('quest_claim', `${hari}:${sender}`, {});
            let total = 0; const sebut = [];
            for (const q of QUEST) {
                if ((data[q.id] || 0) >= q.n && !tuntut[q.id]) { tuntut[q.id] = true; total += q.hadiah; sebut.push(q.ket); }
            }
            if (!total) return reply('📭 Tiada quest yang siap untuk dituntut hari ni.');
            user.wallet = (user.wallet || 0) + total;
            await store.set('quest_claim', `${hari}:${sender}`, tuntut);
            await db.saveUser(user);
            return reply(`🎯 Dah tuntut: ${sebut.join(', ')}\nHadiah: RM ${total.toLocaleString('en-US')}`);
        }
        const baris = QUEST.map(q => {
            const kini = Math.min(q.n, data[q.id] || 0);
            const siap = kini >= q.n ? '✅' : '⬜';
            return `${siap} ${q.ket}  ${kini}/${q.n}  ·  RM ${q.hadiah.toLocaleString('en-US')}`;
        });
        return reply(`🎯 *MISI HARIAN*\n\n${baris.join('\n')}\n\nSiap semua? Taip \`.misi_harian claim\` untuk tuntut.`);
    }
};
