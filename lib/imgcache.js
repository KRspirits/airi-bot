// =========================================================================
// 🗃️ CACHE GAMBAR ringkas dalam memori. Gambar yang sama (kunci sama) tak dilukis semula
// selama 10 minit. Had 40 gambar; yang paling lama dibuang dahulu.
// Jangan guna untuk gambar peribadi (profil, IC) kerana data tu berubah.
// =========================================================================

const TTL = 10 * 60 * 1000;
const MAX = 40;
const simpan = new Map(); // kunci -> { buf, t }

export function cached(kunci, buat) {
    const kini = Date.now();
    const ada = simpan.get(kunci);
    if (ada && kini - ada.t < TTL) return ada.buf;
    const buf = buat();
    simpan.set(kunci, { buf, t: kini });
    if (simpan.size > MAX) simpan.delete(simpan.keys().next().value);
    return buf;
}
