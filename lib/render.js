// Hantar kad gambar dengan selamat: jika canvas gagal (tak dipasang, font, dll),
// jatuh balik ke teks supaya command tak pernah senyap.
export async function sendCard(sock, jid, m, fn, data, caption, extra = {}) {
    let buf = null;
    try {
        const mod = await import('./cards.js');
        buf = await mod[fn](data);
    } catch (e) { console.error(`[CARD ${fn}]`, e.message); }
    const opts = m ? { quoted: m } : undefined;
    if (buf) {
        try { return await sock.sendMessage(jid, { image: buf, caption, ...extra }, opts); }
        catch (e) { console.error('[CARD SEND]', e.message); }
    }
    return sock.sendMessage(jid, { text: caption, ...extra }, opts);
}

export async function getAvatar(sock, jid) {
    try {
        const url = await sock.profilePictureUrl(jid, 'image');
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        return Buffer.from(await res.arrayBuffer());
    } catch { return null; }
}
