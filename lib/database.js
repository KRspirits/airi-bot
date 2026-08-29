import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

let isMongoConnected = false;
const localDbPath = path.resolve('./database.json');

function getLocalData() {
    if (!fs.existsSync(localDbPath)) fs.writeFileSync(localDbPath, JSON.stringify({ users: {} }, null, 2));
    try {
        return JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
    } catch {
        return { users: {} };
    }
}

function saveLocalData(data) {
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
}

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, default: 'Warga Gelap' },
    wallet: { type: Number, default: 500 },
    bank: { type: Number, default: 0 },
    black_money: { type: Number, default: 0 },
    crypto: { btc: { type: Number, default: 0 }, gold: { type: Number, default: 0 } },
    jail: { status: { type: Boolean, default: false }, release_at: { type: Number, default: 0 }, reason: { type: String, default: '' } },
    vehicle: { name: { type: String, default: 'Kaki Bangku (Jalan Kaki)' }, speed: { type: Number, default: 10 }, tier: { type: String, default: 'F' }, plate: { type: String, default: '' } },
    farm: { crop: { type: String, default: null }, planted_at: { type: Number, default: 0 }, harvest_at: { type: Number, default: 0 } },
    inventory: { fish: { type: Array, default: [] }, scrap_metal: { type: Number, default: 0 } },
    stats: { race_win: { type: Number, default: 0 }, crimes_done: { type: Number, default: 0 }, fish_caught: { type: Number, default: 0 }, times_jailed: { type: Number, default: 0 } }
});

const UserModel = mongoose.model('User', userSchema);

export const db = {
    async connect() {
        try {
            if (!config.mongoUri) throw new Error("Tiada MONGO_URI");
            mongoose.set('bufferCommands', false);
            await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
            isMongoConnected = true;
            console.log('✅ [DATABASE] Sambungan MongoDB Atlas Berjaya!');
        } catch (err) {
            isMongoConnected = false;
            console.log('🔄 [DATABASE FALLBACK] Sistem beralih ke pangkalan data tempatan (database.json).');
        }
    },

    async getUser(id, pushName = 'Warga Gelap') {
        let user;
        if (isMongoConnected) {
            try {
                user = await UserModel.findOne({ id });
                if (!user) user = await UserModel.create({ id, name: pushName });
            } catch (e) {}
        }

        if (!user) {
            const local = getLocalData();
            if (!local.users[id]) local.users[id] = { id, name: pushName };
            user = local.users[id];
            user.save = async function() {
                const currentData = getLocalData();
                currentData.users[id] = this;
                saveLocalData(currentData);
                return this;
            };
        }

        // AUTO-REPAIR: Pastikan semua objek wujud supaya tiada ralat undefined
        if (!user.inventory) user.inventory = { fish: [], scrap_metal: 0 };
        if (!Array.isArray(user.inventory.fish)) user.inventory.fish = [];
        if (!user.stats) user.stats = { race_win: 0, crimes_done: 0, fish_caught: 0, times_jailed: 0 };
        if (!user.vehicle) user.vehicle = { name: 'Kaki Bangku (Jalan Kaki)', speed: 10, tier: 'F', plate: '' };
        if (!user.farm) user.farm = { crop: null, planted_at: 0, harvest_at: 0 };
        if (!user.jail) user.jail = { status: false, release_at: 0, reason: '' };
        if (user.name === 'Warga Gelap' && pushName && pushName !== 'Warga Gelap') user.name = pushName;

        return user;
    },

    async saveUser(user) {
        if (isMongoConnected && typeof user.save === 'function') {
            try { return await user.save(); } catch (e) {}
        }
        const local = getLocalData();
        local.users[user.id] = user;
        saveLocalData(local);
        return user;
    },

    async getAllUsers() {
        if (isMongoConnected) {
            try { return await UserModel.find({}); } catch (e) {}
        }
        return Object.values(getLocalData().users || {});
    }
};
