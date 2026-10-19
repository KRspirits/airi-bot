import { renderCatchCard } from '../lib/card.js';
import { config } from '../config.js';

// .testkad  -> owner sahaja. Hantar 1 kad setiap rarity untuk semak gambar jadi atau tidak.
export default {
    name: 'testkad',
    execute: async ({ sock, m }) => {
        const jid = m.key.remoteJid;
        const sender = String(m.key.participant || jid).replace(/@.*$/, '').replace(/:.*$/, '');
        if (!config.ownerNumbers.includes(sender)) return;
        const sampel = [
            { nama: 'Selipar Jepun Putus 🩴', rarity: 'sampah', harga: 10 },
            { nama: 'Ikan Kembung 🐟', rarity: 'biasa', harga: 800 },
            { nama: 'Sotong Kurita Gergasi 🐙', rarity: 'rare', harga: 280000, buff: '+RM1,000 Gaji Kerja' },
            { nama: 'Penyu Belimbing Berlian 🐢', rarity: 'mitos', harga: 12000000, buff: '-20% Peluang Kantoi' },
            { nama: 'Leviathan Penjaga Arus 🐲', rarity: 'mitos', harga: 10000000, buff: '+RM50,000 Gaji Kerja' },
            { nama: 'Raja Ketam Atlantis 🦀', rarity: 'mitos', harga: 11000000, buff: '+RM45,000 Gaji' }
        ];
        for (const s of sampel) {
            try {
                await sock.sendMessage(jid, { image: renderCatchCard({ ...s, owner: 'Tester' }), caption: s.nama }, { quoted: m });
            } catch (e) {
                return sock.sendMessage(jid, { text: `❌ Kad gagal: ${e.message}\nPastikan dah \`npm install\` (@napi-rs/canvas).` }, { quoted: m });
            }
        }
    }
};
