import * as store from './store.js';

// Keadaan global yang kekal: acara veto, hari pembersihan, penyelenggaraan, senarai grup, jadual.
export const state = { event: null, purgeUntil: 0, maintenance: false, groups: [], seasonEndsAt: 0, lastBulletinDay: '', lastPurgeDay: '' };
let t = null;

export async function initState() { Object.assign(state, await store.get('state', 'main', {})); }
export function saveState() {
    clearTimeout(t);
    t = setTimeout(() => store.set('state', 'main', state).catch(() => {}), 500);
    t.unref?.();
}
export function activeEvent() {
    if (state.event && Date.now() > state.event.expiresAt) { state.event = null; saveState(); }
    return state.event;
}
export const purgeActive = () => Date.now() < state.purgeUntil;
export function addGroup(jid) {
    if (!state.groups.includes(jid)) { state.groups.push(jid); saveState(); }
}
