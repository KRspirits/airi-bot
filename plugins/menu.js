import { dashboardCard } from '../lib/cards.js';
import { getAvatar } from '../lib/render.js';
import { MENU_ZONES } from '../lib/menudata.js';
import { levelOf, LEVEL_REQUIRED } from '../lib/level.js';

// 📜 MENU: papan gambar yang terangkan setiap bahagian bot dan command untuk ditaip.
// Bahagian owner (veto) tak ditunjuk. Latar Airi berbeza setiap kali dibuka.
const SEKSYEN = (ws) => [
    { tajuk: '🚀 Mula Di Sini', warna: '#4ade80', baris: [
        ['.mula', 'Menu pilihan nombor (untuk pemain baru)'],
        ['.menu penuh', 'Senarai semua command'],
        ['.balance', 'Lihat baki dan level'] ] },
    { tajuk: '💼 Kerja & App', warna: '#38e8ff', baris: [
        ['.job', 'Senarai kerja'],
        ['.job [id]', 'Mohon kerja (contoh: .job runcit)'],
        ['.app', 'Senarai app'],
        ['.app pasang [id]', 'Pasang app (contoh: .app pasang grab)'],
        ['.musim_sekarang', 'Musim kerja sekarang'] ] },
    { tajuk: '🛵 Order Penghantaran', warna: '#22c55e', baris: [
        ['.grab', 'Order GRAB (Malaysia)'],
        ['.foodpanda', 'Order foodpanda (Malaysia)'],
        ['.ojol', 'Order Ojol (Indonesia)'],
        ['.gojek', 'Order Gojek (Indonesia)'],
        ['.terima [id]', 'Ambil satu order'] ] },
    { tajuk: '💰 Duit & Tukaran', warna: '#fbbf24', baris: [
        ['.daily', 'Bonus harian'],
        ['.transfer @user [jumlah]', 'Hantar duit'],
        ['.kadar', 'Kadar RM ke Rupiah'],
        ['.tukar [jumlah] rm/idr', 'Tukar mata wang'],
        ['.mata rm/idr', 'Tukar paparan mata wang'] ] },
    { tajuk: '📈 Pasaran', warna: '#f97316', baris: [
        ['.pasaran', 'Carta BTC dan emas'] ] },
    { tajuk: '🎣 Memancing', warna: '#4ade80', baris: [
        ['.mancing', 'Pancing satu ikan'],
        ['.jala', 'Tebar jala (banyak ikan)'],
        ['.kedai_pancing', 'Beli joran, umpan, jala'],
        ['.kedai_magnet', 'Beli magnet mancing'],
        ['.ikan', 'Tong ikan'] ] },
    { tajuk: '📚 Album & Koleksi', warna: '#7dd3fc', baris: [
        ['.album', 'Album ikan (siluet = belum dapat)'],
        ['.album klaim', 'Tuntut ganjaran halaman dan set'],
        ['.item', 'Barang dan kenderaan'] ] },
    { tajuk: '🎰 Judi & Hiburan', warna: '#c084fc', baris: [
        ['.kupon', 'Kupon kad'],
        ['.roda', 'Roda bertuah'],
        ['.dadu', 'Dadu'] ] },
    { tajuk: '📲 Sosial & Profil', warna: '#f472b6', baris: [
        ['.feed', 'Suapan sosial'],
        ['.tiktok', 'Profil TikTok'],
        ['.instagram', 'Profil Instagram'],
        ['.ic', 'Kad pengenalan'] ] },
    { tajuk: '💬 Airi', warna: '#a78bfa', baris: [
        ['.airi [soalan]', 'Tanya Airi'],
        ['.tanya [soalan]', 'Tanya AI'],
        ['.roast @user', 'Roast seseorang'] ] },
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
            const level = levelOf(user);
            const teks = zon.map(z => `*${z.num}. ${z.title}*\n` + z.items.map(it => { const nama = it.split(' ')[0].replace('.', ''); const perlu = LEVEL_REQUIRED[nama]; return perlu && level < perlu ? `${it} 🔒 (level ${perlu})` : it; }).join('\n')).join('\n\n');
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
