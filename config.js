import dotenv from 'dotenv';
dotenv.config();

export const config = {
    prefix: '.',
    owner: process.env.OWNER_NUMBER || '601166533534@s.whatsapp.net',
    port: process.env.PORT || 3000,
    groqKey: process.env.GROQ_API_KEY,
    mongoUri: process.env.MONGO_URI
};
