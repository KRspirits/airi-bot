import { sceneCard } from '../lib/scene.js';
const JENAYAH_LIST = {
    'curi_kereta': { nama: 'Curi Kereta', risiko: 0.40, min: 2000, max: 5000, penalti: 5 },
    'scam': { nama: 'Scam Macau', risiko: 0.45, min: 4000, max: 8000, penalti: 10 },
    'peras_ugut': { nama: 'Peras Ugut', risiko: 0.50, min: 6000, max: 12000, penalti: 15 },
    'seludup': { nama: 'Seludup Haram', risiko: 0.55, min: 10000, max: 20000, penalti: 20 },
    'jual_maklumat': { nama: 'Jual Maklumat Sulit', risiko: 0.60, min: 15000, max: 30000, penalti: 30 },
    'seludup_senjata': { nama: 'Seludup Senjata', risiko: 0.65, min: 25000, max: 50000, penalti: 45 },
    'godam_kripto': { nama: 'Godam Kripto', risiko: 0.70, min: 40000, max: 80000, penalti: 60 },
    'rompak_bank': { nama: 'Rompak Bank', risiko: 0.75, min: 80000, max: 150000, penalti: 90 },
    'rompak_kasino': { nama: 'Rompak Kasino', risiko: 0.80, min: 150000, max: 300000, penalti: 120 },
    'rompak_jongkong': { nama: 'Rompak Jongkong Emas', risiko: 0.85, min: 300000, max: 600000, penalti: 180 }
};

export default {
    name: 'jenayah_lama',
    alias: Object.keys(JENAYAH_LIST),
    execute: async ({ sock, m, user, db }) => {
        try {
            const jid = m.key.remoteJid;
            const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
            const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

            // Tarik data terus dari memori database utama
            if (!user.inventory) user.inventory = {};
            const buffNama = user.inventory.bm_nama || 'Tiada';
            const buffNilai = user.inventory.bm_perlindungan || 0;
            
            if (!user.jail) user.jail = { status: false, release_at: 0 };

            if (cmd === 'jenayah') {
                let ui = `╔═════════════════════════════╗\n` +
                         `    🏴‍☠️ 𝗞𝗔𝗥𝗧𝗘𝗟 𝗝𝗘𝗡𝗔𝗬𝗔𝗛 𝗔𝗜𝗥𝗜 🏴‍☠️\n` +
                         `╠═════════════════════════════╣\n\n`;

                let i = 1;
                for (const [key, info] of Object.entries(JENAYAH_LIST)) {
                    const statusBuff = buffNilai > 0 ? `✅ (${buffNama})` : `❌`;
                    
                    let risikoSemasa = (info.risiko * 100) - (buffNilai * 100);
                    if (risikoSemasa < 5) risikoSemasa = 5; 

                    ui += `| ${i}. .${key}\n`;
                    if (buffNilai > 0) {
                        ui += `| ↳ Risiko: ~~${info.risiko * 100}%~~ 📉 ${risikoSemasa}% | Buff BM: ${statusBuff}\n`;
                    } else {
                        ui += `| ↳ Risiko: ${info.risiko * 100}% | Buff BM: ${statusBuff}\n`;
                    }
                    i++;
                }

                ui += `\n💡 **Tip:** Taip \`.bm\` untuk beli barang pelindung!`;
                return sock.sendMessage(jid, { text: ui }, { quoted: m });
            }

            if (JENAYAH_LIST[cmd]) {
                if (user.jail.status && Date.now() < user.jail.release_at) {
                    const baki = Math.ceil((user.jail.release_at - Date.now()) / 60000);
                    return sock.sendMessage(jid, { text: `⛓️ Awak masih dalam lokap. Tinggal ${baki} minit lagi.` }, { quoted: m });
                } else if (user.jail.status) {
                    user.jail.status = false;
                }

                const crime = JENAYAH_LIST[cmd];
                let risikoAkhir = crime.risiko - buffNilai;
                if (risikoAkhir < 0.05) risikoAkhir = 0.05;

                const rng = Math.random();
                const isKantoi = rng < risikoAkhir;

                if (isKantoi) {
                    user.jail = { status: true, release_at: Date.now() + (crime.penalti * 60000) };
                    if (typeof user.markModified === 'function') user.markModified('jail');
                    await db.saveUser(user);
                    
                    let alasanBuff = buffNilai > 0 ? `🛡️ Buff BM: ${buffNama} (Gagal menyorok)\n` : '';
                    
                    return sock.sendMessage(jid, { image: sceneCard('tangkap'), caption: `🚨 **KANTOI BASAH!**\nKau ditangkap polis semasa melakukan operasi *${crime.nama}*.\n\n${alasanBuff}⏳ Hukuman Lokap: ${crime.penalti} Minit.` }, { quoted: m });
                } else {
                    const untung = Math.floor(Math.random() * (crime.max - crime.min + 1)) + crime.min;
                    user.duit_gelap = (user.duit_gelap || user.black_money || 0) + untung;
                    if (typeof user.markModified === 'function') user.markModified('duit_gelap');
                    await db.saveUser(user);
                    
                    let efekBuff = buffNilai > 0 ? `🛡️ Buff BM: ${buffNama} (-${buffNilai * 100}% Risiko)\n` : '';

                    return sock.sendMessage(jid, { image: sceneCard('rompak'), caption: `🏴‍☠️ **MISI SUKSES!**\nOperasi *${crime.nama}* berjaya tanpa dikesan radar polis.\n\n${efekBuff}💵 Hasil Kotor: RM ${untung.toLocaleString()}` }, { quoted: m });
                }
            }
        } catch (err) {
            console.error("Jenayah Error:", err);
        }
    }
};
