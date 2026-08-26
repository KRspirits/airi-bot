// =========================================================================
// 🛡️ ANTI-CRASH SHIELD UNTUK RENDER (FIX STATUS 1 CRASH)
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
import Groq from "groq-sdk"; // 🔥 UPDATE 3.0: TUKAR KE GROQ API
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// =========================================================================
// 👑 0. KUNCI KESELAMATAN FOUNDER MUTLAK (AMAR)
// =========================================================================
const OWNER_NUMBERS = [
  "1166533534",
  "601166533534",
  "38956007690292"
];

let currentQR = "";
let isConnected = false;
let globalChatActivity = 0;

// =========================================================================
// 🤖 1. ENJIN AI SHADOW AIRI (GROQ API - LLAMA 3) - UPDATE 3.0
// =========================================================================
const GROQ_API_KEY = (process.env.GROQ_API_KEY || "LETAK_API_KEY_GROQ_DI_SINI").trim();
const groq = new Groq({ apiKey: GROQ_API_KEY });

async function askAiriAI(promptText, userName = "Warga Cyber") {
  try {
    const currentTimeMY = new Date().toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "full", timeStyle: "medium" });
    const systemInstruction = `Nama kau ialah Airi, maskot AI dan pembantu pintar rasmi bagi komuniti siber "Airi's Corner". Pengasas dan ketua mutlak kau ialah Bos Amar (Shadow Legacy). Waktu semasa MYT: ${currentTimeMY}. Personaliti: Ceria, comel, santai Melayu, kuat bergurau, guna dialek tempatan kadang-kadang (macam 'weh', 'kot', 'lah'). Panggil pengguna dengan nama mereka (${userName}). Jawab ringkas dan padat.`;
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: promptText }
      ],
      model: "llama3-8b-8192", 
      temperature: 0.8,
      max_tokens: 400,
    });
    
    return chatCompletion.choices[0]?.message?.content || "Airi tak pasti nak jawab macam mana hehe~ 💙";
  } catch (err) {
    return "Aduh... sistem LPU Airi tengah overheat sekejap hehe~ 🧠 Cuba jap lagi ya!";
  }
}

// =========================================================================
// 💬 2. BANK VARIASI AYAT NARRATIVE RPG
// =========================================================================
const NARRATIVE_BANKS = {
  RACE_WIN: ["Asap ekzos tinggal kat belakang, jentera meluncur laju macam peluru pandu!", "Pecutan sempurna di garisan penamat!"],
  RACE_CRASH: ["Adoi oversteer teruk dekat selekoh, jentera cium divider!", "Tergolek tepi longkang litar!"],
  CRIME_SUCCESS: ["Langkah licik macam bayang-bayang, hasil rompakan disorok kemas!", "Misi rompakan berjalan lancar tanpa cap jari!"],
  CRIME_BUSTED: ["Kantoi basah di tempat kejadian! Tangan dah kena gari.", "Siren polis memekak satu blok, tak sempat lari!"],
  BANK_HACK_SUCCESS: ["Firewall bank runtuh sekelip mata, duit mangsa disedut bersih!"],
  ROB_SUCCESS: ["Acukan tepat sasaran, mangsa gigil serah duit!", "Rembatan pantas di lorong gelap! dompet mangsa licin."],
  ROB_FAIL_ROAST: ["Niat merompak tapi tangan gigil dompet sendiri tercicir!", "Terpijak kulit pisang masa nak samun, terlentang adeh!"],
  PET_DEFEND: ["Pengawal haiwan melompat terkam perompak sampai koyak seluar!"],
  SANTAU_SUCCESS: ["Jampi mantera siber berjaya meresap! Mangsa muntah paku digital.", "Santau Maya masuk tepat ke dalam sistem mangsa!"],
  SANTAU_FAIL: ["Mantera melantun balik! Firewall mangsa kebal berselawat.", "Dukun siber scam, santau tak jalan!"]
};
function getRandomNarrative(bankKey, fallback = "Aksi selesai.") {
  const bank = NARRATIVE_BANKS[bankKey];
  if (!bank || bank.length === 0) return fallback;
  return bank[Math.floor(Math.random() * bank.length)];
}

// =========================================================================
// 🌐 3. PELAYAN WEB RINGAN UNTUK PAPARAN QR DI RENDER
// =========================================================================
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  if (isConnected) {
    res.end(`<div style="text-align:center;margin-top:60px;font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;"><h2>⚡ AIRI'S CORNER CYBER OS V3.0 ONLINE! ⚡</h2><p>Sistem kebal berjalan mantap.</p></div>`);
  } else if (currentQR) {
    QRCode.toDataURL(currentQR).then(img => {
      res.end(`<div style="text-align:center;margin-top:40px;font-family:sans-serif;background:#0a0f1d;color:#fff;padding:25px;"><h2>⚡ IMBAS KOD QR AIRI ⚡</h2><img src="${img}" style="width:280px;height:280px;border-radius:16px;"/></div>`);
    }).catch(e => res.end("Ralat QR"));
  } else {
    res.end(`<div style="text-align:center;margin-top:80px;color:#fff;font-family:sans-serif;"><h2>⏳ Menjana Kod QR...</h2></div>`);
  }
});
server.listen(PORT, "0.0.0.0", () => { console.log(`🌐 Server aktif pada port ${PORT}`); });

// =========================================================================
// 💾 4. MONGODB CLOUD & FALLBACK LOCAL DB
// =========================================================================
let localDB = { users: {}, groups: [], market: { gold: 350, btc: 280000, scrap: 5, lastUpdate: Date.now() }, season: 1, auction: null, hallOfFame: [] };
const MONGO_URI = process.env.MONGO_URI || "";
let mongoCollection = null;

async function initDB() {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI tiada dalam persekitaran.");
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db("AiriCorner");
    mongoCollection = db.collection("GameData");
    const cloudData = await mongoCollection.findOne({ _id: "MAIN_DATA" });
    if (cloudData) {
      localDB = cloudData.data;
      console.log("✅ MongoDB Berjaya Disambung. Data Cloud Dimuat Turun!");
    } else {
      await mongoCollection.insertOne({ _id: "MAIN_DATA", data: localDB });
      console.log("✅ MongoDB Berjaya Disambung. Pangkalan Data Baru Dicipta!");
    }
  } catch (err) {
    console.error("⚠️ Fallback ke Fail Tempatan (Local JSON):", err.message);
    const DB_FILE = "./database.json";
    if (fs.existsSync(DB_FILE)) localDB = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    else fs.writeFileSync(DB_FILE, JSON.stringify(localDB, null, 2));
  }
}

function loadDB() { return localDB; }
function saveDB(data) {
  localDB = data;
  if (mongoCollection) mongoCollection.updateOne({ _id: "MAIN_DATA" }, { $set: { data: localDB } }, { upsert: true }).catch(e => {});
  else { try { fs.writeFileSync("./database.json", JSON.stringify(data, null, 2)); } catch (err) {} }
}

function getUser(userId, pushName = "") {
  const db = loadDB();
  if (!db.users[userId]) {
    db.users[userId] = {
      name: pushName || "Warga Cyber", bio: "", cash: 500, bank: 0, debt: 0, goldGrams: 0, btcUnits: 0,
      phoneDevice: null, phoneName: "Public Phone Awam 📟", 
      fishingGear: { rod: "rod_buluh", reel: "reel_plastik", bait: null, tank: "tank_balang" },
      magnetGear: { magnet: null },
      scrapMetalKg: 0, 
      misteryBoxes: 0, 
      inventory: [], vehicles: [], vehicleMods: {}, food: [], properties: [], pet: null, aquarium: [], stars: 0, badges: ["🌱 [COMMON] Warga Baru"],
      stats: { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0, bankHacks: 0 },
      cooldowns: { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, magnet: 0, rent: 0, bankHack: 0, aiAsk: 0, hospitalUntil: 0 }
    };
    saveDB(db);
  }
  const u = db.users[userId];
  if (pushName && pushName !== "Warga Cyber" && u.name !== pushName) { u.name = pushName; saveDB(db); }
  
  if (!u.aquarium) u.aquarium = [];
  if (u.pet && typeof u.pet === 'object' && u.pet.id) { u.pet = u.pet.id; saveDB(db); } 
  if (u.nosStock) { delete u.nosStock; saveDB(db); }

  // Migrasi Update 3.0 Data Baru
  if (u.magnetGear === undefined) u.magnetGear = { magnet: null };
  if (u.scrapMetalKg === undefined) u.scrapMetalKg = 0;
  if (u.misteryBoxes === undefined) u.misteryBoxes = 0;
  if (u.cooldowns.magnet === undefined) u.cooldowns.magnet = 0;
  if (u.cooldowns.hospitalUntil === undefined) u.cooldowns.hospitalUntil = 0;
  
  return u;
}

function updateUser(userId, userData) {
  const db = loadDB(); db.users[userId] = userData; saveDB(db);
}

// =========================================================================
// 📈 5. UPDATE PASARAN (TERMASUK HARGA BESI BURUK UPDATE 3.0)
// =========================================================================
setInterval(() => {
  const db = loadDB();
  if (!db.market) db.market = { gold: 350, btc: 280000, scrap: 5, lastUpdate: Date.now() };
  
  const goldChange = (Math.random() * 0.12) - 0.05;
  db.market.gold = Math.max(150, Math.floor(db.market.gold * (1 + goldChange)));
  
  const btcChange = (Math.random() * 0.27) - 0.12;
  db.market.btc = Math.max(80000, Math.floor(db.market.btc * (1 + btcChange)));
  
  const scrapChange = (Math.random() * 0.40) - 0.20;
  db.market.scrap = Math.max(3, Math.min(15, Math.floor(db.market.scrap * (1 + scrapChange))));
  
  db.market.lastUpdate = Date.now(); saveDB(db);
}, 10 * 60 * 1000);

