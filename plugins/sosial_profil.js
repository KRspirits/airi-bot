import * as store from '../lib/store.js';
import { myt } from '../lib/util.js';
import { getAvatar } from '../lib/render.js';
import { renderSocialProfile } from '../lib/socialcard.js';

// 🎵 PROFIL TIKTOK & INSTAGRAM. Pengikut, like dan post terkini. Post dengan gambar beri tuntutan.
// .tiktok | .instagram                 -> profil
// .tiktok post [caption] (+ gambar)    -> post baharu
const PLATFORM = { tiktok: 'tiktok', instagram: 'ig', ig: 'ig' };
const TAJUK = { tiktok: 'TikTok', ig: 'Instagram' };
const POS_GAMBAR_RM = 200;   // tuntutan bila post ada gambar (guna .claim)
const UPLOAD_CD = 20 * 60e3;

export default {
    name: 'tiktok',
    alias: ['instagram', 'ig'],
    category: 'sosial',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || '';
        const bahagian = teks.trim().split(/\s+/);
        const cmd = bahagian[0].slice(1).toLowerCase();
        const platform = PLATFORM[cmd] || 'tiktok';
        if (!user.inventory?.phone) return reply('📱 Awak perlukan telefon dulu. Beli di `.device`.');

        const posts = await store.get('mod', 'posts', []);
        const follows = await store.get('mod', 'follows', {});
        const tertunggak = await store.get('mod', 'tertunggak', {});

        if ((args[0] || '').toLowerCase() === 'post') {
            const caption = bahagian.slice(2).join(' ').slice(0, 150);
            const adaGambar = !!(m.message?.imageMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage);
            if (!caption && !adaGambar) return reply(`❌ Format: \`.${cmd} post [caption]\`. Tambah gambar untuk dapat tuntutan.`);
            const cdTinggal = (user.stats?.upload_last || 0) + UPLOAD_CD - Date.now();
            if (cdTinggal > 0) return reply(`⏳ Tunggu ${Math.ceil(cdTinggal / 60e3)} minit lagi sebelum post seterusnya.`);
            const id = Date.now().toString(36).slice(-5);
            posts.unshift({ id, owner: sender, nama: user.name || sender.split('@')[0], platform, caption, gambar: adaGambar, t: Date.now(), lastGrow: Date.now(), likes: 0, shares: 0, likedBy: [], sharedBy: [] });
            await store.set('mod', 'posts', posts.slice(0, 300));
            user.stats = user.stats || {};
            user.stats.upload_last = Date.now();
            await db.saveUser(user);
            if (adaGambar) {
                tertunggak[sender] = (tertunggak[sender] || 0) + POS_GAMBAR_RM;
                await store.set('mod', 'tertunggak', tertunggak);
            }
            return reply(`📤 Dah post ke ${TAJUK[platform]}! ID *${id}*${adaGambar ? `\n📷 Post dengan gambar: +${POS_GAMBAR_RM} tuntutan (taip \`.claim\`)` : ''}\nProfil awak kemas kini sekarang.`);
        }

        const milik = posts.filter(p => p.owner === sender && p.platform === platform);
        const pengikut = (follows[sender] || []).length;
        const jumlahLike = milik.reduce((a, p) => a + (p.likes || 0), 0);
        const tuntutan = Math.floor(tertunggak[sender] || 0);
        const terkini = milik.slice(0, 3).map(p => `• #${p.id} ${p.gambar ? '📷 ' : ''}"${p.caption || '(gambar sahaja)'}" · ❤️ ${p.likes}`);
        const nama = user.name || sender.split('@')[0];
        const avatar = await getAvatar(sock, sender).catch(() => null);
        try {
            const img = await renderSocialProfile({ platform, nama, avatar, pengikut, likes: jumlahLike, posts: milik, tuntutan });
            return sock.sendMessage(jid, { image: img, caption: `👤 Profil ${TAJUK[platform]} · ${nama}` }, { quoted: m });
        } catch (e) {
            console.error('[KAD SOSIAL]', e.message);
        }
        const tarikh = myt().day;
        return reply(`👤 *PROFIL ${TAJUK[platform].toUpperCase()}*\n\n${nama}\n📅 ${tarikh}\n\n👥 Pengikut: ${pengikut}\n❤️ Jumlah like: ${jumlahLike}\n📝 Post: ${milik.length}\n💸 Tuntutan tertunggak: RM ${tuntutan.toLocaleString('en-US')} (\`.claim\`)\n\n🎁 Benefit: setiap pengikut baru RM 20 · post dengan gambar RM ${POS_GAMBAR_RM}\n\n*Post terkini:*\n${terkini.length ? terkini.join('\n') : 'Belum ada post. Taip `.' + cmd + ' post [caption]`'}`);
    }
};
