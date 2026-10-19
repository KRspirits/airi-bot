// Cooldown global per pengguna: kurangkan spam & risiko ban.
const last = new Map();
export function allow(id, ms = 2000) {
    const now = Date.now(), prev = last.get(id) || 0;
    if (now - prev < ms) return false;
    last.set(id, now);
    return true;
}
export function remaining(id, ms) { return Math.max(0, ms - (Date.now() - (last.get(id) || 0))); }
setInterval(() => { const cut = Date.now() - 60000; for (const [k, v] of last) if (v < cut) last.delete(k); }, 60000).unref?.();
