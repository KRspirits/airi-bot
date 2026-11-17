let bossHP = 50000;

export default {
    name: 'minigames',
    alias: [
        'bgk', 'tarik_tali', 'teka_nombor', 'kotak_beracun',
        'tembak_botol', 'lumba_kuda', 'tikam_nombor', 'coinflip',
        'slot', 'gacha_mlbb', 'tiktok_affiliate', 'split_bil'
    ],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const args = teks.trim().split(' ').slice(1);
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // 2. GACHA SKIN MLBB (.gacha_mlbb)
        if (cmd === 'gacha_mlbb') {
            if (user.wallet < 2000) return sock.sendMessage(jid, { text: '❌ Modal gacha RM 2,000!' }, { quoted: m });
            user.wallet -= 2000;

            const roll = Math.random();
            let hadiah = 0;
            let teksGacha = "";

            if (roll < 0.02) { hadiah = 25000; teksGacha = "🌟 *LEGENDARY SKIN GUINEVERE!* (+RM 25,000)"; }
            else if (roll < 0.10) { hadiah = 8000; teksGacha = "🔥 *EPIC SKIN LANCELOT!* (+RM 8,000)"; }
            else if (roll < 0.35) { hadiah = 2500; teksGacha = "✨ *SPECIAL SKIN CHOU!* (+RM 2,500)"; }
            else { teksGacha = "🗑️ *MAGIC DUST x5!* Melayang RM2,000."; }

            user.wallet += hadiah;
            await db.saveUser(user);

            return sock.sendMessage(jid, { text: `🎮 *GACHA MLBB EVENT*\n\n${teksGacha}` }, { quoted: m });
        }

        // 3. TIKTOK AFFILIATE (.tiktok_affiliate)
        if (cmd === 'tiktok_affiliate') {
            if (user.wallet < 500) return sock.sendMessage(jid, { text: '❌ Modal Ads RM 500 diperlukan!' }, { quoted: m });
            user.wallet -= 500;

            const roll = Math.random();
            let untung = 0;
            let status = "";

            if (roll < 0.05) { untung = 15000; status = "🚀 *VIDEO FYP MELETUP!* Komisen affiliate melimpah ruah!"; }
            else if (roll < 0.25) { untung = 2500; status = "🔥 *VIRAL KECIL!* Jualan laju."; }
            else { status = "📉 *FLOP!* View 200 takde orang beli."; }

            user.wallet += untung;
            await db.saveUser(user);

            return sock.sendMessage(jid, {
                text: `📱 *SIMULASI TIKTOK AFFILIATE*\n${status}\nHasil Bersih: *+RM ${untung.toLocaleString()}*`
            }, { quoted: m });
        }

        // 4. BAHAGI BIL MAKAN MAMAK (.split_bil [rm] [pax])
        if (cmd === 'split_bil') {
            const total = parseFloat(args[0]);
            const pax = parseInt(args[1]);

            if (isNaN(total) || isNaN(pax) || pax <= 0) {
                return sock.sendMessage(jid, { text: '❌ Format: `.split_bil [jumlah_rm] [bilangan_orang]`' }, { quoted: m });
            }

            const perHead = (total / pax).toFixed(2);
            return sock.sendMessage(jid, {
                text: `🧮 *KIRA-KIRA BIL MAMAK*\nJumlah Bil: RM ${total.toLocaleString()}\nBilangan: ${pax} Orang\n👉 *RM ${perHead}* seorang!`
            }, { quoted: m });
        }
    }
};
