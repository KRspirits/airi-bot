import { pengirimAktif } from './activity.js';

// =========================================================================
// 👥 PEMAIN DALAM GROUP SAHAJA. Dalam group, hanya ahli group itu yang keluar
// dalam papan, berita, wanted, dan standing. Ahli dari group lain tak akan bocor.
// Chat peribadi (DM) tak ada group, jadi senarai penuh dikekalkan (untuk owner).
// =========================================================================

export async function pemainGroup(sock, jid, users) {
    if (!jid || !String(jid).endsWith('@g.us')) return []; // DM: tiada senarai global
    const meta = sock ? await sock.groupMetadata(jid).catch(() => null) : null;
    // kalau metadata tak dapat, guna pengirim yang aktif dalam group itu
    const ids = meta?.participants ? new Set(meta.participants.map(p => p.id)) : new Set(pengirimAktif(jid, 200));
    return users.filter(u => ids.has(u.id));
}
