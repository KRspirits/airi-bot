import { db } from './database.js';
import { pengirimAktif } from './activity.js';
import { beriXp } from './xp.js';

// =========================================================================
// 👹 BOS DALAM GROUP. Bos muncul secara rawak. Ahli group guna `.serang` untuk
// melawan. Kalau bos tak mati dalam 15 minit, dia curi peratusan duit BANK
// seorang ahli group yang aktif. Hadiah dibahagi ikut jumlah serangan.
// =========================================================================

export const BOSSES = [
    // HP makin tinggi = curi makin besar dan hadiah makin besar
    { id: 'pengedar', nama: 'Pengedar Kripto 🪙', hp: 150, curi: 0.30, ganjaran: 600000, ket: 'Dia jual token palsu dekat semua orang.' },
    { id: 'along', nama: 'Along Kejam 🦈', hp: 250, curi: 0.35, ganjaran: 900000, ket: 'Pinjam duit, bunga tinggi, ugut lepas tu.' },
    { id: 'hacker', nama: 'Hacker Bawah Tanah 💻', hp: 400, curi: 0.60, ganjaran: 1500000, ket: 'Dia godam bank dan rembat duit sesiapa yang lengah.' },
    { id: 'polis', nama: 'Pegawai Rasuah 🕴️', hp: 500, curi: 0.40, ganjaran: 2000000, ket: 'Duit lebih, undang-undang kurang.' },
    { id: 'mafia', nama: 'Bos Mafia 🎩', hp: 700, curi: 0.45, ganjaran: 3000000, ket: 'Empayar dia dibina atas duit orang lain.' },
    { id: 'lanun', nama: 'Kapten Lanun 🏴‍☠️', hp: 900, curi: 0.50, ganjaran: 4500000, ket: 'Rampas kapal, rampas harta, rampas bank.' },
    { id: 'sindiket', nama: 'Sindiket Kad Kredit 💳', hp: 1200, curi: 0.55, ganjaran: 6000000, ket: 'Rangkaian besar. Susah dihentikan.' },
    { id: 'naga', nama: 'Naga Siber 🐉', hp: 2000, curi: 0.60, ganjaran: 10000000, ket: 'Bos paling kuat. Hanya group bersatu boleh menang.' },
];

const SPAWN_SELANG = 90 * 60e3;   // sekurang-kurangnya 90 minit antara bos dalam satu group
const TAMAT_SELEPAS = 15 * 60e3;  // masa melawan
const CD_SERANG = 20e3;           // cooldown setiap pemain

const AKTIF = new Map();          // jid -> keadaan bos
const LAST_SPAWN = new Map();     // jid -> masa bos terakhir
const CD = new Map();             // senderId -> masa serangan terakhir

export function bossSemasa(jid) {
    return AKTIF.get(jid) || null;
}

function spawnBoss(jid) {
    const b = BOSSES[Math.floor(Math.random() * BOSSES.length)];
    const kini = Date.now();
    AKTIF.set(jid, { ...b, hpSemasa: b.hp, dmg: {}, mula: kini, tamat: kini + TAMAT_SELEPAS, ingat: {} });
    LAST_SPAWN.set(jid, kini);
    return AKTIF.get(jid);
}

/** Serang bos. Pulang { mesej, mentions }. */
export async function serang(jid, senderId, user) {
    const bos = AKTIF.get(jid);
    if (!bos) return { mesej: '😴 Tiada bos di group ni sekarang. Tunggu, bos akan muncul.' };
    if (Date.now() - (CD.get(senderId) || 0) < CD_SERANG) {
        return { mesej: '⏳ Tunggu sekejap sebelum serang lagi.' };
    }
    CD.set(senderId, Date.now());
    // dmg bergantung pada level dan rawak; level tinggi sikit lebih kuat
    const lv = Math.max(1, Math.floor(Math.sqrt((user.xp || 0) / 50)) + 1);
    const dmg = Math.round(4 + Math.random() * 8 + lv * 0.5);
    bos.dmg[senderId] = (bos.dmg[senderId] || 0) + dmg;
    bos.hpSemasa = Math.max(0, bos.hpSemasa - dmg);
    beriXp(user, 3, 'bos');
    await db.saveUser(user);
    const nama = senderId.split('@')[0];
    if (bos.hpSemasa > 0) {
        return {
            mesej: `⚔️ @${nama} serang *${bos.nama}* (-${dmg} HP)\n❤️ HP bos: ${bos.hpSemasa}/${bos.hp}`,
            mentions: [senderId],
        };
    }
    // bos tumbang: bahagi hadiah ikut jumlah serangan
    AKTIF.delete(jid);
    const jumlah = Object.values(bos.dmg).reduce((a, b) => a + b, 0) || 1;
    const bahagian = [];
    for (const [id, d] of Object.entries(bos.dmg)) {
        const share = Math.round(bos.ganjaran * d / jumlah);
        if (id === senderId) { user.wallet = (user.wallet || 0) + share; await db.saveUser(user); }
        else { const u = await db.getUser(id); u.wallet = (u.wallet || 0) + share; await db.saveUser(u); }
        bahagian.push(`@${id.split('@')[0]} RM ${share.toLocaleString('en-US')}`);
    }
    return {
        mesej: `🏆 *${bos.nama} TUMBANG!*\nHadiah dibahagi ikut serangan:\n${bahagian.join('\n')}`,
        mentions: Object.keys(bos.dmg),
    };
}

