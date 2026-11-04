// Simpan 30 ralat terakhir dalam memori, supaya owner boleh tengok dengan .errlog tanpa buka Render.
const buf = [];
const asal = console.error.bind(console);
console.error = (...args) => {
    try {
        const teks = args.map(a => (a && a.stack) ? a.stack.split('\n')[0] : String(a)).join(' ');
        buf.push({ t: new Date().toISOString(), teks: teks.slice(0, 300) });
        if (buf.length > 30) buf.shift();
    } catch { /* jangan ganggu log */ }
    asal(...args);
};
export function ralatTerakhir(n = 10) { return buf.slice(-n); }
