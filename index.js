// =========================================================================
// 🛡️ SHADOW LEGACY ENGINE V4.0 (FULL UNMINIFIED EDITION)
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
// 👑 0. KUNCI KESELAMATAN FOUNDER MUTLAK 
// =========================================================================
const OWNER_NUMBERS = [
  "1166533534", 
  "601166533534", 
  "38956007690292"
];

let currentQR = ""; 
let isConnected = false; 
let globalChatActivity = 0;

// API GROQ
const GROQ_API_KEY = "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";
const groq = new Groq({ apiKey: GROQ_API_KEY });

async function askAiriAI(promptText, userName = "Warga Cyber") {
  try {
    const currentTimeMY = new Date().toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" });
    const sysPrompt = `Nama kau Airi, maskot AI Airi's Corner. Bos mutlak kau Amar. Waktu semasa: ${currentTimeMY}. Personaliti: Ceria, comel, santai Melayu. Jawab ringkas. Pengguna: ${userName}.`;
    
    const chat = await groq.chat.completions.create({
      messages: [
        { role: "system", content: sysPrompt }, 
        { role: "user", content: promptText }
      ],
      model: "llama3-8b-8192", 
      temperature: 0.8, 
      max_tokens: 400,
    });
    
    return chat.choices[0]?.message?.content || "Airi tak pasti nak jawab macam mana hehe~ 💙";
  } catch (err) {
    console.error("🔴 RALAT GROQ API:", err);
    return "Aduh... sistem LPU Airi tengah overheat! 🧠\n\n*Punca:* " + (err.message || "Ralat tak diketahui");
  }
}

// =========================================================================
// 🌐 1. PELAYAN WEB RINGAN
// =========================================================================
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  if (isConnected) {
    res.end(`<div style="text-align:center;margin-top:60px;font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;"><h2>⚡ SHADOW LEGACY OS V4.0 ONLINE! ⚡</h2></div>`);
  } else if (currentQR) {
    QRCode.toDataURL(currentQR)
      .then(img => res.end(`<div style="text-align:center;margin-top:40px;font-family:sans-serif;background:#0a0f1d;color:#fff;padding:25px;"><h2>⚡ IMBAS KOD QR ⚡</h2><img src="${img}" style="width:280px;height:280px;border-radius:16px;"/></div>`))
      .catch(() => res.end("Ralat QR"));
  } else {
    res.end(`<div style="text-align:center;margin-top:80px;color:#fff;font-family:sans-serif;"><h2>⏳ Menjana Kod QR...</h2></div>`);
  }
});
server.listen(PORT, "0.0.0.0", () => { 
  console.log(`🌐 Server aktif port ${PORT}`); 
});

// =========================================================================
// 💾 2. DATABASE & MIGRATION SCRIPT (AUTO-HEAL)
// =========================================================================
let localDB = { 
  users: {}, 
  groups: [], 
  market: { gold: 350, btc: 280000, scrap: 5, lastUpdate: Date.now() }, 
  season: 1, 
  auction: null, 
  hallOfFame: [], 
  p2pMarket: [] 
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
      cooldowns: { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, magnet: 0, rent: 0, bankHack: 0, aiAsk: 0, hospitalUntil: 0 }
    }; 
    saveDB(db);
  }
  
  const u = db.users[userId];
  if (pushName && pushName !== "Warga Cyber" && u.name !== pushName) { 
    u.name = pushName; 
    saveDB(db); 
  }
  
  // 🛡️ AUTO-HEAL: PENYELAMAT AKAUN LAMA DARI SILENT CRASH
  if (!u.inventory) u.inventory = [];
  if (!u.vehicles) u.vehicles = [];
  if (!u.properties) u.properties = [];
  if (!u.aquarium) u.aquarium = [];
  if (!u.food) u.food = [];
  if (!u.vehicleMods) u.vehicleMods = {};
  if (!u.magnetGear) u.magnetGear = { magnet: null };
  if (!u.scrapMetalKg) u.scrapMetalKg = 0;
  if (!u.misteryBoxes) u.misteryBoxes = 0;
  if (!u.badges) u.badges = ["🌱 [COMMON] Warga Baru"];
  
  if (!u.stats) u.stats = {};
  if (u.stats.crimes === undefined) u.stats.crimes = 0;
  if (u.stats.works === undefined) u.stats.works = 0;
  if (u.stats.racesWon === undefined) u.stats.racesWon = 0;
  if (u.stats.fishes === undefined) u.stats.fishes = 0;
  if (u.stats.bankHacks === undefined) u.stats.bankHacks = 0;
  
  if (!u.cooldowns) u.cooldowns = {};
  if (!u.cooldowns.crime) u.cooldowns.crime = 0;
  if (!u.cooldowns.bankHack) u.cooldowns.bankHack = 0;
  if (!u.cooldowns.race) u.cooldowns.race = 0;
  if (!u.cooldowns.work) u.cooldowns.work = 0;
  if (!u.cooldowns.jailUntil) u.cooldowns.jailUntil = 0;
  if (!u.cooldowns.hospitalUntil) u.cooldowns.hospitalUntil = 0;
  if (!u.cooldowns.daily) u.cooldowns.daily = 0;
  if (!u.cooldowns.fish) u.cooldowns.fish = 0;
  if (!u.cooldowns.magnet) u.cooldowns.magnet = 0;
  if (!u.cooldowns.rent) u.cooldowns.rent = 0;

  if (u.stars === undefined) u.stars = 0;
  if (isNaN(u.cash)) u.cash = 500;
  if (isNaN(u.bank)) u.bank = 0;

  return u;
}

function updateUser(userId, userData) { 
  const db = loadDB(); 
  db.users[userId] = userData; 
  saveDB(db); 
}

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

const NARRATIVE_BANKS = {
  RACE_WIN: [
    "Asap ekzos tinggal kat belakang, jentera meluncur laju macam peluru pandu!", 
    "Pecutan sempurna di garisan penamat, pihak lawan makan habuk!"
  ],
  RACE_CRASH: [
    "Adoi oversteer teruk dekat selekoh, jentera cium divider!", 
    "Tergolek tepi longkang litar akibat hilang kawalan!"
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
    "Santau Maya masuk tepat ke dalam sistem kewangan mangsa!"
  ],
  SANTAU_FAIL: [
    "Mantera melantun balik! Firewall mangsa kebal berselawat.", 
    "Dukun siber scam, santau langsung tak jalan!"
  ]
};

function getRandomNarrative(bankKey, fallback = "Aksi selesai.") {
  const bank = NARRATIVE_BANKS[bankKey];
  if (!bank || bank.length === 0) return fallback;
  return bank[Math.floor(Math.random() * bank.length)];
}

