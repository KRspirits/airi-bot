import { textCardPages } from './cards.js';

// =========================================================================
// 🖼️ LAPISAN GAMBAR UNTUK TEKS PANJANG.
// Setiap mesej teks panjang dari mana-mana command ditukar jadi gambar (latar Airi).
// Kekal teks kalau: ada mention (@), ada pautan, mesej bukan teks biasa, atau ke status.
// Baris pertama jadi caption supaya tajuk tetap nampak.
// =========================================================================

export function shouldImage(jid, content = {}) {
    if (typeof content.text !== 'string') return false;
    if (content.image || content.video || content.audio || content.document || content.sticker || content.poll || content.react || content.delete || content.edit) return false;
    if (Array.isArray(content.mentions) && content.mentions.length) return false;
    if (/https?:\/\/|wa\.me|chat\.whatsapp\.com/i.test(content.text)) return false;
    if (String(jid).endsWith('@broadcast')) return false;
    const panjang = content.text.length > 280 || content.text.split('\n').length > 8;
    return panjang;
}

export function patchSend(sock) {
    const asal = sock.sendMessage.bind(sock);
    sock.sendMessage = async (jid, content = {}, opts) => {
        try {
            if (shouldImage(jid, content)) {
                const pages = textCardPages(content.text);
                const tajuk = content.text.split('\n').find(x => x.trim())?.trim().slice(0, 200) || '';
                let hasil = null;
                for (let i = 0; i < pages.length; i++) {
                    const r = await asal(jid, { image: pages[i], caption: i === 0 ? tajuk : undefined }, i === 0 ? opts : undefined);
                    if (i === 0) hasil = r;
                }
                return hasil;
            }
        } catch (e) {
            console.error('[TEKS->GAMBAR]', e.message);
        }
        return asal(jid, content, opts);
    };
    return sock;
}
