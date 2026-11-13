// =========================================================================
// 🗣️ SUARA BOT. Ayat dipilih rawak supaya tak berulang macam mesin.
// Panggil pilih([...]) untuk pilih satu ayat secara rawak.
// =========================================================================

export const pilih = (senarai) => senarai[Math.floor(Math.random() * senarai.length)];

export const KERJA_SIAP = [
    'Siap! Duit dah masuk poket.',
    'Mantap, kerja beres.',
    'Settle. Rehat kejap lepas ni.',
    'Done. Poket makin tebal.',
];

export const TANAM_OK = [
    'Dah tanam. Sabar, nanti masak.',
    'Benih dah masuk tanah. Jaga elok-elok.',
    'Tanah dah disemai. Tunggu hasilnya.',
];

export const ORDER_DITERIMA = [
    'Order dah di tangan. Gerak sekarang!',
    'Dah ambil order. Bayaran masuk terus.',
    'Gas! Order ni milik awak sekarang.',
];