// =========================================================================
// 🌟 3. PANGKALAN DATA (TERSUSUN & TIDAK DIMAMPATKAN)
// =========================================================================
const SEASON_EVENTS = {
  "CRIME_BOOM": { name: "🔥 Musim Jenayah Gila", desc: "Loot jenayah naik 2x ganda!", rewardMult: 2.0, jailMult: 2.0, fineMult: 1.2, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "TECH_SURGE": { name: "💻 Musim Revolusi Siber", desc: "Diskaun Black Market 40%!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "ECONOMIC_CRASH": { name: "📉 Kemelesetan Ekonomi", desc: "Gaji 2x, denda 2x!", rewardMult: 0.8, jailMult: 1.2, fineMult: 2.0, jobMult: 2.0, fishMult: 1.0, rentMult: 0.8, raceMult: 1.0 },
  "GOLD_RUSH": { name: "💰 Gelombang Emas", desc: "Harga ikan & sewa 2x!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.2, fishMult: 2.0, rentMult: 2.0, raceMult: 1.0 },
  "UNDERGROUND_RACING": { name: "🏁 Pelesit Litar Malam", desc: "Hadiah drag race 2.5x!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 2.5 },
  "MEGA_HARVEST": { name: "🌊 Badai Laut Dalam", desc: "Peluang & harga ikan naik 3x!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 3.0, rentMult: 1.0, raceMult: 1.0 },
  "TYCOON_PARADISE": { name: "🏰 Monopoli Taikun", desc: "Sewa hartanah 3x ganda!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 3.0, raceMult: 1.0 },
  "INFLATION_SPIKE": { name: "💸 Inflasi Melampau", desc: "Barang mahal, elaun naik!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.5, jobMult: 1.5, fishMult: 1.5, rentMult: 1.5, raceMult: 1.0 },
  "CYBER_ANARCHY": { name: "🏴‍☠️ Anarki Darkweb", desc: "Rompakan sedut 40%!", rewardMult: 1.5, jailMult: 0.8, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "POLICE_CRACKDOWN": { name: "🚔 Ops Cantas", desc: "Loot 3x, denda 3x!", rewardMult: 3.0, jailMult: 1.5, fineMult: 3.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "INFLASI_SIBER": { name: "💸 Inflasi Siber", desc: "Semua denda naik 2x.", rewardMult: 1.0, jailMult: 1.0, fineMult: 2.0, jobMult: 1.5, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "SUBSIDI_B40": { name: "🎁 Subsidi B40", desc: "Kerja halal bonus 3x.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 3.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "DOUBLE_EXP": { name: "🚀 Double EXP Lumba", desc: "Lumba pulangan 3x.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 3.0 },
  "BEAR_MARKET": { name: "📉 Bear Market Emas", desc: "Masa beli aset.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "PILIHANRAYA": { name: "🗳️ Pilihanraya Maya", desc: "Kempen 2x gaji.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 2.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "ZOMBIE_OUTBREAK": { name: "🧟 Zombie Outbreak", desc: "Kerja lumpuh.", rewardMult: 2.0, jailMult: 0.5, fineMult: 1.0, jobMult: 0.1, fishMult: 1.0, rentMult: 0.1, raceMult: 1.0 },
  "VIP_ESCORT": { name: "🕶️ Kawalan VIP", desc: "Hukuman dipendekkan.", rewardMult: 1.5, jailMult: 0.1, fineMult: 0.5, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "KEMARAU_PANJANG": { name: "🏜️ Kemarau Ikan", desc: "Harga ikan 5x!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 5.0, rentMult: 1.0, raceMult: 1.0 },
  "PEMBERSIHAN_SCAM": { name: "🛑 Pembersihan Siber", desc: "Denda hacking tinggi.", rewardMult: 1.0, jailMult: 3.0, fineMult: 5.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "REVOLUSI_KILANG": { name: "🏭 Revolusi Kilang", desc: "Sewa hartanah 5x.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 5.0, raceMult: 1.0 },
  "BULL_MARKET": { name: "🚀 Pasaran Bull Emas", desc: "Gaji kerja +300%", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 3.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "FESTIVAL_JETI": { name: "🎉 Pesta Pemancing B40", desc: "Tangkapan ikan harga 4x", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 4.0, rentMult: 1.0, raceMult: 1.0 },
  "HACKER_SYNDICATE": { name: "👾 Sindiket Godam", desc: "Loot rompakan bank 3x ganda", rewardMult: 3.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "DURIAN_RUNTUH": { name: "🌳 Musim Durian Runtuh", desc: "Semua payout +150%", rewardMult: 1.5, jailMult: 1.0, fineMult: 1.0, jobMult: 2.5, fishMult: 2.5, rentMult: 2.5, raceMult: 1.5 },
  "AMNESTY_DAY": { name: "🕊️ Hari Pengampunan", desc: "Tiada denda lokap & denda ringan", rewardMult: 1.0, jailMult: 0.1, fineMult: 0.1, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "STIMULUS_PACKAGE": { name: "📦 Pakej Rangsangan", desc: "Hasil Kerja Halal 4x ganda!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 4.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "CRYPTO_BOOM": { name: "🪙 Ledakan Kripto", desc: "Hasil sewaan 4x ganda", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 4.0, raceMult: 1.0 },
  "BLACK_FRIDAY": { name: "🛍️ Black Friday Siber", desc: "Rompakan kedai amat lumayan (5x)", rewardMult: 5.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "FORMULA_1": { name: "🏎️ Minggu F1 Sepang", desc: "Lumba Haram bayar 5x ganda", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 5.0 },
  "MONSOON_FISHING": { name: "⛈️ Monsun Timur Laut", desc: "Ikan harga 5x tapi bahaya!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 5.0, rentMult: 1.0, raceMult: 1.0 },
  "AEROSPACE_EXPO": { name: "🛸 Ekspo Angkasa", desc: "Sewa hartanah angkasa lepas (5x)", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 5.0, raceMult: 1.0 },
  "AI_REVOLUTION": { name: "🧠 Era AI Shadow", desc: "Kerja halal bergaji 5x ganda", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 5.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "PIRATE_AGE": { name: "🏴‍☠️ Era Lanun Siber", desc: "Rompakan bank 5x lebih pantas", rewardMult: 5.0, jailMult: 0.5, fineMult: 0.5, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "NATIONAL_DAY": { name: "🇲🇾 Hari Kebangsaan", desc: "Semua payout 3x ganda", rewardMult: 3.0, jailMult: 1.0, fineMult: 1.0, jobMult: 3.0, fishMult: 3.0, rentMult: 3.0, raceMult: 3.0 },
  "ELECTION_MONEY": { name: "🗳️ Duit Kempen Pilihanraya", desc: "Kerja halal beri elaun 6x", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 6.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "TREASURE_FLEET": { name: "⚓ Armada Harta Karun", desc: "Ikan tangkapan 6x harga!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 6.0, rentMult: 1.0, raceMult: 1.0 },
  "REAL_ESTATE_BUBBLE": { name: "🏠 Gelembung Hartanah", desc: "Sewa rumah gila-gila (6x)", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 6.0, raceMult: 1.0 },
  "SMUGGLERS_COVE": { name: "🚤 Teluk Penyeludup", desc: "Jenayah Black Market 6x ganda", rewardMult: 6.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 1.0 },
  "BIONIC_ERA": { name: "🦾 Era Bionik", desc: "Gaji 4x, Lumba 4x, Sewa 4x", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 4.0, fishMult: 1.0, rentMult: 4.0, raceMult: 4.0 },
  "SHADOW_LEGACY_DAY": { name: "🐺 Hari Jadi Shadow Legacy", desc: "BONUS KESELURUHAN 10X GANDA", rewardMult: 10.0, jailMult: 0.1, fineMult: 0.1, jobMult: 10.0, fishMult: 10.0, rentMult: 10.0, raceMult: 10.0 }
};

const RANDOM_SCENARIOS = [
  { type: "win", msg: "Terjumpa beg duit berisi RM {val} tertinggal di stesen LRT!", min: 1000, max: 5000 },
  { type: "win", msg: "Pelaburan Amanah Saham memberi dividen mengejut RM {val}!", min: 5000, max: 15000 },
  { type: "win", msg: "Menang cabutan bertuah BSN Premium! Bawa pulang RM {val}.", min: 10000, max: 50000 },
  { type: "win", msg: "Viral di TikTok! Kena tajaan *gift* lumayan RM {val}.", min: 2000, max: 8000 },
  { type: "win", msg: "Bantu pakcik tukar tayar bocor, dia bagi tip RM {val}!", min: 500, max: 1500 },
  { type: "win", msg: "Jualan affiliate TikTok Shop (Shadow.Legacy) meletup! Untung bersih RM {val}.", min: 5000, max: 25000 },
  { type: "win", msg: "Airdrop Kripto misteri masuk wallet! Convert dapat RM {val}.", min: 20000, max: 80000 },
  { type: "win", msg: "Menemui jongkong emas kecil di tepi pantai! Jual dapat RM {val}.", min: 5000, max: 25000 },
  { type: "win", msg: "Dapat rebat cukai LHDN tak disangka-sangka sebanyak RM {val}.", min: 3000, max: 12000 },
  { type: "win", msg: "Menang saman kes langgar lari. Pampasan RM {val} dibayar ke akaun.", min: 15000, max: 40000 },
  { type: "win", msg: "Xiao V godam akaun scammer dan transfer RM {val} kepada anda!", min: 8000, max: 30000 },
  { type: "win", msg: "Kucing jalanan bawa balik rantai emas! Pajak gadai beri RM {val}.", min: 2000, max: 6000 },
  { type: "win", msg: "Jual *item* Steam (kr_legacy) di Market laku keras! Dapat RM {val}.", min: 1500, max: 8000 },
  { type: "win", msg: "Dapat elaun bantuan khas kerajaan sebanyak RM {val}.", min: 1000, max: 2000 },
  { type: "win", msg: "Jumpa peti besi lama semasa memancing. Berisi RM {val}!", min: 25000, max: 100000 },
  { type: "win", msg: "Dapat job freelance design logo syarikat. Dibayar RM {val}.", min: 3000, max: 9000 },
  { type: "win", msg: "Orang kaya salah transfer duit ke akaun anda sebanyak RM {val} dan dia halalkan.", min: 10000, max: 50000 },
  { type: "win", msg: "Kereta lama yang diletak di luar rumah dibeli pengumpul besi buruk: RM {val}.", min: 500, max: 3000 },
  { type: "win", msg: "Menang teka silang kata surat khabar! Bawa pulang RM {val}.", min: 1000, max: 2500 },
  { type: "win", msg: "Terjumpa cip memori bernilai tinggi di tapak pelupusan. Dijual RM {val}.", min: 4000, max: 15000 },
  { type: "win", msg: "Dianugerahkan bonus kecemerlangan dari Shadow Legacy Co., Ltd.! RM {val}.", min: 50000, max: 200000 },
  { type: "win", msg: "Video YouTube lama tiba-tiba viral, AdSense meletup RM {val}!", min: 5000, max: 20000 },
  { type: "win", msg: "Cari kerang tepi pantai, jumpa mutiara asli! Nilai pasaran RM {val}.", min: 10000, max: 30000 },
  { type: "win", msg: "Kumpul besi buruk seminggu, tolak di kilang dapat RM {val}.", min: 800, max: 2500 },
  { type: "win", msg: "Dapat ganjaran menangkap perompak kedai runcit sebanyak RM {val}.", min: 2000, max: 10000 },
  { type: "lose", msg: "Kena tahan roadblock JPJ, roadtax mati! Saman RM {val}.", min: 300, max: 1000 },
  { type: "lose", msg: "Kena scam di Telegram sindiket pelaburan palsu! Rugi RM {val}.", min: 2000, max: 15000 },
  { type: "lose", msg: "Telefon pintar jatuh masuk mangkuk tandas! Kos baiki RM {val}.", min: 500, max: 2000 },
  { type: "lose", msg: "Tayar kereta pancit kena paku di highway. Tukar tayar baru RM {val}.", min: 400, max: 1200 },
  { type: "lose", msg: "Rumah dipecah masuk pencuri! Barang berharga RM {val} dilarikan.", min: 3000, max: 20000 },
  { type: "lose", msg: "Diserang anjing liar semasa berjoging. Bil klinik swasta RM {val}.", min: 200, max: 800 },
  { type: "lose", msg: "Sangkut pinjaman Ah Long berserta bunga tinggi! Terpaksa bayar RM {val}.", min: 5000, max: 25000 },
  { type: "lose", msg: "Bumbung rumah bocor akibat ribut. Kos kontraktor baiki RM {val}.", min: 1500, max: 6000 },
  { type: "lose", msg: "Terlanggar belakang kereta Mercedes. Kena ganti rugi bumper RM {val}.", min: 4000, max: 12000 },
  { type: "lose", msg: "Disaman PBT sebab buang sampah merata-rata. Denda RM {val}.", min: 500, max: 1500 },
  { type: "lose", msg: "Akaun bank digodam *hacker* dari Rusia! Lebur RM {val}.", min: 10000, max: 50000 },
  { type: "lose", msg: "Beli game Steam DLC (Fishing Planet) tertekan dua kali. Hangus RM {val}.", min: 150, max: 600 },
  { type: "lose", msg: "Kena pau dengan samseng kampung. Duit poket lesap RM {val}.", min: 200, max: 1000 },
  { type: "lose", msg: "Kucing kesayangan telan tali pancing. Pembedahan veterinar RM {val}.", min: 1200, max: 3500 },
  { type: "lose", msg: "Pelaburan saham jatuh teruk! Margin call telan rugi RM {val}.", min: 8000, max: 40000 },
  { type: "lose", msg: "Ditipu mekanik bengkel tak bertauliah. Enjin jem rugi RM {val}.", min: 2500, max: 9000 },
  { type: "lose", msg: "Lupa bayar bil elektrik 3 bulan, kena potong dan caj penalti RM {val}.", min: 600, max: 1800 },
  { type: "lose", msg: "Hilang beg dompet semasa tidur di stesen bas. Dalamnya ada RM {val}.", min: 500, max: 2500 },
  { type: "lose", msg: "Beli barangan *custom* *scam* dari pengedar haram. Hangus RM {val}.", min: 2000, max: 10000 },
  { type: "lose", msg: "Polis serbu sarang lumba haram. Motor disita, ikat jamin RM {val}.", min: 5000, max: 15000 },
  { type: "lose", msg: "Terpijak perangkap landak di hutan. Rawatan kecemasan RM {val}.", min: 1000, max: 4000 },
  { type: "lose", msg: "Komputer diserang *Ransomware*. Terpaksa bayar tebusan RM {val}.", min: 4000, max: 20000 },
  { type: "lose", msg: "Denda mahkamah kerana gagal hadir perbicaraan jiran. RM {val}.", min: 2000, max: 8000 },
  { type: "lose", msg: "Cermin kereta pecah dibaling batu oleh budak nakal. Kos RM {val}.", min: 600, max: 1500 },
  { type: "lose", msg: "Lupa tutup paip air, bil melambung tinggi bulan ini RM {val}.", min: 300, max: 900 }
];

const MAGNET_SHOP = [
  { id: "mag_speaker", name: "Magnet Speaker Radio", price: 500, pullPower: 1, desc: "Sesuai tarik tin kosong" },
  { id: "mag_kuat", name: "Magnet Kuat Neodymium", price: 2500, pullPower: 3, desc: "+Peluang tarik rim lajak" },
  { id: "mag_industri", name: "Magnet Industri Padu", price: 12000, pullPower: 6, desc: "+Peluang tarik tong gas & peti" },
  { id: "mag_gergasi", name: "Magnet Gergasi Rare", price: 45000, pullPower: 12, desc: "Tarikan super, besi sekerap banyak" },
  { id: "mag_elektro", name: "Kren Elektromagnet", price: 150000, pullPower: 25, desc: "Sapu habis dasar sungai!" }
];

const MAGNET_LOOT = [
  { name: "Peti Besi Misteri 📦", type: "box", chance: 0.05 },
  { name: "Shadow Eclipse Smartwatch ⌚", type: "valuable", price: 15000, chance: 0.01 }, 
  { name: "Xiao V AI Earpiece 🎧", type: "valuable", price: 25000, chance: 0.02 }, 
  { name: "Smartphone iQOO 12 5G Berkarat 📱", type: "valuable", price: 8500, chance: 0.02 },
  { name: "Gelang Emas Putus 💍", type: "valuable", price: 3500, chance: 0.05 }
];

const FISHING_SHOP = {
  rods: [ 
    { id: "rod_buluh", name: "Joran Buluh Kampung 🎋", price: 0, luckBonus: 1.0, desc: "Joran asas" }, 
    { id: "rod_fiber", name: "Joran Fiberglass Shimano 🎣", price: 1500, luckBonus: 1.3, desc: "+30% Rate" }, 
    { id: "rod_carbon", name: "Joran Carbon Graphite Pro ⚡", price: 8000, luckBonus: 1.8, desc: "+80% Rate" }, 
    { id: "rod_titanium", name: "Joran Titanium Deepsea 🌊", price: 35000, luckBonus: 2.5, desc: "+150% Rate" }, 
    { id: "rod_mythic", name: "Joran Poseidon Cyber-Orbital 🔱", price: 150000, luckBonus: 4.5, desc: "Raja Laut! 4.5x Rate" } 
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
  { id: "f1", name: "Kasut But Getah Koyak 🥾", basePrice: 0, tier: "🗑️ [JUNK]", weightKg: 1.2, dropRate: 15.0, baseBuff: "Tiada buff", isJunk: true, isDangerous: false },
  { id: "f2", name: "Tayar Kereta Buruk Berlumut 🛞", basePrice: 0, tier: "🗑️ [JUNK]", weightKg: 8.5, dropRate: 10.0, baseBuff: "Tiada buff", isJunk: true, isDangerous: false },
  { id: "f3", name: "Ikan Kembung Segar Pasar 🐟", basePrice: 50, tier: "🌱 [COMMON]", weightKg: 0.4, dropRate: 20.0, baseBuff: "Gaji kerja +2%", isJunk: false, isDangerous: false },
  { id: "f4", name: "Ikan Gelama Muara 🐟", basePrice: 50, tier: "🌱 [COMMON]", weightKg: 0.6, dropRate: 18.0, baseBuff: "Gaji kerja +3%", isJunk: false, isDangerous: false },
  { id: "f5", name: "Ikan Keli Afrika Bersaiz L 🐡", basePrice: 50, tier: "🌱 [COMMON]", weightKg: 2.1, dropRate: 15.0, baseBuff: "Potong 5s cooldown kerja", isJunk: false, isDangerous: false },
  { id: "f6", name: "Udang Galah Sungai Bernilai 🦐", basePrice: 150, tier: "🌿 [UNCOMMON]", weightKg: 0.8, dropRate: 12.0, baseBuff: "Gaji kerja +5%", isJunk: false, isDangerous: false },
  { id: "f7", name: "Sotong Kurita Mini 🐙", basePrice: 150, tier: "🌿 [UNCOMMON]", weightKg: 1.5, dropRate: 10.0, baseBuff: "Menang Drag Race +3%", isJunk: false, isDangerous: false },
  { id: "f8", name: "Ketam Bunga Segar 🦀", basePrice: 150, tier: "🌿 [UNCOMMON]", weightKg: 0.9, dropRate: 9.0, baseBuff: "Potong 8s cooldown kerja", isJunk: false, isDangerous: false },
  { id: "f9", name: "Ikan Siakap Muara Padu 🐠", basePrice: 1000, tier: "⭐ [RARE]", weightKg: 3.8, dropRate: 6.0, baseBuff: "Gaji kerja +8%", isJunk: false, isDangerous: false },
  { id: "f10", name: "Ikan Jenahak Merah Laut Dalam 🐡", basePrice: 1000, tier: "⭐ [RARE]", weightKg: 5.2, dropRate: 5.0, baseBuff: "Diskaun denda lokap 10%", isJunk: false, isDangerous: false },
  { id: "f11", name: "Pari Gergasi Layang-Layang 🦈", basePrice: 1000, tier: "⭐ [RARE]", weightKg: 14.5, dropRate: 4.0, baseBuff: "Menang Drag Race +6%", isJunk: false, isDangerous: false },
  { id: "f12", name: "Ikan Kerapu Bara Monster 🦈", basePrice: 10000, tier: "💼 [EPIC]", weightKg: 18.0, dropRate: 2.5, baseBuff: "Gaji kerja +12%", isJunk: false, isDangerous: false },
  { id: "f13", name: "Tuna Sirip Kuning Gred A 🐟", basePrice: 10000, tier: "💼 [EPIC]", weightKg: 35.4, dropRate: 2.0, baseBuff: "Hasil kutipan sewa +10%", isJunk: false, isDangerous: false },
  { id: "f14", name: "Ketam Raja Alaska King Crab 🦀", basePrice: 10000, tier: "💼 [EPIC]", weightKg: 8.2, dropRate: 1.5, baseBuff: "Menang Coinflip/Slot +5%", isJunk: false, isDangerous: false },
  { id: "f15", name: "Jerung Tukul Pesisir Pantai 🦈", basePrice: 100000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 65.0, dropRate: 0.8, baseBuff: "Loot rompakan PvP +15%", isJunk: false, isDangerous: true },
  { id: "f16", name: "Sotong Gergasi Kraken Rahsia 🐙", basePrice: 100000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 110.0, dropRate: 0.5, baseBuff: "Kebal 20% daripada godaman bank", isJunk: false, isDangerous: true },
  { id: "f17", name: "Raja Ikan Temoleh Sungai Perak 👑", basePrice: 100000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 42.5, dropRate: 0.3, baseBuff: "Hasil kutipan sewa +20%", isJunk: false, isDangerous: false },
  { id: "f18", name: "Ikan Purba Coelacanth Emas 🌟", basePrice: 1500000, tier: "👑 [MYTHIC]", weightKg: 78.0, dropRate: 0.1, baseBuff: "+15% Semua Gaji", isJunk: false, isDangerous: false },
  { id: "f19", name: "Naga Laut Megalodon Siber 🐉", basePrice: 3500000, tier: "👑 [MYTHIC]", weightKg: 450.0, dropRate: 0.05, baseBuff: "Dewa Laut! +25% Semua Gaji & Sewa", isJunk: false, isDangerous: true },
  { id: "f_puyu", name: "Ikan Puyu Sawah 🐟", basePrice: 60, tier: "🌱 [COMMON]", weightKg: 0.2, dropRate: 20.0, baseBuff: "Gaji kerja +2%", isJunk: false, isDangerous: false },
  { id: "f_haruan", name: "Ikan Haruan Penyembuh 🐟", basePrice: 180, tier: "🌿 [UNCOMMON]", weightKg: 1.5, dropRate: 12.0, baseBuff: "Kurang risiko lokap 5%", isJunk: false, isDangerous: false },
  { id: "f_toman", name: "Toman Bunga Ganas 🐠", basePrice: 1200, tier: "⭐ [RARE]", weightKg: 4.5, dropRate: 6.0, baseBuff: "Gaji kerja +10%", isJunk: false, isDangerous: false },
  { id: "f_kelah", name: "Kelah Merah Mahkota Sungai 🐡", basePrice: 15000, tier: "💼 [EPIC]", weightKg: 6.0, dropRate: 2.0, baseBuff: "Hasil kutipan sewa +12%", isJunk: false, isDangerous: false },
  { id: "f_kelisa", name: "Kelisa Emas Arowana 🌟", basePrice: 85000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 2.5, dropRate: 0.8, baseBuff: "Loot rompakan PvP +15%", isJunk: false, isDangerous: false },
  { id: "f_buaya", name: "Buaya Tembaga Sesat 🐊", basePrice: 120000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 250.0, dropRate: 0.5, baseBuff: "Kebal 20% rompak", isJunk: false, isDangerous: true },
  { id: "f_naga", name: "Naga Tasik Chini 🐉", basePrice: 4000000, tier: "👑 [MYTHIC]", weightKg: 850.0, dropRate: 0.02, baseBuff: "Dewa Tasik! +25% Semua Gaji", isJunk: false, isDangerous: true }
];

function generateFishInstance(rod) {
  let pool = FISH_DATABASE.map(f => ({ ...f, weight: f.isJunk && rod.luckBonus > 1.5 ? 0 : f.dropRate * (f.isJunk ? 1 : rod.luckBonus) }));
  let tot = pool.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * tot;
  let sel = pool[0];
  for (const f of pool) { 
    if (r < f.weight) { 
      sel = f; break; 
    } 
    r -= f.weight; 
  }
  const sm = [
    { n: "Kecil 🐟", m: 0.75 }, 
    { n: "Sederhana 🐠", m: 1.0 }, 
    { n: "Besar 🐡", m: 1.45 }, 
    { n: "Gergasi 🦈", m: 2.2 }
  ]; 
  const c = sm[Math.floor(Math.random() * sm.length)];
  return { 
    id: sel.id, 
    name: `${sel.name} (${c.n})`, 
    price: sel.isJunk ? 0 : Math.floor(sel.basePrice * c.m), 
    weightKg: Number((sel.weightKg * c.m).toFixed(1)), 
    tier: sel.tier, 
    isDangerous: sel.isDangerous, 
    buff: sel.baseBuff 
  };
}

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
  { id: "shadow_phone", name: "Shadow Legion X CyberDeck 🐺", price: 15000, bonus: "Gajet Ultimate Founder! +20% Lumba & Kerja", perk: "god", val: 0.20 },
  { id: "vertu_sig", name: "Vertu Signature Cobra Sapphire 🐍", price: 50000, bonus: "Pendapatan sewa hartanah +25%", perk: "rent", val: 0.25 },
  { id: "solana_saga", name: "Solana Saga Genesis Crypto 🪙", price: 85000, bonus: "Keuntungan Kripto & Emas +15%", perk: "trade", val: 0.15 },
  { id: "caviar_gold", name: "Caviar Gold iPhone 24K Emas 👑", price: 140000, bonus: "Gaji kerja +35% & Kebal Rompak +10%", perk: "work", val: 0.35 },
  { id: "tonino_lambo", name: "Tonino Lamborghini 88 Tauri 🏎️", price: 220000, bonus: "Menang Drag Race +25%", perk: "race", val: 0.25 },
  { id: "crypto_node", name: "Satoshi Quantum CyberRig 💻", price: 500000, bonus: "Dividen bank +30%", perk: "bank", val: 0.30 },
  { id: "starlink_deck", name: "Starlink Orbital Satellite Rig 🛰️", price: 1200000, bonus: "Peluang godam bank naik +25%", perk: "crime", val: 0.25 },
  { id: "falcon_super", name: "Falcon SuperNova Pink Diamond 💎", price: 3500000, bonus: "Diskaun denda lokap 40%", perk: "def", val: 0.40 },
  { id: "neural_optic", name: "Neuralink Cyber-Cranial Device 🧠", price: 8000000, bonus: "Potong 25s semua cooldown RPG", perk: "cd", val: 25000 },
  { id: "quantum_prime", name: "Quantum Matrix Core OS 🌌", price: 20000000, bonus: "Menang Coinflip/Slot +15%", perk: "gamble", val: 0.15 },
  { id: "airi_chrono", name: "Airi Chrono Infinity Handheld 🔮", price: 50000000, bonus: "Gajet Dewa! +40% Semua Payout & Kebal Denda", perk: "god", val: 0.40 }
];

const JOBS = [
  { id: 1, name: "Pekerja Am Majlis", minPay: 100, maxPay: 180 },
  { id: 2, name: "Pencuci Pinggan Kedai Tomyam", minPay: 105, maxPay: 185 },
  { id: 3, name: "Rider GrabFood Berhujan", minPay: 110, maxPay: 195 },
  { id: 4, name: "Runner Foodpanda Pink", minPay: 110, maxPay: 195 },
  { id: 5, name: "Pemandu Van Jenazah/Kargo", minPay: 120, maxPay: 205 },
  { id: 6, name: "Kerani Kaunter Pejabat", minPay: 125, maxPay: 215 },
  { id: 7, name: "Juruteknik Aircond & Wiring", minPay: 130, maxPay: 220 },
  { id: 8, name: "Operator Kilang Shift Malam", minPay: 135, maxPay: 225 },
  { id: 9, name: "Penebar Burger Ramly Special", minPay: 140, maxPay: 230 },
  { id: 10, name: "Barista Kopi Hipster", minPay: 140, maxPay: 230 },
  { id: 11, name: "Jurujual Coway / Cuckoo", minPay: 145, maxPay: 235 },
  { id: 12, name: "Tukang Masak Katering Kenduri", minPay: 150, maxPay: 240 },
  { id: 13, name: "Graphic Designer Canva Pro", minPay: 155, maxPay: 245 },
  { id: 14, name: "Video Editor TikTok Viral", minPay: 160, maxPay: 250 },
  { id: 15, name: "Social Media Admin Group", minPay: 160, maxPay: 250 },
  { id: 16, name: "Ejen Hartanah Rumah Lelong", minPay: 165, maxPay: 255 },
  { id: 17, name: "Tukang Paip Rumah Bocor", minPay: 165, maxPay: 255 },
  { id: 18, name: "Juruelektrik Tiga Fasa", minPay: 170, maxPay: 260 },
  { id: 19, name: "Mekanik Motor Modenas/Yamaha", minPay: 175, maxPay: 265 },
  { id: 20, name: "Foreman Bengkel Kereta", minPay: 180, maxPay: 270 },
  { id: 21, name: "Cikgu Tuisyen SPM Matematik", minPay: 185, maxPay: 275 },
  { id: 22, name: "Jurutera Tapak Bina JKR", minPay: 190, maxPay: 285 },
  { id: 23, name: "Akauntan Audit LHDN", minPay: 195, maxPay: 290 },
  { id: 24, name: "Pengurus Projek MRT3", minPay: 200, maxPay: 295 },
  { id: 25, name: "Peguam Mahkamah Majistret", minPay: 210, maxPay: 300 },
  { id: 26, name: "Doktor Pakar Klinik Kesihatan", minPay: 220, maxPay: 310 },
  { id: 27, name: "Software Engineer Fullstack", minPay: 230, maxPay: 320 },
  { id: 28, name: "Data Scientist Machine Learning", minPay: 240, maxPay: 330 },
  { id: 29, name: "Pilot AirAsia / MAS", minPay: 250, maxPay: 340 },
  { id: 30, name: "Kapten Kapal Dagang Antarabangsa", minPay: 250, maxPay: 340 },
  { id: 31, name: "Arkitek Bangunan Pencakar Langit", minPay: 245, maxPay: 335 },
  { id: 32, name: "Pakar Bedah Jantung", minPay: 260, maxPay: 350 },
  { id: 33, name: "Trader Forex Pacak Signal", minPay: 200, maxPay: 340 },
  { id: 34, name: "Pelombong Bitcoin / Kripto", minPay: 210, maxPay: 350 },
  { id: 35, name: "Content Creator YouTube", minPay: 220, maxPay: 345 },
  { id: 36, name: "Streamer Mobile Legends", minPay: 225, maxPay: 355 },
  { id: 37, name: "Tukang Jahit Baju Melayu", minPay: 180, maxPay: 260 },
  { id: 38, name: "Web Developer Freelance", minPay: 215, maxPay: 325 },
  { id: 39, name: "Ejen Insurans Takaful", minPay: 190, maxPay: 280 },
  { id: 40, name: "Pengurus Cawangan Bank", minPay: 255, maxPay: 345 },
  { id: 41, name: "Cef Eksekutif Hotel 5 Bintang", minPay: 260, maxPay: 355 },
  { id: 42, name: "Jurugambar Acara Perkahwinan", minPay: 205, maxPay: 290 },
  { id: 43, name: "Juruaudit Forensik SPRM", minPay: 235, maxPay: 325 },
  { id: 44, name: "Kontraktor Bina Banglo", minPay: 245, maxPay: 335 },
  { id: 45, name: "Ahli Farmasi Berdaftar", minPay: 240, maxPay: 330 },
  { id: 46, name: "Pakar Psikologi Kaunseling", minPay: 230, maxPay: 320 },
  { id: 47, name: "Penganalisis Keselamatan Siber", minPay: 255, maxPay: 345 },
  { id: 48, name: "Pakar Ekonomi Negara", minPay: 270, maxPay: 365 },
  { id: 49, name: "Pelabur Saham Bursa Malaysia", minPay: 280, maxPay: 380 },
  { id: 50, name: "CEO Konglomerat Korporat", minPay: 300, maxPay: 400 },
  { id: 101, name: "Pomen Bawah Pokok Ceri 🔧", minPay: 130, maxPay: 240 },
  { id: 102, name: "Founder Skincare Timbang Kilo 🧴", minPay: 200, maxPay: 350 },
  { id: 103, name: "Tauke Bundle Seluar Koyak 👖", minPay: 150, maxPay: 280 },
  { id: 104, name: "Flipper Tiket Konsert 🎫", minPay: 180, maxPay: 310 }
];

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
  { id: "rxz", name: "Yamaha RXZ Catalyzer Hantu 🏍️", price: 18000, type: "Motor", speed: 95, desc: "Raja highway, bunyi zass zass!" },
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
  { id: "kelisa", name: "Perodua Kelisa Convert Gino 🚗", price: 22000, type: "Kereta", speed: 85, desc: "Kecil-kecil cili padi L2" },
  { id: "preve", name: "Proton Preve 1.6 CFE Turbo 🚗", price: 40000, type: "Kereta", speed: 75, desc: "Handling Lotus mantap" },
  { id: "wira_evo", name: "Wira Evo 3 Convert 🚗", price: 45000, type: "Kereta", speed: 110, desc: "Ekzos tembak-tembak" },
  { id: "persona", name: "Proton Persona VVT Premium 🚗", price: 45000, type: "Kereta", speed: 70, desc: "Pemanduan moden selesa" },
  { id: "myvi", name: "Perodua Myvi King 1.5 AV 👑", price: 50000, type: "Kereta", speed: 82, desc: "Raja Segala Jalan Raya" },
  { id: "lori_hantu", name: "Lori Hantu Balak 🚚", price: 85000, type: "Kereta", speed: 70, desc: "Takde brek redah je!" },
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
  { id: "mercedes_300slr", name: "Mercedes-Benz 300 SLR Uhlenhaut 👑", price: 650000000, type: "Kereta", speed: 200, desc: "Kereta termahal sepanjang zaman bernilai warisan muzium" }
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
// 🚀 6. ENJIN UTAMA & MESSAGE HANDLER (DENGAN RUANG & LOGIK PENUH)
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

  // LOOP AUTO EVENT SETIAP 5 SAAT
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
      
      if (db.groups[0]) {
        await sock.sendMessage(db.groups[0], { text: pText }).catch(()=>{});
      }
    }
    
    if (now - lastRandomEventTime >= 15 * 60 * 1000) {
      lastRandomEventTime = now;
      if (globalChatActivity >= 3 && db.groups.length > 0) {
        globalChatActivity = 0; 
        const mainGroup = db.groups[0]; 
        const chance = Math.random();
        
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
          await sock.sendMessage(mainGroup, { text: `🚨 *LELONGAN KONTENA MISTERI!*\n💵 Tapak: *RM ${startPrice.toLocaleString()}*\n⏱️ Reset 60s setiap bidaan.\n👉 Taip: *.bida [harga]*` });
        
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
               await sock.sendMessage(mainGroup, { text: `🎁 *NASIB RAWAK!*\n*${u.name}*, ${scenario.msg.replace("{val}", finalVal.toLocaleString())}` });
             } else {
               u.cash = Math.max(0, u.cash - val); 
               updateUser(randomId, u); 
               await sock.sendMessage(mainGroup, { text: `💀 *BENCANA RAWAK!*\n*${u.name}*, ${scenario.msg.replace("{val}", val.toLocaleString())}` });
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
      console.log("✅ BOT AIRI V4.0 BERSAMBUNG KE WHATSAPP!"); 
    }
  });

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

    if (now < user.cooldowns.hospitalUntil && !isOwner) { 
      return sock.sendMessage(from, { text: `🚑 Anda di hospital. Baki masa rawatan: ${Math.ceil((user.cooldowns.hospitalUntil - now)/1000)}s.` }); 
    }
    
    if (now < user.cooldowns.jailUntil && !["upah_lawyer", "myid"].includes(cmd) && !isOwner) { 
      return sock.sendMessage(from, { text: `🚨 Anda di dalam sel lokap! Baki: ${Math.ceil((user.cooldowns.jailUntil - now)/1000)}s. (Boleh guna *.upah_lawyer*)` }); 
    }

    // =====================================================================
    // 👑 ARAHAN VETO CEO
    // =====================================================================
    if (cmd === "veto" && isOwner) {
      let ui = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   👑 SENARAI ARAHAN VETO CEO\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
      ui += `• *.syscheck*, *.list_event*, *.set_season [no]*\n• *.start_event [nama] [hari]*, *.stop_event*\n• *.give_cash @user [jumlah]*, *.give_gold*, *.give_btc*\n• *.set_market [gold/btc/scrap] [harga]*\n• *.jail_user @user [saat]*, *.free_user @user*\n• *.reset_user @user*, *.reset_season*`;
      return sock.sendMessage(from, { text: ui });
    }
    
    if ((cmd === "syscheck" || cmd === "diag") && isOwner) {
      let diagUI = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   ⚙️ SHADOW LEGACY DIAGNOSTICS\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
      diagUI += `✅ [DB] MongoDB/JSON: OK\n✅ [MODUL] Jentera: ${VEHICLES.length} Kod\n✅ [MODUL] Kerjaya: ${JOBS.length} Kod\n✅ [MODUL] Hartanah: ${PROPERTIES.length} Kod\n✅ [MODUL] Jenayah: ${CRIMES.length} Kod\n✅ [STATUS] AI Shadow Airi (Groq LPU): AKTIF\n📈 [SISTEM] RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
      return sock.sendMessage(from, { text: diagUI });
    }

    if (cmd === "set_season" && isOwner) {
      const sNum = parseInt(args[0]); 
      if (isNaN(sNum) || sNum < 1) return sock.sendMessage(from, { text: `❌ Format: *.set_season [nombor]*` });
      db.season = sNum; 
      saveDB(db); 
      return sock.sendMessage(from, { text: `👑 *VETO CEO:* Musim siber kini diset ke *Musim Ke-${sNum}*!` });
    }

    if (cmd === "start_event" && isOwner) {
      const evType = args[0]?.toUpperCase(); 
      const days = parseInt(args[1]) || 3;
      if (!evType || !SEASON_EVENTS[evType]) return sock.sendMessage(from, { text: `❌ Event tak sah. Guna *.list_event*` });
      db.active_event_data = { type: evType, end: now + (days * 24 * 3600 * 1000) }; 
      saveDB(db);
      return sock.sendMessage(from, { text: `👑 Veto: Acara *${SEASON_EVENTS[evType].name}* diaktifkan selama ${days} hari!` });
    }

    if (cmd === "stop_event" && isOwner) { 
      db.active_event_data = null; 
      saveDB(db); 
      return sock.sendMessage(from, { text: `👑 Veto: Acara dihentikan!` }); 
    }

    if (cmd === "give_cash" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt)) return sock.sendMessage(from, { text: `❌ Format: *.give_cash @user [jumlah]*` });
      const targetUser = getUser(targetTag); 
      targetUser.cash += amt; 
      updateUser(targetTag, targetUser);
      return sock.sendMessage(from, { text: `👑 Veto: +RM ${amt.toLocaleString()} tunai dikreditkan ke *${targetUser.name}*!`, mentions: [targetTag] });
    }

    if (cmd === "jail_user" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
      const sec = parseInt(args[1]) || 120;
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.jail_user @user [saat]*` });
      const targetUser = getUser(targetTag); 
      targetUser.cooldowns.jailUntil = now + (sec * 1000); 
      updateUser(targetTag, targetUser);
      return sock.sendMessage(from, { text: `👑 Veto: *${targetUser.name}* disumbat ke lokap ${sec}s!`, mentions: [targetTag] });
    }

    if (cmd === "free_user" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.free_user @user*` });
      const targetUser = getUser(targetTag); 
      targetUser.cooldowns.jailUntil = 0; 
      updateUser(targetTag, targetUser);
      return sock.sendMessage(from, { text: `👑 Veto: *${targetUser.name}* dibebaskan dari lokap!`, mentions: [targetTag] });
    }

    // =====================================================================
    // 🤖 AI GROQ
    // =====================================================================
    if (cmd === "airi" || cmd === "ai" || cmd === "tanya") {
      const query = args.join(" ").trim();
      if (!query) return sock.sendMessage(from, { text: `Hai ${user.name}! 💙 Airi ada kat sini~ Taip: *.airi [borak]* hehe~ ✨` });
      if (now < (user.cooldowns.aiAsk || 0) && !isOwner) return sock.sendMessage(from, { text: `⏳ Sabar weh, otak LPU tengah proses data!` });
      user.cooldowns.aiAsk = now + 8000; 
      updateUser(cleanSender, user);
      const reply = await askAiriAI(query, user.name);
      return sock.sendMessage(from, { text: `💠 *AIRI (Groq LPU)* 💠\n\n${reply}` });
    }

    // =====================================================================
    // 🏴‍☠️ UNDERWORLD (BM, JENAYAH, ROMPAK)
    // =====================================================================
    if (cmd === "bm" || cmd === "beli_bm") {
      const mytHour = new Date(Date.now() + 28800000).getUTCHours();
      if (mytHour >= 7 && !isOwner) return sock.sendMessage(from, { text: `🚨 *DITUTUP!* Operasi haram hanya 12:00 AM hingga 7:00 AM.` });
      
      if (cmd === "bm") {
        let ui = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🏴‍☠️ BLACK MARKET UNDERWORLD\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
        BLACKMARKET_ITEMS.forEach(i => { 
          let pPrice = currentEvent?.type === "TECH_SURGE" ? Math.floor(i.price * 0.60) : i.price; 
          ui += `• *[ID ${i.id}]* ${i.name}\n  💰 RM ${pPrice.toLocaleString()} | _${i.desc}_\n\n`; 
        });
        ui += `💡 Taip *.beli_bm [ID]*`; 
        return sock.sendMessage(from, { text: ui });
      }
      
      if (cmd === "beli_bm") {
        const item = BLACKMARKET_ITEMS.find(i => i.id === parseInt(args[0]));
        if (!item) return sock.sendMessage(from, { text: `❌ ID perkakasan tidak wujud!` });
        let realPrice = currentEvent?.type === "TECH_SURGE" ? Math.floor(item.price * 0.60) : item.price;
        if (user.cash < realPrice) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi!` });
        if (user.inventory.some(i => i.id === item.id)) return sock.sendMessage(from, { text: `⚠️ Barang ini sudah ada di inventori!` });
        user.cash -= realPrice; 
        user.inventory.push({ id: item.id, name: item.name }); 
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🛒 Berjaya beli *${item.name}*!` });
      }
    }

    if (cmd === "jenayah" || cmd === "buat_jenayah") {
      const crimeId = parseInt(args[0]);
      if (isNaN(crimeId)) {
        let ui = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   💀 DARKWEB CRIME NETWORK\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
        CRIMES.forEach(c => {
          const reqObj = c.reqItem ? BLACKMARKET_ITEMS.find(i => i.id === c.reqItem) : null;
          let rMin = currentEvent?.rewardMult ? Math.floor(c.rewardMin * currentEvent.rewardMult) : c.rewardMin;
          let rMax = currentEvent?.rewardMult ? Math.floor(c.rewardMax * currentEvent.rewardMult) : c.rewardMax;
          ui += `• *[ID ${c.id}]* ${c.name}\n  💵 Loot: RM ${rMin.toLocaleString()} - ${rMax.toLocaleString()} | 🔒 ${reqObj ? reqObj.name : "Bebas"}\n\n`;
        });
        ui += `💡 Taip *.jenayah [ID]*`; 
        return sock.sendMessage(from, { text: ui });
      }
      
      const c = CRIMES.find(x => x.id === crimeId); 
      if (!c) return sock.sendMessage(from, { text: `❌ ID jenayah tidak sah!` });
      if (c.reqItem && !user.inventory.some(i => i.id === c.reqItem)) return sock.sendMessage(from, { text: `❌ Perlukan alat dari *.bm*!` });
      if (now < user.cooldowns.crime && !isOwner) return sock.sendMessage(from, { text: `⏳ Polis meronda! Tunggu *${Math.ceil((user.cooldowns.crime - now) / 1000)} saat* lagi.` });

      user.cooldowns.crime = now + (c.cd * 1000); 
      let crimeRate = (c.id === 15) ? 0.60 : 0.55; 
      if (activePhoneObj?.perk === "crime" || activePhoneObj?.perk === "god") crimeRate += activePhoneObj.val;

      if (Math.random() < crimeRate || isOwner) {
        let reward = Math.floor(Math.random() * (c.rewardMax - c.rewardMin + 1)) + c.rewardMin;
        if (currentEvent?.rewardMult) reward = Math.floor(reward * currentEvent.rewardMult);
        user.cash += reward; 
        user.stats.crimes += 1; 
        user.stars = Math.min(5, user.stars + c.stars); 
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🦹 *MISI BERJAYA:* ${c.name}\n\n${getRandomNarrative(c.id === 15 ? "BANK_HACK_SUCCESS" : "CRIME_SUCCESS")}\n\n💵 Hasil: *+RM ${reward.toLocaleString()}*\n⭐ Wanted: ${"⭐".repeat(user.stars)}` });
      } else {
        user.stars = Math.min(5, user.stars + 1); 
        let jailTimeSec = Math.max(30, user.stars * 30);
        let fine = currentEvent?.fineMult ? Math.floor(c.fine * currentEvent.fineMult) : c.fine;
        user.cash = Math.max(0, user.cash - fine); 
        user.cooldowns.jailUntil = now + (jailTimeSec * 1000);
        
        let extraText = ""; 
        if (c.id === 15) { 
          const invIdx = user.inventory.findIndex(i => i.id === 12); 
          if (invIdx !== -1) user.inventory.splice(invIdx, 1); 
          extraText = "\n💥 *ALAT PENGGODAM ANDA MUSNAH!*"; 
        }
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 *KANTOI POLIS!*\n\n${getRandomNarrative("CRIME_BUSTED")}\n\n💸 Denda: *-RM ${fine.toLocaleString()}* & lokap ${jailTimeSec}s!${extraText}` });
      }
    }

    if (cmd === "rompak") {
      let targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
      if (!targetTag && args[0]?.startsWith("@")) targetTag = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Sila tag mangsa dengan betul: *.rompak @user*` });
      
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net"; 
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Takkan nak samun diri sendiri?` });
      
      const targetUser = getUser(cleanTarget); 
      if (targetUser.cash < 100) return sock.sendMessage(from, { text: `😅 Mangsa poket kempis bawah RM100.` });
      if (now < user.cooldowns.crime && !isOwner) return sock.sendMessage(from, { text: `⏳ Anda sedang menyorok dari polis! Tunggu *${Math.ceil((user.cooldowns.crime - now) / 1000)} saat* lagi.` });

      let petObj = null; 
      if (targetUser.pet) petObj = CYBER_PETS.find(p => p.id === targetUser.pet);
      
      if (petObj && (petObj.perk === "anti_rob" || petObj.perk === "dual_def" || petObj.perk === "dragon_god")) {
        if (Math.random() < petObj.val) {
          user.cash = Math.max(0, user.cash - 1000); 
          updateUser(cleanSender, user);
          return sock.sendMessage(from, { text: `🛡️ *DISERANG PENGAWAL!*\n\n${getRandomNarrative("PET_DEFEND")}\n\n💸 Ganti Rugi: *-RM 1,000*` });
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
        return sock.sendMessage(from, { text: `🥷 *ROMPAKAN BERJAYA!*\n\n${getRandomNarrative("ROB_SUCCESS")}\n\n💵 Hasil: *+RM ${stolen.toLocaleString()}* dari *${targetUser.name}*!${bountyNotice}`, mentions: [cleanTarget] });
      } else {
        user.cash = Math.max(0, user.cash - 500); 
        user.cooldowns.jailUntil = now + (60 * 1000); 
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 *KANTOI SAMUN SIBER!* \n\n${getRandomNarrative("ROB_FAIL_ROAST")}\n\n💸 Denda: *-RM 500* & Lokap 60 saat!`, mentions: [cleanTarget] });
      }
    }

    if (cmd === "santau" || cmd === "santau_maya") {
       const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
       if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa: *.santau @user*` });
       const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
       if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Nak santau diri sendiri buat apa?` });
       if (user.cash < 2000) return sock.sendMessage(from, { text: `❌ Upah Dukun Siber (RM 2,000) tak cukup!` });
       
       user.cash -= 2000; 
       const tUser = getUser(cleanTarget);
       
       if (Math.random() < 0.6) {
           const curseLoss = Math.floor(tUser.cash * 0.15); 
           tUser.cash -= curseLoss; 
           updateUser(cleanSender, user); 
           updateUser(cleanTarget, tUser);
           return sock.sendMessage(from, { text: `💀 *ILMU HITAM BERJAYA!*\n\n${getRandomNarrative("SANTAU_SUCCESS")}\nWang mangsa merosot *-RM ${curseLoss.toLocaleString()}*!`, mentions: [cleanTarget] });
       } else {
           updateUser(cleanSender, user);
           return sock.sendMessage(from, { text: `🛡️ *SANTAU DITEPIH!*\n\n${getRandomNarrative("SANTAU_FAIL")}\nRM 2,000 hangus bayar dukun siber.`, mentions: [cleanTarget] });
       }
    }

    // =====================================================================
    // 🎲 10 MINI-GAME KOMUNITI BAHARU (V4.0)
    // =====================================================================
    if (cmd === "bgk") {
      const c = args[0]?.toLowerCase(); 
      const bet = parseInt(args[1]);
      if (!["batu", "gunting", "kertas"].includes(c) || isNaN(bet) || bet <= 0) return sock.sendMessage(from, { text: `✊🖐✌️ Format: *.bgk [batu/gunting/kertas] [taruhan]*` });
      if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Tunai poket tak cukup untuk bertaruh! Semak baki guna *.bal*` });
      
      user.cash -= bet; 
      const pilihan = ["batu", "gunting", "kertas"]; 
      const botC = pilihan[Math.floor(Math.random() * 3)]; 
      let res = ""; 
      let p = 0;
      
      if (c === botC) { 
        res = "SERI!"; p = bet; 
      } else if ((c==="batu"&&botC==="gunting") || (c==="gunting"&&botC==="kertas") || (c==="kertas"&&botC==="batu")) { 
        res = "MENANG!"; p = bet * 2; 
      } else { 
        res = "KALAH!"; p = 0; 
      }
      
      user.cash += p; 
      updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `✊🖐✌️ *OSOM!*\n\nAnda: ${c.toUpperCase()}\nAI: ${botC.toUpperCase()}\n\nKeputusan: *${res}*\n💸 ${p > 0 ? "+RM "+p : "-RM "+bet}` });
    }

    if (cmd === "gacha_mlbb") {
      if (user.cash < 2000) return sock.sendMessage(from, { text: `❌ Spin *Mobile Legends* perlukan RM 2,000!` });
      user.cash -= 2000; 
      const rng = Math.random(); 
      let prize = 0; 
      let msg = "";
      
      if (rng < 0.01) { prize = 25000; msg = `🌟 *LEGENDARY SKIN!* Dapat Franco Legend! (Jual: +RM 25,000)`; }
      else if (rng < 0.05) { prize = 8000; msg = `🔥 *EPIC SKIN!* Dapat Lancelot Dragon Tamer! (Jual: +RM 8,000)`; }
      else if (rng < 0.20) { prize = 2500; msg = `✨ *ELITE SKIN!* Boleh tahan la. (Jual: +RM 2,500)`; }
      else { prize = 0; msg = `🗑️ *MAGIC DUST x5!* Adoi rugi RM 2,000!`; }
      
      user.cash += prize; 
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎮 *GACHA MLBB*\n\n${msg}` });
    }

    if (cmd === "tiktok_affiliate") {
      if (user.cash < 500) return sock.sendMessage(from, { text: `❌ Perlu RM 500 modal marketing (Ads) TikTok.` });
      user.cash -= 500; 
      const rng = Math.random(); 
      let untung = 0; 
      let msg = "";
      
      if (rng < 0.05) { untung = 15000; msg = `🚀 *FYP MELETUP!* Produk anda masuk di bawah beg kuning. Untung besar!`; }
      else if (rng < 0.15) { untung = 3000; msg = `🔥 *VIRAL!* Jualan masuk bertalu-talu.`; }
      else if (rng < 0.45) { untung = 600; msg = `👍 *BALIK MODAL.* Ada la sikit untung buat beli kopi.`; }
      else { untung = 0; msg = `📉 *FLOP.* View sendu 20 orang je. Modal RM 500 lebur.`; }
      
      user.cash += untung; 
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `📱 *TIKTOK AFFILIATE*\n\n${msg}\n💵 Untung: +RM ${untung.toLocaleString()}` });
    }

    if (cmd === "sabung_ayam" || cmd === "ayam_sabung") {
      const choice = args[0]?.toLowerCase(); 
      const bet = parseInt(args[1]);
      if (!["merah", "hitam"].includes(choice) || isNaN(bet) || bet <= 0) return sock.sendMessage(from, { text: `🐔 Format: *.sabung_ayam [merah/hitam] [taruhan]*` });
      if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Duit tunai tak cukup!` });
      
      user.cash -= bet; 
      const winner = Math.random() < 0.5 ? "merah" : "hitam";
      
      if (choice === winner) { 
        user.cash += (bet * 2); 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🐔 *SABUNG AYAM*\n\nAyam ${winner.toUpperCase()} menang bertarung!\n💵 Anda menang: +RM ${(bet*2).toLocaleString()}!` }); 
      } else { 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🐔 *SABUNG AYAM*\n\n❌ Ayam ${winner.toUpperCase()} yang menang. Rugi: -RM ${bet.toLocaleString()}` }); 
      }
    }

    if (cmd === "teka_nombor") {
      const guess = parseInt(args[0]); 
      const bet = parseInt(args[1]);
      if (isNaN(guess) || guess < 1 || guess > 10 || isNaN(bet) || bet <= 0) return sock.sendMessage(from, { text: `🔢 Format: *.teka_nombor [1-10] [taruhan]*` });
      if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Duit tunai tak cukup!` });
      
      user.cash -= bet; 
      const result = Math.floor(Math.random() * 10) + 1;
      
      if (guess === result) { 
        user.cash += (bet * 10); 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🎉 *JACKPOT!* Nombor betul adalah ${result}! Menang 10X ganda!\n💵 +RM ${(bet*10).toLocaleString()}` }); 
      } else { 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `❌ *SALAH!* Nombor rahsia adalah ${result}. Taruhan lebur.` }); 
      }
    }

    if (cmd === "kotak_beracun") {
      const pilihan = parseInt(args[0]);
      if (isNaN(pilihan) || pilihan < 1 || pilihan > 3) return sock.sendMessage(from, { text: `📦 Main Kotak Beracun (Modal RM1000). Ada Bom, Kosong, & Emas!\nFormat: *.kotak_beracun [1/2/3]*` });
      if (user.cash < 1000) return sock.sendMessage(from, { text: `❌ Anda perlukan RM 1,000 untuk main!` });
      
      user.cash -= 1000;
      const hadiah = [ {n: "BOM! 💥", v: -5000}, {n: "Kosong 🕸️", v: 0}, {n: "Emas Tulen! 🪙", v: 10000} ].sort(() => Math.random() - 0.5);
      const nasib = hadiah[pilihan - 1]; 
      
      user.cash += nasib.v; 
      if (user.cash < 0) user.cash = 0; 
      updateUser(cleanSender, user);
      
      return sock.sendMessage(from, { text: `📦 *KOTAK BERACUN*\n\nAnda membuka Kotak ${pilihan} dan isinya ialah... *${nasib.n}*\n\n💸 Impak: ${nasib.v > 0 ? "+RM "+nasib.v : nasib.v < 0 ? "-RM "+Math.abs(nasib.v) : "Tiada rugi/untung"}` });
    }

    if (cmd === "tarik_tali") {
      const bet = parseInt(args[0]);
      if (isNaN(bet) || bet <= 0) return sock.sendMessage(from, { text: `🪢 Format: *.tarik_tali [taruhan]*` });
      if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Duit tunai tak cukup!` });
      
      user.cash -= bet; 
      const pS = Math.random() * 100; 
      const aS = Math.random() * 100;
      
      if (pS > aS) { 
        user.cash += (bet * 2); 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🪢 *TARIK TALI*\n\n💪 Kuasa Anda: ${pS.toFixed(1)} | AI: ${aS.toFixed(1)}\n🎉 Anda tarik AI jatuh lumpur!\n💵 Menang: +RM ${(bet*2).toLocaleString()}` }); 
      } else { 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🪢 *TARIK TALI*\n\n💪 Kuasa Anda: ${pS.toFixed(1)} | AI: ${aS.toFixed(1)}\n❌ Anda tersungkur ditarik AI! Rugi: RM ${bet.toLocaleString()}` }); 
      }
    }

    if (cmd === "tembak_botol") {
      if (user.cash < 500) return sock.sendMessage(from, { text: `🎯 Modal tembak botol RM 500.` });
      
      user.cash -= 500; 
      const rng = Math.random(); 
      let msg = ""; 
      let win = 0;
      
      if (rng < 0.05) { win = 5000; msg = `🎯 *HEADSHOT!* Semua botol pecah berderai!`; } 
      else if (rng < 0.3) { win = 800; msg = `💥 Kena 2 botol. Not bad.`; } 
      else if (rng < 0.6) { win = 200; msg = `😅 Kena 1 botol je. Rugi sikit.`; } 
      else { win = 0; msg = `🤡 Tembak ke laut! Kosong.`; }
      
      user.cash += win; 
      updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `🎯 *TEMBAK BOTOL PESTA*\n\n${msg}\n💵 Tunai diterima: RM ${win}` });
    }

    if (cmd === "lumba_kuda") {
      const k = parseInt(args[0]); 
      const bet = parseInt(args[1]);
      if (isNaN(k) || k < 1 || k > 5 || isNaN(bet) || bet <= 0) return sock.sendMessage(from, { text: `🐎 Format: *.lumba_kuda [1-5] [taruhan]*` });
      if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Tunai tak cukup!` });
      
      user.cash -= bet; 
      const winner = Math.floor(Math.random() * 5) + 1;
      
      if (k === winner) { 
        user.cash += (bet * 5); 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🐎 *LUMBA KUDA*\n\nKuda nombor ${winner} menang lurus!\n💵 Menang 5X: +RM ${(bet*5).toLocaleString()}` }); 
      } else { 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🐎 *LUMBA KUDA*\n\nKuda nombor ${winner} yang menang. Kuda ${k} kalah!\n❌ Lebur RM ${bet.toLocaleString()}` }); 
      }
    }

    if (cmd === "tikam_nombor") {
      const num = parseInt(args[0]);
      if (isNaN(num) || num < 1 || num > 100) return sock.sendMessage(from, { text: `🎫 Tiket loteri bernilai RM 1000! Boleh menang RM 100,000.\nFormat: *.tikam_nombor [1-100]*` });
      if (user.cash < 1000) return sock.sendMessage(from, { text: `❌ Anda tak cukup RM 1000.` });
      
      user.cash -= 1000; 
      const rng = Math.floor(Math.random() * 100) + 1;
      
      if (num === rng) { 
        user.cash += 100000; 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🎫 *CABUTAN BERTUAH*\n\nNombor anda: ${num} | Cabutan: ${rng}\n🎉 *JACKPOT GILA!* Anda menang +RM 100,000!` }); 
      } else { 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🎫 *CABUTAN BERTUAH*\n\nNombor anda: ${num} | Cabutan: ${rng}\n❌ Nasib tak menyebelahi anda.` }); 
      }
    }

    // =====================================================================
    // 🛒 P2P MARKETPLACE
    // =====================================================================
    if (cmd === "jual_market") {
      const type = args[0]?.toLowerCase(); 
      const itemId = args[1]?.toLowerCase(); 
      const price = parseInt(args[2]);
      
      if (!["kenderaan", "bm"].includes(type) || !itemId || isNaN(price) || price <= 0) {
        return sock.sendMessage(from, { text: `❌ Format: *.jual_market [kenderaan/bm] [kod_item] [harga_jual]*` });
      }
      
      let itemName = ""; 
      if (type === "kenderaan") {
         if (!user.vehicles.includes(itemId)) return sock.sendMessage(from, { text: `❌ Kenderaan tiada dalam garaj!` });
         itemName = VEHICLES.find(v => v.id === itemId).name; 
         user.vehicles = user.vehicles.filter(v => v !== itemId);
      } else {
         const idx = user.inventory.findIndex(i => i.id == itemId); 
         if (idx === -1) return sock.sendMessage(from, { text: `❌ Barang tiada dalam beg!` });
         itemName = user.inventory[idx].name; 
         user.inventory.splice(idx, 1);
      }
      
      const listingId = Math.random().toString(36).substring(2, 7).toUpperCase();
      if (!db.p2pMarket) db.p2pMarket = []; 
      db.p2pMarket.push({ 
        listId: listingId, 
        sellerId: cleanSender, 
        sellerName: user.name, 
        type: type, 
        itemId: itemId, 
        itemName: itemName, 
        price: price 
      });
      
      saveDB(db); 
      updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `✅ *[P2P]* ${itemName} diletak di Pasaran Gelap!\n🔖 Kod Listing: *${listingId}* | Harga: RM ${price.toLocaleString()}` });
    }

    if (cmd === "pasar_pemain" || cmd === "p2p") {
      if (!db.p2pMarket || db.p2pMarket.length === 0) return sock.sendMessage(from, { text: `🛒 Pasaran P2P sunyi sepi...` });
      let ui = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🛒 PASARAN LELONGAN (P2P)\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
      db.p2pMarket.forEach(m => { 
        ui += `🔖 *[${m.listId}]* ${m.itemName}\n👤 Penjual: ${m.sellerName}\n💰 Harga: RM ${m.price.toLocaleString()}\n\n`; 
      });
      ui += `👉 Beli: *.beli_market [Kod_Listing]*`; 
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_market") {
      const listId = args[0]?.toUpperCase(); 
      if (!listId || !db.p2pMarket) return sock.sendMessage(from, { text: `❌ Masukkan Kod Listing dari *.pasar_pemain*!` });
      
      const itemIdx = db.p2pMarket.findIndex(m => m.listId === listId); 
      if (itemIdx === -1) return sock.sendMessage(from, { text: `❌ Kod Listing tak wujud/dibeli orang lain.` });
      
      const itemData = db.p2pMarket[itemIdx]; 
      if (itemData.sellerId === cleanSender) return sock.sendMessage(from, { text: `❌ Takkan nak beli barang sendiri bos?` });
      if (user.cash < itemData.price) return sock.sendMessage(from, { text: `❌ Duit tunai poket tak cukup!` });

      if (itemData.type === "kenderaan") {
        user.vehicles.push(itemData.itemId); 
      } else {
        user.inventory.push({ id: itemData.itemId, name: itemData.itemName });
      }
      
      user.cash -= itemData.price; 
      const seller = getUser(itemData.sellerId); 
      seller.cash += itemData.price;
      
      db.p2pMarket.splice(itemIdx, 1); 
      saveDB(db); 
      updateUser(cleanSender, user); 
      updateUser(itemData.sellerId, seller);
      
      return sock.sendMessage(from, { text: `🤝 *TRANSAKSI P2P BERJAYA!*\n\nBeli *${itemData.itemName}* dengan harga RM ${itemData.price.toLocaleString()}.\nWang dipindahkan ke *${seller.name}*.` });
    }

    // =====================================================================
    // 📈 INFO, PROFIL & ASET
    // =====================================================================
    if (cmd === "balance" || cmd === "bal") {
      return sock.sendMessage(from, { text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   💳 AKAUN: @${user.name}\n┣━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n💼 Tunai : RM ${user.cash.toLocaleString()}\n🏦 Bank  : RM ${user.bank.toLocaleString()}\n🪙 Emas  : ${(user.goldGrams||0).toFixed(2)}g\n₿ Kripto: ${(user.btcUnits||0).toFixed(4)} BTC\n📦 Besi  : ${user.scrapMetalKg} kg\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛` });
    }
    
    if (cmd === "myid" || cmd === "ic") {
      const totalWealth = user.cash + user.bank + Math.floor((user.goldGrams || 0) * (db.market?.gold || 350)) + Math.floor((user.btcUnits || 0) * (db.market?.btc || 280000));
      const uRod = FISHING_SHOP.rods.find(r => r.id === user.fishingGear?.rod) || FISHING_SHOP.rods[0]; 
      const uReel = FISHING_SHOP.reels.find(r => r.id === user.fishingGear?.reel) || FISHING_SHOP.reels[0];
      return sock.sendMessage(from, { text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🪪 CYBER ID (S${db.season || 1})\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n👤 Nama: *${user.name}*\n🎖️ Gelaran: ${getTitle(user)}\n📱 Peranti: ${user.phoneName}\n🐕 Pengawal: ${user.pet ? CYBER_PETS.find(p=>p.id===user.pet)?.name : "Tiada"}\n💵 Tunai: RM ${user.cash.toLocaleString()} | 🏦 Bank: RM ${user.bank.toLocaleString()}\n💎 Nilai Harta: RM ${totalWealth.toLocaleString()}\n🏎️ Jentera: ${user.vehicles.length} | 🏢 Hartanah: ${user.properties.length}\n🎣 Gear: ${uRod.name} | ${uReel.name}` });
    }
    
    if (cmd === "profile") {
      const vL = user.vehicles.length ? user.vehicles.join(", ") : "Garaj kosong"; 
      const iL = user.inventory.length ? user.inventory.map(i => i.name).join(", ") : "Beg kosong";
      return sock.sendMessage(from, { text: `🎒 *PROFIL INVENTORI*\n\n🏎️ Jentera: ${vL}\n🏴‍☠️ Barang BM: ${iL}\n🎣 Joran: *${FISHING_SHOP.rods.find(r=>r.id===user.fishingGear?.rod)?.name||"Joran Buluh"}*\n🪱 Umpan: *${FISHING_SHOP.baits.find(b=>b.id===user.fishingGear?.bait)?.name||"Tiada"}*\n🧲 Magnet: *${user.magnetGear?.magnet ? MAGNET_SHOP.find(m=>m.id===user.magnetGear.magnet)?.name : "Tiada"}*\n📦 Besi: *${user.scrapMetalKg} KG*\n📦 Peti: *${user.misteryBoxes}*` });
    }

    if (cmd === "kerja" || cmd === "work") {
      if (now < user.cooldowns.work && !isOwner) {
        return sock.sendMessage(from, { text: `⚠️ Rehat *${Math.ceil((user.cooldowns.work - now) / 1000)} saat* lagi.` });
      }
      
      const job = JOBS[Math.floor(Math.random() * JOBS.length)]; 
      let pay = Math.floor(Math.random() * (job.maxPay - job.minPay + 1)) + job.minPay;
      
      if (activePhoneObj?.perk === "work" || activePhoneObj?.perk === "god") {
        pay += Math.floor(pay * activePhoneObj.val);
      }
      
      if (currentEvent?.jobMult) {
        pay = Math.floor(pay * currentEvent.jobMult);
      }
      
      if (user.pet) { 
        const pObj = CYBER_PETS.find(p => p.id === user.pet); 
        if (pObj && (pObj.perk === "work_boost" || pObj.perk === "dragon_god")) {
          pay += Math.floor(pay * pObj.val); 
        }
      }
      
      user.cash += pay; 
      user.stats.works += 1; 
      user.cooldowns.work = now + 30000; 
      updateUser(cleanSender, user);
      
      return sock.sendMessage(from, { text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   💼 SLIP GAJI HALAL\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n🏢 Tugasan: *${job.name}*\n💵 Upah: *+RM ${pay.toLocaleString()}*` });
    }

    // =====================================================================
    // 🏎️ GARAJ & BENGKEL
    // =====================================================================
    if (cmd === "showroom") {
      const page = parseInt(args[0]) || 1; 
      const start = (page - 1) * 20; 
      const pageV = VEHICLES.slice(start, start + 20);
      let ui = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🏎️ SHOWROOM JENTERA (PAGE ${page}/4)\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
      pageV.forEach(v => { 
        ui += `• *[${v.id}]* ${v.name}\n  💰 RM ${v.price.toLocaleString()} | ⚡ ${v.speed} km/h\n\n`; 
      });
      ui += `💡 Beli: *.beli_kenderaan [id]* | Halaman: *.showroom 1*, *.showroom 2*`; 
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
        if (user.vehicles.length === 0) return sock.sendMessage(from, { text: `❌ Garaj kosong!` }); 
        let gUI = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🔧 BENGKEL MODIFIKASI\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
        user.vehicles.forEach((uVId, i) => { 
          const vD = VEHICLES.find(v => v.id === uVId); 
          if (vD) gUI += `${i + 1}. ${vD.name} ➔ Kod: *${vD.id}*\n`; 
        });
        gUI += `\n💡 Taip *.bengkel [kod_jentera]*`; 
        return sock.sendMessage(from, { text: gUI });
      }
      
      if (!user.vehicles.includes(vId)) return sock.sendMessage(from, { text: `❌ Jentera tiada dalam garaj!` });
      
      const v = VEHICLES.find(x => x.id === vId); 
      const pAvail = MOD_PARTS[v.type] || []; 
      const instMods = user.vehicleMods?.[vId] || [];
      let mUI = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🛠️ MODIFIKASI : ${v.name}\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
      
      pAvail.forEach(p => { 
        const isInst = instMods.includes(p.name); 
        mUI += `• *[ID ${p.id}]* ${p.name} ➔ ${isInst ? "✅" : `RM ${p.price.toLocaleString()}`}\n  _${p.desc}_\n\n`; 
      });
      mUI += `💡 Taip *.pasang ${vId} [ID_Barang]*`; 
      return sock.sendMessage(from, { text: mUI });
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
      
      if (user.vehicleMods[vId].includes(part.name)) return sock.sendMessage(from, { text: `⚠️ Dah terpasang!` });
      if (user.cash < part.price) return sock.sendMessage(from, { text: `❌ Tunai tak cukup!` });
      
      user.cash -= part.price; 
      user.vehicleMods[vId].push(part.name); 
      updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `🔧 *${part.name}* dipasang pada *${vehicle.name}*!` });
    }
    
    if (cmd === "lumba" || cmd === "race") {
      const vId = args[0]?.toLowerCase(); 
      if (!vId || !user.vehicles.includes(vId)) return sock.sendMessage(from, { text: `❌ Masukkan kod jentera! Contoh: *.lumba y15*` });
      if (now < user.cooldowns.race && !isOwner) return sock.sendMessage(from, { text: `🏎️ Enjin panas! Tunggu *${Math.ceil((user.cooldowns.race - now) / 1000)} saat*.` });
      
      const vehicle = VEHICLES.find(v => v.id === vId); 
      user.cooldowns.race = now + (90 * 1000);
      let sBonus = 0; 
      
      (user.vehicleMods?.[vId] || []).forEach(mName => { 
        const pObj = MOD_PARTS[vehicle.type]?.find(p => p.name === mName); 
        if (pObj) sBonus += pObj.boostSpeed; 
      });
      
      const tSpeed = vehicle.speed + sBonus; 
      let wChance = tSpeed / 240; 
      if (activePhoneObj?.perk === "race" || activePhoneObj?.perk === "god") wChance += activePhoneObj.val;
      
      if (Math.random() < wChance || isOwner) {
        let rwd = Math.floor((vehicle.price * 0.05) + 500); 
        if (currentEvent?.raceMult) rwd = Math.floor(rwd * currentEvent.raceMult);
        user.cash += rwd; 
        user.stats.racesWon += 1; 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🏁 *JUARA DRAG RACE!*\n\n${getRandomNarrative("RACE_WIN")}\n\n🏎️ Jentera: *${vehicle.name}*\n💰 Hadiah: *+RM ${rwd.toLocaleString()}*` });
      } else {
        const repCost = Math.floor(vehicle.price * 0.02); 
        user.cash = Math.max(0, user.cash - repCost); 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `💥 *TERBABAS DI LITAR!*\n\n${getRandomNarrative("RACE_CRASH")}\n\n💸 Kos Baiki: *-RM ${repCost.toLocaleString()}*` });
      }
    }

    // =====================================================================
    // 🏢 HARTANAH
    // =====================================================================
    if (cmd === "list_hartanah") { 
      let ui = `🏢 HARTANAH:\n`; 
      PROPERTIES.forEach(p => { 
        ui += `• [${p.id}] ${p.name} (RM ${p.price.toLocaleString()})\n`; 
      }); 
      return sock.sendMessage(from, { text: ui + `\n👉 *.beli_rumah [id]*` }); 
    }
    
    if (cmd === "beli_rumah") { 
      const pr = PROPERTIES.find(x => x.id === parseInt(args[0])); 
      if (!pr || user.cash < pr.price) return sock.sendMessage(from, { text: `❌ Batal! Semak kod dan duit.` }); 
      
      user.cash -= pr.price; 
      user.properties.push(pr.id); 
      updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `🏠 Dibeli! *${pr.name}* milik anda.` }); 
    }
    
    if (cmd === "kutip_sewa") { 
      if(now < user.cooldowns.rent && !isOwner) {
        return sock.sendMessage(from,{text:`⏳ Sabar! Belum cukup tempoh.`}); 
      }
      user.cooldowns.rent = now + 86400000; 
      let r = 0; 
      user.properties.forEach(pid => { 
        const p = PROPERTIES.find(x => x.id === pid); 
        if(p) r += p.rent; 
      }); 
      
      user.cash += r; 
      updateUser(cleanSender,user); 
      return sock.sendMessage(from,{text:`💵 Kutip Sewa: +RM ${r.toLocaleString()}`}); 
    }

    // =====================================================================
    // 🏦 BANK, KASINO & KEDAI MAKAN / DEVICE
    // =====================================================================
    if (cmd === "deposit" || cmd === "dep") { 
      const amt = args[0] === "all" ? user.cash : parseInt(args[0]); 
      if (isNaN(amt) || amt <= 0 || user.cash < amt) return sock.sendMessage(from, { text: `❌ Baki tak cukup!` }); 
      user.cash -= amt; user.bank += amt; updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `🏦 *DEPOSIT:* +RM ${amt.toLocaleString()}` }); 
    }
    
    if (cmd === "withdraw" || cmd === "wd") { 
      const amt = args[0] === "all" ? user.bank : parseInt(args[0]); 
      if (isNaN(amt) || amt <= 0 || user.bank < amt) return sock.sendMessage(from, { text: `❌ Baki tak cukup!` }); 
      user.bank -= amt; user.cash += amt; updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `💵 *WITHDRAW:* +RM ${amt.toLocaleString()}` }); 
    }
    
    if (cmd === "transfer" || cmd === "pay") { 
      const tgt = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; 
      const amt = parseInt(args[1]); 
      if (!tgt || isNaN(amt) || user.cash < amt) return sock.sendMessage(from, { text: `❌ Format: *.transfer @user [jumlah]*` }); 
      const tUser = getUser(tgt.replace(/[^0-9]/g, "") + "@s.whatsapp.net"); 
      user.cash -= amt; tUser.cash += amt; 
      updateUser(cleanSender, user); 
      updateUser(tgt.replace(/[^0-9]/g, "") + "@s.whatsapp.net", tUser); 
      return sock.sendMessage(from, { text: `💸 *TRANSFER:* RM ${amt.toLocaleString()} dihantar!` }); 
    }

    if (cmd === "slot") { 
      const bet = parseInt(args[0]); 
      if (isNaN(bet) || bet < 10 || user.cash < bet) return sock.sendMessage(from, { text: `❌ Min taruhan RM 10 dan duit cukup!` }); 
      const i = ["🍒", "🍋", "🍇", "💎", "7️⃣"]; 
      const r1=i[Math.floor(Math.random()*5)], r2=i[Math.floor(Math.random()*5)], r3=i[Math.floor(Math.random()*5)]; 
      user.cash -= bet; 
      let mult = (r1===r2&&r2===r3)?(r1==="7️⃣"?10:5):((r1===r2||r2===r3||r1===r3)?1.5:0); 
      if (isOwner && mult===0) mult=3; 
      if (mult > 0) { 
        const win = Math.floor(bet * mult); 
        user.cash += win; updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n🔥 *JACKPOT!* +RM ${win.toLocaleString()}!` }); 
      } else { 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n❌ Rugi -RM ${bet.toLocaleString()}` }); 
      } 
    }
    
    if (cmd === "coinflip") { 
      const c = args[0]?.toLowerCase(); 
      const bet = parseInt(args[1]); 
      if (!["kepala", "bunga"].includes(c) || isNaN(bet) || user.cash < bet) return sock.sendMessage(from, { text: `Format: *.coinflip [kepala/bunga] [taruhan]*` }); 
      user.cash -= bet; 
      if (Math.random() < 0.49 || isOwner) { 
        user.cash += (bet * 2); updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🪙 *MENANG!* (+RM ${(bet*2).toLocaleString()})` }); 
      } else { 
        updateUser(cleanSender, user); 
        return sock.sendMessage(from, { text: `🪙 *TEWAS!*` }); 
      } 
    }
    
    if (cmd === "hutang_ahlong") { 
      const amt = parseInt(args[0]); 
      if (isNaN(amt) || amt <= 0 || amt > 500000 || user.debt > 0) return sock.sendMessage(from, { text: `❌ Maks RM500k & langsaikan hutang lama dulu!` }); 
      user.cash += amt; user.debt = Math.floor(amt * 1.25); updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `🦈 Pinjaman Lulus! Baki bayar: RM ${user.debt.toLocaleString()}` }); 
    }
    
    if (cmd === "bayar_ahlong") { 
      if (user.debt <= 0 || user.cash < user.debt) return sock.sendMessage(from, { text: `❌ Duit tak cukup bayar RM ${user.debt.toLocaleString()}!` }); 
      user.cash -= user.debt; user.debt = 0; updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `🦈 Langsai!` }); 
    }

    if (cmd === "shop" || cmd === "warung") { 
      let ui = `🍔 WARUNG AIRI:\n`; 
      FOOD_ITEMS.forEach(f => { ui += `• [${f.id}] ${f.name} ➔ RM ${f.price}\n`; }); 
      return sock.sendMessage(from, { text: ui + `\n👉 *.beli_makanan [id]* & *.makan [id]*` }); 
    }
    
    if (cmd === "beli_makanan") { 
      const f = FOOD_ITEMS.find(x => x.id === args[0]?.toLowerCase()); 
      if (!f || user.cash < f.price) return; 
      user.cash -= f.price; user.food.push(f.id); updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `🍽️ Order ${f.name} berjaya!` }); 
    }
    
    if (cmd === "makan") { 
      const idx = user.food.indexOf(args[0]?.toLowerCase()); 
      if (idx === -1) return; 
      user.food.splice(idx, 1); 
      user.cooldowns.work = 0; 
      updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `😋 Kenyang padu! CD Kerja Reset.` }); 
    }
    
    if (cmd === "device") { 
      let ui = `📱 KEDAI TELEFON:\n`; 
      PHONE_DEVICES.forEach(p => { ui += `• [${p.id}] ${p.name} ➔ RM ${p.price}\n`; }); 
      return sock.sendMessage(from, { text: ui + `\n👉 *.beli_phone [id]*` }); 
    }
    
    if (cmd === "beli_phone") { 
      const p = PHONE_DEVICES.find(x => x.id === args[0]?.toLowerCase()); 
      if (!p || user.cash < p.price) return; 
      user.cash -= p.price; user.phoneDevice = p.id; user.phoneName = p.name; updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `📱 Dibeli!` }); 
    }
    
    if (cmd === "upah_lawyer") { 
      if (now >= user.cooldowns.jailUntil && !isOwner) return; 
      if (user.cash < 500 && !isOwner) return; 
      if (!isOwner) user.cash -= 500; 
      user.cooldowns.jailUntil = 0; 
      updateUser(cleanSender, user); 
      return sock.sendMessage(from, { text: `⚖️ Anda bebas!` }); 
    }

    // =====================================================================
    // 🎣 SISTEM MEMANCING & AKUARIUM (YANG TERCICIR)
    // =====================================================================
    if (cmd === "kedai_pancing" || cmd === "tackleshop") {
      const subCategory = args[0];
      if (!subCategory) return sock.sendMessage(from, { text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🎣 KEDAI PANCING AIRI\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n1️⃣ Joran\n2️⃣ Kekili\n3️⃣ Umpan\n4️⃣ Akuarium\n\n👉 Contoh: *.kedai_pancing 1*` });
      let ui = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   KEDAI KATEGORI ${subCategory}\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
      if (subCategory === "1") FISHING_SHOP.rods.forEach(r => { ui += `• *[${r.id}]* ${r.name}\n  💰 RM ${r.price.toLocaleString()} | _${r.desc}_\n\n`; });
      else if (subCategory === "2") FISHING_SHOP.reels.forEach(re => { ui += `• *[${re.id}]* ${re.name}\n  💰 RM ${re.price.toLocaleString()} | _${re.desc}_\n\n`; });
      else if (subCategory === "3") FISHING_SHOP.baits.forEach(b => { ui += `• *[${b.id}]* ${b.name}\n  💰 RM ${b.price.toLocaleString()} | _${b.desc}_\n\n`; });
      else if (subCategory === "4") FISHING_SHOP.tanks.forEach(t => { ui += `• *[${t.id}]* ${t.name}\n  💰 RM ${t.price.toLocaleString()} | _${t.desc}_\n\n`; });
      else return sock.sendMessage(from, { text: `❌ Nombor 1-4 sahaja.` });
      return sock.sendMessage(from, { text: ui + `👉 Beli: *.beli_pancing [id]*` });
    }
    if (cmd === "beli_pancing") {
      const itemCode = args[0]?.toLowerCase(); if (!itemCode) return sock.sendMessage(from, { text: `❌ Masukkan kod barang!` });
      const item = [...FISHING_SHOP.rods, ...FISHING_SHOP.reels, ...FISHING_SHOP.baits, ...FISHING_SHOP.tanks].find(i => i.id === itemCode);
      if (!item) return sock.sendMessage(from, { text: `❌ Kod tidak wujud!` });
      if (user.cash < item.price) return sock.sendMessage(from, { text: `❌ Tunai tak cukup!` });
      user.cash -= item.price;
      if (item.luckBonus) user.fishingGear.rod = item.id; else if (item.cdReduction) user.fishingGear.reel = item.id; else if (item.priceMult) user.fishingGear.bait = item.id; else user.fishingGear.tank = item.id;
      updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🎉 Berjaya membeli *${item.name}*!` });
    }
    if (cmd === "mancing" || cmd === "fish") {
      const uReel = FISHING_SHOP.reels.find(r => r.id === user.fishingGear?.reel) || FISHING_SHOP.reels[0];
      if (now < user.cooldowns.fish && !isOwner) return sock.sendMessage(from, { text: `🎣 Sabar, tunggu ${Math.ceil((user.cooldowns.fish-now)/1000)}s.` });
      const uRod = FISHING_SHOP.rods.find(r => r.id === user.fishingGear?.rod) || FISHING_SHOP.rods[0];
      user.cooldowns.fish = now + Math.max(15000, 60000 - uReel.cdReduction);
      let caught = generateFishInstance(uRod);
      if (caught.isDangerous && Math.random() < 0.35) {
        user.cooldowns.hospitalUntil = now + 300000; user.cash = Math.max(0, user.cash - 1500); updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 *TRAGEDI!*\n${caught.name} mengganas! Masuk Wad 5 min.\n💸 Bil: *-RM 1,500*` });
      }
      let fPrice = caught.price; const uBait = FISHING_SHOP.baits.find(b => b.id === user.fishingGear?.bait);
      if (uBait && fPrice > 0) fPrice = Math.floor(fPrice * uBait.priceMult);
      if (currentEvent?.fishMult) fPrice = Math.floor(fPrice * currentEvent.fishMult);
      caught.price = fPrice; db.pendingFish = db.pendingFish || {}; db.pendingFish[cleanSender] = { fish: caught, finalPrice: fPrice };
      saveDB(db); updateUser(cleanSender, user);
      if (fPrice === 0) { delete db.pendingFish[cleanSender]; saveDB(db); return sock.sendMessage(from, { text: `🎣 ${caught.name} ditarik. (Sampah dibuang)` }); }
      return sock.sendMessage(from, { text: `🎣 *TANGKAPAN BERJAYA!*\n🐟: *${caught.name}* (${caught.weightKg}kg)\n💰: *RM ${fPrice.toLocaleString()}*\n👉 *.jual_ikan* atau *.bela_ikan*` });
    }
    if (cmd === "jual_ikan") { const p = db.pendingFish?.[cleanSender]; if (!p) return sock.sendMessage(from, { text: `❌ Tiada ikan.` }); user.cash += p.finalPrice; user.stats.fishes++; delete db.pendingFish[cleanSender]; saveDB(db); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `💵 Jual ikan: +RM ${p.finalPrice.toLocaleString()}` }); }
    if (cmd === "bela_ikan") { const p = db.pendingFish?.[cleanSender]; if (!p) return sock.sendMessage(from, { text: `❌ Tiada ikan.` }); const cT = FISHING_SHOP.tanks.find(t => t.id === user.fishingGear?.tank) || FISHING_SHOP.tanks[0]; if (user.aquarium.length >= cT.capacity) return sock.sendMessage(from, { text: `❌ Akuarium penuh!` }); user.aquarium.push(p.fish); user.stats.fishes++; delete db.pendingFish[cleanSender]; saveDB(db); updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🐠 Ikan dimasukkan ke Akuarium!` }); }
    if (cmd === "akuarium") { if (!user.aquarium || user.aquarium.length === 0) return sock.sendMessage(from, { text: `🐠 Akuarium kosong!` }); let ui = `🐠 AKUARIUM:\n`; user.aquarium.forEach((f, i) => { ui += `${i+1}. ${f.name} (RM ${f.price.toLocaleString()})\n`; }); return sock.sendMessage(from, { text: ui + `👉 *.jual_akuarium*` }); }
    if (cmd === "jual_akuarium") { if (!user.aquarium || user.aquarium.length === 0) return; let t = 0; user.aquarium.forEach(f => { t += f.price; }); user.cash += t; user.aquarium = []; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `💵 Jual semua: +RM ${t.toLocaleString()}` }); }

    // =====================================================================
    // 🧲 MAGNET, BESI & PETI MISTERI
    // =====================================================================
    if (cmd === "kedai_magnet") { let ui = `🧲 KEDAI MAGNET:\n`; MAGNET_SHOP.forEach(m => { ui += `• [${m.id}] ${m.name} (RM ${m.price.toLocaleString()})\n`; }); return sock.sendMessage(from, { text: ui + `👉 *.beli_magnet [id]*` }); }
    if (cmd === "beli_magnet") { const m = MAGNET_SHOP.find(x => x.id === args[0]); if (!m || user.cash < m.price) return sock.sendMessage(from, { text: `❌ Batal.` }); user.cash -= m.price; user.magnetGear.magnet = m.id; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🧲 Berjaya beli ${m.name}!` }); }
    if (cmd === "baling_magnet") { if (!user.magnetGear.magnet) return sock.sendMessage(from, { text: `❌ Tiada magnet!` }); if (now < user.cooldowns.magnet && !isOwner) return sock.sendMessage(from, { text: `⏳ Lenguh!` }); user.cooldowns.magnet = now + 45000; const m = MAGNET_SHOP.find(x => x.id === user.magnetGear.magnet); const kg = (Math.floor(Math.random() * 5) + 1) * m.pullPower; user.scrapMetalKg += kg; let ex = ""; if (Math.random() < m.pullPower * 0.02) { const l = [...MAGNET_LOOT].sort(() => 0.5 - Math.random())[0]; if (l.type === "box") { user.misteryBoxes++; ex = `\n🎁 Dapat Peti Misteri! (*.buka_peti*)`; } else { user.cash += l.price; ex = `\n💎 Jumpa ${l.name} (RM ${l.price.toLocaleString()})!`; } } updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🧲 Tarik +${kg} KG Besi!${ex}` }); }
    if (cmd === "jual_besi") { if (user.scrapMetalKg <= 0) return sock.sendMessage(from, { text: `❌ Tiada besi!` }); const p = user.scrapMetalKg * (db.market?.scrap || 5); user.cash += p; user.scrapMetalKg = 0; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `⚙️ Jual besi: +RM ${p.toLocaleString()}` }); }
    if (cmd === "buka_peti") { if (user.misteryBoxes <= 0) return sock.sendMessage(from, { text: `❌ Tiada peti!` }); user.misteryBoxes--; if (Math.random() < 0.4) { updateUser(cleanSender, user); return sock.sendMessage(from, { text: `📦 Peti kosong!` }); } else { const r = Math.floor(Math.random() * 50000) + 5000; user.cash += r; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `📦 Jackpot! +RM ${r.toLocaleString()}` }); } }

    // =====================================================================
    // 💻 GODAM BANK & BOUNTY
    // =====================================================================
    if (cmd === "hackbank" || cmd === "godam_bank") {
      const tgt = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if (!tgt) return sock.sendMessage(from, { text: `❌ *.hackbank @user*` });
      const cTgt = tgt.replace(/[^0-9]/g, "") + "@s.whatsapp.net"; if (cTgt === cleanSender) return;
      if (now < user.cooldowns.bankHack && !isOwner) return sock.sendMessage(from, { text: `⏳ Bersembunyi dari Cyber-Sec: ${Math.ceil((user.cooldowns.bankHack-now)/60000)} min.` });
      const hD = user.inventory.some(i => [11, 2, 5].includes(i.id)); if (!hD && !isOwner) return sock.sendMessage(from, { text: `❌ Perlukan Cyber Dongle (ID 11)!` });
      const tU = getUser(cTgt); if (tU.bank < 1000) return sock.sendMessage(from, { text: `😅 Bank mangsa sikit sangat.` });
      let pObj = tU.pet ? CYBER_PETS.find(p => p.id === tU.pet) : null;
      if (pObj && ["anti_hack", "dual_def", "dragon_god"].includes(pObj.perk)) {
          if (Math.random() < pObj.val) { user.cash = Math.max(0, user.cash - 1000); user.cooldowns.bankHack = now + 900000; updateUser(cleanSender, user); return sock.sendMessage(from, { text: `🛡️ Firewall pintas! -RM 1000` }); }
      }
      const pin = ["⚡", "💾", "🔓", "☣️", "👾", "📡", "💎", "🛡️"].sort(()=>0.5-Math.random()).slice(0,4).join("");
      db.activeHacks = db.activeHacks || {}; db.activeHacks[cleanSender] = { target: cTgt, pin: pin, expires: now + 30000 }; saveDB(db);
      return sock.sendMessage(from, { text: `⚡ *CYBER HANDSHAKE*\nSasaran: *${tU.name}*\n🔑 PIN: ${pin}\nMasa: 30s! 👉 *.bypass ${pin}*` });
    }
    if (cmd === "bypass") {
      const aH = db.activeHacks?.[cleanSender]; if (!aH || now > aH.expires) { if(aH){delete db.activeHacks[cleanSender]; saveDB(db);} return sock.sendMessage(from, { text: `❌ Sesi tamat!` }); }
      const tU = getUser(aH.target);
      if (args.join("").trim() === aH.pin) {
        delete db.activeHacks[cleanSender]; const st = Math.floor(tU.bank * 0.05); tU.bank -= st; user.cash += st; user.stats.bankHacks++; user.cooldowns.bankHack = now + 1800000; saveDB(db); updateUser(cleanSender, user); updateUser(aH.target, tU);
        return sock.sendMessage(from, { text: `🔓 GODAM BERJAYA! +RM ${st.toLocaleString()}`, mentions: [aH.target] });
      } else {
        delete db.activeHacks[cleanSender]; user.cash = Math.max(0, user.cash - 1500); user.cooldowns.jailUntil = now + 60000; user.cooldowns.bankHack = now + 900000; saveDB(db); updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 PIN Salah! Denda RM1500 & lokap 60s!` });
      }
    }
    if (cmd === "bounty") {
      const tg = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; const amt = parseInt(args[1]); if (!tg || isNaN(amt) || amt < 5000) return sock.sendMessage(from, { text: `❌ *.bounty @user [rm]* (Min 5k)` });
      if (user.cash < amt) return sock.sendMessage(from, { text: `❌ Tunai tak cukup!` });
      const cTg = tg.replace(/[^0-9]/g, "") + "@s.whatsapp.net"; if (cTg === cleanSender) return;
      user.cash -= amt; db.bounties = db.bounties || {}; db.bounties[cTg] = (db.bounties[cTg] || 0) + amt; saveDB(db); updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎯 Kepala diletakkan harga RM ${db.bounties[cTg].toLocaleString()}!`, mentions: [cTg] });
    }
    if (cmd === "list_bounty") {
      if (!db.bounties || Object.keys(db.bounties).length === 0) return sock.sendMessage(from, { text: `📜 Tiada buronan aktif.` });
      let ui = `🎯 PAPAN BURONAN:\n`; for (const id in db.bounties) { ui += `• *${getUser(id).name}* ➔ RM ${db.bounties[id].toLocaleString()}\n`; } return sock.sendMessage(from, { text: ui });
    }
    

    // =====================================================================
    // 📖 MENU UTAMA
    // =====================================================================
    if (cmd === "menu" || cmd === "help") {
      let menuText = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
   🖥️ SHADOW LEGACY OS V4.0
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛
🔥 *[EVENT AKTIF]:* ${currentEvent ? currentEvent.name : "Tiada"}

🤖 *[1. AI & KOMUNITI]*
• .airi [soalan], .santau @user
• .split_bil [rm] [pax]

🎮 *[2. MINI-GAMES BARU!]*
• .gacha_mlbb, .tiktok_affiliate
• .sabung_ayam [merah/hitam] [bet]
• .teka_nombor [1-10] [bet], .tarik_tali [bet]
• .bgk [batu/gunting/kertas] [bet]
• .tembak_botol, .lumba_kuda [1-5] [bet]
• .tikam_nombor [1-100], .kotak_beracun [1-3]

🛒 *[3. P2P MARKETPLACE]*
• .jual_market [kenderaan/bm] [id] [harga]
• .pasar_pemain, .beli_market [Kod]

📈 *[4. EKONOMI & PASARAN]*
• .kerja, .pasaran, .daily
• .beli_emas, .jual_emas, .beli_btc, .jual_btc
• .jual_besi

🎣 *[5. JETI & MAGNET]*
• .kedai_pancing, .beli_pancing [id]
• .mancing, .jual_ikan, .bela_ikan
• .kedai_magnet, .beli_magnet [id]
• .baling_magnet, .buka_peti

🏴‍☠️ *[6. UNDERWORLD]*
• .bm, .beli_bm, .jenayah, .buat_jenayah
• .rompak @user, .hackbank @user
• .bounty @user [rm], .list_bounty

🏎️ *[7. ASET & GARAJ]*
• .showroom 1, .beli_kenderaan [id]
• .lumba, .list_hartanah, .kutip_sewa
• .profile, .myid, .bengkel, .pasang
• .beli_rumah [id]

🏦 *[8. BANK, KASINO & LAIN]*
• .deposit, .withdraw, .transfer @user [rm]
• .slot, .coinflip
• .hutang_ahlong [rm], .bayar_ahlong
• .shop, .beli_makanan [id], .makan [id]
• .device, .beli_phone [id], .upah_lawyer
• .ranking, .top, .halloffame, .season_info`;
      return sock.sendMessage(from, { text: menuText });
    }
  });
}

startBotEngine().catch(e => console.error(e));
