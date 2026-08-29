import mongoose from 'mongoose';
import { config } from '../config.js';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, default: 'Warga Gelap' },
    wallet: { type: Number, default: 500 }, // RM500 Starter Pack
    bank: { type: Number, default: 0 },
    black_money: { type: Number, default: 0 },
    crypto: {
        btc: { type: Number, default: 0 },
        gold: { type: Number, default: 0 }
    },
    jail: {
        status: { type: Boolean, default: false },
        release_at: { type: Number, default: 0 },
        reason: { type: String, default: '' }
    },
    // Sistem Magnet (5 Tier)
    magnet: {
        tier: { type: Number, default: 1 }, // 1: Speaker Radio, 2: Kuat, 3: Industri, 4: Gergasi, 5: Kren Pelabuhan
        name: { type: String, default: 'Magnet Speaker Radio Asas' }
    },
    // Jentera
    vehicle: {
        name: { type: String, default: 'Kaki Bangku (Jalan Kaki)' },
        speed: { type: Number, default: 10 },
        tier: { type: String, default: 'F' }
    },
    // Hartanah Bernilai Tinggi
    properties: [{
        id: String,
        name: String,
        income: Number,
        last_claim: { type: Number, default: 0 }
    }],
    // Sistem Akuarium & Hasil Mancing
    aquarium: [{
        id: String,
        name: String,
        tier: String,
        buff_type: String, // 'gaji', 'speed', 'denda'
        buff_val: Number
    }],
    inventory: {
        fish: { type: Array, default: [] },
        scrap_metal: { type: Number, default: 0 }, // KG
        mystery_boxes: { type: Number, default: 0 },
        dongle: { type: Number, default: 0 },
        pet_egg: { type: Boolean, default: false },
        pet_egg_time: { type: Number, default: 0 },
        smartwatch: { type: Boolean, default: false },
        phone_iqoo: { type: Boolean, default: false }
    },
    pet: {
        name: { type: String, default: 'Tiada' },
        tier: { type: String, default: 'None' },
        shield: { type: Number, default: 0 }
    },
    loan: {
        amount: { type: Number, default: 0 },
        due_at: { type: Number, default: 0 }
    },
    stats: {
        race_win: { type: Number, default: 0 },
        race_lose: { type: Number, default: 0 },
        fish_caught: { type: Number, default: 0 },
        bounty: { type: Number, default: 0 }
    }
});

const UserModel = mongoose.model('User', userSchema);

export const db = {
    async connect() {
        try {
            await mongoose.connect(config.mongoUri);
            console.log('[DATABASE] MongoDB Atlas Bersambung!');
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
