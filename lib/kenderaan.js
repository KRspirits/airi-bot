// Kenderaan sebenar. Jalan kaki (default) bukan kenderaan.
export function adaKenderaan(user) {
    const v = user?.vehicle;
    if (!v || !v.name) return false;
    return !/jalan kaki|kaki bangku/i.test(String(v.name));
}
