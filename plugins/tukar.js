import { rmKeIdr, idrKeRm, formatIdr, formatRm } from '../lib/mata.js';
import { IDR_PER_RM } from '../lib/konteks.js';

// 💱 .kadar                 -> kadar pertukaran
// 💱 .tukar [jumlah] rm     -> RM ke Rupiah
// 💱 .tukar [jumlah] idr    -> Rupiah ke RM
// 💱 .mata rm | .mata idr   -> tukar paparan mata wang akaun
export default {
    name: 'tukar',
    alias: ['kadar', 'mata'],
    category: 'ekonomi',
    execute: async ({ sock, m, user, db, args = [] }) => {
        const jid = m.key.remoteJid;
        const reply = t => sock.sendMessage(jid, { text: t }, { quoted: m });
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const cmd = teks.trim().split(/\s+/)[0].slice(1).toLowerCase();
        const kadarTxt = `1 RM = ${formatIdr(IDR_PER_RM)}`;

        if (cmd === 'kadar') return reply(`💱 *KADAR PERTUKARAN*\n${kadarTxt}\n\nTukar: \`.tukar 100 rm\` atau \`.tukar 340000 idr\`\nPaparan: \`.mata rm\` atau \`.mata idr\``);

        if (cmd === 'mata') {
            const pilih = (args[0] || '').toLowerCase();
            if (!['rm', 'idr'].includes(pilih)) return reply(`Mata sekarang: *${user.mata || 'RM'}*. Taip \`.mata rm\` atau \`.mata idr\`.`);
            user.mata = pilih === 'idr' ? 'IDR' : 'RM';
            await db.saveUser(user);
            return reply(`✅ Paparan ditukar ke *${user.mata}*. Wallet tetap dikira dalam RM.`);
        }

        const jumlah = Number(String(args[0] || '').replace(/[^\d.]/g, ''));
        const unit = (args[1] || '').toLowerCase();
        if (!Number.isFinite(jumlah) || jumlah <= 0 || !['rm', 'idr'].includes(unit)) {
            return reply(`Format: \`.tukar [jumlah] rm\` atau \`.tukar [jumlah] idr\`\n${kadarTxt}`);
        }
        if (unit === 'rm') return reply(`💱 ${formatRm(jumlah)} = ${formatIdr(rmKeIdr(jumlah))}`);
        return reply(`💱 ${formatIdr(jumlah)} = ${formatRm(idrKeRm(jumlah))}`);
    }
};