/** Ahli group untuk di-tag (metadata group, atau pengirim aktif kalau metadata tak dapat). */
async function ahliGroup(sock, jid) {
    const meta = await sock.groupMetadata(jid).catch(() => null);
    return meta?.participants?.length ? meta.participants.map(p => p.id) : pengirimAktif(jid, 50);
}

function tagSemua(ids) {
    return ids.map(id => `@${id.split('@')[0]}`).join(' ');
}

/** Dipanggil setiap minit oleh scheduler untuk semua group. */
export async function bossTick(sock, groups) {
    const kini = Date.now();
    for (const jid of groups) {
        const bos = AKTIF.get(jid);
        if (!bos) {
            if (kini - (LAST_SPAWN.get(jid) || 0) < SPAWN_SELANG) continue;
            if (Math.random() > 0.02) continue; // kira-kira sekali dalam 50 minit selepas selang minimum
            const b = spawnBoss(jid);
            const ahli = await ahliGroup(sock, jid);
            await sock.sendMessage(jid, {
                text: `⚠️ *AMARAN SEMUA!* ${b.nama} muncul!\n${b.ket || ''}\n\nLawan dengan \`.serang\` dalam 15 minit.\nYang TAK lawan akan kena curi ${Math.round(b.curi * 100)}% duit bank.\n\n${tagSemua(ahli)}`,
                mentions: ahli,
            }).catch(() => {});
            continue;
        }
        const baki = bos.tamat - kini;
        // peringatan kepada semua: 10 minit dan 2 minit sebelum tamat
        for (const [minit, kunci] of [[10, 'ingat10'], [2, 'ingat2']]) {
            if (baki <= minit * 60e3 && baki > 0 && !bos.ingat[kunci]) {
                bos.ingat[kunci] = true;
                const ahli = await ahliGroup(sock, jid);
                const belum = ahli.filter(id => !bos.dmg[id]);
                await sock.sendMessage(jid, {
                    text: `⏳ *${bos.nama}* tinggal ${minit} minit lagi!\n❤️ HP: ${bos.hpSemasa}/${bos.hp}\n${belum.length ? `Belum lawan: ${tagSemua(belum)}\nTaip \`.serang\` sekarang!` : 'Semua dah lawan. Teruskan!'}`,
                    mentions: belum.length ? belum : ahli,
                }).catch(() => {});
            }
        }
        if (kini < bos.tamat) continue;
        // masa tamat dan bos masih hidup: curi bank semua ahli yang TAK lawan
        AKTIF.delete(jid);
        const ahli = await ahliGroup(sock, jid);
        const tak = ahli.filter(id => !bos.dmg[id]);
        if (!tak.length) {
            await sock.sendMessage(jid, { text: `🛡️ ${bos.nama} hilang. Semua ahli lawan, tiada siapa kena curi!` }).catch(() => {});
            continue;
        }
        const baris = [];
        for (const id of tak) {
            const u = await db.getUser(id).catch(() => null);
            if (!u) continue;
            const curi = Math.floor((u.bank || 0) * bos.curi);
            if (curi <= 0) continue;
            u.bank = Math.max(0, (u.bank || 0) - curi);
            await db.saveUser(u);
            baris.push(`@${id.split('@')[0]} -RM ${curi.toLocaleString('en-US')}`);
        }
        const teks = baris.length
            ? `💀 *${bos.nama} tak tumbang!* Dia curi ${Math.round(bos.curi * 100)}% bank dari ahli yang tak lawan:\n${baris.join('\n')}\n\nLain kali lawan dengan \`.serang\`!`
            : `💨 ${bos.nama} hilang. Ahli yang tak lawan semuanya tiada duit bank untuk dicuri.`;
        await sock.sendMessage(jid, { text: teks, mentions: tak }).catch(() => {});
    }
}
