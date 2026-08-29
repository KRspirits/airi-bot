import mongoose from 'mongoose';
import { config } from '../config.js';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, default: 'Warga Gelap' },
    wallet: { type: Number, default: 500 },
    bank: { type: Number, default: 0 },
    black_money: { type: Number, default: 0 },
    crypto: {
        btc: { type: Number, default: 0 },
        gold: { type: Number, default: 0 }
    },
    jail: {
        status: { type: Boolean, default: false },
        release_at: { type: Number, default: 0 },
        reason: { type: String, default: '' },
        vote_free: { type: Number, default: 0 },
        vote_jail: { type: Number, default: 0 },
        voters: { type: Array, default: [] }
    },
    vehicle: {
        name: { type: String, default: 'Kaki Bangku (Jalan Kaki)' },
        speed: { type: Number, default: 10 },
        tier: { type: String, default: 'F' },
        is_stolen: { type: Boolean, default: false } // Kereta panas belum ketuk chassis
    },
    // Sistem Pertanian & Kebun
    farm: {
        crop: { type: String, default: null }, // 'strawberi', 'cili', 'ketum'
        planted_at: { type: Number, default: 0 },
        harvest_at: { type: Number, default: 0 },
        is_illegal: { type: Boolean, default: false }
    },
    // Reputasi & Gelaran
    badges: { type: Array, default: [] },
    inventory: {
        fish: { type: Array, default: [] },
        scrap_metal: { type: Number, default: 0 },
        mystery_boxes: { type: Number, default: 0 }
    },
    stats: {
        race_win: { type: Number, default: 0 },
        crimes_done: { type: Number, default: 0 },
        fish_caught: { type: Number, default: 0 },
        bank_hacked: { type: Number, default: 0 },
        times_jailed: { type: Number, default: 0 }
    }
});

const UserModel = mongoose.model('User', userSchema);

export const db = {
    async connect() {
        try {
            await mongoose.connect(config.mongoUri);
            console.log('[DATABASE] Sambungan MongoDB Atlas Stabil!');
        } catch (err) {
            console.error('[DATABASE ERROR]:', err);
        }
    },
    async getUser(id, pushName = 'Warga Gelap') {
        let user = await UserModel.findOne({ id });
        if (!user) {
            user = await UserModel.create({ id, name: pushName });
        }
        return user;
    },
    async saveUser(user) {
        return await user.save();
    },
    async getAllUsers() {
        return await UserModel.find({});
    }
};
