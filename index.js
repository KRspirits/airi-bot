// =========================================================================
// 🛡️ SHADOW LEGACY ENGINE V4.0 (FULL UNMINIFIED + 10 NEW MINI-GAMES)
// =========================================================================
process.on("uncaughtException", (err) => { console.error("⚠️ [Anti-Crash] Uncaught Exception:", err?.message || err); });
process.on("unhandledRejection", (reason, promise) => { console.error("⚠️ [Anti-Crash] Unhandled Rejection:", reason); });

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
    const sysPrompt = `Nama kau Airi, maskot AI Airi's Corner. Waktu: ${currentTimeMY}. Personaliti: Ceria, comel, santai Melayu, guna dialek tempatan ('weh', 'kot'). Jawab ringkas. Pengguna: ${userName}.`;
    
    const chat = await groq.chat.completions.create({
      messages: [{ role: "system", content: sysPrompt }, { role: "user", content: promptText }],
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
    QRCode.toDataURL(currentQR).then(img => res.end(`<div style="text-align:center;margin-top:40px;font-family:sans-serif;background:#0a0f1d;color:#fff;padding:25px;"><h2>⚡ IMBAS KOD QR ⚡</h2><img src="${img}" style="width:280px;height:280px;border-radius:16px;"/></div>`)).catch(() => res.end("Ralat QR"));
  } else {
    res.end(`<div style="text-align:center;margin-top:80px;color:#fff;font-family:sans-serif;"><h2>⏳ Menjana Kod QR...</h2></div>`);
  }
});
server.listen(PORT, "0.0.0.0", () => { console.log(`🌐 Server aktif port ${PORT}`); });

// =========================================================================
// 💾 2. DATABASE & MIGRATION SCRIPT
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
    if (fs.existsSync("./database.json")) localDB = JSON.parse(fs.readFileSync("./database.json", "utf-8"));
    else fs.writeFileSync("./database.json", JSON.stringify(localDB));
  }
}

function loadDB() { return localDB; }
function saveDB(data) {
  localDB = data;
  if (mongoCollection) mongoCollection.updateOne({ _id: "MAIN_DATA" }, { $set: { data: localDB } }, { upsert: true }).catch(()=>{});
  else fs.writeFileSync("./database.json", JSON.stringify(data, null, 2));
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
  if (pushName && pushName !== "Warga Cyber" && u.name !== pushName) { u.name = pushName; saveDB(db); }
  
  if (!u.aquarium) u.aquarium = []; 
  if (u.magnetGear === undefined) u.magnetGear = { magnet: null };
  if (u.scrapMetalKg === undefined) u.scrapMetalKg = 0; 
  if (u.misteryBoxes === undefined) u.misteryBoxes = 0;
  if (u.cooldowns.hospitalUntil === undefined) u.cooldowns.hospitalUntil = 0;
  
  return u;
}

function updateUser(userId, userData) { 
  const db = loadDB(); 
  db.users[userId] = userData; 
  saveDB(db); 
}

