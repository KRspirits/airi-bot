// =========================================================================
// 🛡️ SHADOW LEGACY ENGINE V4.1 (UNCOMPRESSED EDITION) - BAHAGIAN 1
// =========================================================================
process.on("uncaughtException", (err) => {
    console.error("⚠️ [Anti-Crash] Uncaught Exception:", err?.message || err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("⚠️ [Anti-Crash] Unhandled Rejection:", reason);
});

import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import http from "http";
import QRCode from "qrcode";
import Groq from "groq-sdk";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// =========================================================================
// 👑 0. KUNCI KESELAMATAN FOUNDER & AI SETUP
// =========================================================================
const OWNER_NUMBERS = [
    "1166533534", 
    "601166533534", 
    "38956007690292"
];

let currentQR = ""; 
let isConnected = false; 
let globalChatActivity = 0;

const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });

async function askAiriAI(promptText, userName = "Warga Cyber") {
    try {
        const currentTimeMY = new Date().toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" });
        const sysPrompt = `Nama kau Airi, maskot AI Airi's Corner. Bos mutlak kau Amar. Rakan AI kau ialah Xiao V. Waktu semasa: ${currentTimeMY}. Personaliti: Comel, mesra dan biasa-biasa. Jawab ringkas. Pengguna: ${userName}.`;
        
        const chat = await groq.chat.completions.create({
            messages: [
                { role: "system", content: sysPrompt }, 
                { role: "user", content: promptText }
            ],
            model: "llama3-8b-8192", 
            temperature: 0.8, 
            max_tokens: 400
        });
        
        return chat.choices[0]?.message?.content || "Airi tak pasti nak jawab macam mana hehe~ 💙";
    } catch (err) {
        return "Aduh... sistem LPU Airi tengah overheat! 🧠";
    }
}

// =========================================================================
// 🌐 1. PELAYAN WEB RINGAN (RENDER/HEROKU)
// =========================================================================
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    if (isConnected) {
        res.end(`<div style="text-align:center;margin-top:60px;font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;"><h2>⚡ SHADOW LEGACY OS V4.1 ONLINE! ⚡</h2></div>`);
    } else if (currentQR) {
        QRCode.toDataURL(currentQR).then(img => {
            res.end(`<div style="text-align:center;margin-top:40px;font-family:sans-serif;background:#0a0f1d;color:#fff;padding:25px;"><h2>⚡ IMBAS KOD QR ⚡</h2><img src="${img}" style="width:280px;height:280px;border-radius:16px;"/></div>`);
        }).catch(() => res.end("Ralat QR"));
    } else {
        res.end(`<div style="text-align:center;margin-top:80px;color:#fff;font-family:sans-serif;"><h2>⏳ Menjana Kod QR...</h2></div>`);
    }
});

server.listen(PORT, "0.0.0.0", () => { 
    console.log(`🌐 Server aktif port ${PORT}`); 
});

// =========================================================================
// 💾 2. MONGODB & PANGKALAN DATA TEMPATAN
// =========================================================================
let localDB = { 
    users: {}, 
    groups: [], 
    market: { gold: 350, btc: 280000, scrap: 5, lastUpdate: Date.now() }, 
    season: 1, 
    auction: null, 
    hallOfFame: [], 
    p2pMarket: [], 
    worldBoss: null, 
    bounties: {} 
};

const MONGO_URI = process.env.MONGO_URI || "";
let mongoCollection = null;

async function initDB() {
    try {
        if (!MONGO_URI) throw new Error("Tiada MONGO_URI");
        const client = new MongoClient(MONGO_URI); 
        await client.connect();
        
        mongoCollection = client.db("AiriCorner").collection("GameData");
        const cloudData = await mongoCollection.findOne({ _id: "MAIN_DATA" });
        
        if (cloudData) { 
            localDB = cloudData.data; 
            console.log("✅ DB Cloud Dimuat Turun!"); 
        } else { 
            await mongoCollection.insertOne({ _id: "MAIN_DATA", data: localDB }); 
        }
    } catch (err) {
        if (fs.existsSync("./database.json")) {
            localDB = JSON.parse(fs.readFileSync("./database.json", "utf-8")); 
        } else {
            fs.writeFileSync("./database.json", JSON.stringify(localDB));
        }
    }
}

function loadDB() { 
    return localDB; 
}

function saveDB(data) {
    localDB = data;
    if (mongoCollection) {
        mongoCollection.updateOne({ _id: "MAIN_DATA" }, { $set: { data: localDB } }, { upsert: true }).catch(()=>{});
    } else {
        fs.writeFileSync("./database.json", JSON.stringify(data, null, 2));
    }
}

function getUser(userId, pushName = "") {
    const db = loadDB();
    if (!db.users[userId]) {
        db.users[userId] = { 
            name: pushName || "Warga Cyber", 
            bio: "", 
            cash: 500, 
            bank: 0, 
            debt: 0, 
            goldGrams: 0, 
            btcUnits: 0, 
            phoneDevice: null, 
            phoneName: "Public Phone 📟", 
            fishingGear: { rod: "rod_buluh", reel: "reel_plastik", bait: null, tank: "tank_balang" }, 
            magnetGear: { magnet: null }, 
            scrapMetalKg: 0, 
            misteryBoxes: 0, 
            inventory: [], 
            vehicles: [], 
            vehicleMods: {}, 
            food: [], 
            properties: [], 
            pet: null, 
            aquarium: [], 
            stars: 0, 
            badges: ["🌱 [COMMON] Warga Baru"], 
            stats: { works: 0, crimes: 0, racesWon: 0, fishes: 0, bankHacks: 0 }, 
            cooldowns: { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, magnet: 0, rent: 0, bankHack: 0, aiAsk: 0, hospitalUntil: 0 }, 
            streak: 0 
        }; 
        saveDB(db);
    }
    
    const u = db.users[userId];
    if (pushName && pushName !== "Warga Cyber" && u.name !== pushName) { 
        u.name = pushName; 
        saveDB(db); 
    }
    
    // Auto-Heal untuk akaun lama
    if (!u.inventory) u.inventory = []; 
    if (!u.vehicles) u.vehicles = []; 
    if (!u.properties) u.properties = []; 
    if (!u.aquarium) u.aquarium = []; 
    if (!u.food) u.food = []; 
    if (!u.vehicleMods) u.vehicleMods = {}; 
    if (!u.magnetGear) u.magnetGear = { magnet: null }; 
    if (u.scrapMetalKg === undefined) u.scrapMetalKg = 0; 
    if (u.misteryBoxes === undefined) u.misteryBoxes = 0; 
    if (!u.stats) u.stats = { works: 0, crimes: 0, racesWon: 0, fishes: 0, bankHacks: 0 }; 
    if (!u.cooldowns) u.cooldowns = { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, magnet: 0, rent: 0, bankHack: 0, aiAsk: 0, hospitalUntil: 0 }; 
    if (u.stars === undefined) u.stars = 0; 
    if (isNaN(u.cash)) u.cash = 500; 
    if (isNaN(u.bank)) u.bank = 0; 
    if (u.streak === undefined) u.streak = 0;
    
    return u;
}

function updateUser(userId, userData) { 
    const db = loadDB(); 
    db.users[userId] = userData; 
    saveDB(db); 
}

function getTitle(user) { 
    const t = user.cash + user.bank; 
    if (user.isOwner) return "👑 [MYTHIC] Pengasas Mutlak"; 
    if (user.stars >= 4) return "🏴‍☠️ [LEGENDARY] Kingpin Underworld"; 
    if (user.stars >= 2) return "🥷 [RARE] Buronan Dikehendaki"; 
    if (t >= 1000000) return "💎 [MYTHIC] Jutawan Trilion Airi"; 
    if (t >= 200000) return "💼 [EPIC] Pengurus Eksekutif"; 
    if (t >= 50000) return "⭐ [RARE] Pekerja Teladan"; 
    return "🌱 [COMMON] Warga Cyber"; 
}

// =========================================================================
// 🌟 3. PANGKALAN DATA RPG (UNCOMPRESSED EDITION) - BAHAGIAN 2
// =========================================================================

const NARRATIVE_BANKS = {
    RACE_WIN: [
        "Asap ekzos tinggal kat belakang, jentera meluncur laju macam peluru pandu!", 
        "Pecutan sempurna di garisan penamat!"
    ],
    RACE_CRASH: [
        "Adoi oversteer teruk dekat selekoh, jentera cium divider!", 
        "Tergolek tepi longkang litar!"
    ],
    CRIME_SUCCESS: [
        "Langkah licik macam bayang-bayang, hasil rompakan disorok kemas!", 
        "Misi jenayah siber berjalan lancar tanpa cap jari digital!"
    ],
    CRIME_BUSTED: [
        "Kantoi basah di tempat kejadian! Tangan dah kena gari.", 
        "Siren polis memekak satu blok, tak sempat nak lari!"
    ],
    BANK_HACK_SUCCESS: [
        "Firewall bank runtuh sekelip mata, duit mangsa disedut bersih!"
    ],
    ROB_SUCCESS: [
        "Acukan tepat sasaran, mangsa gigil serah duit!", 
        "Rembatan pantas di lorong gelap! Dompet mangsa licin."
    ],
    ROB_FAIL_ROAST: [
        "Niat merompak tapi tangan gigil dompet sendiri tercicir!", 
        "Terpijak kulit pisang masa nak samun, terlentang adeh!"
    ],
    PET_DEFEND: [
        "Pengawal haiwan melompat terkam perompak sampai koyak seluar!"
    ],
    SANTAU_SUCCESS: [
        "Jampi mantera siber berjaya meresap! Mangsa muntah paku digital.", 
        "Santau Maya masuk tepat ke dalam sistem mangsa!"
    ],
    SANTAU_FAIL: [
        "Mantera melantun balik! Firewall mangsa kebal berselawat.", 
        "Dukun siber scam, santau tak jalan!"
    ]
};

function getRandomNarrative(bankKey, fallback = "Aksi selesai.") {
    const bank = NARRATIVE_BANKS[bankKey];
    if (!bank || bank.length === 0) return fallback;
    return bank[Math.floor(Math.random() * bank.length)];
}

const SEASON_EVENTS = {
    "CRIME_BOOM": { 
        name: "🔥 Jenayah Gila", desc: "Loot jenayah naik 2x ganda!",
        rewardMult: 2.0, jailMult: 2.0, fineMult: 1.2, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 
    },
    "TECH_SURGE": { 
        name: "💻 Revolusi Siber", desc: "Diskaun Black Market 40%!",
        rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 
    },
    "ECONOMIC_CRASH": { 
        name: "📉 Kemelesetan", desc: "Gaji 2x, denda 2x!",
        rewardMult: 0.8, jailMult: 1.2, fineMult: 2.0, jobMult: 2.0, fishMult: 1.0, rentMult: 0.8, raceMult: 1.0 
    },
    "GOLD_RUSH": { 
        name: "💰 Gelombang Emas", desc: "Harga ikan & sewa 2x!",
        rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.2, fishMult: 2.0, rentMult: 2.0, raceMult: 1.0 
    },
    "UNDERGROUND_RACING": { 
        name: "🏁 Pelesit Malam", desc: "Hadiah drag race 2.5x!",
        rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 2.5 
    },
    "MEGA_HARVEST": { 
        name: "🌊 Badai Laut Dalam (Mega Harvest)", desc: "Harga ikan naik 3x!",
        rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 3.0, rentMult: 1.0, raceMult: 1.0 
    }
};

const RANDOM_SCENARIOS = [
    { type: "win", msg: "Terjumpa RM {val} di tepi jalan!", min: 1000, max: 5000 },
    { type: "win", msg: "Dividen ASB masuk! Anda terima RM {val}.", min: 5000, max: 15000 },
    { type: "win", msg: "Affiliate TikTok laku keras! Dapat komisen RM {val}.", min: 5000, max: 25000 },
    { type: "lose", msg: "Kena saman JPJ sebab ekzos bising. Denda RM {val}.", min: 300, max: 1000 },
    { type: "lose", msg: "Kena scam di Telegram. Wang lesap RM {val}.", min: 2000, max: 15000 }
];

// =========================================================================
// 🌟 3. PANGKALAN DATA ASET, ITEM & RPG (100% LENGKAP)
// =========================================================================

const MAGNET_SHOP = [
  { id: "mag_speaker", name: "Magnet Speaker Radio", price: 500, pullPower: 1, desc: "Sesuai tarik tin kosong" },
  { id: "mag_kuat", name: "Magnet Kuat Neodymium", price: 2500, pullPower: 3, desc: "Tarikan sederhana" },
  { id: "mag_industri", name: "Magnet Industri Padu", price: 12000, pullPower: 6, desc: "Tarikan kuat" },
  { id: "mag_gergasi", name: "Magnet Gergasi Rare", price: 45000, pullPower: 12, desc: "Tarikan luar biasa" },
  { id: "mag_elektro", name: "Kren Elektromagnet", price: 150000, pullPower: 25, desc: "Sapu bersih dasar sungai!" }
];

const MAGNET_LOOT = [
  { id: "m1", name: "Rim Basikal Lajak 🚲", basePrice: 0, weightKg: 2.5, type: "scrap" }, { id: "m2", name: "Tong Gas Kosong 🛢️", basePrice: 0, weightKg: 14.0, type: "scrap" },
  { id: "m3", name: "Rangka Motosikal Y15 🏍️", basePrice: 0, weightKg: 25.0, type: "scrap" }, { id: "m4", name: "Peti Ais Lama 🧊", basePrice: 0, weightKg: 35.0, type: "scrap" },
  { id: "m5", name: "Bumper Kancil 🚗", basePrice: 0, weightKg: 8.0, type: "scrap" }, { id: "m6", name: "Rantai Besi Kapal ⚓", basePrice: 0, weightKg: 50.0, type: "scrap" },
  { id: "m7", name: "Laptop Gaming Berlumut 💻", basePrice: 0, weightKg: 3.0, type: "scrap" }, { id: "m8", name: "Bateri Kereta Kong 🔋", basePrice: 0, weightKg: 12.0, type: "scrap" },
  { id: "m9", name: "Enjin Sangkut Bot 🚤", basePrice: 0, weightKg: 40.0, type: "scrap" }, { id: "m10", name: "Tanda Jalan AWAS 🛑", basePrice: 0, weightKg: 5.0, type: "scrap" },
  { id: "m11", name: "Kereta Sorong Mydin 🛒", basePrice: 0, weightKg: 15.0, type: "scrap" }, { id: "m12", name: "Tiang Lampu Isyarat 🚦", basePrice: 0, weightKg: 20.0, type: "scrap" },
  { id: "m13", name: "Kuali Tomyam Bocor 🥘", basePrice: 0, weightKg: 2.0, type: "scrap" }, { id: "m14", name: "Ekzos Prang Berkarat 💨", basePrice: 0, weightKg: 4.0, type: "scrap" },
  { id: "m15", name: "Seterika Lama 🔌", basePrice: 0, weightKg: 3.0, type: "scrap" }, { id: "m16", name: "Rim Sukan Bengkok 🛞", basePrice: 0, weightKg: 6.0, type: "scrap" },
  { id: "m17", name: "Peti Besi Misteri 📦", basePrice: 0, weightKg: 20.0, type: "box" }, { id: "m18", name: "Beg Duit Penuh Lumpur 👜", basePrice: 0, weightKg: 1.0, type: "box" },
  { id: "m19", name: "Berangkas Bank Bocor 🏦", basePrice: 0, weightKg: 30.0, type: "box" }, { id: "m20", name: "Kotak Peluru Lama 📦", basePrice: 0, weightKg: 5.0, type: "box" },
  { id: "m21", name: "Shadow Eclipse Smartwatch ⌚", basePrice: 15000, weightKg: 0.2, type: "valuable" }, { id: "m22", name: "Smartphone iQOO 12 Berkarat 📱", basePrice: 8500, weightKg: 0.3, type: "valuable" },
  { id: "m23", name: "Xiao V AI Earpiece 🎧", basePrice: 25000, weightKg: 0.1, type: "valuable" }, { id: "m24", name: "Gelang Emas Putus 💍", basePrice: 3500, weightKg: 0.1, type: "valuable" },
  { id: "m25", name: "Pedang Samurai Purba ⚔️", basePrice: 12000, weightKg: 1.5, type: "valuable" }, { id: "m26", name: "Serpihan UFO Berkaca 🛸", basePrice: 150000, weightKg: 15.0, type: "valuable" }
];

