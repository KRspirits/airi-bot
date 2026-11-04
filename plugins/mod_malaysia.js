import * as store from '../lib/store.js';
import { allow } from '../lib/cooldown.js';
import { myt } from '../lib/util.js';

// MOD MALAYSIA - rider penghantaran & media sosial. Mesti ada telefon (beli di .device).
const RIDER_HARIAN = 30, UPLOAD_HARIAN = 5, UPLOAD_CD = 20 * 60e3;
const CLAIM_MAX = 5000, CLAIM_HARIAN = 15000, SUKA_RM = 3, IKUT_RM = 20;
const KEDAI = ['Nasi Lemak Kak Esah', 'Mamak Ali Tarik', 'Ayam Gorengan Pak Mail', 'Roti John Hujung Kampung',
    'Mee Goreng Mamak Bistro', 'Kopitiam Kak Ros', 'Bubur Ayam Seberang Jalan', 'Pizza Kampung Mangga'];

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const hari = () => myt().day;

async function getOrders() {
    const tetingkap = Math.floor(Date.now() / (10 * 60e3));
    let data = await store.get('mod', 'orders', null);
    if (!data || data.tetingkap !== tetingkap) {
        const senarai = Array.from({ length: 5 }, (_, i) => {
            const jarak = Math.round(rnd(1, 12) * 10) / 10;
            return { id: `${tetingkap % 1000}${i + 1}`, kedai: pick(KEDAI), jarak, bayar: Math.round(8 + jarak * 2.2 + rnd(0, 6)), tuntut: null };
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
    alias: ['rider', 'order', 'terima', 'siap', 'upload', 'feed', 'like', 'share', 'follow', 'claim'],
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

            if (!user.inventory.phone) return reply('📱 Kau perlukan telefon dulu. Beli di `.device` (contoh: `.beli_phone redmi12`).');

            const riders = await store.get('mod', 'riders', {});
            const rider = riders[sender] || { online: false, job: null, harian: { day: '', n: 0 } };
            if (rider.harian.day !== hari()) rider.harian = { day: hari(), n: 0 };

            if (cmd === 'rider') {
                rider.online = (args[0] || '').toLowerCase() !== 'off';
                riders[sender] = rider;
                await store.set('mod', 'riders', riders);
                return reply(rider.online ? '🛵 Kau dah online sebagai rider. Taip `.order` untuk tengok order.' : '🛑 Kau dah offline.');
            }

            if (cmd === 'order') {
                if (!rider.online) return reply('🛵 Taip `.rider` dulu untuk online.');
                const data = await getOrders();
                const baris = data.senarai.map(o => `#${o.id}  ${o.kedai}  ·  ${o.jarak} km  ·  RM ${o.bayar}${o.tuntut ? ' (diambil)' : ''}`);
                return reply(`🛵 *ORDER DELIVERY*\n\n${baris.join('\n')}\n\nTaip \`.terima [id]\` untuk ambil. Had ${RIDER_HARIAN} order sehari.`);
            }

            if (cmd === 'terima') {
                if (!rider.online) return reply('🛵 Taip `.rider` dulu.');
                if (rider.job) return reply(`🛵 Kau masih ada order #${rider.job.id}. Siapkan dulu dengan \`.siap\`.`);
                if (rider.harian.n >= RIDER_HARIAN) return reply(`🛵 Had ${RIDER_HARIAN} order sehari dah penuh. Esok boleh ambil lagi.`);
                const data = await getOrders();
                const o = data.senarai.find(x => x.id === args[0]);
                if (!o) return reply('❌ Order tu tak wujud. Taip `.order` untuk senarai.');
                if (o.tuntut) return reply('❌ Order tu dah diambil rider lain.');
                o.tuntut = sender;
                rider.job = { id: o.id, kedai: o.kedai, jarak: o.jarak, bayar: o.bayar, t: Date.now() };
                await store.set('mod', 'orders', data);
                riders[sender] = rider;
                await store.set('mod', 'riders', riders);
                const minit = Math.max(2, Math.ceil(o.jarak * 1.5));
                return reply(`📦 Order #${o.id} dari *${o.kedai}* (${o.jarak} km). Hantar dalam lebih kurang ${minit} minit, kemudian taip \`.siap\`.`);
            }

            if (cmd === 'siap') {
                if (!rider.job) return reply('📦 Tiada order aktif. Ambil dulu dengan `.terima [id]`.');
                const minit = Math.max(2, Math.ceil(rider.job.jarak * 1.5));
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
                return reply(`✅ Order siap! Bayaran *RM ${bayaran}* (termasuk tip RM ${tip}).\nBaki sekarang: RM ${(user.wallet || 0).toLocaleString('en-US')}`);
            }

            const posts = await store.get('mod', 'posts', []);
            const follows = await store.get('mod', 'follows', {});
            const tertunggak = await store.get('mod', 'tertunggak', {});

            if (cmd === 'upload') {
                if (!allow(sender + ':upload', 2000)) return reply('⏳ Sabar sikit.');
                const cdLeft = (user.stats.upload_last || 0) + UPLOAD_CD - Date.now();
                if (cdLeft > 0) return reply(`⏳ Tunggu ${Math.ceil(cdLeft / 60e3)} minit lagi sebelum upload seterusnya.`);
                const up = user.stats.upload_harian?.day === hari() ? user.stats.upload_harian.n : 0;
                if (up >= UPLOAD_HARIAN) return reply(`📵 Had ${UPLOAD_HARIAN} upload sehari dah penuh.`);
                let platform = 'ig';
                if (['tiktok', 'ig'].includes((args[0] || '').toLowerCase())) platform = args.shift().toLowerCase();
                const caption = args.join(' ').slice(0, 150);
                if (!caption) return reply('❌ Format: `.upload [tiktok|ig] [caption]`. Contoh: `.upload tiktok mancing pagi ni best`');
                const id = Date.now().toString(36).slice(-5);
                posts.unshift({ id, owner: sender, nama: user.name || sender.split('@')[0], platform, caption, t: Date.now(), lastGrow: Date.now(), likes: 0, shares: 0, likedBy: [], sharedBy: [] });
                await store.set('mod', 'posts', posts.slice(0, 300));
                user.stats.upload_last = Date.now();
                user.stats.upload_harian = { day: hari(), n: up + 1 };
                await db.saveUser(user);
                return reply(`📤 Dah upload ke ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}!\nID post: *${id}*\nTengok siapa suka: \`.feed\``);
            }

            if (cmd === 'feed') {
                if (!posts.length) return reply('📭 Belum ada post. Jadi yang pertama, taip `.upload [caption]`.');
                const senarai = posts.slice(0, 5).map(growPost);
                await store.set('mod', 'posts', posts.slice(0, 300));
                const baris = senarai.map(p => `#${p.id} · ${p.platform === 'tiktok' ? 'TikTok' : 'IG'} · ${p.nama}\n   "${p.caption}"\n   ❤️ ${p.likes}   🔁 ${p.shares}`);
                return reply(`📱 *FEED*\n\n${baris.join('\n\n')}\n\nTaip \`.like [id]\`, \`.share [id]\`, \`.follow @user\``);
            }

            if (cmd === 'like' || cmd === 'share') {
                const p = posts.find(x => x.id === args[0]);
                if (!p) return reply('❌ Post tu tak wujud. Taip `.feed` untuk tengok.');
                if (p.owner === sender) return reply('😅 Tak boleh like atau share post sendiri.');
                growPost(p);
                const senarai = cmd === 'like' ? p.likedBy : p.sharedBy;
                if (senarai.includes(sender)) return reply(`Kau dah ${cmd === 'like' ? 'like' : 'share'} post ni.`);
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
                const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                if (!target) return reply('❌ Format: `.follow @user`. Tag orang yang nak diikut.');
                if (target === sender) return reply('😅 Tak boleh ikut diri sendiri.');
                const senaraiIkut = follows[target] || [];
                if (senaraiIkut.includes(sender)) return reply('Kau dah ikut dia.');
                senaraiIkut.push(sender);
                follows[target] = senaraiIkut;
                tertunggak[target] = (tertunggak[target] || 0) + IKUT_RM;
                await store.set('mod', 'follows', follows);
                await store.set('mod', 'tertunggak', tertunggak);
                return reply(`➕ Kau dah ikut dia. Pengikut dia sekarang: ${senaraiIkut.length}`);
            }

            if (cmd === 'claim') {
                const jumlah = Math.min(CLAIM_MAX, Math.floor(tertunggak[sender] || 0));
                if (jumlah <= 0) return reply('📭 Tiada pendapatan media sosial untuk dituntut lagi.');
                const hariIni = user.stats.claim_harian?.day === hari() ? user.stats.claim_harian.n : 0;
                if (hariIni >= CLAIM_HARIAN) return reply(`📵 Had tuntutan sehari (RM ${CLAIM_HARIAN.toLocaleString('en-US')}) dah penuh.`);
                const bayar = Math.min(jumlah, CLAIM_HARIAN - hariIni);
                tertunggak[sender] = (tertunggak[sender] || 0) - bayar;
                user.wallet = (user.wallet || 0) + bayar;
                user.stats.claim_harian = { day: hari(), n: hariIni + bayar };
                await store.set('mod', 'tertunggak', tertunggak);
                await db.saveUser(user);
                return reply(`💸 Tuntutan media sosial: *RM ${bayar.toLocaleString('en-US')}* masuk ke poket.`);
            }
        } catch (e) {
            console.error('[MOD MALAYSIA]', e.message);
            return reply('⚠️ Ada masalah masa proses. Cuba lagi.');
        }
    }
};
