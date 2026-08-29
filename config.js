import 'dotenv/config';

export const config = {
    port: process.env.PORT || 3000,
    prefix: '.',
    ownerNumbers: [
        '601166533534',
        '1166533534',
        '38956007690292'
    ],
    // Baca daripada pemboleh ubah persekitaran atau fallback
    groqKey: process.env.GROQ_API_KEY || process.env.GROQ_KEY || '',
    mongoUri: process.env.MONGO_URI || ''
};
