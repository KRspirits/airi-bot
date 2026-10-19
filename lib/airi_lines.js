// =========================================================================
// 🎙️ FRASA SUARA AIRI (English sahaja). Bertenaga, lawak, dan santai.
// Tiada gambaran umur atau watak kanak-kanak; ini gaya bercakap bot sahaja.
// Placeholder: {nama} dan {group}. Dipanggil lewat speak() bila config.voice = true.
// =========================================================================

const LINES = {
    welcome: [
        'Heyyy {nama}! Welcome to {group}! Sit down, grab a drink, and do not you dare leave without saying hi!',
        'Wait, {nama} just joined?! The party just got ten times better, let us go!',
        'Oh look, fresh blood in {group}! {nama}, you are officially in trouble. The fun kind!'
    ],
    mythic: [
        'WHOA! A mythic creature just surfaced! Type the code, type it NOW before someone steals your catch!',
        'Something massive just broke the surface! First one to claim it takes the glory. Go, go, go!',
        'Did you see that?! A mythic catch just appeared. Type the code, I am not waiting forever!'
    ],
    purge: [
        'Cleanup hour has started! The cops are on a one hour coffee break. Go wild, but do not get greedy!',
        'One whole hour with no police. Do the thing. You know the thing.'
    ],
    auction: [
        'A mystery container just washed up on the shore! Place your bid, the clock is ticking, no pressure!',
        'Something shady is up for grabs. Who has the guts to bid? Come on, be brave!'
    ],
    jackpot: [
        'JACKPOT! Someone just hit the big one! Okay, that was ridiculous, well played!',
        'That was HUGE! Somebody just walked out richer than the rest of us. Respect!'
    ],
    jail: [
        'Oops! You got caught. Hang in there, the cell is not that bad. Probably.',
        'Busted! Sit tight, your time will be up before you know it. Maybe.'
    ],
    eventStart: [
        'Event time! Jump in before the fun runs out, nobody wants to watch from the sidelines!',
        'The event is live! The clock is running, so move those fingers!'
    ],
    eventEnd: [
        'And that is a wrap! Thanks for playing, you were all amazing. Same time next event?',
        'Event over! Good game, everyone. Rest up, we will do this again soon!'
    ]
};

/** Pilih satu frasa rawak untuk kategori. Gantikan {nama} dan {group}. */
export function line(kategori, vars = {}) {
    const pool = LINES[kategori];
    if (!pool?.length) return '';
    const t = pool[Math.floor(Math.random() * pool.length)];
    return t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export { LINES as _lines };
