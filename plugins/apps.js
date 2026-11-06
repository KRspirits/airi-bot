import { getOrders } from './mod_malaysia.js';
import { renderAppOrders } from '../lib/appcard.js';

// 📱 APP TELEFON. Perlu telefon (.device). Order GrabFood & foodpanda dipaparkan dalam tema masing-masing.
const nafiBrand = {
    grabapp: 'GrabFood', grab: 'GrabFood', grabfood: 'GrabFood',
    foodpanda: 'foodpanda', panda: 'foodpanda',
};

export default {
    name: 'app',
    alias: ['app'],
    category: 'kerja',
    execute: async ({ sock, m, user }) => {
        const jid = m.key.remoteJid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const cmd = teks.trim().split(/\s+/)[0].slice(1).toLowerCase();
        if (!user.inventory?.phone) return reply('📱 Kau perlukan telefon dulu. Beli di `.device`.');

        if (cmd === 'app' || cmd === '') {
            return reply(`📱 *APP TELEFON KAU*\n\n🟢 \`.grabapp\` — order GrabFood\n🔴 \`.foodpanda\` — order foodpanda\n🎵 \`.tiktok\` — profil TikTok\n📸 \`.instagram\` — profil Instagram\n🏦 \`.balance\` — kad bank\n🗺️ \`.order\` — peta semua order\n🌙 \`.seludup\` — blackmarket (10 malam - 4 pagi)`);
        }

        const brand = nafiBrand[cmd] || 'GrabFood';
        const data = await getOrders();
        const senarai = data.senarai.filter(o => o.brand === brand);
        const img = renderAppOrders(brand, senarai, senarai.length ? 'Pilih order, taip .terima [id]' : 'Tunggu sebentar, order baharu muncul');
        return sock.sendMessage(jid, { image: img, caption: `${brand === 'GrabFood' ? 'GrabFood' : 'foodpanda'}: ${senarai.length} order` }, { quoted: m });
    }
};