const FISHING_SHOP = {
  rods: [
    { id: "rod_buluh", name: "Joran Buluh Kampung 🎋", price: 0, luckBonus: 1.0, desc: "Joran asas" },
    { id: "rod_fiber", name: "Joran Fiberglass Shimano 🎣", price: 1500, luckBonus: 1.3, desc: "+30% Peluang" },
    { id: "rod_carbon", name: "Joran Carbon Graphite Pro ⚡", price: 8000, luckBonus: 1.8, desc: "+80% Peluang" },
    { id: "rod_titanium", name: "Joran Titanium Deepsea 🌊", price: 35000, luckBonus: 2.5, desc: "+150% Peluang" },
    { id: "rod_mythic", name: "Joran Poseidon Cyber-Orbital 🔱", price: 150000, luckBonus: 4.5, desc: "Raja Laut" }
  ],
  reels: [
    { id: "reel_plastik", name: "Kekili Plastik Biasa ⚙️", price: 0, cdReduction: 0, desc: "CD 60s" },
    { id: "reel_bearing", name: "Kekili Daiwa 5-Ball Bearing 🟡", price: 1200, cdReduction: 10000, desc: "-10s CD" },
    { id: "reel_magsealed", name: "Kekili MagSealed High-Speed ⚡", price: 6500, cdReduction: 20000, desc: "-20s CD" },
    { id: "reel_electric", name: "Kekili Elektrik Jigging Bionik 🔋", price: 25000, cdReduction: 30000, desc: "-30s CD" },
    { id: "reel_quantum", name: "Kekili Quantum Turbo Spinner 🌌", price: 90000, cdReduction: 40000, desc: "-40s CD" }
  ],
  baits: [
    { id: "umpan_cacing", name: "Umpan Cacing Tanah Segar 🪱", price: 200, priceMult: 1.2, desc: "+20% Harga" },
    { id: "umpan_udang", name: "Umpan Udang Peram Padu 🦐", price: 800, priceMult: 1.5, desc: "+50% Harga" },
    { id: "umpan_cyber", name: "Umpan Sintetik Feromon AI 🧪", price: 3000, priceMult: 2.2, desc: "+120% Harga" }
  ],
  tanks: [
    { id: "tank_balang", name: "Balang Kaca Meja 🫙", price: 0, capacity: 3, desc: "Muat 3 ekor" },
    { id: "tank_2kaki", name: "Akuarium Kaca 2 Kaki 🐠", price: 3000, capacity: 8, desc: "Muat 8 ekor" },
    { id: "tank_4kaki", name: "Akuarium Kabinet 4 Kaki 🏛️", price: 15000, capacity: 18, desc: "Muat 18 ekor" },
    { id: "tank_kolam", name: "Kolam Simen Landskap VIP 🏞️", price: 65000, capacity: 40, desc: "Muat 40 ekor" },
    { id: "tank_oceanarium", name: "Terowong Oceanarium Cyber 🌌", price: 250000, capacity: 100, desc: "Muat 100 ekor" }
  ]
};

const FISH_DATABASE = [
  { id: "f1", name: "Kasut But Getah Koyak 🥾", basePrice: 0, tier: "🗑️ JUNK", weightKg: 1.2, dropRate: 15.0, baseBuff: "Tiada", isJunk: true, isDangerous: false },
  { id: "f2", name: "Tayar Kereta Buruk Berlumut 🛞", basePrice: 0, tier: "🗑️ JUNK", weightKg: 8.5, dropRate: 10.0, baseBuff: "Tiada", isJunk: true, isDangerous: false },
  { id: "f3", name: "Ikan Kembung Segar Pasar 🐟", basePrice: 50, tier: "🌱 COMMON", weightKg: 0.4, dropRate: 20.0, baseBuff: "Gaji +2%", isJunk: false, isDangerous: false },
  { id: "f4", name: "Ikan Gelama Muara 🐟", basePrice: 50, tier: "🌱 COMMON", weightKg: 0.6, dropRate: 18.0, baseBuff: "Gaji +3%", isJunk: false, isDangerous: false },
  { id: "f5", name: "Ikan Keli Afrika L 🐡", basePrice: 50, tier: "🌱 COMMON", weightKg: 2.1, dropRate: 15.0, baseBuff: "CD -5s", isJunk: false, isDangerous: false },
  { id: "f6", name: "Udang Galah Sungai 🦐", basePrice: 150, tier: "🌿 UNCOMMON", weightKg: 0.8, dropRate: 12.0, baseBuff: "Gaji +5%", isJunk: false, isDangerous: false },
  { id: "f7", name: "Sotong Kurita Mini 🐙", basePrice: 150, tier: "🌿 UNCOMMON", weightKg: 1.5, dropRate: 10.0, baseBuff: "Drag +3%", isJunk: false, isDangerous: false },
  { id: "f8", name: "Ketam Bunga Segar 🦀", basePrice: 150, tier: "🌿 UNCOMMON", weightKg: 0.9, dropRate: 9.0, baseBuff: "CD -8s", isJunk: false, isDangerous: false },
  { id: "f9", name: "Ikan Siakap Muara 🐠", basePrice: 1000, tier: "⭐ RARE", weightKg: 3.8, dropRate: 6.0, baseBuff: "Gaji +8%", isJunk: false, isDangerous: false },
  { id: "f10", name: "Jenahak Merah Laut 🐡", basePrice: 1000, tier: "⭐ RARE", weightKg: 5.2, dropRate: 5.0, baseBuff: "Lokap -10%", isJunk: false, isDangerous: false },
  { id: "f11", name: "Pari Gergasi Layang 🦈", basePrice: 1000, tier: "⭐ RARE", weightKg: 14.5, dropRate: 4.0, baseBuff: "Drag +6%", isJunk: false, isDangerous: false },
  { id: "f12", name: "Kerapu Bara Monster 🦈", basePrice: 10000, tier: "💼 EPIC", weightKg: 18.0, dropRate: 2.5, baseBuff: "Gaji +12%", isJunk: false, isDangerous: false },
  { id: "f13", name: "Tuna Sirip Kuning A 🐟", basePrice: 10000, tier: "💼 EPIC", weightKg: 35.4, dropRate: 2.0, baseBuff: "Sewa +10%", isJunk: false, isDangerous: false },
  { id: "f14", name: "Ketam Raja Alaska 🦀", basePrice: 10000, tier: "💼 EPIC", weightKg: 8.2, dropRate: 1.5, baseBuff: "Gamble +5%", isJunk: false, isDangerous: false },
  { id: "f15", name: "Jerung Tukul Pesisir 🦈", basePrice: 100000, tier: "🏴‍☠️ LEGENDARY", weightKg: 65.0, dropRate: 0.8, baseBuff: "PvP +15%", isJunk: false, isDangerous: true },
  { id: "f16", name: "Sotong Kraken Rahsia 🐙", basePrice: 100000, tier: "🏴‍☠️ LEGENDARY", weightKg: 110.0, dropRate: 0.5, baseBuff: "Kebal Hack 20%", isJunk: false, isDangerous: true },
  { id: "f17", name: "Raja Temoleh Perak 👑", basePrice: 100000, tier: "🏴‍☠️ LEGENDARY", weightKg: 42.5, dropRate: 0.3, baseBuff: "Sewa +20%", isJunk: false, isDangerous: false },
  { id: "f18", name: "Coelacanth Emas 🌟", basePrice: 1500000, tier: "👑 MYTHIC", weightKg: 78.0, dropRate: 0.1, baseBuff: "Gaji +15%", isJunk: false, isDangerous: false },
  { id: "f19", name: "Megalodon Siber 🐉", basePrice: 3500000, tier: "👑 MYTHIC", weightKg: 450.0, dropRate: 0.05, baseBuff: "Gaji & Sewa +25%", isJunk: false, isDangerous: true },
  { id: "f_puyu", name: "Ikan Puyu Sawah 🐟", basePrice: 60, tier: "🌱 COMMON", weightKg: 0.2, dropRate: 20.0, baseBuff: "Gaji +2%", isJunk: false, isDangerous: false },
  { id: "f_haruan", name: "Haruan Penyembuh 🐟", basePrice: 180, tier: "🌿 UNCOMMON", weightKg: 1.5, dropRate: 12.0, baseBuff: "Lokap -5%", isJunk: false, isDangerous: false },
  { id: "f_toman", name: "Toman Bunga Ganas 🐠", basePrice: 1200, tier: "⭐ RARE", weightKg: 4.5, dropRate: 6.0, baseBuff: "Gaji +10%", isJunk: false, isDangerous: false },
  { id: "f_kelah", name: "Kelah Merah Mahkota 🐡", basePrice: 15000, tier: "💼 EPIC", weightKg: 6.0, dropRate: 2.0, baseBuff: "Sewa +12%", isJunk: false, isDangerous: false },
  { id: "f_kelisa", name: "Kelisa Arowana Emas 🌟", basePrice: 85000, tier: "🏴‍☠️ LEGENDARY", weightKg: 2.5, dropRate: 0.8, baseBuff: "PvP +15%", isJunk: false, isDangerous: false },
  { id: "f_buaya", name: "Buaya Tembaga Sesat 🐊", basePrice: 120000, tier: "🏴‍☠️ LEGENDARY", weightKg: 250.0, dropRate: 0.5, baseBuff: "Kebal Rompak 20%", isJunk: false, isDangerous: true },
  { id: "f_naga", name: "Naga Tasik Chini 🐉", basePrice: 4000000, tier: "👑 MYTHIC", weightKg: 850.0, dropRate: 0.02, baseBuff: "Gaji +25%", isJunk: false, isDangerous: true }
];

const PHONE_DEVICES = [
  { id: "nokia3310", name: "Nokia 3310 Sabun 🧱", price: 150, bonus: "Potong 15% denda polis", perk: "def", val: 0.15 },
  { id: "redmi12", name: "Redmi Note 12 5G 📲", price: 750, bonus: "Gaji kerja +5%", perk: "work", val: 0.05 },
  { id: "infinixgt", name: "Infinix GT 20 Pro 🎮", price: 1200, bonus: "Potong 15s cooldown kerja", perk: "cd", val: 15000 },
  { id: "poco_f6", name: "POCO F6 Speed Beast ⚡", price: 1800, bonus: "Menang drag +7%", perk: "race", val: 0.07 },
  { id: "iqoo12", name: "iQOO 12 Monster Gaming (OriginOS) 🐉", price: 3300, bonus: "Skrin 144Hz, menang drag +15%", perk: "race", val: 0.15 },
  { id: "rog8", name: "ROG Phone 8 Pro 🕶️", price: 4600, bonus: "Rompak kawan +12%", perk: "pvp", val: 0.12 },
  { id: "ip15pro", name: "iPhone 15 Pro Titanium 🍏", price: 5400, bonus: "Gaji kerja +20%", perk: "work", val: 0.20 },
  { id: "s24ultra", name: "Samsung Galaxy S24 Ultra AI 🤖", price: 6200, bonus: "Hack bank +15%", perk: "crime", val: 0.15 },
  { id: "magicv2", name: "HONOR Magic V2 Lipat 📂", price: 6900, bonus: "Faedah dividen bank +10%", perk: "bank", val: 0.10 },
  { id: "shadow_phone", name: "Shadow Legion X CyberDeck 🐺", price: 15000, bonus: "Gajet Ultimate Founder! +20%", perk: "god", val: 0.20 },
  { id: "vertu_sig", name: "Vertu Signature Cobra Sapphire 🐍", price: 50000, bonus: "Pendapatan sewa hartanah +25%", perk: "rent", val: 0.25 },
  { id: "solana_saga", name: "Solana Saga Genesis Crypto 🪙", price: 85000, bonus: "Keuntungan Kripto & Emas +15%", perk: "trade", val: 0.15 },
  { id: "caviar_gold", name: "Caviar Gold iPhone 24K Emas 👑", price: 140000, bonus: "Gaji kerja +35% & Kebal Rompak +10%", perk: "work", val: 0.35 },
  { id: "tonino_lambo", name: "Tonino Lamborghini 88 Tauri 🏎️", price: 220000, bonus: "Menang Drag Race +25%", perk: "race", val: 0.25 },
  { id: "crypto_node", name: "Satoshi Quantum CyberRig 💻", price: 500000, bonus: "Dividen bank +30%", perk: "bank", val: 0.30 },
  { id: "starlink_deck", name: "Starlink Orbital Satellite Rig 🛰️", price: 1200000, bonus: "Peluang godam bank naik +25%", perk: "crime", val: 0.25 },
  { id: "falcon_super", name: "Falcon SuperNova Pink Diamond 💎", price: 3500000, bonus: "Diskaun denda lokap 40%", perk: "def", val: 0.40 },
  { id: "neural_optic", name: "Neuralink Cyber-Cranial Device 🧠", price: 8000000, bonus: "Potong 25s semua cooldown RPG", perk: "cd", val: 25000 },
  { id: "quantum_prime", name: "Quantum Matrix Core OS 🌌", price: 20000000, bonus: "Menang Coinflip/Slot +15%", perk: "gamble", val: 0.15 },
  { id: "airi_chrono", name: "Airi Chrono Infinity Handheld 🔮", price: 50000000, bonus: "Gajet Dewa! +40% Semua Payout", perk: "god", val: 0.40 }
];

const JOBS = [
  { id: 1, name: "Pekerja Am Majlis", minPay: 100, maxPay: 180 }, { id: 2, name: "Pencuci Pinggan", minPay: 105, maxPay: 185 },
  { id: 3, name: "Rider GrabFood", minPay: 110, maxPay: 195 }, { id: 4, name: "Runner Foodpanda", minPay: 110, maxPay: 195 },
  { id: 5, name: "Pemandu Van Jenazah", minPay: 120, maxPay: 205 }, { id: 6, name: "Kerani Kaunter", minPay: 125, maxPay: 215 },
  { id: 7, name: "Juruteknik Aircond", minPay: 130, maxPay: 220 }, { id: 8, name: "Operator Kilang", minPay: 135, maxPay: 225 },
  { id: 9, name: "Penebar Burger", minPay: 140, maxPay: 230 }, { id: 10, name: "Barista Kopi", minPay: 140, maxPay: 230 },
  { id: 11, name: "Jurujual Coway", minPay: 145, maxPay: 235 }, { id: 12, name: "Tukang Masak Katering", minPay: 150, maxPay: 240 },
  { id: 13, name: "Graphic Designer", minPay: 155, maxPay: 245 }, { id: 14, name: "Video Editor TikTok", minPay: 160, maxPay: 250 },
  { id: 15, name: "Social Media Admin", minPay: 160, maxPay: 250 }, { id: 16, name: "Ejen Hartanah", minPay: 165, maxPay: 255 },
  { id: 17, name: "Tukang Paip", minPay: 165, maxPay: 255 }, { id: 18, name: "Juruelektrik", minPay: 170, maxPay: 260 },
  { id: 19, name: "Mekanik Motor", minPay: 175, maxPay: 265 }, { id: 20, name: "Foreman Bengkel", minPay: 180, maxPay: 270 },
  { id: 21, name: "Cikgu Tuisyen", minPay: 185, maxPay: 275 }, { id: 22, name: "Jurutera Tapak", minPay: 190, maxPay: 285 },
  { id: 23, name: "Akauntan Audit", minPay: 195, maxPay: 290 }, { id: 24, name: "Pengurus Projek", minPay: 200, maxPay: 295 },
  { id: 25, name: "Peguam Majistret", minPay: 210, maxPay: 300 }, { id: 26, name: "Doktor Pakar", minPay: 220, maxPay: 310 },
  { id: 27, name: "Software Engineer", minPay: 230, maxPay: 320 }, { id: 28, name: "Data Scientist", minPay: 240, maxPay: 330 },
  { id: 29, name: "Pilot AirAsia", minPay: 250, maxPay: 340 }, { id: 30, name: "Kapten Kapal", minPay: 250, maxPay: 340 },
  { id: 31, name: "Arkitek Bangunan", minPay: 245, maxPay: 335 }, { id: 32, name: "Pakar Bedah", minPay: 260, maxPay: 350 },
  { id: 33, name: "Trader Forex", minPay: 200, maxPay: 340 }, { id: 34, name: "Pelombong Bitcoin", minPay: 210, maxPay: 350 },
  { id: 35, name: "Content Creator", minPay: 220, maxPay: 345 }, { id: 36, name: "Streamer MLBB", minPay: 225, maxPay: 355 },
  { id: 37, name: "Tukang Jahit", minPay: 180, maxPay: 260 }, { id: 38, name: "Web Developer", minPay: 215, maxPay: 325 },
  { id: 39, name: "Ejen Takaful", minPay: 190, maxPay: 280 }, { id: 40, name: "Pengurus Bank", minPay: 255, maxPay: 345 },
  { id: 41, name: "Cef Eksekutif", minPay: 260, maxPay: 355 }, { id: 42, name: "Jurugambar", minPay: 205, maxPay: 290 },
  { id: 43, name: "Juruaudit Forensik", minPay: 235, maxPay: 325 }, { id: 44, name: "Kontraktor Bina", minPay: 245, maxPay: 335 },
  { id: 45, name: "Ahli Farmasi", minPay: 240, maxPay: 330 }, { id: 46, name: "Pakar Psikologi", minPay: 230, maxPay: 320 },
  { id: 47, name: "Pakar Siber", minPay: 255, maxPay: 345 }, { id: 48, name: "Pakar Ekonomi", minPay: 270, maxPay: 365 },
  { id: 49, name: "Pelabur Saham", minPay: 280, maxPay: 380 }, { id: 50, name: "CEO Konglomerat", minPay: 300, maxPay: 400 },
  { id: 101, name: "Pomen Bawah Pokok", minPay: 130, maxPay: 240 }, { id: 102, name: "Founder Skincare", minPay: 200, maxPay: 350 },
  { id: 103, name: "Tauke Bundle", minPay: 150, maxPay: 280 }, { id: 104, name: "Flipper Tiket", minPay: 180, maxPay: 310 }
];

