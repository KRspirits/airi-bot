import { config } from '../config.js';

// Fungsi memendekkan format angka besar (1,000 -> 1K, 1,000,000 -> 1M, dll)
function formatCompactNumber(number) {
    if (isNaN(number) || number === 0) return '0';
    const absVal = Math.abs(number);
    if (absVal >= 1e12) return (number / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
    if (absVal >= 1e9) return (number / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (absVal >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (absVal >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return number.toString();
}

export default {
    name: 'menu',
    alias: ['help', 'senarai'],
    execute: async ({ sock, m, user }) => {
        const jid = m.key.remoteJid;
        const senderJid = m.key.participant || jid;
        const senderTag = `@${senderJid.split('@')[0]}`;
        const isOwner = senderJid.replace(/[^0-9]/g, '') === config.owner.replace(/[^0-9]/g, '');

        // Ringkasan baki kewangan pemain
        const cashRingkas = formatCompactNumber(user.wallet || 0);
        const bankRingkas = formatCompactNumber(user.bank || 0);
        const jenteraNama = user.vehicle?.name ? user.vehicle.name.split(' ')[0] : 'Tiada';
        const statusPlat = user.vehicle?.plate ? `[${user.vehicle.plate}]` : '';

        const menuText = `
╔═════════════════════════════╗
   🌸 𝐀𝐈𝐑𝐈 𝐂𝐎𝐑𝐍𝐄𝐑 𝐎𝐒 𝐕𝟒.𝟐 🌸
╠═════════════════════════════╣
║ 👤 𝗪𝗮𝗿𝗴𝗮 : ${senderTag}
║ 💵 𝗧𝘂𝗻𝗮𝗶 : RM ${cashRingkas} ︲ 🏦 RM ${bankRingkas}
║ 🚗 𝗚𝗮𝗿𝗮𝗷 : ${jenteraNama} ${statusPlat}
╚═════════════════════════════╝

✨ *[ 𝗭𝗢𝗡 𝟭: 𝗔𝗜, 𝗠𝗨𝗭𝗜𝗞 & 𝗞𝗢𝗠𝗨𝗡𝗜𝗧𝗜 ]*
╟ ✧ .airi [teks] ︲ .roast @user ︲ .puji @user
╟ ✧ .teka_lagu ︲ .jawab [lirik] ︲ .pantun_ai
╟ ✧ .buletin_cyber ︲ .taksir [barang]

💼 *[ 𝗭𝗢𝗡 𝟮: 𝗘𝗞𝗢𝗡𝗢𝗠𝗜 & 𝗣𝗔𝗦𝗔𝗥𝗔𝗡 ]*
╟ ✧ .kerja ︲ .daily ︲ .bal ︲ .transfer @user
╟ ✧ .pasaran ︲ .beli_emas ︲ .jual_emas
╟ ✧ .pasar_pemain ︲ .jual_market ︲ .beli_market
╟ ✧ .bida [rm] (Lelong Kontena) ︲ .kutip [kod]

🏎️ *[ 𝗭𝗢𝗡 𝟯: 𝗝𝗘𝗡𝗧𝗘𝗥𝗔, 𝗣𝗟𝗔𝗧 & 𝗛𝗔𝗥𝗧𝗔 ]*
╟ ✧ .showroom [1-5] ︲ .beli_kenderaan [id]
╟ ✧ .lelong_plat ︲ .beli_plat [no] ︲ .lumba [id]
╟ ✧ .bengkel ︲ .pasang ︲ .list_hartanah
╟ ✧ .beli_rumah [id] ︲ .kutip_sewa

🌾 *[ 𝗭𝗢𝗡 𝟰: 𝗣𝗘𝗥𝗧𝗔𝗡𝗜𝗔𝗡 & 𝗝𝗘𝗧𝗜 𝟮.𝟬 ]*
╟ ✧ .kebun ︲ .tanam [cili/strawberi/ketum] ︲ .tuai
╟ ✧ .mancing ︲ .jual_ikan ︲ .bela_ikan
╟ ✧ .kedai_pancing ︲ .akuarium ︲ .jual_akuarium
╟ ✧ .baling_magnet ︲ .kedai_magnet ︲ .jual_besi

🏴‍☠️ *[ 𝗭𝗢𝗡 𝟱: 𝗨𝗡𝗗𝗘𝗥𝗪𝗢𝗥𝗟𝗗 & 𝗠𝗔𝗛𝗞𝗔𝗠𝗔𝗛 ]*
╟ ✧ .curi_kereta ︲ .ketuk_chassis ︲ .jenayah [id]
╟ ✧ .rompak @user ︲ .santau @user ︲ .hackbank @user
╟ ✧ .rayu [alasan] ︲ .ikat_jamin @user
╟ ✧ .undi_hukum @user ︲ .upah_lawyer
╟ ✧ .hutang_ahlong ︲ .bayar_ahlong ︲ .bounty @user

🛡️ *[ 𝗭𝗢𝗡 𝟲: 𝗚𝗔𝗗𝗚𝗘𝗧, 𝗣𝗘𝗧 & 𝗪𝗔𝗥𝗨𝗡𝗚 ]*
╟ ✧ .device ︲ .beli_phone [id] ︲ .shop (Warung)
╟ ✧ .makan [id] ︲ .kedai_pet ︲ .beli_pet [id]
╟ ✧ .beli_telur ︲ .tetas_telur

🎲 *[ 𝗭𝗢𝗡 𝟳: 𝗞𝗔𝗦𝗜𝗡𝗢 & 𝗠𝗜𝗡𝗜-𝗚𝗔𝗠𝗘𝗦 ]*
╟ ✧ .serang_boss ︲ .bgk ︲ .coinflip ︲ .slot
╟ ✧ .tarik_tali ︲ .teka_nombor ︲ .kotak_beracun
╟ ✧ .tembak_botol ︲ .lumba_kuda ︲ .tikam_nombor
╟ ✧ .gacha_mlbb ︲ .tiktok_affiliate ︲ .split_bil

🌐 *[ 𝗭𝗢𝗡 𝟴: 𝗜𝗡𝗙𝗢, 𝗚𝗘𝗟𝗔𝗥𝗔𝗡 & 𝗩𝗘𝗧𝗢 ]*
╟ ✧ .myid ︲ .profile ︲ .badge ︲ .top ︲ .musim
${isOwner ? `╟ 👑 𝗩𝗘𝗧𝗢: .set_income ︲ .give_cash ︲ .jail_user ︲ .start_event [KOD] [HARI] ︲ .stop_event ︲ .syscheck` : ''}
─────────────────────────────
💬 𝗔𝗶𝗿𝗶: "Jangan lupa solat & makan ya, jangan asyik lumba haram je hehe~ 😋🤍"
`.trim();

        return sock.sendMessage(jid, {
            text: menuText,
            mentions: [senderJid]
        }, { quoted: m });
    }
};
