import { kadarJual, kadBarang } from '../lib/items.js';
import { VEHICLES, PHONE_DEVICES } from '../lib/gamedata.js';

// 🎁 .item                -> senarai barang + harga jelas setiap barang
// 🎁 .item [id]           -> kad statistik
// 🎁 .item guna [id]      -> pakai kenderaan / telefon
// 🎁 .item jual [id]      -> jual (kadar 60%-110% nilai asas)
// 🎁 .jual_item [id]      -> sama dengan .item jual [id]
const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const julat = nilai => `${rp(Math.floor(nilai * 0.6))} – ${rp(Math.floor(nilai * 1.1))}`;

export default {
    name: 'item',
    alias: ['barang_saya', 'jual_item'],
    category: 'ekonomi',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const cmd = teks.trim().split(/\s+/)[0].slice(1).toLowerCase();
        user.items = Array.isArray(user.items) ? user.items : [];
        const cari = id => user.items.find(x => x.id === id);
        const buang = id => { user.items = user.items.filter(x => x.id !== id); };

        async function jual(id) {
            const b = cari(id);
            if (!b) return reply('❌ Barang tu tak ada. Taip `.item` untuk tengok ID.');
            const kadar = kadarJual();
            const dapat = Math.floor(b.nilai * kadar);
            const bersih = dapat - b.bida;
            buang(id);
            user.wallet = (user.wallet || 0) + dapat;
            await db.saveUser(user);
            const hasil = bersih >= 0 ? `UNTUNG ${rp(bersih)}` : `RUGI ${rp(-bersih)}`;
            return reply(`💸 *JUAL ${b.nama}*\nNilai asas: ${rp(b.nilai)}\nKadar pasaran: ${Math.round(kadar * 100)}%\nDapat: ${rp(dapat)}\nHarga bida: ${rp(b.bida)}\nHasil: ${hasil}`);
        }

        async function guna(id) {
            const b = cari(id);
            if (!b) return reply('❌ Barang tu tak ada. Taip `.item` untuk tengok ID.');
            if (b.kind === 'vehicle') {
                if (user.vehicle && user.vehicle.name) return reply(`❌ Awak dah ada kenderaan (${user.vehicle.name}). Jual dulu dengan \`.item jual\`.`);
                const v = VEHICLES.find(x => x.id === b.ref);
                if (!v) return reply('❌ Data kenderaan ni tak wujud lagi.');
                user.vehicle = { name: v.name, speed: v.speed, tier: v.type };
                buang(id);
                await db.saveUser(user);
                return reply(`🚗 *${v.name}* dah masuk garaj awak. Kelajuan ${v.speed} km/h.`);
            }
            if (b.kind === 'phone') {
                user.inventory = user.inventory || {};
                if (user.inventory.phone) return reply('❌ Awak dah ada telefon. Jual telefon lama dulu.');
                const p = PHONE_DEVICES.find(x => x.id === b.ref);
                if (!p) return reply('❌ Data telefon ni tak wujud lagi.');
                user.inventory.phone = p.id;
                user.inventory.phone_name = p.name;
                buang(id);
                await db.saveUser(user);
                return reply(`📱 *${p.name}* dah dipasang. Bonus: ${p.bonus}.`);
            }
            return reply('❌ Barang ni tak boleh dipakai. Boleh dijual sahaja: `.item jual ' + id + '`.');
        }

        if (cmd === 'jual_item') return jual(args[0]);
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'jual') return jual(args[1]);
        if (sub === 'guna') return guna(args[1]);
        if (args[0]) {
            const b = cari(args[0]);
            if (!b) return reply('❌ ID tak jumpa. Taip `.item` untuk senarai.');
            const img = await kadBarang(b);
            return sock.sendMessage(jid, { image: img, caption: `Statistik ${b.nama}` }, { quoted: m });
        }
        if (!user.items.length) return reply('🎁 Awak belum ada barang. Menang lelongan dulu!');
        const baris = user.items.map(b => {
            const bolehPakai = b.kind === 'vehicle' || b.kind === 'phone' ? ' · boleh pakai' : '';
            return `━ ${b.id}  ${b.nama}\n   ${b.kategori} · ${b.nadir}${bolehPakai}\n   Nilai asas ${rp(b.nilai)} · Jual ${julat(b.nilai)}\n   Harga bida awak ${rp(b.bida)}`;
        });
        return reply(`🎁 *BARANG KAU* (${user.items.length})\n\n${baris.join('\n\n')}\n\nKad: \`.item [id]\`\nPakai: \`.item guna [id]\`\nJual: \`.item jual [id]\``);
    }
};
