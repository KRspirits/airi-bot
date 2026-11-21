import { rm } from './util.js';

// Kesan acara Veto sebenar. Dahulu 20 acara hanya paparan teks; kini dikuatkuasakan
// dengan membandingkan baki pemain SEBELUM dan SELEPAS command dijalankan.
export const RULES = {
    AMAR_BLESSING:      { gain: { all: true, mult: 100 } },
    TANAMAN_BOOM:       { gain: { cmds: ['tuai', 'harvest'], mult: 2 } },
    GOLD_RUSH:          { gain: { cmds: ['jual_emas', 'jual_ikan', 'jual_akuarium', 'jual_besi'], mult: 3 } },
    CRYPTO_MOON:        { gain: { cmds: ['jual_btc'], mult: 2.5 } },
    CYBER_REBATE:       { refund: { cmds: ['beli_kenderaan', 'beli_phone', 'beli_pancing', 'beli_rumah', 'beli_pet', 'beli_plat', 'beli_makanan', 'bengkel', 'pasang', 'beli_bm'], pct: 0.5 } },
    SPEED_DEMON:        { gain: { cmds: ['lumba', 'race', 'drag'], mult: 4 } },
    OVERTIME_FRENZY:    { gain: { cmds: ['kerja', 'work'], mult: 2 } },
    LANDLORD_BOOM:      { gain: { cmds: ['kutip_sewa'], mult: 3 } },
    BOUNTY_HUNTER_RUSH: { gain: { cmds: ['buru'], mult: 1.5 } },
    HACKER_PARADISE:    { gain: { cmds: ['hackbank'], mult: 2 } },
    ZERO_JAIL_DAY:      { nojail: true },
    ROYAL_AIRDROP:      { airdrop: 10000 },
    FESTIVAL_IKAN:      { gain: { cmds: ['jual_ikan', 'jual_akuarium'], mult: 2 } },
    HARI_JUDI_GILA:     { gain: { cmds: ['tekaan', 'roda', 'kad_besar', 'dadu7', 'peti', 'kupon'], mult: 1.5 } },
    TEKA_BERHADIAH:     { gain: { cmds: ['setuju'], mult: 2 } },
    BAYAR_BALIK_HUTANG: { refund: { cmds: ['bayar_ahlong'], pct: 0.3 } },
    MEGA_HARVEST:       { fishBoost: true },
    MYTHIC_TIDE:        { mythic: true },
    DAILY_FIESTA:       { gain: { cmds: ['daily', 'harian', 'tuntut'], mult: 3 } },
    CASINO_FIESTA:      { gain: { cmds: ['slot', 'judi', 'spin'], mult: 2 } },
    GOD_OF_FORTUNE:     { gain: { cmds: ['slot', 'coinflip', 'bgk', 'tikam_nombor', 'lumba_kuda', 'teka_nombor', 'ekor'], mult: 2 } },
    TREASURE_SURGE:     { gain: { cmds: ['buka_peti', 'jual_besi'], mult: 2.5 } },
    SUBSIDI_MINYAK:     { gain: { cmds: ['seludup', 'seludup_senjata'], mult: 2 } },
    BLACK_MARKET_CARNIVAL: { refund: { cmds: ['beli_bm'], pct: 0.5 } },
    PESTA_NELAYAN:      { gain: { cmds: ['jual_ikan', 'jual_akuarium'], mult: 2 }, fishBoost: true },
    TUAIAN_BERLIMPAH:   { gain: { cmds: ['tuai', 'harvest'], mult: 2 } },
    RUSH_RIDER:         { gain: { cmds: ['grab', 'foodpanda', 'terima', 'kurier'], mult: 1.5 } },
    KOPI_RAYA:          { gain: { cmds: ['kerja', 'work'], mult: 1.5 } },
    MALAM_GANGSTER:     { gain: { cmds: ['curi_kereta', 'scam', 'peras_ugut', 'rompak_kedai'], mult: 1.5 } },
    PASAR_KAMPUNG:      { gain: { cmds: ['jual_emas', 'jual_btc'], mult: 1.5 } },
    TAHUN_BARU_2027:    { gain: { cmds: ['daily', 'harian', 'tuntut'], mult: 2 } },
    AIRDROP_DIRAJA:     { airdrop: 10000 }
};
export const supported = code => !!RULES[code];

export const CRIME_PLUGINS = new Set(['jenayah', 'jenayah_v2', 'jenayah_pack', 'underworld_pack', 'curi_kereta', 'komuniti_santau']);
export const CRIME_CMDS = new Set(['rompak', 'hackbank', 'santau', 'curi_kereta', 'ketuk_chassis', 'curi', 'jenayah', 'scam', 'peras_ugut', 'seludup', 'jual_maklumat', 'seludup_senjata', 'godam_kripto', 'rompak_bank', 'rompak_kasino', 'rompak_jongkong']);

