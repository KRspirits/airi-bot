import { resolveJid } from '../lib/lidmap.js';
import * as store from '../lib/store.js';
import { allow } from '../lib/cooldown.js';
import { myt } from '../lib/util.js';
import { petaOrder, jarakKm, BANDAR } from '../lib/peta.js';
import { VEHICLES, PHONE_DEVICES } from '../lib/gamedata.js';

// =========================================================================
// 🛵 KERJA HALAL: RIDER GRABFOOD / FOODPANDA + MEDIA SOSIAL.
// Syarat rider: ada telefon (.device) dan kereta murah (RM60,000 ke bawah).
// Order dipaparkan atas peta Malaysia dengan titik ambil dan hantar.
// Bayaran = 6 + jarak x RM1.80 + tip rawak.
// =========================================================================

const KEDAI = ['Nasi Lemak Kak Esah', 'Mamak Ali Tarik', 'Ayam Gorengan Pak Mail', 'Roti John Hujung Kampung',
    'Mee Goreng Mamak Bistro', 'Kopitiam Kak Ros', 'Bubur Ayam Seberang Jalan', 'Pizza Kampung Mangga'];
const BRAND = ['GrabFood', 'foodpanda'];
const KERETA_MAX = 60000;
const RIDER_HARIAN = 30, UPLOAD_HARIAN = 5, UPLOAD_CD = 20 * 60e3;
const CLAIM_MAX = 5000, CLAIM_HARIAN = 15000, SUKA_RM = 3, IKUT_RM = 20;

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const hari = () => myt().day;
const rp = n => `RM ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;

function layakKereta(user) {
    const v = VEHICLES.find(x => x.name === user.vehicle?.name);
    return !!v && v.price <= KERETA_MAX;
}

export async function getOrders() {
    const tetingkap = Math.floor(Date.now() / (10 * 60e3));
    let data = await store.get('mod', 'orders', null);
    if (!data || data.tetingkap !== tetingkap) {
        const bandar = Object.keys(BANDAR);
        const senarai = Array.from({ length: 5 }, (_, i) => {
            const dari = pick(bandar);
            let ke = pick(bandar); while (ke === dari) ke = pick(bandar);
            const jarak = Math.round(jarakKm(dari, ke) * 1.3 * 10) / 10;
            return { id: `${tetingkap % 1000}${i + 1}`, brand: pick(BRAND), kedai: pick(KEDAI), dari, ke, jarak,
                bayar: Math.round(6 + jarak * 1.8 + rnd(0, 4)), tuntut: null };
        });
        data = { tetingkap, senarai };
        await store.set('mod', 'orders', data);
    }
    return data;
}

function growPost(p) {
    const jam = (Date.now() - (p.lastGrow || p.t)) / 3600e3;
    if (jam > 0) {
        p.likes += Math.floor(jam * rnd(0, 4));
        if (Math.random() < Math.min(0.5, jam * 0.1)) p.shares += 1;
        p.lastGrow = Date.now();
    }
    return p;
}

export default {
    name: 'mod_malaysia',
    alias: ['upload', 'feed', 'like', 'share', 'follow', 'claim'],
    category: 'mod',
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });
        try {
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || '';
            const bahagian = teks.trim().split(/\s+/);
            const cmd = bahagian[0].slice(1).toLowerCase();
            const args = bahagian.slice(1);
            user.stats = user.stats || {};
            user.inventory = user.inventory || {};

            const rider_kunci = ['rider', 'order', 'terima', 'siap'];
            if (rider_kunci.includes(cmd)) {
                if (!user.inventory.phone) return reply('📱 Perlukan telefon dulu. Beli di `.device`.');
                if (!layakKereta(user)) return reply(`🚗 Perlukan kereta murah (RM ${KERETA_MAX.toLocaleString('en-US')} ke bawah). Beli di \`.showroom\`, atau ambil dari lelongan garaj.`);
            }

            const riders = await store.get('mod', 'riders', {});
            const rider = riders[sender] || { online: false, job: null, harian: { day: '', n: 0 } };
            if (rider.harian.day !== hari()) rider.harian = { day: hari(), n: 0 };

            if (cmd === 'rider') {
                if (!user.inventory.phone || !layakKereta(user)) { /* dah disemak di atas */ }
                rider.online = (args[0] || '').toLowerCase() !== 'off';
                riders[sender] = rider;
                await store.set('mod', 'riders', riders);
                return reply(rider.online ? '🛵 Awak online sebagai rider. Taip `.order` untuk lihat order atas peta.' : '🛑 Awak offline.');
            }

            if (cmd === 'order') {
                if (!rider.online) return reply('🛵 Taip `.rider` dulu untuk online.');
                const data = await getOrders();
                const baris = data.senarai.map((o, i) => `${i + 1}. [${o.id}] ${o.brand} · ${o.kedai}\n   ${o.dari} → ${o.ke} · ${o.jarak} km · ${rp(o.bayar)}${o.tuntut ? ' (diambil)' : ''}`);
                const img = petaOrder(data.senarai);
                return sock.sendMessage(jid, { image: img, caption: `🛵 *ORDER HARI INI*\n\n${baris.join('\n')}\n\nTaip \`.terima [id]\` untuk ambil order.` }, { quoted: m });
            }

            if (cmd === 'terima') {
                if (!rider.online) return reply('🛵 Taip `.rider` dulu.');
                if (rider.job) return reply(`🛵 Awak masih ada order [${rider.job.id}]. Siapkan dulu dengan \`.siap\`.`);
                if (rider.harian.n >= RIDER_HARIAN) return reply(`🛵 Had ${RIDER_HARIAN} order sehari dah penuh. Esok boleh ambil lagi.`);
                const data = await getOrders();
                const o = data.senarai.find(x => x.id === args[0]);
                if (!o) return reply('❌ Order tu tak wujud. Taip `.order` untuk senarai.');
                if (o.tuntut) return reply('❌ Order tu dah diambil rider lain.');
                o.tuntut = sender;
                rider.job = { id: o.id, brand: o.brand, kedai: o.kedai, dari: o.dari, ke: o.ke, jarak: o.jarak, bayar: o.bayar, t: Date.now() };
                await store.set('mod', 'orders', data);
                riders[sender] = rider;
                await store.set('mod', 'riders', riders);
                const minit = Math.max(3, Math.ceil(o.jarak * 2));
                return reply(`📦 Order [${o.id}] ${o.brand} dari *${o.kedai}*\nAmbil di ${o.dari} → hantar ke ${o.ke} (${o.jarak} km)\nBayaran ${rp(o.bayar)} + tip.\nSiap dalam lebih kurang ${minit} minit, kemudian taip \`.siap\`.`);
            }

            if (cmd === 'siap') {
                if (!rider.job) return reply('📦 Tiada order aktif. Ambil dulu dengan `.terima [id]`.');
                const minit = Math.max(3, Math.ceil(rider.job.jarak * 2));
                const lama = (Date.now() - rider.job.t) / 60e3;
                if (lama < minit) return reply(`⏳ Belum sampai. Tunggu ${Math.ceil(minit - lama)} minit lagi.`);
                const tip = Math.round(rnd(0, 5));
                const bayaran = rider.job.bayar + tip;
                user.wallet = (user.wallet || 0) + bayaran;
                rider.harian.n += 1;
                rider.job = null;
                riders[sender] = rider;
                await store.set('mod', 'riders', riders);
                await db.saveUser(user);
                return reply(`✅ Order siap! Bayaran ${rp(bayaran)} (termasuk tip ${rp(tip)}).\nBaki sekarang: ${rp(user.wallet)}`);
            }

            // ---------------- MEDIA SOSIAL ----------------
            const posts = await store.get('mod', 'posts', []);
            const follows = await store.get('mod', 'follows', {});
            const tertunggak = await store.get('mod', 'tertunggak', {});

            if (cmd === 'upload') {
                if (!user.inventory.phone) return reply('📱 Perlukan telefon dulu. Beli di `.device`.');
                if (!allow(sender + ':upload', 2000)) return reply('⏳ Sabar sikit.');
                const cdLeft = (user.stats.upload_last || 0) + UPLOAD_CD - Date.now();
                if (cdLeft > 0) return reply(`⏳ Tunggu ${Math.ceil(cdLeft / 60e3)} minit lagi sebelum upload seterusnya.`);
                const up = user.stats.upload_harian?.day === hari() ? user.stats.upload_harian.n : 0;
                if (up >= UPLOAD_HARIAN) return reply(`📵 Had ${UPLOAD_HARIAN} upload sehari dah penuh.`);
                let platform = 'ig';
                if (['tiktok', 'ig'].includes((args[0] || '').toLowerCase())) platform = args.shift().toLowerCase();
                const caption = args.join(' ').slice(0, 150);
                if (!caption) return reply('❌ Format: `.upload [tiktok|ig] [caption]`.');
                const id = Date.now().toString(36).slice(-5);
                posts.unshift({ id, owner: sender, nama: user.name || sender.split('@')[0], platform, caption, t: Date.now(), lastGrow: Date.now(), likes: 0, shares: 0, likedBy: [], sharedBy: [] });
                await store.set('mod', 'posts', posts.slice(0, 300));
                user.stats.upload_last = Date.now();
                user.stats.upload_harian = { day: hari(), n: up + 1 };
                await db.saveUser(user);
                return reply(`📤 Dah upload ke ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}! ID: *${id}*. Tengok: \`.feed\``);
            }

            if (cmd === 'feed') {
                if (!posts.length) return reply('📭 Belum ada post. Jadi yang pertama: `.upload [caption]`.');
                const senarai = posts.slice(0, 5).map(growPost);
                await store.set('mod', 'posts', posts.slice(0, 300));
                const baris = senarai.map(p => `#${p.id} · ${p.platform === 'tiktok' ? 'TikTok' : 'IG'} · ${p.nama}\n   "${p.caption}"\n   ❤️ ${p.likes}   🔁 ${p.shares}`);
                return reply(`📱 *FEED*\n\n${baris.join('\n\n')}\n\n\`.like [id]\` · \`.share [id]\` · \`.follow @user\``);
            }

            if (cmd === 'like' || cmd === 'share') {
                const p = posts.find(x => x.id === args[0]);
                if (!p) return reply('❌ Post tu tak wujud. Taip `.feed`.');
                if (p.owner === sender) return reply('😅 Tak boleh like atau share post sendiri.');
                growPost(p);
                const senarai = cmd === 'like' ? p.likedBy : p.sharedBy;
                if (senarai.includes(sender)) return reply(`Awak dah ${cmd === 'like' ? 'like' : 'share'} post ni.`);
                senarai.push(sender);
                if (cmd === 'like') {
                    p.likes += 1;
                    tertunggak[p.owner] = (tertunggak[p.owner] || 0) + SUKA_RM;
                    await store.set('mod', 'tertunggak', tertunggak);
                    await store.set('mod', 'posts', posts.slice(0, 300));
                    return reply(`❤️ Dah like post #${p.id}. Jumlah like: ${p.likes}`);
                }
                p.shares += 1;
                const viral = Math.random() < 0.2;
                if (viral) p.likes += 10;
                await store.set('mod', 'posts', posts.slice(0, 300));
                return reply(viral ? `🔥 VIRAL! Post #${p.id} naik trending, +10 like!` : `🔁 Dah share post #${p.id}.`);
            }

            if (cmd === 'follow') {
                const target = resolveJid(m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]);
                if (!target) return reply('❌ Format: `.follow @user`.');
                if (target === sender) return reply('😅 Tak boleh ikut diri sendiri.');
                const senaraiIkut = follows[target] || [];
                if (senaraiIkut.includes(sender)) return reply('Awak dah ikut dia.');
                senaraiIkut.push(sender);
                follows[target] = senaraiIkut;
                tertunggak[target] = (tertunggak[target] || 0) + IKUT_RM;
                await store.set('mod', 'follows', follows);
                await store.set('mod', 'tertunggak', tertunggak);
                return reply(`➕ Awak dah ikut dia. Pengikut sekarang: ${senaraiIkut.length}`);
            }

            if (cmd === 'claim') {
                const jumlah = Math.min(CLAIM_MAX, Math.floor(tertunggak[sender] || 0));
                if (jumlah <= 0) return reply('📭 Tiada pendapatan media sosial untuk dituntut lagi.');
                const hariIni = user.stats.claim_harian?.day === hari() ? user.stats.claim_harian.n : 0;
                if (hariIni >= CLAIM_HARIAN) return reply(`📵 Had tuntutan sehari (${rp(CLAIM_HARIAN)}) dah penuh.`);
                const bayar = Math.min(jumlah, CLAIM_HARIAN - hariIni);
                tertunggak[sender] = (tertunggak[sender] || 0) - bayar;
                user.wallet = (user.wallet || 0) + bayar;
                user.stats.claim_harian = { day: hari(), n: hariIni + bayar };
                await store.set('mod', 'tertunggak', tertunggak);
                await db.saveUser(user);
                return reply(`💸 Tuntutan media sosial: ${rp(bayar)} masuk ke poket.`);
            }
        } catch (e) {
            console.error('[MOD MALAYSIA]', e.message);
            return reply('⚠️ Ada masalah masa proses. Cuba lagi.');
        }
    }
};
