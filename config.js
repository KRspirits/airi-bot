export const config = {
    port: process.env.PORT || 3000,
    prefix: '.',
    // Senarai nombor WhatsApp Bos Amar (tanpa simbol + atau sengkang)
    ownerNumbers: [
        '601166533534',
        '1166533534',
        '38956007690292'
    ],
    groqKey: process.env.GROQ_API_KEY || '',
    mongoUri: process.env.MONGO_URI || ''
};