export function snapshot(user) {
    return { wallet: user.wallet || 0, bank: user.bank || 0, jailed: !!(user.jail?.status && Date.now() < (user.jail.release_at || 0)) };
}

// Kerugian acara auto: cukai atas hasil command tertentu (dikuatkuasakan, bukan sekadar teks).
export const TAX = {
    GOLD_RUSH: { cmds: ['jual_emas', 'jual_ikan', 'jual_akuarium', 'jual_besi'], pct: 0.15 },
    FESTIVAL_IKAN: { cmds: ['jual_ikan', 'jual_akuarium'], pct: 0.10 },
    HARI_JUDI_GILA: { cmds: ['tekaan', 'roda', 'kad_besar', 'dadu7', 'peti', 'kupon'], pct: 0.20 },
    OVERTIME_FRENZY: { cmds: ['kerja', 'work'], pct: 0.10 },
    SPEED_DEMON: { cmds: ['lumba', 'race', 'drag'], pct: 0.20 },
    CASINO_FIESTA: { cmds: ['slot', 'judi', 'spin'], pct: 0.25 },
    LANDLORD_BOOM: { cmds: ['kutip_sewa'], pct: 0.15 },
    ZERO_JAIL_DAY: { cmds: ['rompak', 'rob', 'hackbank', 'santau', 'curi_kereta', 'jenayah', 'scam', 'peras_ugut', 'seludup'], pct: 0.30 },
    TEKA_BERHADIAH: { cmds: ['setuju'], pct: 0.20 },
    TANAMAN_BOOM: { cmds: ['tuai', 'harvest'], pct: 0.10 },
    PESTA_NELAYAN: { cmds: ['jual_ikan', 'jual_akuarium'], pct: 0.10 },
    TUAIAN_BERLIMPAH: { cmds: ['tuai', 'harvest'], pct: 0.10 },
    RUSH_RIDER: { cmds: ['grab', 'foodpanda', 'terima', 'kurier'], pct: 0.10 },
    KOPI_RAYA: { cmds: ['kerja', 'work'], pct: 0.10 },
    MALAM_GANGSTER: { cmds: ['curi_kereta', 'scam', 'peras_ugut', 'rompak_kedai'], pct: 0.20 },
    PASAR_KAMPUNG: { cmds: ['jual_emas', 'jual_btc'], pct: 0.10 },
};

export function applyEffects({ cmd, isCrime, user, before, event, purge }) {
    const out = [], after = snapshot(user), rule = event && RULES[event.code];
    const dW = after.wallet - before.wallet, dNet = (after.wallet + after.bank) - (before.wallet + before.bank);

    if (rule?.gain) {
        const g = rule.gain, base = g.all ? dNet : dW;
        if ((g.all || g.cmds.includes(cmd)) && base > 0) {
            const bonus = Math.round(base * (g.mult - 1));
            if (bonus > 0) { user.wallet += bonus; out.push(`✨ ${event.name}: bonus +${rm(bonus)}`); }
        }
    }
    if (rule?.airdrop && Date.now() - (user.airdropAt || 0) > 10 * 60e3) {
        user.airdropAt = Date.now(); user.wallet += rule.airdrop; out.push(`🎁 ${event.name}: airdrop +${rm(rule.airdrop)}`);
    }
    if (rule?.refund?.cmds.includes(cmd)) {
        const spent = before.wallet - after.wallet;
        if (spent > 0) { const back = Math.round(spent * rule.refund.pct); user.wallet += back; out.push(`🏷️ ${event.name}: rebat +${rm(back)}`); }
    }
    if (purge && isCrime && dW > 0) {
        const extra = Math.round(dW * 0.5); user.wallet += extra; out.push(`🔥 Hari Pembersihan: ganjaran jenayah +50% (+${rm(extra)})`);
    }
    const cukai = event && TAX[event.code];
    if (cukai?.cmds.includes(cmd) && dW > 0) {
        const potong = Math.round(dW * cukai.pct);
        user.wallet -= potong; out.push(`🧾 ${event.name}: cukai -${rm(potong)}`);
    }
    let jailedNow = !before.jailed && after.jailed;
    if (jailedNow && (rule?.nojail || purge)) {
        user.jail.status = false; user.jail.release_at = 0; jailedNow = false;
        out.push(purge ? '🔥 Hari Pembersihan: polis cuti, awak terlepas lokap!' : '🕊️ Hari Pengampunan: polis bercuti, awak terlepas!');
    }
    return { messages: out, jailedNow, delta: dW };
}