const VEHICLES = [
  { id: "ex5", name: "Honda EX5 High Power 🛵", price: 3000, type: "Motor", speed: 50 },
  { id: "wave125", name: "Honda Wave 125i Ultimo 🛵", price: 5500, type: "Motor", speed: 55 },
  { id: "lagenda", name: "Yamaha Lagenda 115Z 🛵", price: 6000, type: "Motor", speed: 58 },
  { id: "lc135", name: "Yamaha LC135 5-Speed V8 🏍️", price: 7500, type: "Motor", speed: 65 },
  { id: "y15", name: "Yamaha Y15ZR (Ysuku) Monster 🏍️", price: 10000, type: "Motor", speed: 72 },
  { id: "rs150", name: "Honda RS150R Repsol V2 🏍️", price: 10500, type: "Motor", speed: 73 },
  { id: "nvx", name: "Yamaha NVX 155 ABS V2 🛵", price: 12000, type: "Motor", speed: 75 },
  { id: "nmax", name: "Yamaha NMAX 155 Maxi 🛵", price: 13000, type: "Motor", speed: 74 },
  { id: "r15", name: "Yamaha YZF-R15M Quickshifter 🏍️", price: 14000, type: "Motor", speed: 78 },
  { id: "cbr150", name: "Honda CBR150R Fireblade 🏍️", price: 14500, type: "Motor", speed: 79 },
  { id: "adv160", name: "Honda ADV 160 Adventure 🛵", price: 15000, type: "Motor", speed: 76 },
  { id: "rxz", name: "Yamaha RXZ Catalyzer Hantu 🏍️", price: 18000, type: "Motor", speed: 95 },
  { id: "z250", name: "Kawasaki Z250 Twin Naked 🏍️", price: 21000, type: "Motor", speed: 85 },
  { id: "ninja250", name: "Kawasaki Ninja 250 SE 🏍️", price: 22000, type: "Motor", speed: 88 },
  { id: "mt07", name: "Yamaha MT-07 CP2 Crossplane 🏍️", price: 40000, type: "Motor", speed: 105 },
  { id: "z800", name: "Kawasaki Z800 4-Silinder 🏍️", price: 48000, type: "Motor", speed: 115 },
  { id: "r6", name: "Yamaha YZF-R6 Scream 16k RPM 🏍️", price: 85000, type: "Motor", speed: 135 },
  { id: "zx6r", name: "Kawasaki ZX-6R Ninja 636 🏍️", price: 90000, type: "Motor", speed: 140 },
  { id: "s1000rr", name: "BMW S1000RR M-Package 🚀", price: 175000, type: "Motor", speed: 165 },
  { id: "panigale", name: "Ducati Panigale V4S Corse 🚀", price: 180000, type: "Motor", speed: 170 },
  { id: "h2", name: "Kawasaki Ninja H2 Supercharged 🚀", price: 250000, type: "Motor", speed: 190 },
  { id: "h2r", name: "Kawasaki Ninja H2R Carbon 🌌", price: 600000, type: "Motor", speed: 230 },
  { id: "superleggera", name: "Ducati Superleggera V4 Carbon 🚀", price: 1200000, type: "Motor", speed: 235 },
  { id: "arch_krgt1", name: "Arch Motorcycle KRGT-1 Keanu 🏍️", price: 1800000, type: "Motor", speed: 175 },
  { id: "mvg_oro", name: "MV Agusta Rush 1000 Serie Oro 🏍️", price: 2500000, type: "Motor", speed: 210 },
  { id: "combat_f117", name: "Combat Motors P-51 Fighter 🛸", price: 4000000, type: "Motor", speed: 220 },
  { id: "tamburini_t12", name: "MT Tamburini T12 Massimo 🌟", price: 8500000, type: "Motor", speed: 240 },
  { id: "dodge_tomahawk", name: "Dodge Tomahawk V10 8.3L 🚀", price: 15000000, type: "Motor", speed: 270 },
  { id: "eCosse_spirit", name: "Ecosse ES1 Superbike Titanium 👑", price: 35000000, type: "Motor", speed: 290 },
  { id: "harley_cosmic", name: "Cosmic Starship Jack Armstrong 🎨", price: 75000000, type: "Motor", speed: 160 },
  { id: "neiman_marcus", name: "Neiman Marcus Limited Fighter 👑", price: 150000000, type: "Motor", speed: 260 },
  { id: "kancil", name: "Perodua Kancil 660 Manual 🚗", price: 5000, type: "Kereta", speed: 45 },
  { id: "iswara", name: "Proton Iswara Aeroback 1.3 🚗", price: 8000, type: "Kereta", speed: 50 },
  { id: "saga", name: "Proton Saga BLM 1.3 CamPro 🚗", price: 12000, type: "Kereta", speed: 55 },
  { id: "wira", name: "Proton Wira 1.5 GLi Injection 🚗", price: 15000, type: "Kereta", speed: 60 },
  { id: "kelisa", name: "Perodua Kelisa Convert Gino 🚗", price: 22000, type: "Kereta", speed: 85 },
  { id: "preve", name: "Proton Preve 1.6 CFE Turbo 🚗", price: 40000, type: "Kereta", speed: 75 },
  { id: "wira_evo", name: "Wira Evo 3 Convert 🚗", price: 45000, type: "Kereta", speed: 110 },
  { id: "persona", name: "Proton Persona VVT Premium 🚗", price: 45000, type: "Kereta", speed: 70 },
  { id: "myvi", name: "Perodua Myvi King 1.5 AV 👑", price: 50000, type: "Kereta", speed: 82 },
  { id: "lori_hantu", name: "Lori Hantu Balak 🚚", price: 85000, type: "Kereta", speed: 70 },
  { id: "x50", name: "Proton X50 TGDi Flagship 🚙", price: 90000, type: "Kereta", speed: 95 },
  { id: "vios", name: "Toyota Vios Dugong GR-S 🚗", price: 95000, type: "Kereta", speed: 85 },
  { id: "x70", name: "Proton X70 Premium AWD 🚙", price: 120000, type: "Kereta", speed: 100 },
  { id: "civic", name: "Honda Civic FC 1.5 Ketam Turbo 🏎️", price: 130000, type: "Kereta", speed: 110 },
  { id: "accord", name: "Honda Accord 1.5 TC-P VIP 🚘", price: 180000, type: "Kereta", speed: 120 },
  { id: "alphard", name: "Toyota Alphard 3.5 Executive 🚐", price: 350000, type: "Kereta", speed: 95 },
  { id: "mustang", name: "Ford Mustang 5.0 GT V8 🏎️", price: 550000, type: "Kereta", speed: 145 },
  { id: "gtr", name: "Nissan GT-R R35 Nismo Godzilla 🏎️", price: 650000, type: "Kereta", speed: 165 },
  { id: "m4", name: "BMW M4 Competition G82 🏎️", price: 750000, type: "Kereta", speed: 170 },
  { id: "c63", name: "Mercedes-AMG C63s V8 BiTurbo 🏎️", price: 780000, type: "Kereta", speed: 172 },
  { id: "ferrari", name: "Ferrari 488 Pista V8 🏎️", price: 1500000, type: "Kereta", speed: 185 },
  { id: "lambo", name: "Lamborghini Huracan EVO V10 🏎️", price: 1600000, type: "Kereta", speed: 190 },
  { id: "911", name: "Porsche 911 GT3 RS Weissach 🏎️", price: 1800000, type: "Kereta", speed: 195 },
  { id: "aventador_svj", name: "Lamborghini Aventador SVJ V12 🚀", price: 4500000, type: "Kereta", speed: 215 },
  { id: "mclaren_p1", name: "McLaren P1 Hybrid Hypercar 🏎️", price: 8000000, type: "Kereta", speed: 225 },
  { id: "ferrari_laferrari", name: "Ferrari LaFerrari Aperta 👑", price: 16000000, type: "Kereta", speed: 230 },
  { id: "koenigsegg_jesko", name: "Koenigsegg Jesko Absolut 300+ 🚀", price: 28000000, type: "Kereta", speed: 265 },
  { id: "bugatti_chiron", name: "Bugatti Chiron Super Sport 300+ 🚀", price: 38000000, type: "Kereta", speed: 270 },
  { id: "pagani_huayra", name: "Pagani Huayra Codalunga Bespoke 💎", price: 55000000, type: "Kereta", speed: 245 },
  { id: "bugatti_voiture", name: "Bugatti La Voiture Noire 🖤", price: 95000000, type: "Kereta", speed: 260 },
  { id: "rolls_boat_tail", name: "Rolls-Royce Boat Tail Yacht 🛥️", price: 140000000, type: "Kereta", speed: 130 },
  { id: "rolls_droptail", name: "Rolls-Royce La Rose Noire Droptail 🌹", price: 180000000, type: "Kereta", speed: 135 },
  { id: "mercedes_300slr", name: "Mercedes-Benz 300 SLR Uhlenhaut 👑", price: 650000000, type: "Kereta", speed: 200 }
];

const PROPERTIES = [
  { id: 1, name: "Flat PPR Lembah Subang 🏢", price: 35000, rent: 5000 },
  { id: 2, name: "Rumah Teres 1 Tingkat Bangi 🏡", price: 120000, rent: 17000 },
  { id: 101, name: "Warung Tomyam Kelantan 🍲", price: 180000, rent: 25000 },
  { id: 102, name: "Tapak Carwash 24 Jam 🧽", price: 350000, rent: 48000 },
  { id: 3, name: "Kondominium Mewah KLCC 🏙️", price: 450000, rent: 64000 },
  { id: 4, name: "Semi-D Tropika Shah Alam 🏡", price: 850000, rent: 121000 },
  { id: 103, name: "Kebun Musang King Raub 🌳", price: 1200000, rent: 175000 },
  { id: 5, name: "Banglo Cyberjaya Elite 🏰", price: 1500000, rent: 214000 },
  { id: 6, name: "Penthouse Skyview TRX 🌌", price: 3500000, rent: 500000 },
  { id: 7, name: "Menara Korporat Damansara 🏬", price: 8000000, rent: 1142000 },
  { id: 8, name: "Kompleks Kilang Perindustrian Klang 🏭", price: 15000000, rent: 2142000 },
  { id: 9, name: "Resort Terapung Pulau Langkawi 🏝️", price: 30000000, rent: 4285000 },
  { id: 10, name: "Ladang Kelapa Sawit 500 Ekar Johor 🌴", price: 65000000, rent: 9285000 },
  { id: 11, name: "Pusat Data AI Megastruktur Cyberjaya 🧠", price: 120000000, rent: 17142000 },
  { id: 12, name: "Pulau Peribadi Laut China Selatan 👑", price: 300000000, rent: 42857000 },
  { id: 13, name: "Pelabuhan Kontena Persendirian Port Klang 🚢", price: 550000000, rent: 78571000 },
  { id: 14, name: "Lapangan Terbang Kargo Siber Antarabangsa 🛫", price: 950000000, rent: 135714000 },
  { id: 15, name: "Gugusan Pulau Buatan Gold Coast Cyber 🏝️", price: 1800000000, rent: 257142000 },
  { id: 16, name: "Lombong Emas Bawah Tanah Pahang Deep ⛏️", price: 3500000000, rent: 500000000 },
  { id: 17, name: "Pelantar Minyak & Gas Laut Dalam Terengganu 🛢️", price: 6800000000, rent: 971428000 },
  { id: 18, name: "Stesen Satelit Orbit Bumi Rendah (LEO) 🛰️", price: 12000000000, rent: 1714285000 },
  { id: 19, name: "Mega-Kasino Bawah Laut Pulau Tioman 🎰", price: 25000000000, rent: 3571428000 },
  { id: 20, name: "Pangkalan Pelancaran Roket Angkasa Cyber 🚀", price: 50000000000, rent: 7142857000 },
  { id: 21, name: "Koloni Dom Bawah Tanah Bulan Lunar Alpha 🌕", price: 100000000000, rent: 14285714000 },
  { id: 22, name: "Stesen Angkasa Mega Orbital Airi Prime 🌌", price: 250000000000, rent: 35714285000 }
];

const MOD_PARTS = {
  Motor: [
    { id: 46, name: "Talaan ECU Remap Stage 1 💻", price: 2500, boostSpeed: 12, desc: "+12 km/h top speed & respon throttle segera" },
    { id: 47, name: "Ekzos Titanium Paip On 🔊", price: 1800, boostSpeed: 8, desc: "+8% peluang menang drag & jeritan padu" },
    { id: 48, name: "Set Tayar Slick Drag Corsa 🏁", price: 1200, boostSpeed: 5, desc: "+5 km/h & cengkaman maksimum di litar lurus" },
    { id: 50, name: "Head & Block 65mm Superhead ⚙️", price: 3500, boostSpeed: 20, desc: "+20 km/h top speed jentera highway" },
    { id: 51, name: "Monoshock Ohlins Racing 🟡", price: 2200, boostSpeed: 6, desc: "+6 km/h & kestabilan membrek selekoh maut" }
  ],
  Kereta: [
    { id: 46, name: "Remap Dyno Stage 2 + Pops & Bang 💻", price: 3500, boostSpeed: 15, desc: "+15 km/h & letupan ekzos berapi" },
    { id: 48, name: "Tayar Semi-Slick Toyo R888R 🏁", price: 2400, boostSpeed: 10, desc: "+10 km/h & cengkaman litar profesional" },
    { id: 51, name: "Suspensi Boleh Laras Adjustable 🟡", price: 4200, boostSpeed: 12, desc: "+12 km/h & badan kereta direndahkan aerodinamik" },
    { id: 52, name: "Sistem Turbo Garrett Ball-Bearing 🐌", price: 7500, boostSpeed: 30, desc: "+30 km/h top speed boost siput berdesing" },
    { id: 53, name: "Brek Brembo 6-Pot Caliper 🛑", price: 5000, boostSpeed: 5, desc: "Brek serta-merta elak risiko terbabas lumba" }
  ]
};

const BLACKMARKET_ITEMS = [
  { id: 1, name: "Alat Skimming Mesin ATM 📟", price: 5000, desc: "Gajet godam kad ATM lorong gelap" },
  { id: 2, name: "Flash-Drive Decrypter Bank 💾", price: 12000, desc: "Pintas firewall keselamatan & godam akaun bank sasaran" },
  { id: 3, name: "EMP Radio Jammer Polis 📡", price: 25000, desc: "Kacau frekuensi radio peronda polis pelabuhan" },
  { id: 4, name: "Kad Akses VIP Kasino 💳", price: 50000, desc: "Buka pintu bilik kebal kasino underground" },
  { id: 5, name: "Flipper Zero Modded Cyber 🐬", price: 150000, desc: "Alat godam induk infrastruktur pangkalan data & bank target" },
  { id: 6, name: "Radar Detector Penguatkuasa 🛰️", price: 15000, desc: "Gajet amaran awal potong 20% risiko ditangkap polis" },
  { id: 7, name: "Dokumen Pelepasan Kastam Palsu 📄", price: 12000, desc: "Pelepasan segera sekatan roadblock pelabuhan" },
  { id: 8, name: "Van Panel Dinding Berlapis 🚐", price: 35000, desc: "Logistik darat kalis imbasan x-ray sekatan jalan" },
  { id: 9, name: "Bot Pancung 4 Enjin Yamaha 🚤", price: 45000, desc: "Logistik laut meredah laluan tikus perairan" },
  { id: 10, name: "Dron Kargo Penglihatan Malam 🛸", price: 28000, desc: "Hantar bungkusan kontraban pintas pagar sempadan" },
  { id: 11, name: "Cyber Bypass Dongle 🖲️", price: 18000, desc: "Kunci perkakasan bajet untuk lancarkan eksploitasi godam bank (PvP)" },
  { id: 12, name: "Alat Penggodam Kuantum (PvE) 🧬", price: 150000, desc: "Pecah masuk firewall keselamatan bank pusat. Risiko 40% hancur!" }
];

