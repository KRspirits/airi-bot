import 'dotenv/config';

export const config = {
    port: process.env.PORT || 3000,
    prefix: '.',
    ownerNumbers: [
        '601166533534',
        '1166533534',
        '38956007690292'
    ],
    // Baca API Key Gemini dan MongoDB
    geminiKey: process.env.GEMINI_API_KEY || '',
    mongoUri: process.env.MONGO_URI || ''
};
