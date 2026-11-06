// =========================================================================
// 🔤 NAMA MUDAH. Command bahasa senang (campur English) ditukar ke command sedia ada.
// Command lama tetap berfungsi. Pemetaan ini dibaca sebelum dispatch.
// =========================================================================

export const MUDAH = {
    fish: 'mancing',         // memancing
    net: 'jala',             // jala pukal
    sell_fish: 'jual_ikan',
    fishshop: 'kedai_pancing',
    market: 'pasaran',       // carta pasaran
    buy_btc: 'beli_btc',
    sell_btc: 'jual_btc',
    buy_gold: 'beli_emas',
    sell_gold: 'jual_emas',
    crime: 'jenayah',        // senarai jenayah
    buy_bm: 'beli_gelap',    // beli dari blackmarket
    lawyer: 'peguam',
    bribe: 'rasuah',
    jail: 'lokap',
    scratch: 'kupon',
    wheel: 'roda',
    guess: 'tekaan',
    duel: 'tarung',
    items: 'item',
    sell_item: 'jual_item',
    bid: 'bida',
    buy_car: 'beli_kenderaan',
    post: 'upload',
    accept: 'terima',
    idcard: 'myid',
    badges: 'achievement',
    board: 'papan_minggu',
    dice: 'dadu',
    coin: 'koin',
    bigsmall: 'kad_besar',
};

export function resolveAlias(cmd) {
    const k = String(cmd || '').toLowerCase();
    return MUDAH[k] || k;
}
