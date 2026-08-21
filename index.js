import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import http from "http";
import QRCode from "qrcode";
import dotenv from "dotenv";
dotenv.config();

// =========================================================================
// 👑 0. KUNCI KESELAMATAN FOUNDER MUTLAK (AMAR) - AUTO RECOGNIZE
// =========================================================================
const OWNER_NUMBERS = [
  "1166533534",
  "601166533534",
  "38956007690292"
];

let currentQR = "";
let isConnected = false;

// =========================================================================
// 🌐 1. PELAYAN WEB RINGAN UNTUK PAPARAN QR DI RENDER
// =========================================================================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  if (isConnected) {
    res.end(`
      <div style="text-align:center;margin-top:60px;font-family:'Segoe UI',sans-serif;background:#0f172a;color:#f8fafc;padding:30px;min-height:85vh;">
        <h1 style="color:#22c55e;font-size:2.5rem;">⚡ AIRI'S CORNER CYBER OS ONLINE! ⚡</h1>
        <p style="color:#94a3b8;font-size:1.2rem;">Sistem WhatsApp RPG 24/7 aktif & stabil tanpa ralat.</p>
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
          <p style="color:#94a3b8;">Buka WhatsApp > Peranti Terpaut (Linked Devices) > Imbas QR di bawah:</p>
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
}).listen(PORT);

// =========================================================================
// 💾 2. SISTEM DATABASE JSON
// =========================================================================
const DB_FILE = "./database.json";
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, groups: [], activeEvents: {}, activeHacks: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE));
  } catch (e) {
    return { users: {}, groups: [], activeEvents: {}, activeHacks: {} };
  }
}
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
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
      phoneDevice: null,
      phoneName: "Public Phone Awam 📟",
      inventory: [],
      vehicles: [],
      vehicleMods: {},
      nosStock: {},
      food: [],
      properties: [],
      pet: null,
      stars: 0,
      badges: ["🌱 [COMMON] Warga Baru"],
      stats: { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0, bankHacks: 0 },
      cooldowns: { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, rent: 0, bankHack: 0 }
    };
    saveDB(db);
  }
  const u = db.users[userId];
  if (pushName && pushName !== "Warga Cyber" && u.name !== pushName) {
    u.name = pushName;
    saveDB(db);
  }
  if (!u.inventory) u.inventory = [];
  if (!u.vehicles) u.vehicles = [];
  if (!u.vehicleMods) u.vehicleMods = {};
  if (!u.nosStock) u.nosStock = {};
  if (!u.food) u.food = [];
  if (!u.properties) u.properties = [];
  if (!u.badges) u.badges = ["🌱 [COMMON] Warga Baru"];
  if (!u.stats) u.stats = { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0, bankHacks: 0 };
  if (!u.cooldowns) u.cooldowns = { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, rent: 0, bankHack: 0 };
  return u;
}

function updateUser(userId, userData) {
  const db = loadDB();
  db.users[userId] = userData;
  saveDB(db);
}

// =========================================================================
// 📱 3. KEDAI TELEFON TEMPATAN (10 MODEL BESERTA PASIF BUFF)
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
  { id: "shadow_phone", name: "Shadow Legion X CyberDeck 🐺", price: 15000, bonus: "Gajet Ultimate Founder! +20% Lumba & Kerja, 50% Kebal Denda", perk: "god", val: 0.20 }
];

// =========================================================================
// 💼 4. SEKTOR 50 KERJAYA HALAL LENGKAP
// =========================================================================
const JOBS = [
  { id: 1, name: "Pekerja Am Majlis", minPay: 80, maxPay: 120 }, { id: 2, name: "Pencuci Pinggan Kedai Tomyam", minPay: 90, maxPay: 130 },
  { id: 3, name: "Rider GrabFood Berhujan", minPay: 120, maxPay: 180 }, { id: 4, name: "Runner Foodpanda Pink", minPay: 120, maxPay: 180 },
  { id: 5, name: "Pemandu Van Jenazah/Kargo", minPay: 140, maxPay: 200 }, { id: 6, name: "Kerani Kaunter Pejabat", minPay: 150, maxPay: 220 },
  { id: 7, name: "Juruteknik Aircond & Wiring", minPay: 160, maxPay: 240 }, { id: 8, name: "Operator Kilang Shift Malam", minPay: 170, maxPay: 250 },
  { id: 9, name: "Penebar Burger Ramly Special", minPay: 180, maxPay: 260 }, { id: 10, name: "Barista Kopi Hipster", minPay: 180, maxPay: 260 },
  { id: 11, name: "Jurujual Coway / Cuckoo", minPay: 190, maxPay: 270 }, { id: 12, name: "Tukang Masak Katering Kenduri", minPay: 200, maxPay: 280 },
  { id: 13, name: "Graphic Designer Canva Pro", minPay: 210, maxPay: 290 }, { id: 14, name: "Video Editor TikTok Viral", minPay: 220, maxPay: 300 },
  { id: 15, name: "Social Media Admin Group", minPay: 220, maxPay: 300 }, { id: 16, name: "Ejen Hartanah Rumah Lelong", minPay: 240, maxPay: 320 },
  { id: 17, name: "Tukang Paip Rumah Bocor", minPay: 240, maxPay: 320 }, { id: 18, name: "Juruelektrik Tiga Fasa", minPay: 250, maxPay: 340 },
  { id: 19, name: "Mekanik Motor Modenas/Yamaha", minPay: 260, maxPay: 350 }, { id: 20, name: "Foreman Bengkel Kereta", minPay: 270, maxPay: 360 },
  { id: 21, name: "Cikgu Tuisyen SPM Matematik", minPay: 260, maxPay: 350 }, { id: 22, name: "Jurutera Tapak Bina JKR", minPay: 280, maxPay: 380 },
  { id: 23, name: "Akauntan Audit LHDN", minPay: 290, maxPay: 390 }, { id: 24, name: "Pengurus Projek MRT3", minPay: 300, maxPay: 400 },
  { id: 25, name: "Peguam Mahkamah Majistret", minPay: 310, maxPay: 410 }, { id: 26, name: "Doktor Pakar Klinik Kesihatan", minPay: 320, maxPay: 420 },
  { id: 27, name: "Software Engineer Fullstack", minPay: 330, maxPay: 430 }, { id: 28, name: "Data Scientist Machine Learning", minPay: 340, maxPay: 440 },
  { id: 29, name: "Pilot AirAsia / MAS", minPay: 350, maxPay: 450 }, { id: 30, name: "Kapten Kapal Dagang Antarabangsa", minPay: 350, maxPay: 450 },
  { id: 31, name: "Arkitek Bangunan Pencakar Langit", minPay: 340, maxPay: 440 }, { id: 32, name: "Pakar Bedah Jantung", minPay: 360, maxPay: 460 },
  { id: 33, name: "Trader Forex Pacak Signal", minPay: 200, maxPay: 350 }, { id: 34, name: "Pelombong Bitcoin / Kripto", minPay: 220, maxPay: 360 },
  { id: 35, name: "Content Creator YouTube", minPay: 240, maxPay: 370 }, { id: 36, name: "Streamer Mobile Legends", minPay: 250, maxPay: 380 },
  { id: 37, name: "Tukang Jahit Baju Melayu", minPay: 180, maxPay: 260 }, { id: 38, name: "Web Developer Freelance", minPay: 300, maxPay: 420 },
  { id: 39, name: "Ejen Insurans Takaful", minPay: 210, maxPay: 300 }, { id: 40, name: "Pengurus Cawangan Bank", minPay: 320, maxPay: 430 },
  { id: 41, name: "Cef Eksekutif Hotel 5 Bintang", minPay: 330, maxPay: 440 }, { id: 42, name: "Jurugambar Acara Perkahwinan", minPay: 230, maxPay: 320 },
  { id: 43, name: "Juruaudit Forensik SPRM", minPay: 300, maxPay: 410 }, { id: 44, name: "Kontraktor Bina Banglo", minPay: 320, maxPay: 430 },
  { id: 45, name: "Ahli Farmasi Berdaftar", minPay: 310, maxPay: 420 }, { id: 46, name: "Pakar Psikologi Kaunseling", minPay: 300, maxPay: 410 },
  { id: 47, name: "Penganalisis Keselamatan Siber", minPay: 340, maxPay: 450 }, { id: 48, name: "Pakar Ekonomi Negara", minPay: 350, maxPay: 460 },
  { id: 49, name: "Pelabur Saham Bursa Malaysia", minPay: 360, maxPay: 480 }, { id: 50, name: "CEO Konglomerat Korporat", minPay: 380, maxPay: 500 }
];

// =========================================================================
// 🏎️ 5. SHOWROOM 40 KENDERAAN ASLI MALAYSIA (20 MOTOR + 20 KERETA)
// =========================================================================
const VEHICLES = [
  // 20 MOTOSIKAL
  { id: "ex5", name: "Honda EX5 High Power 🛵", price: 3000, type: "Motor", speed: 50, desc: "Lagenda sejati, minyak jimat macam minum air paip" },
  { id: "wave125", name: "Honda Wave 125i Ultimo 🛵", price: 5500, type: "Motor", speed: 55, desc: "Selesa buat pusing kampung & hantar parcel" },
  { id: "lagenda", name: "Yamaha Lagenda 115Z 🛵", price: 6000, type: "Motor", speed: 58, desc: "Handle ringan, sedap buat selit traffic jem" },
  { id: "lc135", name: "Yamaha LC135 5-Speed V8 🏍️", price: 7500, type: "Motor", speed: 65, desc: "Pickup sedap, favourite budak sekolah petang-petang" },
  { id: "y15", name: "Yamaha Y15ZR (Ysuku) Monster 🏍️", price: 10000, type: "Motor", speed: 72, desc: "Raja drag Melayu, dyno setting cecah highway" },
  { id: "rs150", name: "Honda RS150R Repsol V2 🏍️", price: 10500, type: "Motor", speed: 73, desc: "Enjin DOHC tahan lasak, sedap buat long distance" },
  { id: "nvx", name: "Yamaha NVX 155 ABS V2 🛵", price: 12000, type: "Motor", speed: 75, desc: "Skuter smart, meter digital ada tachometer" },
  { id: "nmax", name: "Yamaha NMAX 155 Maxi 🛵", price: 13000, type: "Motor", speed: 74, desc: "Kusyen sofa empuk, ride santai tak sakit pinggang" },
  { id: "r15", name: "Yamaha YZF-R15M Quickshifter 🏍️", price: 14000, type: "Motor", speed: 78, desc: "Rupa superbike mini, ada traction control" },
  { id: "cbr150", name: "Honda CBR150R Fireblade 🏍️", price: 14500, type: "Motor", speed: 79, desc: "Aerodinamik tajam, potong angin tak goyang" },
  { id: "adv160", name: "Honda ADV 160 Adventure 🛵", price: 15000, type: "Motor", speed: 76, desc: "Suspensi showa, redah lopak jalan tar selamba" },
  { id: "z250", name: "Kawasaki Z250 Twin Naked 🏍️", price: 21000, type: "Motor", speed: 85, desc: "Bunyi 2 silinder padu, tork garang gear rendah" },
  { id: "ninja250", name: "Kawasaki Ninja 250 SE 🏍️", price: 22000, type: "Motor", speed: 88, desc: "Sport fairing ikonik, topspeed lebuhraya mantap" },
  { id: "mt07", name: "Yamaha MT-07 CP2 Crossplane 🏍️", price: 40000, type: "Motor", speed: 105, desc: "Tork monster, pulas sikit terus tayar depan angkat" },
  { id: "z800", name: "Kawasaki Z800 4-Silinder 🏍️", price: 48000, type: "Motor", speed: 115, desc: "Bunyi ngauman inline-4 padu menggegar lorong" },
  { id: "r6", name: "Yamaha YZF-R6 Scream 16k RPM 🏍️", price: 85000, type: "Motor", speed: 135, desc: "Jeritan enjin Formula 1, penakluk selekoh trek" },
  { id: "zx6r", name: "Kawasaki ZX-6R Ninja 636 🏍️", price: 90000, type: "Motor", speed: 140, desc: "Kuasa supersport 636cc maut, pecutan kilat" },
  { id: "s1000rr", name: "BMW S1000RR M-Package 🚀", price: 175000, type: "Motor", speed: 165, desc: "Superbike Jerman tercanggih, radar cruise & wheelie control" },
  { id: "panigale", name: "Ducati Panigale V4S Corse 🚀", price: 180000, type: "Motor", speed: 170, desc: "Eksotik Itali merah menyala, raja litar antarabangsa" },
  { id: "h2", name: "Kawasaki Ninja H2 Supercharged 🚀", price: 250000, type: "Motor", speed: 190, desc: "Turbin supercharged aeroangkasa, peluru darat terpantas" },

  // 20 KERETA
  { id: "kancil", name: "Perodua Kancil 660 Manual 🚗", price: 5000, type: "Kereta", speed: 45, desc: "Kereta kompak rakyat, parking celah tiang pun lepas" },
  { id: "iswara", name: "Proton Iswara Aeroback 1.3 🚗", price: 8000, type: "Kereta", speed: 50, desc: "Kereta kebal lagenda, aircond sejuk beku macam kutub utara" },
  { id: "saga", name: "Proton Saga BLM 1.3 CamPro 🚗", price: 12000, type: "Kereta", speed: 55, desc: "Sedan harian keluarga, bonet muat beg balik kampung" },
  { id: "wira", name: "Proton Wira 1.5 GLi Injection 🚗", price: 15000, type: "Kereta", speed: 60, desc: "Chassis sedap, platform terbaik sumbat enjin GSR/Mivec" },
  { id: "preve", name: "Proton Preve 1.6 CFE Turbo 🚗", price: 40000, type: "Kereta", speed: 75, desc: "Handling Lotus mantap, cornering laju tak buang belakang" },
  { id: "persona", name: "Proton Persona VVT Premium 🚗", price: 45000, type: "Kereta", speed: 70, desc: "Pemanduan harian selesa, jimat minyak & moden" },
  { id: "myvi", name: "Perodua Myvi King 1.5 AV 👑", price: 50000, type: "Kereta", speed: 82, desc: "Raja Segala Jalan Raya Malaysia, boleh terbang & redah banjir" },
  { id: "x50", name: "Proton X50 TGDi Flagship 🚙", price: 90000, type: "Kereta", speed: 95, desc: "SUV Turbo 3-silinder berkuasa dengan bumbung panoramik" },
  { id: "vios", name: "Toyota Vios Dugong GR-S 🚗", price: 95000, type: "Kereta", speed: 85, desc: "Suspensi talaan GR-Sport, tahan lasak jarang masuk bengkel" },
  { id: "x70", name: "Proton X70 Premium AWD 🚙", price: 120000, type: "Kereta", speed: 100, desc: "SUV Eksekutif mewah, kabin senyap kedap bunyi highway" },
  { id: "civic", name: "Honda Civic FC 1.5 Ketam Turbo 🏎️", price: 130000, type: "Kereta", speed: 110, desc: "VTEC Turbo kegilaan ramai, lampu belakang macam sepit ketam" },
  { id: "accord", name: "Honda Accord 1.5 TC-P VIP 🚘", price: 180000, type: "Kereta", speed: 120, desc: "Sedan segmen-D VIP gaya bos besar korporat" },
  { id: "alphard", name: "Toyota Alphard 3.5 Executive 🚐", price: 350000, type: "Kereta", speed: 95, desc: "Lambang kekayaan jutawan, pilot seat urut automatik" },
  { id: "mustang", name: "Ford Mustang 5.0 GT V8 🏎️", price: 550000, type: "Kereta", speed: 145, desc: "Muscle car garang Amerika, bunyi deruman V8 mengaum" },
  { id: "gtr", name: "Nissan GT-R R35 Nismo Godzilla 🏎️", price: 650000, type: "Kereta", speed: 165, desc: "Godzilla Jepun, launch control AWD tembak macam peluru" },
  { id: "m4", name: "BMW M4 Competition G82 🏎️", price: 750000, type: "Kereta", speed: 170, desc: "Grille hidung besar, raja drift litar dengan imbangan 50:50" },
  { id: "c63", name: "Mercedes-AMG C63s V8 BiTurbo 🏎️", price: 780000, type: "Kereta", speed: 172, desc: "Kuasa AMG buatan tangan, letupan ekzos padu di gear tinggi" },
  { id: "ferrari", name: "Ferrari 488 Pista V8 🏎️", price: 1500000, type: "Kereta", speed: 185, desc: "Kuda jingkrak Itali tulen, aerodinamik litar F1 sebenar" },
  { id: "lambo", name: "Lamborghini Huracan EVO V10 🏎️", price: 1600000, type: "Kereta", speed: 190, desc: "Banteng Itali mengamuk, jeritan enjin V10 gegar cermin rumah" },
  { id: "911", name: "Porsche 911 GT3 RS Weissach 🏎️", price: 1800000, type: "Kereta", speed: 195, desc: "Senjata litar terhebat dunia, spoiler tinggi penakluk rekod" }
];

// =========================================================================
// 🔧 6. BENGKEL MODIFIKASI DINAMIK
// =========================================================================
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

// =========================================================================
// 🏴‍☠️ 7. BLACK MARKET & 15 MISI UNDERWORLD
// =========================================================================
const BLACKMARKET_ITEMS = [
  { id: 1, name: "Alat Skimming Mesin ATM 📟", price: 20000, desc: "Gajet godam kad ATM lorong gelap" },
  { id: 2, name: "Flash-Drive Decrypter Bank 💾", price: 50000, desc: "Pintas firewall keselamatan & godam akaun bank sasaran" },
  { id: 3, name: "EMP Radio Jammer Polis 📡", price: 100000, desc: "Kacau frekuensi radio peronda polis pelabuhan" },
  { id: 4, name: "Kad Akses VIP Kasino 💳", price: 250000, desc: "Buka pintu bilik kebal kasino underground" },
  { id: 5, name: "Flipper Zero Modded Cyber 🐬", price: 500000, desc: "Alat godam induk infrastruktur pangkalan data & bank target" },
  { id: 6, name: "Radar Detector Penguatkuasa 🛰️", price: 15000, desc: "Gajet amaran awal potong 20% risiko ditangkap polis" },
  { id: 7, name: "Dokumen Pelepasan Kastam Palsu 📄", price: 12000, desc: "Pelepasan segera sekatan roadblock pelabuhan" },
  { id: 8, name: "Van Panel Dinding Berlapis 🚐", price: 35000, desc: "Logistik darat kalis imbasan x-ray sekatan jalan" },
  { id: 9, name: "Bot Pancung 4 Enjin Yamaha 🚤", price: 45000, desc: "Logistik laut meredah laluan tikus perairan" },
  { id: 10, name: "Dron Kargo Penglihatan Malam 🛸", price: 28000, desc: "Hantar bungkusan kontraban pintas pagar sempadan" },
  { id: 11, name: "Cyber Bypass Dongle 🖲️", price: 18000, desc: "Kunci perkakasan bajet untuk lancarkan eksploitasi godam bank" }
];

const CRIMES = [
  { id: 1, name: "Ragut Beg Tepi Jalan 👜", rewardMin: 1500, rewardMax: 3500, fine: 1000, stars: 1 },
  { id: 2, name: "Rompak Kedai Runcit Acheh 🏪", rewardMin: 3500, rewardMax: 7000, fine: 2500, stars: 1 },
  { id: 3, name: "Kopek Mangga Motor Parkir 🏍️", rewardMin: 6000, rewardMax: 12000, fine: 4000, stars: 2 },
  { id: 4, name: "Pecah Masuk Kedai Emas 💍", rewardMin: 15000, rewardMax: 30000, fine: 8000, stars: 2 },
  { id: 5, name: "Rompak Banglo Orang Kaya 🏡", rewardMin: 30000, rewardMax: 60000, fine: 15000, stars: 3 },
  { id: 6, name: "Skimming Mesin ATM 🏧", rewardMin: 60000, rewardMax: 120000, reqItem: 1, fine: 25000, stars: 3 },
  { id: 7, name: "Seludup Rokok & Vape Kontraban 🚬", rewardMin: 75000, rewardMax: 140000, reqItem: 8, fine: 30000, stars: 3 },
  { id: 8, name: "Seludup Minuman Keras Bebas Cukai 🍾", rewardMin: 90000, rewardMax: 180000, reqItem: 9, fine: 35000, stars: 3 },
  { id: 9, name: "Godam Sistem Bank Pusat 💻", rewardMin: 150000, rewardMax: 300000, reqItem: 2, fine: 50000, stars: 4 },
  { id: 10, name: "Seludup Cip AI & Kad Grafik GPU 🧠", rewardMin: 180000, rewardMax: 350000, reqItem: 10, fine: 60000, stars: 4 },
  { id: 11, name: "Penyeludupan Kontraban Port Klang 🚢", rewardMin: 250000, rewardMax: 500000, reqItem: 3, fine: 80000, stars: 4 },
  { id: 12, name: "Heist Bilik Kebal Kasino Genting 🎰", rewardMin: 450000, rewardMax: 900000, reqItem: 4, fine: 120000, stars: 5 },
  { id: 13, name: "Seludup Supercar Tanpa AP 🏎️", rewardMin: 600000, rewardMax: 1200000, reqItem: 9, fine: 150000, stars: 5 },
  { id: 14, name: "Eksploitasi Darkweb Zero-Day 🌐", rewardMin: 1000000, rewardMax: 2500000, reqItem: 5, fine: 200000, stars: 5 },
  { id: 15, name: "Godam Induk Penguatkuasa Padam Rekod 🏛️", rewardMin: 2000000, rewardMax: 5000000, reqItem: 5, fine: 350000, stars: 5 }
];

// =========================================================================
// 🏢 8. SEKTOR HARTANAH & PENDAPATAN PASIF SEWAAN (ID 1 - 12)
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
  { id: 12, name: "Pulau Peribadi Laut China Selatan 👑", price: 300000000, rent: 2800000 }
];

// =========================================================================
// 🍔 9. WARUNG MAKANAN AIRI
// =========================================================================
const FOOD_ITEMS = [
  { id: "tehtarik", name: "Teh Tarik Kaw Buih 🧋", price: 4, desc: "Potong 15s cooldown kerja" },
  { id: "roticanai", name: "Roti Canai Banjir Dhal 🥞", price: 7, desc: "Potong 30s cooldown kerja" },
  { id: "nasilemak", name: "Nasi Lemak Sotong Padu 🍛", price: 12, desc: "Reset serta-merta semua cooldown kerja!" },
  { id: "burger", name: "Burger Ramly Special Cheese 🍔", price: 15, desc: "Kenyang padu, kurangkan denda balai 10%" }
];

// =========================================================================
// 🎣 10. SISTEM MEMANCING BERPERINGKAT (TIER-BASED FISHING)
// =========================================================================
const FISH_DATABASE = [
  { name: "Kasut But Getah Koyak 🥾", price: 0, tier: "🗑️ [JUNK]", weight: 10 },
  { name: "Tayar Kereta Buruk Berlumut 🛞", price: 0, tier: "🗑️ [JUNK]", weight: 5 },
  { name: "Ikan Kembung Segar Pasar 🐟", price: 250, tier: "🌱 [COMMON]", weight: 15 },
  { name: "Ikan Gelama Muara 🐟", price: 450, tier: "🌱 [COMMON]", weight: 12 },
  { name: "Ikan Keli Afrika Bersaiz L 🐡", price: 700, tier: "🌱 [COMMON]", weight: 8 },
  { name: "Udang Galah Sungai Bernilai 🦐", price: 1500, tier: "🌿 [UNCOMMON]", weight: 10 },
  { name: "Sotong Kurita Mini 🐙", price: 2800, tier: "🌿 [UNCOMMON]", weight: 8 },
  { name: "Ketam Bunga Segar 🦀", price: 3500, tier: "🌿 [UNCOMMON]", weight: 7 },
  { name: "Ikan Siakap Muara Padu 🐠", price: 6500, tier: "⭐ [RARE]", weight: 6 },
  { name: "Ikan Jenahak Merah Laut Dalam 🐡", price: 9000, tier: "⭐ [RARE]", weight: 5 },
  { name: "Pari Gergasi Layang-Layang 🦈", price: 14000, tier: "⭐ [RARE]", weight: 3 },
  { name: "Ikan Kerapu Bara Monster 🦈", price: 28000, tier: "💼 [EPIC]", weight: 3 },
  { name: "Tuna Sirip Kuning Gred A 🐟", price: 45000, tier: "💼 [EPIC]", weight: 2.5 },
  { name: "Ketam Raja Alaska King Crab 🦀", price: 60000, tier: "💼 [EPIC]", weight: 1.5 },
  { name: "Jerung Tukul Pesisir Pantai 🦈", price: 120000, tier: "🏴‍☠️ [LEGENDARY]", weight: 1.5 },
  { name: "Sotong Gergasi Kraken Rahsia 🐙", price: 250000, tier: "🏴‍☠️ [LEGENDARY]", weight: 1.0 },
  { name: "Raja Ikan Temoleh Sungai Perak 👑", price: 400000, tier: "🏴‍☠️ [LEGENDARY]", weight: 0.7 },
  { name: "Ikan Purba Coelacanth Emas 🌟", price: 1000000, tier: "👑 [MYTHIC]", weight: 0.5 },
  { name: "Naga Laut Megalodon Siber 🐉", price: 2500000, tier: "👑 [MYTHIC]", weight: 0.3 }
];

function catchFishRandom() {
  const totalWeight = FISH_DATABASE.reduce((sum, item) => sum + item.weight, 0);
  let randomNum = Math.random() * totalWeight;
  for (const f of FISH_DATABASE) {
    if (randomNum < f.weight) return f;
    randomNum -= f.weight;
  }
  return FISH_DATABASE[0];
}

// =========================================================================
// 🔥 11. PERPUSTAKAAN ROASTING MELAYU SEMPOI
// =========================================================================
const ROASTS = {
  kerja: [
    "Wah berpeluh dahi macam lari marathon, gaji masuk cukup beli kuaci je!",
    "Rajin betul buat shift harini, ingatkan pemalas tegar nombor satu.",
    "Gaji dah masuk poket. Muka ada senyum, tapi baki bank menangis tengok hutang.",
    "Dapat gaji tu beringat sikit, jangan petang ni terus habis kat warung kopi hipster!",
    "Kerja macam nak gila tapi poket macam kena hisap jembalang. Teruskan usaha bro!",
    "Baguslah rajin kerja, daripada dok mengharap bantuan kerajaan tak sudah-sudah.",
    "Duit gaji dah landing. Jangan lupa bayar hutang kawan yang kau buat-buat lupa tu.",
    "Shift selesai! Ingat, rezeki halal biar lambat asal selamat daripada tidur lokap.",
    "Tengok jam dah habis shift, tapi baki akaun macam tak bergerak. Sabar jelah ye.",
    "Kerja tekun macam nak beli kapal terbang, sekali tengok gaji lepas beli beras je.",
    "Alhamdulillah ada rezeki harini, jangan dok mengeluh macam terpaling penat dalam dunia.",
    "Gaji ciput pun gaji jugak. Simpan sikit, jangan dok belanja awek cyber tak tentu pasal!",
    "Penat lelah berbaloi! Sekurang-kurangnya kau tak mintak sedekah tepi jalan.",
    "Gaji masuk terus rasa macam jutawan sekejap, padahal esok komitmen dah tunggu.",
    "Peluh jantan mengalir demi sesuap nasi. Mantap anak muda berjiwa kental!",
    "Ingatkan tengah tidur tadi, rupanya sempat jugak siapkan kerja. Cayalah!",
    "Kutip duit gaji ni elok-elok, jangan bagi hilang tercicir celah poket seluar bocor.",
    "Bagus kerja rajin, nanti bos tengok boleh la naik pangkat... dalam mimpi lah tapi.",
    "Selesai satu tugasan! Jangan dok mengular lama sangat kat pantry tu pulak.",
    "Rezeki jangan ditolak, musuh jangan dicari. Nah ambil slip gaji kau ni!"
  ],
  mancing_win: [
    "Fuh tarikan padu! Joran melengkung cecah air, ikan mahal sangkut kat mata kail!",
    "Rezeki nelayan siber! Ikan berat berkilo mendarat atas jeti.",
    "Masyuk poket bro! Sekali sentap terus dapat ikan gred hotel lima bintang.",
    "Mata kail bergetar kencang, hasil tangkapan buat kaki pancing sebelah termenung jeles!",
    "Umpan cacing tanah kau menjadi! Ikan eksotik berenang masuk jaring.",
    "Mantap skil baling joran! Ikan ni kalau jual kat pasar borong confirm rebutan.",
    "Tangkapan luar biasa! Bukan kaleng-kaleng ikan yang kau naikkan harini.",
    "Joran carbon fiber buat kerja! Duit jualan ikan masuk akaun tunai melambung tinggi.",
    "Monster laut berjaya ditewaskan! Pukul ekor ikan ni pun dah buat jeti bergegar.",
    "Ong gila harini! Balik rumah masak tiga rasa lauk ikan kayangan."
  ],
  mancing_sampah: [
    "Acah kaki pancing tegar, sekali sentap dapat kasut but getah reput. Buat pekasam la bro!",
    "Joran melengkung macam nak patah, sekali naik tayar kereta buruk. Memang lawak!",
    "Penat berpeluh tunggu tepi jeti, sampah sungai jugak yang sudi makan umpan kau.",
    "Ikan nampak kau terus berenang lari ke laut dalam. Balik tidur la bro!",
    "Sentap laju macam kilat, yang naik cuma plastik sampah tomyam basi."
  ],
  hackbank_win: [
    "Fuh hacker kelas atasan! Firewall bank kawan kau roboh macam benteng pasir!",
    "Padu gila! Duit dalam akaun bank mangsa disedut licin tanpa tinggalkan jejak.",
    "Mangsa check baki Maybank terus jatuh kerusi, duit hilang terbang masuk akaun kau!",
    "Hebat godam! Perkakasan Black Market kau memang berfungsi padu malam ni.",
    "Duit bank mangsa disapu bersih! Ni kalau dia tahu confirm meraung tepi bucu katil.",
    "Cip AI dan Dongle gelap kau buat kerja bersih. Master hacker sejati!",
    "Pintasan sistem perbankan berjaya 100%! Belanja satu group ngeteh mamak cepat.",
    "Mangsa ingat duit dalam bank kebal, sekali kau tebuk terus bocor teruk!",
    "Pantas macam kilat menyelinap dalam pelayan bank. Baki kau membuncit kaya.",
    "Berjaya rembat dana simpanan! Jangan lupa cuci duit tu cepat sebelum dikesan."
  ],
  hackbank_fail: [
    "Acah Mr. Robot sekali firewall bank tendang muka kau balik. Duduk lokap padan muka!",
    "Gagal godam! Sistem anti-fraud bank kesan IP kau terus hon siren balai polis!",
    "Dongle cap ayam ke tu? Baru cucuk terus meletup kena denda RM 1,500!",
    "Ingat senang nak tebuk bank orang? Kan dah kena humban lokap!",
    "Polis siber gelak besar tengok percubaan amatur kau. Menginap la dalam lokap tu!"
  ],
  crime_win: [
    "Fuh licik betul! Polis peronda pun rabun tak nampak kau rembat duit haram ni.",
    "Bagus bakat menyamun kau, mak bapak tengok pun geleng kepala bangga!",
    "Duit haram masuk poket! Hati-hati jangan sampai kantoi kena sebat kat lokap nanti.",
    "Operasi underground settle bersih! Jangan pamer sangat kekayaan tu kang polis hidu.",
    "Senyap-senyap buat kerja, hasil lumayan! Kingpin underworld tengok pun tabik."
  ],
  crime_fail: [
    "Muka macam perompak legend sekali kopek mangga pun kantoi, tepuk dahi polis balai!",
    "Acah-acah kingpin sekali polis hon terus terkencing dalam seluar. Masuk lokap padan muka!",
    "Skill menyamun taraf budak tadika. Duduk lokap diam-diam renung dinding tu!",
    "Nak buat jahat tapi otak tinggal kat rumah. Kan dah kena denda dengan mahkamah!",
    "Baru nak seluk tangan, siren polis dah berbunyi. Lari macam lipas kudung pun kena tangkap!"
  ],
  race_win: [
    "Jentera berdesup tinggalkan asap tebal! Lawan kau tengah menangis tolak motor kat belakang.",
    "Menang drag race malam ni! Boleh la sembang kencang kat kedai mamak sampai subuh.",
    "Pecutan kilat membelah angin malam! Lawan kau ingatkan tengah lumba dengan roket.",
    "Potong angin di garisan penamat! Jentera padu, pemandu ada skil bukan sembang kari.",
    "Lawan tergamam tengok lampu belakang kau hilang dalam kegelapan highway."
  ],
  race_lose: [
    "Acah pelumba F1 sekali terbabas cium divider jalan. Kos bengkel lagi mahal dari maruah kau!",
    "Bawa jentera macam siput sedut ada hati nak ajak drag race. Pergi balik kampung la!",
    "Enjin berasap tayar meletup! Mekanik bengkel gelak besar tengok dompet kau kena kikis.",
    "Ketinggalan 5 tiang lampu kat belakang. Baik kau kayuh basikal lajak je lepas ni!",
    "Baru masuk gear 3 enjin dah semput. Pergi hantar bengkel buat overhaul dulu!"
  ],
  rompak_win: [
    "Aduh kesian mangsa kena rembat! Lain kali simpan duit dalam bank bukan bawah bantal.",
    "Penyamun terlatih! Mangsa tercari-cari dompet dia ingat tertinggal kat kedai tomyam.",
    "Masyuk poket merompak kawan sendiri. Kawan makan kawan betul zaman siber ni!",
    "Tangan pantas menyeluk poket mangsa! Duit tunai berpindah milik dalam sekelip mata.",
    "Mangsa tengah leka main phone, kau rembat duit dia licin. Memang licik!"
  ],
  rompak_fail: [
    "Nak merompak kawan sekali kawan tu lagi gangster dari kau! Kena tibai free-free.",
    "Tangan terketar-ketar macam kena parkinson masa nak seluk poket. Kan dah kantoi!",
    "Gagal menyamun! Sekarang kau kena denda dan dihumban ke lokap, buat malu keturunan je.",
    "Mangsa tangkap tangan kau tengah seluk beg dia. Terus kena serah kat polis peronda!",
    "Baru nak pegang dompet orang, mangsa dah pusing tomoi muka kau. Berlebam biji mata!"
  ],
  casino_win: [
    "JACKPOT MELETUP! Bandar kasino menangis tengok duit berguni masuk akaun kau.",
    "Tuah ayam nampak di kaki, tuah kau menang judi gelap! Kaya cara haram sekejap.",
    "Pilihan tepat! Duit taruhan berlipat ganda masuk wallet macam air terjun.",
    "Bandar tepuk dahi, kau bersorak gembira! Jangan lupa cuci duit tu kat bisnes sah.",
    "Menang besar malam ni! Pergi belanja satu group makan tomyam segera!"
  ],
  casino_lose: [
    "Duit taruhan lesap sekelip mata! Bandar kasino senyum sinis simpan duit kau dalam peti.",
    "Kalah judi lagi! Kan dah pesan, rumah judi takkan pernah rugi, kau yang selalu kena!",
    "Tergamam tengok baki tunai jadi kosong. Balik rumah hisap jari la nampaknya.",
    "Mesin slot telan duit kau tanpa belas kasihan. Padan muka berangan nak cepat kaya!",
    "Kalah total di meja judi! Jangan dok mengamuk baling kerusi kasino pulak."
  ]
};

// =========================================================================
// 🏅 12. SISTEM LENCANA BERPERINGKAT (RARITY RANKED TEXT BADGES)
// =========================================================================
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

async function checkAndAwardBadges(user, sock, from) {
  const newBadges = [];
  const totalMoney = user.cash + user.bank;
  const userName = user.name;

  if (user.stats.works >= 5 && !user.badges.includes("🔨 [COMMON] Buruh Gigih")) {
    user.badges.push("🔨 [COMMON] Buruh Gigih");
    newBadges.push("🔨 [COMMON] Buruh Gigih");
  }
  if (user.stats.crimes >= 5 && !user.badges.includes("🕶️ [UNCOMMON] Pencuri Jalanan")) {
    user.badges.push("🕶️ [UNCOMMON] Pencuri Jalanan");
    newBadges.push("🕶️ [UNCOMMON] Pencuri Jalanan");
  }
  if (user.stats.works >= 20 && !user.badges.includes("💼 [RARE] Pekerja Berdedikasi")) {
    user.badges.push("💼 [RARE] Pekerja Berdedikasi");
    newBadges.push("💼 [RARE] Pekerja Berdedikasi");
  }
  if (user.stats.crimes >= 15 && !user.badges.includes("🥷 [RARE] Buronan Lincah")) {
    user.badges.push("🥷 [RARE] Buronan Lincah");
    newBadges.push("🥷 [RARE] Buronan Lincah");
  }
  if ((user.stats.racesWon || 0) >= 5 && !user.badges.includes("🏎️ [RARE] Kaki Drag Litar")) {
    user.badges.push("🏎️ [RARE] Kaki Drag Litar");
    newBadges.push("🏎️ [RARE] Kaki Drag Litar");
  }
  if ((user.stats.fishes || 0) >= 10 && !user.badges.includes("🎣 [RARE] Nelayan Muara")) {
    user.badges.push("🎣 [RARE] Nelayan Muara");
    newBadges.push("🎣 [RARE] Nelayan Muara");
  }
  if ((user.stats.bankHacks || 0) >= 5 && !user.badges.includes("💻 [EPIC] Pakar Siber Gelap")) {
    user.badges.push("💻 [EPIC] Pakar Siber Gelap");
    newBadges.push("💻 [EPIC] Pakar Siber Gelap");
  }
  if (user.stats.works >= 50 && !user.badges.includes("🏆 [EPIC] Raja Halal")) {
    user.badges.push("🏆 [EPIC] Raja Halal");
    newBadges.push("🏆 [EPIC] Raja Halal");
  }
  if (user.stats.crimes >= 35 && !user.badges.includes("💀 [EPIC] Dalang Jenayah")) {
    user.badges.push("💀 [EPIC] Dalang Jenayah");
    newBadges.push("💀 [EPIC] Dalang Jenayah");
  }
  if (user.vehicles.length >= 5 && !user.badges.includes("🚘 [EPIC] Pengumpul Jentera")) {
    user.badges.push("🚘 [EPIC] Pengumpul Jentera");
    newBadges.push("🚘 [EPIC] Pengumpul Jentera");
  }
  if (totalMoney >= 100000 && !user.badges.includes("💰 [LEGENDARY] Bangsawan Cyber")) {
    user.badges.push("💰 [LEGENDARY] Bangsawan Cyber");
    newBadges.push("💰 [LEGENDARY] Bangsawan Cyber");
  }
  if ((user.stats.racesWon || 0) >= 20 && !user.badges.includes("⚡ [LEGENDARY] Raja Rempit Kebangsaan")) {
    user.badges.push("⚡ [LEGENDARY] Raja Rempit Kebangsaan");
    newBadges.push("⚡ [LEGENDARY] Raja Rempit Kebangsaan");
  }
  if ((user.stats.fishes || 0) >= 30 && !user.badges.includes("🦈 [LEGENDARY] Pemburu Megalodon")) {
    user.badges.push("🦈 [LEGENDARY] Pemburu Megalodon");
    newBadges.push("🦈 [LEGENDARY] Pemburu Megalodon");
  }
  if (user.stats.crimes >= 60 && !user.badges.includes("🏴‍☠️ [LEGENDARY] Kingpin Underworld")) {
    user.badges.push("🏴‍☠️ [LEGENDARY] Kingpin Underworld");
    newBadges.push("🏴‍☠️ [LEGENDARY] Kingpin Underworld");
  }
  if (totalMoney >= 1000000 && !user.badges.includes("👑 [MYTHIC] Jutawan Trilion Airi")) {
    user.badges.push("👑 [MYTHIC] Jutawan Trilion Airi");
    newBadges.push("👑 [MYTHIC] Jutawan Trilion Airi");
  }
  if (user.vehicles.length >= 15 && !user.badges.includes("🌌 [MYTHIC] Maharaja Garaj")) {
    user.badges.push("🌌 [MYTHIC] Maharaja Garaj");
    newBadges.push("🌌 [MYTHIC] Maharaja Garaj");
  }

  for (const bName of newBadges) {
    const badgeCert = `╔═══════════════════════════╗
   🎖️ PENSIJILAN LENCANA RASMI
╚═══════════════════════════╝
🌐 AIRI'S CORNER RECOGNITION
👤 Penerima: *${userName}*
🏅 Lencana: *${bName}*
📜 Status: SAH TERPAUT DI PROFIL KAD ID`;
    await sock.sendMessage(from, { text: badgeCert }).catch(() => {});
  }
}

// =========================================================================
// 🚀 13. ENGINE UTAMA BAILEYS & PENGENDALI MESEJ WHATSAPP
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

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      currentQR = qr;
      isConnected = false;
    }
    if (connection === "close") {
      isConnected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBotEngine();
    } else if (connection === "open") {
      isConnected = true;
      currentQR = "";
      console.log("✅ BOT AIRI'S CORNER TELAH BERSAMBUNG KE WHATSAPP 24/7!");
    }
  });

  // SCAN ID NAMA ATAU BIO WHATSAPP SEBENAR
  sock.ev.on("group-participants.update", async (anu) => {
    if (anu.action === "add") {
      for (const num of anu.participants) {
        const cleanId = num.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        let detectedIdentity = "";

        try {
          const groupMeta = await sock.groupMetadata(anu.id);
          const pObj = groupMeta.participants.find(p => p.id === cleanId);
          if (pObj?.name || pObj?.notify) {
            detectedIdentity = pObj.name || pObj.notify;
          }
        } catch (e) {}

        if (!detectedIdentity) {
          try {
            const [contactInfo] = await sock.onWhatsApp(cleanId);
            if (contactInfo?.notify) detectedIdentity = contactInfo.notify;
          } catch (e) {}
        }

        if (!detectedIdentity) {
          try {
            const statusObj = await sock.fetchStatus(cleanId);
            if (statusObj?.status && statusObj.status.trim() !== "") {
              detectedIdentity = statusObj.status;
            }
          } catch (e) {}
        }

        if (!detectedIdentity || detectedIdentity.trim() === "") {
          detectedIdentity = `Warga #${num.slice(-4)}`;
        }

        const dbUser = getUser(cleanId, detectedIdentity);
        dbUser.name = detectedIdentity;
        updateUser(cleanId, dbUser);

        const welcomeText = 
