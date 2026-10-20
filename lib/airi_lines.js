// =========================================================================
// 💬 AYAT AIRI UNTUK SETIAP SCENE (Bahasa Melayu harian, santai, tak skema).
// Placeholder: {nama} dan {group}. Dipanggil oleh line(kategori, vars).
// =========================================================================

const LINES = {
    welcome: [
        'Eh {nama}! Selamat datang ke {group}. Duduk la dulu, minum air.',
        'Wah, {nama} dah masuk. Jom borak dengan orang lain.',
        'Hai {nama}! Jangan segan, kitorang semua baik-baik je.'
    ],
    mythic: [
        'Eh, ada makhluk pelik muncul kat laut! Cepat taip kod tu sebelum orang lain dapat.',
        'Ada benda besar baru timbul kat laut. Siapa cepat, dia dapat.',
        'Kau nampak tak tadi? Makhluk mitos baru muncul. Taip kod sekarang.'
    ],
    purge: [
        'Hari Pembersihan dah mula. Polis cuti sejam, jadi buat je apa nak buat.',
        'Sejam tanpa polis. Guna sebaik-baiknya.'
    ],
    auction: [
        'Ada kontena misteri hanyut kat pantai. Siapa nak bida?',
        'Ada barang pelik dijual. Siapa berani bida?'
    ],
    jackpot: [
        'Wah, ada orang kena jackpot! Tahniah, memang gila.',
        'Besar ni! Ada orang balik dengan duit banyak hari ni.'
    ],
    jail: [
        'Alamak, kena tangkap. Tahan la sekejap, tak lama pun.',
        'Kantoi! Duduk diam dulu, nanti keluar juga.'
    ],
    eventStart: [
        'Acara dah mula! Jom sertai sebelum habis.',
        'Acara dah aktif. Masa terhad, cepat gerak.'
    ],
    eventEnd: [
        'Acara dah habis. Terima kasih semua, kita main lagi nanti.',
        'Acara dah tamat. Rehat dulu, nanti ada lagi.'
    ]
};

/** Pilih satu ayat rawak untuk kategori. Gantikan {nama} dan {group}. */
export function line(kategori, vars = {}) {
    const pool = LINES[kategori];
    if (!pool?.length) return '';
    const t = pool[Math.floor(Math.random() * pool.length)];
    return t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export { LINES as _lines };
