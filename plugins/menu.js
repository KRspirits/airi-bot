import { config } from '../config.js';
import { sendCard } from '../lib/render.js';
import { activeEvent } from '../lib/state.js';

function formatCompactNumber(number) {
    if (isNaN(number) || !number) return '0';
    const absVal = Math.abs(number);
    if (absVal >= 1e12) return (number / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
    if (absVal >= 1e9) return (number / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (absVal >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (absVal >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return number.toString();
}

export default {
    name: 'menu',
    alias: ['help', 'senarai', 'panel'],
    execute: async ({ sock, m, user }) => {
        try {
            const jid = m.key.remoteJid;
            const senderJid = m.key.participant || jid || '';
            const cleanSender = String(senderJid).replace(/@.*$/, '').replace(/:.*$/, '').replace(/[^0-9]/g, '');

            const cashRingkas = formatCompactNumber(user?.wallet || 0);
            const bankRingkas = formatCompactNumber(user?.bank || 0);
            const jenteraNama = user?.vehicle?.name ? String(user.vehicle.name).split(' ')[0] : 'Jalan Kaki';
            const statusPlat = user?.vehicle?.plate ? `[${user.vehicle.plate}]` : '';

            const menuText = `
╭━━━「 🌸 𝗔𝗜𝗥𝗜 𝗖𝗬𝗕𝗘𝗥 𝗢𝗦 」━━━
┃ 👤 𝗪𝗮𝗿𝗴𝗮 : @${cleanSender}
┃ 💵 𝗧𝘂𝗻𝗮𝗶 : RM ${cashRingkas} 
┃ 🏦 𝗕𝗮𝗻𝗸  : RM ${bankRingkas}
┃ 🚗 𝗚𝗮𝗿𝗮𝗷 : ${jenteraNama} ${statusPlat}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 *[ 𝗭𝗢𝗡 𝟭: 𝗔𝗜, 𝗠𝗨𝗭𝗜𝗞 & 𝗥𝗣𝗚 ]*
 ✧ .airi [teks] ︲ .misi (RPG)
 ✧ .roast @user ︲ .puji @user ︲ .pantun_ai
 ✧ .teka_lagu ︲ .jawab [lirik] ︲ .buletin_cyber
 ✧ .taksir [gambar/teks]

💼 *[ 𝗭𝗢𝗡 𝟮: 𝗘𝗞𝗢𝗡𝗢𝗠𝗜, 𝗣𝗔𝗦𝗔𝗥𝗔𝗡 & 𝗘𝗩𝗘𝗡𝗧 ]*
 ✧ .kerja ︲ .daily ︲ .bal ︲ .transfer @user
 ✧ .pasaran ︲ .beli_emas ︲ .beli_btc
 ✧ .pasar_pemain ︲ .jual_emas ︲ .jual_btc
 ✧ .lelong_kontena ︲ .bida [rm] ︲ .kutip [kod]

🏎️ *[ 𝗭𝗢𝗡 𝟯: 𝗝𝗘𝗡𝗧𝗘𝗥𝗔, 𝗣𝗟𝗔𝗧 & 𝗛𝗔𝗥𝗧𝗔 ]*
 ✧ .showroom [1-5] ︲ .beli_kenderaan [id]
 ✧ .lelong_plat ︲ .beli_plat [no] ︲ .lumba [id]
 ✧ .bengkel ︲ .pasang ︲ .list_hartanah
 ✧ .beli_rumah [id] ︲ .kutip_sewa

🌊 *[ 𝗭𝗢𝗡 𝟰: 𝗣𝗘𝗥𝗧𝗔𝗡𝗜𝗔𝗡 & 𝗝𝗘𝗧𝗜 𝗠𝗘𝗚𝗔 ]*
 ✧ .kebun ︲ .tanam [cili/strawberi] ︲ .tuai
 ✧ .kedai_pancing ︲ .beli_pancing [kategori] [id]
 ✧ .mancing (Joran) ︲ .jala (Tebaran Pukal)
 ✧ .ikan ︲ .jual_ikan ︲ .akuarium ︲ .bela_ikan [no]
 ✧ .baling_magnet ︲ .kedai_magnet ︲ .jual_besi

🏴‍☠️ *[ 𝗭𝗢𝗡 𝟱: 𝗨𝗡𝗗𝗘𝗥𝗪𝗢𝗥𝗟𝗗 & 𝗠𝗔𝗛𝗞𝗔𝗠𝗔𝗛 ]*
 ✧ .jenayah (Senarai) ︲ .bm (Pasar Gelap)
 ✧ .beli_bm [nama] ︲ .cuci_duit [jumlah]
 ✧ .rompak @user ︲ .santau @user ︲ .hackbank
 ✧ .rayu [alasan] ︲ .ikat_jamin @user
 ✧ .hutang_ahlong ︲ .bayar_ahlong ︲ .bounty

🛍️ *[ 𝗭𝗢𝗡 𝟲: 𝗚𝗔𝗗𝗚𝗘𝗧, 𝗣𝗘𝗧 & 𝗪𝗔𝗥𝗨𝗡𝗚 ]*
 ✧ .device ︲ .beli_phone [id] ︲ .shop (Warung)
 ✧ .makan [id] ︲ .kedai_pet ︲ .beli_pet [nama]
 ✧ .beli_telur ︲ .tetas_telur

🎲 *[ 𝗭𝗢𝗡 𝟳: 𝗞𝗔𝗦𝗜𝗡𝗢 & 𝗠𝗜𝗡𝗜-𝗚𝗔𝗠𝗘𝗦 ]*
 ✧ .serang_boss ︲ .bgk ︲ .coinflip ︲ .slot
 ✧ .tarik_tali ︲ .teka_nombor ︲ .kotak_beracun
 ✧ .tembak_botol ︲ .lumba_kuda ︲ .tikam_nombor
 ✧ .gacha_mlbb ︲ .tiktok_affiliate ︲ .split_bil

🏴 *[ 𝗭𝗢𝗡 𝟵: 𝗚𝗘𝗡𝗚, 𝗗𝗥𝗔𝗠𝗔 & 𝗞𝗢𝗟𝗘𝗞𝗦𝗜 ]*
 ✧ .geng ︲ .heist ︲ .sertai_heist ︲ .dendam ︲ .balas @user
 ✧ .profil ︲ .top ︲ .wanted ︲ .siasat @user ︲ .roast @user
 ✧ .album ︲ .gabung [no] [no] ︲ .pameran [no] ︲ .tangkap [kod]
 ✧ .misi ︲ .liga ︲ .panggil [nama] ︲ .ingat [fakta]

🌐 *[ 𝗭𝗢𝗡 𝟴: 𝗜𝗡𝗙𝗢 & 𝗚𝗘𝗟𝗔𝗥𝗔𝗡 ]*
 ✧ .myid ︲ .profile ︲ .badge ︲ .top ︲ .musim
🤖 *[ 𝗭𝗢𝗡 𝟭𝟬: 𝗔𝗜 𝗦𝗘𝗧𝗜𝗔𝗣 𝗛𝗔𝗥𝗜 ]*
 ✧ .tanya ︲ .jelas ︲ .ringkas ︲ .terjemah ︲ .inggeris ︲ .melayu
 ✧ .loghat_kelantan ︲ .loghat_kedah ︲ .loghat_johor ︲ .bahasa_genz
 ✧ .caption ︲ .slogan ︲ .surat ︲ .emel ︲ .syair ︲ .cerpen ︲ .lirik
 ✧ .kod ︲ .debug ︲ .regex ︲ .semak_scam ︲ .cyber_tip
 _(ada 50 AI; taip \`.tanya\` untuk mula)_

🎉 *[ 𝗭𝗢𝗡 𝟭𝟭: 𝗛𝗜𝗕𝗨𝗥𝗔𝗡 & 𝗥𝗔𝗪𝗔𝗞 ]*
 ✧ .dadu ︲ .koin ︲ .suit [batu/gunting/kertas] ︲ .bola8 [soalan]
 ✧ .ship [nama1] [nama2] ︲ .rate ︲ .mood ︲ .horoskop ︲ .ramal
 ✧ .teka ︲ .jawab_teka [jawapan] ︲ .joke ︲ .fakta ︲ .motivasi
 ✧ .bmi [kg] [cm] ︲ .kira [a] [+-*/] [b] ︲ .passgen ︲ .lotot
 _(ada 50 fun; taip \`.dadu\` untuk mula)_

🎰 *[ 𝗭𝗢𝗡 𝟭𝟮: 𝗝𝗨𝗗𝗜 𝗔𝗜 (𝗧𝗔𝗥𝗔𝗦𝗔𝗡 𝗠𝗔𝗫 𝗥𝗠𝟱,𝟬𝟬𝟬) ]*
 ✧ .tekaan [1-10] [rm] ︲ .roda [rm] ︲ .kad_besar h/r [rm]
 ✧ .dadu7 atas/bawah/tujuh [rm] ︲ .peti [1-5] [rm]
 ✧ .kupon [rm] ︲ .tarung @user [rm]

📸 *[ 𝗭𝗢𝗡 𝟭𝟯: 𝗕𝗘𝗥𝗜𝗧𝗔 & 𝗝𝗨𝗔𝗟 𝗚𝗔𝗠𝗕𝗔𝗥 ]*
 ✧ .berita_cyber ︲ .jual_gambar (hantar gambar barang)
 ✧ .setuju (sahkan jualan dalam 60 saat)
─────────────────────────────
`.trim();

            await sendCard(sock, jid, m, 'menuCard', { name: user?.name, wallet: user?.wallet || 0, event: activeEvent()?.name }, "🌸 Panel Airi's Corner");
            return sock.sendMessage(jid, { text: menuText, mentions: [senderJid] }, { quoted: m });
        } catch (err) {
            console.error("Menu Error:", err);
        }
    }
};