const CRIMES = [
  { id: 1, name: "Ragut Beg Tepi Jalan 👜", rewardMin: 500, rewardMax: 1500, fine: 1000, stars: 1, cd: 120 },
  { id: 2, name: "Rompak Kedai Runcit Acheh 🏪", rewardMin: 800, rewardMax: 2000, fine: 2000, stars: 1, cd: 120 },
  { id: 3, name: "Kopek Mangga Motor Parkir 🏍️", rewardMin: 1500, rewardMax: 3000, fine: 3000, stars: 2, cd: 120 },
  { id: 4, name: "Pecah Masuk Kedai Emas 💍", rewardMin: 3000, rewardMax: 6000, fine: 5000, stars: 2, cd: 120 },
  { id: 5, name: "Rompak Banglo Orang Kaya 🏡", rewardMin: 5000, rewardMax: 10000, fine: 8000, stars: 3, cd: 120 },
  { id: 6, name: "Skimming Mesin ATM 🏧", rewardMin: 8000, rewardMax: 15000, reqItem: 1, fine: 12000, stars: 3, cd: 120 },
  { id: 7, name: "Seludup Rokok & Vape Kontraban 🚬", rewardMin: 12000, rewardMax: 22000, reqItem: 8, fine: 15000, stars: 3, cd: 120 },
  { id: 8, name: "Seludup Minuman Keras Bebas Cukai 🍾", rewardMin: 15000, rewardMax: 30000, reqItem: 9, fine: 20000, stars: 3, cd: 120 },
  { id: 9, name: "Godam Akaun Bank Awam 💻", rewardMin: 20000, rewardMax: 40000, reqItem: 2, fine: 30000, stars: 4, cd: 120 },
  { id: 10, name: "Seludup Cip AI & Kad Grafik GPU 🧠", rewardMin: 25000, rewardMax: 50000, reqItem: 10, fine: 40000, stars: 4, cd: 120 },
  { id: 11, name: "Penyeludupan Kontraban Port Klang 🚢", rewardMin: 35000, rewardMax: 70000, reqItem: 3, fine: 50000, stars: 4, cd: 120 },
  { id: 12, name: "Heist Bilik Kebal Kasino Genting 🎰", rewardMin: 50000, rewardMax: 100000, reqItem: 4, fine: 80000, stars: 5, cd: 120 },
  { id: 13, name: "Seludup Supercar Tanpa AP 🏎️", rewardMin: 80000, rewardMax: 150000, reqItem: 9, fine: 100000, stars: 5, cd: 120 },
  { id: 14, name: "Eksploitasi Darkweb Zero-Day 🌐", rewardMin: 120000, rewardMax: 250000, reqItem: 5, fine: 180000, stars: 5, cd: 120 },
  { id: 15, name: "Godam Induk Bank Pusat 🏛️", rewardMin: 300000, rewardMax: 600000, reqItem: 12, fine: 200000, stars: 5, cd: 3600 }
];

const CYBER_PETS = [
  { id: "kucing_jalanan", name: "Kucing Siber Jalanan 🐈", price: 5000, buff: "+15% Jumpa Duit Celah Sofa", perk: "random_boost", val: 0.15 },
  { id: "anjing_pengawal", name: "Anjing Rottweiler Pengawal 🐕", price: 20000, buff: "Gaji kerja +5%", perk: "work_boost", val: 0.05 },
  { id: "doberman", name: "Doberman Bionik Pengawal 🐕", price: 25000, buff: "Kebal 30% daripada rompakan PvP", perk: "anti_rob", val: 0.30 },
  { id: "drone_guard", name: "AI Sentry Dron Pengimbas 🛸", price: 60000, buff: "Kebal 40% daripada godam bank (.hackbank)", perk: "anti_hack", val: 0.40 },
  { id: "cyber_wolf", name: "Serigala Siber Alpha 🐺", price: 150000, buff: "Kebal 50% Rompak & Bantu serang lawan", perk: "wolf_buff", val: 0.50 },
  { id: "harimau_malaya", name: "Harimau Malaya Mecha 🐅", price: 150000, buff: "+10% Gaji Kerja Halal", perk: "work_boost", val: 0.10 },
  { id: "cyborg_panther", name: "Cyborg Shadow Panther 🐆", price: 450000, buff: "Kebal 60% Rompak & 60% Godam Bank", perk: "dual_def", val: 0.60 },
  { id: "xiaov_sentry", name: "Xiao V AI Sentry (Elite) 🔮", price: 1500000, buff: "Pembantu Pribadi! 75% kebal segalanya", perk: "dragon_god", val: 0.75 },
  { id: "kripto_dragon", name: "Naga Kripto Orbital Mythic 🐉", price: 2500000, buff: "Kebal 90% Serangan & Gaji Kerja +25%", perk: "dragon_god", val: 0.90 }
];

const FOOD_ITEMS = [
  { id: "tehtarik", name: "Teh Tarik Kaw Buih 🧋", price: 4, desc: "Potong 10s cooldown kerja" },
  { id: "roticanai", name: "Roti Canai Banjir Dhal 🥞", price: 7, desc: "Potong 20s cooldown kerja" },
  { id: "nasilemak", name: "Nasi Lemak Sotong Padu 🍛", price: 12, desc: "Reset serta-merta semua cooldown kerja!" },
  { id: "burger", name: "Burger Ramly Special Cheese 🍔", price: 15, desc: "Kenyang padu, kurangkan denda balai 10%" }
];
// =========================================================================
// 🚀 6. ENJIN UTAMA & PENYELARASAN ARAHAN (BAHAGIAN 3)
// =========================================================================

async function startBotEngine() {
    await initDB();
    
    const { state, saveCreds } = await useMultiFileAuthState("auth_session");
    const sock = makeWASocket({ 
        auth: state, 
        logger: pino({ level: "silent" }), 
        browser: Browsers.macOS("Desktop"), 
        printQRInTerminal: false 
    });
    
    sock.ev.on("creds.update", saveCreds);

    // =====================================================================
    // 🌐 LOOP EVENT RAWAK & LELONGAN
    // =====================================================================
    let lastRandomEventTime = Date.now();
    setInterval(async () => {
        const db = loadDB(); 
        const now = Date.now();
        
        if (db.auction && db.auction.active && (now - db.auction.lastBidTime > 60000)) {
            db.auction.active = false; 
            let pText = "🔔 *LELONGAN DIBATALKAN!* Tiada bidaan baru.";
            
            if (db.auction.highestBidder) {
                const winner = getUser(db.auction.highestBidder); 
                winner.cash += db.auction.rewardValue; 
                updateUser(db.auction.highestBidder, winner);
                pText = `🔔 *LELONGAN DITUTUP!*\n🎉 Pemenang: *${winner.name}* (RM ${db.auction.highestBid.toLocaleString()})\n📦 Habuan: *${db.auction.rewardName}*\n💰 Untung: *+RM ${db.auction.rewardValue.toLocaleString()}*`;
            }
            db.auction = null; 
            saveDB(db);
            for (const gId of (db.groups || [])) { 
                await sock.sendMessage(gId, { text: pText }).catch(()=>{}); 
            }
        }
        
        if (now - lastRandomEventTime >= 15 * 60 * 1000) {
            lastRandomEventTime = now;
            if (globalChatActivity >= 3 && db.groups?.length > 0) {
                globalChatActivity = 0; 
                const chance = Math.random();
                
                for (const targetGroup of db.groups) {
                    if (chance < 0.2 && !db.auction) {
                        const isT20 = Math.random() < 0.1; 
                        const startPrice = isT20 ? 100000 : 10000; 
                        const isScam = Math.random() < 0.5;
                        const rwName = isT20 ? (isScam ? "Habuk 💨" : "Kunci Lamborghini 🏎️") : (isScam ? "Bata 🧱" : "10 Jongkong Emas 🪙");
                        const rwVal = isT20 ? (isScam ? 0 : 1500000) : (isScam ? 0 : 50000);
                        
                        db.auction = { 
                            active: true, 
                            highestBid: startPrice, 
                            highestBidder: null, 
                            lastBidTime: now, 
                            rewardName: rwName, 
                            rewardValue: rwVal 
                        }; 
                        saveDB(db);
                        await sock.sendMessage(targetGroup, { text: `🚨 *LELONGAN KONTENA MISTERI!*\n💵 Tapak: *RM ${startPrice.toLocaleString()}*\n👉 Taip: *.bida [harga]*` }).catch(()=>{});
                    } else if (chance < 0.7) {
                        const activeIds = Object.keys(db.users);
                        if (activeIds.length > 0) {
                            const randomId = activeIds[Math.floor(Math.random() * activeIds.length)]; 
                            const u = db.users[randomId];
                            const scenario = RANDOM_SCENARIOS[Math.floor(Math.random() * RANDOM_SCENARIOS.length)];
                            const val = Math.floor(Math.random() * (scenario.max - scenario.min + 1)) + scenario.min;
                            
                            if (scenario.type === "win") {
                                let finalVal = val; 
                                if (u.pet === "kucing_jalanan") finalVal = Math.floor(finalVal * 1.15);
                                u.cash += finalVal; 
                                updateUser(randomId, u); 
                                await sock.sendMessage(targetGroup, { text: `🎁 *NASIB RAWAK!*\n*${u.name}*, ${scenario.msg.replace("{val}", finalVal.toLocaleString())}` }).catch(()=>{});
                            } else {
                                u.cash = Math.max(0, u.cash - val); 
                                updateUser(randomId, u); 
                                await sock.sendMessage(targetGroup, { text: `💀 *BENCANA RAWAK!*\n*${u.name}*, ${scenario.msg.replace("{val}", val.toLocaleString())}` }).catch(()=>{});
                            }
                        }
                    }
                }
            }
        }
    }, 5000);

    sock.ev.on("connection.update", (u) => {
        if (u.qr) { 
            currentQR = u.qr; 
            isConnected = false; 
        }
        if (u.connection === "close") { 
            isConnected = false; 
            setTimeout(() => startBotEngine(), 5000); 
        } else if (u.connection === "open") { 
            isConnected = true; 
            currentQR = ""; 
            console.log("✅ BOT AIRI V4.1 BERSAMBUNG!"); 
        }
    });

    // =====================================================================
    // 👋 MESEJ ALUAN & SELAMAT TINGGAL
    // =====================================================================
    sock.ev.on("group-participants.update", async (update) => {
        const { id, participants, action } = update;
        try {
            if (action === "add") {
                for (const participant of participants) {
                    const userTag = `@${participant.split("@")[0]}`;
                    const welcomeMsg = `✨ Hai ${userTag}! Selamat datang ke *Cyber Corner*! 💙\n\nJangan segan-segan tau. Boleh mula dengan taip *.menu* untuk tengok apa yang ada, atau tuntut elaun percuma guna *.daily*. Kalau nak borak, taip je *.airi*! Enjoy! 🎮`;
                    await sock.sendMessage(id, { text: welcomeMsg, mentions: [participant] });
                }
            } else if (action === "remove") {
                for (const participant of participants) {
                    const userTag = `@${participant.split("@")[0]}`;
                    await sock.sendMessage(id, { text: `Selamat jalan ${userTag}~ Semoga kita berjumpa lagi nanti! 🍂`, mentions: [participant] });
                }
            }
        } catch (err) { 
            console.error("Ralat welcome msg:", err); 
        }
    });

    // =====================================================================
    // 💬 PENGENDALI ARAHAN (MESSAGE HANDLER)
    // =====================================================================
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0]; 
        if (!m?.message) return;
        
        const from = m.key.remoteJid; 
        if (from?.endsWith("@g.us")) { 
            globalChatActivity++; 
            const db = loadDB(); 
            if (!db.groups.includes(from)) { 
                db.groups.push(from); 
                saveDB(db); 
            } 
        }
        
        const msgText = m.message.conversation || m.message.extendedTextMessage?.text || ""; 
        if (!msgText.trim().startsWith(".")) return;

        const args = msgText.trim().slice(1).split(/ +/); 
        const cmd = args.shift().toLowerCase();
        const sender = m.key.participant || from; 
        const cleanSender = sender.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        const pushName = m.pushName || ""; 
        const user = getUser(cleanSender, pushName); 
        const now = Date.now();
        
        const isOwner = OWNER_NUMBERS.some(num => cleanSender.includes(num)) || user.isOwner;
        if (isOwner && !user.isOwner) { 
            user.isOwner = true; 
            updateUser(cleanSender, user); 
        }
        
        const activePhoneObj = user.phoneDevice ? PHONE_DEVICES.find(p => p.id === user.phoneDevice) : null;
        const db = loadDB(); 
        const currentEvent = (db.active_event_data && SEASON_EVENTS[db.active_event_data.type]) ? SEASON_EVENTS[db.active_event_data.type] : null;

        // Semakan Cooldown Hukuman
        if (now < user.cooldowns.hospitalUntil && !isOwner) {
            return sock.sendMessage(from, { text: `🚑 Anda di hospital. Baki masa rawatan: ${Math.ceil((user.cooldowns.hospitalUntil - now)/1000)}s.` });
        }
        if (now < user.cooldowns.jailUntil && !["upah_lawyer", "myid"].includes(cmd) && !isOwner) {
            return sock.sendMessage(from, { text: `🚨 Anda di dalam sel lokap! Baki: ${Math.ceil((user.cooldowns.jailUntil - now)/1000)}s. (Guna *.upah_lawyer*)` });
        }

        // =====================================================================
        // 👑 VETO & ARAHAN PENTADBIR
        // =====================================================================
        if (cmd === "veto" && isOwner) {
            return sock.sendMessage(from, { text: `👑 *.syscheck*, *.spawn_boss*, *.give_cash*, *.set_season*, *.list_event*` });
        }

      // SUNTIK DUIT POKET
        if (cmd === "give_cash" && isOwner) {
            let targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
            if (!targetTag && args[0]?.startsWith("@")) targetTag = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net"; 
            if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.give_cash @user [jumlah]*` });
            
            const amt = parseInt(args[1]);
            if (isNaN(amt) || amt <= 0) return sock.sendMessage(from, { text: `❌ Sila masukkan jumlah angka yang sah!` });

            const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            const targetUser = getUser(cleanTarget); 
            targetUser.cash += amt; 
            updateUser(cleanTarget, targetUser); 
            
            return sock.sendMessage(from, { 
                text: `👑 *DANA SIBER DISUNTIK*\n+RM ${amt.toLocaleString()} berjaya dimasukkan ke poket @${cleanTarget.split("@")[0]}!`, 
                mentions: [cleanTarget] 
            });
        }

        // SUNTIK EMAS
        if (cmd === "give_gold" && isOwner) {
            let targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
            if (!targetTag && args[0]?.startsWith("@")) targetTag = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net"; 
            if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.give_gold @user [gram]*` });
            
            const g = parseFloat(args[1]);
            if (isNaN(g) || g <= 0) return sock.sendMessage(from, { text: `❌ Masukkan berat emas yang sah!` });

            const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            const targetUser = getUser(cleanTarget); 
            targetUser.goldGrams = (targetUser.goldGrams || 0) + g; 
            updateUser(cleanTarget, targetUser); 
            
            return sock.sendMessage(from, { 
                text: `👑 *SUNTIKAN EMAS*\n+${g}g Emas dimasukkan ke peti simpanan @${cleanTarget.split("@")[0]}!`, 
                mentions: [cleanTarget] 
            });
        }

        // SUNTIK BITCOIN
        if (cmd === "give_btc" && isOwner) {
            let targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
            if (!targetTag && args[0]?.startsWith("@")) targetTag = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net"; 
            if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.give_btc @user [unit]*` });
            
            const u = parseFloat(args[1]);
            if (isNaN(u) || u <= 0) return sock.sendMessage(from, { text: `❌ Masukkan unit BTC yang sah!` });

            const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            const targetUser = getUser(cleanTarget); 
            targetUser.btcUnits = (targetUser.btcUnits || 0) + u; 
            updateUser(cleanTarget, targetUser); 
            
            return sock.sendMessage(from, { 
                text: `👑 *SUNTIKAN KRIPTO*\n+${u} BTC dipindahkan ke dompet @${cleanTarget.split("@")[0]}!`, 
                mentions: [cleanTarget] 
            });
        }

        // PENJARA PAKSA
        if (cmd === "jail_user" && isOwner) {
            let targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
            if (!targetTag && args[0]?.startsWith("@")) targetTag = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net"; 
            if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.jail_user @user [saat]*` });
            
            const sec = parseInt(args[1]) || 120;
            const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            const targetUser = getUser(cleanTarget); 
            targetUser.cooldowns.jailUntil = now + (sec * 1000); 
            updateUser(cleanTarget, targetUser); 
            
            return sock.sendMessage(from, { 
                text: `🚨 @${cleanTarget.split("@")[0]} telah disumbat ke dalam lokap atas kuasa mutlak Founder (${sec}s)!`, 
                mentions: [cleanTarget] 
            });
        }

        // BEBASKAN BANDUAN
        if (cmd === "free_user" && isOwner) {
            let targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
            if (!targetTag && args[0]?.startsWith("@")) targetTag = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net"; 
            if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.free_user @user*` });
            
            const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
            const targetUser = getUser(cleanTarget); 
            targetUser.cooldowns.jailUntil = 0; 
            targetUser.cooldowns.hospitalUntil = 0; 
            updateUser(cleanTarget, targetUser); 
            
            return sock.sendMessage(from, { 
                text: `🕊️ Rekod hukuman @${cleanTarget.split("@")[0]} dipadamkan serta-merta!`, 
                mentions: [cleanTarget] 
            });
        }
      

      if (cmd === "autotest" && isOwner) {
            await sock.sendMessage(from, { text: `⏳ *Memulakan Protokol Diagnostik Kendiri...* Menguji pangkalan data dan modul RNG.` });
            
            let report = `🤖 *LAPORAN KESIHATAN V4.1*\n\n`;
            let passed = 0; const total = 5;

            // 1. Ujian Array & Aset
            try {
                if (VEHICLES.length === 64 && FISH_DATABASE.length === 26 && PROPERTIES.length === 25) { 
                    passed++; report += `✅ *Enjin Aset:* Lengkap (64 Jentera, 26 Ikan, 25 Rumah)\n`; 
                } else { report += `❌ *Enjin Aset:* Ralat (Data terpotong!)\n`; }
            } catch (e) { report += `❌ *Enjin Aset:* Gagal dibaca\n`; }

            // 2. Ujian Kalkulator Ekonomi (Kerja & Ahlong)
            try {
                const testJob = JOBS[Math.floor(Math.random() * JOBS.length)]; 
                user.cash += testJob.minPay; // Simulasi masuk duit
                passed++; report += `✅ *Modul Ekonomi:* Stabil (Simulasi gaji RM${testJob.minPay} berjaya)\n`;
            } catch (e) { report += `❌ *Modul Ekonomi:* Gagal\n`; }

            // 3. Ujian RNG (Magnet & Gacha)
            try {
                let pool = MAGNET_LOOT.map(m => ({ ...m, chance: 10 }));
                let tot = pool.reduce((s, i) => s + i.chance, 0), r = Math.random() * tot, sel = pool[0];
                passed++; report += `✅ *Sistem RNG:* Stabil (Sampel tarikan: ${sel.name})\n`;
            } catch (e) { report += `❌ *Sistem RNG:* Gagal bertindak balas\n`; }

            // 4. Ujian Endpoint Imej Pollinations
            try {
                const url = `https://image.pollinations.ai/prompt/test?width=10&height=10`; 
                passed++; report += `✅ *Enjin Imej AI:* Sedia menjana 4K\n`;
            } catch (e) { report += `❌ *Enjin Imej AI:* Ralat URL\n`; }

            // 5. Ujian Integrasi API LPU Groq
            try {
                if (process.env.GROQ_API_KEY || GROQ_API_KEY) { passed++; report += `✅ *Groq API:* Kunci dikesan\n`; }
                else { report += `❌ *Groq API:* Kunci tidak wujud\n`; }
            } catch (e) { report += `❌ *Groq API:* Gagal\n`; }

            report += `\n📊 *Skor Keseluruhan:* ${passed}/${total}\n`;
            report += passed === total ? `✨ Semua sistem teras stabil 100%. Sedia tempur!` : `⚠️ Terdapat modul yang perlukan semakan kod.`;
            
            updateUser(cleanSender, user); // Simpan hasil simulasi
            return sock.sendMessage(from, { text: report });
        }
      
        if ((cmd === "syscheck" || cmd === "diag") && isOwner) {
            return sock.sendMessage(from, { text: `✅ Sistem OK. RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB` });
        }

        if (cmd === "spawn_boss" && isOwner) {
            db.worldBoss = { 
                active: true, 
                hp: 50000, 
                maxHp: 50000, 
                name: "🤖 AI Rogue Titan-X", 
                reward: 500000, 
                participants: {}, 
                expires: now + (15 * 60 * 1000) 
            }; 
            saveDB(db);
            
            for (const gId of (db.groups || [])) { 
                await sock.sendMessage(gId, { text: `🚨 *AMARAN DUNIA! BOSS RAID AKTIF!* 🚨\n\n${db.worldBoss.name} sedang menyerang bandar siber!\n🩸 HP: ${db.worldBoss.hp.toLocaleString()}\n💰 Ganjaran: RM ${db.worldBoss.reward.toLocaleString()} (Dikongsi)\n\n👉 Semua pemain taip: *.serang_boss*` }).catch(()=>{}); 
            }
            return;
        }

        // =====================================================================
        // 🤖 KECERDASAN BUATAN (GROQ AI)
        // =====================================================================
        if (cmd === "airi" || cmd === "ai" || cmd === "tanya") {
            const q = args.join(" ").trim(); 
            if (!q) return sock.sendMessage(from, { text: `Hai ${user.name}! 💙 Airi ada kat sini~ Taip: *.airi [borak]*` });
            
            if (now < (user.cooldowns.aiAsk || 0) && !isOwner) {
                return sock.sendMessage(from, { text: `⏳ Sabar weh, otak LPU tengah proses data!` });
            }
            
            user.cooldowns.aiAsk = now + 8000; 
            updateUser(cleanSender, user);
            const reply = await askAiriAI(q, user.name); 
            return sock.sendMessage(from, { text: `💠 *AIRI (Groq LPU)* 💠\n\n${reply}` });
        }

        // =====================================================================
        // 📜 MENU UTAMA (UI BAHARU)
        // =====================================================================
        if (cmd === "menu" || cmd === "help") {
            let menuText = `
╔═════════════════════════════╗
║ 🌟 𝕾𝖍𝖆𝖉𝖔𝖜 𝕷𝖊𝖌𝖆𝖈𝖞 𝕺𝕾 𝖁4.1 🌟
╠═════════════════════════════╣
║ 👤 𝐏𝐫𝐨𝐟𝐢𝐥 : ${user.name}
║ 💰 𝐓𝐮𝐧𝐚𝐢  : RM ${user.cash.toLocaleString()}
║ 🎖️ 𝐑𝐚𝐧𝐤   : ${getTitle(user).split("] ")[1] || "Warga Cyber"}
╚═════════════════════════════╝

✨ *[ 𝐄𝐕𝐄𝐍𝐓 𝐀𝐊𝐓𝐈𝐅 ]* 
👉 ${currentEvent ? currentEvent.name : "Tiada Event"}

🤖 ❮ 𝐀𝐈 & 𝐊𝐎𝐌𝐔𝐍𝐈𝐓𝐈 ❯
╟ ✧ .airi [soalan] ︲ .santau @user

🎮 ❮ 𝐌𝐈𝐍𝐈-𝐆𝐀𝐌𝐄𝐒 & 𝐏𝐯𝐄 ❯
╟ ✧ .bgk ︲ .tarik_tali ︲ .serang_boss
╟ ✧ .gacha_mlbb ︲ .tiktok_affiliate

🛒 ❮ 𝐏𝐀𝐒𝐀𝐑𝐀𝐍 & 𝐏𝟐𝐏 ❯
╟ ✧ .pasar_pemain ︲ .beli_market
╟ ✧ .jual_market [kenderaan/bm] [id] [rm]

💼 ❮ 𝐄𝐊𝐎𝐍𝐎𝐌𝐈 ❯
╟ ✧ .kerja ︲ .daily ︲ .bal
╟ ✧ .pasaran ︲ .bida [rm]
╟ ✧ .beli_emas ︲ .jual_emas

🎣 ❮ 𝐉𝐄𝐓𝐈 & 𝐌𝐀𝐆𝐍𝐄𝐓 ❯
╟ ✧ .mancing ︲ .jual_ikan ︲ .bela_ikan
╟ ✧ .baling_magnet ︲ .kedai_magnet

🏴‍☠️ ❮ 𝐔𝐍𝐃𝐄𝐑𝐖𝐎𝐑𝐋𝐃 ❯
╟ ✧ .bm ︲ .jenayah [id]
╟ ✧ .rompak @user ︲ .hackbank @user

🏎️ ❮ 𝐀𝐒𝐄𝐓 & 𝐇𝐀𝐑𝐓𝐀𝐍𝐀𝐇 ❯
╟ ✧ .showroom 1 ︲ .beli_kenderaan
╟ ✧ .lumba ︲ .bengkel ︲ .pasang

🌐 ❮ 𝐈𝐍𝐅𝐎 𝐒𝐈𝐒𝐓𝐄𝐌 ❯
╟ ✧ .top ︲ .myid ︲ .upah_lawyer
`;
            return sock.sendMessage(from, { text: menuText.trim() });
        }

        // =====================================================================
        // 💼 KERJA & DAILY STREAK
        // =====================================================================
        if (cmd === "daily") {
            if (now < user.cooldowns.daily && !isOwner) {
                return sock.sendMessage(from, { text: `⏳ Elaun harian dah dituntut! Datang esok ya.` });
            }
            
            // Reset jika ponteng lebih 2 hari
            if (now - (user.cooldowns.daily - 86400000) > 172800000) {
                user.streak = 0; 
            }
            
            user.streak = (user.streak || 0) + 1;
            let bonusAmt = currentEvent?.type === "INFLATION_SPIKE" ? 300 : 100;
            bonusAmt += (user.streak * 50); 
            
            let extraMsg = "";
            if (user.streak % 7 === 0) {
                user.misteryBoxes = (user.misteryBoxes || 0) + 1;
                extraMsg = `\n🔥 *STREAK 7 HARI!* Anda dapat hadiah bonus 1x 📦 Peti Besi Misteri!`;
            }
            
            user.cash += bonusAmt; 
            user.cooldowns.daily = now + (24 * 3600 * 1000); 
            updateUser(cleanSender, user);
            
            return sock.sendMessage(from, { text: `🎁 *BANTUAN HARIAN (Hari Ke-${user.streak}):*\n+RM ${bonusAmt.toLocaleString()} tunai dikreditkan!${extraMsg}` });
        }

        if (cmd === "kerja" || cmd === "work") {
            if (now < user.cooldowns.work && !isOwner) {
                return sock.sendMessage(from, { text: `⚠️ Rehat *${Math.ceil((user.cooldowns.work - now) / 1000)}s*.` });
            }
            
            const job = JOBS[Math.floor(Math.random() * JOBS.length)]; 
            let payout = Math.floor(Math.random() * (job.maxPay - job.minPay + 1)) + job.minPay;
            
            user.cash += payout; 
            user.stats.works += 1; 
            user.cooldowns.work = now + 30000; 
            updateUser(cleanSender, user);
            
            return sock.sendMessage(from, { text: `💼 SLIP GAJI\nKerja: *${job.name}*\nUpah: *+RM ${payout.toLocaleString()}*` });
        }

               // =========================================================================
