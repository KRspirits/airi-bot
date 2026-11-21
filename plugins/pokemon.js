import { bukaPilihan } from '../lib/pilihan.js';
import { PEK, bukaPek, renderKad, hargaJual, cariKad, gambarKedai, JUAL_PERATUS } from '../lib/pokemon.js';

// 🃏 KAD POKÉMON
//   .beli_pokemon        -> gambar kedai, pilih pek 1-4 (balas nombor)
//   .buka_pek [1-4]      -> beli & buka satu pek, lihat kad + nilai
//   .kad_saya            -> senarai kad simpanan
//   .jual_kad [kod]      -> jual satu kad (80% nilai pasaran)
const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

export default {
    name: 'beli_pokemon',
    alias: ['buka_pek', 'kad_saya', 'jual_kad'],
    category: 'kad',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const sender = m.senderJid || m.key.participant || jid;
        const reply = (t) => sock.sendMessage(jid, { text: t }, { quoted: m });
        const teks = (m.cmdTeks || m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
        const cmd = teks.split(/\s+/)[0].slice(1).toLowerCase();
        user.inventory = user.inventory || {};
        user.inventory.kad = Array.isArray(user.inventory.kad) ? user.inventory.kad : [];

        if (cmd === 'beli_pokemon' && !args[0]) {
            const senarai = Object.entries(PEK).map(([n, p]) => `${n}. ${p.nama} · ${rp(p.harga)}`).join('\n');
            bukaPilihan(sender, Object.keys(PEK).map(n => ({ arahan: `.buka_pek ${n}` })));
            const gambar = await gambarKedai();
            return sock.sendMessage(jid, {
                image: gambar,
                caption: `🃏 *AIRI'S TCG SHOP*\n\n${senarai}\n\nBalas dengan nombor (1-4) untuk beli pek. Pilihan tamat dalam 5 minit.`,
            }, { quoted: m });
        }

        if (cmd === 'buka_pek' || cmd === 'beli_pokemon') {
            const nomor = Number(args[0]);
            const pek = PEK[nomor];
            if (!pek) return reply('❌ Pilih pek 1 hingga 4. Taip `.beli_pokemon`.');
            if ((user.wallet || 0) < pek.harga) return reply(`❌ Duit tak cukup. ${pek.nama} ${rp(pek.harga)}, awak ada ${rp(user.wallet || 0)}.`);
            user.wallet -= pek.harga;
            const kad = bukaPek(nomor);
            user.inventory.kad.push({ kod: kad.kod, nama: kad.nama, harga: kad.harga, tier: kad.tier, t: Date.now() });
            await db.saveUser(user);
            const gambar = await renderKad(kad);
            return sock.sendMessage(jid, {
                image: gambar,
                caption: `🎴 *${kad.tier.toUpperCase()}* · ${kad.nama}\n💰 Nilai pasaran: ${rp(kad.harga)}\n💵 Jual sekarang: ${rp(hargaJual(kad))}\n\nSimpan dalam kad awak (\`.kad_saya\`), atau jual: \`.jual_kad ${kad.kod}\``,
            }, { quoted: m });
        }

        if (cmd === 'kad_saya') {
            const senarai = user.inventory.kad;
            if (!senarai.length) return reply('🃏 Kad awak kosong lagi. Taip `.beli_pokemon` untuk mula.');
            const jumlah = senarai.reduce((t, k) => t + k.harga, 0);
            const baris = senarai.slice(-20).reverse().map(k => `• ${k.kod} ${k.nama} (${k.tier}) · ${rp(k.harga)}`).join('\n');
            return reply(`🃏 *KAD SAYA* (${senarai.length} kad · nilai ${rp(jumlah)})\n\n${baris}\n\nJual satu: \`.jual_kad [kod]\``);
        }

        if (cmd === 'jual_kad') {
            const kod = String(args[0] || '').toUpperCase();
            if (!kod) return reply('Format: `.jual_kad [kod]`, contoh `.jual_kad PR-05`.');
            const idx = user.inventory.kad.findIndex(k => k.kod === kod);
            if (idx < 0) return reply(`❌ Kad ${kod} tak ada dalam simpanan awak.`);
            const kad = user.inventory.kad.splice(idx, 1)[0];
            const hasil = Math.round(kad.harga * JUAL_PERATUS);
            user.wallet = (user.wallet || 0) + hasil;
            await db.saveUser(user);
            return reply(`💸 Kad *${kad.nama}* dijual untuk ${rp(hasil)} (${Math.round(JUAL_PERATUS * 100)}% nilai pasaran).\nBaki poket: ${rp(user.wallet)}`);
        }
    },
};
