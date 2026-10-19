import * as store from './store.js';

// Log kejadian: asas untuk buletin, dendam, roast data & siasatan.
let list = null, t = null;
async function ensure() { if (!list) list = await store.get('log', 'events', []); return list; }

export async function logEvent(e) {
    const l = await ensure();
    l.push({ t: Date.now(), ...e });
    if (l.length > 800) l.splice(0, l.length - 800);
    clearTimeout(t);
    t = setTimeout(() => store.set('log', 'events', l).catch(() => {}), 3000);
    t.unref?.();
}
export async function recent({ since = 24 * 3600e3, type, actor, target, group } = {}) {
    const l = await ensure(); const min = Date.now() - since;
    return l.filter(e => e.t >= min && (!type || e.type === type) && (!actor || e.actor === actor) && (!target || e.target === target) && (!group || !e.group || e.group === group));
}
export async function countBy(actor, type, since = 30 * 24 * 3600e3) { return (await recent({ since, actor, type })).length; }
export function _reset() { list = null; }