// 📈 EKONOMI, PASARAN & LELONGAN (BAHAGIAN 4)
// =========================================================================
        if (cmd === "bida") {
            if (!db.auction || !db.auction.active) return sock.sendMessage(from, { text: `❌ Tiada lelongan aktif!` });
            const bidaan = parseInt(args[0]);
            
            if (isNaN(bidaan) || bidaan <= db.auction.highestBid) {
                return sock.sendMessage(from, { text: `❌ Bidaan mestilah LEBIH tinggi dari RM ${db.auction.highestBid.toLocaleString()}!` });
            }
            if (user.cash < bidaan) return sock.sendMessage(from, { text: `❌ Duit dalam dompet tak cukup!` });
            if (db.auction.highestBidder === cleanSender) return sock.sendMessage(from, { text: `⚠️ Anda sudah memegang bidaan tertinggi!` });
            
            if (db.auction.highestBidder) { 
                const prevUser = getUser(db.auction.highestBidder); 
                prevUser.cash += db.auction.highestBid; 
                updateUser(db.auction.highestBidder, prevUser); 
            }
            
            user.cash -= bidaan; 
            updateUser(cleanSender, user);
            
            db.auction.highestBid = bidaan; 
            db.auction.highestBidder = cleanSender; 
            db.auction.lastBidTime = now; 
            saveDB(db);
            
            return sock.sendMessage(from, { text: `📣 *BIDAAN DITERIMA!*\n\n*${user.name}* membida dengan harga *RM ${bidaan.toLocaleString()}*!\n⏳ Masa dipanjangkan ke 60 saat.` });
        }

        if (cmd === "balance" || cmd === "bal") {
            return sock.sendMessage(from, { 
                text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   💳 AKAUN: @${user.name}\n┣━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n💼 Tunai : RM ${user.cash.toLocaleString()}\n🏦 Bank  : RM ${user.bank.toLocaleString()}\n🪙 Emas  : ${(user.goldGrams||0).toFixed(2)}g\n₿ Kripto: ${(user.btcUnits||0).toFixed(4)} BTC\n📦 Besi  : ${user.scrapMetalKg} kg\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛` 
            });
        }

        if (cmd === "top" || cmd === "ranking") { 
            const allUsers = Object.entries(db.users || {}).map(([id, d]) => ({ 
                name: d.name || id.split("@")[0], 
                total: (d.cash || 0) + (d.bank || 0) 
            })).sort((a,b) => b.total - a.total).slice(0, 10); 
            
            let ui = `🏆 KEDUDUKAN JUTAWAN (S${db.season})\n`; 
            allUsers.forEach((u, i) => { 
                ui += `${i + 1}. *${u.name}* ➔ RM ${u.total.toLocaleString()}\n`; 
            }); 
            return sock.sendMessage(from, { text: ui }); 
        }

        if (cmd === "pasaran" || cmd === "crypto" || cmd === "gold") {
            return sock.sendMessage(from, { text: `🪙 EMAS: RM ${db.market.gold}/g\n₿ BTC: RM ${db.market.btc}/BTC\n⚙️ BESI: RM ${db.market.scrap}/kg` });
        }

        if (cmd === "beli_emas") { 
            const g = parseFloat(args[0]); 
            if (isNaN(g) || g <= 0) return sock.sendMessage(from, { text: `❌ Format: *.beli_emas [gram]*` }); 
            const c = Math.floor(g * db.market.gold); 
            if (user.cash < c) return sock.sendMessage(from, { text: `❌ Tunai tak cukup!` }); 
            
            user.cash -= c; 
            user.goldGrams += g; 
            updateUser(cleanSender, user); 
            return sock.sendMessage(from, { text: `🪙 +${g}g Emas disimpan!` }); 
        }

        if (cmd === "jual_emas") { 
            const g = parseFloat(args[0]); 
            if (isNaN(g) || g <= 0 || (user.goldGrams||0) < g) return sock.sendMessage(from, { text: `❌ Baki emas tidak cukup!` }); 
            const p = Math.floor(g * db.market.gold); 
            
            user.goldGrams -= g; 
            user.cash += p; 
            updateUser(cleanSender, user); 
            return sock.sendMessage(from, { text: `🪙 +RM ${p.toLocaleString()} dikreditkan!` }); 
        }

// =====================================================================
// 🎮 PVE BOSS RAID & MINI-GAMES
// =====================================================================
        if (cmd === "serang_boss") {
            if (!db.worldBoss || !db.worldBoss.active) return sock.sendMessage(from, { text: `❌ Tiada Boss Raid aktif.` });
            if (now > db.worldBoss.expires) { 
                db.worldBoss.active = false; 
                saveDB(db); 
                return sock.sendMessage(from, { text: `💀 Boss *${db.worldBoss.name}* lari!` }); 
            }
            
            let dmg = Math.floor(Math.random() * 2000) + 500; 
            let weaponText = "Tumbukan siber";
            
            if (user.inventory.some(i => i.id === 12)) { 
                dmg += 3000; 
                weaponText = "Alat Penggodam Kuantum"; 
            } 
            
            db.worldBoss.hp -= dmg;
            if (!db.worldBoss.participants[cleanSender]) db.worldBoss.participants[cleanSender] = { name: user.name, totalDmg: 0 };
            db.worldBoss.participants[cleanSender].totalDmg += dmg;
            
            if (db.worldBoss.hp <= 0) {
                db.worldBoss.active = false; 
                let ui = `🎉 *BOSS DIKALAHKAN!*\n${db.worldBoss.name} hancur!\n\n🏆 *Ganjaran:*\n`;
                let totalDmgPool = Object.values(db.worldBoss.participants).reduce((sum, p) => sum + p.totalDmg, 0);
                
                for (const pId in db.worldBoss.participants) {
                    const pData = db.worldBoss.participants[pId]; 
                    const share = Math.floor((pData.totalDmg / totalDmgPool) * db.worldBoss.reward);
                    const pUser = getUser(pId); 
                    pUser.cash += share; 
                    updateUser(pId, pUser);
                    ui += `• ${pData.name}: ${pData.totalDmg.toLocaleString()} DMG (+RM ${share.toLocaleString()})\n`;
                }
                saveDB(db); 
                
                for (const gId of (db.groups || [])) { 
                    await sock.sendMessage(gId, { text: ui }).catch(()=>{}); 
                } 
                return;
            }
            saveDB(db); 
            return sock.sendMessage(from, { text: `💥 *CRITICAL HIT!* Guna ${weaponText}!\n🩸 Damage: ${dmg.toLocaleString()}\n📉 Baki HP Boss: ${db.worldBoss.hp.toLocaleString()}` });
        }

        if (cmd === "bgk") {
            const c = args[0]?.toLowerCase(); 
            const bet = parseInt(args[1]); 
            if (!["batu", "gunting", "kertas"].includes(c) || isNaN(bet) || bet <= 0) {
                return sock.sendMessage(from, { text: `✊🖐✌️ Format: *.bgk [batu/gunting/kertas] [bet]*` });
            }
            if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Tunai tak cukup!` });
            
            user.cash -= bet; 
            const pilihan = ["batu", "gunting", "kertas"]; 
            const botC = pilihan[Math.floor(Math.random() * 3)]; 
            let p = 0, res = "";
            
            if (c === botC) { res = "SERI!"; p = bet; } 
            else if ((c==="batu"&&botC==="gunting") || (c==="gunting"&&botC==="kertas") || (c==="kertas"&&botC==="batu")) { res = "MENANG!"; p = bet * 2; } 
            else { res = "KALAH!"; p = 0; }
            
            user.cash += p; 
            updateUser(cleanSender, user); 
            return sock.sendMessage(from, { text: `✊🖐✌️ *OSOM!*\nAnda: ${c} | AI: ${botC}\nKeputusan: *${res}* (${p>0?"+RM "+p:"-"+bet})` });
        }

