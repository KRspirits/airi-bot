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
import { GoogleGenerativeAI } from "@google/generative-ai";
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

// =========================================================================
// 🤖 1. ENJIN AI SHADOW AIRI (GOOGLE GEMINI 2.5 FLASH)
// =========================================================================
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "AQ.Ab8RN6L93ijIy-kYAJuvFh0DoaG9rL0PBmGgmkt3-l7JLz4PGA").trim();
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function askAiriAI(promptText, userName = "Warga Cyber") {
  try {
    const currentTimeMY = new Date().toLocaleString("ms-MY", { 
      timeZone: "Asia/Kuala_Lumpur", 
      dateStyle: "full", 
      timeStyle: "medium" 
    });

    const systemInstruction = `
Nama kau ialah Airi, maskot AI dan pembantu pintar rasmi bagi komuniti siber "Airi's Corner".
Pengasas dan ketua mutlak kau ialah Bos Amar (Shadow Legacy).
Waktu dan Tarikh Semasa di Malaysia (MYT): ${currentTimeMY}

Personaliti:
- Sangat periang, ceria, comel, bertenaga, suka guna bahasa santai Melayu (contoh: "hehe~", "jap jap", "uwu", "fuhh", "jangan risau!").
- Bantu jawab soalan waktu/jam, teknologi, sains, koding, matematik, nasihat hidup, fakta am, kuiz, atau sembang santai dengan tepat.
- Panggil pengguna dengan nama mereka (${userName}) atau "Awak/Korang".
- Jawab secara padat, jelas dan tidak terlalu meleret (maksimum 2-3 perenggan).
- Terus berikan jawapan perbualan tanpa meletakkan sebarang nota proses berfikir atau nama enjin luar.
`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 400
      }
    });

    const response = await result.response;
    return response.text()?.trim() || "Airi dengar! Tapi tak pasti nak jawab macam mana tadi hehe~ 💙";
  } catch (err) {
    console.error("⚠️ Ralat AI:", err?.message || err);
    return "Aduh... modul neural Airi tengah recharge sekejap hehe~ 🧠 Cuba tanya sekali lagi jap lagi ya!";
  }
}

