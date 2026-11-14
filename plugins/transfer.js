import { pindahDuit } from '../lib/pindah.js';
import { IDR_PER_RM, papar } from '../lib/konteks.js';

// 💸 .transfer @user [jumlah]   (alias: .pay, .sedekah)
// Jumlah ikut mata akaun pengirim: pemain IDR taip Rp, pemain RM taip RM.
// Wallet disimpan dalam RM. Rp ditukar ke RM (bulat ke bawah) sebelum pindah.
export default {
    name: 'transfer',
    alias: ['pay', 'sedekah'],
    category: 'ekonomi',
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const pengirimJid = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const targetJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const nombor = parseInt(teks.trim().split(/\s+/).find(x => /^\d+$/.test(x)), 10);
        const reply = (t, mentions) => sock.sendMessage(jid, mentions ? { text: t, mentions } : { text: t }, { quoted: m });

        if (!targetJid || !Number.isFinite(nombor)) {
            return reply('❌ Format: `.transfer @user [jumlah]`\nJumlah ikut mata akaun awak: RM atau Rp.');
        }
        if (targetJid === pengirimJid) return reply('😅 Tak boleh hantar duit kepada diri sendiri.');

        const pengirimIdr = (user.mata || 'RM') === 'IDR';
        const jumlahRm = pengirimIdr ? Math.floor(nombor / IDR_PER_RM) : nombor;
        if (jumlahRm < 1) {
            return reply(pengirimIdr
                ? `❌ Minimum pindahan ialah Rp ${IDR_PER_RM.toLocaleString('id-ID')} (RM 1).`
                : '❌ Minimum pindahan ialah RM 1.');
        }

        const hasil = await pindahDuit(db, user, targetJid, jumlahRm);
        if (!hasil.ok) return reply(`❌ ${hasil.mesej}`);

        const penerimaIdr = hasil.penerima.mata === 'IDR';
        const pengirimTxt = papar(user.mata || 'RM', jumlahRm);
        const penerimaTxt = papar(hasil.penerima.mata || 'RM', jumlahRm);
        const nomPengirim = `@${pengirimJid.split('@')[0]}`;
        const nomPenerima = `@${targetJid.split('@')[0]}`;
        const bakiTxt = papar(user.mata || 'RM', user.wallet || 0);
        const nota = pengirimIdr && nombor % IDR_PER_RM !== 0
            ? `\nℹ️ Baki Rp ${(nombor % IDR_PER_RM).toLocaleString('id-ID')} dibundarkan ke bawah (kadar 1 RM = Rp ${IDR_PER_RM.toLocaleString('id-ID')}).`
            : '';
        return reply(
            `💸 ${nomPengirim} hantar *${pengirimTxt}* kepada ${nomPenerima}\n` +
            `📩 ${nomPenerima} terima *${penerimaTxt}*\n` +
            `💰 Baki ${nomPengirim}: ${bakiTxt}${nota}`,
            [pengirimJid, targetJid]
        );
    }
};
