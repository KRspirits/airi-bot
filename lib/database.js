import mongoose from 'mongoose';
import { config } from '../config.js';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, default: 'Warga Gelap' },
    wallet: { type: Number, default: 1000 },
    bank: { type: Number, default: 5000 },
    black_money: { type: Number, default: 0 },
    jail: {
        status: { type: Boolean, default: false },
        release_at: { type: Number, default: 0 },
        reason: { type: String, default: '' }
    }
});

const UserModel = mongoose.model('User', userSchema);

export const db = {
    async connect() {
        try {
            await mongoose.connect(config.mongoUri);
            console.log('[DATABASE] Sambungan MongoDB berjaya!');
        } catch (err) {
            console.error('[DATABASE ERROR] Gagal sambung MongoDB:', err);
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
    }
};
