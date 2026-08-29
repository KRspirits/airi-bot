export default {
    name: 'menu',
    alias: ['help', 'bantuan'],
    execute: async ({ sock, m }) => {
        const jid = m.key.remoteJid;
        const senderName = m.pushName || 'Warga Gelap';

        const teksMenu = `
┌───「 🌺 𝗔𝗜𝗥𝗜 𝗦𝗬𝗦𝗧𝗘𝗠: 𝗩𝗜𝗕𝗘𝗦 𝗠𝗔𝗟𝗔𝗬𝗦𝗜𝗔 」
├ 👤 𝗣𝗲𝗻𝗴𝗴𝘂𝗻𝗮 : ${senderName}
├ 🤖 𝗩𝗲𝗿𝘀𝗶    : 1.0.0 (Groq Powered)
├ ⚙️ 𝗣𝗿𝗲𝗳𝗶𝘅    : [ . ]
└───────────────────────────

👑 *KUASA FOUNDER VETO*
├ .set_income [jumlah]
├ .jail_user @user [minit]
├ .free_user @user
├ .spawn_boss
└ .syscheck

💼 *EKONOMI, KERJA & BANK*
├ .bal — Semak baki poket, bank & duit gelap
├ .kerja — Buat kerja halal rezeki anak beranak
├ .dep [jumlah / all] — Simpan tunai ke bank
├ .wd [jumlah / all] — Keluarkan simpanan bank
└ .transfer @user [jumlah] — Sedekah/bayar tunai

🏎️ *JENTERA & LUMBA HARAM*
├ .showroom — Katalog kereta legenda tempatan
├ .beli_kenderaan [no] — Beli jentera
└ .lumba — Lumba haram Karak & Bukit Ampang

🎣 *JETI PANCING & MAGNET*
├ .mancing — Pacak joran tarik ikan tepi jeti
├ .jual_ikan — Tunaikan hasil tangkapan di pasar
├ .baling_magnet — Tarik besi buruk dasar sungai
├ .jual_besi — Timbang besi buruk kat kilang
└ .buka_peti — Umpil peti misteri air masin

🎰 *KASINO & PERMAINAN NASIB*
├ .slot [taruhan] — Mesin buah/jackpot 777
├ .sabung_ayam [taruhan] — Laga ayam belakang sawit
└ .teka_nombor [00-99] [taruhan] — Tikam nombor ekor x20

🏴‍☠️ *UNDERWORLD & PINJAMAN*
├ .jenayah — Operasi gelap seludup & rembat
├ .hutang_ahlong [jumlah] — Pinjam tunai segera
├ .bayar_ahlong [jumlah / all] — Bayar hutang ceti
├ .bounty @user [jumlah] — Letak habuan buruan kepala
└ .list_bounty — Senarai buronan paling dicari

🤖 *INTERAKSI AI*
└ Panggil "airi" dalam mana-mana ayat biasa untuk sembang atau kena roasting secara spontan!
───────────────────────────
💬 𝗔𝗶𝗿𝗶: "Pilih command elok-elok, jangan sampai duit licin kena simbah cat merah sudah!"`;

        return sock.sendMessage(jid, { text: teksMenu }, { quoted: m });
    }
};