// =========================================================================
// 🌟 6. SISTEM 20 SEASON EVENTS (TERMASUK VETO)
// =========================================================================
const SEASON_EVENTS = {
  "CRIME_BOOM": { name: "🔥 Musim Jenayah Gila", desc: "Loot jenayah naik 2x ganda, tempoh lokap 2x lama!", rewardMult: 2.0, jailMult: 2.0, fineMult: 1.2, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "TECH_SURGE": { name: "💻 Musim Revolusi Siber", desc: "Diskaun Black Market 40%, godam bank lebih pantas!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, hackBoost: 0.20 },
  "ECONOMIC_CRASH": { name: "📉 Musim Kemelesetan Ekonomi", desc: "Gaji kerja halal naik 2x ganda, denda mahkamah 2x!", rewardMult: 0.8, jailMult: 1.2, fineMult: 2.0, jobMult: 2.0, fishMult: 1.0, rentMult: 0.8 },
  "POLICE_CRACKDOWN": { name: "🚔 Musim Ops Cantas Bukit Aman", desc: "Loot jenayah 3x ganda, denda polis 3x ganda jika kantoi!", rewardMult: 3.0, jailMult: 1.5, fineMult: 3.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "GOLD_RUSH": { name: "💰 Musim Gelombang Emas", desc: "Harga jualan ikan pancing naik 2x & hasil kutipan sewa 2x!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.2, fishMult: 2.0, rentMult: 2.0 },
  "UNDERGROUND_RACING": { name: "🏁 Musim Pelesit Litar Malam", desc: "Hadiah drag race naik 2.5x ganda!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 2.5 },
  "INFLATION_SPIKE": { name: "💸 Musim Inflasi Melampau", desc: "Semua barang kedai mahal, tapi elaun harian naik!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.5, jobMult: 1.5, fishMult: 1.5, rentMult: 1.5 },
  "CYBER_ANARCHY": { name: "🏴‍☠️ Musim Anarki Darkweb", desc: "Rompakan PvP sedut 40% tunai poket!", rewardMult: 1.5, jailMult: 0.8, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, pvpSteal: 0.40 },
  "MEGA_HARVEST": { name: "🌊 Musim Badai Laut Dalam", desc: "Peluang dapat ikan Mythic & Epic melonjak naik 3x!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 2.5, rentMult: 1.0 },
  "TYCOON_PARADISE": { name: "🏰 Musim Monopoli Taikun", desc: "Kutipan dividen sewaan hartanah 3x ganda!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 3.0 },
  "INFLASI_SIBER": { name: "💸 Inflasi Siber", desc: "Semua harga kedai & hartanah naik 2x ganda.", rewardMult: 1.0, jailMult: 1.0, fineMult: 2.0, jobMult: 1.5, fishMult: 1.0, rentMult: 1.0 },
  "SUBSIDI_B40": { name: "🎁 Subsidi B40", desc: "Kerja halal memberi elaun bonus tambahan kerajaan.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 3.0, fishMult: 1.0, rentMult: 1.0 },
  "DOUBLE_EXP": { name: "🚀 Double EXP Lumba", desc: "Semua perlumbaan drag memberikan pulangan 3x ganda.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 3.0 },
  "BEAR_MARKET": { name: "📉 Bear Market Emas", desc: "Masa terbaik pelabur beli aset.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "PILIHANRAYA": { name: "🗳️ Pilihanraya Maya", desc: "Bantuan kempen dinaikkan.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 2.0, fishMult: 1.0, rentMult: 1.0 },
  "ZOMBIE_OUTBREAK": { name: "🧟 Zombie Outbreak", desc: "Kerja halal lumpuh. Boleh rompak saja.", rewardMult: 2.0, jailMult: 0.5, fineMult: 1.0, jobMult: 0.1, fishMult: 1.0, rentMult: 0.1 },
  "VIP_ESCORT": { name: "🕶️ Kawalan VIP", desc: "Hukuman lokap dipendekkan drastik.", rewardMult: 1.5, jailMult: 0.1, fineMult: 0.5, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "KEMARAU_PANJANG": { name: "🏜️ Kemarau Ikan", desc: "Harga ikan melambung 500%!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 5.0, rentMult: 1.0 },
  "PEMBERSIHAN_SCAM": { name: "🛑 Pembersihan Siber", desc: "Hacking denda tinggi, jauhi darkweb.", rewardMult: 1.0, jailMult: 3.0, fineMult: 5.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "REVOLUSI_KILANG": { name: "🏭 Revolusi Kilang", desc: "Sewa hartanah menggila 5x ganda.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 5.0 }
};

// =========================================================================
// 🧲 6.5 UPDATE 3.0: SISTEM MAGNET FISHING
// =========================================================================
const MAGNET_SHOP = [
  { id: "mag_speaker", name: "Magnet Speaker Radio Asas 📻", price: 500, pullPower: 1, desc: "Sesuai tarik tin kosong je" },
  { id: "mag_kuat", name: "Magnet Kuat Neodymium 🧲", price: 2500, pullPower: 3, desc: "+Peluang tarik rim lajak" },
  { id: "mag_industri", name: "Magnet Industri Padu 🏗️", price: 12000, pullPower: 6, desc: "+Peluang tarik tong gas & peti" },
  { id: "mag_gergasi", name: "Magnet Gergasi Rare 🛸", price: 45000, pullPower: 12, desc: "Tarikan super, besi sekerap banyak" },
  { id: "mag_elektro", name: "Kren Elektromagnet Pelabuhan 🏗️⚡", price: 150000, pullPower: 25, desc: "Sapu habis dasar sungai! Rate barang rare tinggi" }
];

const MAGNET_LOOT = [
  { name: "Peti Besi Misteri 📦", type: "box", chance: 0.05 },
  { name: "Jam Tangan Shadow Eclipse ⌚", type: "valuable", price: 15000, chance: 0.01 },
  { name: "Smartphone iQOO 12 5G Berkarat 📱", type: "valuable", price: 8500, chance: 0.02 },
  { name: "Gelang Emas Putus 💍", type: "valuable", price: 3500, chance: 0.05 },
  { name: "Kunci Kereta Pendrive 🔑", type: "valuable", price: 500, chance: 0.1 }
];

// =========================================================================
// 🎣 7. KEDAI PERALATAN MEMANCING & DATABASE IKAN (TERMASUK MONSTER V3)
// =========================================================================
const FISHING_SHOP = {
  rods: [
    { id: "rod_buluh", name: "Joran Buluh Kampung 🎋", price: 0, luckBonus: 1.0, desc: "Joran asas" },
    { id: "rod_fiber", name: "Joran Fiberglass Shimano 🎣", price: 1500, luckBonus: 1.3, desc: "+30% Rate" },
    { id: "rod_carbon", name: "Joran Carbon Graphite Pro ⚡", price: 8000, luckBonus: 1.8, desc: "+80% Rate" },
    { id: "rod_titanium", name: "Joran Titanium Deepsea 🌊", price: 35000, luckBonus: 2.5, desc: "+150% Rate" },
    { id: "rod_mythic", name: "Joran Poseidon Cyber-Orbital 🔱", price: 150000, luckBonus: 4.5, desc: "Raja Laut! 4.5x Rate & 0 Sampah" }
  ],
  reels: [
    { id: "reel_plastik", name: "Kekili Plastik Biasa ⚙️", price: 0, cdReduction: 0, desc: "CD 60s" },
    { id: "reel_bearing", name: "Kekili Daiwa 5-Ball Bearing 🟡", price: 1200, cdReduction: 10000, desc: "-10s CD" },
    { id: "reel_magsealed", name: "Kekili MagSealed High-Speed ⚡", price: 6500, cdReduction: 20000, desc: "-20s CD" },
    { id: "reel_electric", name: "Kekili Elektrik Jigging Bionik 🔋", price: 25000, cdReduction: 30000, desc: "-30s CD" },
    { id: "reel_quantum", name: "Kekili Quantum Turbo Spinner 🌌", price: 90000, cdReduction: 40000, desc: "-40s CD" }
  ],
  baits: [
    { id: "umpan_cacing", name: "Umpan Cacing Tanah Segar 🪱", price: 200, priceMult: 1.2, desc: "+20% Harga (Kekal)" },
    { id: "umpan_udang", name: "Umpan Udang Peram Padu 🦐", price: 800, priceMult: 1.5, desc: "+50% Harga (Kekal)" },
    { id: "umpan_cyber", name: "Umpan Sintetik Feromon AI 🧪", price: 3000, priceMult: 2.2, desc: "+120% Harga (Kekal)" },
    { id: "umpan_plasma", name: "Umpan Plasma Neon Luminescence 🌟", price: 10000, priceMult: 3.5, desc: "3.5x Harga (Kekal)" }
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
  { id: "f1", name: "Kasut But Getah Koyak 🥾", basePrice: 0, tier: "🗑️ [JUNK]", weightKg: 1.2, dropRate: 15.0, baseBuff: "Tiada buff", isJunk: true, isDangerous: false },
  { id: "f2", name: "Tayar Kereta Buruk Berlumut 🛞", basePrice: 0, tier: "🗑️ [JUNK]", weightKg: 8.5, dropRate: 10.0, baseBuff: "Tiada buff", isJunk: true, isDangerous: false },
  { id: "f3", name: "Ikan Kembung Segar Pasar 🐟", basePrice: 50, tier: "🌱 [COMMON]", weightKg: 0.4, dropRate: 20.0, baseBuff: "Gaji kerja +2%", isDangerous: false },
  { id: "f4", name: "Ikan Gelama Muara 🐟", basePrice: 50, tier: "🌱 [COMMON]", weightKg: 0.6, dropRate: 18.0, baseBuff: "Gaji kerja +3%", isDangerous: false },
  { id: "f5", name: "Ikan Keli Afrika Bersaiz L 🐡", basePrice: 50, tier: "🌱 [COMMON]", weightKg: 2.1, dropRate: 15.0, baseBuff: "Potong 5s cooldown kerja", isDangerous: false },
  { id: "f6", name: "Udang Galah Sungai Bernilai 🦐", basePrice: 150, tier: "🌿 [UNCOMMON]", weightKg: 0.8, dropRate: 12.0, baseBuff: "Gaji kerja +5%", isDangerous: false },
  { id: "f7", name: "Sotong Kurita Mini 🐙", basePrice: 150, tier: "🌿 [UNCOMMON]", weightKg: 1.5, dropRate: 10.0, baseBuff: "Menang Drag Race +3%", isDangerous: false },
  { id: "f8", name: "Ketam Bunga Segar 🦀", basePrice: 150, tier: "🌿 [UNCOMMON]", weightKg: 0.9, dropRate: 9.0, baseBuff: "Potong 8s cooldown kerja", isDangerous: false },
  { id: "f9", name: "Ikan Siakap Muara Padu 🐠", basePrice: 1000, tier: "⭐ [RARE]", weightKg: 3.8, dropRate: 6.0, baseBuff: "Gaji kerja +8%", isDangerous: false },
  { id: "f10", name: "Ikan Jenahak Merah Laut Dalam 🐡", basePrice: 1000, tier: "⭐ [RARE]", weightKg: 5.2, dropRate: 5.0, baseBuff: "Diskaun denda lokap 10%", isDangerous: false },
  { id: "f11", name: "Pari Gergasi Layang-Layang 🦈", basePrice: 1000, tier: "⭐ [RARE]", weightKg: 14.5, dropRate: 4.0, baseBuff: "Menang Drag Race +6%", isDangerous: false },
  { id: "f12", name: "Ikan Kerapu Bara Monster 🦈", basePrice: 10000, tier: "💼 [EPIC]", weightKg: 18.0, dropRate: 2.5, baseBuff: "Gaji kerja +12%", isDangerous: false },
  { id: "f13", name: "Tuna Sirip Kuning Gred A 🐟", basePrice: 10000, tier: "💼 [EPIC]", weightKg: 35.4, dropRate: 2.0, baseBuff: "Hasil kutipan sewa +10%", isDangerous: false },
  { id: "f14", name: "Ketam Raja Alaska King Crab 🦀", basePrice: 10000, tier: "💼 [EPIC]", weightKg: 8.2, dropRate: 1.5, baseBuff: "Menang Coinflip/Slot +5%", isDangerous: false },
  { id: "f15", name: "Jerung Tukul Pesisir Pantai 🦈", basePrice: 100000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 65.0, dropRate: 0.8, baseBuff: "Loot rompakan PvP +15%", isDangerous: true },
  { id: "f16", name: "Sotong Gergasi Kraken Rahsia 🐙", basePrice: 100000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 110.0, dropRate: 0.5, baseBuff: "Kebal 20% daripada godaman bank", isDangerous: true },
  { id: "f17", name: "Raja Ikan Temoleh Sungai Perak 👑", basePrice: 100000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 42.5, dropRate: 0.3, baseBuff: "Hasil kutipan sewa +20%", isDangerous: false },
  { id: "f18", name: "Ikan Purba Coelacanth Emas 🌟", basePrice: 1500000, tier: "👑 [MYTHIC]", weightKg: 78.0, dropRate: 0.1, baseBuff: "+15% Semua Gaji & Menang Lumba", isDangerous: false },
  { id: "f19", name: "Naga Laut Megalodon Siber 🐉", basePrice: 3500000, tier: "👑 [MYTHIC]", weightKg: 450.0, dropRate: 0.05, baseBuff: "Dewa Laut! +25% Semua Gaji & Sewa", isDangerous: true },
  
  // UPDATE 3.0 LOCAL SPECIES (COMMON/UNCOMMON)
  { id: "f_puyu", name: "Ikan Puyu Sawah 🐟", basePrice: 60, tier: "🌱 [COMMON]", weightKg: 0.2, dropRate: 20.0, baseBuff: "Gaji kerja +2%", isDangerous: false },
  { id: "f_haruan", name: "Ikan Haruan Penyembuh 🐟", basePrice: 180, tier: "🌿 [UNCOMMON]", weightKg: 1.5, dropRate: 12.0, baseBuff: "Kurang risiko lokap 5%", isDangerous: false },
  { id: "f_toman", name: "Toman Bunga Ganas 🐠", basePrice: 1200, tier: "⭐ [RARE]", weightKg: 4.5, dropRate: 6.0, baseBuff: "Gaji kerja +10%", isDangerous: false },
  
  // EPIC / LEGENDARY LOCAL
  { id: "f_kelah", name: "Kelah Merah Mahkota Sungai 🐡", basePrice: 15000, tier: "💼 [EPIC]", weightKg: 6.0, dropRate: 2.0, baseBuff: "Hasil kutipan sewa +12%", isDangerous: false },
  { id: "f_kelisa", name: "Kelisa Emas Arowana 🌟", basePrice: 85000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 2.5, dropRate: 0.8, baseBuff: "Loot rompakan PvP +15%", isDangerous: false },
  
  // MONSTER / MYTHIC (WITH RISKS)
  { id: "f_buaya", name: "Buaya Tembaga Sesat 🐊", basePrice: 120000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 250.0, dropRate: 0.5, baseBuff: "Kebal 20% rompak", isDangerous: true },
  { id: "f_naga", name: "Naga Tasik Chini 🐉", basePrice: 4000000, tier: "👑 [MYTHIC]", weightKg: 850.0, dropRate: 0.02, baseBuff: "Dewa Tasik! +25% Semua Gaji", isDangerous: true }
];

function generateFishInstance(userRodObj) {
  const luck = userRodObj?.luckBonus || 1.0;
  let pool = FISH_DATABASE.map(f => {
    let w = f.dropRate; 
    if (f.isJunk && luck > 1.5) w = Math.max(0, w / luck); 
    if (f.tier === "🌱 [COMMON]" && luck >= 4.0) w = 0; 
    if (!f.isJunk && ["⭐ [RARE]", "💼 [EPIC]", "🏴‍☠️ [LEGENDARY]", "👑 [MYTHIC]"].includes(f.tier)) { w = w * luck; }
    return { ...f, dynamicWeight: w };
  });

  const totalWeight = pool.reduce((sum, item) => sum + item.dynamicWeight, 0);
  let randomNum = Math.random() * totalWeight;
  let selectedBase = FISH_DATABASE[0];
  for (const f of pool) {
    if (randomNum < f.dynamicWeight) { selectedBase = f; break; }
    randomNum -= f.dynamicWeight;
  }

  const sizes = [{ name: "Kecil 🐟", mult: 0.75, kgMult: 0.8 }, { name: "Sederhana 🐠", mult: 1.0, kgMult: 1.0 }, { name: "Besar 🐡", mult: 1.45, kgMult: 1.35 }, { name: "Gergasi 🦈", mult: 2.20, kgMult: 2.0 }];
  const chosenSize = sizes[Math.floor(Math.random() * sizes.length)];
  const finalPrice = selectedBase.isJunk ? 0 : Math.floor(selectedBase.basePrice * chosenSize.mult);
  const finalKg = selectedBase.isJunk ? (selectedBase.weightKg || 1) : Number(((selectedBase.weightKg || 2) * chosenSize.kgMult).toFixed(1));
  const finalName = `${selectedBase.name} (${chosenSize.name})`;

  return { id: selectedBase.id, name: finalName, price: finalPrice, tier: selectedBase.tier, buff: selectedBase.baseBuff, isJunk: selectedBase.isJunk, weightKg: finalKg, isDangerous: selectedBase.isDangerous };
}

// =========================================================================
// 📱 9. KEDAI TELEFON PINTAR (20 MODEL)
// =========================================================================
const PHONE_DEVICES = [
  { id: "nokia3310", name: "Nokia 3310 Sabun 🧱", price: 150, bonus: "Tahan baling anjing! Potong 15% denda polis", perk: "def", val: 0.15 },
  { id: "redmi12", name: "Redmi Note 12 5G 📲", price: 750, bonus: "Multi-tasking basic, gaji kerja halal +5%", perk: "work", val: 0.05 },
  { id: "infinixgt", name: "Infinix GT 20 Pro 🎮", price: 1200, bonus: "Cip bypass charger, potong 15s cooldown kerja", perk: "cd", val: 15000 },
  { id: "poco_f6", name: "POCO F6 Speed Beast ⚡", price: 1800, bonus: "Talaan cip litar, peluang menang drag +7%", perk: "race", val: 0.07 },
  { id: "iqoo12", name: "iQOO 12 Monster Gaming 🐉", price: 3300, bonus: "Skrin 144Hz lancar gila, peluang menang drag +15%", perk: "race", val: 0.15 },
  { id: "rog8", name: "ROG Phone 8 Pro 🕶️", price: 4600, bonus: "AirTrigger haptic, peluang rompak kawan +12%", perk: "pvp", val: 0.12 },
  { id: "ip15pro", name: "iPhone 15 Pro Titanium 🍏", price: 5400, bonus: "Gaya korporat T20, gaji kerja halal +20%", perk: "work", val: 0.20 },
  { id: "s24ultra", name: "Samsung Galaxy S24 Ultra AI 🤖", price: 6200, bonus: "S-Pen Decryptor AI, peluang jenayah & hack bank +15%", perk: "crime", val: 0.15 },
  { id: "magicv2", name: "HONOR Magic V2 Lipat 📂", price: 6900, bonus: "Dwi-skrin trader, faedah dividen bank +10%", perk: "bank", val: 0.10 },
  { id: "shadow_phone", name: "Shadow Legion X CyberDeck 🐺", price: 15000, bonus: "Gajet Ultimate Founder! +20% Lumba & Kerja, 50% Kebal Denda", perk: "god", val: 0.20 },
  { id: "vertu_sig", name: "Vertu Signature Cobra Sapphire 🐍", price: 50000, bonus: "Kemewahan Taikun! Pendapatan sewa hartanah +25%", perk: "rent", val: 0.25 },
  { id: "solana_saga", name: "Solana Saga Genesis Crypto 🪙", price: 85000, bonus: "Nod Web3! Keuntungan trading Kripto & Emas +15%", perk: "trade", val: 0.15 },
  { id: "caviar_gold", name: "Caviar Gold iPhone 24K Emas 👑", price: 140000, bonus: "Aura Bangsawan! Gaji kerja halal +35% & Kebal Rompak +10%", perk: "work", val: 0.35 },
  { id: "tonino_lambo", name: "Tonino Lamborghini 88 Tauri 🏎️", price: 220000, bonus: "Kelajuan V12! Peluang menang Drag Race +25%", perk: "race", val: 0.25 },
  { id: "crypto_node", name: "Satoshi Quantum CyberRig 💻", price: 500000, bonus: "Pelombong Tersembunyi! Dividen bank +30%", perk: "bank", val: 0.30 },
  { id: "starlink_deck", name: "Starlink Orbital Satellite Rig 🛰️", price: 1200000, bonus: "Satelit Terus! Peluang godam bank naik +25%", perk: "crime", val: 0.25 },
  { id: "falcon_super", name: "Falcon SuperNova Pink Diamond 💎", price: 3500000, bonus: "Telefon Termahal Dunia! Diskaun denda lokap 40%", perk: "def", val: 0.40 },
  { id: "neural_optic", name: "Neuralink Cyber-Cranial Device 🧠", price: 8000000, bonus: "Kognitif Penuh! Potong 25s semua cooldown RPG", perk: "cd", val: 25000 },
  { id: "quantum_prime", name: "Quantum Matrix Core OS 🌌", price: 20000000, bonus: "Manipulasi Masa! Menang Coinflip/Slot +15%", perk: "gamble", val: 0.15 },
  { id: "airi_chrono", name: "Airi Chrono Infinity Handheld 🔮", price: 50000000, bonus: "Gajet Dewa! +40% Semua Payout & Kebal 60% Denda", perk: "god", val: 0.40 }
];

// =========================================================================
// 💼 10. SEKTOR KERJAYA HALAL LENGKAP
// =========================================================================
const JOBS = [
  { id: 1, name: "Pekerja Am Majlis", minPay: 100, maxPay: 180 }, { id: 2, name: "Pencuci Pinggan Kedai Tomyam", minPay: 105, maxPay: 185 },
  { id: 3, name: "Rider GrabFood Berhujan", minPay: 110, maxPay: 195 }, { id: 4, name: "Runner Foodpanda Pink", minPay: 110, maxPay: 195 },
  { id: 5, name: "Pemandu Van Jenazah/Kargo", minPay: 120, maxPay: 205 }, { id: 6, name: "Kerani Kaunter Pejabat", minPay: 125, maxPay: 215 },
  { id: 7, name: "Juruteknik Aircond & Wiring", minPay: 130, maxPay: 220 }, { id: 8, name: "Operator Kilang Shift Malam", minPay: 135, maxPay: 225 },
  { id: 9, name: "Penebar Burger Ramly Special", minPay: 140, maxPay: 230 }, { id: 10, name: "Barista Kopi Hipster", minPay: 140, maxPay: 230 },
  { id: 11, name: "Jurujual Coway / Cuckoo", minPay: 145, maxPay: 235 }, { id: 12, name: "Tukang Masak Katering Kenduri", minPay: 150, maxPay: 240 },
  { id: 13, name: "Graphic Designer Canva Pro", minPay: 155, maxPay: 245 }, { id: 14, name: "Video Editor TikTok Viral", minPay: 160, maxPay: 250 },
  { id: 15, name: "Social Media Admin Group", minPay: 160, maxPay: 250 }, { id: 16, name: "Ejen Hartanah Rumah Lelong", minPay: 165, maxPay: 255 },
  { id: 17, name: "Tukang Paip Rumah Bocor", minPay: 165, maxPay: 255 }, { id: 18, name: "Juruelektrik Tiga Fasa", minPay: 170, maxPay: 260 },
  { id: 19, name: "Mekanik Motor Modenas/Yamaha", minPay: 175, maxPay: 265 }, { id: 20, name: "Foreman Bengkel Kereta", minPay: 180, maxPay: 270 },
  { id: 21, name: "Cikgu Tuisyen SPM Matematik", minPay: 185, maxPay: 275 }, { id: 22, name: "Jurutera Tapak Bina JKR", minPay: 190, maxPay: 285 },
  { id: 23, name: "Akauntan Audit LHDN", minPay: 195, maxPay: 290 }, { id: 24, name: "Pengurus Projek MRT3", minPay: 200, maxPay: 295 },
  { id: 25, name: "Peguam Mahkamah Majistret", minPay: 210, maxPay: 300 }, { id: 26, name: "Doktor Pakar Klinik Kesihatan", minPay: 220, maxPay: 310 },
  { id: 27, name: "Software Engineer Fullstack", minPay: 230, maxPay: 320 }, { id: 28, name: "Data Scientist Machine Learning", minPay: 240, maxPay: 330 },
  { id: 29, name: "Pilot AirAsia / MAS", minPay: 250, maxPay: 340 }, { id: 30, name: "Kapten Kapal Dagang Antarabangsa", minPay: 250, maxPay: 340 },
  { id: 31, name: "Arkitek Bangunan Pencakar Langit", minPay: 245, maxPay: 335 }, { id: 32, name: "Pakar Bedah Jantung", minPay: 260, maxPay: 350 },
  { id: 33, name: "Trader Forex Pacak Signal", minPay: 200, maxPay: 340 }, { id: 34, name: "Pelombong Bitcoin / Kripto", minPay: 210, maxPay: 350 },
  { id: 35, name: "Content Creator YouTube", minPay: 220, maxPay: 345 }, { id: 36, name: "Streamer Mobile Legends", minPay: 225, maxPay: 355 },
  { id: 37, name: "Tukang Jahit Baju Melayu", minPay: 180, maxPay: 260 }, { id: 38, name: "Web Developer Freelance", minPay: 215, maxPay: 325 },
  { id: 39, name: "Ejen Insurans Takaful", minPay: 190, maxPay: 280 }, { id: 40, name: "Pengurus Cawangan Bank", minPay: 255, maxPay: 345 },
  { id: 41, name: "Cef Eksekutif Hotel 5 Bintang", minPay: 260, maxPay: 355 }, { id: 42, name: "Jurugambar Acara Perkahwinan", minPay: 205, maxPay: 290 },
  { id: 43, name: "Juruaudit Forensik SPRM", minPay: 235, maxPay: 325 }, { id: 44, name: "Kontraktor Bina Banglo", minPay: 245, maxPay: 335 },
  { id: 45, name: "Ahli Farmasi Berdaftar", minPay: 240, maxPay: 330 }, { id: 46, name: "Pakar Psikologi Kaunseling", minPay: 230, maxPay: 320 },
  { id: 47, name: "Penganalisis Keselamatan Siber", minPay: 255, maxPay: 345 }, { id: 48, name: "Pakar Ekonomi Negara", minPay: 270, maxPay: 365 },
  { id: 49, name: "Pelabur Saham Bursa Malaysia", minPay: 280, maxPay: 380 }, { id: 50, name: "CEO Konglomerat Korporat", minPay: 300, maxPay: 400 },
  // 🔥 UPDATE 3.0: NEW JOBS
  { id: 101, name: "Pomen Bawah Pokok Ceri 🔧", minPay: 130, maxPay: 240 },
  { id: 102, name: "Founder Skincare Timbang Kilo 🧴", minPay: 200, maxPay: 350 },
  { id: 103, name: "Tauke Bundle Seluar Koyak 👖", minPay: 150, maxPay: 280 },
  { id: 104, name: "Flipper Tiket Konsert 🎫", minPay: 180, maxPay: 310 }
];

// =========================================================================
// 🏎️ 11. SHOWROOM JENTERA
// =========================================================================
const VEHICLES = [
  { id: "ex5", name: "Honda EX5 High Power 🛵", price: 3000, type: "Motor", speed: 50, desc: "Lagenda sejati, minyak jimat" },
  { id: "wave125", name: "Honda Wave 125i Ultimo 🛵", price: 5500, type: "Motor", speed: 55, desc: "Selesa harian" },
  { id: "lagenda", name: "Yamaha Lagenda 115Z 🛵", price: 6000, type: "Motor", speed: 58, desc: "Handle ringan selit jem" },
  { id: "lc135", name: "Yamaha LC135 5-Speed V8 🏍️", price: 7500, type: "Motor", speed: 65, desc: "Pickup sedap budak sekolah" },
  { id: "y15", name: "Yamaha Y15ZR (Ysuku) Monster 🏍️", price: 10000, type: "Motor", speed: 72, desc: "Raja drag Melayu highway" },
  { id: "rs150", name: "Honda RS150R Repsol V2 🏍️", price: 10500, type: "Motor", speed: 73, desc: "Enjin DOHC tahan lasak" },
  { id: "nvx", name: "Yamaha NVX 155 ABS V2 🛵", price: 12000, type: "Motor", speed: 75, desc: "Skuter smart digital" },
  { id: "nmax", name: "Yamaha NMAX 155 Maxi 🛵", price: 13000, type: "Motor", speed: 74, desc: "Kusyen sofa empuk" },
  { id: "r15", name: "Yamaha YZF-R15M Quickshifter 🏍️", price: 14000, type: "Motor", speed: 78, desc: "Rupa superbike mini" },
  { id: "cbr150", name: "Honda CBR150R Fireblade 🏍️", price: 14500, type: "Motor", speed: 79, desc: "Aerodinamik tajam" },
  { id: "adv160", name: "Honda ADV 160 Adventure 🛵", price: 15000, type: "Motor", speed: 76, desc: "Suspensi showa redah banjir" },
  { id: "z250", name: "Kawasaki Z250 Twin Naked 🏍️", price: 21000, type: "Motor", speed: 85, desc: "Bunyi 2 silinder padu" },
  { id: "ninja250", name: "Kawasaki Ninja 250 SE 🏍️", price: 22000, type: "Motor", speed: 88, desc: "Sport fairing ikonik" },
  { id: "mt07", name: "Yamaha MT-07 CP2 Crossplane 🏍️", price: 40000, type: "Motor", speed: 105, desc: "Tork monster angkat tayar" },
  { id: "z800", name: "Kawasaki Z800 4-Silinder 🏍️", price: 48000, type: "Motor", speed: 115, desc: "Bunyi ngauman inline-4" },
  { id: "r6", name: "Yamaha YZF-R6 Scream 16k RPM 🏍️", price: 85000, type: "Motor", speed: 135, desc: "Jeritan enjin Formula 1" },
  { id: "zx6r", name: "Kawasaki ZX-6R Ninja 636 🏍️", price: 90000, type: "Motor", speed: 140, desc: "Kuasa supersport maut" },
  { id: "s1000rr", name: "BMW S1000RR M-Package 🚀", price: 175000, type: "Motor", speed: 165, desc: "Superbike Jerman tercanggih" },
  { id: "panigale", name: "Ducati Panigale V4S Corse 🚀", price: 180000, type: "Motor", speed: 170, desc: "Eksotik Itali merah menyala" },
  { id: "h2", name: "Kawasaki Ninja H2 Supercharged 🚀", price: 250000, type: "Motor", speed: 190, desc: "Turbin supercharged darat" },
  { id: "h2r", name: "Kawasaki Ninja H2R Carbon 🌌", price: 600000, type: "Motor", speed: 230, desc: "310 HP Supercharged Litar Sahaja!" },
  { id: "superleggera", name: "Ducati Superleggera V4 Carbon 🚀", price: 1200000, type: "Motor", speed: 235, desc: "Chassis gentian karbon terhad 500 unit di dunia" },
  { id: "arch_krgt1", name: "Arch Motorcycle KRGT-1 Keanu 🏍️", price: 1800000, type: "Motor", speed: 175, desc: "Kustom buatan tangan Los Angeles VIP" },
  { id: "mvg_oro", name: "MV Agusta Rush 1000 Serie Oro 🏍️", price: 2500000, type: "Motor", speed: 210, desc: "Karya seni kelajuan eksotik Itali" },
  { id: "combat_f117", name: "Combat Motors P-51 Fighter 🛸", price: 4000000, type: "Motor", speed: 220, desc: "Blok aluminium aeroangkasa penuh" },
  { id: "tamburini_t12", name: "MT Tamburini T12 Massimo 🌟", price: 8500000, type: "Motor", speed: 240, desc: "Mahakarya pereka lagenda dunia lumba" },
  { id: "dodge_tomahawk", name: "Dodge Tomahawk V10 8.3L 🚀", price: 15000000, type: "Motor", speed: 270, desc: "Enjin Viper 4-Roda Peluru Berpandu Darat" },
  { id: "eCosse_spirit", name: "Ecosse ES1 Superbike Titanium 👑", price: 35000000, type: "Motor", speed: 290, desc: "Kejuruteraan F1 dengan aerodinamik ekstrem" },
  { id: "harley_cosmic", name: "Cosmic Starship Jack Armstrong 🎨", price: 75000000, type: "Motor", speed: 160, desc: "Lukisan seni bernilai jutaan dolar atas dua roda" },
  { id: "neiman_marcus", name: "Neiman Marcus Limited Fighter 👑", price: 150000000, type: "Motor", speed: 260, desc: "Motosikal termahal dalam sejarah manusia" },
  { id: "kancil", name: "Perodua Kancil 660 Manual 🚗", price: 5000, type: "Kereta", speed: 45, desc: "Kereta kompak rakyat" },
  { id: "iswara", name: "Proton Iswara Aeroback 1.3 🚗", price: 8000, type: "Kereta", speed: 50, desc: "Kereta kebal aircond beku" },
  { id: "saga", name: "Proton Saga BLM 1.3 CamPro 🚗", price: 12000, type: "Kereta", speed: 55, desc: "Sedan harian keluarga" },
  { id: "wira", name: "Proton Wira 1.5 GLi Injection 🚗", price: 15000, type: "Kereta", speed: 60, desc: "Chassis sedap sumbat GSR" },
  { id: "preve", name: "Proton Preve 1.6 CFE Turbo 🚗", price: 40000, type: "Kereta", speed: 75, desc: "Handling Lotus mantap" },
  { id: "persona", name: "Proton Persona VVT Premium 🚗", price: 45000, type: "Kereta", speed: 70, desc: "Pemanduan moden selesa" },
  { id: "myvi", name: "Perodua Myvi King 1.5 AV 👑", price: 50000, type: "Kereta", speed: 82, desc: "Raja Segala Jalan Raya" },
  { id: "x50", name: "Proton X50 TGDi Flagship 🚙", price: 90000, type: "Kereta", speed: 95, desc: "SUV Turbo Panoramic" },
  { id: "vios", name: "Toyota Vios Dugong GR-S 🚗", price: 95000, type: "Kereta", speed: 85, desc: "Tahan lasak GR-Sport" },
  { id: "x70", name: "Proton X70 Premium AWD 🚙", price: 120000, type: "Kereta", speed: 100, desc: "SUV Eksekutif senyap" },
  { id: "civic", name: "Honda Civic FC 1.5 Ketam Turbo 🏎️", price: 130000, type: "Kereta", speed: 110, desc: "VTEC Turbo lampu ketam" },
  { id: "accord", name: "Honda Accord 1.5 TC-P VIP 🚘", price: 180000, type: "Kereta", speed: 120, desc: "Sedan VIP bos besar" },
  { id: "alphard", name: "Toyota Alphard 3.5 Executive 🚐", price: 350000, type: "Kereta", speed: 95, desc: "Pilot seat urut jutawan" },
  { id: "mustang", name: "Ford Mustang 5.0 GT V8 🏎️", price: 550000, type: "Kereta", speed: 145, desc: "Muscle car garang V8" },
  { id: "gtr", name: "Nissan GT-R R35 Nismo Godzilla 🏎️", price: 650000, type: "Kereta", speed: 165, desc: "Launch control AWD Godzilla" },
  { id: "m4", name: "BMW M4 Competition G82 🏎️", price: 750000, type: "Kereta", speed: 170, desc: "Raja drift litar 50:50" },
  { id: "c63", name: "Mercedes-AMG C63s V8 BiTurbo 🏎️", price: 780000, type: "Kereta", speed: 172, desc: "AMG letupan ekzos padu" },
  { id: "ferrari", name: "Ferrari 488 Pista V8 🏎️", price: 1500000, type: "Kereta", speed: 185, desc: "Kuda jingkrak Itali tulen" },
  { id: "lambo", name: "Lamborghini Huracan EVO V10 🏎️", price: 1600000, type: "Kereta", speed: 190, desc: "Banteng Itali mengamuk V10" },
  { id: "911", name: "Porsche 911 GT3 RS Weissach 🏎️", price: 1800000, type: "Kereta", speed: 195, desc: "Senjata litar terhebat dunia" },
  { id: "aventador_svj", name: "Lamborghini Aventador SVJ V12 🚀", price: 4500000, type: "Kereta", speed: 215, desc: "Ngauman V12 naturally aspirated raja litar" },
  { id: "mclaren_p1", name: "McLaren P1 Hybrid Hypercar 🏎️", price: 8000000, type: "Kereta", speed: 225, desc: "Teknologi F1 hibrid 903 kuasa kuda" },
  { id: "ferrari_laferrari", name: "Ferrari LaFerrari Aperta 👑", price: 16000000, type: "Kereta", speed: 230, desc: "Puncak keagungan Maranello" },
  { id: "koenigsegg_jesko", name: "Koenigsegg Jesko Absolut 300+ 🚀", price: 28000000, type: "Kereta", speed: 265, desc: "Penembus kelajuan 500 km/h aeroangkasa Sweden" },
  { id: "bugatti_chiron", name: "Bugatti Chiron Super Sport 300+ 🚀", price: 38000000, type: "Kereta", speed: 270, desc: "Enjin Quad-Turbo W16 raja kelajuan mutlak" },
  { id: "pagani_huayra", name: "Pagani Huayra Codalunga Bespoke 💎", price: 55000000, type: "Kereta", speed: 245, desc: "Karya seni buatan tangan Itali edisi terhad 5 unit" },
  { id: "bugatti_voiture", name: "Bugatti La Voiture Noire 🖤", price: 95000000, type: "Kereta", speed: 260, desc: "Hiperkar hitam paling ikonik dan eksklusif di dunia" },
  { id: "rolls_boat_tail", name: "Rolls-Royce Boat Tail Yacht 🛥️", price: 140000000, type: "Kereta", speed: 130, desc: "Kapal layar darat dengan suite hos champagne terbina" },
  { id: "rolls_droptail", name: "Rolls-Royce La Rose Noire Droptail 🌹", price: 180000000, type: "Kereta", speed: 135, desc: "Kemuncak kemewahan kereta baharu termahal di bumi" },
  { id: "mercedes_300slr", name: "Mercedes-Benz 300 SLR Uhlenhaut 👑", price: 650000000, type: "Kereta", speed: 200, desc: "Kereta termahal sepanjang zaman bernilai warisan muzium" },
  // 🔥 UPDATE 3.0: NEW VEHICLES
  { id: "rxz", name: "Yamaha RXZ Catalyzer Hantu 🏍️", price: 18000, type: "Motor", speed: 95, desc: "Raja highway, bunyi zass zass!" },
  { id: "kelisa", name: "Perodua Kelisa Convert Gino 🚗", price: 22000, type: "Kereta", speed: 85, desc: "Kecil-kecil cili padi L2" },
  { id: "wira_evo", name: "Wira Evo 3 Convert 🚗", price: 45000, type: "Kereta", speed: 110, desc: "Ekzos tembak-tembak" },
  { id: "lori_hantu", name: "Lori Hantu Balak 🚚", price: 85000, type: "Kereta", speed: 70, desc: "Takde brek redah je!" }
];

// =========================================================================
// 🏢 12. SEKTOR HARTANAH PASIF
// =========================================================================
const PROPERTIES = [
  { id: 1, name: "Flat PPR Lembah Subang 🏢", price: 35000, rent: 5000 },
  { id: 2, name: "Rumah Teres 1 Tingkat Bangi 🏡", price: 120000, rent: 17000 },
  { id: 3, name: "Kondominium Mewah KLCC 🏙️", price: 450000, rent: 64000 },
  { id: 4, name: "Semi-D Tropika Shah Alam 🏡", price: 850000, rent: 121000 },
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
  { id: 22, name: "Stesen Angkasa Mega Orbital Airi Prime 🌌", price: 250000000000, rent: 35714285000 },
  // 🔥 UPDATE 3.0: NEW PROPERTIES
  { id: 101, name: "Warung Tomyam Kelantan 🍲", price: 180000, rent: 25000 },
  { id: 102, name: "Tapak Carwash 24 Jam 🧽", price: 350000, rent: 48000 },
  { id: 103, name: "Kebun Musang King Raub 🌳", price: 1200000, rent: 175000 }
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
  { id: "kripto_dragon", name: "Naga Kripto Orbital Mythic 🐉", price: 2500000, buff: "Kebal 90% Serangan & Gaji Kerja +25%", perk: "dragon_god", val: 0.90 }
];

const FOOD_ITEMS = [
  { id: "tehtarik", name: "Teh Tarik Kaw Buih 🧋", price: 4, desc: "Potong 10s cooldown kerja" },
  { id: "roticanai", name: "Roti Canai Banjir Dhal 🥞", price: 7, desc: "Potong 20s cooldown kerja" },
  { id: "nasilemak", name: "Nasi Lemak Sotong Padu 🍛", price: 12, desc: "Reset serta-merta semua cooldown kerja!" },
  { id: "burger", name: "Burger Ramly Special Cheese 🍔", price: 15, desc: "Kenyang padu, kurangkan denda balai 10%" }
];

function getTitle(user) {
  const total = user.cash + user.bank;
  if (user.isOwner) return "👑 [MYTHIC] Pengasas Mutlak (Founder)";
  if (user.stars >= 4) return "🏴‍☠️ [LEGENDARY] Kingpin Underworld";
  if (user.stars >= 2) return "🥷 [RARE] Buronan Dikehendaki";
  if (total >= 1000000) return "💎 [MYTHIC] Jutawan Trilion Airi";
  if (total >= 200000) return "💼 [EPIC] Pengurus Eksekutif";
  if (total >= 50000) return "⭐ [RARE] Pekerja Teladan";
  return "🌱 [COMMON] Warga Cyber";
}

// =========================================================================
// 👑 13. SENARAI ARAHAN VETO CEO (UNTUK .veto)
// =========================================================================
const VETO_CEO_LIST = `
╔═════════════════════════════════════╗
   👑 SENARAI ARAHAN KHAS CEO (VETO) 👑
╚═════════════════════════════════════╝
• *.syscheck* ➔ Semak status pangkalan data & kod
• *.list_event* ➔ Papar kod acara musim
• *.set_season [no]* ➔ Tetapkan nombor musim aktif
• *.start_event [nama] [hari]* ➔ Lancarkan event khas musim
• *.stop_event* ➔ Hentikan event aktif
• *.give_cash @user [jumlah]* ➔ Suntikan dana tunai
• *.give_gold @user [gram]* ➔ Berikan emas fizikal 999
• *.give_btc @user [unit]* ➔ Berikan baki Bitcoin
• *.set_market [gold/btc/scrap] [harga]* ➔ Ubah harga pasaran bursa
• *.jail_user @user [saat]* ➔ Sumbat pemain ke lokap paksa
• *.free_user @user* ➔ Bebaskan pemain dari lokap
• *.clear_bounty @user* ➔ Padamkan rekod buronan
• *.reset_user @user* ➔ Reset akaun pemain ke asas
• *.reset_season* ➔ Tutup tirai musim & mula musim baru
`;

// =========================================================================
// 🚀 14. ENGINE UTAMA BAILEYS
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

  // =========================================================================
  // 🎲 INTERVAL EVENT (BIDAAN & RANDOM) SETIAP 15 MINIT
  // =========================================================================
  let lastRandomEventTime = Date.now();

  setInterval(async () => {
    const db = loadDB();
    const now = Date.now();

    // 1. TUTUP LELONGAN JIKA 1 MINIT TIADA BIDAAN BARU
    if (db.auction && db.auction.active) {
      if (now - db.auction.lastBidTime > 60000) {
        db.auction.active = false;
        let pText = "";
        if (db.auction.highestBidder) {
          const winner = getUser(db.auction.highestBidder);
          winner.cash += db.auction.rewardValue; 
          updateUser(db.auction.highestBidder, winner);
          pText = `🔔 *LELONGAN DITUTUP! (TIADA BIDAAN BARU)*\n\n🎉 Pemenang: *${winner.name}* (Bidaan: RM ${db.auction.highestBid.toLocaleString()})\n📦 Isi Kontena Misteri: *${db.auction.rewardName}*\n💰 Nilai Habuan (Cair ke Tunai): *+RM ${db.auction.rewardValue.toLocaleString()}*`;
        } else {
          pText = `🔔 *LELONGAN DIBATALKAN!* Tiada sesiapa membida.`;
        }
        db.auction = null;
        saveDB(db);
        if (db.groups && db.groups.length > 0) {
          await sock.sendMessage(db.groups[0], { text: pText });
        }
      }
    }

    // 2. TRIGGER RANDOM EVENT SETIAP 15 MINIT
    if (now - lastRandomEventTime >= 15 * 60 * 1000) {
      lastRandomEventTime = now; 
      if (globalChatActivity >= 5 && db.groups && db.groups.length > 0) {
        globalChatActivity = 0; 
        const eventChance = Math.random();
        const mainGroup = db.groups[0];

        if (eventChance < 0.2 && !db.auction) {
          // BIDAAN MISTERI
          const isT20 = Math.random() < 0.1;
          const startPrice = isT20 ? 100000 : 10000;
          const isScam = Math.random() < 0.5;
          const rwName = isT20 ? (isScam ? "Habuk Berasap 💨" : "Kunci Lamborghini Aventador 🏎️") : (isScam ? "Batu Bata Pecah 🧱" : "10 Jongkong Emas 🪙");
          const rwVal = isT20 ? (isScam ? 0 : 1500000) : (isScam ? 0 : 50000);

          db.auction = { active: true, highestBid: startPrice, highestBidder: null, lastBidTime: now, rewardName: rwName, rewardValue: rwVal };
          saveDB(db);
          await sock.sendMessage(mainGroup, { text: `🚨 *LELONGAN KONTENA MISTERI BERMULA!* 🚨\n\n📦 Disita dari Pelabuhan Klang.\n💵 Harga Tapak: *RM ${startPrice.toLocaleString()}*\n⏱️ Sistem reset 60s jika ada bidaan baharu.\n\n👉 Taip: *.bida [harga]*` });
        } else if (eventChance < 0.6) {
          // RANDOM EVENT
          const activeIds = Object.keys(db.users);
          if (activeIds.length > 0) {
             const randomId = activeIds[Math.floor(Math.random() * activeIds.length)];
             const u = db.users[randomId];
             
             let untungRate = 0.50;
             if (u.pet === "kucing_jalanan") untungRate = 0.65;

             if (Math.random() < untungRate) {
                let untung = Math.floor(Math.random() * 2000) + 500;
                if (u.pet === "kucing_jalanan") untung = Math.floor(untung * 1.15); 

                u.cash += untung;
                updateUser(randomId, u);
                await sock.sendMessage(mainGroup, { text: `🎁 *REZEKI TERPIJAK!*\n\n*${u.name}* terjumpa wang tercicir RM ${untung.toLocaleString()} di pasar malam! Duit tunai meningkat.` });
             } else {
                const rugi = Math.floor(Math.random() * 1000) + 200;
                u.cash = Math.max(0, u.cash - rugi);
                updateUser(randomId, u);
                await sock.sendMessage(mainGroup, { text: `💀 *BENCANA HARIAN!*\n\n*${u.name}* disaman JPJ sebab ekzos bising. Denda RM ${rugi.toLocaleString()} melayang!` });
             }
          }
        }
      }
    }
  }, 5000);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { currentQR = qr; isConnected = false; }
    if (connection === "close") {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        setTimeout(() => { startBotEngine().catch(e => console.error("Ralat reconnect:", e.message)); }, 5000);
      }
    } else if (connection === "open") {
      isConnected = true; currentQR = "";
      console.log("✅ BOT AIRI'S CORNER V3.0 TELAH BERSAMBUNG KE WHATSAPP 24/7!");
    }
  });

  // =========================================================================
  // ⚡ 15. PENGENDALI MESEJ & COMMAND RPG MEGA LENGKAP
  // =========================================================================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m?.message) return;

    const from = m.key.remoteJid;
    if (from?.endsWith("@g.us")) {
      globalChatActivity++;
      const db = loadDB();
      if (!db.groups.includes(from)) { db.groups.push(from); saveDB(db); }
    }

    const msgText = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
    if (!msgText.trim().startsWith(".")) return;

    const args = msgText.trim().slice(1).split(/ +/);
    const cmd = args.shift().toLowerCase();
    const sender = m.key.participant || from;
    const cleanSender = sender.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    const pushName = m.pushName || "";
    const user = getUser(cleanSender, pushName);
    const now = Date.now();

    const isOwner = OWNER_NUMBERS.some(num => cleanSender.includes(num)) || user.isOwner === true;
    if (isOwner && !user.isOwner) { user.isOwner = true; updateUser(cleanSender, user); }

    const activePhoneObj = PHONE_DEVICES.find(p => p.id === user.phoneDevice);
    const db = loadDB();
    const currentSeasonEvent = db.active_event_data ? SEASON_EVENTS[db.active_event_data.type] : null;

    if (now < user.cooldowns.hospitalUntil && !isOwner) {
      const remSec = Math.ceil((user.cooldowns.hospitalUntil - now) / 1000);
      return sock.sendMessage(from, { text: `🚑 Anda sedang dirawat di hospital. Baki: ${remSec}s.` });
    }

    if (now < user.cooldowns.jailUntil && cmd !== "upah_lawyer" && cmd !== "myid" && !isOwner) {
      const remSec = Math.ceil((user.cooldowns.jailUntil - now) / 1000);
      return sock.sendMessage(from, { text: `🚨 Anda dalam tahanan lokap! Baki: ${remSec}s. Taip *.upah_lawyer* (RM 500)` });
    }

    // =====================================================================
    // 👑 16. ARAHAN VETO CEO
    // =====================================================================
    if (cmd === "veto" && isOwner) return sock.sendMessage(from, { text: VETO_CEO_LIST });
    
    if ((cmd === "syscheck" || cmd === "diag") && isOwner) {
      let diagUI = `╔═══════════════════════════╗\n   ⚙️ SHADOW LEGACY DIAGNOSTICS\n╚═══════════════════════════╝\n`;
      diagUI += `Admin: Founder Amar\nOS Target: OriginOS / iQOO 12 Node.js Env\n\n`;
      try { const testDb = loadDB(); diagUI += `✅ [DB] MongoDB/JSON: OK (${Object.keys(testDb.users || {}).length} Entiti)\n`; } 
      catch(e) { diagUI += `❌ [DB] Ralat Database: ${e.message}\n`; }
      diagUI += `✅ [MODUL] Jentera: ${VEHICLES?.length || 0} Kod\n`;
      diagUI += `✅ [MODUL] Kerjaya: ${JOBS?.length || 0} Kod\n`;
      diagUI += `✅ [MODUL] Hartanah: ${PROPERTIES?.length || 0} Kod\n`;
      diagUI += `✅ [MODUL] Jenayah: ${CRIMES?.length || 0} Kod\n`;
      diagUI += `✅ [STATUS] AI Shadow Airi (Groq LPU): AKTIF\n`;
      const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      diagUI += `📈 [SISTEM] Penggunaan RAM: ${memoryUsage} MB\n`;
      return sock.sendMessage(from, { text: diagUI });
    }

    if (cmd === "list_event" && isOwner) {
      let ui = `╔═══════════════════════════╗\n   📜 SENARAI KOD EVENT MUSIM\n╚═══════════════════════════╝\n`;
      for (let key in SEASON_EVENTS) { ui += `• *${key}*\n  _${SEASON_EVENTS[key].name}_\n  _${SEASON_EVENTS[key].desc}_\n\n`; }
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "set_season" && isOwner) {
      const sNum = parseInt(args[0]);
      if (isNaN(sNum) || sNum < 1) return sock.sendMessage(from, { text: `❌ Format: *.set_season [nombor]*` });
      db.season = sNum; saveDB(db);
      return sock.sendMessage(from, { text: `👑 *VETO CEO:* Musim siber kini diset ke *Musim Ke-${sNum}*!` });
    }

    if (cmd === "start_event" && isOwner) {
      const evType = args[0]?.toUpperCase();
      const days = parseInt(args[1]) || 3;
      if (!SEASON_EVENTS[evType]) return sock.sendMessage(from, { text: `❌ Event tidak sah. Taip *.list_event* untuk senarai.` });
      db.active_event_data = { type: evType, end: now + (days * 24 * 3600 * 1000) }; saveDB(db);
      return sock.sendMessage(from, { text: `👑 Veto: Acara ${evType} diaktifkan!` });
    }

    if (cmd === "stop_event" && isOwner) {
      db.active_event_data = null; saveDB(db);
      return sock.sendMessage(from, { text: `👑 Veto: Acara dihentikan!` });
    }

    if (cmd === "give_cash" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt)) return sock.sendMessage(from, { text: `❌ Format: *.give_cash @user [jumlah]*` });
      const targetUser = getUser(targetTag); targetUser.cash += amt; updateUser(targetTag, targetUser);
      return sock.sendMessage(from, { text: `👑 Veto: +RM ${amt.toLocaleString()} tunai dikreditkan ke *${targetUser.name}*!`, mentions: [targetTag] });
    }

    if (cmd === "give_gold" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const grams = parseFloat(args[1]);
      if (!targetTag || isNaN(grams)) return sock.sendMessage(from, { text: `❌ Format: *.give_gold @user [gram]*` });
      const targetUser = getUser(targetTag); targetUser.goldGrams = (targetUser.goldGrams || 0) + grams; updateUser(targetTag, targetUser);
      return sock.sendMessage(from, { text: `👑 Veto: +${grams}g Emas 999 diberikan kepada *${targetUser.name}*!`, mentions: [targetTag] });
    }

    if (cmd === "give_btc" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const units = parseFloat(args[1]);
      if (!targetTag || isNaN(units)) return sock.sendMessage(from, { text: `❌ Format: *.give_btc @user [unit]*` });
      const targetUser = getUser(targetTag); targetUser.btcUnits = (targetUser.btcUnits || 0) + units; updateUser(targetTag, targetUser);
      return sock.sendMessage(from, { text: `👑 Veto: +${units} BTC diberikan kepada *${targetUser.name}*!`, mentions: [targetTag] });
    }

    if (cmd === "set_market" && isOwner) {
      const type = args[0]?.toLowerCase();
      const price = parseInt(args[1]);
      if (!["gold", "btc", "emas", "scrap"].includes(type) || isNaN(price) || price <= 0) return sock.sendMessage(from, { text: `❌ Format: *.set_market [gold/btc/scrap] [harga]*` });
      if (!db.market) db.market = { gold: 350, btc: 280000, scrap: 5, lastUpdate: now };
      if (type === "gold" || type === "emas") db.market.gold = price;
      if (type === "btc") db.market.btc = price;
      if (type === "scrap") db.market.scrap = price;
      db.market.lastUpdate = now; saveDB(db);
      return sock.sendMessage(from, { text: `👑 Veto Bursa: Harga ${type.toUpperCase()} diubah ke RM ${price.toLocaleString()}!` });
    }

    if (cmd === "jail_user" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const sec = parseInt(args[1]) || 120;
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.jail_user @user [saat]*` });
      const targetUser = getUser(targetTag); targetUser.cooldowns.jailUntil = now + (sec * 1000); updateUser(targetTag, targetUser);
      return sock.sendMessage(from, { text: `👑 Veto: *${targetUser.name}* disumbat ke lokap ${sec}s!`, mentions: [targetTag] });
    }

    if (cmd === "free_user" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.free_user @user*` });
      const targetUser = getUser(targetTag); targetUser.cooldowns.jailUntil = 0; updateUser(targetTag, targetUser);
      return sock.sendMessage(from, { text: `👑 Veto: *${targetUser.name}* dibebaskan dari lokap!`, mentions: [targetTag] });
    }

    if (cmd === "reset_user" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.reset_user @user*` });
      db.users[targetTag] = {
        name: getUser(targetTag).name, bio: "", cash: 500, bank: 0, debt: 0, goldGrams: 0, btcUnits: 0,
        phoneDevice: null, phoneName: "Public Phone Awam 📟", 
        fishingGear: { rod: "rod_buluh", reel: "reel_plastik", bait: null, tank: "tank_balang" },
        magnetGear: { magnet: null }, scrapMetalKg: 0, misteryBoxes: 0,
        inventory: [], vehicles: [], vehicleMods: {}, food: [], properties: [], pet: null, aquarium: [], stars: 0,
        badges: ["🌱 [COMMON] Warga Baru"], stats: { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0, bankHacks: 0 },
        cooldowns: { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, magnet: 0, rent: 0, bankHack: 0, aiAsk: 0, hospitalUntil: 0 }
      };
      saveDB(db);
      return sock.sendMessage(from, { text: `👑 Veto Wipe: Akaun diset semula!`, mentions: [targetTag] });
    }

    // =====================================
    // ARAHAN: HACKBANK
    // =====================================
    if (cmd === "hackbank" || cmd === "godam_bank") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa: *.hackbank @user*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Tak boleh godam akaun sendiri!` });
      
      if (now < user.cooldowns.bankHack && !isOwner) {
        const remM = Math.ceil((user.cooldowns.bankHack - now) / 60000);
        return sock.sendMessage(from, { text: `⏳ *JEJAK KESELAMATAN AKTIF!* Anda sedang diburu oleh Cyber-Security bank. Sila bersembunyi selama *${remM} minit*.` });
      }

      const hasHackDevice = user.inventory.some(i => i.id === 11 || i.id === 2 || i.id === 5);
      if (!hasHackDevice && !isOwner) return sock.sendMessage(from, { text: `❌ Perlukan *Cyber Bypass Dongle (ID 11)* di *.bm*!` });
      const targetUser = getUser(cleanTarget);
      if (targetUser.bank < 1000) return sock.sendMessage(from, { text: `😅 Simpanan bank mangsa bawah RM 1,000.` });

      let petObj = null;
      if (targetUser.pet) petObj = CYBER_PETS.find(p => p.id === targetUser.pet);
      if (petObj && (petObj.perk === "anti_hack" || petObj.perk === "dual_def" || petObj.perk === "dragon_god")) {
          if (Math.random() < petObj.val) {
              user.cash = Math.max(0, user.cash - 1000);
              user.cooldowns.bankHack = now + (15 * 60 * 1000); 
              updateUser(cleanSender, user);
              return sock.sendMessage(from, { text: `🛡️ *FIREWALL DISEKAT AI!*\n\nPengawal *${petObj.name}* milik mangsa telah mengesan dan memintas godaman anda!\n💸 Ganti Rugi Dipotong: *-RM 1,000*\n⏳ Cooldown Hack: 15 Minit.` });
          }
      }

      const cyberEmojis = ["⚡", "💾", "🔓", "☣️", "👾", "📡", "🧩", "🗝️", "💎", "🛡️"];
      const selectedPin = [...cyberEmojis].sort(() => 0.5 - Math.random()).slice(0, 4).join("");

      if (!db.activeHacks) db.activeHacks = {};
      db.activeHacks[cleanSender] = { target: cleanTarget, emojiPin: selectedPin, expires: now + 30000 };
      saveDB(db);
      return sock.sendMessage(from, { text: `╔═══════════════════════════╗\n   ⚡ CYBER NEURAL HANDSHAKE ⚡\n╚═══════════════════════════╝\n🎯 Sasaran: *${targetUser.name}*\n🔑 *KOD EMOJI PIN DIPERLUKAN:* ${selectedPin.split("").join("  ")}\n⏳ Tempoh: 30 Saat!\n👉 Taip: *.bypass ${selectedPin}*` });
    }

    if (cmd === "bypass") {
      const activeHack = db.activeHacks?.[cleanSender];
      if (!activeHack || now > activeHack.expires) {
        if (activeHack) { delete db.activeHacks[cleanSender]; saveDB(db); }
        return sock.sendMessage(from, { text: `❌ Tiada sesi godam aktif atau masa telah tamat!` });
      }
      const targetUser = getUser(activeHack.target);
      if (args.join("").trim() === activeHack.emojiPin) {
        delete db.activeHacks[cleanSender];
        const stolen = Math.floor(targetUser.bank * 0.05); 
        targetUser.bank -= stolen;
        user.cash += stolen;
        user.stats.bankHacks = (user.stats.bankHacks || 0) + 1;
        user.cooldowns.bankHack = now + (30 * 60 * 1000); 
        saveDB(db); updateUser(cleanSender, user); updateUser(activeHack.target, targetUser);
        const narrative = getRandomNarrative("BANK_HACK_SUCCESS");
        return sock.sendMessage(from, { text: `🔓 *GODAM BERJAYA:* +RM ${stolen.toLocaleString()} disedut dari akaun bank mangsa!\n\n${narrative}`, mentions: [activeHack.target] });
      } else {
        delete db.activeHacks[cleanSender];
        user.cash = Math.max(0, user.cash - 1500);
        user.cooldowns.jailUntil = now + (60 * 1000);
        user.cooldowns.bankHack = now + (15 * 60 * 1000); 
        saveDB(db); updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 *FIREWALL ALERT:* PIN Emoji salah! Denda RM 1,500 & masuk lokap 60s!` });
      }
    }

    if (cmd === "reset_season" && isOwner) {
      const goldP = db.market?.gold || 350;
      const btcP = db.market?.btc || 280000;

      const ranked = Object.entries(db.users || {})
        .map(([id, u]) => {
          let propVal = 0;
          (u.properties || []).forEach(pId => { const pr = PROPERTIES.find(x => x.id === pId); if (pr) propVal += pr.price; });
          const net = (u.cash || 0) + (u.bank || 0) + Math.floor((u.goldGrams || 0) * goldP) + Math.floor((u.btcUnits || 0) * btcP) + propVal;
          return { id, name: u.name, netWorth: net };
        }).sort((a, b) => b.netWorth - a.netWorth);

      const top1 = ranked[0], top2 = ranked[1], top3 = ranked[2];
      if (!db.hallOfFame) db.hallOfFame = [];
      if (top1) db.hallOfFame.push({ season: db.season || 1, first: top1, second: top2 || { name: "-", netWorth: 0 }, third: top3 || { name: "-", netWorth: 0 } });

      const sOld = db.season || 1;
      db.season = sOld + 1;
      db.active_event_data = null;

      for (let uid in db.users) {
        const u = db.users[uid];
        const legacyBadges = u.badges.filter(b => b.includes("LEGACY") || b.includes("CHRONO") || b.includes("Founder"));
        let starterCash = 500;
        
        if (top1 && uid === top1.id) { legacyBadges.push(`👑 [S${sOld} CHAMPION]`); starterCash = 50000; } 
        else if (top2 && uid === top2.id) { legacyBadges.push(`🥈 [S${sOld} RUNNER-UP]`); starterCash = 25000; } 
        else if (top3 && uid === top3.id) { legacyBadges.push(`🥉 [S${sOld} 3RD PLACE]`); starterCash = 10000; }

        db.users[uid] = {
          name: u.name, bio: u.bio || "", isOwner: u.isOwner, cash: starterCash, bank: 0, debt: 0, goldGrams: 0, btcUnits: 0,
          phoneDevice: null, phoneName: "Public Phone Awam 📟", 
          fishingGear: { rod: "rod_buluh", reel: "reel_plastik", bait: null, tank: "tank_balang" },
          magnetGear: { magnet: null }, scrapMetalKg: 0, misteryBoxes: 0,
          inventory: [], vehicles: [], vehicleMods: {}, food: [], properties: [], pet: null, aquarium: [], stars: 0,
          badges: legacyBadges.length > 0 ? legacyBadges : ["🌱 [COMMON] Warga Baru"],
          stats: { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0, bankHacks: 0 },
          cooldowns: { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, magnet: 0, rent: 0, bankHack: 0, aiAsk: 0, hospitalUntil: 0 }
        };
      }
      saveDB(db);
      for (const gId of db.groups) {
        await sock.sendMessage(gId, { text: `👑 *TIRAI MUSIM KE-${sOld} DITUTUP!* 👑\n\n🥇 Juara: *${top1?.name || "-"}*\n🥈 Tempat Ke-2: *${top2?.name || "-"}*\n🥉 Tempat Ke-3: *${top3?.name || "-"}*\n\n🔥 *MUSIM KE-${db.season} BERMULA SEKARANG!* Semua rekod diset semula ke garisan permulaan.` }).catch(() => {});
      }
      return;
    }

    // 🤖 SHADOW AIRI AI (.airi) - UPDATE 3.0 GROQ
    if (cmd === "airi" || cmd === "ai" || cmd === "tanya") {
      const query = args.join(" ").trim();
      if (!query) return sock.sendMessage(from, { text: `Hai ${user.name}! 💙 Airi ada kat sini~ Taip: *.airi [borak]* hehe~ ✨` });

      if (now < (user.cooldowns.aiAsk || 0) && !isOwner) {
        return sock.sendMessage(from, { text: `⏳ Sabar weh, Airi tengah proses data jap!` });
      }

      user.cooldowns.aiAsk = now + (8 * 1000); 
      updateUser(cleanSender, user);

      const reply = await askAiriAI(query, user.name);
      return sock.sendMessage(from, { text: `💠 *AIRI (Groq LPU)* 💠\n\n${reply}` });
    }
    
    // 🎲 UPDATE 3.0 MINI-GAMES
    if (cmd === "gacha_calc" || cmd === "pity") {
      const pulls = parseInt(args[0]);
      if (isNaN(pulls)) return sock.sendMessage(from, { text: `🧮 Guna: *.pity [jumlah_pull_sekarang]*\nContoh: *.pity 45*` });
      const needed = 90 - pulls;
      const costGems = needed * 160;
      return sock.sendMessage(from, { text: `🎮 *KALKULATOR PITY GACHA*\n\nPull Semasa: ${pulls}/90\nPull ke Hard Pity: ${needed} lagi\n💎 Anggaran Primogems/Kuarza Diperlukan: *${costGems}*` });
    }

    if (cmd === "split_bil") {
      const amount = parseFloat(args[0]);
      const pax = parseInt(args[1]);
      if (isNaN(amount) || isNaN(pax) || pax < 2) return sock.sendMessage(from, { text: `🧮 Guna: *.split_bil [jumlah_RM] [bil_orang]*\nContoh: *.split_bil 125.50 4*` });
      const split = (amount / pax).toFixed(2);
      return sock.sendMessage(from, { text: `💸 *PEMBAHAGI BIL TOMYAM*\n\nJumlah: RM ${amount}\nAhli: ${pax} Orang\n\n👉 *RM ${split} seorang!* Bayar cepat, jangan buat-buat lupa!` });
    }

    if (cmd === "lumba_siput") {
       const color = args[0]?.toLowerCase();
       const bet = parseInt(args[1]);
       const validColors = ["merah", "biru", "hijau", "kuning"];
       if (!validColors.includes(color) || isNaN(bet) || user.cash < bet) {
           return sock.sendMessage(from, { text: `🐌 Guna: *.lumba_siput [merah/biru/hijau/kuning] [taruhan]*` });
       }
       
       user.cash -= bet;
       const winner = validColors[Math.floor(Math.random() * validColors.length)];
       
       if (winner === color) {
           const winAmt = bet * 3; 
           user.cash += winAmt;
           updateUser(cleanSender, user);
           return sock.sendMessage(from, { text: `🏁 *LUMBA SIPUT BABI!*\n\nSiput *${winner.toUpperCase()}* potong line kat selekoh akhir dan MENANG!\n💸 Anda untung +RM ${winAmt.toLocaleString()}!` });
       } else {
           updateUser(cleanSender, user);
           return sock.sendMessage(from, { text: `🏁 *LUMBA SIPUT BABI!*\n\nSiput *${winner.toUpperCase()}* menang! Siput ${color.toUpperCase()} anda asyik makan daun je tertinggal kat belakang.\n❌ Taruhan RM ${bet.toLocaleString()} lebur.` });
       }
    }

    if (cmd === "santau" || cmd === "santau_maya") {
       const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
       if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa: *.santau @user*` });
       const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
       if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Nak santau diri sendiri buat apa?` });
       
       if (user.cash < 2000) return sock.sendMessage(from, { text: `❌ Upah Dukun Siber (RM 2,000) tak cukup!` });
       
       user.cash -= 2000;
       const targetUser = getUser(cleanTarget);
       const isSuccess = Math.random() < 0.6; 
       
       if (isSuccess) {
           const curseLoss = Math.floor(targetUser.cash * 0.15); 
           targetUser.cash -= curseLoss;
           updateUser(cleanSender, user);
           updateUser(cleanTarget, targetUser);
           const nar = getRandomNarrative("SANTAU_SUCCESS");
           return sock.sendMessage(from, { text: `💀 *ILMU HITAM BERJAYA!*\n\n${nar}\nWang mangsa merosot sebanyak *-RM ${curseLoss.toLocaleString()}*!`, mentions: [cleanTarget] });
       } else {
           updateUser(cleanSender, user);
           const nar = getRandomNarrative("SANTAU_FAIL");
           return sock.sendMessage(from, { text: `🛡️ *SANTAU DITEPIH!*\n\n${nar}\nRM 2,000 hangus bayar dukun siber.`, mentions: [cleanTarget] });
       }
    }

    // 💰 UI BALANCE (.balance)
    if (cmd === "balance" || cmd === "bal") {
      return sock.sendMessage(from, { 
        text: `💳 𝗔𝗞𝗔𝗨𝗡 𝗞𝗘𝗪𝗔𝗡𝗚𝗔𝗡\n👤 Pemilik: @${user.name}\n====================\n💼 𝗗𝗼𝗺𝗽𝗲𝘁 : RM ${user.cash.toLocaleString()}\n🏦 𝗕𝗮𝗻𝗸   : RM ${user.bank.toLocaleString()}\n🪙 𝗖𝗿𝘆𝗽𝘁𝗼 : ${(user.btcUnits || 0).toFixed(4)} BTC\n====================` 
      });
    }

    // 📦 SISTEM BIDAAN LELONGAN
    if (cmd === "bida") {
      if (!db.auction || !db.auction.active) return sock.sendMessage(from, { text: `❌ Tiada lelongan aktif sedang dijalankan!` });
      const bidaan = parseInt(args[0]);
      if (isNaN(bidaan) || bidaan <= db.auction.highestBid) return sock.sendMessage(from, { text: `❌ Bidaan mestilah LEBIH tinggi dari RM ${db.auction.highestBid.toLocaleString()}!` });
      if (user.cash < bidaan) return sock.sendMessage(from, { text: `❌ Duit dalam dompet tak cukup bos!` });
      if (db.auction.highestBidder === cleanSender) return sock.sendMessage(from, { text: `⚠️ Anda sudah memegang bidaan tertinggi! Tak payah lawan harga sendiri.` });

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

      return sock.sendMessage(from, { text: `📣 *BIDAAN DITERIMA!* \n\n*${user.name}* membida dengan harga *RM ${bidaan.toLocaleString()}*!\n⏳ Masa dipanjangkan ke 60 saat.` });
    }

    // 🏆 RANKING & MUSIM
    if (cmd === "ranking" || cmd === "top_season" || cmd === "leaderboard") {
      const goldP = db.market?.gold || 350;
      const btcP = db.market?.btc || 280000;

      const ranked = Object.entries(db.users || {})
        .map(([id, u]) => {
          let propValue = 0;
          (u.properties || []).forEach(pId => {
            const pr = PROPERTIES.find(x => x.id === pId);
            if (pr) propValue += pr.price;
          });

          const totalNetWorth = (u.cash || 0) + (u.bank || 0) + 
                                Math.floor((u.goldGrams || 0) * goldP) + 
                                Math.floor((u.btcUnits || 0) * btcP) + 
                                propValue;

          return { id, name: u.name || id.split("@")[0], netWorth: totalNetWorth };
        })
        .sort((a, b) => b.netWorth - a.netWorth)
        .slice(0, 10);

      let ui = `╔═══════════════════════════════════╗\n   🏆 PAPAN KEDUDUKAN MUSIM KE-${db.season || 1} 🏆\n╚═══════════════════════════════════╝\n`;
      const medals = ["👑 1st", "🥈 2nd", "🥉 3rd", "🔹 4th", "🔹 5th", "🔹 6th", "🔹 7th", "🔹 8th", "🔹 9th", "🔹 10th"];

      ranked.forEach((r, idx) => {
        ui += `${medals[idx]} *${r.name}*\n   💰 Nilai Bersih: *RM ${r.netWorth.toLocaleString()}*\n\n`;
      });

      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "halloffame" || cmd === "hof") {
      if (!db.hallOfFame || db.hallOfFame.length === 0) return sock.sendMessage(from, { text: `🏛️ Dewan Kemegahan masih kosong!` });
      let ui = `╔═══════════════════════════════════╗\n   🏛️ AIRI'S DEWAN KEMEGAHAN (HALL OF FAME)\n╚═══════════════════════════════════╝\n\n`;
      db.hallOfFame.forEach(h => {
        ui += `🌟 *MUSIM KE-${h.season}*\n🥇 Juara: *${h.first.name}*\n🥈 Naib Juara: *${h.second.name}*\n🥉 Tempat Ke-3: *${h.third.name}*\n━━━━━━━━━━━━━━━━━━━━\n`;
      });
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "season_info" || cmd === "musim") {
      const ev = db.active_event_data ? SEASON_EVENTS[db.active_event_data.type] : null;
      let evText = "Tiada event khas aktif.";
      if (ev && db.active_event_data) {
        const remH = Math.max(1, Math.ceil((db.active_event_data.end - now) / 3600000));
        evText = `*${ev.name}*\n• Kesan: _${ev.desc}_\n• Baki Masa: *${remH} Jam*`;
      }
      return sock.sendMessage(from, { text: `╔═══════════════════════════╗\n   🌐 STATUS MUSIM AIRI'S CORNER\n╚═══════════════════════════╝\n📅 *Musim Semasa:* Musim Ke-${db.season || 1}\n🔥 *Acara Musim:* ${evText}` });
    }

    // 🪙 TRADING EMAS, BITCOIN & BESI BURUK
    if (cmd === "pasaran" || cmd === "crypto" || cmd === "gold") {
      const goldPrice = db.market?.gold || 350;
      const btcPrice = db.market?.btc || 280000;
      const scrapPrice = db.market?.scrap || 5;
      return sock.sendMessage(from, { 
        text: `╔═══════════════════════════╗\n   📈 BURSA SIBER & KOMODITI\n╚═══════════════════════════╝\n🪙 *EMAS 999 FIZIKAL:*\n• Harga Semasa: *RM ${goldPrice.toLocaleString()} / g*\n• Simpanan Anda: *${(user.goldGrams || 0).toFixed(2)} g*\n\n₿ *BITCOIN (BTC/MYR):*\n• Harga Semasa: *RM ${btcPrice.toLocaleString()} / BTC*\n• Simpanan Anda: *${(user.btcUnits || 0).toFixed(4)} BTC*\n\n⚙️ *BESI BURUK:*\n• Harga Semasa: *RM ${scrapPrice.toLocaleString()} / kg*\n• Simpanan Anda: *${user.scrapMetalKg} kg*\n\n💡 *.beli_emas*, *.jual_emas*, *.beli_btc*, *.jual_btc*, *.jual_besi*` 
      });
    }

    if (cmd === "beli_emas") {
      const grams = parseFloat(args[0]);
      if (isNaN(grams) || grams <= 0) return sock.sendMessage(from, { text: `❌ Format: *.beli_emas [gram]*` });
      const cost = Math.floor(grams * (db.market?.gold || 350));
      if (user.cash < cost) return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup (Perlu RM ${cost.toLocaleString()})!` });
      user.cash -= cost;
      user.goldGrams = (user.goldGrams || 0) + grams;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🪙 *BELI EMAS:* +${grams}g Emas 999 disimpan!` });
    }

    if (cmd === "jual_emas") {
      const grams = parseFloat(args[0]);
      if (isNaN(grams) || grams <= 0 || (user.goldGrams || 0) < grams) return sock.sendMessage(from, { text: `❌ Baki emas tidak cukup!` });
      const payout = Math.floor(grams * (db.market?.gold || 350));
      user.goldGrams -= grams;
      user.cash += payout;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🪙 *JUAL EMAS:* +RM ${payout.toLocaleString()} tunai dikreditkan!` });
    }

    if (cmd === "beli_btc") {
      const units = parseFloat(args[0]);
      if (isNaN(units) || units <= 0) return sock.sendMessage(from, { text: `❌ Format: *.beli_btc [unit]*` });
      const cost = Math.floor(units * (db.market?.btc || 280000));
      if (user.cash < cost) return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup (Perlu RM ${cost.toLocaleString()})!` });
      user.cash -= cost;
      user.btcUnits = (user.btcUnits || 0) + units;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `₿ *BELI BITCOIN:* +${units} BTC disimpan!` });
    }

    if (cmd === "jual_btc") {
      const units = parseFloat(args[0]);
      if (isNaN(units) || units <= 0 || (user.btcUnits || 0) < units) return sock.sendMessage(from, { text: `❌ Baki BTC tidak cukup!` });
      const payout = Math.floor(units * (db.market?.btc || 280000));
      user.btcUnits -= units;
      user.cash += payout;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `₿ *JUAL BITCOIN:* +RM ${payout.toLocaleString()} tunai dicairkan!` });
    }

    // 🎯 BOUNTY
    if (cmd === "bounty") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt) || amt < 5000) return sock.sendMessage(from, { text: `❌ Format: *.bounty @user [jumlah]* (Min RM 5,000)!` });
      if (user.cash < amt) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi!` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Tak boleh letak bounty kat kepala sendiri bos!` });
      
      user.cash -= amt;
      if (!db.bounties) db.bounties = {};
      db.bounties[cleanTarget] = (db.bounties[cleanTarget] || 0) + amt;
      saveDB(db);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎯 *BOUNTY DIBUKA:* Kepala @${cleanTarget.split("@")[0]} kini bernilai RM ${db.bounties[cleanTarget].toLocaleString()}!`, mentions: [cleanTarget] });
    }

    if (cmd === "list_bounty") {
      if (!db.bounties || Object.keys(db.bounties).length === 0) return sock.sendMessage(from, { text: `📜 Tiada buronan aktif.` });
      let ui = `╔═══════════════════════════╗\n   🎯 PAPAN BURONAN SIBER\n╚═══════════════════════════╝\n`;
      for (const tId in db.bounties) {
        ui += `• *${getUser(tId).name}* ➔ 💰 RM ${db.bounties[tId].toLocaleString()}\n`;
      }
      return sock.sendMessage(from, { text: ui });
    }

    // 🐕 KEDAI PET & TELUR GACHA
    if (cmd === "kedai_pet" || cmd === "petshop") {
      let ui = `╔═══════════════════════════╗\n   🐕 KEDAI PENGAWAL SIBER\n╚═══════════════════════════╝\n`;
      CYBER_PETS.forEach(p => { ui += `• *[${p.id}]* ${p.name}\n  💰 RM ${p.price.toLocaleString()} | _${p.buff}_\n\n`; });
      ui += `💡 Taip *.beli_pet [id]* ATAU *.beli_telur* (RM 50,000) untuk eram haiwan rawak!`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_pet") {
      const petId = args[0]?.toLowerCase();
      const petObj = CYBER_PETS.find(p => p.id === petId);
      if (!petObj) return sock.sendMessage(from, { text: `❌ Kod pet tidak sah!` });
      if (user.cash < petObj.price) return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup!` });
      
      user.cash -= petObj.price;
      user.pet = petObj.id;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎉 Anda kini dilindungi oleh *${petObj.name}*!` });
    }

    if (cmd === "beli_telur") {
      if (user.cash < 50000) return sock.sendMessage(from, { text: `❌ Sebiji Telur Misteri berharga RM 50,000!` });
      user.cash -= 50000;
      user.inventory.push({ id: 99, name: "Telur Pet Misteri 🥚" });
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🥚 Berjaya membeli Telur Pet Misteri! Taip *.tetas_telur* untuk eram.` });
    }

    if (cmd === "tetas_telur") {
      const idx = user.inventory.findIndex(i => i.id === 99);
      if (idx === -1) return sock.sendMessage(from, { text: `❌ Anda tiada Telur Pet Misteri dalam beg!` });
      user.inventory.splice(idx, 1);
      
      const rng = Math.random();
      let hatchedPet = CYBER_PETS[0]; 
      if (rng < 0.05) hatchedPet = CYBER_PETS.find(p => p.id === "kripto_dragon"); 
      else if (rng < 0.20) hatchedPet = CYBER_PETS.find(p => p.id === "harimau_malaya");
      else if (rng < 0.50) hatchedPet = CYBER_PETS.find(p => p.id === "doberman");

      user.pet = hatchedPet.id;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🐣 *TELUR MENETAS!* \n\nTahniah, anda mendapat *${hatchedPet.name}* bernilai RM ${hatchedPet.price.toLocaleString()}!\n✨ Buff Pasif: _${hatchedPet.buff}_` });
    }

    // =====================================================================
    // 🧲 UPDATE 3.0 : KEDAI & MAGNET FISHING 
    // =====================================================================
    if (cmd === "kedai_magnet") {
      let ui = `╔═══════════════════════════╗\n   🧲 KEDAI MAGNET SIBER\n╚═══════════════════════════╝\n`;
      MAGNET_SHOP.forEach(m => { ui += `• *[${m.id}]* ${m.name}\n  💰 RM ${m.price.toLocaleString()} | Kuasa: ${m.pullPower}x\n  _${m.desc}_\n\n`; });
      ui += `💡 Beli: *.beli_magnet [id]*\n🎣 Baling: *.baling_magnet*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_magnet") {
      const magId = args[0]?.toLowerCase();
      const mag = MAGNET_SHOP.find(m => m.id === magId);
      if (!mag) return sock.sendMessage(from, { text: `❌ ID magnet tidak wujud!` });
      if (user.cash < mag.price) return sock.sendMessage(from, { text: `❌ Tunai tak cukup!` });
      
      user.cash -= mag.price;
      user.magnetGear.magnet = mag.id;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🧲 Berjaya membeli *${mag.name}*!` });
    }

    if (cmd === "baling_magnet") {
      if (!user.magnetGear.magnet) return sock.sendMessage(from, { text: `❌ Anda tiada magnet! Beli di *.kedai_magnet*` });
      if (now < user.cooldowns.magnet && !isOwner) {
        const rem = Math.ceil((user.cooldowns.magnet - now) / 1000);
        return sock.sendMessage(from, { text: `⏳ Lengan lenguh! Tunggu ${rem} saat sebelum baling lagi.` });
      }

      user.cooldowns.magnet = now + 45000; 
      const magEquipped = MAGNET_SHOP.find(m => m.id === user.magnetGear.magnet);
      
      const pull = magEquipped.pullPower;
      const baseKg = Math.floor(Math.random() * 5) + 1;
      const totalKg = baseKg * pull;
      user.scrapMetalKg += totalKg;
      
      let extraText = "";
      const rareChance = pull * 0.02; 
      if (Math.random() < rareChance) {
         const loot = [...MAGNET_LOOT].sort(() => 0.5 - Math.random())[0];
         if (loot.type === "box") {
             user.misteryBoxes += 1;
             extraText = `\n🎁 *RARE PULL!* Anda menarik *Peti Besi Misteri* berlumut dari dasar! Buka dengan *.buka_peti*`;
         } else {
             user.cash += loot.price;
             extraText = `\n💎 *JACKPOT!* Anda terjumpa *${loot.name}* bernilai RM ${loot.price.toLocaleString()}!`;
         }
      }
      
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🧲 *TARIKAN BERJAYA!*\n\nAnda menggunakan ${magEquipped.name} dan berjaya menarik:\n⚙️ *${totalKg} KG Besi Buruk*\n📦 Jumlah Besi Anda: ${user.scrapMetalKg} KG\n${extraText}\n\n💡 Taip *.jual_besi* untuk tukar ke tunai.` });
    }
    
    if (cmd === "jual_besi") {
      if (user.scrapMetalKg <= 0) return sock.sendMessage(from, { text: `❌ Anda tiada besi buruk untuk dijual!` });
      const scrapPrice = db.market?.scrap || 5;
      const payout = user.scrapMetalKg * scrapPrice;
      user.cash += payout;
      const soldKg = user.scrapMetalKg;
      user.scrapMetalKg = 0;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `⚙️ *TIMBANG KILO:* Anda menjual ${soldKg} KG besi pada harga pasaran RM ${scrapPrice}/KG.\n💵 Tunai diterima: *+RM ${payout.toLocaleString()}*` });
    }

    if (cmd === "buka_peti") {
      if (user.misteryBoxes <= 0) return sock.sendMessage(from, { text: `❌ Anda tiada Peti Besi Misteri!` });
      user.misteryBoxes -= 1;
      const isZonk = Math.random() < 0.4; 
      if (isZonk) {
         updateUser(cleanSender, user);
         return sock.sendMessage(from, { text: `📦 *PETI DIBUKA:* Alamak! Dalam peti cuma ada surat khabar lama basah. (Tiada nilai)` });
      } else {
         const reward = Math.floor(Math.random() * 50000) + 5000;
         user.cash += reward;
         updateUser(cleanSender, user);
         return sock.sendMessage(from, { text: `📦 *PETI DIBUKA:* Jackpot! Anda menemui jongkong perak & wang kertas lama bernilai *RM ${reward.toLocaleString()}*!` });
      }
    }

    // =====================================================================
    // 🎣 18. KEDAI PANCING & MEMANCING 
    // =====================================================================
    if (cmd === "kedai_pancing" || cmd === "tackleshop") {
      const subCategory = args[0];
      if (!subCategory) {
        let menu = `╔═════════════════════════════════════╗\n   🎣 KEDAI PERALATAN PANCING AIRI 🎣\n╚═════════════════════════════════════╝\nSila pilih kategori kedai dengan nombor:\n1️⃣ Joran (Rod)\n2️⃣ Kekili (Reel)\n3️⃣ Umpan (Bait)\n4️⃣ Akuarium (Tank)\n\n👉 Contoh guna: *.kedai_pancing 1*`;
        return sock.sendMessage(from, { text: menu });
      }

      let ui = "";
      if (subCategory === "1") {
        ui += `╔═════════════════════════════════════╗\n   🎋 KEDAI KATEGORI: JORAN (ROD)\n╚═════════════════════════════════════╝\n`;
        FISHING_SHOP.rods.forEach(r => { ui += `• *[${r.id}]* ${r.name}\n  💰 RM ${r.price.toLocaleString()} | _${r.desc}_\n\n`; });
      } else if (subCategory === "2") {
        ui += `╔═════════════════════════════════════╗\n   ⚙️ KEDAI KATEGORI: KEKILI (REEL)\n╚═════════════════════════════════════╝\n`;
        FISHING_SHOP.reels.forEach(re => { ui += `• *[${re.id}]* ${re.name}\n  💰 RM ${re.price.toLocaleString()} | _${re.desc}_\n\n`; });
      } else if (subCategory === "3") {
        ui += `╔═════════════════════════════════════╗\n   🪱 KEDAI KATEGORI: UMPAN (BAIT)\n╚═════════════════════════════════════╝\n`;
        FISHING_SHOP.baits.forEach(b => { ui += `• *[${b.id}]* ${b.name}\n  💰 RM ${b.price.toLocaleString()} | _${b.desc}_\n\n`; });
      } else if (subCategory === "4") {
        ui += `╔═════════════════════════════════════╗\n   🫙 KEDAI KATEGORI: AKUARIUM (TANK)\n╚═════════════════════════════════════╝\n`;
        FISHING_SHOP.tanks.forEach(t => { ui += `• *[${t.id}]* ${t.name}\n  💰 RM ${t.price.toLocaleString()} | _${t.desc}_\n\n`; });
      } else {
        return sock.sendMessage(from, { text: `❌ Pilihan tidak sah! Sila pilih nombor 1 hingga 4.` });
      }
      ui += `👉 Beli: *.beli_pancing [id]*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_pancing") {
      const itemCode = args[0]?.toLowerCase();
      if (!itemCode) return sock.sendMessage(from, { text: `❌ Sila masukkan kod barang!` });
      const allFishingItems = [...FISHING_SHOP.rods, ...FISHING_SHOP.reels, ...FISHING_SHOP.baits, ...FISHING_SHOP.tanks];
      const item = allFishingItems.find(i => i.id === itemCode);
      if (!item) return sock.sendMessage(from, { text: `❌ Kod peralatan tidak wujud!` });
      if (user.cash < item.price) return sock.sendMessage(from, { text: `❌ Tunai anda tidak mencukupi!` });

      user.cash -= item.price;
      if (item.luckBonus !== undefined) user.fishingGear.rod = item.id;
      else if (item.cdReduction !== undefined) user.fishingGear.reel = item.id;
      else if (item.priceMult !== undefined) user.fishingGear.bait = item.id;
      else if (item.capacity !== undefined) user.fishingGear.tank = item.id;

      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎉 *PEMBELIAN BERJAYA:* Anda telah melengkapkan *${item.name}*!\n✨ _${item.desc}_` });
    }

    if (cmd === "mancing" || cmd === "fish") {
      const userReel = FISHING_SHOP.reels.find(r => r.id === user.fishingGear?.reel) || FISHING_SHOP.reels[0];
      const actualCd = Math.max(15000, 60000 - userReel.cdReduction);

      if (now < user.cooldowns.fish && !isOwner) {
        const rem = Math.ceil((user.cooldowns.fish - now) / 1000);
        return sock.sendMessage(from, { text: `🎣 Joran masih di air menunggu ikan mematuk! Sila tunggu *${rem} saat* lagi.` });
      }

      const userRod = FISHING_SHOP.rods.find(r => r.id === user.fishingGear?.rod) || FISHING_SHOP.rods[0];
      const userBait = FISHING_SHOP.baits.find(b => b.id === user.fishingGear?.bait);

      user.cooldowns.fish = now + actualCd;
      let caughtInstance = generateFishInstance(userRod);
      
      // RISIKO MEKANIK UPDATE 3.0
      if (caughtInstance.isDangerous && Math.random() < 0.35) {
          user.cooldowns.hospitalUntil = now + (300 * 1000); 
          user.cash = Math.max(0, user.cash - 1500); 
          
          if (db.pendingFish?.[cleanSender]) delete db.pendingFish[cleanSender];
          saveDB(db);
          updateUser(cleanSender, user);
          
          return sock.sendMessage(from, { text: `🚨 *TRAGEDI JETI!*\n\nAnda cuba menaikkan *${caughtInstance.name}* tetapi ia mengganas dan menyerang anda!\n🚑 Dihantar ke Hospital (5 minit).\n💸 Bil Perubatan: *-RM 1,500*` });
      }

      let fPrice = caughtInstance.price;
      if (userBait && fPrice > 0) {
        fPrice = Math.floor(fPrice * userBait.priceMult);
      }
      if (currentSeasonEvent?.fishMult) fPrice = Math.floor(fPrice * currentSeasonEvent.fishMult);

      caughtInstance.price = fPrice; 

      if (!db.pendingFish) db.pendingFish = {};
      db.pendingFish[cleanSender] = { fish: caughtInstance, finalPrice: fPrice };
      saveDB(db);
      updateUser(cleanSender, user);

      if (fPrice === 0) {
        delete db.pendingFish[cleanSender];
        saveDB(db);
        return sock.sendMessage(from, { text: `🎣 *${user.name}* menaikkan ${caughtInstance.name} (${caughtInstance.weightKg} kg).\n(Sampah - Dibuang semula ke laut!)` });
      }

      const baitUsedText = userBait ? `\n🪱 Umpan: *${userBait.name}* (Kekal)` : "";

      return sock.sendMessage(from, { 
        text: `╔═══════════════════════════════════╗
   🎣 TANGKAPAN JETI BERJAYA!
╚═══════════════════════════════════╝
🐟 Hasil: *${caughtInstance.name}*
⚖️ Berat: *${caughtInstance.weightKg} kg*
🏷️ Peringkat: *${caughtInstance.tier}*
💰 Nilai Jual: *RM ${fPrice.toLocaleString()}*${baitUsedText}
✨ *Buff Pasif:* _${caughtInstance.buff}_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 *TINDAKAN ANDA:*
1️⃣ Taip: *.jual_ikan* ➔ Ambil tunai
2️⃣ Taip: *.bela_ikan* ➔ Simpan ke Akuarium` 
      });
    }

    if (cmd === "jual_ikan") {
      const pData = db.pendingFish?.[cleanSender];
      if (!pData) return sock.sendMessage(from, { text: `❌ Tiada ikan sedang menunggu keputusan! Taip *.mancing* dahulu.` });
      user.cash += pData.finalPrice;
      user.stats.fishes = (user.stats.fishes || 0) + 1;
      delete db.pendingFish[cleanSender];
      saveDB(db);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `💵 *IKAN DIJUAL:* +RM ${pData.finalPrice.toLocaleString()} tunai diterima!` });
    }

    if (cmd === "bela_ikan") {
      const pData = db.pendingFish?.[cleanSender];
      if (!pData) return sock.sendMessage(from, { text: `❌ Tiada ikan menunggu keputusan!` });
      
      const currentTank = FISHING_SHOP.tanks.find(t => t.id === user.fishingGear?.tank) || FISHING_SHOP.tanks[0];
      if (user.aquarium.length >= currentTank.capacity) {
        return sock.sendMessage(from, { text: `❌ *AKUARIUM PENUH!* (Maks: ${currentTank.capacity}) Jual ikan guna *.jual_ikan*!` });
      }

      user.aquarium.push(pData.fish);
      user.stats.fishes = (user.stats.fishes || 0) + 1;
      delete db.pendingFish[cleanSender];
      saveDB(db);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🐠 *IKAN DIBELA:* *${pData.fish.name}* dimasukkan ke Akuarium!` });
    }

    if (cmd === "akuarium") {
      const currentTank = FISHING_SHOP.tanks.find(t => t.id === user.fishingGear?.tank) || FISHING_SHOP.tanks[0];
      if (!user.aquarium || user.aquarium.length === 0) {
        return sock.sendMessage(from, { text: `🐠 Akuarium (${currentTank.name}) anda masih kosong!` });
      }

      let ui = `╔═══════════════════════════════════╗\n   🐠 KOLEKSI AKUARIUM (${currentTank.name})\n   [ Kapasiti: ${user.aquarium.length}/${currentTank.capacity} Ekor ]\n╚═══════════════════════════════════╝\n`;
      user.aquarium.forEach((f, idx) => { ui += `${idx + 1}. *${f.name}* (${f.weightKg}kg)\n   💰 RM ${f.price.toLocaleString()}\n   ✨ _${f.buff}_\n\n`; });
      ui += `💡 Taip *.jual_akuarium* untuk jual semua ikan serentak!`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "jual_akuarium") {
      if (!user.aquarium || user.aquarium.length === 0) return sock.sendMessage(from, { text: `🐠 Akuarium kosong bos!` });
      let totalP = 0;
      user.aquarium.forEach(f => { totalP += f.price; });
      user.cash += totalP;
      user.aquarium = [];
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `💵 *AKUARIUM DIKOSONGKAN!* Semua ikan dijual dengan nilai keseluruhan +RM ${totalP.toLocaleString()}!` });
    }

    // =====================================================================
    // 💼 KERJA HALAL (CD TEPAT 30 SAAT + PET BUFF HARIMAU/NAGA)
    // =====================================================================
    if (cmd === "kerja" || cmd === "work") {
      if (now < user.cooldowns.work && !isOwner) {
        const rem = Math.ceil((user.cooldowns.work - now) / 1000);
        return sock.sendMessage(from, { text: `⚠️ Rehat *${rem} saat* lagi sebelum shift seterusnya!` });
      }

      const assignedJob = JOBS[Math.floor(Math.random() * JOBS.length)];
      let payout = Math.floor(Math.random() * (assignedJob.maxPay - assignedJob.minPay + 1)) + assignedJob.minPay;

      if (activePhoneObj?.perk === "work" || activePhoneObj?.perk === "god") payout += Math.floor(payout * activePhoneObj.val);
      if (currentSeasonEvent?.jobMult) payout = Math.floor(payout * currentSeasonEvent.jobMult);

      if (user.pet) {
         const petObj = CYBER_PETS.find(p => p.id === user.pet);
         if (petObj && (petObj.perk === "work_boost" || petObj.perk === "dragon_god")) payout += Math.floor(payout * petObj.val);
      }

      user.cash += payout;
      user.stats.works += 1;
      user.cooldowns.work = now + 30000;
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { text: `╔═══════════════════════════╗\n   💼 SLIP GAJI HALAL AIRI\n╚═══════════════════════════╝\n👤 Pekerja: *${user.name}*\n🏢 Tugasan: *${assignedJob.name}*\n💵 Upah: *+RM ${payout.toLocaleString()}*` });
    }

    if (cmd === "daily") {
      if (now < user.cooldowns.daily && !isOwner) return sock.sendMessage(from, { text: `⏳ Elaun harian dah dituntut! Datang esok ya.` });
      let bonusAmt = currentSeasonEvent?.type === "INFLATION_SPIKE" ? 300 : 100;
      user.cash += bonusAmt;
      user.cooldowns.daily = now + (24 * 3600 * 1000);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎁 *BANTUAN HARIAN:* +RM ${bonusAmt.toLocaleString()} tunai dikreditkan!` });
    }

    if (cmd === "showroom") {
      const page = parseInt(args[0]) || 1;
      const start = (page - 1) * 20;
      const pageVehicles = VEHICLES.slice(start, start + 20);
      let ui = `╔═══════════════════════════╗\n   🏎️ SHOWROOM JENTERA (PAGE ${page}/4)\n╚═══════════════════════════╝\n`;
      pageVehicles.forEach(v => { ui += `• *[${v.id}]* ${v.name} (${v.type})\n  💰 RM ${v.price.toLocaleString()} | ⚡ ${v.speed} km/h\n\n`; });
      ui += `💡 Taip *.beli_kenderaan [id]* | Halaman: *.showroom 1*, *.showroom 2*, *.showroom 3*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_kenderaan") {
      const v = VEHICLES.find(x => x.id === args[0]?.toLowerCase());
      if (!v) return sock.sendMessage(from, { text: `❌ Kod jentera tidak wujud!` });
      if (user.cash < v.price) return sock.sendMessage(from, { text: `❌ Baki tunai tidak cukup!` });
      if (user.vehicles.includes(v.id)) return sock.sendMessage(from, { text: `⚠️ Jentera ini sudah ada di garaj!` });
      user.cash -= v.price;
      user.vehicles.push(v.id);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎉 Berjaya beli *${v.name}*!` });
    }

    if (cmd === "bengkel") {
      const vId = args[0]?.toLowerCase();
      if (!vId) {
        if (user.vehicles.length === 0) return sock.sendMessage(from, { text: `❌ Garaj kosong! Beli di *.showroom* dahulu.` });
        let garajUI = `╔═══════════════════════════╗\n   🔧 BENGKEL MODIFIKASI AIRI\n╚═══════════════════════════╝\n`;
        user.vehicles.forEach((userVId, index) => {
          const vData = VEHICLES.find(v => v.id === userVId);
          if (vData) garajUI += `${index + 1}. ${vData.name} ➔ Kod: *${vData.id}*\n`;
        });
        garajUI += `\n💡 Taip *.bengkel [kod_jentera]*`;
        return sock.sendMessage(from, { text: garajUI });
      }

      if (!user.vehicles.includes(vId)) return sock.sendMessage(from, { text: `❌ Jentera tiada dalam garaj!` });
      const vehicle = VEHICLES.find(v => v.id === vId);
      const partsAvailable = MOD_PARTS[vehicle.type] || [];
      const installedMods = user.vehicleMods?.[vId] || [];

      let modUI = `╔═══════════════════════════╗\n   🛠️ MODIFIKASI : ${vehicle.name.toUpperCase()}\n╚═══════════════════════════╝\n`;
      partsAvailable.forEach(p => {
        const isInstalled = installedMods.includes(p.name);
        modUI += `• *[ID ${p.id}]* ${p.name} ➔ ${isInstalled ? "✅ [TERPASANG]" : `RM ${p.price.toLocaleString()}`}\n  _${p.desc}_\n\n`;
      });
      modUI += `💡 Taip *.pasang ${vId} [ID_Barang]*`;
      return sock.sendMessage(from, { text: modUI });
    }

    if (cmd === "pasang") {
      const vId = args[0]?.toLowerCase();
      const partId = parseInt(args[1]);
      if (!vId || isNaN(partId) || !user.vehicles.includes(vId)) return sock.sendMessage(from, { text: `❌ Format: *.pasang [kod_jentera] [id_barang]*` });
      const vehicle = VEHICLES.find(v => v.id === vId);
      const part = MOD_PARTS[vehicle.type]?.find(p => p.id === partId);
      if (!part) return sock.sendMessage(from, { text: `❌ ID barang tidak sah!` });
      
      if (!user.vehicleMods) user.vehicleMods = {};
      if (!user.vehicleMods[vId]) user.vehicleMods[vId] = [];
      if (user.vehicleMods[vId].includes(part.name)) {
        return sock.sendMessage(from, { text: `⚠️ Jentera ini sudah dilengkapi dengan *${part.name}*! Tak boleh pasang barang yang sama berganda.` });
      }

      if (user.cash < part.price) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi!` });

      user.cash -= part.price;
      user.vehicleMods[vId].push(part.name); 
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🔧 *${part.name}* berjaya dipasang pada *${vehicle.name}*!` });
    }

    // 🏁 DRAG RACE
    if (cmd === "lumba" || cmd === "race") {
      const vId = args[0]?.toLowerCase();
      if (!vId || !user.vehicles.includes(vId)) return sock.sendMessage(from, { text: `❌ Masukkan kod jentera! Contoh: *.lumba y15*` });
      if (now < user.cooldowns.race && !isOwner) {
        const rem = Math.ceil((user.cooldowns.race - now) / 1000);
        return sock.sendMessage(from, { text: `🏎️ Enjin jentera masih panas mendidih! Tunggu *${rem} saat* lagi.` });
      }

      const vehicle = VEHICLES.find(v => v.id === vId);
      user.cooldowns.race = now + (90 * 1000);

      let speedBonus = 0;
      (user.vehicleMods?.[vId] || []).forEach(mName => {
        const pObj = MOD_PARTS[vehicle.type]?.find(p => p.name === mName);
        if (pObj) speedBonus += pObj.boostSpeed;
      });

      const totalSpeed = vehicle.speed + speedBonus;
      let winChance = totalSpeed / 240;
      if (activePhoneObj?.perk === "race" || activePhoneObj?.perk === "god") winChance += activePhoneObj.val;

      const isWon = Math.random() < winChance || isOwner;

      if (isWon) {
        let reward = Math.floor((vehicle.price * 0.05) + 500);
        if (currentSeasonEvent?.raceMult) reward = Math.floor(reward * currentSeasonEvent.raceMult);
        user.cash += reward;
        user.stats.racesWon = (user.stats.racesWon || 0) + 1;
        updateUser(cleanSender, user);
        const narrative = getRandomNarrative("RACE_WIN");
        return sock.sendMessage(from, { text: `🏁 *JUARA DRAG RACE!* 🏁\n\n${narrative}\n\n🏎️ Jentera: *${vehicle.name}* (${totalSpeed} km/h)\n💰 Hadiah: *+RM ${reward.toLocaleString()}*` });
      } else {
        const repairCost = Math.floor(vehicle.price * 0.02);
        user.cash = Math.max(0, user.cash - repairCost);
        updateUser(cleanSender, user);
        const narrative = getRandomNarrative("RACE_CRASH");
        return sock.sendMessage(from, { text: `💥 *TERBABAS DI LITAR!* 💥\n\n${narrative}\n\n💸 Kos Baiki: *-RM ${repairCost.toLocaleString()}*` });
      }
    }

    // 🏴‍☠️ BLACK MARKET & JENAYAH
    if (cmd === "bm" || cmd === "beli_bm") {
      const mytHour = new Date(Date.now() + 28800000).getUTCHours();
      if (mytHour >= 7 && !isOwner) {
         return sock.sendMessage(from, { text: `🚨 *BLACK MARKET DITUTUP!* Operasi haram ini hanya bermula jam 12:00 AM hingga 7:00 AM waktu Malaysia.` });
      }

      if (cmd === "bm") {
        let ui = `╔═══════════════════════════╗\n   🏴‍☠️ BLACK MARKET UNDERWORLD\n╚═══════════════════════════╝\n`;
        BLACKMARKET_ITEMS.forEach(i => {
          let pPrice = currentSeasonEvent?.type === "TECH_SURGE" ? Math.floor(i.price * 0.60) : i.price;
          ui += `• *[ID ${i.id}]* ${i.name}\n  💰 RM ${pPrice.toLocaleString()} | _${i.desc}_\n\n`;
        });
        ui += `💡 Taip *.beli_bm [ID]*`;
        return sock.sendMessage(from, { text: ui });
      }

      if (cmd === "beli_bm") {
        const item = BLACKMARKET_ITEMS.find(i => i.id === parseInt(args[0]));
        if (!item) return sock.sendMessage(from, { text: `❌ ID perkakasan tidak wujud!` });
        let realPrice = currentSeasonEvent?.type === "TECH_SURGE" ? Math.floor(item.price * 0.60) : item.price;
        if (user.cash < realPrice) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi!` });
        if (user.inventory.some(i => i.id === item.id)) return sock.sendMessage(from, { text: `⚠️ Barang ini sudah ada di inventori!` });

        user.cash -= realPrice;
        user.inventory.push({ id: item.id, name: item.name });
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🛒 Berjaya beli *${item.name}*!` });
      }
    }

    if (cmd === "jenayah") {
      let ui = `╔═══════════════════════════╗\n   💀 DARKWEB CRIME NETWORK\n╚═══════════════════════════╝\n`;
      CRIMES.forEach(c => {
        const reqObj = c.reqItem ? BLACKMARKET_ITEMS.find(i => i.id === c.reqItem) : null;
        let rMin = currentSeasonEvent?.rewardMult ? Math.floor(c.rewardMin * currentSeasonEvent.rewardMult) : c.rewardMin;
        let rMax = currentSeasonEvent?.rewardMult ? Math.floor(c.rewardMax * currentSeasonEvent.rewardMult) : c.rewardMax;
        ui += `• *[ID ${c.id}]* ${c.name}\n  💵 Loot: RM ${rMin.toLocaleString()} - ${rMax.toLocaleString()} | 🔒 ${reqObj ? reqObj.name : "Bebas"}\n\n`;
      });
      ui += `💡 Taip *.buat_jenayah [ID]*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "buat_jenayah") {
      const c = CRIMES.find(x => x.id === parseInt(args[0]));
      if (!c) return sock.sendMessage(from, { text: `❌ ID jenayah tidak sah!` });
      if (c.reqItem && !user.inventory.some(i => i.id === c.reqItem)) {
        return sock.sendMessage(from, { text: `❌ Perlukan alat dari *.bm*!` });
      }

      if (now < user.cooldowns.crime && !isOwner) {
        const rem = Math.ceil((user.cooldowns.crime - now) / 1000);
        return sock.sendMessage(from, { text: `⏳ Polis sedang meronda kawasan! Tunggu *${rem} saat* lagi.` });
      }

      user.cooldowns.crime = now + (c.cd * 1000);
      let crimeRate = (c.id === 15) ? 0.60 : 0.55; 
      if (activePhoneObj?.perk === "crime" || activePhoneObj?.perk === "god") crimeRate += activePhoneObj.val;

      const isSuccess = Math.random() < crimeRate || isOwner;

      if (isSuccess) {
        let reward = Math.floor(Math.random() * (c.rewardMax - c.rewardMin + 1)) + c.rewardMin;
        if (currentSeasonEvent?.rewardMult) reward = Math.floor(reward * currentSeasonEvent.rewardMult);
        user.cash += reward;
        user.stats.crimes += 1;
        user.stars = Math.min(5, user.stars + c.stars);
        updateUser(cleanSender, user);
        const narrative = getRandomNarrative(c.id === 15 ? "BANK_HACK_SUCCESS" : "CRIME_SUCCESS");
        return sock.sendMessage(from, { text: `🦹 *MISI BERJAYA:* ${c.name}\n\n${narrative}\n\n💵 Hasil: *+RM ${reward.toLocaleString()}*\n⭐ Wanted: ${"⭐".repeat(user.stars)}` });
      } else {
        user.stars = Math.min(5, user.stars + 1);
        let jailTimeSec = Math.max(30, user.stars * 30);
        let fine = currentSeasonEvent?.fineMult ? Math.floor(c.fine * currentSeasonEvent.fineMult) : c.fine;
        user.cash = Math.max(0, user.cash - fine);
        user.cooldowns.jailUntil = now + (jailTimeSec * 1000);
        
        let extraText = "";
        if (c.id === 15) {
           const invIdx = user.inventory.findIndex(i => i.id === 12);
           if (invIdx !== -1) user.inventory.splice(invIdx, 1);
           extraText = "\n💥 *ALAT PENGGODAM RM150K ANDA TELAH MUSNAH TERBAKAR!*";
        }
        updateUser(cleanSender, user);
        const narrative = getRandomNarrative("CRIME_BUSTED");
        return sock.sendMessage(from, { text: `🚨 *KANTOI POLIS!* 🚨\n\n${narrative}\n\n💸 Denda: *-RM ${fine.toLocaleString()}* & lokap ${jailTimeSec}s!${extraText}` });
      }
    }

    if (cmd === "list_hartanah") {
      let ui = `╔═══════════════════════════╗\n   🏢 PASARAN HARTANAH AIRI (25 ASET)\n╚═══════════════════════════╝\n`;
      PROPERTIES.forEach(p => { ui += `• *[ID ${p.id}]* ${p.name}\n  💰 RM ${p.price.toLocaleString()} | 💵 Sewa: RM ${p.rent.toLocaleString()}/hari\n\n`; });
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_rumah") {
      const pr = PROPERTIES.find(x => x.id === parseInt(args[0]));
      if (!pr) return sock.sendMessage(from, { text: `❌ ID hartanah tidak sah!` });
      if (user.cash < pr.price) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi!` });
      if (user.properties.includes(pr.id)) return sock.sendMessage(from, { text: `⚠️ Anda sudah ada unit ini!` });
      user.cash -= pr.price;
      user.properties.push(pr.id);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🏠 Geran rasmi *${pr.name}* kini milik anda!` });
    }

    if (cmd === "kutip_sewa") {
      if (user.properties.length === 0) return sock.sendMessage(from, { text: `❌ Anda tiada hartanah!` });
      if (now < user.cooldowns.rent && !isOwner) {
        const remH = Math.ceil((user.cooldowns.rent - now) / 3600000);
        return sock.sendMessage(from, { text: `⏳ Kutip lagi dalam *${remH} jam*.` });
      }
      let totalRent = 0;
      user.properties.forEach(pId => {
        const pr = PROPERTIES.find(x => x.id === pId);
        if (pr) totalRent += pr.rent;
      });
      user.cash += totalRent;
      user.cooldowns.rent = now + (24 * 3600 * 1000);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `💵 *DIVIDEN SEWA:* +RM ${totalRent.toLocaleString()} dikreditkan!` });
    }

    if (cmd === "coinflip") {
      const choice = args[0]?.toLowerCase();
      const bet = parseInt(args[1]);
      if (!["kepala", "bunga"].includes(choice) || isNaN(bet) || bet <= 0 || user.cash < bet) return sock.sendMessage(from, { text: `Format: *.coinflip [kepala/bunga] [taruhan]*` });
      user.cash -= bet;
      const isWin = Math.random() < 0.49 || isOwner;
      if (isWin) {
        const win = bet * 2;
        user.cash += win;
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🪙 *MENANG:* Syiling ${choice.toUpperCase()}! (+RM ${win.toLocaleString()})` });
      } else {
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🪙 *TEWAS:* Taruhan *-RM ${bet.toLocaleString()}* lesap!` });
      }
    }

    if (cmd === "slot") {
      const bet = parseInt(args[0]);
      if (isNaN(bet) || bet < 10 || user.cash < bet) return sock.sendMessage(from, { text: `❌ Min taruhan RM 10 dan duit mencukupi!` });
      const icons = ["🍒", "🍋", "🍇", "💎", "7️⃣"];
      const r1 = icons[Math.floor(Math.random() * icons.length)];
      const r2 = icons[Math.floor(Math.random() * icons.length)];
      const r3 = icons[Math.floor(Math.random() * icons.length)];
      user.cash -= bet;
      let mult = (r1 === r2 && r2 === r3) ? (r1 === "7️⃣" ? 10 : 5) : ((r1 === r2 || r2 === r3 || r1 === r3) ? 1.5 : 0);
      if (isOwner && mult === 0) mult = 3;

      if (mult > 0) {
        const reward = Math.floor(bet * mult);
        user.cash += reward;
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n🔥 *JACKPOT!* +RM ${reward.toLocaleString()}!` });
      } else {
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n❌ Tiada padanan. Rugi -RM ${bet.toLocaleString()}.` });
      }
    }

    if (cmd === "hutang_ahlong") {
      const amt = parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || amt > 500000) return sock.sendMessage(from, { text: `❌ Had pinjaman: RM 1 - RM 500,000!` });
      if (user.debt > 0) return sock.sendMessage(from, { text: `❌ Selesaikan baki hutang lama dahulu!` });
      user.cash += amt;
      user.debt = Math.floor(amt * 1.25);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🦈 *PINJAMAN LULUS:* Tunai +RM ${amt.toLocaleString()} diterima. Baki bayaran: RM ${user.debt.toLocaleString()} (Faedah 25%).` });
    }

    if (cmd === "bayar_ahlong") {
      if (user.debt <= 0) return sock.sendMessage(from, { text: `ℹ️ Tiada rekod hutang.` });
      if (user.cash < user.debt) return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup bayar RM ${user.debt.toLocaleString()}!` });
      user.cash -= user.debt;
      user.debt = 0;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🦈 *HUTANG LANGSAI:* Rumah anda selamat!` });
    }

    if (cmd === "deposit" || cmd === "dep") {
      const amt = args[0] === "all" ? user.cash : parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || user.cash < amt) return sock.sendMessage(from, { text: `❌ Baki tunai tidak mencukupi!` });
      user.cash -= amt;
      user.bank += amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🏦 *DEPOSIT:* +RM ${amt.toLocaleString()} disimpan dalam bank!` });
    }

    if (cmd === "withdraw" || cmd === "wd") {
      const amt = args[0] === "all" ? user.bank : parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || user.bank < amt) return sock.sendMessage(from, { text: `❌ Baki bank tidak mencukupi!` });
      user.bank -= amt;
      user.cash += amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `💵 *WITHDRAW:* +RM ${amt.toLocaleString()} dikeluarkan ke poket!` });
    }

    if (cmd === "transfer" || cmd === "pay") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt) || amt <= 0 || user.cash < amt) return sock.sendMessage(from, { text: `❌ Format: *.transfer @user [jumlah]*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Tak boleh transfer duit kat diri sendiri bos!` });
      const targetUser = getUser(cleanTarget);
      user.cash -= amt;
      targetUser.cash += amt;
      updateUser(cleanSender, user);
      updateUser(cleanTarget, targetUser);
      return sock.sendMessage(from, { text: `💸 *TRANSFER:* RM ${amt.toLocaleString()} dihantar ke *${targetUser.name}*!` });
    }

    if (cmd === "rompak") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa: *.rompak @user*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Takkan nak samun diri sendiri?` });
      const targetUser = getUser(cleanTarget);
      if (targetUser.cash < 100) return sock.sendMessage(from, { text: `😅 Mangsa poket kempis bawah RM100.` });

      if (now < user.cooldowns.crime && !isOwner) {
        const rem = Math.ceil((user.cooldowns.crime - now) / 1000);
        return sock.sendMessage(from, { text: `⏳ Anda sedang menyorok dari polis! Tunggu *${rem} saat* lagi.` });
      }

      let petObj = null;
      if (targetUser.pet) {
        petObj = CYBER_PETS.find(p => p.id === targetUser.pet);
      }

      if (petObj && (petObj.perk === "anti_rob" || petObj.perk === "dual_def" || petObj.perk === "dragon_god")) {
        if (Math.random() < petObj.val) {
          user.cash = Math.max(0, user.cash - 1000);
          updateUser(cleanSender, user);
          const narrative = getRandomNarrative("PET_DEFEND");
          return sock.sendMessage(from, { text: `🛡️ *DISERANG PENGAWAL!*\n\n${narrative}\n\n💸 Ganti Rugi: *-RM 1,000*` });
        }
      }

      user.cooldowns.crime = now + (180 * 1000);
      if (Math.random() < 0.50 || isOwner) {
        const stolen = Math.floor(targetUser.cash * 0.10); 
        targetUser.cash -= stolen;
        user.cash += stolen;
        user.stars = Math.min(5, user.stars + 1);

        let bountyNotice = "";
        if (db.bounties && db.bounties[cleanTarget]) {
          const claimed = db.bounties[cleanTarget];
          user.cash += claimed;
          delete db.bounties[cleanTarget];
          saveDB(db);
          bountyNotice = `\n🎯 *BOUNTY CLAIMED:* Wang tebusan kepala +RM ${claimed.toLocaleString()}!`;
        }

        updateUser(cleanSender, user);
        updateUser(cleanTarget, targetUser);
        const narrative = getRandomNarrative("ROB_SUCCESS");
        return sock.sendMessage(from, { text: `🥷 *ROMPAKAN BERJAYA!*\n\n${narrative}\n\n💵 Hasil: *+RM ${stolen.toLocaleString()}* dari *${targetUser.name}*!${bountyNotice}`, mentions: [cleanTarget] });
      } else {
        user.cash = Math.max(0, user.cash - 500);
        user.cooldowns.jailUntil = now + (60 * 1000);
        updateUser(cleanSender, user);
        const narrative = getRandomNarrative("ROB_FAIL_ROAST");
        return sock.sendMessage(from, { text: `🚨 *KANTOI SAMUN SIBER!* \n\n${narrative}\n\n💸 Denda: *-RM 500* & Lokap 60 saat!`, mentions: [cleanTarget] });
      }
    }

    if (cmd === "shop" || cmd === "warung") {
      let ui = `╔═══════════════════════════╗\n   🍔 WARUNG MAKANAN AIRI\n╚═══════════════════════════╝\n`;
      FOOD_ITEMS.forEach(f => { ui += `• *[${f.id}]* ${f.name} ➔ RM ${f.price}\n  _${f.desc}_\n\n`; });
      ui += `💡 Taip *.beli_makanan [id]* & *.makan [id]*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_makanan") {
      const f = FOOD_ITEMS.find(x => x.id === args[0]?.toLowerCase());
      if (!f || user.cash < f.price) return sock.sendMessage(from, { text: `❌ Menu tidak sah atau duit tidak cukup!` });
      user.cash -= f.price;
      user.food.push(f.id);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🍽️ Berjaya order *${f.name}*!` });
    }

    if (cmd === "makan") {
      const idx = user.food.indexOf(args[0]?.toLowerCase());
      if (idx === -1) return sock.sendMessage(from, { text: `❌ Makanan tiada dalam beg!` });
      const fId = user.food.splice(idx, 1)[0];
      
      let resText = `😋 Kenyang padu!`;
      if (fId === "nasilemak") { user.cooldowns.work = 0; resText += ` Tenaga penuh, boleh kerja sekarang!`; }
      else if (fId === "roticanai") { user.cooldowns.work = Math.max(0, user.cooldowns.work - 20000); resText += ` Cooldown kerja dipendekkan 20s.`; }
      else if (fId === "tehtarik") { user.cooldowns.work = Math.max(0, user.cooldowns.work - 10000); resText += ` Cooldown kerja dipendekkan 10s.`; }
      else if (fId === "burger") {
        if (user.cooldowns.jailUntil > now) {
           const timeJail = user.cooldowns.jailUntil - now;
           user.cooldowns.jailUntil = now + (timeJail * 0.90); 
           resText += ` Denda lokap dikurangkan 10%!`;
        } else {
           resText += ` Makanan simpanan sahaja.`;
        }
      }
      
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: resText });
    }

    if (cmd === "device") {
      let ui = `╔═══════════════════════════╗\n   📱 KEDAI TELEFON PINTAR\n╚═══════════════════════════╝\n`;
      PHONE_DEVICES.forEach(p => { ui += `• *[${p.id}]* ${p.name}\n  💰 RM ${p.price.toLocaleString()} | _${p.bonus}_\n\n`; });
      ui += `💡 Taip *.beli_phone [id]*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_phone") {
      const phone = PHONE_DEVICES.find(p => p.id === args[0]?.toLowerCase());
      if (!phone) return sock.sendMessage(from, { text: `❌ Kod telefon tidak wujud!` });
      if (user.cash < phone.price) return sock.sendMessage(from, { text: `❌ Tunai tidak cukup!` });
      user.cash -= phone.price;
      user.phoneDevice = phone.id;
      user.phoneName = phone.name;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `📱 Berjaya beli *${phone.name}*!` });
    }

    if (cmd === "upah_lawyer") {
      if (now >= user.cooldowns.jailUntil && !isOwner) return sock.sendMessage(from, { text: `ℹ️ Anda bukan dalam tahanan lokap!` });
      if (user.cash < 500 && !isOwner) return sock.sendMessage(from, { text: `❌ Sediakan RM 500 tunai!` });
      if (!isOwner) user.cash -= 500;
      user.cooldowns.jailUntil = 0;
      user.stars = Math.max(0, user.stars - 1);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `⚖️ *IKAT JAMIN:* Peguam selesaikan kes. Anda bebas!` });
    }

    if (cmd === "myid" || cmd === "ic") {
      const title = getTitle(user);
      const totalWealth = user.cash + user.bank + Math.floor((user.goldGrams || 0) * (db.market?.gold || 350)) + Math.floor((user.btcUnits || 0) * (db.market?.btc || 280000));
      const userRod = FISHING_SHOP.rods.find(r => r.id === user.fishingGear?.rod) || FISHING_SHOP.rods[0];
      const userReel = FISHING_SHOP.reels.find(r => r.id === user.fishingGear?.reel) || FISHING_SHOP.reels[0];
      const userTank = FISHING_SHOP.tanks.find(t => t.id === user.fishingGear?.tank) || FISHING_SHOP.tanks[0];
      const petNameDisplay = user.pet ? (CYBER_PETS.find(p => p.id === user.pet)?.name || "Tiada") : "Tiada";

      return sock.sendMessage(from, { 
        text: `╔═══════════════════════════╗\n   🪪 CYBER IDENTITY CARD (S${db.season || 1})\n╚═══════════════════════════╝\n👤 Nama: *${user.name}*\n🎖️ Gelaran: ${title}\n📱 Peranti: ${user.phoneName}\n🐕 Pengawal: ${petNameDisplay}\n💵 Tunai: RM ${user.cash.toLocaleString()} | 🏦 Bank: RM ${user.bank.toLocaleString()}\n🪙 Emas: ${(user.goldGrams || 0).toFixed(2)}g | ₿ BTC: ${(user.btcUnits || 0).toFixed(4)}\n💎 Nilai Harta: RM ${totalWealth.toLocaleString()}\n🏎️ Jentera: ${user.vehicles.length} | 🏢 Hartanah: ${user.properties.length}\n🎣 Set Pancing: ${userRod.name} | ${userReel.name}\n🫙 Akuarium: ${userTank.name} (${user.aquarium.length}/${userTank.capacity})` 
      });
    }

    if (cmd === "profile") {
      const vList = user.vehicles.length ? user.vehicles.join(", ") : "Garaj kosong";
      const iList = user.inventory.length ? user.inventory.map(i => i.name).join(", ") : "Beg kosong";
      const userRod = FISHING_SHOP.rods.find(r => r.id === user.fishingGear?.rod)?.name || "Joran Buluh";
      const userReel = FISHING_SHOP.reels.find(r => r.id === user.fishingGear?.reel)?.name || "Kekili Plastik";
      const userBait = FISHING_SHOP.baits.find(b => b.id === user.fishingGear?.bait)?.name || "Tiada Umpan";
      const userTank = FISHING_SHOP.tanks.find(t => t.id === user.fishingGear?.tank)?.name || "Balang Kaca";
      const magName = user.magnetGear?.magnet ? (MAGNET_SHOP.find(m => m.id === user.magnetGear.magnet)?.name) : "Tiada Magnet";

      return sock.sendMessage(from, { 
        text: `🎒 *PROFIL INVENTORI & PERALATAN:*

🏎️ Jentera: ${vList}
🏴‍☠️ Barang BM: ${iList}
🎣 Peralatan Pancing:
• Joran: *${userRod}*
• Kekili: *${userReel}*
• Umpan: *${userBait}*
• Akuarium: *${userTank}* (${user.aquarium.length} ekor ikan)
🧲 Alat Magnet: *${magName}*
📦 Besi Buruk: *${user.scrapMetalKg} KG*
📦 Peti Misteri: *${user.misteryBoxes}*` 
      });
    }

    if (cmd === "top") {
      const topUsers = Object.entries(db.users || {})
        .map(([id, d]) => ({ name: d.name || id.split("@")[0], total: (d.cash || 0) + (d.bank || 0) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      let ui = `╔═══════════════════════════╗\n   🏆 5 JUTAWAN TERKAYA AIRI\n╚═══════════════════════════╝\n`;
      topUsers.forEach((u, i) => { ui += `${i + 1}. *${u.name}* ➔ RM ${u.total.toLocaleString()}\n`; });
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "menu" || cmd === "help") {
      const evStatus = currentSeasonEvent ? `🔥 *[EVENT]:* ${currentSeasonEvent.name}` : "🌱 *[EVENT]:* Tiada event aktif";
      let menuText = `╔═══════════════════════════╗\n   🖥️ AIRI'S CORNER CYBER OS V3.0\n╚═══════════════════════════╝\n${evStatus}

🤖 *[1. SHADOW AIRI AI (Groq LPU)]*
• *.airi [soalan]* ➔ Tanya & sembang AI

🏆 *[2. SISTEM MUSIM & RANKING]*
• *.ranking*, *.halloffame*, *.season_info*

💼 *[3. KERJAYA & PASARAN]*
• *.kerja* (CD: 30s), *.daily*, *.pasaran*
• *.beli_emas*, *.jual_emas*, *.beli_btc*, *.jual_btc*
• *.jual_besi* ➔ Jual besi sekerap magnet

🐕 *[4. PENGAWAL & BOUNTY]*
• *.kedai_pet*, *.beli_pet [id]*, *.beli_telur*, *.tetas_telur*
• *.bounty @user [jumlah]*, *.list_bounty*

🎣 *[5. JETI & KEDAI PANCING]*
• *.kedai_pancing* ➔ Nombor 1-4
• *.beli_pancing [id]* ➔ Beli & pasang gear
• *.mancing*, *.jual_ikan*, *.bela_ikan*, *.akuarium*, *.jual_akuarium*

🧲 *[6. MAGNET FISHING]*
• *.kedai_magnet*, *.beli_magnet [id]*
• *.baling_magnet*, *.buka_peti*

🏎️ *[7. GARAJ & SEWA]*
• *.showroom [1/2/3/4]*, *.beli_kenderaan [id]*, *.bengkel*, *.pasang*
• *.lumba* (CD: 90s), *.list_hartanah*, *.beli_rumah [id]*, *.kutip_sewa*
• *.device*, *.beli_phone [id]*

🏴‍☠️ *[8. UNDERWORLD & KASINO]*
• *.bm*, *.beli_bm*, *.jenayah*, *.buat_jenayah* (CD: 120s)
• *.rompak* (CD: 180s), *.bida [harga]* (Lelongan Misteri)
• *.coinflip*, *.slot*, *.hutang_ahlong*, *.bayar_ahlong*
• *.hackbank @user*, *.bypass*

🎮 *[9. MINI-GAMES KOMUNITI]*
• *.santau @user*, *.lumba_siput [warna] [bet]*
• *.pity [pulls]*, *.split_bil [rm] [pax]*

🏦 *[10. BANK & IDENTITI]*
• *.deposit*, *.withdraw*, *.transfer*, *.shop*, *.beli_makanan*, *.makan*
• *.myid*, *.balance*, *.profile*, *.top*`;

      return sock.sendMessage(from, { text: menuText });
    }

  });
}

startBotEngine().catch(err => {
  console.error("⚠️ Ralat fatal:", err.message);
});
