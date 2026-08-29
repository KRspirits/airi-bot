const cdMancing = new Map();

const IKAN_BIASA = [
    { nama: 'Ikan Kembung 🐟', harga: 150 }, { nama: 'Ikan Selar 🐟', harga: 180 },
    { nama: 'Sotong Katak 🦑', harga: 200 }, { nama: 'Ketam Nipah 🦀', harga: 250 },
    { nama: 'Ikan Merah 🐠', harga: 300 }, { nama: 'Ikan Pari 🐡', harga: 350 },
    { nama: 'Siakap Laut 🐟', harga: 400 }, { nama: 'Kerapu Batu 🐠', harga: 450 }
];

const IKAN_RARE = [
    { nama: 'Lobster Biru 🦞', harga: 1200 }, { nama: 'Pari Hantu 🦇', harga: 1500 },
    { nama: 'Ikan Buntal Beracun 🐡', harga: 1800 }, { nama: 'Kerapu Harimau 🐅', harga: 2200 },
    { nama: 'Sotong Kurita Gergasi 🐙', harga: 2500 }
];

const IKAN_MITOS = [
    { nama: 'Jerung Putih Besar 🦈', harga: 8500 }, { nama: 'Ikan Paus Biru 🐋', harga: 15000 },
    { nama: 'Megalodon Purba 🦖', harga: 35000 }, { nama: 'Naga Laut Raksasa 🐉', harga: 50000 }
];

export default {
    name: 'mancing',
    alias: ['jual_ikan'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid;
        const senderId = m.key.participant || jid;
        const teks = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const cmd = teks.slice(1).trim().split(' ')[0].toLowerCase();

        // [ AUTO-REPAIR ] Pastikan tong ikan wujud sebelum proses
        if (!user.inventory) user.inventory = {};
        if (!Array.isArray(user.inventory.fish)) user.inventory.fish = [];
        if (!user.stats) user.stats = { fish_caught: 0 };

        // -------------------------------------------------------------
        // 1. JUAL IKAN (.jual_ikan)
        // -------------------------------------------------------------
        if (cmd === 'jual_ikan') {
            if (user.inventory.fish.length === 0) {
                return sock.sendMessage(jid, { text: '❌ Tong ikan kau kosong berhabuk! Pergi `.mancing` dulu.' }, { quoted: m });
            }
            
            let untung = 0;
            let senaraiJual = {};

            user.inventory.fish.forEach(ikan => {
                untung += ikan.harga;
                senaraiJual[ikan.nama] = (senaraiJual[ikan.nama] || 0) + 1;
            });

            const jumlahIkan = user.inventory.fish.length;
            user.wallet += untung;
            user.inventory.fish = []; // Kosongkan tong
            await db.saveUser(user);

            let resText = `🐟 *HASIL JUALAN JETI 2.0*\n──────────────────\n`;
            for (const [nama, qty] of Object.entries(senaraiJual)) {
                resText += `▪️ ${nama} (x${qty})\n`;
            }
            resText += `──────────────────\n💰 Untung Bersih: *RM ${untung.toLocaleString()}*\n\n💬 Airi: "Fuhhh kaya pakcik nelayan harini! Jom belanja Airi boba~ 🧋🌸"`;

            return sock.sendMessage(jid, { text: resText }, { quoted: m });
        }

        // -------------------------------------------------------------
        // 2. MEMANCING (.mancing)
        // -------------------------------------------------------------
        const now = Date.now();
        const cd = 35 * 1000; // 35 saat masa rehat
        const lastRun = cdMancing.get(senderId) || 0;

        if (now - lastRun < cd) {
            const baki = Math.ceil((cd - (now - lastRun)) / 1000);
            return sock.sendMessage(jid, { text: `⏳ Syhhh! Ikan tengah usha umpan tu. Tunggu lagi ${baki} saat!` }, { quoted: m });
        }
        
        cdMancing.set(senderId, now);

        // Sistem RNG Gred Ikan
        const rng = Math.random();
        let ikanDapat;
        let gred = "";

        if (rng < 0.03) { // 3% Mitos
            ikanDapat = IKAN_MITOS[Math.floor(Math.random() * IKAN_MITOS.length)];
            gred = "🌟 *TANGKAPAN MITOS!!* 🌟";
        } else if (rng < 0.20) { // 17% Rare
            ikanDapat = IKAN_RARE[Math.floor(Math.random() * IKAN_RARE.length)];
            gred = "✨ *Tangkapan Rare!*";
        } else { // 80% Biasa
            ikanDapat = IKAN_BIASA[Math.floor(Math.random() * IKAN_BIASA.length)];
            gred = "🎣 *Tangkapan Biasa*";
        }

        user.inventory.fish.push(ikanDapat);
        user.stats.fish_caught += 1;
        await db.saveUser(user);

        return sock.sendMessage(jid, { 
            text: `${gred}\nFuh berpeluh ketiak tarik joran, kau berjaya naikkan:\n\n🐟 *${ikanDapat.nama}*\n💵 Anggaran Nilai: RM ${ikanDapat.harga.toLocaleString()}\n\n👉 Taip \`.jual_ikan\` untuk jual semua ikan dalam tong.` 
        }, { quoted: m });
    }
};
