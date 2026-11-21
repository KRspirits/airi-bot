import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import * as store from './store.js';

// =========================================================================
// PEMBAIKAN BESAR: dahulu schema Mongoose "strict" membuang medan yang tak disenaraikan
// (loan, dirty_money, duit_gelap, telur_pet, magnet, pet, lastDaily, lastKerja, bm_items,
// inventory.bm_nama ...). Kini setiap pemain disimpan sebagai dokumen bebas (Mixed),
// jadi apa sahaja yang plugin tulis pada `user` akan kekal, sama seperti mod JSON.
// Data lama (format lama) dimigrasi automatik semasa dibaca.
// =========================================================================
let isMongoConnected = false;
const localDbPath = path.resolve('./database.json');

function getLocalData() {
    if (!fs.existsSync(localDbPath)) fs.writeFileSync(localDbPath, JSON.stringify({ users: {} }, null, 2));
    try { return JSON.parse(fs.readFileSync(localDbPath, 'utf-8')); } catch { return { users: {} }; }
}
function saveLocalData(data) { fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2)); }

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    doc: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { strict: false, minimize: false });
const kvSchema = new mongoose.Schema({ ns: String, key: String, val: mongoose.Schema.Types.Mixed }, { minimize: false });
kvSchema.index({ ns: 1, key: 1 }, { unique: true });
const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
const KVModel = mongoose.models.KV || mongoose.model('KV', kvSchema);

export function freshUser(id, name) { return newUser(id, name); }
function newUser(id, name) {
    return {
        id, name, createdAt: Date.now(), wallet: 500, bank: 0, black_money: 0,
        crypto: { btc: 0, gold: 0 },
        jail: { status: false, release_at: 0, reason: '', vote_free: 0, vote_jail: 0, voters: [] },
        vehicle: { name: 'Kaki Bangku (Jalan Kaki)', speed: 10, tier: 'F', plate: '', is_stolen: false },
        properties: [], farm: { crop: null, planted_at: 0, harvest_at: 0, is_illegal: false }, badges: [],
        inventory: { fish: [], scrap_metal: 0, mystery_boxes: 0, rod: 'Joran Buluh', bait: 0 },
        stats: { race_win: 0, crimes_done: 0, fish_caught: 0, bank_hacked: 0, times_jailed: 0 },
        lastDaily: 0, lastKerja: 0, lastJenayah: 0
    };
}
function repair(user, pushName) {
    const d = newUser(user.id, 'Warga Gelap');
    for (const k of ['inventory', 'stats', 'vehicle', 'farm', 'jail', 'crypto']) if (!user[k] || typeof user[k] !== 'object') user[k] = d[k];
    if (!Array.isArray(user.inventory.fish)) user.inventory.fish = [];
    for (const k of ['wallet', 'bank', 'black_money']) if (typeof user[k] !== 'number' || Number.isNaN(user[k])) user[k] = d[k];
    if (!Array.isArray(user.badges)) user.badges = [];
    if (!Array.isArray(user.properties)) user.properties = [];
    const PLACEHOLDER = ['Warga Gelap', 'Ahli Baru', 'Warga Baru'];
    if (!user.name || (PLACEHOLDER.includes(user.name) && pushName && !PLACEHOLDER.includes(pushName))) user.name = pushName || user.name || 'Warga Gelap';
    // kaedah tak boleh dienumerasi => tidak ikut disimpan
    Object.defineProperty(user, 'save', { value: async function () { return db.saveUser(this); }, enumerable: false, configurable: true, writable: true });
    Object.defineProperty(user, 'markModified', { value: () => {}, enumerable: false, configurable: true, writable: true });
    return user;
}
const legacyToDoc = raw => { const { _id, __v, doc, ...rest } = raw; return rest; };

export const db = {
    isMongo: () => isMongoConnected,

    async connect() {
        try {
            if (!config.mongoUri) throw new Error('Tiada MONGO_URI');
            mongoose.set('bufferCommands', false);
            await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
            isMongoConnected = true;
            store.useBackend({
                async get(ns, key) { const r = await KVModel.findOne({ ns, key }).lean(); return r?.val; },
                async set(ns, key, val) { await KVModel.updateOne({ ns, key }, { $set: { val } }, { upsert: true }); },
                async del(ns, key) { await KVModel.deleteOne({ ns, key }); },
                async all(ns) { const rows = await KVModel.find({ ns }).lean(); const o = {}; for (const r of rows) o[r.key] = r.val; return o; }
            });
            console.log('✅ [DATABASE] Sambungan MongoDB Atlas Berjaya!');
        } catch (err) {
            isMongoConnected = false;
            console.log('🔄 [DATABASE FALLBACK] Guna fail tempatan (database.json / store.json). Data akan hilang bila Render restart!', err.message);
        }
    },

    async getUser(id, pushName = 'Warga Gelap') {
        let user = null;
        if (isMongoConnected) {
            try {
                const raw = await UserModel.findOne({ id }).lean();
                if (raw) user = (raw.doc && Object.keys(raw.doc).length) ? raw.doc : legacyToDoc(raw);
                else { user = newUser(id, pushName); await UserModel.create({ id, doc: user }).catch(() => {}); }
            } catch (e) { console.error('[DB] getUser:', e.message); }
        }
        if (!user) {
            const local = getLocalData();
            if (!local.users[id]) local.users[id] = newUser(id, pushName);
            user = local.users[id];
        }
        user.id = id;
        return repair(user, pushName);
    },

    async saveUser(user) {
        const data = JSON.parse(JSON.stringify(user));
        if (isMongoConnected) {
            try { await UserModel.updateOne({ id: user.id }, { $set: { doc: data } }, { upsert: true }); return user; }
            catch (e) { console.error('[DB] saveUser:', e.message); }
        }
        const local = getLocalData(); local.users[user.id] = data; saveLocalData(local);
        return user;
    },

    async getAllUsers() {
        if (isMongoConnected) {
            try {
                const rows = await UserModel.find({}).lean();
                return rows.map(r => repair({ ...((r.doc && Object.keys(r.doc).length) ? r.doc : legacyToDoc(r)), id: r.id }));
            } catch (e) { console.error('[DB] getAllUsers:', e.message); }
        }
        return Object.values(getLocalData().users || {}).map(u => repair(u));
    }
};
