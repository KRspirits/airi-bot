import { isOwner, isOwnerMsg, config } from '../config.js';
import { standings, wipeSeason } from '../lib/season.js';
import { clearSession } from '../lib/session.js';
import { line } from '../lib/airi_lines.js';
import { state, saveState, activeEvent, purgeActive } from '../lib/state.js';
import { supported } from '../lib/effects.js';
import { extractText, parseCmd, mentions, num, rm } from '../lib/util.js';
import { sendCard } from '../lib/render.js';
import { speak } from '../lib/voice.js';
import { makeBulletin } from '../lib/news.js';
import * as mythic from '../lib/mythic.js';
import { handleParticipants } from '../lib/welcome.js';
import { triggerRandomAuction } from './bida.js';

// =========================================================================
// 👑 VETO (khas pemilik bot). Pembaikan: pengesahan owner PADANAN TEPAT (dulu includes()
// boleh dipintas), acara disimpan dalam state (kekal selepas restart) dan KESAN
// DIKUATKUASAKAN oleh lib/effects.js. Kuasa baharu: .siar .mythic .purge .maintenance .bulletin_now .testwelcome
// =========================================================================
export const VETO_EVENTS = {
    AMAR_BLESSING: { name: '👑 Berkat Bos Amar', desc: '100x ganda SEMUA hasil pendapatan!' },
    GOLD_RUSH: { name: '💰 Gelombang Emas', desc: 'Jualan emas, ikan & besi terpakai 3x ganda!' },
    CRYPTO_MOON: { name: '🚀 Ledakan Bullrun BTC', desc: 'Untung jual BTC naik 2.5x!' },
    MEGA_HARVEST: { name: '🌊 Badai Laut Dalam', desc: 'Tangkapan pancing: hampir pasti Rare ke atas!' },
    CYBER_REBATE: { name: '🏷️ Rebat Tunai Madani', desc: 'Cashback 50% beli showroom, gear & pancing!' },
    BLACK_MARKET_CARNIVAL: { name: '🎪 Karnival Pasar Gelap', desc: 'Cashback 50% barang pasar gelap!' },
    SPEED_DEMON: { name: '🏁 Pelesit Malam Karak', desc: 'Hasil lumba digandakan 4x!' },
    OVERTIME_FRENZY: { name: '⚡ Kerja Lebih Masa', desc: 'Gaji kerja 2x ganda!' },
    TREASURE_SURGE: { name: '🧲 Arus Khazanah Sungai', desc: 'Hasil buka peti & jual besi 2.5x!' },
    CASINO_FIESTA: { name: '🎰 Pesta Jackpot Kasino', desc: 'Kemenangan slot digandakan 2x!' },
    LANDLORD_BOOM: { name: '🏢 Dividen Hartanah Mega', desc: 'Kutipan sewa 3x ganda!' },
    ZERO_JAIL_DAY: { name: '🕊️ Hari Pengampunan', desc: 'Polis bercuti; tiada lokap!' },
    SUBSIDI_MINYAK: { name: '🚛 Subsidi Seludup', desc: 'Hasil seludup 2x ganda!' },
    FESTIVAL_IKAN: { name: '🐟 Festival Ikan Pasar', desc: 'Jual ikan & akuarium 2x ganda!' },
    HARI_JUDI_GILA: { name: '🎲 Hari Judi Gila', desc: 'Menang permainan judi (tekaan, roda, kad_besar, dadu7, peti, kupon) 1.5x!' },
    TEKA_BERHADIAH: { name: '📸 Teka Gambar Berhadiah', desc: 'Jual barang guna gambar (.jual_gambar) 2x ganda!' },
    BAYAR_BALIK_HUTANG: { name: '💳 Diskaun Bayar Hutang', desc: 'Bayar ahlong, 30% dipulangkan!' },
    ROYAL_AIRDROP: { name: '🎁 Royal Airdrop Amar', desc: 'Sesiapa yang guna command dapat RM 10,000 setiap 10 minit!' },
    BOUNTY_HUNTER_RUSH: { name: '🎯 Pesta Pemburu Kepala', desc: 'Ganjaran buru +50%!' },
    HACKER_PARADISE: { name: '💻 Kelemahan Induk Bank', desc: 'Hasil hackbank 2x ganda!' },
    GOD_OF_FORTUNE: { name: '🌟 Restu Dewa Rezeki', desc: 'Kemenangan game nasib 2x ganda!' },
    MYTHIC_TIDE: { name: '🌀 Pasang Mitos', desc: 'Makhluk mitos muncul lebih kerap & peluang mitos pancing naik!' },
    DAILY_FIESTA: { name: '🎉 Pesta Hadiah Harian', desc: 'Hadiah .daily 3x ganda!' },
    EGG_HATCH_SPEED: { name: '🐣 Inkubator Kilat', desc: '(belum aktif)' },
    AHLONG_DISCOUNT: { name: '🦈 Pelupusan Faedah', desc: '(belum aktif)' }
};
export const activeGlobalEvent = null; // dikekalkan untuk keserasian import lama; guna state.event

