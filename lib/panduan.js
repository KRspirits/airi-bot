// =========================================================================
// 📘 PANDUAN SEKALI. Bila pemain guna sistem buat kali pertama, bot hantar satu panduan pendek.
// Setiap sistem hanya sekali untuk setiap pemain (disimpan dalam user.stats).
// =========================================================================

const SISTEM = {
    kebun: '🌱 *KEBUN*\n`.tanam` lihat senarai buah · `.tanam [buah]` tanam · `.tuai` tuai bila masak.',
    kerja: '💼 *KERJA*\n`.job` senarai kerja · `.job [id]` kerja biasa · dapat gaji terus.',
    rider: '🛵 *RIDER (GRAB & FOODPANDA)*\nPasang app dulu: `.app pasang grab` atau `.app pasang foodpanda`, kemudian `.job grab` atau `.job foodpanda`.\n`.grab` / `.foodpanda` lihat order · `.terima [id]` untuk bayaran terus.',
    jenayah: '🕶️ *JENAYAH*\n`.jenayah` senarai · `.gelap` peralatan blackmarket.\nKantoi = penjara. `.peguam` atau `.rasuah` untuk keluar, `.lokap` tengok masa.',
    pasaran: '📈 *PASARAN*\n`.pasaran` carta BTC · `.pasaran emas` carta emas.\n`.beli_btc` atau `.jual_btc` untuk trading.',
    lelong: '🔨 *LELONGAN*\nBila lelongan dibuka: `.bida [rm]`. Pemenang dapat barang, lihat di `.item`.',
    sosial: '📱 *SOSIAL*\n`.upload` atau `.tiktok post` untuk post · `.feed` lihat · `.like` · `.claim` tuntut.',
    mancing: '🎣 *MANCING*\nLevel 3 untuk `.mancing`, level 8 untuk `.jala`. Kumpul XP dengan `.kerja` dan `.daily`.',
    barang: '🎁 *BARANG*\n`.item` senarai · `.item guna [id]` pakai · `.item jual [id]` jual.',
    musim: '🌦️ *MUSIM KERJA*\nMusim muncul sendiri dalam group. `.musim_sekarang` tengok yang sedang berjalan.',
};

const ARAH = {
    tanam: 'kebun', tuai: 'kebun',
    job: 'kerja',
    grab: 'rider', foodpanda: 'rider', terima: 'rider',
    jenayah: 'jenayah', gelap: 'jenayah', beli_gelap: 'jenayah', peguam: 'jenayah', rasuah: 'jenayah', lokap: 'jenayah',
    pasaran: 'pasaran', beli_btc: 'pasaran', jual_btc: 'pasaran',
    bida: 'lelong', ambil: 'lelong',
    upload: 'sosial', tiktok: 'sosial', instagram: 'sosial', feed: 'sosial', claim: 'sosial',
    mancing: 'mancing', jala: 'mancing',
    item: 'barang',
    musim_kerja: 'musim', musim_sekarang: 'musim',
};

/** Hantar panduan sistem sekali sahaja untuk setiap pemain. */
export async function panduanSekali(sock, m, user, db, cmd) {
    const sistem = ARAH[cmd];
    if (!sistem || !SISTEM[sistem]) return;
    user.stats = user.stats || {};
    const kunci = `panduan_${sistem}`;
    if (user.stats[kunci]) return;
    user.stats[kunci] = true;
    await db.saveUser(user).catch(() => {});
    await sock.sendMessage(m.key.remoteJid, { text: SISTEM[sistem] }, { quoted: m }).catch(() => {});
}
