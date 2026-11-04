// Tarikh khas (kalendar Malaysia, MM-DD). Tarikh berubah tahun (Raya, Deepavali) belum dimasukkan.
export const TARIKH_KHAS = {
    '01-01': 'Tahun Baru 🎆',
    '08-31': 'Hari Kebangsaan 🇲🇾',
    '09-16': 'Hari Malaysia 🇲🇾',
    '10-31': 'Halloween 🎃',
    '12-25': 'Krismas 🎄',
};

// Pulang nama acara untuk tarikh ini (YYYY-MM-DD, masa Malaysia), atau null.
export function hariKhas(tarikhIso) {
    return TARIKH_KHAS[String(tarikhIso).slice(5, 10)] || null;
}