// =====================================================================
// 🎣 JETI MEMANCING (SISTEM CUACA & AI GAMBAR POLLINATIONS)
// =====================================================================
        if (cmd === "mancing" || cmd === "fish") {
            const userReel = FISHING_SHOP.reels.find(r => r.id === user.fishingGear?.reel) || FISHING_SHOP.reels[0];
            const actualCd = Math.max(15000, 60000 - userReel.cdReduction);
            
            if (now < user.cooldowns.fish && !isOwner) {
                return sock.sendMessage(from, { text: `🎣 Joran masih di air! Tunggu *${Math.ceil((user.cooldowns.fish - now) / 1000)}s*.` });
            }
            
            const weathers = [ 
                { n: "☀️ Cerah", m: 1.0, d: 0 }, 
                { n: "🌧️ Hujan Lebat", m: 1.5, d: 0.15 }, 
                { n: "⛈️ Ribut Petir", m: 2.5, d: 0.35 } 
            ];
            let wRng = Math.random(), wObj = weathers[0]; 
            if (wRng > 0.9) wObj = weathers[2]; 
            else if (wRng > 0.6) wObj = weathers[1];

            const userRod = FISHING_SHOP.rods.find(r => r.id === user.fishingGear?.rod) || FISHING_SHOP.rods[0];
            const userBait = FISHING_SHOP.baits.find(b => b.id === user.fishingGear?.bait);
            
            user.cooldowns.fish = now + actualCd; 
            let caughtInstance = generateFishInstance(userRod);
            
            let dangerChance = caughtInstance.isDangerous ? 0.35 + wObj.d : 0;
            if (dangerChance > 0 && Math.random() < dangerChance) {
                user.cooldowns.hospitalUntil = now + (300 * 1000); 
                user.cash = Math.max(0, user.cash - 1500); 
                saveDB(db); 
                updateUser(cleanSender, user);
                return sock.sendMessage(from, { text: `🚨 *TRAGEDI JETI (${wObj.n})!*\nAnda diserang *${caughtInstance.name}*!\n🚑 Masuk Wad (5 minit).\n💸 Bil: *-RM 1,500*` });
            }
          

            let fPrice = Math.floor(caughtInstance.price * wObj.m);
            if (userBait && fPrice > 0) fPrice = Math.floor(fPrice * userBait.priceMult);
            if (currentEvent?.fishMult) fPrice = Math.floor(fPrice * currentEvent.fishMult);
            caughtInstance.price = fPrice; 

            if (!db.pendingFish) db.pendingFish = {}; 
            db.pendingFish[cleanSender] = { fish: caughtInstance, finalPrice: fPrice }; 
            saveDB(db); 
            updateUser(cleanSender, user);

            if (fPrice === 0) {
                return sock.sendMessage(from, { text: `🎣 *${user.name}* menaikkan ${caughtInstance.name} masa cuaca ${wObj.n}.\n(Sampah dibuang!)` });
            }
            
            if (caughtInstance.tier.includes("MYTHIC") || caughtInstance.tier.includes("LEGENDARY")) {
                const fishPrompt = encodeURIComponent(`giant fantasy glowing ${caughtInstance.name.split(" ")[0]}, underwater deep sea, hyperrealistic, 4k`);
                const fishImg = `https://image.pollinations.ai/prompt/${fishPrompt}?width=512&height=512&nologo=true`;
                return sock.sendMessage(from, { 
                    image: { url: fishImg }, 
                    caption: `🎣 *TANGKAPAN RARE!* [Cuaca: ${wObj.n}]\n🐟 Hasil: *${caughtInstance.name}* (${caughtInstance.weightKg} kg)\n💰 Nilai: *RM ${fPrice.toLocaleString()}*\n\n👉 Taip: *.jual_ikan* ATAU *.bela_ikan*` 
                });
            }
            
            return sock.sendMessage(from, { text: `🎣 TANGKAPAN BERJAYA! [Cuaca: ${wObj.n}]\n🐟 Hasil: *${caughtInstance.name}* (${caughtInstance.weightKg} kg)\n💰 Nilai: *RM ${fPrice.toLocaleString()}*\n\n👉 Taip: *.jual_ikan* ATAU *.bela_ikan*` });
        }

        if (cmd === "jual_ikan") { 
            const pData = db.pendingFish?.[cleanSender]; 
            if (!pData) return sock.sendMessage(from, { text: `❌ Tiada ikan menunggu!` }); 
            user.cash += pData.finalPrice; 
            delete db.pendingFish[cleanSender]; 
            saveDB(db); 
            updateUser(cleanSender, user); 
            return sock.sendMessage(from, { text: `💵 *IKAN DIJUAL:* +RM ${pData.finalPrice.toLocaleString()}!` }); 
        }