const MENU = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
   🛡️  PANGKALAN VETO  ·  BOS AMAR
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

━━ ACARA ━━
   .list_event   ·   .start_event [KOD] [HARI]   ·   .stop_event   ·   .musim
━━ KUASA ━━
   .siar [teks]   ·   .mythic   ·   .purge on/off   ·   .maintenance on/off
   .bulletin_now   ·   .testwelcome
━━ PEMAIN ━━
   .set_income [n]   ·   .give_cash @u [n]   ·   .give_gold @u [n]   ·   .give_btc @u [n]
   .jail_user @u [saat]   ·   .free_user @u   ·   .syscheck
━━ LELONG ━━
   .bida_now   (buka lelongan kontena sekarang)
━━ SESI ━━
   .reset_session   (kosong sesi WhatsApp, bot restart, scan QR baru)
━━ MUSIM ━━
   .reset_season   (preview reset penuh)
   .reset_season ya   (sahkan reset penuh, tak boleh batal)
━━ ACARA BAHARU ━━
   FESTIVAL_IKAN   ·   HARI_JUDI_GILA   ·   TEKA_BERHADIAH   ·   BAYAR_BALIK_HUTANG
   Taip .list_event untuk senarai penuh.`;

export default {
    name: 'veto_amar', priority: 10,
    alias: ['veto', 'reset_season', 'reset_session', 'list_event', 'start_event', 'stop_event', 'musim', 'set_income', 'give_cash', 'give_gold', 'give_btc',
        'jail_user', 'free_user', 'syscheck', 'siar', 'mythic', 'purge', 'maintenance', 'bulletin_now', 'testwelcome', 'spawn_boss'],
    execute: async ({ sock, m, user, db }) => {
        const jid = m.key.remoteJid, sender = m.key.participant || jid;
        const p = parseCmd(extractText(m.message)); if (!p) return;
        const { cmd, args } = p, target = mentions(m)[0];
        const reply = (text, extra = {}) => sock.sendMessage(jid, { text, ...extra }, { quoted: m });

        if (cmd === 'musim') {
            const ev = activeEvent();
            if (!ev) return reply('🌐 *STATUS MUSIM:* Tiada acara global aktif sekarang.' + (purgeActive() ? '\n🔥 Hari Pembersihan sedang berlangsung!' : ''));
            const left = Math.max(1, Math.ceil((ev.expiresAt - Date.now()) / 3600e3));
            return reply(`🌐 *ACARA AKTIF*\n🔥 ${ev.name}\n📜 ${ev.desc}\n⏳ Baki: ${left} jam`);
        }
        if (!isOwnerMsg(m)) {
            if (cmd === 'veto') {
                // Tunjuk pengenal akaun ni supaya owner boleh salin ke OWNER_NUMBERS (hanya untuk pemanggil sendiri)
                const k = m.key || {};
                const ids = [k.participant, k.participantAlt, k.remoteJidAlt].filter(Boolean)
                    .map(x => String(x).replace(/@.*$/, '').replace(/:.*$/, '').replace(/\D/g, '')).filter(Boolean);
                console.log('[VETO DENIED] pengenal:', ids.join(',') || '-');
                return reply(`⛔ *AKSES DITOLAK!* Menu Veto hanya untuk Bos Amar!\n\nPengenal akaun ni: ${ids.join(' / ') || 'tak dikesan'}\nKalau ni akaun owner, tambah nombor ni ke OWNER_NUMBERS di Render (pisah dengan koma), kemudian redeploy.`);
            }
            return;
        }

        switch (cmd) {
            case 'veto': return reply(MENU);
            case 'list_event': return reply('📜 *ACARA VETO*\n\n' + Object.entries(VETO_EVENTS).map(([k, v]) => `• *${k}*${supported(k) ? '' : ' (belum aktif)'}\n   ${v.name}: ${v.desc}`).join('\n') + '\n\nContoh: `.start_event AMAR_BLESSING 2`');
            case 'start_event': {
                const kod = (args[0] || '').toUpperCase(), days = Math.min(30, Math.max(1, parseInt(args[1]) || 1));
                if (!VETO_EVENTS[kod]) return reply('❌ Kod tak sah. Taip `.list_event`.');
                if (!supported(kod)) return reply(`⚠️ ${kod} belum ada kesan sebenar dalam enjin. Pilih acara lain.`);
                state.event = { ...VETO_EVENTS[kod], code: kod, expiresAt: Date.now() + days * 864e5, days }; saveState();
                const ev = state.event;
                if (config.voice) for (const g of new Set([jid, ...state.groups])) speak(sock, g, 'eventStart').catch(() => {});
                for (const g of new Set([jid, ...state.groups])) {
                    const fmt = t => new Date(t).toLocaleString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                    await sendCard(sock, g, null, 'panelCard', {
                        kicker: 'ACARA GLOBAL',
                        title: ev.name.replace(/[\p{Extended_Pictographic}\u200d\ufe0f]/gu, '').trim(),
                        accent: '#fbbf24',
                        big: `${days} HARI`,
                        bigLabel: 'TEMPOH',
                        lines: [`Kesan: ${ev.desc}`, `Mula: ${fmt(ev.expiresAt - days * 864e5)}`, `Tamat: ${fmt(ev.expiresAt)}`],
                        footerText: 'Titah Bos Amar. Jangan lepaskan peluang!'
                    }).catch(() => {});
                }
                return;
            }
            case 'stop_event': {
                state.event = null; saveState();
                if (config.voice) for (const g of new Set([jid, ...state.groups])) speak(sock, g, 'eventEnd').catch(() => {});
                return reply('👑 Semua acara veto ditutup.');
            }
            case 'set_income': { const n = parseInt(args[0]); if (isNaN(n) || n < 0) return reply('❌ Amaun tak sah.'); user.wallet = n; await db.saveUser(user); return reply(`👑 Dana tunai ditetapkan ${rm(n)}.`); }
            case 'give_cash': case 'give_gold': case 'give_btc': {
                const n = Number(args.find(a => /^-?\d+(\.\d+)?$/.test(a))); if (!target || isNaN(n)) return reply(`❌ Format: \`.${cmd} @user [nilai]\``);
                const t = await db.getUser(target); t.crypto ||= { btc: 0, gold: 0 };
                if (cmd === 'give_cash') t.wallet = (t.wallet || 0) + n; else t.crypto[cmd === 'give_gold' ? 'gold' : 'btc'] = (t.crypto[cmd === 'give_gold' ? 'gold' : 'btc'] || 0) + n;
                await db.saveUser(t); return reply(`👑 Suntikan ${cmd.replace('give_', '')} ${n.toLocaleString('en-US')} ke @${num(target)}`, { mentions: [target] });
            }
            case 'jail_user': {
                if (!target) return reply('❌ Tag sasaran.'); const sec = parseInt(args.find(a => /^\d+$/.test(a))) || 120, t = await db.getUser(target);
                t.jail = { status: true, release_at: Date.now() + sec * 1000, reason: 'Titah Bos Amar', vote_free: 0, vote_jail: 0, voters: [] }; await db.saveUser(t);
                return reply(`🚨 @${num(target)} disumbat ke lokap (${sec} saat)!`, { mentions: [target] });
            }
            case 'free_user': {
                if (!target) return reply('❌ Tag sasaran.'); const t = await db.getUser(target); t.jail = { ...(t.jail || {}), status: false, release_at: 0 }; await db.saveUser(t);
                return reply(`🕊️ @${num(target)} dibebaskan!`, { mentions: [target] });
            }
            case 'syscheck': { const mem = process.memoryUsage(); return reply(`⚙️ *DIAGNOSTIK*\nRAM: ${(mem.rss / 1048576).toFixed(0)} MB (heap ${(mem.heapUsed / 1048576).toFixed(0)} MB)\nUptime: ${Math.round(process.uptime() / 60)} minit\nGrup direkod: ${state.groups.length}\nDatabase: ${db.isMongo() ? 'MongoDB' : 'Fail tempatan (data hilang bila restart!)'}\nMaintenance: ${state.maintenance ? 'ON' : 'off'}`); }
            case 'siar': {
                const t = args.join(' ').trim(); if (!t) return reply('Guna: `.siar [mesej]`');
                for (const g of state.groups) await sock.sendMessage(g, { text: `📢 *PENGUMUMAN DARIPADA BOS AMAR*\n\n${t}` }).catch(() => {});
                return reply(`✅ Disiarkan ke ${state.groups.length} grup.`);
            }
            case 'reset_session': {
                await clearSession(db.isMongo());
                setTimeout(() => process.exit(0), 3000); // Render restart; QR baru dijana
                return reply('🔑 Sesi dikosongkan. Bot restart dalam 3 saat. Buka link QR di Render dan scan semula.');
            }
            case 'reset_season': {
                const sahkan = (p?.args?.[0] || '').toLowerCase() === 'ya';
                const semua = await db.getAllUsers();
                if (!sahkan) {
                    const st = (await standings(semua)).filter(w => w.gain > 0).slice(0, 3);
                    const senarai = st.length ? st.map((w, i) => `${['🥇', '🥈', '🥉'][i]} ${w.name} (+RM ${w.gain.toLocaleString('en-US')})`).join('\n') : 'Tiada pemenang lagi.';
                    return reply(`⚠️ *RESET SEASON - PREVIEW*\n\nAkan dipadam untuk ${semua.length} pemain:\n• duit poket dan bank\n• inventori, kenderaan, rumah\n• koleksi ikan dan album\n• progres misi dan pencapaian\n\nPemenang top 3 dapat badge kekal:\n${senarai}\n\nTaip \`.reset_season ya\` untuk sahkan. Tindakan ni tak boleh dibatalkan.`);
                }
                const res = await wipeSeason(db);
                const baris = res.winners.length
                    ? res.winners.map((w, i) => `${['🥇', '🥈', '🥉'][i]} ${w.name} (+RM ${w.gain.toLocaleString('en-US')})`)
                    : ['Tiada pemenang musim ni.'];
                for (const g of new Set([jid, ...state.groups])) {
                    sendCard(sock, g, null, 'panelCard', { kicker: 'MUSIM BARU', title: `MUSIM ${res.musim} BERMULA`, accent: '#fbbf24', big: 'RESET', bigLabel: 'SEMUA MULA DARI AWAL', lines: baris, footerText: 'Badge pemenang kekal. Sejarah: .sejarah_musim' }).catch(() => {});
                }
                return reply(`✅ Musim ${res.musim} bermula. ${res.users} pemain direset. Pemenang dapat badge kekal.`);
            }
            case 'bida_now': await triggerRandomAuction(sock, jid); return;
            case 'mythic': return (await mythic.trigger(sock, jid)) ? undefined : reply('Makhluk mitos masih aktif di sini.');
            case 'spawn_boss': return reply('Gunakan `.serang_boss` untuk bos dunia (pemunculan automatik oleh enjin lama).');
            case 'purge': {
                const on = (args[0] || '').toLowerCase() === 'on';
                state.purgeUntil = on ? Date.now() + 3600e3 : 0; state.purgeEndPending = on; saveState();
                return reply(on ? '🔥 Hari Pembersihan dimulakan sejam!' : '🕊️ Hari Pembersihan dihentikan.');
            }
            case 'maintenance': { state.maintenance = (args[0] || '').toLowerCase() === 'on'; saveState(); return reply(`🛠️ Mod penyelenggaraan: ${state.maintenance ? 'ON (hanya owner)' : 'OFF'}`); }
            case 'bulletin_now': { const d = await makeBulletin(db, jid.endsWith('@g.us') ? jid : undefined); return sendCard(sock, jid, m, 'newsCard', d, `📰 ${d.headline}`); }
            case 'testwelcome': {
                if (!jid.endsWith('@g.us')) return reply('Guna dalam group.');
                await handleParticipants(sock, { id: jid, participants: [sender], action: 'add' }); void speak; return;
            }
        }
    }
};
