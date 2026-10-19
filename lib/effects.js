import { rm } from './util.js';

// Kesan acara Veto sebenar. Dahulu 20 acara hanya paparan teks; kini dikuatkuasakan
// dengan membandingkan baki pemain SEBELUM dan SELEPAS command dijalankan.
export const RULES = {
    AMAR_BLESSING:      { gain: { all: true, mult: 100 } },
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
    BLACK_MARKET_CARNIVAL: { refund: { cmds: ['beli_bm'], pct: 0.5 } }
};
export const supported = code => !!RULES[code];

export const CRIME_PLUGINS = new Set(['jenayah', 'jenayah_pack', 'underworld_pack', 'curi_kereta', 'komuniti_santau']);
export const CRIME_CMDS = new Set(['rompak', 'hackbank', 'santau', 'curi_kereta', 'ketuk_chassis', 'curi', 'jenayah', 'scam', 'peras_ugut', 'seludup', 'jual_maklumat', 'seludup_senjata', 'godam_kripto', 'rompak_bank', 'rompak_kasino', 'rompak_jongkong']);

export function snapshot(user) {
    return { wallet: user.wallet || 0, bank: user.bank || 0, jailed: !!(user.jail?.status && Date.now() < (user.jail.release_at || 0)) };
}

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
    let jailedNow = !before.jailed && after.jailed;
    if (jailedNow && (rule?.nojail || purge)) {
        user.jail.status = false; user.jail.release_at = 0; jailedNow = false;
        out.push(purge ? '🔥 Hari Pembersihan: polis cuti, kau terlepas lokap!' : '🕊️ Hari Pengampunan: polis bercuti, kau terlepas!');
    }
    return { messages: out, jailedNow, delta: dW };
}