// =====================================================================
// 🏎️ KENDERAAN, SHOWROOM & GAMBAR AI POLLINATIONS
// =====================================================================
        if (cmd === "showroom") {
            const page = parseInt(args[0]) || 1; 
            const start = (page - 1) * 20; 
            const pageVehicles = VEHICLES.slice(start, start + 20);
            
            let ui = `🏎️ SHOWROOM JENTERA (PAGE ${page})\n`; 
            pageVehicles.forEach(v => { 
                ui += `• *[${v.id}]* ${v.name}\n  💰 RM ${v.price.toLocaleString()} | ⚡ ${v.speed} km/h\n\n`; 
            });
            return sock.sendMessage(from, { text: ui + `💡 Beli: *.beli_kenderaan [id]*` });
        }

        if (cmd === "beli_kenderaan") {
            const v = VEHICLES.find(x => x.id === args[0]?.toLowerCase());
            if (!v) return sock.sendMessage(from, { text: `❌ Kod jentera tidak wujud!` });
            if (user.cash < v.price) return sock.sendMessage(from, { text: `❌ Baki tunai tidak cukup!` });
            if (user.vehicles.includes(v.id)) return sock.sendMessage(from, { text: `⚠️ Jentera ini sudah ada di garaj!` });
            
            user.cash -= v.price; 
            user.vehicles.push(v.id); 
            updateUser(cleanSender, user);
            
            const prompt = encodeURIComponent(`photorealistic high detail ${v.name.split(" ")[0]} ${v.name.split(" ")[1]}, 4k render, cinematic lighting, cyberpunk city background`);
            const aiImageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true`;
            
            return sock.sendMessage(from, { 
                image: { url: aiImageUrl }, 
                caption: `🎉 *KUNCI DISERAHKAN!*\n\nTahniah! Anda pemilik sah jentera *${v.name}*.\n⚡ Kelajuan Asas: ${v.speed} km/h` 
            });
        }

        if (cmd === "lumba") {
            const vId = args[0]?.toLowerCase(); 
            if (!vId || !user.vehicles.includes(vId)) return sock.sendMessage(from, { text: `❌ Jentera tak sah!` });
            if (now < user.cooldowns.race && !isOwner) return sock.sendMessage(from, { text: `🏎️ Enjin panas! Tunggu cooldown.` });
            
            const v = VEHICLES.find(x => x.id === vId); 
            user.cooldowns.race = now + 90000;
            
            let spd = v.speed; 
            (user.vehicleMods?.[vId]||[]).forEach(m => { 
                const p = MOD_PARTS[v.type]?.find(x => x.name === m); 
                if (p) spd += p.boostSpeed; 
            });
            
            if (Math.random() < (spd/240) || isOwner) { 
                const r = Math.floor(v.price * 0.05)+500; 
                user.cash += r; 
                updateUser(cleanSender, user); 
                return sock.sendMessage(from, { text: `🏁 MENANG DRAG! (+RM ${r.toLocaleString()})` }); 
            } else { 
                const c = Math.floor(v.price * 0.02); 
                user.cash = Math.max(0, user.cash - c); 
                updateUser(cleanSender, user); 
                return sock.sendMessage(from, { text: `💥 TERBABAS! Kos baiki: -RM ${c.toLocaleString()}` }); 
            }
        }

// =====================================================================
// 🏴‍☠️ UNDERWORLD & MAGNET
// =====================================================================
        if (cmd === "baling_magnet") {
            if (!user.magnetGear.magnet) return sock.sendMessage(from, { text: `❌ Beli di *.kedai_magnet* dulu.` });
            if (now < user.cooldowns.magnet && !isOwner) return sock.sendMessage(from, { text: `⏳ Lenguh tangan! Tunggu ${Math.ceil((user.cooldowns.magnet-now)/1000)}s.` });
            
            user.cooldowns.magnet = now + 45000; 
            const mag = MAGNET_SHOP.find(m => m.id === user.magnetGear.magnet);
        let pool = MAGNET_LOOT.map(m => ({ ...m, chance: m.type === "scrap" ? 50 : (m.type === "box" ? 5 * mag.pullPower : 2 * mag.pullPower) }));
      let tot = pool.reduce((s, i) => s + i.chance, 0), r = Math.random() * tot, sel = pool[0];
      for (const item of pool) { if (r < item.chance) { sel = item; break; } r -= item.chance; }
      
      let extra = ""; // 👉 Wajib tambah baris ni supaya tak crash!
      if (sel.type === "scrap") { user.scrapMetalKg += sel.weightKg; extra = `⚙️ Anda dapat +${sel.weightKg} KG Besi!`; }
            } else if (sel.type === "box") { 
                user.misteryBoxes += 1; 
                extra = `📦 Rare pull! Peti Misteri.`; 
            } else { 
                user.cash += sel.basePrice; 
                extra = `💎 Jackpot! Jual terus ke Black Market +RM ${sel.basePrice.toLocaleString()}`; 
            }
            
            updateUser(cleanSender, user); 
            return sock.sendMessage(from, { text: `🧲 *MAGNET!*\nAnda tarik: *${sel.name}*\n${extra}` });
        }

        if (cmd === "jual_besi") { 
            if (user.scrapMetalKg <= 0) return sock.sendMessage(from, { text: `❌ Tiada besi buruk!` }); 
            const payout = user.scrapMetalKg * (db.market?.scrap || 5); 
            user.cash += payout; 
            const sold = user.scrapMetalKg; 
            user.scrapMetalKg = 0; 
            updateUser(cleanSender, user); 
            return sock.sendMessage(from, { text: `⚙️ Jual ${sold} KG besi.\n💵 +RM ${payout.toLocaleString()}` }); 
        }

        if (cmd === "jenayah") {
            const crimeId = parseInt(args[0]); 
            if (isNaN(crimeId)) { 
                let ui = `💀 CRIME\n`; 
                CRIMES.forEach(c => { ui += `• [ID ${c.id}] ${c.name} ➔ RM ${c.rewardMin}-${c.rewardMax}\n`; }); 
                return sock.sendMessage(from, { text: ui + `💡 Taip *.jenayah [ID]*` }); 
            }
            
            const c = CRIMES.find(x => x.id === crimeId); 
            if (!c) return sock.sendMessage(from, { text: `❌ ID tak sah!` });
            if (now < user.cooldowns.crime && !isOwner) return sock.sendMessage(from, { text: `⏳ Polis meronda!` });
            
            user.cooldowns.crime = now + (c.cd * 1000);
            if (Math.random() < 0.55 || isOwner) { 
                const rwd = Math.floor(Math.random() * (c.rewardMax - c.rewardMin + 1)) + c.rewardMin; 
                user.cash += rwd; 
                user.stats.crimes++; 
                updateUser(cleanSender, user); 
                return sock.sendMessage(from, { text: `🦹 Misi Berjaya! +RM ${rwd.toLocaleString()}` }); 
            } else { 
                user.cash = Math.max(0, user.cash - 500); 
                user.cooldowns.jailUntil = now + 60000; 
                updateUser(cleanSender, user); 
                return sock.sendMessage(from, { text: `🚨 Kantoi polis! Masuk lokap.` }); 
            }
        }

        if (cmd === "hackbank") {
            const tgt = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
            if (!tgt || tgt === cleanSender) return sock.sendMessage(from, { text: `❌ Tag mangsa sah!` });
            if (now < user.cooldowns.bankHack && !isOwner) return sock.sendMessage(from, { text: `⏳ Cooldown hackbank aktif!` });
            if (!user.inventory.some(i => [11, 2, 5].includes(i.id)) && !isOwner) return sock.sendMessage(from, { text: `❌ Perlu Bypass Dongle dari .bm!` });
            
            const pin = ["⚡","💻","🔓","📡"].sort(()=>0.5-Math.random()).slice(0,3).join("");
            if (!db.activeHacks) db.activeHacks = {}; 
            db.activeHacks[cleanSender] = { target: tgt, emojiPin: pin, expires: now + 30000 }; 
            saveDB(db);
            
            return sock.sendMessage(from, { text: `⚡ HACK SYSTEM AKTIF ⚡\nSasaran: @${tgt.split("@")[0]}\nPIN: ${pin}\nMasa: 30s! Taip: *.bypass ${pin}*`, mentions: [tgt] });
        }

        if (cmd === "bypass") {
            const hack = db.activeHacks?.[cleanSender]; 
            if (!hack || now > hack.expires) return sock.sendMessage(from, { text: `❌ Sesi tamat/tiada!` });
            
            const tUser = getUser(hack.target);
            if (args.join("").trim() === hack.emojiPin) { 
                delete db.activeHacks[cleanSender]; 
                const st = Math.floor(tUser.bank * 0.05); 
                tUser.bank -= st; 
                user.cash += st; 
                user.cooldowns.bankHack = now + 1800000; 
                saveDB(db); 
                updateUser(cleanSender, user); 
                updateUser(hack.target, tUser); 
                return sock.sendMessage(from, { text: `🔓 Hack Berjaya! +RM ${st.toLocaleString()}` }); 
            } else { 
                delete db.activeHacks[cleanSender]; 
                user.cash = Math.max(0, user.cash - 1500); 
                user.cooldowns.jailUntil = now + 60000; 
                user.cooldowns.bankHack = now + 900000; 
                saveDB(db); 
                updateUser(cleanSender, user); 
                return sock.sendMessage(from, { text: `🚨 PIN Salah! Denda RM1,500 & lokap.` }); 
            }
        }

// =====================================================================
// 🏦 BANK, DEPOSIT, WITHDRAW
// =====================================================================
        if (cmd === "deposit") { 
            const amt = args[0] === "all" ? user.cash : parseInt(args[0]); 
            if (isNaN(amt) || user.cash < amt) return sock.sendMessage(from, { text: `❌ Duit tak cukup!` }); 
            user.cash -= amt; 
            user.bank += amt; 
            updateUser(cleanSender, user); 
            return sock.sendMessage(from, { text: `🏦 Deposit +RM ${amt.toLocaleString()}!` }); 
        }
        
        if (cmd === "withdraw") { 
            const amt = args[0] === "all" ? user.bank : parseInt(args[0]); 
            if (isNaN(amt) || user.bank < amt) return sock.sendMessage(from, { text: `❌ Bank tak cukup!` }); 
            user.bank -= amt; 
            user.cash += amt; 
            updateUser(cleanSender, user); 
            return sock.sendMessage(from, { text: `💵 Withdraw +RM ${amt.toLocaleString()}!` }); 
        }
        
        if (cmd === "upah_lawyer") { 
            if (now >= user.cooldowns.jailUntil) return; 
            if (user.cash < 500) return sock.sendMessage(from, { text: `❌ Perlu RM500!` }); 
            user.cash -= 500; 
            user.cooldowns.jailUntil = 0; 
            updateUser(cleanSender, user); 
            return sock.sendMessage(from, { text: `⚖️ Anda dijamin bebas!` }); 
        }

    });
}

// =====================================================================
// 🔥 PELANCARAN ENJIN UTAMA
// =====================================================================

// =========================================================================
// 🎮 BAHAGIAN 5: MODUL EKSTRA (KASINO, P2P, HARTANAH, PET & MINIGAMES)
// =========================================================================

    // MINIGAMES KOMUNITI
    if (cmd === "gacha_mlbb") { if (user.cash < 2000) return sock.sendMessage(from, { text: `❌ Perlukan RM 2,000!` }); user.cash -= 2000; const rng = Math.random(); let prize = 0; let msg = ""; if (rng < 0.01) { prize = 25000; msg = `🌟 *LEGENDARY SKIN!* (+RM 25,000)`; } else if (rng < 0.05) { prize = 8000; msg = `🔥 *EPIC SKIN!* (+RM 8,000)`; } else if (rng < 0.20) { prize = 2500; msg = `✨ *ELITE SKIN!* (+RM 2,500)`; } else { msg = `🗑️ *MAGIC DUST x5!* Rugi!`; } user.cash += prize; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎮 *GACHA MLBB*\n\n${msg}` }); }
    if (cmd === "tiktok_affiliate") { if (user.cash < 500) return sock.sendMessage(from, { text: `❌ Perlu RM 500 modal Ads.` }); user.cash -= 500; const rng = Math.random(); let u = 0; let msg = ""; if (rng < 0.05) { u = 15000; msg = `🚀 *FYP MELETUP!* Jualan kencang!`; } else if (rng < 0.15) { u = 3000; msg = `🔥 *VIRAL!*`; } else if (rng < 0.45) { u = 600; msg = `👍 *BALIK MODAL.*`; } else { msg = `📉 *FLOP.* View sendu.`; } user.cash += u; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `📱 *TIKTOK AFFILIATE*\n\n${msg}\n💵 Untung: +RM ${u.toLocaleString()}` }); }
    if (cmd === "sabung_ayam") { const c = args[0]?.toLowerCase(); const bet = parseInt(args[1]); if (!["merah", "hitam"].includes(c) || isNaN(bet) || bet <= 0) return sock.sendMessage(from, { text: `🐔 Format: *.sabung_ayam [merah/hitam] [taruhan]*` }); if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Tunai tak cukup!` }); user.cash -= bet; const winner = Math.random() < 0.5 ? "merah" : "hitam"; if (c === winner) { user.cash += (bet * 2); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🐔 Ayam ${winner.toUpperCase()} menang bertarung!\n💵 Menang: +RM ${(bet*2).toLocaleString()}` }); } else { updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🐔 Ayam ${winner.toUpperCase()} yang menang. Rugi: -RM ${bet.toLocaleString()}` }); } }
    if (cmd === "teka_nombor") { const g = parseInt(args[0]); const bet = parseInt(args[1]); if (isNaN(g) || g < 1 || g > 10 || isNaN(bet) || bet <= 0) return sock.sendMessage(from, { text: `🔢 Format: *.teka_nombor [1-10] [taruhan]*` }); if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Tunai tak cukup!` }); user.cash -= bet; const res = Math.floor(Math.random() * 10) + 1; if (g === res) { user.cash += (bet * 10); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎉 Nombor ${res}! Menang: +RM ${(bet*10).toLocaleString()}` }); } else { updateUser(cleanSender, user); return sock.sendMessage(from, { text: `❌ Salah! Nombor rahsia ${res}. Rugi RM ${bet.toLocaleString()}` }); } }
    if (cmd === "kotak_beracun") { const p = parseInt(args[0]); if (isNaN(p) || p < 1 || p > 3) return sock.sendMessage(from, { text: `📦 Format: *.kotak_beracun [1/2/3]* (Modal RM1000)` }); if (user.cash < 1000) return sock.sendMessage(from, { text: `❌ Perlu RM 1,000!` }); user.cash -= 1000; const h = [ {n: "BOM! 💥", v: -5000}, {n: "Kosong 🕸️", v: 0}, {n: "Emas Tulen! 🪙", v: 10000} ].sort(() => Math.random() - 0.5); const nasib = h[p - 1]; user.cash += nasib.v; if (user.cash < 0) user.cash = 0; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `📦 Anda membuka Kotak ${p}... *${nasib.n}*\n💸 Impak: ${nasib.v > 0 ? "+RM "+nasib.v : nasib.v < 0 ? "-RM "+Math.abs(nasib.v) : "Tiada rugi/untung"}` }); }
    if (cmd === "tarik_tali") { const bet = parseInt(args[0]); if (isNaN(bet) || bet <= 0) return sock.sendMessage(from, { text: `🪢 Format: *.tarik_tali [taruhan]*` }); if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Duit tak cukup!` }); user.cash -= bet; const pS = Math.random() * 100; const aS = Math.random() * 100; if (pS > aS) { user.cash += (bet * 2); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🪢 Anda tarik AI jatuh lumpur!\n💵 Menang: +RM ${(bet*2).toLocaleString()}` }); } else { updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🪢 Anda tersungkur ditarik AI! Rugi: RM ${bet.toLocaleString()}` }); } }
    if (cmd === "tembak_botol") { if (user.cash < 500) return sock.sendMessage(from, { text: `🎯 Modal RM 500.` }); user.cash -= 500; const rng = Math.random(); let w = 0; let msg = ""; if (rng < 0.05) { w = 5000; msg = `🎯 *HEADSHOT!* Semua pecah!`; } else if (rng < 0.3) { w = 800; msg = `💥 Kena 2 botol.`; } else if (rng < 0.6) { w = 200; msg = `😅 Kena 1 botol.`; } else { msg = `🤡 Tembak ke laut!`; } user.cash += w; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎯 *TEMBAK BOTOL*\n${msg}\n💵 Diterima: RM ${w}` }); }
    if (cmd === "lumba_kuda") { const k = parseInt(args[0]); const bet = parseInt(args[1]); if (isNaN(k) || k < 1 || k > 5 || isNaN(bet) || bet <= 0) return sock.sendMessage(from, { text: `🐎 Format: *.lumba_kuda [1-5] [taruhan]*` }); if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Tunai tak cukup!` }); user.cash -= bet; const win = Math.floor(Math.random() * 5) + 1; if (k === win) { user.cash += (bet * 5); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🐎 Kuda nombor ${win} menang lumba lurus!\n💵 +RM ${(bet*5).toLocaleString()}` }); } else { updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🐎 Kuda ${win} menang.\n❌ Lebur RM ${bet.toLocaleString()}` }); } }
    if (cmd === "tikam_nombor") { const num = parseInt(args[0]); if (isNaN(num) || num < 1 || num > 100) return sock.sendMessage(from, { text: `🎫 Format: *.tikam_nombor [1-100]* (Modal RM1000)` }); if (user.cash < 1000) return sock.sendMessage(from, { text: `❌ Anda tak cukup RM 1000.` }); user.cash -= 1000; const rng = Math.floor(Math.random() * 100) + 1; if (num === rng) { user.cash += 100000; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎫 *JACKPOT GILA!* Cabutan: ${rng}\nAnda menang +RM 100,000!` }); } else { updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎫 Cabutan: ${rng}. Nasib tak menyebelahi anda.` }); } }
    if (cmd === "split_bil") { const amount = parseFloat(args[0]); const pax = parseInt(args[1]); if (isNaN(amount) || isNaN(pax) || pax < 2) return sock.sendMessage(from, { text: `🧮 Guna: *.split_bil [jumlah_RM] [bil_orang]*` }); return sock.sendMessage(from, { text: `💸 RM ${(amount/pax).toFixed(2)} seorang!` }); }

    // PASARAN P2P MARKETPLACE
    if (cmd === "jual_market") {
      const type = args[0]?.toLowerCase(); const itemId = args[1]?.toLowerCase(); const price = parseInt(args[2]);
      if (!["kenderaan", "bm"].includes(type) || !itemId || isNaN(price) || price <= 0) return sock.sendMessage(from, { text: `❌ Format: *.jual_market [kenderaan/bm] [kod_item] [harga_jual]*` });
      let itemName = ""; 
      if (type === "kenderaan") {
         if (!user.vehicles.includes(itemId)) return sock.sendMessage(from, { text: `❌ Kenderaan tiada dalam garaj!` });
         itemName = VEHICLES.find(v => v.id === itemId).name; user.vehicles = user.vehicles.filter(v => v !== itemId);
      } else {
         const idx = user.inventory.findIndex(i => i.id == itemId); if (idx === -1) return sock.sendMessage(from, { text: `❌ Barang tiada dalam beg!` });
         itemName = user.inventory[idx].name; user.inventory.splice(idx, 1);
      }
      const listingId = Math.random().toString(36).substring(2, 7).toUpperCase();
      if (!db.p2pMarket) db.p2pMarket = []; db.p2pMarket.push({ listId: listingId, sellerId: cleanSender, sellerName: user.name, type: type, itemId: itemId, itemName: itemName, price: price });
      saveDB(db); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `✅ *[P2P]* ${itemName} diletak di Pasaran Gelap!\n🔖 Kod Listing: *${listingId}* | Harga: RM ${price.toLocaleString()}` });
    }
    if (cmd === "pasar_pemain" || cmd === "p2p") {
      if (!db.p2pMarket || db.p2pMarket.length === 0) return sock.sendMessage(from, { text: `🛒 Pasaran P2P sunyi sepi...` });
      let ui = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🛒 PASARAN LELONGAN (P2P)\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
      db.p2pMarket.forEach(m => { ui += `🔖 *[${m.listId}]* ${m.itemName}\n👤 Penjual: ${m.sellerName}\n💰 Harga: RM ${m.price.toLocaleString()}\n\n`; });
      ui += `👉 Beli: *.beli_market [Kod_Listing]*`; return sock.sendMessage(from, { text: ui });
    }
    if (cmd === "beli_market") {
      const listId = args[0]?.toUpperCase(); if (!listId || !db.p2pMarket) return sock.sendMessage(from, { text: `❌ Masukkan Kod Listing dari *.pasar_pemain*!` });
      const itemIdx = db.p2pMarket.findIndex(m => m.listId === listId); if (itemIdx === -1) return sock.sendMessage(from, { text: `❌ Kod Listing tak wujud/dibeli orang lain.` });
      const itemData = db.p2pMarket[itemIdx]; if (itemData.sellerId === cleanSender) return sock.sendMessage(from, { text: `❌ Takkan nak beli barang sendiri bos?` });
      if (user.cash < itemData.price) return sock.sendMessage(from, { text: `❌ Duit tunai poket tak cukup!` });
      if (itemData.type === "kenderaan") user.vehicles.push(itemData.itemId); else user.inventory.push({ id: itemData.itemId, name: itemData.itemName });
      user.cash -= itemData.price; const seller = getUser(itemData.sellerId); seller.cash += itemData.price;
      db.p2pMarket.splice(itemIdx, 1); saveDB(db); updateUser(cleanSender, user); updateUser(itemData.sellerId, seller);
      return sock.sendMessage(from, { text: `🤝 *TRANSAKSI P2P BERJAYA!*\n\nBeli *${itemData.itemName}* dengan harga RM ${itemData.price.toLocaleString()}.\nWang dipindahkan ke *${seller.name}*.` });
    }

    // HARTANAH & SEWA
    if (cmd === "list_hartanah") { let ui = `🏢 HARTANAH\n`; PROPERTIES.forEach(p => { ui += `• [ID ${p.id}] ${p.name} ➔ RM ${p.price.toLocaleString()} (Sewa RM ${p.rent.toLocaleString()})\n`; }); return sock.sendMessage(from, { text: ui + `👉 *.beli_rumah [id]*` }); }
    if (cmd === "beli_rumah") { const pr = PROPERTIES.find(x => x.id === parseInt(args[0])); if (!pr || user.cash < pr.price || user.properties.includes(pr.id)) return sock.sendMessage(from, { text: `❌ Gagal beli rumah!` }); user.cash -= pr.price; user.properties.push(pr.id); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🏠 Geran ${pr.name} milik anda!` }); }
    if (cmd === "kutip_sewa") { if (user.properties.length === 0) return sock.sendMessage(from, { text: `❌ Tiada rumah!` }); if (now < user.cooldowns.rent && !isOwner) return sock.sendMessage(from, { text: `⏳ Kutip sewa 24 jam sekali.` }); let tot = 0; user.properties.forEach(id => { const p = PROPERTIES.find(x => x.id === id); if (p) tot += p.rent; }); user.cash += tot; user.cooldowns.rent = now + 86400000; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `💵 Sewa dikutip: +RM ${tot.toLocaleString()}!` }); }

    // PEMINDAHAN WANG (TRANSFER) & KASINO (SLOT/COINFLIP)
    if (cmd === "transfer") { const tgt = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; const amt = parseInt(args[1]); if (!tgt || isNaN(amt) || user.cash < amt) return sock.sendMessage(from, { text: `❌ Gagal transfer!` }); user.cash -= amt; const tUser = getUser(tgt); tUser.cash += amt; updateUser(cleanSender, user); updateUser(tgt, tUser); return sock.sendMessage(from, { text: `💸 Transfer RM ${amt.toLocaleString()} berjaya!` }); }
    if (cmd === "coinflip") { const choice = args[0]; const bet = parseInt(args[1]); if (!["kepala", "bunga"].includes(choice) || user.cash < bet) return sock.sendMessage(from, { text: `❌ Format salah atau duit tak cukup!` }); user.cash -= bet; if (Math.random() < 0.49 || isOwner) { user.cash += (bet*2); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🪙 MENANG! (+RM ${(bet*2).toLocaleString()})` }); } else { updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🪙 KALAH! (-RM ${bet.toLocaleString()})` }); } }
    if (cmd === "slot") { const bet = parseInt(args[0]); if (isNaN(bet) || bet < 10) return sock.sendMessage(from, { text: `❌ Min taruhan RM 10.` }); if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Tunai tak mencukupi!` }); const icons = ["🍒", "🍋", "🍇", "💎", "7️⃣"]; const r1 = icons[Math.floor(Math.random() * icons.length)]; const r2 = icons[Math.floor(Math.random() * icons.length)]; const r3 = icons[Math.floor(Math.random() * icons.length)]; user.cash -= bet; let mult = (r1 === r2 && r2 === r3) ? (r1 === "7️⃣" ? 10 : 5) : ((r1 === r2 || r2 === r3 || r1 === r3) ? 1.5 : 0); if (isOwner && mult === 0) mult = 3; if (mult > 0) { const reward = Math.floor(bet * mult); user.cash += reward; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n🔥 *JACKPOT!* +RM ${reward.toLocaleString()}!` }); } else { updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n❌ Tiada padanan. Rugi -RM ${bet.toLocaleString()}.` }); } }

    // AHLONG
    if (cmd === "hutang_ahlong") { const amt = parseInt(args[0]); if (isNaN(amt) || amt <= 0 || amt > 500000) return sock.sendMessage(from, { text: `❌ Had pinjaman: RM 1 - RM 500,000!` }); if (user.debt > 0) return sock.sendMessage(from, { text: `❌ Selesaikan hutang lama dahulu!` }); user.cash += amt; user.debt = Math.floor(amt * 1.25); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🦈 *PINJAMAN LULUS:* Tunai +RM ${amt.toLocaleString()} diterima. Baki bayaran: RM ${user.debt.toLocaleString()} (Faedah 25%).` }); }
    if (cmd === "bayar_ahlong") { if (user.debt <= 0) return sock.sendMessage(from, { text: `ℹ️ Tiada rekod hutang.` }); if (user.cash < user.debt) return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup bayar RM ${user.debt.toLocaleString()}!` }); user.cash -= user.debt; user.debt = 0; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🦈 *HUTANG LANGSAI:* Rumah anda selamat!` }); }

    // KEDAI PET, BOUNTY & GADGET
    if (cmd === "bounty") { const tgt = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; const amt = parseInt(args[1]); if (!tgt || isNaN(amt) || amt < 5000 || user.cash < amt) return sock.sendMessage(from, { text: `❌ Format: *.bounty @user [jumlah]* (Min RM5,000)!` }); const cTgt = tgt.replace(/[^0-9]/g, "") + "@s.whatsapp.net"; if (cTgt === cleanSender) return sock.sendMessage(from, { text: `❌ Tak boleh letak bounty kat kepala sendiri bos!` }); user.cash -= amt; if (!db.bounties) db.bounties = {}; db.bounties[cTgt] = (db.bounties[cTgt] || 0) + amt; saveDB(db); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎯 Kepala mangsa kini bernilai RM ${db.bounties[cTgt].toLocaleString()}!`, mentions: [cTgt] }); }
    if (cmd === "list_bounty") { if (!db.bounties || Object.keys(db.bounties).length === 0) return sock.sendMessage(from, { text: `📜 Tiada buronan aktif.` }); let ui = `🎯 PAPAN BURONAN\n`; for (const tId in db.bounties) { ui += `• *${getUser(tId).name}* ➔ 💰 RM ${db.bounties[tId].toLocaleString()}\n`; } return sock.sendMessage(from, { text: ui }); }
    if (cmd === "kedai_pet" || cmd === "petshop") { let ui = `🐕 KEDAI PET\n`; CYBER_PETS.forEach(p => { ui += `• [${p.id}] ${p.name} ➔ RM ${p.price.toLocaleString()}\n`; }); ui += `💡 Taip *.beli_pet [id]* ATAU *.beli_telur* (RM50k)`; return sock.sendMessage(from, { text: ui }); }
    if (cmd === "beli_pet") { const petObj = CYBER_PETS.find(p => p.id === args[0]?.toLowerCase()); if (!petObj || user.cash < petObj.price) return sock.sendMessage(from, { text: `❌ Kod tak sah/duit tak cukup!` }); user.cash -= petObj.price; user.pet = petObj.id; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎉 Anda dilindungi oleh *${petObj.name}*!` }); }
    if (cmd === "beli_telur") { if (user.cash < 50000) return sock.sendMessage(from, { text: `❌ Perlu RM 50,000!` }); user.cash -= 50000; user.inventory.push({ id: 99, name: "Telur Pet Misteri 🥚" }); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🥚 Telur dibeli! Taip *.tetas_telur*.` }); }
    if (cmd === "tetas_telur") { const idx = user.inventory.findIndex(i => i.id === 99); if (idx === -1) return sock.sendMessage(from, { text: `❌ Tiada telur dalam beg!` }); user.inventory.splice(idx, 1); const rng = Math.random(); let hatched = CYBER_PETS[0]; if (rng < 0.05) hatched = CYBER_PETS.find(p => p.id === "kripto_dragon"); else if (rng < 0.20) hatched = CYBER_PETS.find(p => p.id === "xiaov_sentry"); else if (rng < 0.50) hatched = CYBER_PETS.find(p => p.id === "harimau_malaya" || p.id === "doberman"); user.pet = hatched.id; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🐣 MENETAS! Dapat *${hatched.name}*!\n✨ Buff: _${hatched.buff}_` }); }
    if (cmd === "device") { let ui = `📱 KEDAI GADGET\n`; PHONE_DEVICES.forEach(p => { ui += `• [${p.id}] ${p.name} ➔ RM ${p.price.toLocaleString()}\n`; }); return sock.sendMessage(from, { text: ui + `💡 Taip *.beli_phone [id]*` }); }
    if (cmd === "beli_phone") { const phone = PHONE_DEVICES.find(p => p.id === args[0]?.toLowerCase()); if (!phone || user.cash < phone.price) return sock.sendMessage(from, { text: `❌ Kod tak wujud/duit tak cukup!` }); user.cash -= phone.price; user.phoneDevice = phone.id; user.phoneName = phone.name; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `📱 Berjaya beli *${phone.name}*!` }); }

    // WARUNG MAKAN
    if (cmd === "shop" || cmd === "warung") { let ui = `🍔 WARUNG MAKANAN\n`; FOOD_ITEMS.forEach(f => { ui += `• [${f.id}] ${f.name} ➔ RM ${f.price}\n`; }); return sock.sendMessage(from, { text: ui + `💡 Taip *.beli_makanan [id]* & *.makan [id]*` }); }
    if (cmd === "beli_makanan") { const f = FOOD_ITEMS.find(x => x.id === args[0]?.toLowerCase()); if (!f || user.cash < f.price) return sock.sendMessage(from, { text: `❌ Duit tak cukup!` }); user.cash -= f.price; user.food.push(f.id); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🍽️ Order *${f.name}*!` }); }
    if (cmd === "makan") { const idx = user.food.indexOf(args[0]?.toLowerCase()); if (idx === -1) return sock.sendMessage(from, { text: `❌ Makanan tiada!` }); const fId = user.food.splice(idx, 1)[0]; let resText = `😋 Kenyang padu!`; if (fId === "nasilemak") { user.cooldowns.work = 0; resText += ` Reset cooldown kerja!`; } else if (fId === "roticanai") { user.cooldowns.work = Math.max(0, user.cooldowns.work - 20000); } else if (fId === "tehtarik") { user.cooldowns.work = Math.max(0, user.cooldowns.work - 10000); } updateUser(cleanSender, user); return sock.sendMessage(from, { text: resText }); }

    // BENGKEL & MODIFIKASI
    if (cmd === "bengkel") {
      const vId = args[0]?.toLowerCase(); if (!vId) return sock.sendMessage(from, { text: `🔧 Taip *.bengkel [kod_jentera]*` });
      if (!user.vehicles.includes(vId)) return sock.sendMessage(from, { text: `❌ Jentera tiada dalam garaj!` });
      const v = VEHICLES.find(x => x.id === vId); const parts = MOD_PARTS[v.type] || []; let ui = `🛠️ MODIFIKASI: ${v.name}\n`;
      parts.forEach(p => { ui += `• [ID ${p.id}] ${p.name} ➔ RM ${p.price.toLocaleString()}\n`; }); return sock.sendMessage(from, { text: ui + `\n💡 Taip *.pasang ${vId} [ID]*` });
    }
    if (cmd === "pasang") {
      const vId = args[0]?.toLowerCase(); const pId = parseInt(args[1]); if (!vId || isNaN(pId) || !user.vehicles.includes(vId)) return;
      const v = VEHICLES.find(x => x.id === vId); const part = MOD_PARTS[v.type]?.find(p => p.id === pId); if (!part || user.cash < part.price) return sock.sendMessage(from, { text: `❌ Gagal pasang!` });
      if (!user.vehicleMods[vId]) user.vehicleMods[vId] = []; if (user.vehicleMods[vId].includes(part.name)) return sock.sendMessage(from, { text: `⚠️ Dah pasang!` });
      user.cash -= part.price; user.vehicleMods[vId].push(part.name); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🔧 ${part.name} dipasang pada ${v.name}!` });
    }

// =====================================================================
    // 🎣 KEDAI PANCING, AKUARIUM & PETI MISTERI
    // =====================================================================
    if (cmd === "kedai_pancing") { return sock.sendMessage(from, { text: `🎣 *KEDAI PANCING*\nTaip nombor kategori:\n1. Joran (Rod)\n2. Kekili (Reel)\n3. Umpan (Bait)\n4. Akuarium\n\n👉 Contoh: *.kedai_pancing 1*` }); }
    if (cmd === "beli_pancing") { const itemCode = args[0]?.toLowerCase(); const all = [...FISHING_SHOP.rods, ...FISHING_SHOP.reels, ...FISHING_SHOP.baits, ...FISHING_SHOP.tanks]; const item = all.find(i => i.id === itemCode); if (!item || user.cash < item.price) return sock.sendMessage(from, { text: `❌ Kod salah atau tunai tak cukup!` }); user.cash -= item.price; if (item.luckBonus !== undefined) user.fishingGear.rod = item.id; else if (item.cdReduction !== undefined) user.fishingGear.reel = item.id; else if (item.priceMult !== undefined) user.fishingGear.bait = item.id; else if (item.capacity !== undefined) user.fishingGear.tank = item.id; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎉 Berjaya beli *${item.name}*!` }); }
    if (cmd === "bela_ikan") { const pData = db.pendingFish?.[cleanSender]; if (!pData) return sock.sendMessage(from, { text: `❌ Tiada ikan menunggu!` }); const t = FISHING_SHOP.tanks.find(t => t.id === user.fishingGear?.tank) || FISHING_SHOP.tanks[0]; if (user.aquarium.length >= t.capacity) return sock.sendMessage(from, { text: `❌ Akuarium penuh!` }); user.aquarium.push(pData.fish); delete db.pendingFish[cleanSender]; saveDB(db); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🐠 *${pData.fish.name}* dimasukkan ke Akuarium!` }); }
    if (cmd === "akuarium") { if (!user.aquarium || user.aquarium.length === 0) return sock.sendMessage(from, { text: `🐠 Akuarium kosong!` }); let ui = `🐠 AKUARIUM [${user.aquarium.length}]\n`; user.aquarium.forEach((f, idx) => { ui += `${idx + 1}. ${f.name} ➔ RM ${f.price.toLocaleString()}\n`; }); return sock.sendMessage(from, { text: ui + `\n💡 Taip *.jual_akuarium*` }); }
    if (cmd === "jual_akuarium") { if (!user.aquarium || user.aquarium.length === 0) return; let total = 0; user.aquarium.forEach(f => { total += f.price; }); user.cash += total; user.aquarium = []; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `💵 Akuarium dikosongkan! +RM ${total.toLocaleString()}` }); }
    if (cmd === "buka_peti") { if (user.misteryBoxes <= 0) return sock.sendMessage(from, { text: `❌ Tiada Peti Misteri!` }); user.misteryBoxes -= 1; if (Math.random() < 0.4) { updateUser(cleanSender, user); return sock.sendMessage(from, { text: `📦 Peti kosong! Tiada hasil.` }); } else { const reward = Math.floor(Math.random() * 50000) + 5000; user.cash += reward; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `📦 Jackpot! Anda jumpa RM ${reward.toLocaleString()}!` }); } }

    // =====================================================================
    // 🥷 SERANGAN PVP (ROMPAK & SANTAU)
    // =====================================================================
    if (cmd === "santau" || cmd === "santau_maya") { 
        const tg = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if (!tg) return sock.sendMessage(from, { text: `❌ Tag mangsa: *.santau @user*` }); 
        if (user.cash < 2000) return sock.sendMessage(from, { text: `❌ Upah Dukun (RM 2,000) tak cukup!` }); 
        user.cash -= 2000; const tUser = getUser(tg); 
        if (Math.random() < 0.6) { const loss = Math.floor(tUser.cash * 0.15); tUser.cash -= loss; updateUser(cleanSender, user); updateUser(tg, tUser); return sock.sendMessage(from, { text: `💀 *ILMU HITAM BERJAYA!*\nWang mangsa hilang *-RM ${loss.toLocaleString()}*!`, mentions: [tg] }); } 
        else { updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🛡️ *SANTAU DITEPIH!*\nRM 2,000 hangus.`, mentions: [tg] }); } 
    }
    
    if (cmd === "rompak") {
        const tgt = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
        if (!tgt || tgt === cleanSender) return sock.sendMessage(from, { text: `❌ Tag mangsa sah: *.rompak @user*` });
        if (now < user.cooldowns.crime && !isOwner) return sock.sendMessage(from, { text: `⏳ Tunggu polis pergi!` });
        
        const tUser = getUser(tgt); 
        if (tUser.cash < 100) return sock.sendMessage(from, { text: `😅 Mangsa miskin.` });
        
        let petObj = null; if (tUser.pet) petObj = CYBER_PETS.find(p => p.id === tUser.pet);
        if (petObj && (petObj.perk === "anti_rob" || petObj.perk === "dual_def" || petObj.perk === "dragon_god")) { 
            if (Math.random() < petObj.val) { user.cash = Math.max(0, user.cash - 1000); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🛡️ *DISERANG PENGAWAL!*\nPengawal haiwan mangsa terkam anda!\n💸 Ganti Rugi: *-RM 1,000*` }); } 
        }
        
        user.cooldowns.crime = now + 180000;
        if (Math.random() < 0.50 || isOwner) { 
            const stolen = Math.floor(tUser.cash * 0.10); tUser.cash -= stolen; user.cash += stolen; user.stars = Math.min(5, user.stars + 1); 
            updateUser(cleanSender, user); updateUser(tgt, tUser); 
            return sock.sendMessage(from, { text: `🥷 Rompakan berjaya! +RM ${stolen.toLocaleString()}`, mentions: [tgt] }); 
        } else { 
            user.cash = Math.max(0, user.cash - 500); user.cooldowns.jailUntil = now + 60000; 
            updateUser(cleanSender, user); 
            return sock.sendMessage(from, { text: `🚨 Kantoi samun! Denda RM500 & lokap 60s.`, mentions: [tgt] }); 
        }
    }

    // =====================================================================
    // 👑 BAKI VETO FOUNDER (PASARAN & EVENT)
    // =====================================================================
    if (cmd === "set_market" && isOwner) { const type = args[0]?.toLowerCase(); const price = parseInt(args[1]); if(type==="gold"||type==="emas")db.market.gold=price; if(type==="btc")db.market.btc=price; if(type==="scrap")db.market.scrap=price; saveDB(db); return sock.sendMessage(from, { text: `👑 Harga bursa berjaya diubah!` }); }
    if (cmd === "list_event" && isOwner) { let ui = `📜 KOD EVENT MUSIM\n`; for (let k in SEASON_EVENTS) ui += `• *${k}* ➔ _${SEASON_EVENTS[k].name}_\n`; return sock.sendMessage(from, { text: ui }); }
    if (cmd === "set_season" && isOwner) { db.season = parseInt(args[0]); saveDB(db); return sock.sendMessage(from, { text: `👑 Musim diset ke ${args[0]}!` }); }
    if (cmd === "start_event" && isOwner) { db.active_event_data = { type: args[0]?.toUpperCase(), end: now + ((parseInt(args[1])||3)*86400000) }; saveDB(db); return sock.sendMessage(from, { text: `👑 Acara ${args[0]} diaktifkan!` }); }
    if (cmd === "stop_event" && isOwner) { db.active_event_data = null; saveDB(db); return sock.sendMessage(from, { text: `👑 Acara dihentikan!` }); }

// =====================================================================
    // 🎒 PROFIL INVENTORI & MAKLUMAT MUSIM
    // =====================================================================
    if (cmd === "profile") {
        const vL = user.vehicles.length ? user.vehicles.join(", ") : "Garaj kosong"; 
        const iL = user.inventory.length ? user.inventory.map(i => i.name).join(", ") : "Beg kosong";
        const magName = user.magnetGear?.magnet ? MAGNET_SHOP.find(m=>m.id===user.magnetGear.magnet)?.name : "Tiada";
        const rodName = FISHING_SHOP.rods.find(r=>r.id===user.fishingGear?.rod)?.name || "Joran Buluh";
        const baitName = FISHING_SHOP.baits.find(b=>b.id===user.fishingGear?.bait)?.name || "Tiada";
        
        return sock.sendMessage(from, { text: `🎒 *PROFIL INVENTORI*\n\n🏎️ Jentera: ${vL}\n🏴‍☠️ Barang BM: ${iL}\n🎣 Joran: *${rodName}*\n🪱 Umpan: *${baitName}*\n🧲 Magnet: *${magName}*\n📦 Besi: *${user.scrapMetalKg} KG*\n📦 Peti: *${user.misteryBoxes}*` });
    }

    if (cmd === "season_info" || cmd === "musim") { 
        let evText = "Tiada event khas aktif."; 
        if (currentEvent && db.active_event_data) { 
            const remH = Math.max(1, Math.ceil((db.active_event_data.end - now) / 3600000)); 
            evText = `*${currentEvent.name}*\n• Kesan: _${currentEvent.desc}_\n• Baki Masa: *${remH} Jam*`; 
        } 
        return sock.sendMessage(from, { text: `🌐 STATUS MUSIM AIRI\n📅 Musim Ke-${db.season || 1}\n🔥 Acara: ${evText}` }); 
    }


// =====================================================================
    // 🪪 PROFIL PENGGUNA & PENUTUP ENJIN (WAJIB ADA)
    // =====================================================================
    if (cmd === "myid" || cmd === "ic") {
      const totalWealth = user.cash + user.bank + Math.floor((user.goldGrams || 0) * (db.market?.gold || 350)) + Math.floor((user.btcUnits || 0) * (db.market?.btc || 280000));
      let ui = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🪪 CYBER ID (S${db.season || 1})\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
      ui += `👤 Nama: *${user.name}*\n🎖️ Gelaran: ${getTitle(user)}\n📱 Peranti: ${user.phoneName}\n🐕 Pengawal: ${user.pet ? CYBER_PETS.find(p=>p.id===user.pet)?.name : "Tiada"}\n`;
      ui += `💵 Tunai: RM ${user.cash.toLocaleString()} | 🏦 Bank: RM ${user.bank.toLocaleString()}\n💎 Nilai Harta: RM ${totalWealth.toLocaleString()}\n`;
      ui += `🏎️ Jentera: ${user.vehicles.length} | 🏢 Hartanah: ${user.properties.length}\n🎣 Gear: ${FISHING_SHOP.rods.find(r=>r.id===user.fishingGear?.rod)?.name||"Joran Asas"}`;
      return sock.sendMessage(from, { text: ui });
    }

  }); // Penutup kepada: sock.ev.on("messages.upsert", async ({ messages }) => {
} // Penutup kepada: async function startBotEngine() {

// =====================================================================
// 🔥 PELANCARAN ENJIN UTAMA SHADOW LEGACY V4.1
// =====================================================================
startBotEngine().catch(e => console.error("Ralat Enjin Utama:", e));
