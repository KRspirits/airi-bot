// =========================================================================
// 🗺️ DAERAH / JAJAHAN. Koordinat anggaran setiap bandar dan daerah utama.
// Malaysia sahaja (RM).
// =========================================================================

export const DAERAH = {
    MY: {
        'Kota Bharu': [6.13, 102.24], 'Pasir Mas': [6.04, 102.14], 'Tumpat': [6.20, 102.17], 'Bachok': [6.00, 102.43],
        'Pasir Puteh': [5.83, 102.40], 'Tanah Merah': [5.80, 102.15], 'Machang': [5.77, 102.22], 'Kuala Krai': [5.53, 102.20],
        'Jeli': [5.69, 101.84], 'Gua Musang': [4.89, 101.97], 'Kuala Terengganu': [5.33, 103.14], 'Kuantan': [3.82, 103.33],
        'Alor Setar': [6.12, 100.37], 'Kangar': [6.44, 100.20], 'George Town': [5.41, 100.33], 'Taiping': [4.85, 100.74],
        'Ipoh': [4.60, 101.09], 'Kuala Lumpur': [3.14, 101.69], 'Petaling Jaya': [3.10, 101.61], 'Shah Alam': [3.07, 101.52],
        'Klang': [3.04, 101.45], 'Seremban': [2.73, 101.94], 'Melaka': [2.19, 102.25], 'Muar': [2.04, 102.57],
        'Batu Pahat': [1.85, 102.93], 'Johor Bahru': [1.49, 103.74], 'Kuching': [1.55, 110.33], 'Sibu': [2.30, 111.82],
        'Miri': [4.39, 113.99], 'Kota Kinabalu': [5.98, 116.07], 'Sandakan': [5.84, 118.12], 'Tawau': [4.24, 117.89],
    },
};

const R = 6371, d2r = Math.PI / 180;

/** Jarak lurus antara dua daerah dalam negara yang sama (km). */
export function jarakDaerah(negara, a, b) {
    const [la1, lo1] = DAERAH[negara][a], [la2, lo2] = DAERAH[negara][b];
    const dLa = (la2 - la1) * d2r, dLo = (lo2 - lo1) * d2r;
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(la1 * d2r) * Math.cos(la2 * d2r) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

/** Pilih dua daerah berbeza dalam negara yang sama. */
export function pickPasangan(negara) {
    const senarai = Object.keys(DAERAH[negara]);
    const dari = senarai[Math.floor(Math.random() * senarai.length)];
    let ke = senarai[Math.floor(Math.random() * senarai.length)];
    while (ke === dari) ke = senarai[Math.floor(Math.random() * senarai.length)];
    return { dari, ke };
}
