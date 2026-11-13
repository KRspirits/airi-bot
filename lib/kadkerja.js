import { createHash } from 'crypto';
import { panelCard } from './cards.js';

// =========================================================================
// 🪪 KAD PEKERJA (ID STAF). Setiap kerja ada kad sendiri dengan nombor staf unik.
// Kad keluar bila mohon atau mula kerja buat kali pertama. Dilukis dalam bot.
// =========================================================================

/** Nombor staf unik untuk pemain dan kerja (tetap, bukan rawak setiap kali). */
export function noStaf(userId, kerjaId) {
    const h = createHash('sha256').update(`${userId}|${kerjaId}`).digest('hex');
    const angka = parseInt(h.slice(0, 8), 16).toString().padStart(10, '0').slice(0, 10);
    return `STF-${angka.slice(0, 4)}-${angka.slice(4, 8)}-${angka.slice(8, 10)}`;
}

export async function kadPekerja({ nama, jawatan, userId, kerjaId, tahap = 1, tarikh = new Date() }) {
    const tarikhTxt = tarikh.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
    return panelCard({
        kicker: 'KAD PEKERJA · AIRI\'S CORNER',
        title: String(nama || 'Staf').slice(0, 24),
        lines: [
            `Jawatan: ${jawatan}`,
            `No. Staf: ${noStaf(userId, kerjaId)}`,
            `Tarikh mula: ${tarikhTxt}`,
            `Tahap: ${tahap}`,
        ],
        accent: '#38bdf8',
        big: noStaf(userId, kerjaId).slice(4),
        bigLabel: 'NOMBOR STAF',
        footerText: 'Pakai kad ni setiap kali bertugas',
    });
}