`╔═══════════════════════════╗
   👋 SELAMAT DATANG KE AIRI'S CORNER
╚═══════════════════════════╝
👤 Identiti Disahkan: *${detectedIdentity}*
🎁 Starter Pack: +RM 500 & Badge [🌱 Warga Baru]
📜 Sila patuhi peraturan komuniti & jangan jadi batu kayu!

💡 Taip *.menu* untuk memulakan kerjaya & aktiviti RPG.`;

        await sock.sendMessage(anu.id, { text: welcomeText, mentions: [cleanId] }).catch(() => {});
      }
    }
  });

  // Auto Rekod Group
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
  // 🎲 30 RANDOM GROUP INTERACTIVE EVENTS (TERMASUK 5 EVENT TOLAK DUIT / PENALTI)
  // =========================================================================
  setInterval(async () => {
    const db = loadDB();
    if (!db.groups || db.groups.length === 0) return;

    const eventList = [
      // 25 Event Asal
      "airdrop", "roadblock", "boss", "soalan", "lelong",
      "jackpot_drop", "bantuan_zakat", "litar_kilat", "teka_nombor", "serbuan_sprm",
      "hacker_bounty", "kontraban_drop", "ribut_pasir", "pasar_karat", "pesta_makan",
      "godam_satelit", "petikan_emas", "teka_kata", "kejar_pelesit", "derma_kilat",
      "kotak_misteri2", "cabaran_iq", "sindiket_tumpas", "tiket_bertuah", "hujan_rahmat",
      // 🔥 5 Random Event Tolak Duit Baharu
      "audit_lhdn", "ransomware_attack", "saman_aes", "ahlong_serang", "poket_bocor"
    ];
    const chosenEvent = eventList[Math.floor(Math.random() * eventList.length)];

    for (const gId of db.groups) {
      if (!db.activeEvents) db.activeEvents = {};

      // =====================================================================
      // 🚨 5 EVENT TOLAK DUIT / PENALTI BAHARU
      // =====================================================================
      if (chosenEvent === "audit_lhdn") {
        db.activeEvents[gId] = { type: "audit_lhdn", safeUsers: [], expires: Date.now() + 45000 };
        saveDB(db);

        const msg = 
`╔═══════════════════════════╗
   🚨 SERBUAN AUDIT LEMBAGA HASIL (LHDN)
╚═══════════════════════════╝
🏛️ Penguatkuasa LHDN memeriksa aliran tunai mencurigakan!
⚠️ Warga dengan baki tunai $\ge$ RM 10,000 akan dikenakan *Cukai 10%*!

🛡️ Taip *.isytihar_cukai* dalam 45 saat untuk pelepasan cukai!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});

        setTimeout(async () => {
          const freshDB = loadDB();
          const ev = freshDB.activeEvents?.[gId];
          if (ev && ev.type === "audit_lhdn") {
            let penalized = [];
            for (let uid in freshDB.users) {
              const u = freshDB.users[uid];
              if (!ev.safeUsers.includes(uid) && u.cash >= 10000 && !OWNER_NUMBERS.some(n => uid.includes(n))) {
                const tax = Math.floor(u.cash * 0.10);
                u.cash -= tax;
                penalized.push(`• *${u.name}*: Cukai *-RM ${tax.toLocaleString()}*`);
                updateUser(uid, u);
              }
            }

            const resText = penalized.length > 0
              ? `🏛️ *AUDIT LHDN SELESAI!*\nCukai telah dipotong secara automatik daripada individu yang culas:\n\n${penalized.slice(0, 5).join("\n")}`
              : `🏛️ *AUDIT LHDN SELESAI:* Tiada tindakan diambil. Semua rekod diisytiharkan bersih.`;
            await sock.sendMessage(gId, { text: resText }).catch(() => {});
            delete freshDB.activeEvents[gId];
            saveDB(freshDB);
          }
        }, 45 * 1000);
      }

      else if (chosenEvent === "ransomware_attack") {
        db.activeEvents[gId] = { type: "ransomware", safeUsers: [], expires: Date.now() + 40000 };
        saveDB(db);

        const msg = 
`╔═══════════════════════════╗
   ☣️ SERANGAN RANSOMWARE GLITCH GRID
╚═══════════════════════════╝
👾 Virus siber merosakkan nod rangkaian peranti!
💸 Sistem akan menyedut *RM 2,500* daripada dompet yang tidak dilindungi!

🛡️ Taip *.pasang_antivirus* terpantas untuk sekat serangan!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});

        setTimeout(async () => {
          const freshDB = loadDB();
          const ev = freshDB.activeEvents?.[gId];
          if (ev && ev.type === "ransomware") {
            let victims = [];
            for (let uid in freshDB.users) {
              const u = freshDB.users[uid];
              if (!ev.safeUsers.includes(uid) && u.cash >= 2500 && !OWNER_NUMBERS.some(n => uid.includes(n))) {
                u.cash -= 2500;
                victims.push(`• *${u.name}*: Disapu *-RM 2,500*`);
                updateUser(uid, u);
              }
            }

            const resText = victims.length > 0
              ? `☣️ *SERANGAN VIRUS TAMAT!*\nRansomware berjaya memeras ugut wang mangsa berikut:\n\n${victims.slice(0, 5).join("\n")}`
              : `☣️ *GRID SELAMAT:* Semua warga sempat memasang firewall antivirus!`;
            await sock.sendMessage(gId, { text: resText }).catch(() => {});
            delete freshDB.activeEvents[gId];
            saveDB(freshDB);
          }
        }, 40 * 1000);
      }

      else if (chosenEvent === "saman_aes") {
        let fineList = [];
        for (let uid in db.users) {
          const u = db.users[uid];
          if (u.vehicles && u.vehicles.length >= 2 && u.cash >= 1800 && !OWNER_NUMBERS.some(n => uid.includes(n))) {
            u.cash -= 1800;
            fineList.push(`• *${u.name}*: Saman Laju *-RM 1,800*`);
            updateUser(uid, u);
          }
        }

        const msg = fineList.length > 0
          ? `╔═══════════════════════════╗\n   📸 KAMERA AES HIGHWAY MERAKAM LAJU\n╚═══════════════════════════╝\n🏎️ Penguatkuasa mengeluarkan notis saman kelajuan automatik:\n\n${fineList.slice(0, 5).join("\n")}\n\n💡 _Duit saman telah dipotong dari baki tunai!_`
          : `╔═══════════════════════════╗\n   📸 KAMERA AES HIGHWAY AKTIF\n╚═══════════════════════════╝\n🚗 Tiada pemandu dikesan memecut melebihi had laju kebangsaan!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "ahlong_serang") {
        let debtHits = [];
        for (let uid in db.users) {
          const u = db.users[uid];
          if (u.debt > 0 && u.cash >= 3000 && !OWNER_NUMBERS.some(n => uid.includes(n))) {
            u.cash -= 3000;
            debtHits.push(`• *${u.name}*: Simbah Cat & Denda *-RM 3,000*`);
            updateUser(uid, u);
          }
        }

        const msg = debtHits.length > 0
          ? `╔═══════════════════════════╗\n   🦈 GENG AH LONG MENYERBU RUMAH!\n╚═══════════════════════════╝\n🩸 Peminjam liat didenda kerana tunggakan faedah:\n\n${debtHits.slice(0, 5).join("\n")}\n\n⚠️ _Sila langsaikan hutang melalui .bayar_ahlong segera!_`
          : `╔═══════════════════════════╗\n   🦈 RONDAAN GENG AH LONG\n╚═══════════════════════════╝\n🏢 Tiada penghutang ingkar ditemui di kawasan ini!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "poket_bocor") {
        const userKeys = Object.keys(db.users);
        if (userKeys.length > 0) {
          const randomUserKey = userKeys[Math.floor(Math.random() * userKeys.length)];
          const victim = db.users[randomUserKey];
          if (victim && victim.cash >= 1200 && !OWNER_NUMBERS.some(n => randomUserKey.includes(n))) {
            victim.cash -= 1200;
            updateUser(randomUserKey, victim);
            const msg = 
`╔═══════════════════════════╗
   🕳️ MALANG TIDAK BERBAU: POKET BOCOR!
╚═══════════════════════════╝
😱 Seluar *${victim.name}* koyak celah poket!
💸 Wang tunai sebanyak *-RM 1,200* tercicir dan hilang di jalanan.

💬 _"Lain kali simpan duit dalam akaun .deposit!"_`;
            await sock.sendMessage(gId, { text: msg }).catch(() => {});
          }
        }
      }

      // =====================================================================
      // 📦 EVENT-EVENT ASAL
      // =====================================================================
      else if (chosenEvent === "airdrop") {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const reward = Math.floor(5000 + Math.random() * 5000);
        db.activeEvents[gId] = { type: "airdrop", code, reward, expires: Date.now() + 120000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🪂 KOTAK AIRDROP TERHEMPAS!\n╚═══════════════════════════╝\n📦 Peti bekalan tunai cyber jatuh di tengah group!\n💰 Nilai Loot: *RM ${reward.toLocaleString()}*\n🔑 Kod Akses: *${code}*\n\n⚡ Taip *.rebut ${code}* terpantas untuk kaut duit!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "roadblock") {
        db.activeEvents[gId] = { type: "roadblock", expires: Date.now() + 180000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🚨 SEKATAN ROADBLOCK POLIS & JPJ\n╚═══════════════════════════╝\n🚔 Pihak berkuasa membuka sekatan jalan raya mengejut!\n⚠️ Warga Wanted berisiko disaman & ditahan.\n\n🛡️ Taip *.tunjuk_lesen* untuk pelepasan & bonus RM 1,000!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "boss") {
        db.activeEvents[gId] = { type: "boss", hp: 5, maxHp: 5, reward: 25000, attackers: [], expires: Date.now() + 180000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   👹 SERANGAN BOSS: KINGPIN MAFIA\n╚═══════════════════════════╝\n🦹 Boss Underworld mengganas di kawasan group!\n❤️ Nyawa Boss: [ 5 / 5 HP ]\n💰 Ganjaran Kongsi: *RM 25,000*\n\n⚔️ Taip *.serang_boss* beramai-ramai untuk tumpaskan!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "soalan") {
        const mathA = Math.floor(20 + Math.random() * 40);
        const mathB = Math.floor(15 + Math.random() * 35);
        const ans = (mathA * 2 + mathB).toString();
        db.activeEvents[gId] = { type: "soalan", ans, reward: 5000, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🧠 KUIZ MINDA SIBER KILAT\n╚═══════════════════════════╝\n❓ Soalan: *Berapakah (${mathA} x 2) + ${mathB}?*\n💰 Hadiah Pintar: *RM 5,000*\n\n💡 Taip *.jawab [jawapan]* (Contoh: *.jawab 50*)`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "lelong") {
        const auctionTypes = ["supercar", "rare_item", "cash_box"];
        const aType = auctionTypes[Math.floor(Math.random() * auctionTypes.length)];

        let rewardDetails = {};
        let initialBid = 10000;
        let titleName = "";

        if (aType === "supercar") {
          const rareCars = [
            { id: "m4", name: "BMW M4 Competition G82 🏎️", val: 750000 },
            { id: "gtr", name: "Nissan GT-R R35 Nismo Godzilla 🏎️", val: 650000 },
            { id: "h2", name: "Kawasaki Ninja H2 Supercharged 🚀", val: 250000 },
            { id: "mustang", name: "Ford Mustang 5.0 GT V8 🏎️", val: 550000 }
          ];
          const chosenCar = rareCars[Math.floor(Math.random() * rareCars.length)];
          rewardDetails = { type: "car", item: chosenCar };
          initialBid = 20000;
          titleName = `GERAN RASMI: ${chosenCar.name.toUpperCase()} (Bernilai RM ${chosenCar.val.toLocaleString()})`;
        } else if (aType === "rare_item") {
          const rareItems = [
            { id: 5, name: "Flipper Zero Modded Cyber 🐬", val: 500000 },
            { id: 4, name: "Kad Akses VIP Kasino 💳", val: 250000 },
            { id: 3, name: "EMP Radio Jammer Polis 📡", val: 100000 }
          ];
          const chosenItem = rareItems[Math.floor(Math.random() * rareItems.length)];
          rewardDetails = { type: "bm", item: chosenItem };
          initialBid = 15000;
          titleName = `GAJET HITAM RARE: ${chosenItem.name.toUpperCase()} (Bernilai RM ${chosenItem.val.toLocaleString()})`;
        } else {
          const cashAmt = Math.floor(250000 + Math.random() * 500000);
          rewardDetails = { type: "cash", amount: cashAmt };
          initialBid = 10000;
          titleName = `PETI WANG KONTRAK BERNILAI RM ${cashAmt.toLocaleString()}`;
        }

        db.activeEvents[gId] = {
          type: "lelong",
          highestBid: initialBid,
          winner: null,
          winnerName: null,
          rewardDetails,
          titleName,
          expires: Date.now() + 120000
        };
        saveDB(db);

        const msg = `╔═══════════════════════════╗\n   🏷️ LELONGAN EKSKLUSIF AIRI GRID!\n╚═══════════════════════════╝\n📦 Kargo Lelongan: *${titleName}*\n💵 Bidaan Pembukaan: *RM ${initialBid.toLocaleString()}*\n\n📢 Taip *.bida [jumlah]* untuk letak tawaran tertinggi!\n⏳ Palu lelongan akan diketuk tepat dalam masa 2 minit (120 saat)!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});

        setTimeout(async () => {
          const freshDB = loadDB();
          const ev = freshDB.activeEvents?.[gId];
          if (ev && ev.type === "lelong") {
            if (ev.winner && ev.winnerName) {
              const winnerUser = getUser(ev.winner);
              winnerUser.cash = Math.max(0, winnerUser.cash - ev.highestBid);

              let rewardResultText = "";
              if (ev.rewardDetails.type === "car") {
                const carObj = ev.rewardDetails.item;
                if (!winnerUser.vehicles.includes(carObj.id)) {
                  winnerUser.vehicles.push(carObj.id);
                  rewardResultText = `🚗 Jentera *${carObj.name}* telah dimasukkan terus ke dalam Garaj anda!`;
                } else {
                  winnerUser.cash += carObj.val;
                  rewardResultText = `🚗 Anda sudah miliki kereta ini! Nilai pampasan *RM ${carObj.val.toLocaleString()}* tunai dimasukkan.`;
                }
              } else if (ev.rewardDetails.type === "bm") {
                const bmObj = ev.rewardDetails.item;
                if (!winnerUser.inventory.some(i => i.id === bmObj.id)) {
                  winnerUser.inventory.push({ id: bmObj.id, name: bmObj.name });
                  rewardResultText = `🏴‍☠️ Gajet *${bmObj.name}* telah selamat dimasukkan ke dalam Beg Inventori anda!`;
                } else {
                  winnerUser.cash += bmObj.val;
                  rewardResultText = `🏴‍☠️ Gajet sudah ada dalam beg! Pampasan bernilai *RM ${bmObj.val.toLocaleString()}* tunai dikreditkan.`;
                }
              } else {
                winnerUser.cash += ev.rewardDetails.amount;
                rewardResultText = `💰 Wang tunai gergasi *+RM ${ev.rewardDetails.amount.toLocaleString()}* telah selamat dikreditkan ke poket!`;
              }

              winnerUser.stats.eventsWon = (winnerUser.stats.eventsWon || 0) + 1;
              updateUser(ev.winner, winnerUser);

              const winMsg = `╔═══════════════════════════╗\n   🔨 LELONGAN DITUTUP! (HAMMER DOWN)\n╚═══════════════════════════╝\n🎉 Pemenang Bidaan: *${ev.winnerName}*\n💵 Tawaran Menang: *RM ${ev.highestBid.toLocaleString()}*\n🎁 Hadiah Diterima: ${rewardResultText}`;
              await sock.sendMessage(gId, { text: winMsg, mentions: [ev.winner] }).catch(() => {});
            } else {
              const noBidMsg = `🏷️ *LELONGAN BATAL:* Tiada bidaan diterima dalam masa 2 minit. Barangan eksklusif dipulangkan ke gudang VIP!`;
              await sock.sendMessage(gId, { text: noBidMsg }).catch(() => {});
            }
            delete freshDB.activeEvents[gId];
            saveDB(freshDB);
          }
        }, 120 * 1000);
      }

      else if (chosenEvent === "jackpot_drop") {
        const reward = 15000;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "claim_jackpot", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🎰 JACKPOT AIRI MELETUP!\n╚═══════════════════════════╝\n💰 Duit jackpot terkumpul *RM 15,000* tumpah di group!\n\n⚡ Taip *.claim_jackpot* terpantas!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "bantuan_zakat") {
        const reward = 3000;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "ambil_bantuan", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   📦 BANTUAN PRIHATIN RAKYAT\n╚═══════════════════════════╝\n💵 Dana khas *RM 3,000* disediakan untuk warga miskin bandar!\n\n⚡ Taip *.ambil_bantuan* untuk tuntut segera!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "litar_kilat") {
        const reward = 8000;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "pelesit_litar", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🏁 CABARAN SPRINT KILAT\n╚═══════════════════════════╝\n🏎️ Litar dibuka untuk drag sprint tanpa permit!\n💰 Hadiah: *RM 8,000*\n\n⚡ Taip *.pelesit_litar* untuk potong garisan pertama!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "teka_nombor") {
        const num = Math.floor(1 + Math.random() * 10).toString();
        db.activeEvents[gId] = { type: "soalan", ans: num, reward: 6000, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🎲 TEKA NOMBOR BERTUAH (1-10)\n╚═══════════════════════════╝\n❓ Nombor rahsia dadu kasino telah dilempar!\n💰 Hadiah: *RM 6,000*\n\n💡 Taip *.jawab [1-10]* sekarang!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "serbuan_sprm") {
        db.activeEvents[gId] = { type: "claim_event", cmdName: "isytihar_harta", reward: 2500, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   ⚖️ AUDIT SPRM SIBER\n╚═══════════════════════════╝\n🏛️ Audit aset mengejut dijalankan di bandar!\n\n🛡️ Taip *.isytihar_harta* untuk elak akaun disita & terima elaun RM 2,500!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "hacker_bounty") {
        const reward = 10000;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "bounty_kill", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🎯 KONTRAK BOUNTY DARKWEB\n╚═══════════════════════════╝\n☠️ Sasaran buronan bernilai tinggi dikesan!\n💰 Bounty: *RM 10,000*\n\n⚡ Taip *.bounty_kill* untuk menuntut ganjaran!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "kontraban_drop") {
        const code = Math.floor(100 + Math.random() * 900).toString();
        db.activeEvents[gId] = { type: "airdrop", code, reward: 7000, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   📦 BUNGKUSAN KONTRABAN PELABUHAN\n╚═══════════════════════════╝\n🚢 Muatan gelap terjatuh dari lori kontena!\n🔑 Kod: *${code}* | 💰 Loot: *RM 7,000*\n\n⚡ Taip *.rebut ${code}* segera!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "pasar_karat") {
        const reward = 3500;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "kutip_karat", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🛒 PASAR KARAT UNDERGROUND\n╚═══════════════════════════╝\n🪙 Barangan antik berharga ditemui di lorong pasar!\n\n⚡ Taip *.kutip_karat* untuk sapu untung RM 3,500!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "pesta_makan") {
        const reward = 2000;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "makan_free", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🍛 KENDURI KESYUKURAN SIBER\n╚═══════════════════════════╝\n🍗 Jamuan percuma & duit poket diedarkan!\n\n⚡ Taip *.makan_free* untuk dapat RM 2,000 & pulihkan tenaga!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "godam_satelit") {
        const mathA = Math.floor(10 + Math.random() * 25);
        const ans = (mathA * 6).toString();
        db.activeEvents[gId] = { type: "soalan", ans, reward: 8500, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🛰️ GODAM ISYARAT SATELIT\n╚═══════════════════════════╝\n❓ Selesaikan frekuensi: *${mathA} x 6 = ?*\n💰 Hadiah Data: *RM 8,500*\n\n💡 Taip *.jawab [jawapan]*`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "petikan_emas") {
        const reward = 9000;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "lombong_emas", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   ⛏️ LOMBONG EMAS TERBENGKALAI\n╚═══════════════════════════╝\n🪙 Urat emas tulen terdedah di gua siber!\n\n⚡ Taip *.lombong_emas* untuk gali RM 9,000!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "teka_kata") {
        const words = [{ q: "R_M_LY (Burger)", a: "ramly" }, { q: "M_V_ (King jalan)", a: "myvi" }, { q: "K_R_A (Rezeki halal)", a: "kerja" }, { q: "Y_U_U (Motor Y15)", a: "ysuku" }];
        const chosen = words[Math.floor(Math.random() * words.length)];
        db.activeEvents[gId] = { type: "soalan", ans: chosen.a, reward: 4500, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🔤 TEKA SILANG KATA SIBER\n╚═══════════════════════════╝\n❓ Lengkapkan perkataan: *${chosen.q}*\n💰 Hadiah: *RM 4,500*\n\n💡 Taip *.jawab [perkataan]* (Huruf kecil)`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "kejar_pelesit") {
        const reward = 6000;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "tangkap_pelesit", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🏍️ PEMBURU PELIMPAH HIGHWAY\n╚═══════════════════════════╝\n💨 Pelesit lumba haram memecut laju di lebuhraya!\n\n⚡ Taip *.tangkap_pelesit* untuk pintas & sapu RM 6,000!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "derma_kilat") {
        const reward = 3000;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "kutip_derma", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🤝 TABUNG KEBAJIKAN SIBER\n╚═══════════════════════════╝\n💵 Tabung derma kilat dibuka untuk warga aktif!\n\n⚡ Taip *.kutip_derma* untuk ambil RM 3,000!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "kotak_misteri2") {
        const code = Math.floor(10 + Math.random() * 90).toString();
        db.activeEvents[gId] = { type: "airdrop", code, reward: 5500, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🎁 KOTAK HADIAH MISTERI\n╚═══════════════════════════╝\n🔑 Kod Kunci: *${code}* | 💰 Isi: *RM 5,500*\n\n⚡ Taip *.rebut ${code}* segera!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "cabaran_iq") {
        const ans = "airi";
        db.activeEvents[gId] = { type: "soalan", ans, reward: 4000, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🤖 UJIAN KECERDASAN AI\n╚═══════════════════════════╝\n❓ Soalan: *Apakah nama rasmi Grid Cyber RPG ini?*\n💰 Hadiah: *RM 4,000*\n\n💡 Taip *.jawab airi* pantas!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "sindiket_tumpas") {
        const reward = 7500;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "serbu_sindiket", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🏴‍☠️ SERBUAN MARKAS GELAP\n╚═══════════════════════════╝\n🏢 Markas sindiket ditinggalkan kosong!\n\n⚡ Taip *.serbu_sindiket* untuk rampas barang RM 7,500!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "tiket_bertuah") {
        const num = Math.floor(10 + Math.random() * 90).toString();
        db.activeEvents[gId] = { type: "airdrop", code, reward: 10000, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🎫 CABUTAN NOMBOR BERTUAH\n╚═══════════════════════════╝\n🎟️ Nombor Pemenang: *${num}* | 💰 Jackpot: *RM 10,000*\n\n⚡ Taip *.rebut ${num}* untuk tebus tiket!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "hujan_rahmat") {
        const reward = 4000;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "tadahan_hujan", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🌧️ HUJAN DUIT TUNAI AIRI\n╚═══════════════════════════╝\n💵 Langit menaburkan wang tunai di kawasan bandar!\n\n⚡ Taip *.tadahan_hujan* untuk tadah RM 4,000!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }

      else if (chosenEvent === "ribut_pasir") {
        const reward = 5000;
        db.activeEvents[gId] = { type: "claim_event", cmdName: "kutip_harta", reward, expires: Date.now() + 90000 };
        saveDB(db);
        const msg = `╔═══════════════════════════╗\n   🌪️ RIBUT ANGIN MEMBAWA HARTA\n╚═══════════════════════════╝\n💎 Peti lama terdedah akibat ribut kencang!\n\n⚡ Taip *.kutip_harta* untuk ambil RM 5,000!`;
        await sock.sendMessage(gId, { text: msg }).catch(() => {});
      }
    }
  }, 20 * 60 * 1000);

  // AUTO REPORT 12:00 MALAM
  let lastResetDate = new Date().getDate();
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getDate() !== lastResetDate) {
      lastResetDate = now.getDate();
      const db = loadDB();
      const usersArr = Object.entries(db.users || {}).map(([id, d]) => ({
        id,
        name: d.name || id.split("@")[0],
        works: d.stats?.works || 0,
        crimes: d.stats?.crimes || 0,
        races: d.stats?.racesWon || 0,
        bails: d.stats?.bails || 0,
        total: (d.cash || 0) + (d.bank || 0)
      }));

      if (usersArr.length > 0) {
        const topWorker = [...usersArr].sort((a, b) => b.works - a.works)[0];
        const topCriminal = [...usersArr].sort((a, b) => b.crimes - a.crimes)[0];
        const topRacer = [...usersArr].sort((a, b) => b.races - a.races)[0];
        const topRich = [...usersArr].sort((a, b) => b.total - a.total)[0];
        const topBail = [...usersArr].sort((a, b) => b.bails - a.bails)[0];

        const reportMsg = `╔═══════════════════════════╗\n   🌙 LAPORAN RASMI 12:00 MALAM\n╚═══════════════════════════╝\n🏆 *1. RAJA KERJA HALAL:*\n👤 *${topWorker.name}* (${topWorker.works} shift)\n\n🏴‍☠️ *2. PENJENAYAH UNDERWORLD:*\n👤 *${topCriminal.name}* (${topCriminal.crimes} operasi)\n\n🏁 *3. RAJA TREK / DRAG KING:*\n👤 *${topRacer.name}* (${topRacer.races} menang)\n\n💰 *4. JUTAWAN HARIAN TERKAYA:*\n👤 *${topRich.name}* (Aset: RM ${topRich.total.toLocaleString()})\n\n⚖️ *5. KAKI LOKAP SETIA:*\n👤 *${topBail.name}* (${topBail.bails} kali jamin)\n\n✨ _Statistik diset semula. Esok grind balik!_`;

        for (const gId of db.groups) {
          await sock.sendMessage(gId, { text: reportMsg }).catch(() => {});
        }
      }

      for (let id in db.users) {
        db.users[id].stats = { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0, bankHacks: 0 };
      }
      saveDB(db);
    }
  }, 60 * 1000);

  // =======================================================================
  // ⚡ 14. PENGENDALI ARAHAN & MESIN LOGIK LENGKAP
  // =======================================================================
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

    // AUTO-FOUNDER CHECK
    const isOwner = OWNER_NUMBERS.some(num => cleanSender.includes(num)) || user.isOwner === true;
    if (isOwner && !user.isOwner) {
      user.isOwner = true;
      if (!user.badges.includes("👑 [MYTHIC] Pengasas Mutlak")) {
        user.badges.push("👑 [MYTHIC] Pengasas Mutlak");
      }
      updateUser(cleanSender, user);
    }

    const activePhoneObj = PHONE_DEVICES.find(p => p.id === user.phoneDevice);

    // SEKATAN LOKAP MENGIKUT TAHAP WANTED
    if (now < user.cooldowns.jailUntil && cmd !== "upah_lawyer" && cmd !== "myid" && !isOwner) {
      const remSec = Math.ceil((user.cooldowns.jailUntil - now) / 1000);
      const jailAlert = 
`╔═══════════════════════════╗
   🚨 LOKAP BALAI POLIS BUKIT AMAN 🚨
╚═══════════════════════════╝
⛓️ Status: Tahanan Mahkamah (${user.stars || 1} ⭐ Wanted)
👤 Banduan: *${user.name}*
⏳ Baki Hukuman: *${remSec} saat lagi*
🔒 Sekatan: Dilarang kerja, lumba, pancing, rompak atau godam bank!

💡 Bebas Cepat: Taip *.upah_lawyer* (RM 500)`;
      return sock.sendMessage(from, { text: jailAlert });
    }

    // PENGENDALI EVENT INTERACTIVE LIVE (TERMASUK LHDN & ANTIVIRUS)
    const db = loadDB();
    const currentEvent = db.activeEvents?.[from];

    if (cmd === "isytihar_cukai" && currentEvent?.type === "audit_lhdn") {
      if (!currentEvent.safeUsers.includes(cleanSender)) {
        currentEvent.safeUsers.push(cleanSender);
        saveDB(db);
        return sock.sendMessage(from, { text: `🛡️ *LHDN CLEARED:* Penyata aset *${user.name}* telah disahkan! Anda dikecualikan dari potongan cukai 10%.` });
      }
    }

    if (cmd === "pasang_antivirus" && currentEvent?.type === "ransomware") {
      if (!currentEvent.safeUsers.includes(cleanSender)) {
        currentEvent.safeUsers.push(cleanSender);
        saveDB(db);
        return sock.sendMessage(from, { text: `🛡️ *FIREWALL ACTIVE:* *${user.name}* berjaya memasang patch antivirus dan kebal daripada serangan ransomware!` });
      }
    }

    if (currentEvent && currentEvent.type === "claim_event" && cmd === currentEvent.cmdName) {
      user.cash += currentEvent.reward;
      user.stats.eventsWon = (user.stats.eventsWon || 0) + 1;
      delete db.activeEvents[from];
      saveDB(db);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎉 *TUNTUTAN PANTAS BERJAYA!* *${user.name}* menyambar ganjaran *+RM ${currentEvent.reward.toLocaleString()}* tunai!` });
    }

    if (cmd === "rebut" && currentEvent?.type === "airdrop") {
      if (args[0] === currentEvent.code) {
        user.cash += currentEvent.reward;
        user.stats.eventsWon = (user.stats.eventsWon || 0) + 1;
        delete db.activeEvents[from];
        saveDB(db);
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🎉 *AIRDROP DIBUKA!* *${user.name}* berjaya merampas *+RM ${currentEvent.reward.toLocaleString()}* tunai!` });
      } else {
        return sock.sendMessage(from, { text: `❌ Kod dekripsi salah!` });
      }
    }

    if (cmd === "tunjuk_lesen" && currentEvent?.type === "roadblock") {
      user.cash += 1000;
      user.stars = Math.max(0, user.stars - 1);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `👮 *PELEPASAN ROADBLOCK:* Lesen *${user.name}* sah! Bonus disiplin *+RM 1,000* dan bintang wanted berkurang.` });
    }

    if (cmd === "serang_boss" && currentEvent?.type === "boss") {
      currentEvent.hp -= 1;
      if (!currentEvent.attackers.includes(user.name)) currentEvent.attackers.push(user.name);
      if (currentEvent.hp <= 0) {
        const rewardEach = Math.floor(currentEvent.reward / currentEvent.attackers.length);
        for (const atkName of currentEvent.attackers) {
          const uEntry = Object.entries(db.users).find(([k, v]) => v.name === atkName);
          if (uEntry) {
            uEntry[1].cash += rewardEach;
            updateUser(uEntry[0], uEntry[1]);
          }
        }
        delete db.activeEvents[from];
        saveDB(db);
        return sock.sendMessage(from, { text: `💥 *BOSS TEWAS!* Kingpin mafia ditumpaskan! Ganjaran *RM ${rewardEach.toLocaleString()}* diagihkan kepada semua penyerang!` });
      } else {
        saveDB(db);
        return sock.sendMessage(from, { text: `⚔️ *SERANGAN TEPAT!* *${user.name}* menumbuk Boss! Baki HP: [ ${currentEvent.hp} / ${currentEvent.maxHp} ]` });
      }
    }

    if (cmd === "jawab" && currentEvent?.type === "soalan") {
      if (args.join(" ").toLowerCase() === currentEvent.ans.toLowerCase()) {
        user.cash += currentEvent.reward;
        user.stats.eventsWon = (user.stats.eventsWon || 0) + 1;
        delete db.activeEvents[from];
        saveDB(db);
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🧠 *JAWAPAN TEPAT!* *${user.name}* menjawab dengan betul dan menerima *+RM ${currentEvent.reward.toLocaleString()}*!` });
      } else {
        return sock.sendMessage(from, { text: `❌ Jawapan salah!` });
      }
    }

    if (cmd === "bida" && currentEvent?.type === "lelong") {
      const bidAmt = parseInt(args[0]);
      if (!isNaN(bidAmt) && bidAmt > currentEvent.highestBid && user.cash >= bidAmt) {
        currentEvent.highestBid = bidAmt;
        currentEvent.winner = cleanSender;
        currentEvent.winnerName = user.name;
        saveDB(db);
        return sock.sendMessage(from, { text: `🏷️ *BIDAAN DITERIMA!* *${user.name}* memegang tawaran tertinggi terkini: *RM ${bidAmt.toLocaleString()}*!` });
      } else {
        return sock.sendMessage(from, { text: `❌ Bidaan mestilah lebih tinggi dari RM ${currentEvent.highestBid.toLocaleString()} dan tunai mencukupi!` });
      }
    }

    // =====================================================================
    // 💻 GODAM BANK DENGAN EMOJI CYBER PIN PROTOCOL
    // =====================================================================
    if (cmd === "hackbank" || cmd === "godam_bank") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Sila tag sasaran bank! Contoh: *.hackbank @user*` });
      
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Nak godam bank sendiri kenapa? Otak biol ke bro?` });

      const hasHackDevice = user.inventory.some(i => i.id === 11 || i.id === 2 || i.id === 5);
      if (!hasHackDevice && !isOwner) {
        return sock.sendMessage(from, { 
          text: `❌ *AKSES DISEKAT!* Anda perlukan sekurang-kurangnya *[ID 11: Cyber Bypass Dongle 🖲️]* (Harga bajet RM 18,000 di *.bm*) untuk godam akaun bank sasaran!` 
        });
      }

      if (now < user.cooldowns.bankHack && !isOwner) {
        const rem = Math.ceil((user.cooldowns.bankHack - now) / 1000);
        return sock.sendMessage(from, { text: `⏳ Firewall bank sedang menjejaki IP anda! Tunggu *${rem} saat* lagi sebelum godam semula.` });
      }

      const targetUser = getUser(cleanTarget);
      if (targetUser.bank < 1000) {
        return sock.sendMessage(from, { text: `😅 Akaun bank *${targetUser.name}* terlalu miskin (Bawah RM 1,000). Cari sasaran lain!` });
      }

      const cyberEmojis = ["⚡", "💾", "🔓", "☣️", "👾", "📡", "🧩", "🗝️", "💎", "🛡️"];
      const shuffled = [...cyberEmojis].sort(() => 0.5 - Math.random());
      const selectedPin = shuffled.slice(0, 4).join("");

      if (!db.activeHacks) db.activeHacks = {};
      db.activeHacks[cleanSender] = {
        target: cleanTarget,
        targetName: targetUser.name,
        emojiPin: selectedPin,
        expires: now + 30000
      };
      saveDB(db);

      const hackTerminalUI = 
`╔═══════════════════════════╗
   ⚡ CYBER NEURAL HANDSHAKE V2.4 ⚡