// =========================================================================
// 🌟 3. SEASON EVENTS (40 TOTAL EVENTS)
// =========================================================================
const SEASON_EVENTS = {
  // Original 20
  "CRIME_BOOM": { name: "🔥 Musim Jenayah Gila", desc: "Loot jenayah naik 2x!", rewardMult: 2.0, jailMult: 2.0, fineMult: 1.2, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "TECH_SURGE": { name: "💻 Revolusi Siber", desc: "Diskaun BM 40%", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "ECONOMIC_CRASH": { name: "📉 Kemelesetan Ekonomi", desc: "Gaji 2x, denda 2x", rewardMult: 0.8, jailMult: 1.2, fineMult: 2.0, jobMult: 2.0, fishMult: 1.0, rentMult: 0.8 },
  "GOLD_RUSH": { name: "💰 Gelombang Emas", desc: "Harga ikan & sewa 2x", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.2, fishMult: 2.0, rentMult: 2.0 },
  "UNDERGROUND_RACING": { name: "🏁 Pelesit Litar Malam", desc: "Hadiah drag 2.5x", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 2.5 },
  "MEGA_HARVEST": { name: "🌊 Badai Laut Dalam", desc: "Harga ikan melonjak 3x", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 3.0, rentMult: 1.0 },
  "TYCOON_PARADISE": { name: "🏰 Monopoli Taikun", desc: "Sewa hartanah 3x ganda!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 3.0 },
  "INFLATION_SPIKE": { name: "💸 Inflasi Melampau", desc: "Elaun harian naik!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.5, jobMult: 1.5, fishMult: 1.5, rentMult: 1.5 },
  "CYBER_ANARCHY": { name: "🏴‍☠️ Anarki Darkweb", desc: "Rompakan PvP sedut 40%", rewardMult: 1.5, jailMult: 0.8, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "POLICE_CRACKDOWN": { name: "🚔 Ops Cantas", desc: "Loot 3x, denda 3x", rewardMult: 3.0, jailMult: 1.5, fineMult: 3.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "INFLASI_SIBER": { name: "💸 Inflasi Siber", desc: "Harga naik 2x ganda.", rewardMult: 1.0, jailMult: 1.0, fineMult: 2.0, jobMult: 1.5, fishMult: 1.0, rentMult: 1.0 },
  "SUBSIDI_B40": { name: "🎁 Subsidi B40", desc: "Elaun bonus tambahan.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 3.0, fishMult: 1.0, rentMult: 1.0 },
  "DOUBLE_EXP": { name: "🚀 Double EXP Lumba", desc: "Pulangan 3x lumba.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 3.0 },
  "BEAR_MARKET": { name: "📉 Bear Market", desc: "Pasaran Emas jatuh.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "PILIHANRAYA": { name: "🗳️ Pilihanraya", desc: "Bantuan kempen dinaikkan.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 2.0, fishMult: 1.0, rentMult: 1.0 },
  "ZOMBIE_OUTBREAK": { name: "🧟 Zombie Outbreak", desc: "Kerja lumpuh.", rewardMult: 2.0, jailMult: 0.5, fineMult: 1.0, jobMult: 0.1, fishMult: 1.0, rentMult: 0.1 },
  "VIP_ESCORT": { name: "🕶️ Kawalan VIP", desc: "Hukuman dipendekkan.", rewardMult: 1.5, jailMult: 0.1, fineMult: 0.5, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "KEMARAU_PANJANG": { name: "🏜️ Kemarau Ikan", desc: "Harga ikan 5x!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 5.0, rentMult: 1.0 },
  "PEMBERSIHAN_SCAM": { name: "🛑 Pembersihan Siber", desc: "Denda hacking tinggi.", rewardMult: 1.0, jailMult: 3.0, fineMult: 5.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "REVOLUSI_KILANG": { name: "🏭 Revolusi Kilang", desc: "Sewa hartanah 5x.", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 5.0 },
  // New 20 Profitable Events
  "BULL_MARKET": { name: "🚀 Pasaran Bull Emas", desc: "Gaji kerja +300%", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 3.0, fishMult: 1.0, rentMult: 1.0 },
  "FESTIVAL_JETI": { name: "🎉 Pesta Pemancing B40", desc: "Tangkapan ikan harga 4x", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 4.0, rentMult: 1.0 },
  "HACKER_SYNDICATE": { name: "👾 Sindiket Godam", desc: "Loot rompakan bank 3x ganda", rewardMult: 3.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "DURIAN_RUNTUH": { name: "🌳 Musim Durian Runtuh", desc: "Semua payout +150%", rewardMult: 1.5, jailMult: 1.0, fineMult: 1.0, jobMult: 2.5, fishMult: 2.5, rentMult: 2.5 },
  "AMNESTY_DAY": { name: "🕊️ Hari Pengampunan", desc: "Tiada denda lokap & denda ringan", rewardMult: 1.0, jailMult: 0.1, fineMult: 0.1, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "STIMULUS_PACKAGE": { name: "📦 Pakej Rangsangan", desc: "Hasil Kerja Halal 4x ganda!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 4.0, fishMult: 1.0, rentMult: 1.0 },
  "CRYPTO_BOOM": { name: "🪙 Ledakan Kripto", desc: "Hasil sewaan 4x ganda", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 4.0 },
  "BLACK_FRIDAY": { name: "🛍️ Black Friday Siber", desc: "Rompakan kedai amat lumayan (5x)", rewardMult: 5.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "FORMULA_1": { name: "🏎️ Minggu F1 Sepang", desc: "Lumba Haram bayar 5x ganda", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 5.0 },
  "MONSOON_FISHING": { name: "⛈️ Monsun Timur Laut", desc: "Ikan harga 5x tapi bahaya!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 5.0, rentMult: 1.0 },
  "AEROSPACE_EXPO": { name: "🛸 Ekspo Angkasa", desc: "Sewa hartanah angkasa lepas (5x)", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 5.0 },
  "AI_REVOLUTION": { name: "🧠 Era AI Shadow", desc: "Kerja halal bergaji 5x ganda", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 5.0, fishMult: 1.0, rentMult: 1.0 },
  "PIRATE_AGE": { name: "🏴‍☠️ Era Lanun Siber", desc: "Rompakan bank 5x lebih pantas", rewardMult: 5.0, jailMult: 0.5, fineMult: 0.5, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "NATIONAL_DAY": { name: "🇲🇾 Hari Kebangsaan", desc: "Semua payout 3x ganda", rewardMult: 3.0, jailMult: 1.0, fineMult: 1.0, jobMult: 3.0, fishMult: 3.0, rentMult: 3.0 },
  "ELECTION_MONEY": { name: "🗳️ Duit Kempen Pilihanraya", desc: "Kerja halal beri elaun 6x", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 6.0, fishMult: 1.0, rentMult: 1.0 },
  "TREASURE_FLEET": { name: "⚓ Armada Harta Karun", desc: "Ikan tangkapan 6x harga!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 6.0, rentMult: 1.0 },
  "REAL_ESTATE_BUBBLE": { name: "🏠 Gelembung Hartanah", desc: "Sewa rumah gila-gila (6x)", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 6.0 },
  "SMUGGLERS_COVE": { name: "🚤 Teluk Penyeludup", desc: "Jenayah Black Market 6x ganda", rewardMult: 6.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "BIONIC_ERA": { name: "🦾 Era Bionik", desc: "Gaji 4x, Lumba 4x, Sewa 4x", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 4.0, fishMult: 1.0, rentMult: 4.0, raceMult: 4.0 },
  "SHADOW_LEGACY_DAY": { name: "🐺 Hari Jadi Shadow Legacy", desc: "BONUS KESELURUHAN 10X GANDA", rewardMult: 10.0, jailMult: 0.1, fineMult: 0.1, jobMult: 10.0, fishMult: 10.0, rentMult: 10.0, raceMult: 10.0 }
};

// =========================================================================
// 🎲 4. 50 RANDOM EVENTS ENGINE
// =========================================================================
const RANDOM_SCENARIOS = [
  // Profitable
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
  // Detrimental
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

// =========================================================================
// ⚙️ 5. MARKET, SHOP, FISHING, JOBS, PROPERTIES, VEHICLES & BLACKMARKET
// =========================================================================
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
  { id: "f18", name: "Ikan Purba Coelacanth Emas 🌟", basePrice: 1500000, tier: "👑 [MYTHIC]", weightKg: 78.0, dropRate: 0.1, baseBuff: "+15% Semua Gaji", isDangerous: false },
  { id: "f19", name: "Naga Laut Megalodon Siber 🐉", basePrice: 3500000, tier: "👑 [MYTHIC]", weightKg: 450.0, dropRate: 0.05, baseBuff: "Dewa Laut! +25% Semua Gaji & Sewa", isDangerous: true },
  { id: "f_puyu", name: "Ikan Puyu Sawah 🐟", basePrice: 60, tier: "🌱 [COMMON]", weightKg: 0.2, dropRate: 20.0, baseBuff: "Gaji kerja +2%", isDangerous: false },
  { id: "f_haruan", name: "Ikan Haruan Penyembuh 🐟", basePrice: 180, tier: "🌿 [UNCOMMON]", weightKg: 1.5, dropRate: 12.0, baseBuff: "Kurang risiko lokap 5%", isDangerous: false },
  { id: "f_toman", name: "Toman Bunga Ganas 🐠", basePrice: 1200, tier: "⭐ [RARE]", weightKg: 4.5, dropRate: 6.0, baseBuff: "Gaji kerja +10%", isDangerous: false },
  { id: "f_kelah", name: "Kelah Merah Mahkota Sungai 🐡", basePrice: 15000, tier: "💼 [EPIC]", weightKg: 6.0, dropRate: 2.0, baseBuff: "Hasil kutipan sewa +12%", isDangerous: false },
  { id: "f_kelisa", name: "Kelisa Emas Arowana 🌟", basePrice: 85000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 2.5, dropRate: 0.8, baseBuff: "Loot rompakan PvP +15%", isDangerous: false },
  { id: "f_buaya", name: "Buaya Tembaga Sesat 🐊", basePrice: 120000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 250.0, dropRate: 0.5, baseBuff: "Kebal 20% rompak", isDangerous: true },
  { id: "f_naga", name: "Naga Tasik Chini 🐉", basePrice: 4000000, tier: "👑 [MYTHIC]", weightKg: 850.0, dropRate: 0.02, baseBuff: "Dewa Tasik! +25% Semua Gaji", isDangerous: true }
];

function generateFishInstance(rod) {
  let pool = FISH_DATABASE.map(f => ({ ...f, weight: f.isJunk && rod.luckBonus>1.5 ? 0 : f.dropRate * (f.isJunk?1:rod.luckBonus) }));
  let tot = pool.reduce((s, i) => s + i.weight, 0), r = Math.random() * tot, sel = pool[0];
  for (const f of pool) { if (r < f.weight) { sel = f; break; } r -= f.weight; }
  const sm = [{n:"Kecil 🐟", m:0.75}, {n:"Sederhana 🐠", m:1.0}, {n:"Besar 🐡", m:1.45}, {n:"Gergasi 🦈", m:2.2}]; 
  const c = sm[Math.floor(Math.random()*sm.length)];
  return { id: sel.id, name: `${sel.name} (${c.n})`, price: sel.isJunk?0:Math.floor(sel.basePrice*c.m), weightKg: Number((sel.weightKg*c.m).toFixed(1)), tier: sel.tier, isDangerous: sel.isDangerous, buff: sel.baseBuff };
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
  { id: "shadow_phone", name: "Shadow Legion X CyberDeck 🐺", price: 15000, bonus: "Gajet Ultimate Founder! +20% Lumba & Kerja, 50% Kebal Denda", perk: "god", val: 0.20 },
  { id: "vertu_sig", name: "Vertu Signature Cobra Sapphire 🐍", price: 50000, bonus: "Pendapatan sewa hartanah +25%", perk: "rent", val: 0.25 },
  { id: "solana_saga", name: "Solana Saga Genesis Crypto 🪙", price: 85000, bonus: "Keuntungan Kripto & Emas +15%", perk: "trade", val: 0.15 },
  { id: "caviar_gold", name: "Caviar Gold iPhone 24K Emas 👑", price: 140000, bonus: "Gaji kerja +35% & Kebal Rompak +10%", perk: "work", val: 0.35 },
  { id: "tonino_lambo", name: "Tonino Lamborghini 88 Tauri 🏎️", price: 220000, bonus: "Menang Drag Race +25%", perk: "race", val: 0.25 },
  { id: "crypto_node", name: "Satoshi Quantum CyberRig 💻", price: 500000, bonus: "Dividen bank +30%", perk: "bank", val: 0.30 },
  { id: "starlink_deck", name: "Starlink Orbital Satellite Rig 🛰️", price: 1200000, bonus: "Peluang godam bank naik +25%", perk: "crime", val: 0.25 },
  { id: "falcon_super", name: "Falcon SuperNova Pink Diamond 💎", price: 3500000, bonus: "Diskaun denda lokap 40%", perk: "def", val: 0.40 },
  { id: "neural_optic", name: "Neuralink Cyber-Cranial Device 🧠", price: 8000000, bonus: "Potong 25s semua cooldown RPG", perk: "cd", val: 25000 },
  { id: "quantum_prime", name: "Quantum Matrix Core OS 🌌", price: 20000000, bonus: "Menang Coinflip/Slot +15%", perk: "gamble", val: 0.15 },
  { id: "airi_chrono", name: "Airi Chrono Infinity Handheld 🔮", price: 50000000, bonus: "Gajet Dewa! +40% Semua Payout & Kebal 60% Denda", perk: "god", val: 0.40 }
];

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
// 🚀 6. ENJIN UTAMA (MEGA LOOP & EVENTS)
// =========================================================================
async function startBotEngine() {
  await initDB();
  const { state, saveCreds } = await useMultiFileAuthState("auth_session");
  const sock = makeWASocket({ auth: state, logger: pino({ level: "silent" }), browser: Browsers.macOS("Desktop"), printQRInTerminal: false });
  sock.ev.on("creds.update", saveCreds);

  let lastRandomEventTime = Date.now();
  setInterval(async () => {
    const db = loadDB(); const now = Date.now();

    // Lelang Misteri Tutup
    if (db.auction && db.auction.active && (now - db.auction.lastBidTime > 60000)) {
      db.auction.active = false;
      let pText = "🔔 *LELONGAN DIBATALKAN!*";
      if (db.auction.highestBidder) {
        const winner = getUser(db.auction.highestBidder); winner.cash += db.auction.rewardValue; updateUser(db.auction.highestBidder, winner);
        pText = `🔔 *LELONGAN DITUTUP!*\n\n🎉 Pemenang: *${winner.name}* (RM ${db.auction.highestBid.toLocaleString()})\n📦 Habuan: *${db.auction.rewardName}*\n💰 Untung Tunai: *+RM ${db.auction.rewardValue.toLocaleString()}*`;
      }
      db.auction = null; saveDB(db);
      if (db.groups[0]) await sock.sendMessage(db.groups[0], { text: pText }).catch(()=>{});
    }

    // 50 Random Events & Bidaan Trigger
    if (now - lastRandomEventTime >= 15 * 60 * 1000) {
      lastRandomEventTime = now;
      if (globalChatActivity >= 3 && db.groups.length > 0) {
        globalChatActivity = 0; const mainGroup = db.groups[0]; const chance = Math.random();
        
        if (chance < 0.2 && !db.auction) {
          const isT20 = Math.random() < 0.1; const startPrice = isT20 ? 100000 : 10000; const isScam = Math.random() < 0.5;
          const rwName = isT20 ? (isScam ? "Habuk Berasap 💨" : "Kunci Lamborghini 🏎️") : (isScam ? "Batu Bata 🧱" : "10 Jongkong Emas 🪙");
          const rwVal = isT20 ? (isScam ? 0 : 1500000) : (isScam ? 0 : 50000);
          db.auction = { active: true, highestBid: startPrice, highestBidder: null, lastBidTime: now, rewardName: rwName, rewardValue: rwVal }; saveDB(db);
          await sock.sendMessage(mainGroup, { text: `🚨 *LELONGAN KONTENA MISTERI!*\n\n💵 Tapak: *RM ${startPrice.toLocaleString()}*\n⏱️ Reset 60s setiap bidaan.\n👉 Taip: *.bida [harga]*` });
        } else if (chance < 0.7) {
          const activeIds = Object.keys(db.users);
          if (activeIds.length > 0) {
             const randomId = activeIds[Math.floor(Math.random() * activeIds.length)]; const u = db.users[randomId];
             const scenario = RANDOM_SCENARIOS[Math.floor(Math.random() * RANDOM_SCENARIOS.length)];
             const val = Math.floor(Math.random() * (scenario.max - scenario.min + 1)) + scenario.min;
             
             if (scenario.type === "win") {
               let finalVal = val; if (u.pet === "kucing_jalanan") finalVal = Math.floor(finalVal * 1.15);
               u.cash += finalVal; updateUser(randomId, u);
               await sock.sendMessage(mainGroup, { text: `🎁 *NASIB RAWAK!*\n\n*${u.name}*, ${scenario.msg.replace("{val}", finalVal.toLocaleString())}` });
             } else {
               u.cash = Math.max(0, u.cash - val); updateUser(randomId, u);
               await sock.sendMessage(mainGroup, { text: `💀 *BENCANA RAWAK!*\n\n*${u.name}*, ${scenario.msg.replace("{val}", val.toLocaleString())}` });
             }
          }
        }
      }
    }
  }, 5000);

  sock.ev.on("connection.update", (u) => {
    if (u.qr) { currentQR = u.qr; isConnected = false; }
    if (u.connection === "close") { isConnected = false; setTimeout(() => startBotEngine(), 5000); } 
    else if (u.connection === "open") { isConnected = true; currentQR = ""; console.log("✅ BOT AIRI V4.0 BERSAMBUNG!"); }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]; if (!m?.message) return;
    const from = m.key.remoteJid; if (from?.endsWith("@g.us")) { globalChatActivity++; const db = loadDB(); if (!db.groups.includes(from)) { db.groups.push(from); saveDB(db); } }
    const msgText = m.message.conversation || m.message.extendedTextMessage?.text || ""; if (!msgText.trim().startsWith(".")) return;

    const args = msgText.trim().slice(1).split(/ +/); const cmd = args.shift().toLowerCase();
    const sender = m.key.participant || from; const cleanSender = sender.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    const pushName = m.pushName || ""; const user = getUser(cleanSender, pushName); const now = Date.now();
    const isOwner = OWNER_NUMBERS.some(num => cleanSender.includes(num)) || user.isOwner;
    if (isOwner && !user.isOwner) { user.isOwner = true; updateUser(cleanSender, user); }
    const db = loadDB(); const currentEvent = db.active_event_data ? SEASON_EVENTS[db.active_event_data.type] : null;

    if (now < user.cooldowns.hospitalUntil && !isOwner) { return sock.sendMessage(from, { text: `🚑 Anda di hospital. Baki: ${Math.ceil((user.cooldowns.hospitalUntil - now)/1000)}s.` }); }
    if (now < user.cooldowns.jailUntil && !["upah_lawyer", "myid"].includes(cmd) && !isOwner) { return sock.sendMessage(from, { text: `🚨 Anda di lokap! Baki: ${Math.ceil((user.cooldowns.jailUntil - now)/1000)}s. (*.upah_lawyer*)` }); }

    // =====================================================================
    // 🎲 10 MINI-GAME KOMUNITI BAHARU (V4.0)
    // =====================================================================
    
    // 1. Gacha MLBB
    if (cmd === "gacha_mlbb") {
      if (user.cash < 2000) return sock.sendMessage(from, { text: `❌ Spin *Mobile Legends* perlukan RM 2,000!` });
      user.cash -= 2000;
      const rng = Math.random();
      let prize = 0; let msg = "";
      if (rng < 0.01) { prize = 25000; msg = `🌟 *LEGENDARY SKIN!* Dapat Franco Legend! (Jual: +RM 25,000)`; }
      else if (rng < 0.05) { prize = 8000; msg = `🔥 *EPIC SKIN!* Dapat Lancelot Dragon Tamer! (Jual: +RM 8,000)`; }
      else if (rng < 0.20) { prize = 2500; msg = `✨ *ELITE SKIN!* Boleh tahan la. (Jual: +RM 2,500)`; }
      else { prize = 0; msg = `🗑️ *MAGIC DUST x5!* Adoi rugi RM 2,000!`; }
      user.cash += prize; updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎮 *GACHA MLBB*\n\n${msg}` });
    }

    // 2. TikTok Affiliate
    if (cmd === "tiktok_affiliate") {
      if (user.cash < 500) return sock.sendMessage(from, { text: `❌ Perlu RM 500 modal marketing (Ads) TikTok.` });
      user.cash -= 500;
      const rng = Math.random();
      let untung = 0; let msg = "";
      if (rng < 0.05) { untung = 15000; msg = `🚀 *FYP MELETUP!* Produk anda masuk di bawah beg kuning Shadow.Legacy. Untung besar!`; }
      else if (rng < 0.15) { untung = 3000; msg = `🔥 *VIRAL!* Jualan masuk bertalu-talu.`; }
      else if (rng < 0.45) { untung = 600; msg = `👍 *BALIK MODAL.* Ada la sikit untung buat beli kopi.`; }
      else { untung = 0; msg = `📉 *FLOP.* View sendu 20 orang je. Modal RM 500 lebur.`; }
      user.cash += untung; updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `📱 *TIKTOK AFFILIATE*\n\n${msg}\n💵 Untung: +RM ${untung.toLocaleString()}` });
    }

    // 3. Sabung Ayam (PvE Bet)
    if (cmd === "sabung_ayam" || cmd === "ayam_sabung") {
      const choice = args[0]?.toLowerCase(); const bet = parseInt(args[1]);
      if (!["merah", "hitam"].includes(choice) || isNaN(bet) || bet <= 0 || user.cash < bet) return sock.sendMessage(from, { text: `🐔 Format: *.sabung_ayam [merah/hitam] [taruhan]*` });
      user.cash -= bet;
      const winner = Math.random() < 0.5 ? "merah" : "hitam";
      if (choice === winner) {
        user.cash += (bet * 2); updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🐔 *SABUNG AYAM*\n\nAyam ${winner.toUpperCase()} menang bertarung!\n💵 Anda menang: +RM ${(bet*2).toLocaleString()}!` });
      } else {
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🐔 *SABUNG AYAM*\n\nAyam ${winner.toUpperCase()} yang menang. Ayam ${choice.toUpperCase()} anda lari masuk reban!\n❌ Rugi: -RM ${bet.toLocaleString()}` });
      }
    }

    // 4. Teka Nombor
    if (cmd === "teka_nombor") {
      const guess = parseInt(args[0]); const bet = parseInt(args[1]);
      if (isNaN(guess) || guess < 1 || guess > 10 || isNaN(bet) || bet <= 0 || user.cash < bet) return sock.sendMessage(from, { text: `🔢 Format: *.teka_nombor [1-10] [taruhan]*` });
      user.cash -= bet;
      const result = Math.floor(Math.random() * 10) + 1;
      if (guess === result) {
        user.cash += (bet * 10); updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🎉 *JACKPOT TEKA NOMBOR!*\n\nNombor betul adalah ${result}! Anda menang 10X ganda!\n💵 +RM ${(bet*10).toLocaleString()}` });
      } else {
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `❌ *SALAH!* Nombor rahsia adalah ${result}. Wang taruhan RM ${bet.toLocaleString()} lebur.` });
      }
    }

    // 5. Kotak Beracun
    if (cmd === "kotak_beracun") {
      const pilihan = parseInt(args[0]);
      if (isNaN(pilihan) || pilihan < 1 || pilihan > 3) return sock.sendMessage(from, { text: `📦 Main Kotak Beracun (Modal: RM1000). Ada Bom, Kosong, & Emas!\nFormat: *.kotak_beracun [1/2/3]*` });
      if (user.cash < 1000) return sock.sendMessage(from, { text: `❌ Anda perlukan RM 1,000 untuk main!` });
      user.cash -= 1000;
      const hadiah = [ {n: "BOM! 💥", v: -5000}, {n: "Kosong 🕸️", v: 0}, {n: "Emas Tulen! 🪙", v: 10000} ].sort(() => Math.random() - 0.5);
      const nasib = hadiah[pilihan - 1];
      user.cash += nasib.v; 
      if (user.cash < 0) user.cash = 0;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `📦 *KOTAK BERACUN*\n\nAnda membuka Kotak ${pilihan} dan isinya ialah... *${nasib.n}*\n\n💸 Impak: ${nasib.v > 0 ? "+RM "+nasib.v : nasib.v < 0 ? "-RM "+Math.abs(nasib.v) : "Tiada rugi/untung"}` });
    }

    // 6. Tarik Tali (PvE)
    if (cmd === "tarik_tali") {
      const bet = parseInt(args[0]);
      if (isNaN(bet) || bet <= 0 || user.cash < bet) return sock.sendMessage(from, { text: `🪢 Lawan AI Tarik Tali! Format: *.tarik_tali [taruhan]*` });
      user.cash -= bet;
      const pStrength = Math.random() * 100; const botStrength = Math.random() * 100;
      if (pStrength > botStrength) {
        user.cash += (bet * 2); updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🪢 *TARIK TALI*\n\n💪 Kuasa Anda: ${pStrength.toFixed(1)} | Kuasa AI: ${botStrength.toFixed(1)}\n🎉 Anda menang dan tarik AI jatuh lumpur!\n💵 Menang: +RM ${(bet*2).toLocaleString()}` });
      } else {
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🪢 *TARIK TALI*\n\n💪 Kuasa Anda: ${pStrength.toFixed(1)} | Kuasa AI: ${botStrength.toFixed(1)}\n❌ Anda tersungkur ditarik AI! Rugi: RM ${bet.toLocaleString()}` });
      }
    }

    // 7. Batu Gunting Kertas
    if (cmd === "bgk") {
      const c = args[0]?.toLowerCase(); const bet = parseInt(args[1]);
      if (!["batu", "gunting", "kertas"].includes(c) || isNaN(bet) || bet <= 0 || user.cash < bet) return sock.sendMessage(from, { text: `✊🖐✌️ Format: *.bgk [batu/gunting/kertas] [taruhan]*` });
      user.cash -= bet;
      const pilihan = ["batu", "gunting", "kertas"]; const botC = pilihan[Math.floor(Math.random() * 3)];
      let res = ""; let p = 0;
      if (c === botC) { res = "SERI!"; p = bet; }
      else if ((c==="batu"&&botC==="gunting") || (c==="gunting"&&botC==="kertas") || (c==="kertas"&&botC==="batu")) { res = "MENANG!"; p = bet * 2; }
      else { res = "KALAH!"; p = 0; }
      user.cash += p; updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `✊🖐✌️ *OSOM!*\n\nAnda: ${c.toUpperCase()}\nAI: ${botC.toUpperCase()}\n\nKeputusan: *${res}*\n💸 ${p > 0 ? "+RM "+p : "-RM "+bet}` });
    }

    // 8. Tembak Botol
    if (cmd === "tembak_botol") {
      if (user.cash < 500) return sock.sendMessage(from, { text: `🎯 Modal tembak botol RM 500.` });
      user.cash -= 500;
      const rng = Math.random(); let msg = ""; let win = 0;
      if (rng < 0.05) { win = 5000; msg = `🎯 *HEADSHOT!* Semua botol pecah berderai!`; }
      else if (rng < 0.3) { win = 800; msg = `💥 Kena 2 botol. Not bad.`; }
      else if (rng < 0.6) { win = 200; msg = `😅 Kena 1 botol je. Rugi sikit.`; }
      else { win = 0; msg = `🤡 Tembak ke laut! Kosong.`; }
      user.cash += win; updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎯 *TEMBAK BOTOL PESTA*\n\n${msg}\n💵 Tunai diterima: RM ${win}` });
    }

    // 9. Lumba Kuda
    if (cmd === "lumba_kuda") {
      const k = parseInt(args[0]); const bet = parseInt(args[1]);
      if (isNaN(k) || k < 1 || k > 5 || isNaN(bet) || bet <= 0 || user.cash < bet) return sock.sendMessage(from, { text: `🐎 Format: *.lumba_kuda [1-5] [taruhan]*` });
      user.cash -= bet;
      const winner = Math.floor(Math.random() * 5) + 1;
      if (k === winner) {
        user.cash += (bet * 5); updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🐎 *LUMBA KUDA*\n\nKuda nombor ${winner} menang lumba lurus!\n💵 Hadiah 5X Ganda: +RM ${(bet*5).toLocaleString()}` });
      } else {
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🐎 *LUMBA KUDA*\n\nKuda nombor ${winner} yang menang. Kuda ${k} anda asyik makan rumput!\n❌ Lebur RM ${bet.toLocaleString()}` });
      }
    }

    // 10. Tikam Nombor Ekor (Lottery Segera)
    if (cmd === "tikam_nombor") {
      const num = parseInt(args[0]);
      if (isNaN(num) || num < 1 || num > 100) return sock.sendMessage(from, { text: `🎫 Tiket loteri bernilai RM 1000! Boleh menang RM 100,000.\nFormat: *.tikam_nombor [1-100]*` });
      if (user.cash < 1000) return sock.sendMessage(from, { text: `❌ Anda tak cukup RM 1000 untuk beli tiket.` });
      user.cash -= 1000;
      const rng = Math.floor(Math.random() * 100) + 1;
      if (num === rng) {
        user.cash += 100000; updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🎫 *CABUTAN TIKET BERTUAH*\n\nNombor anda: ${num} | Cabutan: ${rng}\n🎉 *JACKPOT GILA!* Anda menang +RM 100,000!` });
      } else {
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🎫 *CABUTAN TIKET BERTUAH*\n\nNombor anda: ${num} | Cabutan: ${rng}\n❌ Nasib tak menyebelahi anda.` });
      }
    }

    // =====================================================================
    // 🛒 SISTEM PASARAN PEMAIN (P2P MARKETPLACE V4.0)
    // =====================================================================
    if (cmd === "jual_market") {
      const type = args[0]?.toLowerCase(); const itemId = args[1]?.toLowerCase(); const price = parseInt(args[2]);
      if (!["kenderaan", "bm"].includes(type) || !itemId || isNaN(price) || price <= 0) return sock.sendMessage(from, { text: `❌ Format: *.jual_market [kenderaan/bm] [kod_item] [harga_jual]*` });
      
      let itemName = ""; let actualItem = null;
      if (type === "kenderaan") {
         if (!user.vehicles.includes(itemId)) return sock.sendMessage(from, { text: `❌ Kenderaan tiada dalam garaj!` });
         actualItem = VEHICLES.find(v => v.id === itemId); itemName = actualItem.name;
         user.vehicles = user.vehicles.filter(v => v !== itemId);
      } else {
         const idx = user.inventory.findIndex(i => i.id == itemId);
         if (idx === -1) return sock.sendMessage(from, { text: `❌ Barang tiada dalam beg!` });
         itemName = user.inventory[idx].name; user.inventory.splice(idx, 1);
      }

      const listingId = Math.random().toString(36).substring(2, 7).toUpperCase();
      if (!db.p2pMarket) db.p2pMarket = [];
      db.p2pMarket.push({ listId: listingId, sellerId: cleanSender, sellerName: user.name, type: type, itemId: itemId, itemName: itemName, price: price });
      saveDB(db); updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `✅ *[P2P]* ${itemName} berjaya disenaraikan di Pasaran Lelongan!\n🔖 Kod Listing: *${listingId}* | Harga: RM ${price.toLocaleString()}` });
    }

    if (cmd === "pasar_pemain" || cmd === "p2p") {
      if (!db.p2pMarket || db.p2pMarket.length === 0) return sock.sendMessage(from, { text: `🛒 Pasaran P2P sunyi sepi... Tiada pemain yang menjual barang.` });
      let ui = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🛒 PASARAN LELONGAN PEMAIN (P2P)\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
      db.p2pMarket.forEach(m => { ui += `🔖 *[${m.listId}]* ${m.itemName}\n👤 Penjual: ${m.sellerName}\n💰 Harga: RM ${m.price.toLocaleString()}\n\n`; });
      ui += `👉 Beli: *.beli_market [Kod_Listing]*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_market") {
      const listId = args[0]?.toUpperCase();
      if (!listId || !db.p2pMarket) return sock.sendMessage(from, { text: `❌ Masukkan Kod Listing dari *.pasar_pemain*!` });
      const itemIdx = db.p2pMarket.findIndex(m => m.listId === listId);
      if (itemIdx === -1) return sock.sendMessage(from, { text: `❌ Kod Listing tidak wujud atau telah dibeli orang lain.` });
      
      const itemData = db.p2pMarket[itemIdx];
      if (itemData.sellerId === cleanSender) return sock.sendMessage(from, { text: `❌ Takkan nak beli barang sendiri bos?` });
      if (user.cash < itemData.price) return sock.sendMessage(from, { text: `❌ Duit tunai poket tak cukup!` });

      // Transfer item
      if (itemData.type === "kenderaan") user.vehicles.push(itemData.itemId);
      else user.inventory.push({ id: itemData.itemId, name: itemData.itemName });
      
      // Transfer money
      user.cash -= itemData.price;
      const seller = getUser(itemData.sellerId); seller.cash += itemData.price;
      
      db.p2pMarket.splice(itemIdx, 1);
      saveDB(db); updateUser(cleanSender, user); updateUser(itemData.sellerId, seller);
      
      return sock.sendMessage(from, { text: `🤝 *TRANSAKSI P2P BERJAYA!*\n\nAnda membeli *${itemData.itemName}* dengan harga RM ${itemData.price.toLocaleString()}.\nWang telah dipindahkan ke *${seller.name}*.` });
    }

    // =====================================================================
    // VETO COMMANDS & FIXES
    // =====================================================================
    if (cmd === "set_market" && isOwner) {
      const type = args[0]?.toLowerCase(); const price = parseInt(args[1]);
      if (!type || !["gold", "btc", "emas", "scrap"].includes(type) || isNaN(price) || price <= 0) return sock.sendMessage(from, { text: `❌ Format: *.set_market [gold/btc/scrap] [harga]*` });
      if (type === "gold" || type === "emas") db.market.gold = price;
      if (type === "btc") db.market.btc = price;
      if (type === "scrap") db.market.scrap = price;
      db.market.lastUpdate = now; saveDB(db);
      return sock.sendMessage(from, { text: `👑 Veto Bursa: Harga ${type.toUpperCase()} diubah ke RM ${price.toLocaleString()}!` });
    }

    if (cmd === "start_event" && isOwner) {
      const evType = args[0]?.toUpperCase(); const days = parseInt(args[1]) || 3;
      if (!evType || !SEASON_EVENTS[evType]) return sock.sendMessage(from, { text: `❌ Event tak sah. Guna *.list_event*` });
      db.active_event_data = { type: evType, end: now + (days * 24 * 3600 * 1000) }; saveDB(db);
      return sock.sendMessage(from, { text: `👑 Veto: Acara *${evType}* diaktifkan selama ${days} hari!` });
    }
    
    if (cmd === "list_event" && isOwner) {
      let ui = `╔═══════════════════════════╗\n   📜 KOD EVENT MUSIM (40)\n╚═══════════════════════════╝\n`;
      for (let key in SEASON_EVENTS) { ui += `• *${key}*\n  _${SEASON_EVENTS[key].name}_\n\n`; }
      return sock.sendMessage(from, { text: ui });
    }

    // =====================================================================
    // MEMANCING (FIX PENDING FISH BUG)
    // =====================================================================
    if (cmd === "mancing" || cmd === "fish") {
      const userReel = FISHING_SHOP.reels.find(r => r.id === user.fishingGear?.reel) || FISHING_SHOP.reels[0];
      if (now < user.cooldowns.fish && !isOwner) return sock.sendMessage(from, { text: `🎣 Sabar, tunggu ${Math.ceil((user.cooldowns.fish-now)/1000)}s.` });
      
      const userRod = FISHING_SHOP.rods.find(r => r.id === user.fishingGear?.rod) || FISHING_SHOP.rods[0];
      user.cooldowns.fish = now + Math.max(15000, 60000 - userReel.cdReduction);
      let caught = generateFishInstance(userRod);

      if (caught.isDangerous && Math.random() < 0.35) {
        user.cooldowns.hospitalUntil = now + (300 * 1000); user.cash = Math.max(0, user.cash - 1500); updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 *TRAGEDI JETI!*\n\n${caught.name} menyerang anda!\n🚑 Masuk Wad (5 min).\n💸 Bil: *-RM 1,500*` });
      }

      let fPrice = caught.price;
      const userBait = FISHING_SHOP.baits.find(b => b.id === user.fishingGear?.bait);
      if (userBait && fPrice > 0) fPrice = Math.floor(fPrice * userBait.priceMult);
      if (currentEvent?.fishMult) fPrice = Math.floor(fPrice * currentEvent.fishMult);
      caught.price = fPrice;

      db.pendingFish = db.pendingFish || {}; db.pendingFish[cleanSender] = { fish: caught, finalPrice: fPrice };
      saveDB(db); updateUser(cleanSender, user);

      if (fPrice === 0) {
        delete db.pendingFish[cleanSender]; saveDB(db);
        return sock.sendMessage(from, { text: `🎣 ${caught.name} ditarik. (Sampah dibuang balik)` });
      }

      return sock.sendMessage(from, { text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   🎣 TANGKAPAN BERJAYA!\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n🐟 Hasil: *${caught.name}*\n⚖️ Berat: *${caught.weightKg} kg*\n💰 Nilai: *RM ${fPrice.toLocaleString()}*\n✨ Buff: _${caught.buff}_\n\n👉 Taip: *.jual_ikan* ATAU *.bela_ikan*` });
    }

    if (cmd === "jual_ikan") {
      const pData = db.pendingFish?.[cleanSender];
      if (!pData) return sock.sendMessage(from, { text: `❌ Tiada ikan menunggu. Taip *.mancing*` });
      user.cash += pData.finalPrice; user.stats.fishes++; delete db.pendingFish[cleanSender];
      saveDB(db); updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `💵 *IKAN DIJUAL:* +RM ${pData.finalPrice.toLocaleString()}` });
    }

    // =====================================================================
    // MAGNET FISHING & AI GROQ
    // =====================================================================
    if (cmd === "baling_magnet") {
      if (!user.magnetGear.magnet) return sock.sendMessage(from, { text: `❌ Anda tiada magnet! Beli di *.kedai_magnet*` });
      if (now < user.cooldowns.magnet && !isOwner) return sock.sendMessage(from, { text: `⏳ Lenguh! Tunggu ${Math.ceil((user.cooldowns.magnet-now)/1000)}s.` });
      user.cooldowns.magnet = now + 45000;
      const mag = MAGNET_SHOP.find(m => m.id === user.magnetGear.magnet);
      const kg = (Math.floor(Math.random() * 5) + 1) * mag.pullPower; user.scrapMetalKg += kg;
      let ex = ""; if (Math.random() < mag.pullPower * 0.02) {
         const loot = [...MAGNET_LOOT].sort(() => 0.5 - Math.random())[0];
         if (loot.type === "box") { user.misteryBoxes++; ex = `\n🎁 *RARE PULL!* Dapat Peti Misteri! (*.buka_peti*)`; }
         else { user.cash += loot.price; ex = `\n💎 *JACKPOT!* Jumpa *${loot.name}* (RM ${loot.price.toLocaleString()})!`; }
      }
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🧲 *TARIKAN BERJAYA!*\n⚙️ Besi Buruk: +${kg} KG (Total: ${user.scrapMetalKg} KG)${ex}\n💡 *.jual_besi* untuk tunai.` });
    }

    if (cmd === "airi" || cmd === "ai") {
      const query = args.join(" ").trim();
      if (!query) return sock.sendMessage(from, { text: `Hai ${user.name}! 💙 Airi ada kat sini~ Taip: *.airi [borak]*` });
      if (now < (user.cooldowns.aiAsk || 0) && !isOwner) return sock.sendMessage(from, { text: `⏳ Sabar, otak Llama 3 tengah berasap!` });
      user.cooldowns.aiAsk = now + 8000; updateUser(cleanSender, user);
      const reply = await askAiriAI(query, user.name);
      return sock.sendMessage(from, { text: `💠 *AIRI (Groq LPU)* 💠\n\n${reply}` });
    }

    // =====================================================================
    // KERJA, ROMPAK, HACK & BASIC
    // =====================================================================
    if (cmd === "kerja" || cmd === "work") {
      if (now < user.cooldowns.work && !isOwner) return sock.sendMessage(from, { text: `⚠️ Shift belum mula! Baki: ${Math.ceil((user.cooldowns.work-now)/1000)}s` });
      const job = JOBS[Math.floor(Math.random() * JOBS.length)];
      let pay = Math.floor(Math.random() * (job.maxPay - job.minPay + 1)) + job.minPay;
      if (currentEvent?.jobMult) pay = Math.floor(pay * currentEvent.jobMult);
      user.cash += pay; user.stats.works++; user.cooldowns.work = now + 30000; updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `💼 *SLIP GAJI*\n🏢 Tugas: ${job.name}\n💵 Upah: +RM ${pay.toLocaleString()}` });
    }

    if (cmd === "balance" || cmd === "bal") {
      return sock.sendMessage(from, { text: `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n   💳 AKAUN: @${user.name}\n┣━━━━━━━━━━━━━━━━━━━━━━━━━━┫\n💼 Tunai : RM ${user.cash.toLocaleString()}\n🏦 Bank  : RM ${user.bank.toLocaleString()}\n🪙 Emas  : ${user.goldGrams}g\n₿ Kripto: ${user.btcUnits} BTC\n📦 Besi  : ${user.scrapMetalKg} kg\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛` });
    }

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
• .beli_emas, .jual_emas, .beli_btc
• .jual_besi

🎣 *[5. JETI & MAGNET]*
• .kedai_pancing, .beli_pancing [id]
• .mancing, .jual_ikan, .bela_ikan
• .kedai_magnet, .beli_magnet [id]
• .baling_magnet, .buka_peti

🏴‍☠️ *[6. UNDERWORLD]*
• .bm, .beli_bm, .jenayah, .buat_jenayah
• .rompak @user, .hackbank @user

🏎️ *[7. ASET & GARAJ]*
• .showroom 1, .beli_kenderaan [id]
• .lumba, .list_hartanah, .kutip_sewa
• .profile, .myid, .balance`;
      return sock.sendMessage(from, { text: menuText });
    }
  });
}

startBotEngine().catch(e => console.error(e));
