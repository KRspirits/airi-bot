import { initAuthCreds, BufferJSON, proto } from '@whiskeysockets/baileys';
import * as store from './store.js';

// Session Baileys disimpan dalam MongoDB (ns "auth") supaya tak perlu scan QR lagi
// selepas Render restart/redeploy. Hanya digunakan bila Mongo aktif.
const k = s => String(s).replace(/[.$]/g, '_');
const write = (key, data) => store.set('auth', k(key), JSON.stringify(data, BufferJSON.replacer));
const read = async key => { const s = await store.get('auth', k(key)); return s ? JSON.parse(s, BufferJSON.reviver) : null; };

export async function useMongoAuthState() {
    const creds = (await read('creds')) || initAuthCreds();
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async id => {
                        let v = await read(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && v) v = proto.Message.AppStateSyncKeyData.fromObject(v);
                        data[id] = v;
                    }));
                    return data;
                },
                set: async data => {
                    const tasks = [];
                    for (const cat in data) for (const id in data[cat]) {
                        const v = data[cat][id], key = `${cat}-${id}`;
                        tasks.push(v ? write(key, v) : store.del('auth', k(key)));
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => write('creds', creds)
    };
}