╚═══════════════════════════╝
🌐 [STATUS]: Initializing Port Scanning...
🎯 [TARGET]: *${targetUser.name}*
🛡️ [FIREWALL]: Active 256-bit Node
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 *KOD EMOJI DEKRIPSI DIPERLUKAN:*
   ▶️   ${selectedPin.split("").join("  ")}   ◀️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ *PEMASA KRITIKAL: 30 SAAT SAHAJA!*
💡 Salin & hantar susunan emoji tepat:
👉 Taip: *.bypass ${selectedPin}*`;
      return sock.sendMessage(from, { text: hackTerminalUI });
    }

    if (cmd === "bypass") {
      const activeHack = db.activeHacks?.[cleanSender];
      if (!activeHack) {
        return sock.sendMessage(from, { text: `❌ Tiada sesi godam bank yang aktif atau masa dekripsi telah tamat!` });
      }

      if (now > activeHack.expires) {
        delete db.activeHacks[cleanSender];
        saveDB(db);
        user.cooldowns.jailUntil = now + (60 * 1000);
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 *TIMEOUT EXPIRED!* Firewall bank mengesan pencerobohan siber. Masuk lokap 60 saat!` });
      }

      const enteredPin = args.join("").trim();
      const targetUser = getUser(activeHack.target);

      if (enteredPin === activeHack.emojiPin) {
        delete db.activeHacks[cleanSender];
        user.cooldowns.bankHack = now + (3.5 * 60 * 1000);

        const stolenBank = Math.floor(targetUser.bank * 0.15);
        targetUser.bank -= stolenBank;
        user.cash += stolenBank;
        user.stars = Math.min(5, user.stars + 2);
        user.stats.bankHacks = (user.stats.bankHacks || 0) + 1;

        await checkAndAwardBadges(user, sock, from);
        saveDB(db);
        updateUser(cleanSender, user);
        updateUser(activeHack.target, targetUser);

        const roast = ROASTS.hackbank_win[Math.floor(Math.random() * ROASTS.hackbank_win.length)];
        const hackUI = 
`╔═══════════════════════════╗
   🔓 DEKRIPSI BERJAYA : ACCESS GRANTED
╚═══════════════════════════╝
👤 Hacker: *${user.name}*
🎯 Sasaran: *${targetUser.name}*
💵 Dana Bank Disedut: *+RM ${stolenBank.toLocaleString()}*
⭐ Wanted Level: ${"⭐".repeat(user.stars)}

💬 _"${roast}"_`;
        return sock.sendMessage(from, { text: hackUI, mentions: [activeHack.target] });
      } else {
        delete db.activeHacks[cleanSender];
        const fine = 1500;
        user.cash = Math.max(0, user.cash - fine);
        user.cooldowns.jailUntil = now + (60 * 1000);
        saveDB(db);
        updateUser(cleanSender, user);

        const roast = ROASTS.hackbank_fail[Math.floor(Math.random() * ROASTS.hackbank_fail.length)];
        return sock.sendMessage(from, { 
          text: `🚨 *SECURITY COUNTERMEASURE TRIGGERED!* Susunan emoji dekripsi salah. Denda *-RM 1,500* & dihumban ke lokap siber!\n\n💬 _"${roast}"_` 
        });
      }
    }

    // =====================================================================
    // 👑 SEKSYEN FOUNDER
    // =====================================================================
    if (cmd === "claimfounder" || cmd === "iamowner") {
      if (!isOwner) return sock.sendMessage(from, { text: `🚫 *AKSES DITOLAK!* Nombor anda bukan Pengasas Amar.` });
      user.isOwner = true;
      if (!user.badges.includes("👑 [MYTHIC] Pengasas Mutlak")) user.badges.push("👑 [MYTHIC] Pengasas Mutlak");
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `👑 *STATUS FOUNDER DIAKTIFKAN:* Selamat kembali, Bos Amar. Akses veto 100% aktif.` });
    }

    if (cmd === "setmoney" && isOwner) {
      const amt = parseInt(args[0]) || 1000000;
      user.cash = amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `👑 *[VETO]* Tunai poket diset ke *RM ${amt.toLocaleString()}*.` });
    }

    if (cmd === "resetlokap" && isOwner) {
      user.cooldowns.jailUntil = 0;
      user.stars = 0;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `👑 *[VETO]* Rekod lokap & bintang wanted dibersihkan serta-merta (0 Bintang).` });
    }

    if (cmd === "jail" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const minutes = parseInt(args[1]) || 2;
      if (!targetTag) return sock.sendMessage(from, { text: `Tag sasaran: *.jail @user 2*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      targetUser.cooldowns.jailUntil = Date.now() + (minutes * 60 * 1000);
      targetUser.stars = 5;
      updateUser(cleanTarget, targetUser);
      return sock.sendMessage(from, { text: `🚨 *[VETO JAIL]* *${targetUser.name}* dihumban ke lokap selama ${minutes} minit!`, mentions: [cleanTarget] });
    }

    if (cmd === "unjail" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `Tag sasaran: *.unjail @user*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      targetUser.cooldowns.jailUntil = 0;
      targetUser.stars = 0;
      updateUser(cleanTarget, targetUser);
      return sock.sendMessage(from, { text: `⚖️ *[VETO UNJAIL]* *${targetUser.name}* dibebaskan serta-merta!`, mentions: [cleanTarget] });
    }

    if (cmd === "vtotransfer" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt) || amt <= 0) return sock.sendMessage(from, { text: `Format: *.vtotransfer @user [jumlah]*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      targetUser.cash += amt;
      updateUser(cleanTarget, targetUser);
      return sock.sendMessage(from, { text: `💸 *[VETO TRANSFER]* Ditransfer RM ${amt.toLocaleString()} ke akaun *${targetUser.name}*!`, mentions: [cleanTarget] });
    }

    if (cmd === "vtoclear" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `Format: *.vtoclear @user*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      targetUser.cash = 0;
      targetUser.bank = 0;
      updateUser(cleanTarget, targetUser);
      return sock.sendMessage(from, { text: `🏴‍☠️ *[VETO CLEAR]* Kesemua harta tunai dan bank milik *${targetUser.name}* disita bersih!`, mentions: [cleanTarget] });
    }

    // =====================================================================
    // 📖 MENU UTAMA
    // =====================================================================
    if (cmd === "menu" || cmd === "help") {
      const menuText = 
`╔═══════════════════════════╗
   🖥️ AIRI'S CORNER CYBER OS
╚═══════════════════════════╝
💼 *[1. KERJAYA HALAL]*
• *.list_kerja [1/2]* ➔ Senarai 50 jenis tugasan kerja
• *.kerja* ➔ Tugasan kerja rawak (Gaji RM 80-500 | CD: 45s)
• *.daily* ➔ Elaun percuma harian (RM 250)

📱 *[2. KEDAI TELEFON]*
• *.device* ➔ Katalog 10 smartphone & pasif buff
• *.beli_phone [id]* ➔ Beli telefon pintar utama

🏎️ *[3. SHOWROOM & DRAG]*
• *.showroom [1/2]* ➔ 40 Kenderaan (Motor / Kereta)
• *.beli_kenderaan [id]* ➔ Beli jentera masuk garaj
• *.bengkel [id]* ➔ Ubah suai jentera garaj
• *.pasang [id_jentera] [id_barang]* ➔ Pasang alat ganti
• *.lumba [id]* ➔ Drag race malam (CD: 60s)

🏴‍☠️ *[4. BLACK MARKET & CRIME (MEGA LOOT)]*
• *.bm* ➔ Pasaran gelap gajet godam & logistik
• *.beli_bm [id]* ➔ Beli gajet gelap (Termasuk Dongle ID 11)
• *.jenayah* ➔ Senarai 15 misi Darkweb (Loot Berjuta)
• *.buat_jenayah [id]* ➔ Jalankan operasi gelap (CD: 90s)
• *.hackbank @user* ➔ Dekripsi Emoji & godam 15% bank mangsa!
• *.upah_lawyer* ➔ Ikat jamin lokap balai (RM 500)

🏢 *[5. HARTANAH PASIF (ID 1-12)]*
• *.list_hartanah* ➔ Senarai Flat hingga Pulau Peribadi
• *.beli_rumah [id]* ➔ Beli aset kediaman / industri
• *.kutip_sewa* ➔ Kutip sewaan pasif 24 jam

🎰 *[6. KASINO & MINI GAMES]*
• *.coinflip [kepala/bunga] [taruhan]* ➔ Coinflip 50:50
• *.slot [taruhan]* ➔ Mesin Slot Jackpot
• *.mancing* ➔ Tangkap ikan bernilai tinggi (CD: 20s)
• *.hutang_ahlong [jumlah]* ➔ Pinjam wang (Bunga 25%)
• *.bayar_ahlong* ➔ Langsaikan baki pinjaman

🏦 *[7. PERBANKAN & PVP]*
• *.deposit [jumlah/all]* & *.withdraw [jumlah/all]*
• *.transfer @user [jumlah]* ➔ Pindahan duit
• *.rompak @user* ➔ Samun 25% tunai poket mangsa (CD: 2m)
• *.shop* & *.beli_makanan [id]* & *.makan [id]*

🪪 *[8. IDENTITI & PROFIL]*
• *.myid* ➔ Kad pengenalan siber & lencana
• *.profile* ➔ Semak garaj & inventori
• *.top* ➔ Papan carta 5 jutawan terkaya`;
      return sock.sendMessage(from, { text: menuText });
    }

    // =====================================================================
    // 💼 KERJA HALAL RAWAK BERSEIMBANG (COOLDOWN: 45 SAAT)
    // =====================================================================
    if (cmd === "list_kerja" || cmd === "jobs") {
      const page = args[0] === "2" ? 2 : 1;
      const start = (page - 1) * 25;
      const pageJobs = JOBS.slice(start, start + 25);
      let text = `╔═══════════════════════════╗\n   💼 SENARAI 50 TUGASAN KERJA (PAGE ${page}/2)\n╚═══════════════════════════╝\n`;
      pageJobs.forEach(j => {
        text += `• *[ID ${j.id}]* ${j.name} ➔ Anggaran: RM ${j.minPay} - RM ${j.maxPay}\n`;
      });
      text += `\n💡 Taip *.kerja* untuk terima tugasan shift secara automatik!`;
      return sock.sendMessage(from, { text });
    }

    if (cmd === "kerja" || cmd === "work") {
      let cdDuration = 45 * 1000;
      if (activePhoneObj?.perk === "cd") cdDuration = Math.max(15000, cdDuration - activePhoneObj.val);

      if (now < user.cooldowns.work && !isOwner) {
        const rem = Math.ceil((user.cooldowns.work - now) / 1000);
        return sock.sendMessage(from, { text: `⚠️ Rehat *${rem} saat* lagi sebelum shift seterusnya! Atau makan *.makan nasilemak*.` });
      }

      const assignedJob = JOBS[Math.floor(Math.random() * JOBS.length)];
      let payout = Math.floor(Math.random() * (assignedJob.maxPay - assignedJob.minPay + 1)) + assignedJob.minPay;

      if (activePhoneObj?.perk === "work" || activePhoneObj?.perk === "god") {
        payout += Math.floor(payout * activePhoneObj.val);
      }

      user.cash += payout;
      user.stats.works += 1;
      user.cooldowns.work = now + cdDuration;
      updateUser(cleanSender, user);

      const roast = ROASTS.kerja[Math.floor(Math.random() * ROASTS.kerja.length)];
      const ui = 
`╔═══════════════════════════╗
   💼 SLIP GAJI HALAL AIRI
╚═══════════════════════════╝
👤 Pekerja: *${user.name}*
🏢 Tugasan: *${assignedJob.name}*
💵 Upah Diterima: *+RM ${payout.toLocaleString()}*

💬 _"${roast}"_`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "daily") {
      if (now < user.cooldowns.daily && !isOwner) {
        const remH = Math.ceil((user.cooldowns.daily - now) / 3600000);
        return sock.sendMessage(from, { text: `⏳ Elaun harian dah dituntut! Datang lagi *${remH} jam* nanti.` });
      }
      user.cash += 250;
      user.cooldowns.daily = now + (24 * 3600 * 1000);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎁 *BANTUAN HARIAN:* +RM 250 tunai dikreditkan ke poket anda!` });
    }

    // =====================================================================
    // 📱 KEDAI TELEFON
    // =====================================================================
    if (cmd === "device") {
      let ui = `╔═══════════════════════════╗\n   📱 KEDAI TELEFON PINTAR\n╚═══════════════════════════╝\n`;
      PHONE_DEVICES.forEach(p => {
        ui += `• *[${p.id}]* ${p.name}\n  💰 RM ${p.price.toLocaleString()} | _${p.bonus}_\n\n`;
      });
      ui += `💡 Taip *.beli_phone [id]*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_phone") {
      const phone = PHONE_DEVICES.find(p => p.id === args[0]?.toLowerCase());
      if (!phone) return sock.sendMessage(from, { text: `❌ Kod telefon tidak wujud!` });
      if (user.cash < phone.price) return sock.sendMessage(from, { text: `❌ Tunai tidak cukup untuk beli ${phone.name}!` });
      user.cash -= phone.price;
      user.phoneDevice = phone.id;
      user.phoneName = phone.name;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `📱 Berjaya beli *${phone.name}*! Buff aktif: _${phone.bonus}_` });
    }

    // =====================================================================
    // 🏎️ SHOWROOM, BENGKEL & LUMBA
    // =====================================================================
    if (cmd === "showroom") {
      const page = args[0] === "2" ? 2 : 1;
      const start = (page - 1) * 20;
      const pageVehicles = VEHICLES.slice(start, start + 20);
      let ui = `╔═══════════════════════════╗\n   🏎️ SHOWROOM JENTERA (PAGE ${page}/2)\n╚═══════════════════════════╝\n`;
      pageVehicles.forEach(v => {
        ui += `• *[${v.id}]* ${v.name} (${v.type})\n  💰 RM ${v.price.toLocaleString()} | ⚡ ${v.speed} km/h\n\n`;
      });
      ui += `💡 Taip *.beli_kenderaan [id]*`;
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
      return sock.sendMessage(from, { text: `🎉 Berjaya beli *${v.name}*! Masuk garaj untuk modifikasi: *.bengkel ${v.id}*` });
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
      if (!vId || isNaN(partId) || !user.vehicles.includes(vId)) return sock.sendMessage(from, { text: `❌ Format salah! Taip: *.pasang [kod_jentera] [id_barang]*` });
      const vehicle = VEHICLES.find(v => v.id === vId);
      const part = MOD_PARTS[vehicle.type]?.find(p => p.id === partId);
      if (!part) return sock.sendMessage(from, { text: `❌ Barang ID tidak sesuai untuk jenis ${vehicle.type}!` });
      if (user.cash < part.price) return sock.sendMessage(from, { text: `❌ Tunai tidak cukup!` });

      if (!user.vehicleMods) user.vehicleMods = {};
      if (!user.vehicleMods[vId]) user.vehicleMods[vId] = [];
      user.cash -= part.price;
      if (!part.oneTime) user.vehicleMods[vId].push(part.name);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🔧 *${part.name}* telah berjaya dipasang pada *${vehicle.name}*!` });
    }

    if (cmd === "lumba" || cmd === "race") {
      const vId = args[0]?.toLowerCase();
      if (!vId || !user.vehicles.includes(vId)) return sock.sendMessage(from, { text: `❌ Letak kod jentera garaj anda! Contoh: *.lumba y15*` });
      if (now < user.cooldowns.race && !isOwner) {
        const rem = Math.ceil((user.cooldowns.race - now) / 1000);
        return sock.sendMessage(from, { text: `🏎️ Enjin tengah panas membara! Tunggu ${rem} saat lagi.` });
      }

      const vehicle = VEHICLES.find(v => v.id === vId);
      user.cooldowns.race = now + (60 * 1000);

      let speedBonus = 0;
      (user.vehicleMods?.[vId] || []).forEach(mName => {
        const pObj = MOD_PARTS[vehicle.type]?.find(p => p.name === mName);
        if (pObj) speedBonus += pObj.boostSpeed;
      });

      const totalSpeed = vehicle.speed + speedBonus;
      let winChance = totalSpeed / 220;
      if (activePhoneObj?.perk === "race" || activePhoneObj?.perk === "god") winChance += activePhoneObj.val;

      if (Math.random() < winChance || isOwner) {
        const reward = Math.floor((vehicle.price * 0.12) + 1000);
        user.cash += reward;
        user.stats.racesWon = (user.stats.racesWon || 0) + 1;
        updateUser(cleanSender, user);
        const roast = ROASTS.race_win[Math.floor(Math.random() * ROASTS.race_win.length)];
        return sock.sendMessage(from, { 
          text: `╔═══════════════════════════╗\n   🏁 JUARA DRAG RACE MALAM\n╚═══════════════════════════╝\n🏎️ Jentera: *${vehicle.name}* (${totalSpeed} km/h)\n👤 Pelumba: *${user.name}*\n💰 Hadiah: *+RM ${reward.toLocaleString()}*\n\n💬 _"${roast}"_` 
        });
      } else {
        const repairCost = Math.floor(vehicle.price * 0.02);
        user.cash = Math.max(0, user.cash - repairCost);
        updateUser(cleanSender, user);
        const roast = ROASTS.race_lose[Math.floor(Math.random() * ROASTS.race_lose.length)];
        return sock.sendMessage(from, { 
          text: `╔═══════════════════════════╗\n   💥 KEMALANGAN SELEKOH MAUT\n╚═══════════════════════════╝\n❌ Status: Terbabas di divider!\n🛠️ Kos Baiki: *-RM ${repairCost.toLocaleString()}*\n\n💬 _"${roast}"_` 
        });
      }
    }

    // =====================================================================
    // 🏴‍☠️ BLACK MARKET & 15 MISI JENAYAH
    // =====================================================================
    if (cmd === "bm") {
      let ui = `╔═══════════════════════════╗\n   🏴‍☠️ BLACK MARKET UNDERWORLD\n╚═══════════════════════════╝\n`;
      BLACKMARKET_ITEMS.forEach(i => {
        ui += `• *[ID ${i.id}]* ${i.name}\n  💰 RM ${i.price.toLocaleString()} | _${i.desc}_\n\n`;
      });
      ui += `💡 Taip *.beli_bm [ID]*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_bm") {
      const item = BLACKMARKET_ITEMS.find(i => i.id === parseInt(args[0]));
      if (!item) return sock.sendMessage(from, { text: `❌ ID perkakasan gelap tidak wujud!` });
      if (user.cash < item.price) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi!` });
      if (user.inventory.some(i => i.id === item.id)) return sock.sendMessage(from, { text: `⚠️ Perkakasan ini sudah ada dalam beg!` });

      user.cash -= item.price;
      user.inventory.push({ id: item.id, name: item.name });
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🛒 Berjaya beli *${item.name}*!` });
    }

    if (cmd === "jenayah") {
      let ui = `╔═══════════════════════════╗\n   💀 DARKWEB CRIME NETWORK (MEGA LOOT)\n╚═══════════════════════════╝\n`;
      CRIMES.forEach(c => {
        const reqObj = c.reqItem ? BLACKMARKET_ITEMS.find(i => i.id === c.reqItem) : null;
        ui += `• *[ID ${c.id}]* ${c.name}\n  💵 Loot: RM ${c.rewardMin.toLocaleString()} - ${c.rewardMax.toLocaleString()} | 🔒 ${reqObj ? reqObj.name : "Bebas"}\n\n`;
      });
      ui += `💡 Taip *.buat_jenayah [ID]*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "buat_jenayah") {
      const c = CRIMES.find(x => x.id === parseInt(args[0]));
      if (!c) return sock.sendMessage(from, { text: `❌ ID misi jenayah tidak wujud!` });
      if (c.reqItem && !user.inventory.some(i => i.id === c.reqItem)) {
        const reqObj = BLACKMARKET_ITEMS.find(i => i.id === c.reqItem);
        return sock.sendMessage(from, { text: `❌ Perlukan perkakasan [${reqObj?.name}] dari *.bm*!` });
      }

      if (now < user.cooldowns.crime && !isOwner) {
        const rem = Math.ceil((user.cooldowns.crime - now) / 1000);
        return sock.sendMessage(from, { text: `⏳ Polis sedang meronda di lokasi! Tunggu *${rem} saat* lagi.` });
      }

      user.cooldowns.crime = now + (90 * 1000);
      let crimeRate = 0.55;
      if (activePhoneObj?.perk === "crime" || activePhoneObj?.perk === "god") crimeRate += activePhoneObj.val;
      if (user.inventory.some(i => i.id === 6)) crimeRate += 0.20;

      if (Math.random() < crimeRate || isOwner) {
        const reward = Math.floor(Math.random() * (c.rewardMax - c.rewardMin + 1)) + c.rewardMin;
        user.cash += reward;
        user.stats.crimes += 1;
        user.stars = Math.min(5, user.stars + c.stars);
        updateUser(cleanSender, user);
        const roast = ROASTS.crime_win[Math.floor(Math.random() * ROASTS.crime_win.length)];
        return sock.sendMessage(from, { 
          text: `╔═══════════════════════════╗\n   🦹 OPERASI DARKWEB BERJAYA\n╚═══════════════════════════╝\n👤 Pelaku: *${user.name}*\n🚨 Misi: ${c.name}\n💵 Rampasan: *+RM ${reward.toLocaleString()}*\n⭐ Wanted: ${"⭐".repeat(user.stars)}\n\n💬 _"${roast}"_` 
        });
      } else {
        user.stars = Math.min(5, user.stars + 1);
        const jailTimeSec = Math.max(30, user.stars * 30);
        user.cash = Math.max(0, user.cash - c.fine);
        user.cooldowns.jailUntil = now + (jailTimeSec * 1000);
        updateUser(cleanSender, user);

        const roast = ROASTS.crime_fail[Math.floor(Math.random() * ROASTS.crime_fail.length)];
        return sock.sendMessage(from, { 
          text: `╔═══════════════════════════╗\n   🚨 KANTOI SERBUAN POLIS! 🚨\n╚═══════════════════════════╝\n❌ Misi Gagal!\n💸 Denda: *-RM ${c.fine.toLocaleString()}*\n⛓️ Dihumban ke lokap selama ${jailTimeSec} saat (${user.stars} ⭐ Wanted)!\n\n💬 _"${roast}"_\n💡 Bebas Cepat: Taip *.upah_lawyer*` 
        });
      }
    }

    if (cmd === "upah_lawyer") {
      if (now >= user.cooldowns.jailUntil && !isOwner) return sock.sendMessage(from, { text: `ℹ️ Anda bukan dalam tahanan lokap balai polis!` });
      if (user.cash < 500 && !isOwner) return sock.sendMessage(from, { text: `❌ Sediakan RM 500 tunai untuk peguam!` });
      if (!isOwner) user.cash -= 500;
      user.cooldowns.jailUntil = 0;
      user.stars = Math.max(0, user.stars - 1);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `⚖️ *IKAT JAMIN SELESAI:* Kes digugurkan oleh peguam, anda bebas bergerak semula!` });
    }

    // =====================================================================
    // 🏢 HARTANAH, KASINO, MANCING & BANK
    // =====================================================================
    if (cmd === "list_hartanah") {
      let ui = `╔═══════════════════════════╗\n   🏢 PASARAN HARTANAH AIRI (12 ASET)\n╚═══════════════════════════╝\n`;
      PROPERTIES.forEach(p => {
        ui += `• *[ID ${p.id}]* ${p.name}\n  💰 RM ${p.price.toLocaleString()} | 💵 Sewa: RM ${p.rent.toLocaleString()}/hari\n\n`;
      });
      ui += `💡 Taip *.beli_rumah [id]* & *.kutip_sewa*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_rumah") {
      const pr = PROPERTIES.find(x => x.id === parseInt(args[0]));
      if (!pr) return sock.sendMessage(from, { text: `❌ ID hartanah tidak wujud! Semak senarai di *.list_hartanah*.` });
      if (user.cash < pr.price) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi untuk beli ${pr.name}!` });
      if (user.properties.includes(pr.id)) return sock.sendMessage(from, { text: `⚠️ Anda sudah memiliki unit ini!` });
      
      user.cash -= pr.price;
      user.properties.push(pr.id);
      updateUser(cleanSender, user);

      const roast = ROASTS.hartanah[Math.floor(Math.random() * ROASTS.hartanah.length)];
      return sock.sendMessage(from, { 
        text: `╔═══════════════════════════╗\n   🏠 PEMBELIAN ASET BERJAYA\n╚═══════════════════════════╝\n🏢 Geran Rasmi: *${pr.name}*\n💵 Sewa Harian: *RM ${pr.rent.toLocaleString()}/hari*\n\n💬 _"${roast}"_\n💡 Taip *.kutip_sewa* setiap 24 jam!` 
      });
    }

    if (cmd === "kutip_sewa") {
      if (user.properties.length === 0) return sock.sendMessage(from, { text: `❌ Anda tiada hartanah untuk dikutip sewa!` });
      if (now < user.cooldowns.rent && !isOwner) {
        const remH = Math.ceil((user.cooldowns.rent - now) / 3600000);
        return sock.sendMessage(from, { text: `⏳ Datang kutip lagi *${remH} jam* nanti!` });
      }
      let totalRent = 0;
      user.properties.forEach(pId => {
        const pr = PROPERTIES.find(x => x.id === pId);
        if (pr) totalRent += pr.rent;
      });
      user.cash += totalRent;
      user.cooldowns.rent = now + (24 * 3600 * 1000);
      updateUser(cleanSender, user);

      const roast = ROASTS.sewa[Math.floor(Math.random() * ROASTS.sewa.length)];
      return sock.sendMessage(from, { 
        text: `╔═══════════════════════════╗\n   💵 DIVIDEN SEWAAN HARTANAH\n╚═══════════════════════════╝\n💰 Jumlah Dikutip: *+RM ${totalRent.toLocaleString()}*\n\n💬 _"${roast}"_` 
      });
    }

    if (cmd === "coinflip") {
      const choice = args[0]?.toLowerCase();
      const bet = parseInt(args[1]);
      if (!["kepala", "bunga"].includes(choice) || isNaN(bet) || bet <= 0) return sock.sendMessage(from, { text: `Format: *.coinflip [kepala/bunga] [taruhan]*` });
      if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi!` });

      user.cash -= bet;
      if (Math.random() < 0.49 || isOwner) {
        const reward = bet * 2;
        user.cash += reward;
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🪙 *COINFLIP MENANG!* Syiling menunjukkan *${choice.toUpperCase()}* (+RM ${reward.toLocaleString()})!` });
      } else {
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🪙 *COINFLIP TEWAS!* Taruhan *-RM ${bet.toLocaleString()}* lesap!` });
      }
    }

    if (cmd === "slot") {
      const bet = parseInt(args[0]);
      if (isNaN(bet) || bet < 10 || user.cash < bet) return sock.sendMessage(from, { text: `❌ Minima taruhan RM 10 dan tunai mencukupi!` });
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
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n🔥 *JACKPOT!* Anda menang *+RM ${reward.toLocaleString()}*!` });
      } else {
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n❌ Tiada kombinasi menang. Taruhan *-RM ${bet.toLocaleString()}* lesap!` });
      }
    }

    // =====================================================================
    // 🎣 MEMANCING (COOLDOWN: 20 SAAT)
    // =====================================================================
    if (cmd === "mancing" || cmd === "fish") {
      if (now < user.cooldowns.fish && !isOwner) {
        const rem = Math.ceil((user.cooldowns.fish - now) / 1000);
        return sock.sendMessage(from, { text: `🎣 Joran masih terendam di air! Tunggu ${rem} saat lagi sebelum sentap.` });
      }

      user.cooldowns.fish = now + (20 * 1000);
      const caught = catchFishRandom();
      user.cash += caught.price;
      user.stats.fishes = (user.stats.fishes || 0) + 1;

      await checkAndAwardBadges(user, sock, from);
      updateUser(cleanSender, user);

      const isJunk = caught.price === 0;
      const roastList = isJunk ? ROASTS.mancing_sampah : ROASTS.mancing_win;
      const roast = roastList[Math.floor(Math.random() * roastList.length)];

      const fishUI = 
`╔═══════════════════════════╗
   🎣 HASIL TANGKAPAN JETI LAUT
╚═══════════════════════════╝
👤 Pemancing: *${user.name}*
🐟 Mangsa: *${caught.name}*
🏷️ Peringkat: *${caught.tier}*
💰 Nilai Pasaran: *+RM ${caught.price.toLocaleString()}*

💬 _"${roast}"_`;
      return sock.sendMessage(from, { text: fishUI });
    }

    if (cmd === "hutang_ahlong") {
      const amt = parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || amt > 500000) {
        return sock.sendMessage(from, { text: `❌ Had pinjaman Ah Long adalah RM 1 hingga RM 500,000 sahaja!\nContoh: *.hutang_ahlong 50000*` });
      }

      if (user.debt > 0) {
        return sock.sendMessage(from, { text: `❌ Selesaikan baki hutang lama (RM ${user.debt.toLocaleString()}) dahulu sebelum pinjam baru!` });
      }

      user.cash += amt;
      user.debt = Math.floor(amt * 1.25);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `🦈 *PINJAMAN AH LONG DILULUSKAN!* 🦈\nWang tunai *RM ${amt.toLocaleString()}* masuk poket.\n⚠️ *Jumlah Bayaran Balik:* RM ${user.debt.toLocaleString()} (Bunga 25%).\nTaip *.bayar_ahlong* sebelum rumah disimbah cat merah!` 
      });
    }

    if (cmd === "bayar_ahlong") {
      if (user.debt <= 0) {
        return sock.sendMessage(from, { text: `ℹ️ Anda tiada sebarang rekod hutang Ah Long.` });
      }

      if (user.cash < user.debt) {
        return sock.sendMessage(from, { text: `❌ Duit tunai anda (RM ${user.cash.toLocaleString()}) tidak cukup bayar baki hutang RM ${user.debt.toLocaleString()}!` });
      }

      user.cash -= user.debt;
      user.debt = 0;
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `🦈 *HUTANG LANGSAI SEPENUHNYA!* Rumah anda selamat daripada disimbah cat merah. Ah Long ucap terima kasih!` 
      });
    }

    if (cmd === "deposit" || cmd === "dep") {
      const amt = args[0] === "all" ? user.cash : parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || user.cash < amt) return sock.sendMessage(from, { text: `❌ Baki tunai tidak mencukupi!` });
      user.cash -= amt;
      user.bank += amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🏦 *SIMPANAN BANK:* +RM ${amt.toLocaleString()} selamat disimpan dalam akaun bank.` });
    }

    if (cmd === "withdraw" || cmd === "wd") {
      const amt = args[0] === "all" ? user.bank : parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || user.bank < amt) return sock.sendMessage(from, { text: `❌ Baki bank tidak mencukupi!` });
      user.bank -= amt;
      user.cash += amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `💵 *PENGELUARAN:* +RM ${amt.toLocaleString()} tunai dikeluarkan ke poket.` });
    }

    if (cmd === "transfer" || cmd === "pay") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt) || amt <= 0 || user.cash < amt) {
        return sock.sendMessage(from, { text: `❌ Format: *.transfer @user [jumlah]*` });
      }
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      user.cash -= amt;
      targetUser.cash += amt;
      updateUser(cleanSender, user);
      updateUser(cleanTarget, targetUser);
      return sock.sendMessage(from, { text: `💸 *PINDAHAN:* RM ${amt.toLocaleString()} dipindahkan kepada *${targetUser.name}*!` });
    }

    // ROMPAK POKET (COOLDOWN: 2 MINIT)
    if (cmd === "rompak") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa: *.rompak @user*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      if (targetUser.cash < 100) return sock.sendMessage(from, { text: `😅 Mangsa poket kempis bawah RM100.` });

      if (now < user.cooldowns.crime && !isOwner) {
        const rem = Math.ceil((user.cooldowns.crime - now) / 1000);
        return sock.sendMessage(from, { text: `⏳ Tunggu *${rem} saat* lagi sebelum merompak semula!` });
      }

      user.cooldowns.crime = now + (2 * 60 * 1000);
      let successRate = 0.50;
      if (activePhoneObj?.perk === "pvp") successRate += activePhoneObj.val;

      if (Math.random() < successRate || isOwner) {
        const stolen = Math.floor(targetUser.cash * 0.25);
        targetUser.cash -= stolen;
        user.cash += stolen;
        user.stars = Math.min(5, user.stars + 1);
        updateUser(cleanSender, user);
        updateUser(cleanTarget, targetUser);
        return sock.sendMessage(from, { text: `🥷 *ROMPAKAN PVP:* *${user.name}* merembat *RM ${stolen.toLocaleString()}* daripada poket *${targetUser.name}*!` });
      } else {
        user.stars = Math.min(5, user.stars + 1);
        const jailTimeSec = Math.max(30, user.stars * 30);
        user.cash = Math.max(0, user.cash - 500);
        user.cooldowns.jailUntil = now + (jailTimeSec * 1000);
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 *KANTOI SAMUN:* Cubaan samun gagal! Denda RM 500 & masuk lokap ${jailTimeSec} saat!` });
      }
    }

    if (cmd === "shop" || cmd === "warung") {
      let ui = `╔═══════════════════════════╗\n   🍔 WARUNG MAKANAN AIRI\n╚═══════════════════════════╝\n`;
      FOOD_ITEMS.forEach(f => {
        ui += `• *[${f.id}]* ${f.name} ➔ RM ${f.price}\n  _${f.desc}_\n\n`;
      });
      ui += `💡 Taip *.beli_makanan [id]* & *.makan [id]*`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_makanan") {
      const fId = args[0]?.toLowerCase();
      const f = FOOD_ITEMS.find(x => x.id === fId);
      if (!f) return sock.sendMessage(from, { text: `❌ Menu makanan tidak wujud!` });
      if (user.cash < f.price) return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup!` });
      user.cash -= f.price;
      user.food.push(f.id);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🍽️ Berjaya order *${f.name}*! Taip *.makan ${f.id}* bila lapar.` });
    }

    if (cmd === "makan") {
      const fId = args[0]?.toLowerCase();
      const idx = user.food.indexOf(fId);
      if (idx === -1) return sock.sendMessage(from, { text: `❌ Makanan itu tiada dalam beg!` });
      user.food.splice(idx, 1);
      if (fId === "nasilemak") user.cooldowns.work = 0;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `😋 Kenyang padu! Semua cooldown kerja diset semula serta-merta!` });
    }

    // =====================================================================
    // 🪪 PROFIL & CARD IDENTITI
    // =====================================================================
    if (cmd === "myid" || cmd === "ic") {
      const title = getTitle(user);
      const totalWealth = user.cash + user.bank;

      let currentBio = user.bio || "Tiada Bio";
      try {
        const statusObj = await sock.fetchStatus(cleanSender);
        if (statusObj?.status) {
          currentBio = statusObj.status;
          user.bio = currentBio;
          updateUser(cleanSender, user);
        }
      } catch (e) {}

      const ui = 
`╔═══════════════════════════╗
   🪪 CYBER IDENTITY CARD
╚═══════════════════════════╝
👤 Nama Warga: *${user.name}*
📝 Bio / Status: _"${currentBio}"_
🎖️ Gelaran: ${title}
📱 Peranti: ${user.phoneName}
💵 Tunai Poket: RM ${user.cash.toLocaleString()}
🏦 Simpanan Bank: RM ${user.bank.toLocaleString()}
🦈 Hutang Ah Long: RM ${user.debt ? user.debt.toLocaleString() : "0"}
💎 Nilai Aset: RM ${totalWealth.toLocaleString()}
🏎️ Koleksi Jentera: ${user.vehicles.length} Unit
🎣 Hasil Tangkapan: ${user.stats.fishes || 0} Ekor
⭐ Bintang Wanted: ${"⭐".repeat(user.stars) || "0 (Suci Murni)"}`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "profile") {
      const vehicleList = user.vehicles.length > 0
        ? user.vehicles.map(vId => `• ${VEHICLES.find(x => x.id === vId)?.name || vId}`).join("\n")
        : "Garaj kosong.";
      const itemList = user.inventory.length > 0
        ? user.inventory.map(i => `• ${i.name}`).join("\n")
        : "Beg kosong.";
      const propList = user.properties.length > 0
        ? user.properties.map(pId => `• ${PROPERTIES.find(x => x.id === pId)?.name || pId} [Sewa: RM ${PROPERTIES.find(x => x.id === pId)?.rent}/hari]`).join("\n")
        : "Tiada pemilikan hartanah.";

      const ui = 
`╔═══════════════════════════╗
   🎒 PROFIL GARAJ & INVENTORI
╚═══════════════════════════╝
👤 Pemilik: *${user.name}*

🏎️ *GARAJ KENDERAAN:*
${vehicleList}

🏴‍☠️ *GAJET BLACK MARKET:*
${itemList}

🏢 *HARTANAH DIMILIKI:*
${propList}`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "top") {
      const topUsers = Object.entries(db.users || {})
        .map(([id, d]) => ({ name: d.name || id.split("@")[0], total: (d.cash || 0) + (d.bank || 0) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      let ui = `╔═══════════════════════════╗\n   🏆 5 JUTAWAN TERKAYA AIRI\n╚═══════════════════════════╝\n`;
      topUsers.forEach((u, i) => {
        ui += `${i + 1}. *${u.name}* ➔ RM ${u.total.toLocaleString()}\n`;
      });
      return sock.sendMessage(from, { text: ui });
    }

  });
}

startBotEngine();
