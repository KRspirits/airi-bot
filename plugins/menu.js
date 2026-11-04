import { dashboardCard } from '../lib/cards.js';
import { getAvatar } from '../lib/render.js';
import { MENU_ZONES } from '../lib/menudata.js';

// 📜 MENU: papan gambar yang terangkan setiap bahagian bot dan command untuk ditaip.
// Bahagian owner (veto) tak ditunjuk. Latar Airi berbeza setiap kali dibuka.
const SEKSYEN = (ws) => [
    { tajuk: '📱 Telefon & Rider', warna: '#38e8ff', baris: [
        ['.device', 'Katalog telefon. Wajib beli telefon dulu'],
        ['.rider', 'Online atau offline sebagai rider'],
        ['.order', 'Senarai order penghantaran sekarang'],
        ['.terima [id]', 'Ambil satu order'],
        ['.siap', 'Siapkan order dan terima bayaran'] ] },
    { tajuk: '📲 Media Sosial', warna: '#f472b6', baris: [
        ['.upload tiktok [caption]', 'Upload ke TikTok (atau ig)'],
        ['.feed', 'Lihat post terkini'],
        ['.like [id] / .share [id]', 'Like atau share post orang'],
        ['.follow @user', 'Ikut pemain lain'],
        ['.claim', 'Tuntut pendapatan like dan follow'] ] },
    { tajuk: '💰 Ekonomi & Pasaran', warna: '#fbbf24', baris: [
        ['.kerja', 'Gaji setiap 3 minit (dapat XP)'],
        ['.daily', 'Bonus harian'],
        ['.bal', 'Kad bank dan portfolio'],
        ['.pasaran', 'Carta candle BTC (.pasaran emas untuk emas)'],
        ['.beli_btc / .jual_btc', 'Beli atau jual Bitcoin'] ] },
    { tajuk: '🎣 Memancing', warna: '#4ade80', baris: [
        ['.kedai_pancing', 'Beli joran dan jala'],
        ['.mancing', 'Memancing (level 3)'],
        ['.jala', 'Jala pukal (level 8)'],
        ['.ikan', 'Lihat tong ikan'],
        ['.jual_ikan', 'Jual ikan dalam tong'] ] },
    { tajuk: '🎰 Judi', warna: '#c084fc', baris: [
        ['.kupon [rm]', 'Kupon gosok'],
        ['.roda [rm]', 'Roda nasib'],
        ['.tekaan [1-10] [rm]', 'Teka nombor'],
        ['.tarung @user [rm]', 'Tarung dengan pemain lain'] ] },
    { tajuk: '🖼️ Jual Gambar', warna: '#fb7185', baris: [
        ['.jual_gambar', 'Hantar gambar barang (sebagai dokumen untuk kadar kamera)'],
        ['.tawar [rm] [sebab]', 'Tawar harga dengan hujah'],
        ['.setuju', 'Terima tawaran'] ] },
    { tajuk: '🏆 Profil & Pencapaian', warna: '#7dd3fc', baris: [
        ['.myid', 'Kad pengenalan awak'],
        ['.achievement', 'Senarai pencapaian'],
        ['.album 1 / 2 / 3', 'Album biasa, rare, mitos'],
        ['.level', 'Level dan XP awak'],
        ['.top', 'Papan teratas'],
        ['.sejarah_musim', 'Juara musim lepas'] ] },
    { tajuk: '💬 Airi', warna: '#a78bfa', baris: [
        ['.airi [soalan]', 'Tanya Airi (balas teks)'],
        ['.tanya [soalan]', 'Tanya AI'],
        ['.roast @user', 'Roast seseorang'],
        ['.berita_cyber', 'Berita keselamatan siber'] ] },
];

export default {
    name: 'menu',
    alias: ['help', 'senarai', 'panel'],
    category: 'info',
    execute: async ({ sock, m, user, args = [] }) => {
        const jid = m.key.remoteJid;
        if ((args[0] || '').toLowerCase() === 'penuh') {
            const OWNER = /veto|start_event|stop_event|bida_now|reset_|errlog|syscheck|give_|jail_user|free_user|set_income|mythic|purge|maintenance|siar|bulletin_now|testwelcome|spawn_boss|musim_owner/i;
            const zonBersih = MENU_ZONES.map(z => ({ ...z, items: z.items.filter(it => !OWNER.test(it)) })).filter(z => z.items.length).sort((x, y) => x.num - y.num);
            const PER = 3, halamanPenuh = Math.ceil(zonBersih.length / PER);
            const n = Math.min(halamanPenuh, Math.max(1, parseInt(args[1]) || 1));
            const zon = zonBersih.slice((n - 1) * PER, n * PER);
            const teks = zon.map(z => `*${z.num}. ${z.title}*\n` + z.items.join('\n')).join('\n\n');
            return sock.sendMessage(jid, { text: `📜 *MENU PENUH* halaman ${n}/${halamanPenuh}\n\n${teks}\n\nHalaman seterusnya: \`.menu penuh ${n < halamanPenuh ? n + 1 : 1}\`` }, { quoted: m });
        }
        const sender = m.key.participant || jid;
        const nama = user?.name || sender.split('@')[0];
        const tunai = Number(user?.wallet || 0).toLocaleString('en-US');
        const bank = Number(user?.bank || 0).toLocaleString('en-US');
        const seksyen = SEKSYEN();
        try {
            const av = await getAvatar(sock, sender).catch(() => null);
            const img = await dashboardCard({ nama, tunai, bank, seksyen, avatar: av });
            return sock.sendMessage(jid, { image: img, caption: '📜 Menu Airi · taip nama command untuk guna' }, { quoted: m });
        } catch (e) {
            console.error('[MENU KAD]', e.message);
        }
        const teks = seksyen.map(s => `*${s.tajuk}*\n` + s.baris.map(([c, k]) => `${c} — ${k}`).join('\n')).join('\n\n');
        return sock.sendMessage(jid, { text: `📜 *MENU AIRI'S CORNER*\n\n${teks}` }, { quoted: m });
    }
};
