import { bukaPilihan } from '../lib/pilihan.js';

// 🚀 .mula  -> menu pilihan nombor untuk pemain baru. Balas dengan nombor.
const SENARAI = [
    { label: 'Kerja biasa (gaji terus)', arahan: '.job' },
    { label: 'Kebun: tanam buah', arahan: '.tanam' },
    { label: 'Pasaran BTC & emas', arahan: '.pasaran' },
    { label: 'Memancing', arahan: '.mancing' },
    { label: 'Jenayah & blackmarket', arahan: '.jenayah' },
    { label: 'Barang & inventori', arahan: '.item' },
    { label: 'Media sosial', arahan: '.feed' },
    { label: 'Kad akaun & level', arahan: '.balance' },
    { label: 'Menu penuh', arahan: '.menu penuh' },
];

export default {
    name: 'mula',
    alias: [],
    category: 'info',
    execute: async ({ sock, m }) => {
        const jid = m.key.remoteJid;
        const sender = m.senderJid || m.key.participant || jid;
        bukaPilihan(sender, SENARAI);
        const baris = SENARAI.map((s, i) => `${i + 1}. ${s.label}`).join('\n');
        return sock.sendMessage(jid, { text: `🚀 *MULA DI AIRI'S CORNER*\n\nBalas dengan nombor:\n\n${baris}\n\nPilihan tamat dalam 5 minit.` }, { quoted: m });
    }
};
