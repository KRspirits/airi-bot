import * as store from './store.js';
import { papanSemasa } from './leaderboard.js';
import { isActive } from './activity.js';
import { musimSemasa } from './musimkerja.js';
import { state } from './state.js';

// Ringkasan group sekali sehari (jam 9 malam, waktu Malaysia): papan teratas, acara dan musim semasa.
export async function ringkasanTick(sock, groups) {
    const jamMY = new Date(Date.now() + 8 * 3600e3);
    if (jamMY.getUTCHours() !== 21) return;
    const hari = jamMY.toISOString().slice(0, 10);
    if (await store.get('ringkasan', 'last', '') === hari) return;
    await store.set('ringkasan', 'last', hari);

    const papan = await papanSemasa();
    const teratas = (arr) => arr.length ? arr.map((x, i) => `${['🥇', '🥈', '🥉'][i]} ${x.nama}`).join('\n') : 'Belum ada';
    const acara = state.event || null;
    const musim = musimSemasa();
    const baris = [
        `🌙 *Ringkasan hari ni*`,
        '',
        `🎣 Tangkapan:\n${teratas(papan.tangkapan)}`,
        `💰 Kekayaan:\n${teratas(papan.kekayaan)}`,
        acara ? `🎲 Acara: ${acara.name}` : '🎲 Tiada acara sekarang',
        musim ? `🌦️ Musim: ${musim.nama} (tinggal ${Math.max(0, Math.ceil((musim.tamat - Date.now()) / 60e3))} minit)` : '',
        '',
        'Esok ada lagi. Taip `.menu` kalau tak tahu nak buat apa.',
    ].filter(Boolean);
    for (const g of groups.filter(g => isActive(g, 2))) await sock.sendMessage(g, { text: baris.join('\n') }).catch(() => {});
}