// =========================================================================
// 💬 2. BANK VARIASI AYAT NARRATIVE RPG (HANYA UNTUK JENAYAH & LUMBA)
// =========================================================================
const NARRATIVE_BANKS = {
  RACE_WIN: [
    "Asap ekzos tinggal kat belakang, jentera meluncur laju macam peluru pandu!",
    "Pecutan sempurna di garisan penamat! Lawan terus termenung hisap asap tayar!",
    "Enjin ngaum sampai litar bergegar, trofi juara drag sah milik kau harini!",
    "Talaan ECU mantap tak sia-sia, potong lawan masa gear 4 macam angin lalu!",
    "Terkebil-kebil pihak lawan nampak lampu belakang jentera kau lesap di kejauhan!",
    "Shift gear padu tanpa slip! Kemenangan mutlak di atas tar jalanan malam ini."
  ],
  RACE_CRASH: [
    "Adoi oversteer teruk dekat selekoh, jentera terus cium divider jalan raya!",
    "Enjin panas mendidih sampai keluar asap putih, mekanik dah standby resit baiki!",
    "Terlalu yakin masa tekan minyak, sekali tayar hilang grip terus spin 360 darjah!",
    "Tergolek tepi longkang litar! Nasib baik nyawa selamat, cuma dompet kena bayar towing."
  ],
  CRIME_SUCCESS: [
    "Langkah licik macam bayang-bayang malam, hasil rompakan berjaya disorok kemas!",
    "Siren polis berbunyi jauh di belakang, kau dah santai minum kopi kira duit tebal!",
    "Misi rompakan berjalan lancar ikut pelan tanpa tinggalkan walau satu cap jari pun!",
    "CCTV berjaya digodam, barang bernilai lesap tanpa ada sesiapa yang perasan hehe~!"
  ],
  CRIME_BUSTED: [
    "Baru nak pegang pemegang pintu, sekali lampu siren biru-merah suluh muka!",
    "Kantoi basah di tempat kejadian! Tangan dah kena gari besi lokap balai.",
    "Penggera keselamatan memekak satu blok, tak sempat lari terus kena kepung!",
    "Polis peronda dah tunggu depan pintu keluar dengan senyuman sinis adeh!"
  ],
  BANK_HACK_SUCCESS: [
    "Firewall bank runtuh sekelip mata, baki akaun sasaran terus mengalir masuk poket!",
    "Serangan siber zero-day berjaya! Sistem pangkalan data bank mangsa lompang habis.",
    "Decrypter berfungsi sempurna, duit simpanan bank mangsa disedut tanpa belas kasihan!"
  ],
  ROB_SUCCESS: [
    "Acukan tepat sasaran, mangsa gigil serah semua tunai poket tanpa banyak soal!",
    "Rembatan pantas di lorong gelap! Dompet mangsa licin disapu bersih tanpa sisa.",
    "Mangsa tergamam tak sempat buat apa-apa, duit dalam poket selamat berpindah tuan!"
  ],
  ROB_FAIL_ROAST: [
    "Niat nak merompak tapi tangan gigil sampai dompet sendiri jatuh tercicir depan mangsa!",
    "Belum sempat acah hero, mangsa dah jerit panggil polis satu kampung kejar kau!",
    "Terpijak kulit pisang masa nak samun, terus terlentang kena gelak dengan mangsa adeh!"
  ],
  PET_DEFEND: [
    "Pengawal haiwan melompat terkam perompak sampai koyak seluar lari lintang pukang!",
    "Anjing pengawal menyalak garang dan gigit betis musuh sampai merayu minta nyawa!",
    "Dron AI sentry memancarkan laser renjatan elektrik, perompak terus kejung atas tar!"
  ],
  LHDN_TAX: [
    "Pegawai audit LHDN menyerbu premis dan menyita wang tunai tidak berisytihar!",
    "Surat kuning LHDN sampai ke rumah, cukai pendapatan tertunggak dipotong terus!"
  ],
  RANSOMWARE_ATTACK: [
    "Virus trojan menyulitkan fail sistem peranti, wang tebusan siber disedut paksa!",
    "Skrin peranti terkunci merah dengan teks tebusan, duit poket lesap ditelan penggodam!"
  ],
  AES_SPEED_FINE: [
    "Kamera AES lebuhraya merakam jentera memecut laju melebihi had laju kebangsaan!",
    "Flash kamera perangkap kelajuan menyala terang di highway, saman terus masuk!"
  ],
  AIRDROP_CLAIM: [
    "Merampas peti airdrop sepantas kilat sebelum sempat pemain lain berkelip mata!",
    "Kepantasan jari menaip kod akses mengunci peti kargo tunai ke dalam dompet!"
  ]
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
    res.end(`
      <div style="text-align:center;margin-top:60px;font-family:'Segoe UI',sans-serif;background:#0f172a;color:#f8fafc;padding:30px;min-height:85vh;">
        <h1 style="color:#22c55e;font-size:2.5rem;">⚡ AIRI'S CORNER CYBER OS ONLINE! ⚡</h1>
        <p style="color:#94a3b8;font-size:1.2rem;">Sistem WhatsApp RPG & Enjin Shadow Airi 24/7 aktif.</p>
        <div style="display:inline-block;margin-top:20px;padding:12px 24px;background:#1e293b;border-radius:8px;border:1px solid #334155;">
          👑 <b>Founder:</b> Bos Amar (Auto-Veto Active)
        </div>
      </div>
    `);
  } else if (currentQR) {
    QRCode.toDataURL(currentQR).then(img => {
      res.end(`
        <div style="text-align:center;margin-top:40px;font-family:'Segoe UI',sans-serif;background:#0a0f1d;color:#ffffff;padding:25px;min-height:90vh;">
          <h1 style="color:#38bdf8;letter-spacing:1px;">⚡ IMBAS KOD QR AIRI'S CORNER ⚡</h1>
          <p style="color:#94a3b8;">Buka WhatsApp > Peranti Terpaut > Imbas QR di bawah:</p>
          <div style="margin:25px auto;display:inline-block;padding:16px;background:#ffffff;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
            <img src="${img}" style="width:280px;height:280px;display:block;" alt="WhatsApp QR Code"/>
          </div>
        </div>
      `);
    }).catch(e => res.end("Ralat QR: " + e.message));
  } else {
    res.end(`
      <div style="text-align:center;margin-top:80px;font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:30px;">
        <h2>⏳ Menjana Kod QR WhatsApp... Sila refresh laman web ini sebentar lagi.</h2>
      </div>
    `);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Server aktif pada port ${PORT}`);
});

// =========================================================================
// 💾 4. SISTEM DATABASE JSON
// =========================================================================
const DB_FILE = "./database.json";
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initData = { 
      users: {}, 
      groups: [], 
      activeEvents: {}, 
      activeHacks: {}, 
      pendingFish: {},
      bounties: {},
      hallOfFame: [],
      market: { gold: 350, btc: 280000, lastUpdate: Date.now() },
      season: 1, 
      active_event_data: null 
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 2));
    return initData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    const fallbackData = { 
      users: {}, 
      groups: [], 
      activeEvents: {}, 
      activeHacks: {}, 
      pendingFish: {},
      bounties: {},
      hallOfFame: [],
      market: { gold: 350, btc: 280000, lastUpdate: Date.now() },
      season: 1, 
      active_event_data: null 
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallbackData, null, 2));
    return fallbackData;
  }
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("⚠️ Gagal menyimpan pangkalan data:", err.message);
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
      phoneName: "Public Phone Awam 📟",
      fishingGear: { rod: "rod_buluh", reel: "reel_plastik", bait: null, tank: "tank_balang" },
      inventory: [], vehicles: [], vehicleMods: {}, nosStock: {}, food: [], properties: [], pet: null, aquarium: [], stars: 0,
      badges: ["🌱 [COMMON] Warga Baru"],
      stats: { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0, bankHacks: 0 },
      cooldowns: { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, rent: 0, bankHack: 0, aiAsk: 0 }
    };
    saveDB(db);
  }
  const u = db.users[userId];
  if (pushName && pushName !== "Warga Cyber" && u.name !== pushName) {
    u.name = pushName; saveDB(db);
  }
  if (u.goldGrams === undefined) u.goldGrams = 0;
  if (u.btcUnits === undefined) u.btcUnits = 0;
  if (!u.fishingGear) u.fishingGear = { rod: "rod_buluh", reel: "reel_plastik", bait: null, tank: "tank_balang" };
  if (!u.inventory) u.inventory = [];
  if (!u.vehicles) u.vehicles = [];
  if (!u.vehicleMods) u.vehicleMods = {};
  if (!u.nosStock) u.nosStock = {};
  if (!u.food) u.food = [];
  if (!u.properties) u.properties = [];
  if (!u.aquarium) u.aquarium = [];
  if (!u.badges) u.badges = ["🌱 [COMMON] Warga Baru"];
  if (!u.stats) u.stats = { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0, bankHacks: 0 };
  if (!u.cooldowns) u.cooldowns = { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, rent: 0, bankHack: 0, aiAsk: 0 };
  
  // FIX PET STRING vs OBJECT (Legacy Cleanup)
  if (u.pet && typeof u.pet === 'object' && u.pet.id) {
    u.pet = u.pet.id;
    saveDB(db);
  }
  
  return u;
}

function updateUser(userId, userData) {
  const db = loadDB();
  db.users[userId] = userData;
  saveDB(db);
}

// =========================================================================
// 📈 5. UPDATE PASARAN EMAS & BITCOIN SETIAP 10 MINIT
// =========================================================================
setInterval(() => {
  const db = loadDB();
  if (!db.market) db.market = { gold: 350, btc: 280000, lastUpdate: Date.now() };

  const goldChange = (Math.random() * 0.12) - 0.05;
  db.market.gold = Math.max(150, Math.floor(db.market.gold * (1 + goldChange)));

  const btcChange = (Math.random() * 0.27) - 0.12;
  db.market.btc = Math.max(80000, Math.floor(db.market.btc * (1 + btcChange)));

  db.market.lastUpdate = Date.now();
  saveDB(db);
}, 10 * 60 * 1000);

// =========================================================================
// 🌟 6. SISTEM 10 SEASON EVENTS
// =========================================================================
const SEASON_EVENTS = {
  "CRIME_BOOM": { name: "🔥 Musim Jenayah Gila", desc: "Loot jenayah naik 2x ganda, tempoh lokap 2x lama!", rewardMult: 2.0, jailMult: 2.0, fineMult: 1.2, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "TECH_SURGE": { name: "💻 Musim Revolusi Siber", desc: "Diskaun Black Market 40%, godam bank lebih pantas!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, hackBoost: 0.20 },
  "ECONOMIC_CRASH": { name: "📉 Musim Kemelesetan Ekonomi", desc: "Gaji kerja halal naik 2x ganda, denda mahkamah 2x!", rewardMult: 0.8, jailMult: 1.2, fineMult: 2.0, jobMult: 2.0, fishMult: 1.0, rentMult: 0.8 },
  "POLICE_CRACKDOWN": { name: "🚔 Musim Ops Cantas Bukit Aman", desc: "Loot jenayah 3x ganda, denda polis 3x ganda jika kantoi!", rewardMult: 3.0, jailMult: 1.5, fineMult: 3.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0 },
  "GOLD_RUSH": { name: "💰 Musim Gelombang Emas", desc: "Harga jualan ikan pancing naik 2x & hasil kutipan sewa 2x!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.2, fishMult: 2.0, rentMult: 2.0 },
  "UNDERGROUND_RACING": { name: "🏁 Musim Pelesit Litar Malam", desc: "Hadiah drag race naik 2.5x ganda!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, raceMult: 2.5 },
  "INFLATION_SPIKE": { name: "💸 Musim Inflasi Melampau", desc: "Semua barang kedai mahal, tapi elaun harian & zakat naik 3x!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.5, jobMult: 1.5, fishMult: 1.5, rentMult: 1.5 },
  "CYBER_ANARCHY": { name: "🏴‍☠️ Musim Anarki Darkweb", desc: "Rompakan PvP sedut 40% tunai poket, bunga Ah Long 40%!", rewardMult: 1.5, jailMult: 0.8, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 1.0, pvpSteal: 0.40 },
  "MEGA_HARVEST": { name: "🌊 Musim Badai Laut Dalam", desc: "Peluang dapat ikan Mythic & Epic melonjak naik 3x ganda!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 2.5, rentMult: 1.0 },
  "TYCOON_PARADISE": { name: "🏰 Musim Monopoli Taikun", desc: "Kutipan dividen sewaan hartanah 3x ganda!", rewardMult: 1.0, jailMult: 1.0, fineMult: 1.0, jobMult: 1.0, fishMult: 1.0, rentMult: 3.0 }
};

// =========================================================================
// 🎣 7. KEDAI PERALATAN MEMANCING
// =========================================================================
const FISHING_SHOP = {
  rods: [
    { id: "rod_buluh", name: "Joran Buluh Kampung 🎋", price: 0, luckBonus: 1.0, desc: "Joran asas permulaan" },
    { id: "rod_fiber", name: "Joran Fiberglass Shimano 🎣", price: 1500, luckBonus: 1.3, desc: "+30% peluang dapat ikan Rare & atas" },
    { id: "rod_carbon", name: "Joran Carbon Graphite Pro ⚡", price: 8000, luckBonus: 1.8, desc: "+80% peluang dapat ikan Epic & ke atas" },
    { id: "rod_titanium", name: "Joran Titanium Deepsea 🌊", price: 35000, luckBonus: 2.5, desc: "+150% peluang tangkap ikan Legendary" },
    { id: "rod_mythic", name: "Joran Poseidon Cyber-Orbital 🔱", price: 150000, luckBonus: 4.0, desc: "Raja Laut! 4x ganda peluang ikan Mythic & sifar sampah!" }
  ],
  reels: [
    { id: "reel_plastik", name: "Kekili Plastik Biasa ⚙️", price: 0, cdReduction: 0, desc: "Cooldown standard (60 Saat)" },
    { id: "reel_bearing", name: "Kekili Daiwa 5-Ball Bearing 🟡", price: 1200, cdReduction: 10000, desc: "Potong 10s cooldown" },
    { id: "reel_magsealed", name: "Kekili MagSealed High-Speed ⚡", price: 6500, cdReduction: 20000, desc: "Potong 20s cooldown" },
    { id: "reel_electric", name: "Kekili Elektrik Jigging Bionik 🔋", price: 25000, cdReduction: 30000, desc: "Potong 30s cooldown" },
    { id: "reel_quantum", name: "Kekili Quantum Turbo Spinner 🌌", price: 90000, cdReduction: 40000, desc: "Pantas kilat! Potong 40s cooldown" }
  ],
  baits: [
    { id: "umpan_cacing", name: "Umpan Cacing Tanah Segar 🪱", price: 200, priceMult: 1.2, desc: "+20% nilai sebut harga jualan ikan" },
    { id: "umpan_udang", name: "Umpan Udang Peram Bau Padu 🦐", price: 800, priceMult: 1.5, desc: "+50% nilai sebut harga jualan ikan" },
    { id: "umpan_cyber", name: "Umpan Sintetik Feromon AI 🧪", price: 3000, priceMult: 2.2, desc: "+120% nilai sebut harga & memikat ikan monster" },
    { id: "umpan_plasma", name: "Umpan Plasma Neon Luminescence 🌟", price: 10000, priceMult: 3.5, desc: "3.5x ganda nilai harga ikan!" }
  ],
  tanks: [
    { id: "tank_balang", name: "Balang Kaca Meja 🫙", price: 0, capacity: 3, desc: "Muat sehingga 3 ekor ikan" },
    { id: "tank_2kaki", name: "Akuarium Kaca 2 Kaki 🐠", price: 3000, capacity: 8, desc: "Muat sehingga 8 ekor ikan" },
    { id: "tank_4kaki", name: "Akuarium Kabinet 4 Kaki Mewah 🏛️", price: 15000, capacity: 18, desc: "Muat sehingga 18 ekor ikan" },
    { id: "tank_kolam", name: "Kolam Simen Landskap VIP 🏞️", price: 65000, capacity: 40, desc: "Muat sehingga 40 ekor ikan" },
    { id: "tank_oceanarium", name: "Terowong Oceanarium Cyber 🌌", price: 250000, capacity: 100, desc: "Kapasiti Mega Taikun: 100 ekor ikan!" }
  ]
};

// =========================================================================
// 🐟 8. PANGKALAN DATA IKAN (FIXED: DROP RATE & BERAT KG ASING - NERFED)
// =========================================================================
const FISH_DATABASE = [
  { id: "f1", name: "Kasut But Getah Koyak 🥾", basePrice: 0, tier: "🗑️ [JUNK]", weightKg: 1.2, dropRate: 15.0, baseBuff: "Tiada buff", isJunk: true },
  { id: "f2", name: "Tayar Kereta Buruk Berlumut 🛞", basePrice: 0, tier: "🗑️ [JUNK]", weightKg: 8.5, dropRate: 10.0, baseBuff: "Tiada buff", isJunk: true },
  { id: "f3", name: "Ikan Kembung Segar Pasar 🐟", basePrice: 25, tier: "🌱 [COMMON]", weightKg: 0.4, dropRate: 20.0, baseBuff: "Gaji kerja +2%" },
  { id: "f4", name: "Ikan Gelama Muara 🐟", basePrice: 40, tier: "🌱 [COMMON]", weightKg: 0.6, dropRate: 18.0, baseBuff: "Gaji kerja +3%" },
  { id: "f5", name: "Ikan Keli Afrika Bersaiz L 🐡", basePrice: 65, tier: "🌱 [COMMON]", weightKg: 2.1, dropRate: 15.0, baseBuff: "Potong 5s cooldown kerja" },
  { id: "f6", name: "Udang Galah Sungai Bernilai 🦐", basePrice: 120, tier: "🌿 [UNCOMMON]", weightKg: 0.8, dropRate: 12.0, baseBuff: "Gaji kerja +5%" },
  { id: "f7", name: "Sotong Kurita Mini 🐙", basePrice: 250, tier: "🌿 [UNCOMMON]", weightKg: 1.5, dropRate: 10.0, baseBuff: "Menang Drag Race +3%" },
  { id: "f8", name: "Ketam Bunga Segar 🦀", basePrice: 350, tier: "🌿 [UNCOMMON]", weightKg: 0.9, dropRate: 9.0, baseBuff: "Potong 8s cooldown kerja" },
  { id: "f9", name: "Ikan Siakap Muara Padu 🐠", basePrice: 600, tier: "⭐ [RARE]", weightKg: 3.8, dropRate: 6.0, baseBuff: "Gaji kerja +8%" },
  { id: "f10", name: "Ikan Jenahak Merah Laut Dalam 🐡", basePrice: 900, tier: "⭐ [RARE]", weightKg: 5.2, dropRate: 5.0, baseBuff: "Diskaun denda lokap 10%" },
  { id: "f11", name: "Pari Gergasi Layang-Layang 🦈", basePrice: 1200, tier: "⭐ [RARE]", weightKg: 14.5, dropRate: 4.0, baseBuff: "Menang Drag Race +6%" },
  { id: "f12", name: "Ikan Kerapu Bara Monster 🦈", basePrice: 2500, tier: "💼 [EPIC]", weightKg: 18.0, dropRate: 2.5, baseBuff: "Gaji kerja +12%" },
  { id: "f13", name: "Tuna Sirip Kuning Gred A 🐟", basePrice: 4000, tier: "💼 [EPIC]", weightKg: 35.4, dropRate: 2.0, baseBuff: "Hasil kutipan sewa +10%" },
  { id: "f14", name: "Ketam Raja Alaska King Crab 🦀", basePrice: 5500, tier: "💼 [EPIC]", weightKg: 8.2, dropRate: 1.5, baseBuff: "Menang Coinflip/Slot +5%" },
  { id: "f15", name: "Jerung Tukul Pesisir Pantai 🦈", basePrice: 12000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 65.0, dropRate: 0.8, baseBuff: "Loot rompakan PvP +15%" },
  { id: "f16", name: "Sotong Gergasi Kraken Rahsia 🐙", basePrice: 25000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 110.0, dropRate: 0.5, baseBuff: "Kebal 20% daripada godaman bank" },
  { id: "f17", name: "Raja Ikan Temoleh Sungai Perak 👑", basePrice: 40000, tier: "🏴‍☠️ [LEGENDARY]", weightKg: 42.5, dropRate: 0.3, baseBuff: "Hasil kutipan sewa +20%" },
  { id: "f18", name: "Ikan Purba Coelacanth Emas 🌟", basePrice: 80000, tier: "👑 [MYTHIC]", weightKg: 78.0, dropRate: 0.1, baseBuff: "+15% Semua Gaji & Menang Lumba" },
  { id: "f19", name: "Naga Laut Megalodon Siber 🐉", basePrice: 150000, tier: "👑 [MYTHIC]", weightKg: 450.0, dropRate: 0.05, baseBuff: "Dewa Laut! +25% Semua Gaji & Sewa" }
];

function generateFishInstance(userRodObj) {
  const luck = userRodObj?.luckBonus || 1.0;
  let pool = FISH_DATABASE.map(f => {
    let w = f.dropRate; 
    if (f.isJunk && luck > 1.5) w = Math.max(0.5, w / luck);
    if (!f.isJunk && ["⭐ [RARE]", "💼 [EPIC]", "🏴‍☠️ [LEGENDARY]", "👑 [MYTHIC]"].includes(f.tier)) {
      w = w * luck; 
    }
    return { ...f, dynamicWeight: w };
  });

  const totalWeight = pool.reduce((sum, item) => sum + item.dynamicWeight, 0);
  let randomNum = Math.random() * totalWeight;
  let selectedBase = FISH_DATABASE[0];
  for (const f of pool) {
    if (randomNum < f.dynamicWeight) { selectedBase = f; break; }
    randomNum -= f.dynamicWeight;
  }

  const sizes = [
    { name: "Kecil 🐟", mult: 0.75, kgMult: 0.8 },
    { name: "Sederhana 🐠", mult: 1.0, kgMult: 1.0 },
    { name: "Besar 🐡", mult: 1.45, kgMult: 1.35 },
    { name: "Gergasi / Monster 🦈", mult: 2.20, kgMult: 2.0 }
  ];
  const chosenSize = sizes[Math.floor(Math.random() * sizes.length)];
  
  const finalPrice = selectedBase.isJunk ? 0 : Math.floor(selectedBase.basePrice * chosenSize.mult);
  const finalKg = selectedBase.isJunk ? (selectedBase.weightKg || 1) : Number(((selectedBase.weightKg || 2) * chosenSize.kgMult).toFixed(1));
  const finalName = `${selectedBase.name} (${chosenSize.name})`;

  return {
    id: selectedBase.id,
    name: finalName,
    price: finalPrice,
    tier: selectedBase.tier,
    buff: selectedBase.baseBuff,
    isJunk: selectedBase.isJunk,
    weightKg: finalKg
  };
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
// 💼 10. SEKTOR 50 KERJAYA HALAL LENGKAP (NERFED BALANCE)
// =========================================================================
const JOBS = [
  { id: 1, name: "Pekerja Am Majlis", minPay: 15, maxPay: 30 }, { id: 2, name: "Pencuci Pinggan Kedai Tomyam", minPay: 18, maxPay: 35 },
  { id: 3, name: "Rider GrabFood Berhujan", minPay: 20, maxPay: 45 }, { id: 4, name: "Runner Foodpanda Pink", minPay: 20, maxPay: 45 },
  { id: 5, name: "Pemandu Van Jenazah/Kargo", minPay: 25, maxPay: 50 }, { id: 6, name: "Kerani Kaunter Pejabat", minPay: 28, maxPay: 55 },
  { id: 7, name: "Juruteknik Aircond & Wiring", minPay: 30, maxPay: 60 }, { id: 8, name: "Operator Kilang Shift Malam", minPay: 32, maxPay: 65 },
  { id: 9, name: "Penebar Burger Ramly Special", minPay: 35, maxPay: 70 }, { id: 10, name: "Barista Kopi Hipster", minPay: 35, maxPay: 70 },
  { id: 11, name: "Jurujual Coway / Cuckoo", minPay: 38, maxPay: 75 }, { id: 12, name: "Tukang Masak Katering Kenduri", minPay: 40, maxPay: 80 },
  { id: 13, name: "Graphic Designer Canva Pro", minPay: 45, maxPay: 85 }, { id: 14, name: "Video Editor TikTok Viral", minPay: 48, maxPay: 90 },
  { id: 15, name: "Social Media Admin Group", minPay: 48, maxPay: 90 }, { id: 16, name: "Ejen Hartanah Rumah Lelong", minPay: 50, maxPay: 95 },
  { id: 17, name: "Tukang Paip Rumah Bocor", minPay: 50, maxPay: 95 }, { id: 18, name: "Juruelektrik Tiga Fasa", minPay: 55, maxPay: 100 },
  { id: 19, name: "Mekanik Motor Modenas/Yamaha", minPay: 60, maxPay: 105 }, { id: 20, name: "Foreman Bengkel Kereta", minPay: 65, maxPay: 110 },
  { id: 21, name: "Cikgu Tuisyen SPM Matematik", minPay: 60, maxPay: 105 }, { id: 22, name: "Jurutera Tapak Bina JKR", minPay: 70, maxPay: 115 },
  { id: 23, name: "Akauntan Audit LHDN", minPay: 75, maxPay: 120 }, { id: 24, name: "Pengurus Projek MRT3", minPay: 80, maxPay: 125 },
  { id: 25, name: "Peguam Mahkamah Majistret", minPay: 85, maxPay: 130 }, { id: 26, name: "Doktor Pakar Klinik Kesihatan", minPay: 90, maxPay: 135 },
  { id: 27, name: "Software Engineer Fullstack", minPay: 95, maxPay: 140 }, { id: 28, name: "Data Scientist Machine Learning", minPay: 100, maxPay: 145 },
  { id: 29, name: "Pilot AirAsia / MAS", minPay: 110, maxPay: 150 }, { id: 30, name: "Kapten Kapal Dagang Antarabangsa", minPay: 110, maxPay: 150 },
  { id: 31, name: "Arkitek Bangunan Pencakar Langit", minPay: 105, maxPay: 145 }, { id: 32, name: "Pakar Bedah Jantung", minPay: 120, maxPay: 160 },
  { id: 33, name: "Trader Forex Pacak Signal", minPay: 60, maxPay: 150 }, { id: 34, name: "Pelombong Bitcoin / Kripto", minPay: 70, maxPay: 160 },
  { id: 35, name: "Content Creator YouTube", minPay: 80, maxPay: 155 }, { id: 36, name: "Streamer Mobile Legends", minPay: 85, maxPay: 165 },
  { id: 37, name: "Tukang Jahit Baju Melayu", minPay: 55, maxPay: 95 }, { id: 38, name: "Web Developer Freelance", minPay: 90, maxPay: 145 },
  { id: 39, name: "Ejen Insurans Takaful", minPay: 65, maxPay: 100 }, { id: 40, name: "Pengurus Cawangan Bank", minPay: 115, maxPay: 155 },
  { id: 41, name: "Cef Eksekutif Hotel 5 Bintang", minPay: 120, maxPay: 165 }, { id: 42, name: "Jurugambar Acara Perkahwinan", minPay: 75, maxPay: 110 },
  { id: 43, name: "Juruaudit Forensik SPRM", minPay: 100, maxPay: 145 }, { id: 44, name: "Kontraktor Bina Banglo", minPay: 110, maxPay: 150 },
  { id: 45, name: "Ahli Farmasi Berdaftar", minPay: 105, maxPay: 145 }, { id: 46, name: "Pakar Psikologi Kaunseling", minPay: 100, maxPay: 140 },
  { id: 47, name: "Penganalisis Keselamatan Siber", minPay: 115, maxPay: 155 }, { id: 48, name: "Pakar Ekonomi Negara", minPay: 125, maxPay: 170 },
  { id: 49, name: "Pelabur Saham Bursa Malaysia", minPay: 130, maxPay: 180 }, { id: 50, name: "CEO Konglomerat Korporat", minPay: 150, maxPay: 250 }
];

// =========================================================================
// 🏎️ 11. SHOWROOM 60 KENDERAAN LENGKAP
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
  { id: "ferrari_laferrari", name: "Ferrari LaFerrari Aperta 👑", price: 16000000, type: "Kereta", speed: 230, desc: "Puncak keagungan teknologi Maranello" },
  { id: "koenigsegg_jesko", name: "Koenigsegg Jesko Absolut 300+ 🚀", price: 28000000, type: "Kereta", speed: 265, desc: "Penembus kelajuan 500 km/h aeroangkasa Sweden" },
  { id: "bugatti_chiron", name: "Bugatti Chiron Super Sport 300+ 🚀", price: 38000000, type: "Kereta", speed: 270, desc: "Enjin Quad-Turbo W16 raja kelajuan mutlak" },
  { id: "pagani_huayra", name: "Pagani Huayra Codalunga Bespoke 💎", price: 55000000, type: "Kereta", speed: 245, desc: "Karya seni buatan tangan Itali edisi terhad 5 unit" },
  { id: "bugatti_voiture", name: "Bugatti La Voiture Noire 🖤", price: 95000000, type: "Kereta", speed: 260, desc: "Hiperkar hitam paling ikonik dan eksklusif di dunia" },
  { id: "rolls_boat_tail", name: "Rolls-Royce Boat Tail Yacht 🛥️", price: 140000000, type: "Kereta", speed: 130, desc: "Kapal layar darat dengan suite hos champagne terbina" },
  { id: "rolls_droptail", name: "Rolls-Royce La Rose Noire Droptail 🌹", price: 180000000, type: "Kereta", speed: 135, desc: "Kemuncak kemewahan kereta baharu termahal di bumi" },
  { id: "mercedes_300slr", name: "Mercedes-Benz 300 SLR Uhlenhaut 👑", price: 650000000, type: "Kereta", speed: 200, desc: "Kereta termahal sepanjang zaman bernilai warisan muzium" }
];

// =========================================================================
// 🏢 12. SEKTOR 22 HARTANAH PASIF LENGKAP
// =========================================================================
const PROPERTIES = [
  { id: 1, name: "Flat PPR Lembah Subang 🏢", price: 35000, rent: 350 },
  { id: 2, name: "Rumah Teres 1 Tingkat Bangi 🏡", price: 120000, rent: 1100 },
  { id: 3, name: "Kondominium Mewah KLCC 🏙️", price: 450000, rent: 3800 },
  { id: 4, name: "Semi-D Tropika Shah Alam 🏡", price: 850000, rent: 7500 },
  { id: 5, name: "Banglo Cyberjaya Elite 🏰", price: 1500000, rent: 12000 },
  { id: 6, name: "Penthouse Skyview TRX 🌌", price: 3500000, rent: 28000 },
  { id: 7, name: "Menara Korporat Damansara 🏬", price: 8000000, rent: 65000 },
  { id: 8, name: "Kompleks Kilang Perindustrian Klang 🏭", price: 15000000, rent: 130000 },
  { id: 9, name: "Resort Terapung Pulau Langkawi 🏝️", price: 30000000, rent: 270000 },
  { id: 10, name: "Ladang Kelapa Sawit 500 Ekar Johor 🌴", price: 65000000, rent: 580000 },
  { id: 11, name: "Pusat Data AI Megastruktur Cyberjaya 🧠", price: 120000000, rent: 1100000 },
  { id: 12, name: "Pulau Peribadi Laut China Selatan 👑", price: 300000000, rent: 2800000 },
  { id: 13, name: "Pelabuhan Kontena Persendirian Port Klang 🚢", price: 550000000, rent: 5200000 },
  { id: 14, name: "Lapangan Terbang Kargo Siber Antarabangsa 🛫", price: 950000000, rent: 9000000 },
  { id: 15, name: "Gugusan Pulau Buatan Gold Coast Cyber 🏝️", price: 1800000000, rent: 17500000 },
  { id: 16, name: "Lombong Emas Bawah Tanah Pahang Deep ⛏️", price: 3500000000, rent: 34000000 },
  { id: 17, name: "Pelantar Minyak & Gas Laut Dalam Terengganu 🛢️", price: 6800000000, rent: 67000000 },
  { id: 18, name: "Stesen Satelit Orbit Bumi Rendah (LEO) 🛰️", price: 12000000000, rent: 120000000 },
  { id: 19, name: "Mega-Kasino Bawah Laut Pulau Tioman 🎰", price: 25000000000, rent: 250000000 },
  { id: 20, name: "Pangkalan Pelancaran Roket Angkasa Cyber 🚀", price: 50000000000, rent: 510000000 },
  { id: 21, name: "Koloni Dom Bawah Tanah Bulan Lunar Alpha 🌕", price: 100000000000, rent: 1100000000 },
  { id: 22, name: "Stesen Angkasa Mega Orbital Airi Prime 🌌", price: 250000000000, rent: 2800000000 }
];

const MOD_PARTS = {
  Motor: [
    { id: 46, name: "Talaan ECU Remap Stage 1 💻", price: 2500, boostSpeed: 12, desc: "+12 km/h top speed & respon throttle segera" },
    { id: 47, name: "Ekzos Titanium Paip On 🔊", price: 1800, boostSpeed: 8, desc: "+8% peluang menang drag & jeritan padu" },
    { id: 48, name: "Set Tayar Slick Drag Corsa 🏁", price: 1200, boostSpeed: 5, desc: "+5 km/h & cengkaman maksimum di litar lurus" },
    { id: 49, name: "Botol NOS Nitrous 50hp 🧪", price: 800, boostSpeed: 25, oneTime: true, desc: "Pecutan kilat satu kali guna dalam lumba drag" },
    { id: 50, name: "Head & Block 65mm Superhead ⚙️", price: 3500, boostSpeed: 20, desc: "+20 km/h top speed jentera highway" },
    { id: 51, name: "Monoshock Ohlins Racing 🟡", price: 2200, boostSpeed: 6, desc: "+6 km/h & kestabilan membrek selekoh maut" }
  ],
  Kereta: [
    { id: 46, name: "Remap Dyno Stage 2 + Pops & Bang 💻", price: 3500, boostSpeed: 15, desc: "+15 km/h & letupan ekzos berapi" },
    { id: 48, name: "Tayar Semi-Slick Toyo R888R 🏁", price: 2400, boostSpeed: 10, desc: "+10 km/h & cengkaman litar profesional" },
    { id: 49, name: "Sistem Dwi-Botol NOS 100hp 🧪", price: 1500, boostSpeed: 35, oneTime: true, desc: "Tekan butang terus terbang memintas musuh" },
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
  { id: 11, name: "Cyber Bypass Dongle 🖲️", price: 18000, desc: "Kunci perkakasan bajet untuk lancarkan eksploitasi godam bank" }
];

// =========================================================================
// 💀 NERF: HASIL JENAYAH DIKURANGKAN AGAR LEBIH MENCABAR
// =========================================================================
const CRIMES = [
  { id: 1, name: "Ragut Beg Tepi Jalan 👜", rewardMin: 150, rewardMax: 350, fine: 200, stars: 1 },
  { id: 2, name: "Rompak Kedai Runcit Acheh 🏪", rewardMin: 350, rewardMax: 700, fine: 400, stars: 1 },
  { id: 3, name: "Kopek Mangga Motor Parkir 🏍️", rewardMin: 600, rewardMax: 1200, fine: 800, stars: 2 },
  { id: 4, name: "Pecah Masuk Kedai Emas 💍", rewardMin: 1500, rewardMax: 3000, fine: 2000, stars: 2 },
  { id: 5, name: "Rompak Banglo Orang Kaya 🏡", rewardMin: 3000, rewardMax: 6000, fine: 4000, stars: 3 },
  { id: 6, name: "Skimming Mesin ATM 🏧", rewardMin: 6000, rewardMax: 12000, reqItem: 1, fine: 8000, stars: 3 },
  { id: 7, name: "Seludup Rokok & Vape Kontraban 🚬", rewardMin: 7500, rewardMax: 14000, reqItem: 8, fine: 10000, stars: 3 },
  { id: 8, name: "Seludup Minuman Keras Bebas Cukai 🍾", rewardMin: 9000, rewardMax: 18000, reqItem: 9, fine: 12000, stars: 3 },
  { id: 9, name: "Godam Sistem Bank Pusat 💻", rewardMin: 15000, rewardMax: 30000, reqItem: 2, fine: 20000, stars: 4 },
  { id: 10, name: "Seludup Cip AI & Kad Grafik GPU 🧠", rewardMin: 18000, rewardMax: 35000, reqItem: 10, fine: 25000, stars: 4 },
  { id: 11, name: "Penyeludupan Kontraban Port Klang 🚢", rewardMin: 25000, rewardMax: 50000, reqItem: 3, fine: 35000, stars: 4 },
  { id: 12, name: "Heist Bilik Kebal Kasino Genting 🎰", rewardMin: 45000, rewardMax: 90000, reqItem: 4, fine: 60000, stars: 5 },
  { id: 13, name: "Seludup Supercar Tanpa AP 🏎️", rewardMin: 60000, rewardMax: 120000, reqItem: 9, fine: 80000, stars: 5 },
  { id: 14, name: "Eksploitasi Darkweb Zero-Day 🌐", rewardMin: 100000, rewardMax: 250000, reqItem: 5, fine: 150000, stars: 5 },
  { id: 15, name: "Godam Induk Penguatkuasa Padam Rekod 🏛️", rewardMin: 200000, rewardMax: 500000, reqItem: 5, fine: 300000, stars: 5 }
];

const CYBER_PETS = [
  { id: "doberman", name: "Doberman Bionik Pengawal 🐕", price: 25000, buff: "Kebal 30% daripada rompakan PvP", perk: "anti_rob", val: 0.30 },
  { id: "drone_guard", name: "AI Sentry Dron Pengimbas 🛸", price: 60000, buff: "Kebal 40% daripada godam bank (.hackbank)", perk: "anti_hack", val: 0.40 },
  { id: "cyber_wolf", name: "Serigala Siber Alpha 🐺", price: 150000, buff: "Kebal 50% Rompak & Bantu serang lawan +10% cash", perk: "wolf_buff", val: 0.50 },
  { id: "cyborg_panther", name: "Cyborg Shadow Panther 🐆", price: 450000, buff: "Kebal 60% Rompak & Kebal 60% Godam Bank", perk: "dual_def", val: 0.60 },
  { id: "kripto_dragon", name: "Naga Kripto Orbital Mythic 🐉", price: 2500000, buff: "Kebal 90% Semua Serangan & Gaji Kerja +25%", perk: "dragon_god", val: 0.90 }
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
• *.set_market [gold/btc] [harga]* ➔ Ubah harga pasaran bursa
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
  const { state, saveCreds } = await useMultiFileAuthState("auth_session");
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.macOS("Desktop"),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      currentQR = qr;
      isConnected = false;
    }
    if (connection === "close") {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        setTimeout(() => {
          startBotEngine().catch(e => console.error("Ralat reconnect:", e.message));
        }, 5000);
      }
    } else if (connection === "open") {
      isConnected = true;
      currentQR = "";
      console.log("✅ BOT AIRI'S CORNER TELAH BERSAMBUNG KE WHATSAPP 24/7!");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m?.message) return;
    const from = m.key.remoteJid;
    if (from?.endsWith("@g.us")) {
      const db = loadDB();
      if (!db.groups.includes(from)) {
        db.groups.push(from);
        saveDB(db);
      }
    }
  });

  // =========================================================================
  // ⚡ 15. PENGENDALI MESEJ & COMMAND RPG MEGA LENGKAP
  // =========================================================================
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m?.message) return;

    const from = m.key.remoteJid;
    const msgText = m.message.conversation ||
                    m.message.extendedTextMessage?.text ||
                    m.message.imageMessage?.caption || "";

    if (!msgText.trim().startsWith(".")) return;

    const args = msgText.trim().slice(1).split(/ +/);
    const cmd = args.shift().toLowerCase();
    const sender = m.key.participant || from;
    const cleanSender = sender.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    const pushName = m.pushName || "";
    const user = getUser(cleanSender, pushName);
    const now = Date.now();

    const isOwner = OWNER_NUMBERS.some(num => cleanSender.includes(num)) || user.isOwner === true;
    if (isOwner && !user.isOwner) {
      user.isOwner = true;
      updateUser(cleanSender, user);
    }

    const activePhoneObj = PHONE_DEVICES.find(p => p.id === user.phoneDevice);
    const db = loadDB();
    const currentSeasonEvent = db.active_event_data ? SEASON_EVENTS[db.active_event_data.type] : null;

    if (now < user.cooldowns.jailUntil && cmd !== "upah_lawyer" && cmd !== "myid" && !isOwner) {
      const remSec = Math.ceil((user.cooldowns.jailUntil - now) / 1000);
      return sock.sendMessage(from, { text: `🚨 Anda dalam tahanan lokap! Baki: ${remSec}s. Taip *.upah_lawyer* (RM 500)` });
    }

    // =====================================================================
    // 👑 16. ARAHAN VETO CEO
    // =====================================================================
    if (cmd === "veto" && isOwner) {
      return sock.sendMessage(from, { text: VETO_CEO_LIST });
    }
    
    // 🛠️ ARAHAN DIAGNOSTIK BARU KHAS UNTUK FOUNDER
    if ((cmd === "syscheck" || cmd === "diag") && isOwner) {
      let diagUI = `╔═══════════════════════════╗\n   ⚙️ SHADOW LEGACY DIAGNOSTICS\n╚═══════════════════════════╝\n`;
      diagUI += `Admin: Founder Amar\nOS Target: OriginOS / iQOO 12 Node.js Env\n\n`;
      
      try {
        const testDb = loadDB();
        diagUI += `✅ [DB] Database.json: OK (${Object.keys(testDb.users || {}).length} Entiti)\n`;
      } catch(e) {
        diagUI += `❌ [DB] Database.json: ERROR (${e.message})\n`;
      }

      diagUI += `✅ [MODUL] Jentera: ${VEHICLES?.length || 0} Kod\n`;
      diagUI += `✅ [MODUL] Kerjaya: ${JOBS?.length || 0} Kod\n`;
      diagUI += `✅ [MODUL] Hartanah: ${PROPERTIES?.length || 0} Kod\n`;
      diagUI += `✅ [MODUL] Jenayah: ${CRIMES?.length || 0} Kod\n`;
      diagUI += `✅ [MODUL] Cyber Pets: ${CYBER_PETS?.length || 0} Kod\n`;
      diagUI += `✅ [MODUL] Pangkalan Ikan: ${FISH_DATABASE?.length || 0} Jenis\n`;

      diagUI += `✅ [STATUS] AI Shadow Airi: AKTIF\n`;
      diagUI += `✅ [STATUS] Veto Override: ENABLED\n`;
      
      const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      diagUI += `📈 [SISTEM] Penggunaan RAM: ${memoryUsage} MB\n`;

      return sock.sendMessage(from, { text: diagUI });
    }

    if (cmd === "list_event" && isOwner) {
      let ui = `╔═══════════════════════════╗\n   📜 SENARAI KOD EVENT MUSIM\n╚═══════════════════════════╝\n`;
      for (let key in SEASON_EVENTS) {
        ui += `• *${key}*\n  _${SEASON_EVENTS[key].name}_\n  _${SEASON_EVENTS[key].desc}_\n\n`;
      }
      return sock.sendMessage(from, { text: ui });
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
      if (!SEASON_EVENTS[evType]) return sock.sendMessage(from, { text: `❌ Event tidak sah. Taip *.list_event* untuk senarai.` });
      db.active_event_data = { type: evType, end: now + (days * 24 * 3600 * 1000) };
      saveDB(db);
      return sock.sendMessage(from, { text: `👑 Veto: Acara ${evType} diaktifkan!` });
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

    if (cmd === "give_gold" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const grams = parseFloat(args[1]);
      if (!targetTag || isNaN(grams)) return sock.sendMessage(from, { text: `❌ Format: *.give_gold @user [gram]*` });
      const targetUser = getUser(targetTag);
      targetUser.goldGrams = (targetUser.goldGrams || 0) + grams;
      updateUser(targetTag, targetUser);
      return sock.sendMessage(from, { text: `👑 Veto: +${grams}g Emas 999 diberikan kepada *${targetUser.name}*!`, mentions: [targetTag] });
    }

    if (cmd === "give_btc" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const units = parseFloat(args[1]);
      if (!targetTag || isNaN(units)) return sock.sendMessage(from, { text: `❌ Format: *.give_btc @user [unit]*` });
      const targetUser = getUser(targetTag);
      targetUser.btcUnits = (targetUser.btcUnits || 0) + units;
      updateUser(targetTag, targetUser);
      return sock.sendMessage(from, { text: `👑 Veto: +${units} BTC diberikan kepada *${targetUser.name}*!`, mentions: [targetTag] });
    }

    if (cmd === "set_market" && isOwner) {
      const type = args[0]?.toLowerCase();
      const price = parseInt(args[1]);
      if (!["gold", "btc", "emas"].includes(type) || isNaN(price) || price <= 0) return sock.sendMessage(from, { text: `❌ Format: *.set_market [gold/btc] [harga]*` });
      if (!db.market) db.market = { gold: 350, btc: 280000, lastUpdate: now };
      if (type === "gold" || type === "emas") db.market.gold = price;
      if (type === "btc") db.market.btc = price;
      db.market.lastUpdate = now;
      saveDB(db);
      return sock.sendMessage(from, { text: `👑 Veto Bursa: Harga ${type.toUpperCase()} diubah ke RM ${price.toLocaleString()}!` });
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

    if (cmd === "clear_bounty" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.clear_bounty @user*` });
      if (db.bounties && db.bounties[targetTag]) { delete db.bounties[targetTag]; saveDB(db); }
      return sock.sendMessage(from, { text: `👑 Veto: Bounty dipadamkan!`, mentions: [targetTag] });
    }

    if (cmd === "reset_user" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Format: *.reset_user @user*` });
      db.users[targetTag] = {
        name: getUser(targetTag).name, bio: "", cash: 500, bank: 0, debt: 0, goldGrams: 0, btcUnits: 0,
        phoneDevice: null, phoneName: "Public Phone Awam 📟", fishingGear: { rod: "rod_buluh", reel: "reel_plastik", bait: null, tank: "tank_balang" },
        inventory: [], vehicles: [], vehicleMods: {}, nosStock: {}, food: [], properties: [], pet: null, aquarium: [], stars: 0,
        badges: ["🌱 [COMMON] Warga Baru"], stats: { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0, bankHacks: 0 },
        cooldowns: { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, rent: 0, bankHack: 0, aiAsk: 0 }
      };
      saveDB(db);
      return sock.sendMessage(from, { text: `👑 Veto Wipe: Akaun diset semula!`, mentions: [targetTag] });
    }

    // HANDLER PILIH MONOPOLY
    const currentLiveEvent = db.activeEvents?.[from];
    if (cmd === "pilih" && currentLiveEvent && ["pilihan", "misteri"].includes(currentLiveEvent.type)) {
      if (currentLiveEvent.target !== cleanSender && !isOwner) {
        return sock.sendMessage(from, { text: `❌ Tawaran ini khas untuk sasaran terpilih sahaja!` });
      }

      const choice = args[0];
      if (currentLiveEvent.type === "pilihan") {
        if (choice === "1") {
          user.cash += 5000;
          updateUser(cleanSender, user);
          delete db.activeEvents[from];
          saveDB(db);
          const narrative = getRandomNarrative("SAFE_CHOICE");
          return sock.sendMessage(from, { text: `✅ *${user.name}* ${narrative} (+RM 5,000)` });
        } else if (choice === "2") {
          const isWin = Math.random() < 0.45;
          const amt = isWin ? 25000 : -20000;
          user.cash = Math.max(0, user.cash + amt);
          updateUser(cleanSender, user);
          delete db.activeEvents[from];
          saveDB(db);
          const narrative = getRandomNarrative("CRYPTO_GAMBLE");
          return sock.sendMessage(from, { text: `${isWin ? "🎉" : "💀"} *${user.name}* ${narrative} (${isWin ? "+RM 25,000" : "-RM 20,000"})` });
        }
      } else if (currentLiveEvent.type === "misteri") {
        if (choice === "1") {
          user.cash += 2000;
          updateUser(cleanSender, user);
          delete db.activeEvents[from];
          saveDB(db);
          const narrative = getRandomNarrative("SAFE_CHOICE");
          return sock.sendMessage(from, { text: `✅ *${user.name}* ${narrative} (+RM 2,000)` });
        } else if (choice === "2") {
          const isWin = Math.random() < 0.50;
          const amt = isWin ? 15000 : -12000;
          user.cash = Math.max(0, user.cash + amt);
          updateUser(cleanSender, user);
          delete db.activeEvents[from];
          saveDB(db);
          const narrative = getRandomNarrative("MYSTERY_BOX");
          return sock.sendMessage(from, { text: `${isWin ? "🎁" : "💥"} *${user.name}* ${narrative} (${isWin ? "+RM 15,000" : "-RM 12,000"})` });
        }
      }
    }

    if (cmd === "rebut" && currentLiveEvent?.type === "airdrop") {
      if (args[0] === currentLiveEvent.code) {
        user.cash += currentLiveEvent.reward;
        user.stats.eventsWon = (user.stats.eventsWon || 0) + 1;
        delete db.activeEvents[from];
        saveDB(db);
        updateUser(cleanSender, user);
        const narrative = getRandomNarrative("AIRDROP_CLAIM");
        return sock.sendMessage(from, { text: `🎉 *AIRDROP DISAPU!*\n\n${narrative}\n\n💰 Diterima: *+RM ${currentLiveEvent.reward.toLocaleString()}* tunai!` });
      }
    }

    // 🤖 SHADOW AIRI AI (.airi)
    if (cmd === "airi" || cmd === "ai" || cmd === "tanya") {
      const query = args.join(" ").trim();
      if (!query) return sock.sendMessage(from, { text: `Hai ${user.name}! 💙 Airi ada kat sini~ Taip: *.airi [soalan/sembang]* hehe~ ✨` });

      if (now < (user.cooldowns.aiAsk || 0) && !isOwner) {
        const rem = Math.ceil(((user.cooldowns.aiAsk || 0) - now) / 1000);
        return sock.sendMessage(from, { text: `⏳ Otak Airi tengah proses data jap~ Tunggu *${rem} saat* lagi ya!` });
      }

      user.cooldowns.aiAsk = now + (10 * 1000);
      updateUser(cleanSender, user);

      const reply = await askAiriAI(query, user.name);
      return sock.sendMessage(from, { text: `╔═══════════════════════════╗\n   💠 AIRI CYBER RESPONSE 💠\n╚═══════════════════════════╝\n❓ *Soalan:* ${query}\n\n${reply}\n\n✨ _Dikuasakan oleh Enjin Shadow Airi_` });
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

      ui += `💡 Juara Top 3 bila musim tamat akan diabadikan di *.halloffame*!`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "halloffame" || cmd === "hof") {
      if (!db.hallOfFame || db.hallOfFame.length === 0) {
        return sock.sendMessage(from, { text: `🏛️ Dewan Kemegahan masih kosong! Bersaing di Musim Ke-${db.season || 1} untuk mencipta sejarah.` });
      }

      let ui = `╔═══════════════════════════════════╗\n   🏛️ AIRI'S DEWAN KEMEGAHAN (HALL OF FAME)\n╚═══════════════════════════════════╝\n\n`;
      db.hallOfFame.forEach(h => {
        ui += `🌟 *MUSIM KE-${h.season}*\n`;
        ui += `🥇 Juara: *${h.first.name}* (RM ${h.first.netWorth.toLocaleString()})\n`;
        if (h.second) ui += `🥈 Naib Juara: *${h.second.name}* (RM ${h.second.netWorth.toLocaleString()})\n`;
        if (h.third) ui += `🥉 Tempat Ke-3: *${h.third.name}* (RM ${h.third.netWorth.toLocaleString()})\n`;
        ui += `━━━━━━━━━━━━━━━━━━━━\n`;
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

      const ui = `╔═══════════════════════════╗\n   🌐 STATUS MUSIM AIRI'S CORNER\n╚═══════════════════════════╝\n📅 *Musim Semasa:* Musim Ke-${db.season || 1}\n🔥 *Acara Musim:* ${evText}\n\n💡 Bersaing untuk Top 3 dengan menambah tunai, emas, btc & hartanah!`;
      return sock.sendMessage(from, { text: ui });
    }

    // 🪙 TRADING EMAS & BITCOIN
    if (cmd === "pasaran" || cmd === "crypto" || cmd === "gold") {
      const goldPrice = db.market?.gold || 350;
      const btcPrice = db.market?.btc || 280000;
      return sock.sendMessage(from, { 
        text: `╔═══════════════════════════╗\n   📈 BURSA SIBER & KOMODITI\n╚═══════════════════════════╝\n🪙 *EMAS 999 FIZIKAL:*\n• Harga Semasa: *RM ${goldPrice.toLocaleString()} / g*\n• Simpanan Anda: *${(user.goldGrams || 0).toFixed(2)} g*\n\n₿ *BITCOIN (BTC/MYR):*\n• Harga Semasa: *RM ${btcPrice.toLocaleString()} / BTC*\n• Simpanan Anda: *${(user.btcUnits || 0).toFixed(4)} BTC*\n\n💡 *.beli_emas*, *.jual_emas*, *.beli_btc*, *.jual_btc*` 
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
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Takkan nak letak bounty atas kepala sendiri!` });

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

    // 🐕 KEDAI PET & PENGAWAL (FIXED: STRING ID SAVING)
    if (cmd === "kedai_pet" || cmd === "petshop") {
      let ui = `╔═══════════════════════════╗\n   🐕 KEDAI PENGAWAL SIBER\n╚═══════════════════════════╝\n`;
      CYBER_PETS.forEach(p => { ui += `• *[${p.id}]* ${p.name}\n  💰 RM ${p.price.toLocaleString()} | _${p.buff}_\n\n`; });
      ui += `💡 Taip *.beli_pet [id]*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_pet") {
      const petId = args[0]?.toLowerCase();
      const petObj = CYBER_PETS.find(p => p.id === petId);
      if (!petObj) return sock.sendMessage(from, { text: `❌ Kod pet tidak sah!` });
      if (user.cash < petObj.price) return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup!` });
      
      user.cash -= petObj.price;
      user.pet = petObj.id; // Simpan ID sahaja
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎉 Anda kini dilindungi oleh *${petObj.name}*!` });
    }

    // =====================================================================
    // 🎣 18. KEDAI PANCING & MEMANCING (KATEGORI BERKUMPULAN & NOMBOR)
    // =====================================================================
    if (cmd === "kedai_pancing" || cmd === "tackleshop") {
      const subCategory = args[0];

      if (!subCategory) {
        let menu = 
`╔═════════════════════════════════════╗
   🎣 KEDAI PERALATAN PANCING AIRI 🎣
╚═════════════════════════════════════╝
Sila pilih kategori kedai dengan nombor:

1️⃣ Joran (Rod)
2️⃣ Kekili (Reel)
3️⃣ Umpan (Bait)
4️⃣ Akuarium (Tank)

👉 Contoh guna: *.kedai_pancing 1*`;
        return sock.sendMessage(from, { text: menu });
      }

      if (subCategory === "1") {
        let ui = `╔═════════════════════════════════════╗\n   🎋 KEDAI KATEGORI: JORAN (ROD)\n╚═════════════════════════════════════╝\n`;
        FISHING_SHOP.rods.forEach(r => {
          ui += `• *[${r.id}]* ${r.name}\n  💰 RM ${r.price.toLocaleString()} | _${r.desc}_\n\n`;
        });
        ui += `👉 Beli: *.beli_pancing [id]*`;
        return sock.sendMessage(from, { text: ui });
      } else if (subCategory === "2") {
        let ui = `╔═════════════════════════════════════╗\n   ⚙️ KEDAI KATEGORI: KEKILI (REEL)\n╚═════════════════════════════════════╝\n`;
        FISHING_SHOP.reels.forEach(re => {
          ui += `• *[${re.id}]* ${re.name}\n  💰 RM ${re.price.toLocaleString()} | _${re.desc}_\n\n`;
        });
        ui += `👉 Beli: *.beli_pancing [id]*`;
        return sock.sendMessage(from, { text: ui });
      } else if (subCategory === "3") {
        let ui = `╔═════════════════════════════════════╗\n   🪱 KEDAI KATEGORI: UMPAN (BAIT)\n╚═════════════════════════════════════╝\n`;
        FISHING_SHOP.baits.forEach(b => {
          ui += `• *[${b.id}]* ${b.name}\n  💰 RM ${b.price.toLocaleString()} | _${b.desc}_\n\n`;
        });
        ui += `👉 Beli: *.beli_pancing [id]*`;
        return sock.sendMessage(from, { text: ui });
      } else if (subCategory === "4") {
        let ui = `╔═════════════════════════════════════╗\n   🫙 KEDAI KATEGORI: AKUARIUM (TANK)\n╚═════════════════════════════════════╝\n`;
        FISHING_SHOP.tanks.forEach(t => {
          ui += `• *[${t.id}]* ${t.name}\n  💰 RM ${t.price.toLocaleString()} | _${t.desc}_\n\n`;
        });
        ui += `👉 Beli: *.beli_pancing [id]*`;
        return sock.sendMessage(from, { text: ui });
      } else {
        return sock.sendMessage(from, { text: `❌ Pilihan tidak sah! Sila pilih nombor 1 hingga 4. Contoh: *.kedai_pancing 1*` });
      }
    }

    if (cmd === "beli_pancing") {
      const itemCode = args[0]?.toLowerCase();
      if (!itemCode) return sock.sendMessage(from, { text: `❌ Sila masukkan kod barang! Contoh: *.beli_pancing rod_carbon*` });

      const allFishingItems = [
        ...FISHING_SHOP.rods,
        ...FISHING_SHOP.reels,
        ...FISHING_SHOP.baits,
        ...FISHING_SHOP.tanks
      ];

      const item = allFishingItems.find(i => i.id === itemCode);
      if (!item) return sock.sendMessage(from, { text: `❌ Kod peralatan tidak wujud! Semak di *.kedai_pancing*.` });

      if (user.cash < item.price) {
        return sock.sendMessage(from, { text: `❌ Tunai anda tidak mencukupi untuk beli ${item.name} (RM ${item.price.toLocaleString()})!` });
      }

      user.cash -= item.price;

      if (item.luckBonus !== undefined) {
        user.fishingGear.rod = item.id;
      } else if (item.cdReduction !== undefined) {
        user.fishingGear.reel = item.id;
      } else if (item.priceMult !== undefined) {
        user.fishingGear.bait = item.id;
      } else if (item.capacity !== undefined) {
        user.fishingGear.tank = item.id;
      }

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
      const caughtInstance = generateFishInstance(userRod);
      
      let fPrice = caughtInstance.price;
      if (userBait && fPrice > 0) {
        fPrice = Math.floor(fPrice * userBait.priceMult);
        user.fishingGear.bait = null;
      }
      if (currentSeasonEvent?.fishMult) fPrice = Math.floor(fPrice * currentSeasonEvent.fishMult);

      if (!db.pendingFish) db.pendingFish = {};
      db.pendingFish[cleanSender] = { fish: caughtInstance, finalPrice: fPrice };
      saveDB(db);
      updateUser(cleanSender, user);

      if (fPrice === 0) {
        delete db.pendingFish[cleanSender];
        saveDB(db);
        return sock.sendMessage(from, { text: `🎣 *${user.name}* menaikkan ${caughtInstance.name} (${caughtInstance.weightKg} kg).\n(Sampah - Dibuang semula ke laut!)` });
      }

      const baitUsedText = userBait ? `\n🪱 Umpan: *${userBait.name}*` : "";

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
1️⃣ Taip: *.jual_ikan* ➔ Ambil RM ${fPrice.toLocaleString()} tunai
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
      if (!pData) return sock.sendMessage(from, { text: `❌ Tiada ikan sedang menunggu keputusan! Taip *.mancing* dahulu.` });
      
      const currentTank = FISHING_SHOP.tanks.find(t => t.id === user.fishingGear?.tank) || FISHING_SHOP.tanks[0];
      if (!user.aquarium) user.aquarium = [];

      if (user.aquarium.length >= currentTank.capacity) {
        return sock.sendMessage(from, { 
          text: `❌ *AKUARIUM PENUH!* ${currentTank.name} anda hanya memuatkan ${currentTank.capacity} ekor ikan.\n\n💡 Beli akuarium lebih besar di *.kedai_pancing* atau jual ikan ini dengan *.jual_ikan*!` 
        });
      }

      user.aquarium.push(pData.fish);
      user.stats.fishes = (user.stats.fishes || 0) + 1;
      delete db.pendingFish[cleanSender];
      saveDB(db);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { 
        text: `🐠 *IKAN DIBELA:* *${pData.fish.name}* (${pData.fish.weightKg} kg) dimasukkan ke ${currentTank.name}!\n✨ Buff Aktif: _${pData.fish.buff}_` 
      });
    }

    if (cmd === "akuarium") {
      const currentTank = FISHING_SHOP.tanks.find(t => t.id === user.fishingGear?.tank) || FISHING_SHOP.tanks[0];
      if (!user.aquarium || user.aquarium.length === 0) {
        return sock.sendMessage(from, { text: `🐠 Akuarium (${currentTank.name}) anda masih kosong! (0/${currentTank.capacity})\nPancing dan pilih *.bela_ikan*.` });
      }

      let ui = `╔═══════════════════════════════════╗\n   🐠 KOLEKSI AKUARIUM (${currentTank.name})\n   [ Kapasiti: ${user.aquarium.length}/${currentTank.capacity} Ekor ]\n╚═══════════════════════════════════╝\n`;
      user.aquarium.forEach((f, idx) => { 
        ui += `${idx + 1}. *${f.name}* (${f.weightKg}kg) (${f.tier})\n   ✨ _${f.buff}_\n\n`; 
      });
      return sock.sendMessage(from, { text: ui });
    }

    // =====================================================================
    // 💼 KERJA HALAL (CD TEPAT 30 SAAT)
    // =====================================================================
    if (cmd === "kerja" || cmd === "work") {
      let cdDuration = 30 * 1000; // Tepat 30 saat

      if (now < user.cooldowns.work && !isOwner) {
        const rem = Math.ceil((user.cooldowns.work - now) / 1000);
        return sock.sendMessage(from, { text: `⚠️ Rehat *${rem} saat* lagi sebelum shift seterusnya!` });
      }

      const assignedJob = JOBS[Math.floor(Math.random() * JOBS.length)];
      let payout = Math.floor(Math.random() * (assignedJob.maxPay - assignedJob.minPay + 1)) + assignedJob.minPay;

      if (activePhoneObj?.perk === "work" || activePhoneObj?.perk === "god") payout += Math.floor(payout * activePhoneObj.val);
      if (currentSeasonEvent?.jobMult) payout = Math.floor(payout * currentSeasonEvent.jobMult);

      user.cash += payout;
      user.stats.works += 1;
      user.cooldowns.work = now + cdDuration;
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `╔═══════════════════════════╗\n   💼 SLIP GAJI HALAL AIRI\n╚═══════════════════════════╝\n👤 Pekerja: *${user.name}*\n🏢 Tugasan: *${assignedJob.name}*\n💵 Upah: *+RM ${payout.toLocaleString()}*` 
      });
    }

    if (cmd === "daily") {
      if (now < user.cooldowns.daily && !isOwner) return sock.sendMessage(from, { text: `⏳ Elaun harian dah dituntut! Datang esok ya.` });
      let bonusAmt = currentSeasonEvent?.type === "INFLATION_SPIKE" ? 300 : 100; // Nerfed Daily
      user.cash += bonusAmt;
      user.cooldowns.daily = now + (24 * 3600 * 1000);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎁 *BANTUAN HARIAN:* +RM ${bonusAmt.toLocaleString()} tunai dikreditkan!` });
    }

    if (cmd === "showroom") {
      const page = parseInt(args[0]) || 1;
      const start = (page - 1) * 20;
      const pageVehicles = VEHICLES.slice(start, start + 20);
      let ui = `╔═══════════════════════════╗\n   🏎️ SHOWROOM JENTERA (PAGE ${page}/3)\n╚═══════════════════════════╝\n`;
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
      if (user.cash < part.price) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi!` });

      if (!user.vehicleMods) user.vehicleMods = {};
      if (!user.vehicleMods[vId]) user.vehicleMods[vId] = [];
      user.cash -= part.price;
      if (!part.oneTime) user.vehicleMods[vId].push(part.name);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🔧 *${part.name}* dipasang pada *${vehicle.name}*!` });
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
        let reward = Math.floor((vehicle.price * 0.05) + 500); // Nerfed win reward
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

    // 💀 MISI JENAYAH TERTENTU
    if (cmd === "buat_jenayah") {
      const c = CRIMES.find(x => x.id === parseInt(args[0]));
      if (!c) return sock.sendMessage(from, { text: `❌ ID jenayah tidak sah!` });
      if (c.reqItem && !user.inventory.some(i => i.id === c.reqItem)) {
        const reqObj = BLACKMARKET_ITEMS.find(i => i.id === c.reqItem);
        return sock.sendMessage(from, { text: `❌ Perlukan [${reqObj?.name}] dari *.bm*!` });
      }

      if (now < user.cooldowns.crime && !isOwner) {
        const rem = Math.ceil((user.cooldowns.crime - now) / 1000);
        return sock.sendMessage(from, { text: `⏳ Polis sedang meronda kawasan! Tunggu *${rem} saat* lagi.` });
      }

      user.cooldowns.crime = now + (120 * 1000);
      let crimeRate = 0.55;
      if (activePhoneObj?.perk === "crime" || activePhoneObj?.perk === "god") crimeRate += activePhoneObj.val;

      const isSuccess = Math.random() < crimeRate || isOwner;

      if (isSuccess) {
        let reward = Math.floor(Math.random() * (c.rewardMax - c.rewardMin + 1)) + c.rewardMin;
        if (currentSeasonEvent?.rewardMult) reward = Math.floor(reward * currentSeasonEvent.rewardMult);
        user.cash += reward;
        user.stats.crimes += 1;
        user.stars = Math.min(5, user.stars + c.stars);
        updateUser(cleanSender, user);
        const narrative = getRandomNarrative("CRIME_SUCCESS");
        return sock.sendMessage(from, { text: `🦹 *MISI BERJAYA:* ${c.name}\n\n${narrative}\n\n💵 Hasil: *+RM ${reward.toLocaleString()}*\n⭐ Wanted: ${"⭐".repeat(user.stars)}` });
      } else {
        user.stars = Math.min(5, user.stars + 1);
        let jailTimeSec = Math.max(30, user.stars * 30);
        let fine = currentSeasonEvent?.fineMult ? Math.floor(c.fine * currentSeasonEvent.fineMult) : c.fine;
        user.cash = Math.max(0, user.cash - fine);
        user.cooldowns.jailUntil = now + (jailTimeSec * 1000);
        updateUser(cleanSender, user);
        const narrative = getRandomNarrative("CRIME_BUSTED");
        return sock.sendMessage(from, { text: `🚨 *KANTOI POLIS!* 🚨\n\n${narrative}\n\n💸 Denda: *-RM ${fine.toLocaleString()}* & lokap ${jailTimeSec}s! Taip *.upah_lawyer*` });
      }
    }

    if (cmd === "hackbank" || cmd === "godam_bank") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa: *.hackbank @user*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Tak boleh godam akaun sendiri!` });

      const hasHackDevice = user.inventory.some(i => i.id === 11 || i.id === 2 || i.id === 5);
      if (!hasHackDevice && !isOwner) return sock.sendMessage(from, { text: `❌ Perlukan *Cyber Bypass Dongle (ID 11)* di *.bm*!` });

      const targetUser = getUser(cleanTarget);
      if (targetUser.bank < 1000) return sock.sendMessage(from, { text: `😅 Simpanan bank mangsa bawah RM 1,000.` });

      const cyberEmojis = ["⚡", "💾", "🔓", "☣️", "👾", "📡", "🧩", "🗝️", "💎", "🛡️"];
      const shuffled = [...cyberEmojis].sort(() => 0.5 - Math.random());
      const selectedPin = shuffled.slice(0, 4).join("");

      if (!db.activeHacks) db.activeHacks = {};
      db.activeHacks[cleanSender] = { target: cleanTarget, emojiPin: selectedPin, expires: now + 30000 };
      saveDB(db);

      return sock.sendMessage(from, { 
        text: `╔═══════════════════════════╗\n   ⚡ CYBER NEURAL HANDSHAKE ⚡\n╚═══════════════════════════╝\n🎯 Sasaran: *${targetUser.name}*\n🔑 *KOD EMOJI PIN DIPERLUKAN:* ${selectedPin.split("").join("  ")}
⏳ Tempoh: 30 Saat!\n👉 Taip: *.bypass ${selectedPin}*` 
      });
    }

    if (cmd === "bypass") {
      const activeHack = db.activeHacks?.[cleanSender];
      if (!activeHack || now > activeHack.expires) {
        delete db.activeHacks?.[cleanSender];
        saveDB(db);
        return sock.sendMessage(from, { text: `❌ Tiada sesi godam aktif atau masa telah tamat!` });
      }

      const targetUser = getUser(activeHack.target);
      if (args.join("").trim() === activeHack.emojiPin) {
        delete db.activeHacks[cleanSender];
        const stolen = Math.floor(targetUser.bank * 0.05); // Nerfed Hack Payout (5%)
        targetUser.bank -= stolen;
        user.cash += stolen;
        user.stats.bankHacks = (user.stats.bankHacks || 0) + 1;
        saveDB(db);
        updateUser(cleanSender, user);
        updateUser(activeHack.target, targetUser);
        const narrative = getRandomNarrative("BANK_HACK_SUCCESS");
        return sock.sendMessage(from, { text: `🔓 *GODAM BERJAYA:* +RM ${stolen.toLocaleString()} disedut dari akaun bank mangsa!\n\n${narrative}`, mentions: [activeHack.target] });
      } else {
        delete db.activeHacks[cleanSender];
        user.cash = Math.max(0, user.cash - 1500);
        user.cooldowns.jailUntil = now + (60 * 1000);
        saveDB(db);
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 *FIREWALL ALERT:* PIN Emoji salah! Denda RM 1,500 & masuk lokap 60s!` });
      }
    }

    // 🏢 HARTANAH, KASINO & BANK
    if (cmd === "list_hartanah") {
      let ui = `╔═══════════════════════════╗\n   🏢 PASARAN HARTANAH AIRI (22 ASET)\n╚═══════════════════════════╝\n`;
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
      const targetUser = getUser(cleanTarget);
      user.cash -= amt;
      targetUser.cash += amt;
      updateUser(cleanSender, user);
      updateUser(cleanTarget, targetUser);
      return sock.sendMessage(from, { text: `💸 *TRANSFER:* RM ${amt.toLocaleString()} dihantar ke *${targetUser.name}*!` });
    }

    // 🥷 ROMPAK PEMAIN
    if (cmd === "rompak") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa: *.rompak @user*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
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
        const stolen = Math.floor(targetUser.cash * 0.10); // Nerf: Curi 10% sahaja
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
      if (fId === "nasilemak") user.cooldowns.work = 0;
      if (fId === "roticanai") user.cooldowns.work = Math.max(0, user.cooldowns.work - 20000);
      if (fId === "tehtarik") user.cooldowns.work = Math.max(0, user.cooldowns.work - 10000);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `😋 Kenyang padu! Tenaga bertambah & cooldown dipendekkan!` });
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

    // 👑 FOUNDER & SEASON RESET TERPERINCI
    if (cmd === "reset_season" && isOwner) {
      const goldP = db.market?.gold || 350;
      const btcP = db.market?.btc || 280000;

      const ranked = Object.entries(db.users || {})
        .map(([id, u]) => {
          let propVal = 0;
          (u.properties || []).forEach(pId => {
            const pr = PROPERTIES.find(x => x.id === pId);
            if (pr) propVal += pr.price;
          });
          const net = (u.cash || 0) + (u.bank || 0) + Math.floor((u.goldGrams || 0) * goldP) + Math.floor((u.btcUnits || 0) * btcP) + propVal;
          return { id, name: u.name, netWorth: net };
        })
        .sort((a, b) => b.netWorth - a.netWorth);

      const top1 = ranked[0];
      const top2 = ranked[1];
      const top3 = ranked[2];

      if (!db.hallOfFame) db.hallOfFame = [];
      if (top1) {
        db.hallOfFame.push({
          season: db.season || 1,
          first: top1,
          second: top2 || { name: "-", netWorth: 0 },
          third: top3 || { name: "-", netWorth: 0 }
        });
      }

      const sOld = db.season || 1;
      db.season = sOld + 1;
      db.active_event_data = null;

      for (let uid in db.users) {
        const u = db.users[uid];
        const legacyBadges = u.badges.filter(b => b.includes("LEGACY") || b.includes("CHRONO") || b.includes("Founder"));
        
        let starterCash = 500;
        if (top1 && uid === top1.id) {
          legacyBadges.push(`👑 [S${sOld} CHAMPION]`);
          starterCash = 50000;
        } else if (top2 && uid === top2.id) {
          legacyBadges.push(`🥈 [S${sOld} RUNNER-UP]`);
          starterCash = 25000;
        } else if (top3 && uid === top3.id) {
          legacyBadges.push(`🥉 [S${sOld} 3RD PLACE]`);
          starterCash = 10000;
        }

        db.users[uid] = {
          name: u.name, bio: u.bio || "", isOwner: u.isOwner,
          cash: starterCash, bank: 0, debt: 0, goldGrams: 0, btcUnits: 0,
          phoneDevice: null, phoneName: "Public Phone Awam 📟",
          fishingGear: { rod: "rod_buluh", reel: "reel_plastik", bait: null, tank: "tank_balang" },
          inventory: [], vehicles: [], vehicleMods: {}, nosStock: {},
          food: [], properties: [], pet: null, aquarium: [], stars: 0,
          badges: legacyBadges.length > 0 ? legacyBadges : ["🌱 [COMMON] Warga Baru"],
          stats: { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0, bankHacks: 0 },
          cooldowns: { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, rent: 0, bankHack: 0, aiAsk: 0 }
        };
      }

      saveDB(db);

      for (const gId of db.groups) {
        await sock.sendMessage(gId, { 
          text: `👑 *TIRAI MUSIM KE-${sOld} DITUTUP!* 👑\n\n🥇 Juara: *${top1?.name || "-"}*\n🥈 Tempat Ke-2: *${top2?.name || "-"}*\n🥉 Tempat Ke-3: *${top3?.name || "-"}*\n\n🔥 *MUSIM KE-${db.season} BERMULA SEKARANG!* Semua rekod diset semula ke garisan permulaan.` 
        }).catch(() => {});
      }
      return;
    }

    // 🪪 PROFIL, MENU & TOP
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

      return sock.sendMessage(from, { 
        text: `🎒 *PROFIL INVENTORI & PERALATAN:*

🏎️ Jentera: ${vList}
🏴‍☠️ Barang BM: ${iList}
🎣 Peralatan Pancing:
• Joran: *${userRod}*
• Kekili: *${userReel}*
• Umpan: *${userBait}*
• Akuarium: *${userTank}* (${user.aquarium.length} ekor ikan)` 
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
      let menuText = `╔═══════════════════════════╗\n   🖥️ AIRI'S CORNER CYBER OS (S${db.season || 1})\n╚═══════════════════════════╝\n${evStatus}

🤖 *[1. SHADOW AIRI AI]*
• *.airi [soalan]* ➔ Tanya & sembang AI

🏆 *[2. SISTEM MUSIM & RANKING]*
• *.ranking* ➔ Papan pendahulu nilai bersih Top 10
• *.halloffame* ➔ Dewan kejuaraan musim lepas
• *.season_info* ➔ Status musim & acara aktif

💼 *[3. KERJAYA & PASARAN]*
• *.kerja* (CD: 30s), *.daily*, *.pasaran*
• *.beli_emas*, *.jual_emas*, *.beli_btc*, *.jual_btc*

🐕 *[4. PENGAWAL & BOUNTY]*
• *.kedai_pet*, *.beli_pet [id]*, *.bounty @user [jumlah]*, *.list_bounty*

🎣 *[5. JETI & KEDAI PANCING]*
• *.kedai_pancing* ➔ Nombor 1-4
• *.beli_pancing [id]* ➔ Beli & pasang gear
• *.mancing*, *.jual_ikan*, *.bela_ikan*, *.akuarium*

🏎️ *[6. GARAJ & SEWA]*
• *.showroom [1/2/3]*, *.beli_kenderaan [id]*, *.bengkel*, *.pasang*
• *.lumba* (CD: 90s), *.list_hartanah*, *.beli_rumah [id]*, *.kutip_sewa*
• *.device*, *.beli_phone [id]*

🏴‍☠️ *[7. UNDERWORLD & KASINO]*
• *.bm*, *.beli_bm*, *.jenayah*, *.buat_jenayah* (CD: 120s)
• *.rompak* (CD: 180s), *.hackbank*, *.bypass*
• *.coinflip*, *.slot*, *.hutang_ahlong*, *.bayar_ahlong*

🏦 *[8. BANK & IDENTITI]*
• *.deposit*, *.withdraw*, *.transfer*, *.shop*, *.beli_makanan*, *.makan*, *.myid*, *.profile*, *.top*`;

      return sock.sendMessage(from, { text: menuText });
    }

  });
}

startBotEngine().catch(err => {
  console.error("⚠️ Ralat fatal:", err.message);
});
