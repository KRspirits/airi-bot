import { dashboardCard } from '../lib/cards.js';
import { getAvatar } from '../lib/render.js';
import { MENU_ZONES } from '../lib/menudata.js';
import { levelOf, LEVEL_REQUIRED } from '../lib/level.js';

// 📜 MENU: papan gambar yang terangkan setiap bahagian bot dan command untuk ditaip.
// Bahagian owner (veto) tak ditunjuk. Latar Airi berbeza setiap kali dibuka.
const SEKSYEN = (ws) => [
    { tajuk: '🚀 Mula & Akaun', warna: '#4ade80', baris: [
        ['.mula', 'Menu pilihan nombor (untuk pemain baru)'],
        ['.balance', 'Poket, bank, emas dan BTC'],
        ['.daily', 'Bonus harian'],
        ['.level', 'Level dan XP'] ] },
    { tajuk: '💼 Kerja & App', warna: '#38e8ff', baris: [
        ['.job', 'Senarai kerja'],
        ['.job [id]', 'Mohon kerja (contoh: .job runcit)'],
        ['.app pasang [id]', 'Pasang app (grab, foodpanda, kurier)'],
        ['.grab / .foodpanda', 'Senarai order'],
        ['.terima [id]', 'Ambil satu order'] ] },
    { tajuk: '🎣 Memancing', warna: '#22c55e', baris: [
        ['.mancing', 'Pancing satu ikan'],
        ['.jala', 'Tebar jala (banyak ikan)'],
        ['.kedai_pancing', 'Beli joran, umpan, jala'],
        ['.kedai_magnet', 'Beli magnet mancing'],
        ['.album', 'Album ikan'] ] },
    { tajuk: '🌱 Kebun', warna: '#84cc16', baris: [
        ['.tanam [id]', 'Tanam buah'],
        ['.tuai', 'Tuai hasil'] ] },
    { tajuk: '💰 Duit & Pasaran', warna: '#fbbf24', baris: [
        ['.transfer @user [jumlah]', 'Hantar duit (RM)'],
        ['.pasaran', 'Carta BTC dan emas'],
        ['.beli_btc [jumlah]', 'Beli BTC'] ] },
    { tajuk: '🕶️ Jenayah', warna: '#f97316', baris: [
        ['.jenayah', 'Senarai jenayah'],
        ['.gelap', 'Beli barang blackmarket'],
        ['.rob @user', 'Rompak mangsa'],
        ['.peguam [1-3]', 'Peguam (keluar lokap)'],
        ['.bos', 'Lihat bos yang sedang muncul'],
        ['.serang', 'Lawan bos. Yang tak lawan kena rembat bank'] ] },
    { tajuk: '🎰 Judi & Hiburan', warna: '#c084fc', baris: [
        ['.kupon', 'Kupon kad'],
        ['.roda', 'Roda bertuah'],
        ['.dadu', 'Dadu'] ] },
    { tajuk: '📲 Sosial & AI', warna: '#f472b6', baris: [
        ['.feed', 'Suapan sosial'],
        ['.tiktok', 'Profil TikTok'],
        ['.tanya [soalan]', 'Tanya AI Airi'] ] },
];

export default {
    name: 'menu',
    alias: ['help', 'senarai', 'panel'],
    category: 'info',
    execute: async ({ sock, m, user, args = [] }) => {
        const jid = m.key.remoteJid;
        if ((args[0] || '').toLowerCase() === 'penuh') {
            const OWNER = /veto|ownerid|start_event|stop_event|bida_now|reset_|errlog|syscheck|give_|jail_user|free_user|set_income|mythic|purge|maintenance|siar|bulletin_now|testwelcome|spawn_boss|musim_owner/i;
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
