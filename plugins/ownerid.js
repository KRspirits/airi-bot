// =========================================================================
// 🪪 OWNERID - tunjuk pengenal WhatsApp akaun kau supaya boleh dimasukkan ke OWNER_NUMBERS.
// Hanya tunjuk pengenal kau sendiri. Bila kau dah tahu, tambahkannya ke env OWNER_NUMBERS di Render.
// =========================================================================

const digits = s => String(s || '').replace(/@.*$/, '').replace(/:.*$/, '').replace(/\D/g, '');

export default {
    name: 'ownerid',
    alias: ['pengenalan'],
    category: 'info',
    execute: async ({ sock, m }) => {
        const jid = m.key.remoteJid;
        const k = m.key || {};
        const senarai = [
            ['participant (group)', k.participant],
            ['participantAlt (nombor)', k.participantAlt],
            ['remoteJidAlt (nombor)', k.remoteJidAlt],
            ['remoteJid', k.remoteJid]
        ].filter(([, v]) => v);
        const baris = senarai.map(([label, v]) => `• ${label}: ${digits(v) || '-'}`).join('\n');
        const cadangan = [...new Set(senarai.map(([, v]) => digits(v)).filter(Boolean))].join(',');
        const teks = `🪪 *PENGENALAN KAU*\n\n${baris || '• Tiada pengenal dikesan'}\n\nTambah nombor *telefon* (bermula 60) dan, jika ada, nombor LID ke OWNER_NUMBERS di Render, asingkan dengan koma.\nContoh: ${cadangan || '601xxxxxxxxx'}`;
        return sock.sendMessage(jid, { text: teks }, { quoted: m });
    }
};
