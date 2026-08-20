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
  "38956007690292" // WhatsApp ID unik dikesan Baileys
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
          <p style="color:#64748b;font-size:0.9rem;">Sistem akan automatik bersambung sebaik sahaja diimbas.</p>
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
// 💾 2. SISTEM DATABASE JSON KUKUH
// =========================================================================
const DB_FILE = "./database.json";
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, groups: [], activeEvents: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE));
  } catch (e) {
    return { users: {}, groups: [], activeEvents: {} };
  }
}
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getUser(userId, pushName = "Warga Cyber") {
  const db = loadDB();
  if (!db.users[userId]) {
    db.users[userId] = {
      name: pushName || "Warga Cyber",
      bio: "Tiada Bio",
      cash: 500,
      bank: 0,
      debt: 0,
      jobId: 1,
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
      stats: { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0 },
      cooldowns: { workJobs: {}, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, rent: 0 }
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
  if (!u.stats) u.stats = { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0 };
  if (!u.cooldowns) u.cooldowns = { workJobs: {}, crime: 0, jailUntil: 0, daily: 0, race: 0, fish: 0, rent: 0 };
  if (!u.cooldowns.workJobs) u.cooldowns.workJobs = {};
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
  { id: "infinixgt", name: "Infinix GT 20 Pro 🎮", price: 1200, bonus: "Cip bypass charger, potong 30s cooldown kerja", perk: "cd", val: 30000 },
  { id: "poco_f6", name: "POCO F6 Speed Beast ⚡", price: 1800, bonus: "Talaan cip litar, peluang menang drag +7%", perk: "race", val: 0.07 },
  { id: "iqoo12", name: "iQOO 12 Monster Gaming 🐉", price: 3300, bonus: "Skrin 144Hz lancar gila, peluang menang drag +15%", perk: "race", val: 0.15 },
  { id: "rog8", name: "ROG Phone 8 Pro 🕶️", price: 4600, bonus: "AirTrigger haptic, peluang rompak kawan +12%", perk: "pvp", val: 0.12 },
  { id: "ip15pro", name: "iPhone 15 Pro Titanium 🍏", price: 5400, bonus: "Gaya korporat T20, gaji kerja halal +20%", perk: "work", val: 0.20 },
  { id: "s24ultra", name: "Samsung Galaxy S24 Ultra AI 🤖", price: 6200, bonus: "S-Pen Decryptor AI, peluang jenayah +15%", perk: "crime", val: 0.15 },
  { id: "magicv2", name: "HONOR Magic V2 Lipat 📂", price: 6900, bonus: "Dwi-skrin trader, faedah dividen bank +10%", perk: "bank", val: 0.10 },
  { id: "shadow_phone", name: "Shadow Legion X CyberDeck 🐺", price: 15000, bonus: "Gajet Ultimate Founder! +20% Lumba & Kerja, 50% Kebal Denda", perk: "god", val: 0.20 }
];

// =========================================================================
// 💼 4. SEKTOR 50 KERJAYA HALAL LENGKAP
// =========================================================================
const JOBS = [
  { id: 1, name: "Pekerja Am Majlis", pay: 30 }, { id: 2, name: "Pencuci Pinggan Kedai Tomyam", pay: 40 }, { id: 3, name: "Rider GrabFood Berhujan", pay: 60 },
  { id: 4, name: "Runner Foodpanda Pink", pay: 65 }, { id: 5, name: "Pemandu Van Jenazah/Kargo", pay: 80 }, { id: 6, name: "Kerani Kaunter Pejabat", pay: 100 },
  { id: 7, name: "Juruteknik Aircond & Wiring", pay: 120 }, { id: 8, name: "Operator Kilang Shift Malam", pay: 130 }, { id: 9, name: "Penebar Burger Ramly Special", pay: 150 },
  { id: 10, name: "Barista Kopi Hipster", pay: 160 }, { id: 11, name: "Jurujual Coway / Cuckoo", pay: 180 }, { id: 12, name: "Tukang Masak Katering Kenduri", pay: 200 },
  { id: 13, name: "Graphic Designer Canva Pro", pay: 250 }, { id: 14, name: "Video Editor TikTok Viral", pay: 260 }, { id: 15, name: "Social Media Admin Group", pay: 280 },
  { id: 16, name: "Ejen Hartanah Rumah Lelong", pay: 300 }, { id: 17, name: "Tukang Paip Rumah Bocor", pay: 320 }, { id: 18, name: "Juruelektrik Tiga Fasa", pay: 350 },
  { id: 19, name: "Mekanik Motor Modenas/Yamaha", pay: 380 }, { id: 20, name: "Foreman Bengkel Kereta", pay: 400 }, { id: 21, name: "Cikgu Tuisyen SPM Matematik", pay: 420 },
  { id: 22, name: "Jurutera Tapak Bina JKR", pay: 500 }, { id: 23, name: "Akauntan Audit LHDN", pay: 550 }, { id: 24, name: "Pengurus Projek MRT3", pay: 600 },
  { id: 25, name: "Peguam Mahkamah Majistret", pay: 700 }, { id: 26, name: "Doktor Pakar Klinik Kesihatan", pay: 800 }, { id: 27, name: "Software Engineer Fullstack", pay: 900 },
  { id: 28, name: "Data Scientist Machine Learning", pay: 950 }, { id: 29, name: "Pilot AirAsia / MAS", pay: 1200 }, { id: 30, name: "Kapten Kapal Dagang Antarabangsa", pay: 1300 },
  { id: 31, name: "Arkitek Bangunan Pencakar Langit", pay: 1100 }, { id: 32, name: "Pakar Bedah Jantung", pay: 1500 }, { id: 33, name: "Trader Forex Pacak Signal", pay: 400 },
  { id: 34, name: "Pelombong Bitcoin / Kripto", pay: 450 }, { id: 35, name: "Content Creator YouTube", pay: 500 }, { id: 36, name: "Streamer Mobile Legends", pay: 550 },
  { id: 37, name: "Tukang Jahit Baju Melayu", pay: 200 }, { id: 38, name: "Web Developer Freelance", pay: 800 }, { id: 39, name: "Ejen Insurans Takaful", pay: 350 },
  { id: 40, name: "Pengurus Cawangan Bank", pay: 1000 }, { id: 41, name: "Cef Eksekutif Hotel 5 Bintang", pay: 1100 }, { id: 42, name: "Jurugambar Acara Perkahwinan", pay: 400 },
  { id: 43, name: "Juruaudit Forensik SPRM", pay: 750 }, { id: 44, name: "Kontraktor Bina Banglo", pay: 900 }, { id: 45, name: "Ahli Farmasi Berdaftar", pay: 850 },
  { id: 46, name: "Pakar Psikologi Kaunseling", pay: 950 }, { id: 47, name: "Penganalisis Keselamatan Siber", pay: 1200 }, { id: 48, name: "Pakar Ekonomi Negara", pay: 1400 },
  { id: 49, name: "Pelabur Saham Bursa Malaysia", pay: 2000 }, { id: 50, name: "CEO Konglomerat Korporat", pay: 2500 }
];

// =========================================================================
// 🏎️ 5. SHOWROOM 40 KENDERAAN ASLI MALAYSIA
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
// 🔧 6. BENGKEL MODIFIKASI DINAMIK (MENGIKUT JENIS JENTERA GARAJ)
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
  { id: 2, name: "Flash-Drive Decrypter Bank 💾", price: 50000, desc: "Pintas sistem firewall keselamatan bank pusat" },
  { id: 3, name: "EMP Radio Jammer Polis 📡", price: 100000, desc: "Kacau frekuensi radio peronda polis pelabuhan" },
  { id: 4, name: "Kad Akses VIP Kasino 💳", price: 250000, desc: "Buka pintu bilik kebal kasino underground" },
  { id: 5, name: "Flipper Zero Modded Cyber 🐬", price: 500000, desc: "Alat godam induk infrastruktur pangkalan data" },
  { id: 6, name: "Radar Detector Penguatkuasa 🛰️", price: 15000, desc: "Gajet amaran awal potong 20% risiko ditangkap polis" },
  { id: 7, name: "Dokumen Pelepasan Kastam Palsu 📄", price: 12000, desc: "Pelepasan segera sekatan roadblock pelabuhan" },
  { id: 8, name: "Van Panel Dinding Berlapis 🚐", price: 35000, desc: "Logistik darat kalis imbasan x-ray sekatan jalan" },
  { id: 9, name: "Bot Pancung 4 Enjin Yamaha 🚤", price: 45000, desc: "Logistik laut meredah laluan tikus perairan" },
  { id: 10, name: "Dron Kargo Penglihatan Malam 🛸", price: 28000, desc: "Hantar bungkusan kontraban pintas pagar sempadan" }
];

const CRIMES = [
  { id: 1, name: "Ragut Beg Tepi Jalan 👜", rewardMin: 50, rewardMax: 150, fine: 100, stars: 1 },
  { id: 2, name: "Rompak Kedai Runcit Acheh 🏪", rewardMin: 150, rewardMax: 300, fine: 250, stars: 1 },
  { id: 3, name: "Kopek Mangga Motor Parkir 🏍️", rewardMin: 300, rewardMax: 600, fine: 500, stars: 2 },
  { id: 4, name: "Pecah Masuk Kedai Emas 💍", rewardMin: 700, rewardMax: 1500, fine: 1200, stars: 2 },
  { id: 5, name: "Rompak Banglo Orang Kaya 🏡", rewardMin: 1500, rewardMax: 3000, fine: 2500, stars: 3 },
  { id: 6, name: "Skimming Mesin ATM 🏧", rewardMin: 3500, rewardMax: 6000, reqItem: 1, fine: 4500, stars: 3 },
  { id: 7, name: "Seludup Rokok & Vape Kontraban 🚬", rewardMin: 4000, rewardMax: 8000, reqItem: 8, fine: 5500, stars: 3 },
  { id: 8, name: "Seludup Minuman Keras Bebas Cukai 🍾", rewardMin: 9000, rewardMax: 16000, reqItem: 9, fine: 7500, stars: 3 },
  { id: 9, name: "Godam Sistem Bank Pusat 💻", rewardMin: 7000, rewardMax: 12000, reqItem: 2, fine: 8500, stars: 4 },
  { id: 10, name: "Seludup Cip AI & Kad Grafik GPU 🧠", rewardMin: 20000, rewardMax: 38000, reqItem: 10, fine: 15000, stars: 4 },
  { id: 11, name: "Penyeludupan Kontraban Port Klang 🚢", rewardMin: 15000, rewardMax: 25000, reqItem: 3, fine: 14000, stars: 4 },
  { id: 12, name: "Heist Bilik Kebal Kasino Genting 🎰", rewardMin: 30000, rewardMax: 60000, reqItem: 4, fine: 25000, stars: 5 },
  { id: 13, name: "Seludup Supercar Tanpa AP 🏎️", rewardMin: 50000, rewardMax: 95000, reqItem: 9, fine: 35000, stars: 5 },
  { id: 14, name: "Eksploitasi Darkweb Zero-Day 🌐", rewardMin: 80000, rewardMax: 200000, reqItem: 5, fine: 45000, stars: 5 },
  { id: 15, name: "Godam Induk Penguatkuasa Padam Rekod 🏛️", rewardMin: 150000, rewardMax: 350000, reqItem: 5, fine: 80000, stars: 5 }
];

// =========================================================================
// 🏢 8. SEKTOR HARTANAH & SEWAAN (ID 1 - 6)
// =========================================================================
const PROPERTIES = [
  { id: 1, name: "Flat PPR Lembah Subang 🏢", price: 35000, rent: 350 },
  { id: 2, name: "Rumah Teres 1 Tingkat Bangi 🏡", price: 120000, rent: 1100 },
  { id: 3, name: "Kondominium Mewah KLCC 🏙️", price: 450000, rent: 3800 },
  { id: 4, name: "Semi-D Tropika Shah Alam 🏡", price: 850000, rent: 7500 },
  { id: 5, name: "Banglo Cyberjaya Elite 🏰", price: 1500000, rent: 12000 },
  { id: 6, name: "Penthouse Skyview TRX 🌌", price: 3500000, rent: 28000 }
];

// =========================================================================
// 🍔 9. WARUNG MAKANAN AIRI
// =========================================================================
const FOOD_ITEMS = [
  { id: "tehtarik", name: "Teh Tarik Kaw Buih 🧋", price: 4, desc: "Potong 1 minit cooldown kerja" },
  { id: "roticanai", name: "Roti Canai Banjir Dhal 🥞", price: 7, desc: "Potong 2 minit cooldown kerja" },
  { id: "nasilemak", name: "Nasi Lemak Sotong Padu 🍛", price: 12, desc: "Reset serta-merta semua cooldown kerja!" },
  { id: "burger", name: "Burger Ramly Special Cheese 🍔", price: 15, desc: "Kenyang padu, kurangkan denda balai 10%" }
];

// =========================================================================
// 🔥 10. PERPUSTAKAAN 20 DIALOG ROASTING SETIAP COMMAND
// =========================================================================
const ROASTS = {
  kerja: [
    "Wah berpeluh dahi macam lari marathon, tapi gaji masuk cukup buat beli kuaci je!",
    "Rajin betul kau buat shift harini, ingatkan pemalas tegar nombor satu dalam group ni.",
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
  daily: [
    "Nah sedekah RM250! Jangan buat beli vape perisa pelik-pelik pulak petang ni.",
    "Cukup 24 jam muka kau tercegat mintak elaun free, dasar B40 tegar betul!",
    "Bantuan harian dah landing. Kalau poket bocor lagi esok, pandai-pandai la tadah tangan balik.",
    "Ambil duit ni buat beli beras, jangan sibuk nak buat modal belanja awek cyber!",
    "Macam jam dinding tepat betul timing kau claim elaun free ni tiap-tiap hari.",
    "Nah RM250 masuk poket. Syukur sikit, jangan esok merungut duit tak cukup!",
    "Tuntutan harian diluluskan! Jangan lupa bersyukur kat Airi's Corner Grid.",
    "Duit free dah masuk! Pergi beli makanan berkhasiat sikit, muka dah pucat tu.",
    "Setiap hari tak pernah miss claim duit free. Kalau kerja rajin macam ni kan bagus!",
    "Nah RM250 elaun rakyat miskin bandar. Guna elok-elok jangan bagi Ah Long!",
    "Duit bantuan masuk! Jangan dok pamer kat status WhatsApp ingat kaya sangat.",
    "Ambil duit ni pekena teh tarik mamak, rehatkan otak yang serabut tu.",
    "Claim jangan tak claim, selagi bot ni tak bankrap selagi tu kau mintak kan?",
    "Duit free dah dikreditkan. Sila gunakan untuk tujuan berfaedah bukan judi!",
    "Nah RM250 buat duit poket. Jangan lupa sedekah kat tabung masjid sikit.",
    "Rezeki terpijak 24 jam sekali. Habiskan hari ni, esok merana balik!",
    "Tangan menadah menerima bantuan. Teruskan tradisi claim harian anda!",
    "Duit bantuan mendarat selamat dalam wallet kau. Bersorak sikit!",
    "Nah elaun sara hidup. Harap-harap cukup la buat bayar bil api air tertunggak tu.",
    "Sistem meluluskan dana percuma untuk kau. Jangan boros sangat bro!"
  ],
  crime_win: [
    "Fuh licik betul! Polis peronda pun rabun tak nampak kau rembat duit haram ni.",
    "Bagus bakat menyamun kau, mak bapak tengok pun geleng kepala bangga!",
    "Duit haram masuk poket! Hati-hati jangan sampai kantoi kena sebat kat lokap nanti.",
    "Operasi underground settle bersih! Jangan pamer sangat kekayaan tu kang polis hidu.",
    "Senyap-senyap buat kerja, hasil lumayan! Kingpin underworld tengok pun tabik.",
    "Loot berjaya disapu licin! Penjenayah profesional berjiwa kental betul kau ni.",
    "Lari laju macam peluru, polis sampai kau dah sampai kedai mamak minum kopi.",
    "Duit haram mendarat! Ingat, sepandai-pandai tupai melompat akhirnya jatuh ke tanah jugak.",
    "Masyuk poket malam ni! Jangan lupa belanja runner yang tolong cover line tadi.",
    "Operasi gelap berjaya tanpa bunyi siren polis. Mastermind sebenar!",
    "Gaya macam perompak Hollywood, hasil macam jackpot kasino. Mantap!",
    "Rembatan berjaya! Simpan duit tu dalam bank cepat sebelum kena paw dengan geng lain.",
    "Polis cari kat timur, kau dah lari ke barat. Memang licik macam belut!",
    "Rezeki haram malam jumaat! Lepas ni taubat la sikit bro, jangan buat selalu.",
    "Barang rampasan dah selamat dalam genggaman. Jual kat Black Market cepat!",
    "Misi selesai tanpa kecederaan! Boleh tidur lena atas timbunan duit malam ni.",
    "Pihak berkuasa tengah pening kepala cari bukti, kau rileks hisap rokok tepi jalan.",
    "Hasil rompakan padu! Hati-hati roadblock besar kat simpang depan tu.",
    "Underworld Airi mengiktiraf bakat jahat kau harini. Teruskan operasi gelap!",
    "Loot bersih masuk wallet. Jangan dok berlagak sangat kang ada member buat report!"
  ],
  crime_fail: [
    "Muka macam perompak legend sekali kopek mangga pun kantoi, tepuk dahi polis balai!",
    "Acah-acah kingpin sekali polis hon terus terkencing dalam seluar. Masuk lokap padan muka!",
    "Skill menyamun taraf budak tadika. Duduk lokap diam-diam renung dinding tu!",
    "Nak buat jahat tapi otak tinggal kat rumah. Kan dah kena denda dengan mahkamah!",
    "Baru nak seluk tangan, siren polis dah berbunyi. Lari macam lipas kudung pun kena tangkap!",
    "Gagal total! Member lari tinggal kau sorang-sorang kena gari dengan inspektor.",
    "Cita-cita nak jadi jutawan gelap, tapi realiti jadi penghuni tetap lokap balai.",
    "Tangan terketar-ketar masa buat kerja, kan dah kantoi depan CCTV HD!",
    "Polis tak payah siasat pun, kau sendiri yang tinggalkan kad pengenalan kat tempat kejadian.",
    "Denda melayang, badan meringkuk dalam lokap. Buat malu persatuan penjenayah je!",
    "Ingat senang nak jadi mastermind? Pergi belajar kopek kelapa dulu la bro!",
    "Kena tangkap basah dengan polis peronda. Sediakan RM500 siap-siap upah peguam!",
    "Nasib badan, baru nak merasa duit haram dah kena ketuk dengan cota polis.",
    "Lokap menunggu kedatangan kau. Tidur beralaskan simen sejuk la malam ni!",
    "Acah mafia sekali kena gari terus menangis panggil mak. Lawak betul!",
    "Misi hancur bersepai! Duit denda lagi mahal daripada nilai barang yang kau nak curi.",
    "Polis tersenyum lebar dapat tangkap penjenayah paling amatur tahun ini.",
    "Jangan mimpi nak lari, balai polis dah jadi rumah kedua kau nampaknya.",
    "Kantoi teruk! Duduk dalam lokap tu renung la masa depan yang makin gelap.",
    "Operasi gagal! Lain kali beli gajet Black Market dulu, jangan main redah bodoh-bodoh!"
  ],
  race_win: [
    "Jentera berdesup tinggalkan asap tebal! Lawan kau tengah menangis tolak motor kat belakang.",
    "Menang drag race malam ni! Boleh la sembang kencang kat kedai mamak sampai subuh.",
    "Pecutan kilat membelah angin malam! Lawan kau ingatkan tengah lumba dengan roket.",
    "Potong angin di garisan penamat! Jentera padu, pemandu ada skil bukan sembang kari.",
    "Lawan tergamam tengok lampu belakang kau hilang dalam kegelapan highway.",
    "Juara litar jalanan rasmi! Duit taruhan masuk poket, maruah dijulang tinggi.",
    "Enjin ngaum garang, dyno setting menjadi! Pelesit rempit nombor 1 Airi Corner.",
    "Menang bergaya tanpa calar! Lawan kau balik rumah terus jual jentera dia kat kedai besi buruk.",
    "Pecutan gear akhir padu gila! Asap ekzos kau buat lawan tersedak kat belakang.",
    "Trofi dan duit tunai milik kau! Jangan lupa servis minyak hitam lepas lumba ni.",
    "Kelebihan jentera terbukti! Highway malam ni kau yang punya seorang.",
    "Lawan acah-acah pickup laju, sekali kau tekan NOS terus dia hilang dari cermin sisi.",
    "Kemenangan mutlak di atas tar jalanan! Budak-budak bengkel bersorak bangga.",
    "Kelajuan membunuh keraguan! Hadiah lumba dah selamat masuk akaun tunai kau.",
    "Litar Karak ke MEX Highway semua kau tapau bersih. Memang pelesit sejati!",
    "Jentera standard kilang pun boleh menang sebab rider ada ilmu. Tabik spring!",
    "Lawan menangis tepi divider jalan tengok kau angkat piala kemenangan.",
    "Pecutan sempurna dari garisan mula! Tiada siapa mampu kejar bayang jentera kau.",
    "Drag race tamat dengan kemenangan manis! Belanja member ngeteh malam ni bro!",
    "Hebat tak bertempat! Nama kau kini meniti di bibir geng lumba haram seluruh bandar."
  ],
  race_lose: [
    "Acah pelumba F1 sekali terbabas cium divider jalan. Kos bengkel lagi mahal dari maruah kau!",
    "Bawa jentera macam siput sedut ada hati nak ajak drag race. Pergi balik kampung la!",
    "Enjin berasap tayar meletup! Mekanik bengkel gelak besar tengok dompet kau kena kikis.",
    "Ketinggalan 5 tiang lampu kat belakang. Baik kau kayuh basikal lajak je lepas ni!",
    "Baru masuk gear 3 enjin dah semput. Pergi hantar bengkel buat overhaul dulu!",
    "Terbabas ke parit tepi jalan! Nasib baik nyawa panjang, duit baiki melayang.",
    "Kalah teruk dengan jentera lawan. Muka tebal tahan malu kena bahan dengan penonton.",
    "Pulas throttle sampai habis tapi jentera macam tak bergerak. Berat dosa ke bro?",
    "Mekanik pesan bawak elok-elok, kau pergi hentam divider. Kan dah kena bayar bil bengkel!",
    "Kalah drag race! Balik rumah tidur la, jangan sembang pasal kelajuan lagi.",
    "Lawan tekan sikit je terus berdesup, kau kat belakang terkial-kial tukar gear.",
    "Jentera hancur, poket rabak. Pengajaran berguna supaya ukur baju di badan sendiri!",
    "Topspeed ke laut, handling ke parit. Baik simpan jentera tu buat tukun tiruan!",
    "Acah raja rempit sekali kena tapau dengan motor hantar surat. Memang memalukan!",
    "Tewas di selekoh maut! Duit repair kena bayar serta-merta tanpa diskaun.",
    "Gaya dah ada, helmet mahal, tapi bila lumba jentera semput macam batuk kokol.",
    "Kalah lumba jangan salahkan angin highway, salahkan tangan sendiri yang tak pandai shift!",
    "Enjin panas berasap putih! Terpaksa panggil towing tolak balik garaj.",
    "Lawan dah sampai kedai mamak minum air, kau baru terkial-kial lepas separuh trek.",
    "Tewas bermaruah konon, padahal tertinggal jauh tak nampak bayang lawan langsung!"
  ],
  rompak_win: [
    "Aduh kesian mangsa kena rembat! Lain kali simpan duit dalam bank bukan bawah bantal.",
    "Penyamun terlatih! Mangsa tercari-cari dompet dia ingat tertinggal kat kedai tomyam.",
    "Masyuk poket merompak kawan sendiri. Kawan makan kawan betul zaman siber ni!",
    "Tangan pantas menyeluk poket mangsa! Duit tunai berpindah milik dalam sekelip mata.",
    "Mangsa tengah leka main phone, kau rembat duit dia licin. Memang licik!",
    "Rompakan PvP berjaya tanpa disedari! Simpan cepat dalam bank sebelum dia sedar.",
    "25% duit tunai mangsa lesap masuk poket kau. Jangan senyum sangat kang dia syak!",
    "Pantas macam ninja, licik macam kancil. Dompet mangsa kini kempis merana.",
    "Mangsa perasan duit kurang tapi ingat dia yang boros belanja. Bijak betul kau!",
    "Hasil rompakan kawan sendiri! Lain kali suruh dia rajin guna command .deposit.",
    "Rezeki terpijak atas kecuaian orang lain. Jangan pamer sangat duit rembat tu!",
    "Seluk sikit dapat berkoyan-koyan. Malam ni boleh tidur lena sambil peluk duit.",
    "Mangsa mengeluh duit hilang, kau kat sebelah buat muka suci tak bersalah.",
    "Rompakan bersih tanpa sebarang saksi. Profesional gangster tahap tertinggi!",
    "Duit tunai mangsa selamat dipindahkan ke poket kau. Terbaik skil menyamun!",
    "Kawan baik pun kau samun selamba. Memang tiada belas kasihan di Airi Grid!",
    "Mangsa check baki terus pitam. Poket dia kosong, poket kau membuncit kaya.",
    "Operasi rembat poket berjaya! Pergi belanja mamak guna duit kawan tu cepat.",
    "Licik menyelinap di belakang mangsa. Skil tangan panjang kau memang terbukti!",
    "Rompakan PvP sempurna! Ingat, jangan sampai terkena batang hidung sendiri nanti."
  ],
  rompak_fail: [
    "Nak merompak kawan sekali kawan tu lagi gangster dari kau! Kena tibai free-free.",
    "Tangan terketar-ketar macam kena parkinson masa nak seluk poket. Kan dah kantoi!",
    "Gagal menyamun! Sekarang kau kena denda dan dihumban ke lokap, buat malu keturunan je.",
    "Mangsa tangkap tangan kau tengah seluk beg dia. Terus kena serah kat polis peronda!",
    "Baru nak pegang dompet orang, mangsa dah pusing tomoi muka kau. Berlebam biji mata!",
    "Kantoi teruk depan orang ramai! Duit melayang kena denda, badan masuk lokap 3 minit.",
    "Ingat kawan kau tu lemah ke? Sekali dia jerkah terus kau serah diri kat balai.",
    "Cubaan rompakan amatur! Mangsa gelak besar tengok skil kau yang langsung tak menjadi.",
    "Tak pasal-pasal kena hempuk dengan helmet mangsa. Sakit dapat, duit pun hilang!",
    "Gagal total! Mangsa dah simpan duit dalam bank, kau seluk poket kosong habuk je ada.",
    "Kena tangkap basah tengah meraba dompet orang. Duduk lokap renung nasib malang!",
    "Niat jahat tak kesampaian. Mahkamah arahkan kau bayar ganti rugi kat mangsa.",
    "Muka tebal macam simen jalan bila kantoi cuba samun ahli group sendiri.",
    "Mangsa jerit 'PENCURI!' terus satu kampung kejar kau sampai balai polis.",
    "Skil menyamun taraf budak tadika, nak cuba rompak orang otai. Memang cari nahas!",
    "Gari besi melekat di tangan. Meringkuk la dalam lokap tu sampai masa tamat.",
    "Denda polis melayang keluar wallet. Lain kali jangan berangan nak jadi Robin Hood palsu!",
    "Cubaan menyamun yang memalukan. Satu group WhatsApp pakat gelakkan kau harini!",
    "Mangsa pasang perangkap, kau yang masuk jerat. Padan muka kena kurung lokap!",
    "Tangan gatal nak mencuri tapi otak lembap. Kan dah kena denda tunai serta-merta!"
  ],
  casino_win: [
    "JACKPOT MELETUP! Bandar kasino menangis tengok duit berguni masuk akaun kau.",
    "Tuah ayam nampak di kaki, tuah kau menang judi gelap! Kaya cara haram sekejap.",
    "Pilihan tepat! Duit taruhan berlipat ganda masuk wallet macam air terjun.",
    "Bandar tepuk dahi, kau bersorak gembira! Jangan lupa cuci duit tu kat bisnes sah.",
    "Menang besar malam ni! Pergi belanja satu group makan tomyam segera!",
    "Kombinasi bertuah mengena tepat! Duit kasino kini sah jadi hak milik kau.",
    "Rezeki nombor ekor & mesin slot menyebelahi kau. Simpan sikit jangan habiskan balik!",
    "Bandar kasino bisik: 'Nasib kau baik malam ni bro, esok datang main lagi eh'.",
    "Pecutan jackpot luar biasa! Baki tunai kau melambung tinggi dalam sekelip mata.",
    "Menang judi! Jangan dok bangga sangat, esok lusa silap hari bulan licin balik.",
    "Tuah anak rantau berpihak pada kau. Duit taruhan berganda 100%!",
    "Menang bergaya di meja taruhan! Semua kaki judi dalam kelab pandang jeles.",
    "Kemenangan manis kasino bawah tanah. Ambil duit tu cepat sebelum bandar ubah fikiran!",
    "Ong mari! Muka senyum lebar sampai ke telinga tengok timbunan duit menang judi.",
    "Jackpot 777 berbunyi nyaring! Poket kempis tadi terus kembung macam belon.",
    "Percaturan berani membawa pulangan lumayan. Tahniah penembak jackpot!",
    "Duit menang kasino masuk akaun. Hati-hati jangan sampai pihak LHDN perasan!",
    "Pusingan bertuah! Duit bertambah, gelaran kaki judi legend makin melekat.",
    "Menang taruhan malam jumaat! Esok pergi sedekah sikit bersihkan harta tu bro.",
    "Rezeki mesin kasino cyber! Kaut semua duit tu bawak lari balik rumah cepat!"
  ],
  casino_lose: [
    "Duit taruhan lesap sekelip mata! Bandar kasino senyum sinis simpan duit kau dalam peti.",
    "Kalah judi lagi! Kan dah pesan, rumah judi takkan pernah rugi, kau yang selalu kena!",
    "Tergamam tengok baki tunai jadi kosong. Balik rumah hisap jari la nampaknya.",
    "Mesin slot telan duit kau tanpa belas kasihan. Padan muka berangan nak cepat kaya!",
    "Kalah total di meja judi! Jangan dok mengamuk baling kerusi kasino pulak.",
    "Duit gaji siang tadi habis dimeja judi malam ni. Esok makan megi bujang je la!",
    "Bandar gelak besar kira duit kau. Lain kali pergi sedekah tabung masjid lagi berfaedah.",
    "Nasib malang tak berbau! Taruhan hancur bersepai, poket tinggal habuk kotor.",
    "Berangan nak jackpot sekali kena sedekah kat tokey kasino. Memang malang!",
    "Kalah judi sampai poket rabak. Ni kalau bini tahu confirm kena tidur luar rumah!",
    "Tuah tak menyebelahi kau harini. Balik tidur la, jangan dok perabih duit lagi.",
    "Syiling lambung salah, mesin slot tak kena. Lengkap pakej kerugian hari ini!",
    "Duit melayang terbang ke langit. Menyesal kemudian tiada guna bro!",
    "Tokey kasino lambai tangan sambil senyum: 'Terima kasih atas derma ikhlas anda!'.",
    "Kalah taruhan! Nak pinjam duit Ah Long ke tu? Fikir masak-masak sebelum kena simbah cat!",
    "Semua taruhan hangus! Sila muhasabah diri dan kembali ke jalan yang benar.",
    "Duit tunai disedut mesin kasino macam vakum. Putus asa jelah bro!",
    "Kalah judi muka masam macam cuka. Jangan lepaskan geram kat member group pulak!",
    "Satu sen pun tak tinggal! Kasino underground berjaya memufliskan dompet kau.",
    "Kalah teruk! Pengajaran supaya jangan percaya nasib bulat-bulat di meja judi."
  ]
};

// =========================================================================
// 🏅 11. SISTEM LENCANA BERPERINGKAT (RARITY RANKED TEXT BADGES)
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
    const badgeCert = `╭━━━ 🎖️ *PENSIJILAN LENCANA RASMI* ━━━
┃ 🌐 *AIRI'S CORNER RECOGNITION*
┃ 👤 Penerima: *${userName}*
┃ 🏅 Lencana: *${bName}*
┃ 🏛️ Pengeluar: *Airi's Corner Grid Authority*
┃ 📜 Status: *SAH & TERPAUT DI PROFIL KAD ID*
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    await sock.sendMessage(from, { text: badgeCert }).catch(() => {});
  }
}

// =========================================================================
// 🚀 12. ENGINE UTAMA BAILEYS & PENGENDALI MESEJ WHATSAPP
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
      console.log("⚡ Kod QR baharu telah dijana. Sila imbas di web.");
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

  // Sambut Ahli Baharu: Tarik Nama WhatsApp & Bio Terkini
  sock.ev.on("group-participants.update", async (anu) => {
    if (anu.action === "add") {
      for (const num of anu.participants) {
        const cleanId = num.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        
        let wsName = "";
        let wsBio = "";

        try {
          const [contactInfo] = await sock.onWhatsApp(cleanId);
          wsName = contactInfo?.notify || "";
        } catch (e) {}

        try {
          const statusObj = await sock.fetchStatus(cleanId);
          wsBio = statusObj?.status || "";
        } catch (e) {
          wsBio = "Tiada Bio";
        }

        const dbUser = getUser(cleanId, wsName || "Warga Baru");
        const finalName = wsName || (dbUser.name !== "Warga Baru" ? dbUser.name : "Warga Baru");
        const finalBio = wsBio && wsBio.trim() !== "" ? wsBio : "Tiada status bio";

        dbUser.name = finalName;
        dbUser.bio = finalBio;
        updateUser(cleanId, dbUser);

        const welcomeText = `╭━━━ 👋 *SELAMAT DATANG KE AIRI'S CORNER* ━━━
┃ 👤 *Nama WhatsApp:* ${finalName}
┃ 📝 *Bio / Status:* _"${finalBio}"_
┃
┃ 🎁 *Starter Pack:* +RM 500 & Badge [🌱 [COMMON] Warga Baru]
┃ 📜 Sila patuhi peraturan komuniti & jangan jadi batu kayu!
┃
┃ 💡 Taip *.menu* untuk memulakan kerjaya & aktiviti RPG.
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        await sock.sendMessage(anu.id, {
          text: welcomeText,
          mentions: [cleanId]
        }).catch(() => {});
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
  // 🎲 5 RANDOM GROUP INTERACTIVE EVENTS (Setiap 25 Minit)
  // =========================================================================
  setInterval(async () => {
    const db = loadDB();
    if (!db.groups || db.groups.length === 0) return;

    const eventTypes = ["airdrop", "roadblock", "boss", "soalan", "lelong"];
    const chosenEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    for (const gId of db.groups) {
      if (!db.activeEvents) db.activeEvents = {};

      if (chosenEvent === "airdrop") {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const reward = Math.floor(1000 + Math.random() * 2500);
        db.activeEvents[gId] = { type: "airdrop", code, reward, expires: Date.now() + 120000 };
        saveDB(db);

        const airdropMsg = `╭━━━ 🪂 *KOTAK AIRDROP JATUH DARI LANGIT!* ━━━
┃ 📦 Sebuah peti bekalan tunai cyber terhempas di tengah group!
┃ 💰 Nilai Bekalan: *RM ${reward.toLocaleString()}*
┃ 🔑 Kod Akses Dekripsi: *${code}*
┃
┃ ⚡ *CARA REBUT:*
┃ Taip *.rebut ${code}* terpantas untuk kaut semua duit!
┃ ⏳ _Peti akan meletup musnah dalam masa 2 minit._
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(gId, { text: airdropMsg }).catch(() => {});
      }

      else if (chosenEvent === "roadblock") {
        db.activeEvents[gId] = { type: "roadblock", expires: Date.now() + 180000 };
        saveDB(db);

        const roadblockMsg = `╭━━━ 🚨 *SEKATAN JALAN RAYA (ROADBLOCK PANAS)* ━━━
┃ 🚔 Pasukan Trafik & JPJ membuka sekatan besar-besaran di bandar!
┃ ⚠️ Semua warga yang mempunyai 2 Bintang Wanted ke atas berisiko disaman!
┃
┃ 🛡️ *CARA SELESAIKAN:*
┃ Taip *.tunjuk_lesen* untuk elak disita dan dapat bonus RM 300!
┃ ⏳ _Operasi roadblock berlangsung selama 3 minit._
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(gId, { text: roadblockMsg }).catch(() => {});
      }

      else if (chosenEvent === "boss") {
        const bossHp = 5;
        const reward = 5000;
        db.activeEvents[gId] = { type: "boss", hp: bossHp, maxHp: bossHp, reward, attackers: [], expires: Date.now() + 180000 };
        saveDB(db);

        const bossMsg = `╭━━━ 👹 *SERANGAN BOSS UNDERWORLD: KINGPIN GENG* ━━━
┃ 🦹 Boss Mafia sedang mengganas & memeras ugut warga group!
┃ ❤️ Nyawa Boss: *[ 5 / 5 HP ]*
┃ 💰 Ganjaran Tumbangkan: *RM ${reward.toLocaleString()}*
┃
┃ ⚔️ *CARA SERANG:*
┃ Taip *.serang_boss* beramai-ramai untuk kurangkan HP!
┃ ⏳ _Boss akan melarikan diri dalam 3 minit jika tidak dikalahkan._
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(gId, { text: bossMsg }).catch(() => {});
      }

      else if (chosenEvent === "soalan") {
        const mathA = Math.floor(15 + Math.random() * 45);
        const mathB = Math.floor(12 + Math.random() * 38);
        const ans = (mathA * 2 + mathB).toString();
        const reward = 1200;
        db.activeEvents[gId] = { type: "soalan", ans, reward, expires: Date.now() + 90000 };
        saveDB(db);

        const soalanMsg = `╭━━━ 🧠 *KUIZ MINDA SIBER KILAT* ━━━
┃ 🤖 AI Grid menguji kepantasan logik minda warga group!
┃ ❓ Soalan: *Berapakah (${mathA} x 2) + ${mathB}?*
┃ 💰 Hadiah Pintar: *RM ${reward.toLocaleString()}*
┃
┃ 💡 *CARA JAWAB:*
┃ Taip *.jawab [jawapan]* (Contoh: *.jawab 50*)
┃ ⏳ _Masa menjawab: 90 saat sahaja._
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(gId, { text: soalanMsg }).catch(() => {});
      }

      else if (chosenEvent === "lelong") {
        const reward = Math.floor(2000 + Math.random() * 3000);
        db.activeEvents[gId] = { type: "lelong", highestBid: 500, winner: null, reward, expires: Date.now() + 120000 };
        saveDB(db);

        const lelongMsg = `╭━━━ 🏷️ *LELONGAN KOTAK MISTERI BLACK MARKET* ━━━
┃ 📦 Sebuah kontena kargo gelap tanpa nama dibuka untuk lelongan!
┃ 💵 Bidaan Pembukaan: *RM 500*
┃ 🎁 Kandungan Tersembunyi: Barangan bernilai tinggi!
┃
┃ 📢 *CARA BIDA:*
┃ Taip *.bida [jumlah]* untuk meletakkan tawaran tertinggi!
┃ ⏳ _Palu lelongan akan diketuk dalam 2 minit._
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(gId, { text: lelongMsg }).catch(() => {});
      }
    }
  }, 25 * 60 * 1000);

  // AUTO REPORT 12:00 MALAM (5 KATEGORI MALAYSIA)
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

        const reportMsg = `╭━━━ 🌙 *LAPORAN RASMI 12:00 MALAM* 🌙 ━━━
┃ Jam 12:00 Malam! Anugerah kegigihan & kehancuran warga Airi:
┃
┃ 🏆 *1. RAJA KERJA HALAL:*
┃ 👤 *${topWorker.name}* (${topWorker.works} shift) ➔ _Rajin betul, gaji simpan buat kahwin ke?_
┃
┃ 🏴‍☠️ *2. PENJENAYAH UNDERWORLD TERAKTIF:*
┃ 👤 *${topCriminal.name}* (${topCriminal.crimes} operasi) ➔ _Polis cari tak jumpa, licik macam belut!_
┃
┃ 🏁 *3. RAJA TREK / DRAG KING:*
┃ 👤 *${topRacer.name}* (${topRacer.races} menang) ➔ _Pelesit rempit nombor 1 bandar!_
┃
┃ 💰 *4. JUTAWAN HARIAN TERKAYA:*
┃ 👤 *${topRich.name}* (Aset: RM ${topRich.total.toLocaleString()}) ➔ _Bila nak belanja warga group makan mamak?_
┃
┃ ⚖️ *5. KAKI LOKAP / PELANGGAN PEGUAM:*
┃ 👤 *${topBail.name}* (${topBail.bails} kali jamin) ➔ _Rumah kedua kau balai polis ke bro?_
┃
┃ ✨ _Statistik harian diset semula. Esok grind balik jangan malas!_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        for (const gId of db.groups) {
          await sock.sendMessage(gId, { text: reportMsg }).catch(() => {});
        }
      }

      for (let id in db.users) {
        db.users[id].stats = { works: 0, crimes: 0, bails: 0, racesWon: 0, casinoWon: 0, fishes: 0, eventsWon: 0 };
      }
      saveDB(db);
    }
  }, 60 * 1000);

  // =======================================================================
  // ⚡ 13. PENGENDALI ARAHAN & MESIN LOGIK LENGKAP
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
    const pushName = m.pushName || "Warga Cyber";
    const user = getUser(cleanSender, pushName);
    const now = Date.now();

    // =====================================================================
    // 👑 AUTO-FOUNDER: KUNCI AUTOMATIK KEPADA NOMBOR/LID ANDA
    // =====================================================================
    const isOwner = OWNER_NUMBERS.some(num => cleanSender.includes(num)) || user.isOwner === true;

    if (isOwner && !user.isOwner) {
      user.isOwner = true;
      if (!user.badges.includes("👑 [MYTHIC] Pengasas Mutlak")) {
        user.badges.push("👑 [MYTHIC] Pengasas Mutlak");
      }
      updateUser(cleanSender, user);
    }

    const activePhoneObj = PHONE_DEVICES.find(p => p.id === user.phoneDevice);

    // SEKATAN TAHANAN LOKAP
    if (now < user.cooldowns.jailUntil && cmd !== "upah_lawyer" && cmd !== "myid" && !isOwner) {
      const remMin = Math.ceil((user.cooldowns.jailUntil - now) / 60000);
      const jailAlert = `╭━━━ 🚨 *LOKAP BALAI POLIS BUKIT AMAN* 🚨 ━━━
┃ ⛓️ *STATUS:* Tahanan Lokap Mahkamah
┃ 👤 Banduan: *${user.name}*
┃ ⏳ Baki Hukuman: *${remMin} minit lagi*
┃ 🔒 Sekatan: Dilarang bekerja, berlumba atau merompak!
┃
┃ 💡 *Jaminan Peguam:* Taip *.upah_lawyer* (Kos: RM 500)
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: jailAlert });
    }

    // =====================================================================
    // 🎮 PENGENDALI 5 RANDOM GROUP INTERACTIVE EVENTS
    // =====================================================================
    const db = loadDB();
    const currentEvent = db.activeEvents?.[from];

    // Event 1: Rebut Airdrop (.rebut [kod])
    if (cmd === "rebut") {
      if (!currentEvent || currentEvent.type !== "airdrop" || now > currentEvent.expires) {
        return sock.sendMessage(from, { text: `❌ Tiada airdrop aktif atau kotak kargo telah meletup musnah!` });
      }
      const codeInput = args[0];
      if (codeInput !== currentEvent.code) {
        return sock.sendMessage(from, { text: `❌ Kod dekripsi salah! Tengok kod betul-betul di peti airdrop.` });
      }
      const reward = currentEvent.reward;
      user.cash += reward;
      user.stats.eventsWon = (user.stats.eventsWon || 0) + 1;
      delete db.activeEvents[from];
      saveDB(db);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `🎉 *AIRDROP BERJAYA DIDEKRIPSI!* 🪂\n*${user.name}* telah memasukkan kod dengan pantas dan merampas *+RM ${reward.toLocaleString()}* tunai!` 
      });
    }

    // Event 2: Tunjuk Lesen Roadblock (.tunjuk_lesen)
    if (cmd === "tunjuk_lesen") {
      if (!currentEvent || currentEvent.type !== "roadblock" || now > currentEvent.expires) {
        return sock.sendMessage(from, { text: `❌ Tiada sekatan roadblock aktif di kawasan ini!` });
      }
      user.cash += 300;
      user.stars = Math.max(0, user.stars - 1);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { 
        text: `👮 *PELEPASAN ROADBLOCK:* Pegawai memeriksa dokumen *${user.name}*. Lesen sah, rekod bersih! Anda diberi elaun disiplin *+RM 300* dan bintang wanted berkurang.` 
      });
    }

    // Event 3: Serang Boss Underworld (.serang_boss)
    if (cmd === "serang_boss") {
      if (!currentEvent || currentEvent.type !== "boss" || now > currentEvent.expires) {
        return sock.sendMessage(from, { text: `❌ Tiada Boss Underworld aktif pada saat ini!` });
      }
      currentEvent.hp -= 1;
      if (!currentEvent.attackers.includes(user.name)) currentEvent.attackers.push(user.name);

      if (currentEvent.hp <= 0) {
        const rewardEach = Math.floor(currentEvent.reward / Math.max(1, currentEvent.attackers.length));
        for (const atkName of currentEvent.attackers) {
          const uEntry = Object.entries(db.users).find(([k, v]) => v.name === atkName);
          if (uEntry) {
            uEntry[1].cash += rewardEach;
            updateUser(uEntry[0], uEntry[1]);
          }
        }
        delete db.activeEvents[from];
        saveDB(db);

        return sock.sendMessage(from, { 
          text: `💥 *BOSS UNDERWORLD TEWAS!* 👹\nPasukan warga group berjaya menumbangkan Kingpin Mafia!\n💰 Ganjaran *RM ${rewardEach.toLocaleString()}* tunai diagihkan kepada setiap penyerang: _${currentEvent.attackers.join(", ")}_!` 
        });
      } else {
        saveDB(db);
        return sock.sendMessage(from, { 
          text: `⚔️ *SERANGAN TEPAT!* *${user.name}* menghayunkan tumbukan padu ke arah Boss!\n❤️ Baki Nyawa Boss: *[ ${currentEvent.hp} / ${currentEvent.maxHp} HP ]*` 
        });
      }
    }

    // Event 4: Jawab Kuiz Kilat (.jawab [ans])
    if (cmd === "jawab") {
      if (!currentEvent || currentEvent.type !== "soalan" || now > currentEvent.expires) {
        return sock.sendMessage(from, { text: `❌ Tiada kuiz aktif atau masa menjawab telah tamat!` });
      }
      const userAns = args[0];
      if (userAns !== currentEvent.ans) {
        return sock.sendMessage(from, { text: `❌ Jawapan salah! Cuba kira semula pantas.` });
      }
      const reward = currentEvent.reward;
      user.cash += reward;
      delete db.activeEvents[from];
      saveDB(db);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `🧠 *JAWAPAN TEPAT!* *${user.name}* membuktikan IQ tinggi dengan menjawab *${userAns}*!\n💰 Hadiah Pintar: *+RM ${reward.toLocaleString()}* tunai dikreditkan.` 
      });
    }

    // Event 5: Bida Lelongan (.bida [jumlah])
    if (cmd === "bida") {
      if (!currentEvent || currentEvent.type !== "lelong" || now > currentEvent.expires) {
        return sock.sendMessage(from, { text: `❌ Tiada lelongan kargo aktif pada masa ini!` });
      }
      const bidAmt = parseInt(args[0]);
      if (isNaN(bidAmt) || bidAmt <= currentEvent.highestBid) {
        return sock.sendMessage(from, { text: `❌ Nilai bidaan mestilah lebih tinggi daripada bidaan semasa (RM ${currentEvent.highestBid.toLocaleString()})!` });
      }
      if (user.cash < bidAmt) {
        return sock.sendMessage(from, { text: `❌ Tunai anda tidak cukup untuk meletakkan bidaan RM ${bidAmt.toLocaleString()}!` });
      }

      currentEvent.highestBid = bidAmt;
      currentEvent.winner = cleanSender;
      currentEvent.winnerName = user.name;
      saveDB(db);

      return sock.sendMessage(from, { 
        text: `🏷️ *BIDAAN DITERIMA!* *${user.name}* memegang tawaran tertinggi terkini: *RM ${bidAmt.toLocaleString()}*!` 
      });
    }

    // =====================================================================
    // 👑 SEKSYEN VETO MUTLAK FOUNDER (AMAR)
    // =====================================================================
    if (cmd === "claimfounder" || cmd === "iamowner") {
      if (!isOwner) {
        return sock.sendMessage(from, { 
          text: `🚫 *AKSES DITOLAK!* Nombor anda (${cleanSender.split("@")[0]}) bukan nombor Pengasas Amar. Percubaan rampasan kuasa telah direkodkan!` 
        });
      }
      user.isOwner = true;
      if (!user.badges.includes("👑 [MYTHIC] Pengasas Mutlak")) {
        user.badges.push("👑 [MYTHIC] Pengasas Mutlak");
      }
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { 
        text: `╭━━━ 👑 *SISTEM VETO PENGASAS AKTIF* ━━━
┃ 🌐 Status: *Pengasas Mutlak Disahkan*
┃ 👤 Nama: *${user.name}*
┃ ⚡ Akses: Kebal Lokap • Kebal Cooldown • Kuasa Veto Penuh
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` 
      });
    }

    if (cmd === "setmoney" && isOwner) {
      const amt = parseInt(args[0]) || 1000000;
      user.cash = amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `👑 *[VETO PENGASAS]* Petik jari terus masuk *RM ${amt.toLocaleString()}* tunai ke dalam poket. Kaya cara kayangan!` });
    }

    if (cmd === "resetlokap" && isOwner) {
      user.cooldowns.jailUntil = 0;
      user.stars = 0;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `👑 *[VETO PENGASAS]* Rekod polis, bintang wanted dan status lokap dibersihkan serta-merta. Kebal undang-undang!` });
    }

    if (cmd === "jail" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const minutes = parseInt(args[1]) || 3;
      if (!targetTag) return sock.sendMessage(from, { text: `👑 *[VETO]* Sila tag sasaran! Contoh: *.jail @user 5*` });
      
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      targetUser.cooldowns.jailUntil = Date.now() + (minutes * 60 * 1000);
      targetUser.stars = 5;
      updateUser(cleanTarget, targetUser);

      return sock.sendMessage(from, { 
        text: `╭━━━ 🚨 *HUKUMAN VETO PENGASAS* 🚨 ━━━
┃ 🚔 *PERINTAH MAHKAMAH MUTLAK*
┃ 👤 Pesalah: *${targetUser.name}*
┃ ⛓️ Hukuman: Lokap Balai Polis selama *${minutes} minit*
┃ ⭐ Wanted: Dilabel 5 Bintang Penjenayah Tegar!
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [cleanTarget]
      });
    }

    if (cmd === "unjail" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `👑 *[VETO]* Sila tag pemain! Contoh: *.unjail @user*` });
      
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      targetUser.cooldowns.jailUntil = 0;
      targetUser.stars = 0;
      updateUser(cleanTarget, targetUser);

      return sock.sendMessage(from, { 
        text: `⚖️ *[PENGAMPUNAN VETO PENGASAS]*\nPengasas Amar telah memberi pengampunan khas! *${targetUser.name}* dibebaskan daripada lokap serta-merta dengan rekod bersih suci murni.`,
        mentions: [cleanTarget]
      });
    }

    if (cmd === "vtotransfer" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt) || amt <= 0) {
        return sock.sendMessage(from, { text: `👑 *[VETO]* Format salah! Taip: *.vtotransfer @user [jumlah]*` });
      }
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      targetUser.cash += amt;
      updateUser(cleanTarget, targetUser);

      return sock.sendMessage(from, { 
        text: `💸 *[CETAKAN DUIT VETO]*\nPengasas Amar telah mencetak dan memasukkan *RM ${amt.toLocaleString()}* terus ke poket *${targetUser.name}*! Rezeki terpijak.`,
        mentions: [cleanTarget]
      });
    }

    if (cmd === "vtoclear" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `👑 *[VETO]* Sila tag mangsa muflis! Contoh: *.vtoclear @user*` });
      
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      const totalTaken = targetUser.cash + targetUser.bank;
      targetUser.cash = 0;
      targetUser.bank = 0;
      updateUser(cleanTarget, targetUser);

      return sock.sendMessage(from, { 
        text: `🏴‍☠️ *[SITAAN HARTA VETO]*\nPengasas Amar telah menyita keseluruhan harta (RM ${totalTaken.toLocaleString()}) milik *${targetUser.name}*! Poket kini sifar merempat.`,
        mentions: [cleanTarget]
      });
    }

    // =====================================================================
    // 📖 MENU UTAMA AIRI'S CORNER CYBER OS
    // =====================================================================
    if (cmd === "menu" || cmd === "help") {
      const menuText = `╭━━━ 🖥️ *AIRI'S CORNER CYBER OS* 🖥️ ━━━
┃ 🌐 *Vibe Malaysia • Cyber RPG & Roasting*
┃
┃ 💼 *[1. SEKTOR KERJAYA HALAL]*
┃ • *.list_kerja [1/2]* ➔ Senarai 50 kerja & gaji
┃ • *.pilih_kerja [id]* ➔ Tukar kerjaya tetap (ID 1-50)
┃ • *.kerja* ➔ Jalankan tugas (Cooldown asing-asing!)
┃ • *.daily* ➔ Elaun percuma harian (RM 250)
┃
┃ 📱 *[2. KEDAI TELEFON & GAJET]*
┃ • *.device* ➔ Katalog 10 telefon pintar & buff pasif
┃ • *.beli_phone [id]* ➔ Beli & pasang smartphone utama
┃
┃ 🏎️ *[3. SHOWROOM & DRAG RACE]*
┃ • *.showroom [1/2]* ➔ Katalog 40 kenderaan (20 motor / 20 kereta)
┃ • *.beli_kenderaan [id]* ➔ Beli jentera masuk garaj
┃ • *.bengkel [id_jentera]* ➔ Buka kedai modifikasi jentera
┃ • *.pasang [id_jentera] [id_barang]* ➔ Pasang ECU/NOS/Turbo
┃ • *.lumba [id_jentera]* ➔ Drag race malam taruhan wang
┃
┃ 🏴‍☠️ *[4. BLACK MARKET & UNDERWORLD]*
┃ • *.bm* ➔ Pasaran gelap gajet godam & logistik
┃ • *.beli_bm [id]* ➔ Beli skimmer/radar/bot/van (ID 1-10)
┃ • *.jenayah* ➔ Senarai 15 misi jenayah & penyeludupan
┃ • *.buat_jenayah [id]* ➔ Jalankan misi berisiko tinggi
┃ • *.upah_lawyer* ➔ Peguam jamin lokap segera (RM 500)
┃
┃ 🏢 *[5. HARTANAH & SEWAAN PASIF]*
┃ • *.list_hartanah* ➔ Katalog Flat PPR hingga Penthouse
┃ • *.beli_rumah [id]* ➔ Beli aset kediaman (ID 1-6)
┃ • *.kutip_sewa* ➔ Kutip hasil pasif sewaan setiap 24 jam
┃
┃ 🎰 *[6. KASINO UNDERGROUND & MINI GAMES]*
┃ • *.coinflip [kepala/bunga] [taruhan]* ➔ Taruhan 50:50
┃ • *.slot [taruhan]* ➔ Mesin slot Jackpot 777
┃ • *.mancing* ➔ Tangkap ikan bernilai di jeti
┃ • *.hutang_ahlong [jumlah]* ➔ Pinjaman wang segera (Bunga 25%)
┃ • *.bayar_ahlong* ➔ Langsaikan baki pinjaman Ah Long
┃
┃ 🏦 *[7. PERBANKAN & PVP]*
┃ • *.deposit [jumlah/all]* & *.withdraw [jumlah/all]*
┃ • *.transfer @user [jumlah]* ➔ Pindahan duit sesama ahli
┃ • *.rompak @user* ➔ Samun 25% tunai poket mangsa
┃ • *.shop* & *.beli_makanan [id]* & *.makan [id]*
┃
┃ 🪪 *[8. IDENTITI & PROFIL]*
┃ • *.myid* ➔ Kad pengenalan siber & lencana
┃ • *.profile* ➔ Semak garaj jentera, beg gajet & makanan
┃ • *.badges* ➔ Koleksi lencana mengikut susunan Rarity
┃ • *.top* ➔ Papan carta 5 warga terkaya bandar
┃ • *.tanya_mamak* ➔ Intel risikan & tips NPC Mamak
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: menuText });
    }

    // =====================================================================
    // 💼 SEKSYEN 1: KERJA HALAL & DAILY BONUS
    // =====================================================================
    if (cmd === "list_kerja" || cmd === "jobs") {
      const page = args[0] === "2" ? 2 : 1;
      const start = (page - 1) * 25;
      const end = start + 25;
      const pageJobs = JOBS.slice(start, end);

      let text = `╭━━━ 💼 *BURSA KERJAYA AIRI (PAGE ${page}/2)* ━━━\n`;
      pageJobs.forEach(j => {
        text += `┃ • *[ID ${j.id}]* ${j.name} ➔ Gaji: RM ${j.pay.toLocaleString()} / shift\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += page === 1 ? `💡 *Cara Pilih:* Taip *.pilih_kerja [id]* (Contoh: *.pilih_kerja 27*)\nTaip *.list_kerja 2* untuk ID 26-50.` : `💡 *Cara Pilih:* Taip *.pilih_kerja [id]* (Contoh: *.pilih_kerja 50*)`;
      text += `\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text });
    }

    if (cmd === "pilih_kerja" || cmd === "setjob") {
      const jId = parseInt(args[0]);
      const targetJob = JOBS.find(j => j.id === jId);
      if (!targetJob) return sock.sendMessage(from, { text: `❌ ID jawatan tidak wujud! Semak senarai di *.list_kerja* dahulu.` });

      user.jobId = targetJob.id;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { 
        text: `🏢 *TAWARAN KERJA DITERIMA!* 🏢\nTahniah *${user.name}*, anda kini rasmi bertugas sebagai *${targetJob.name}* (ID ${targetJob.id}) dengan gaji *RM ${targetJob.pay.toLocaleString()}* setiap shift.\n\nTaip *.kerja* sekarang untuk mula kutip gaji!` 
      });
    }

    if (cmd === "kerja" || cmd === "work") {
      const currentJob = JOBS.find(j => j.id === user.jobId) || JOBS[0];
      const jobCdKey = `job_${currentJob.id}`;
      const jobCooldown = user.cooldowns.workJobs[jobCdKey] || 0;

      let cdDuration = 2.5 * 60 * 1000;
      if (activePhoneObj?.perk === "cd") cdDuration -= activePhoneObj.val;

      if (now < jobCooldown && !isOwner) {
        const rem = Math.ceil((jobCooldown - now) / 1000);
        return sock.sendMessage(from, { 
          text: `⚠️ *REHAT SEBENTAR!* Baru buat satu shift dah penat ke? Rehat *${rem} saat* lagi.\n\n💡 *Tip Pintas:* Tukar kerjaya guna *.pilih_kerja [id]* atau pekena *.makan nasilemak* kat warung!` 
        });
      }

      let payout = currentJob.pay;
      if (activePhoneObj?.perk === "work" || activePhoneObj?.perk === "god") {
        payout += Math.floor(payout * activePhoneObj.val);
      }

      user.cash += payout;
      user.stats.works += 1;
      user.cooldowns.workJobs[jobCdKey] = now + cdDuration;

      await checkAndAwardBadges(user, sock, from);
      updateUser(cleanSender, user);

      const roast = ROASTS.kerja[Math.floor(Math.random() * ROASTS.kerja.length)];
      const ui = `╭━━━ 💼 *SLIP GAJI HALAL AIRI* ━━━
┃ 👤 Pekerja: *${user.name}*
┃ 🏢 Jawatan: ${currentJob.name} [ID ${currentJob.id}]
┃ 💵 Gaji Diterima: +RM ${payout.toLocaleString()}
┃ 📱 Peranti Digunakan: ${user.phoneName}
┃
┃ 💬 _"${roast}"_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "daily") {
      if (now < user.cooldowns.daily && !isOwner) {
        const remH = Math.ceil((user.cooldowns.daily - now) / 3600000);
        return sock.sendMessage(from, { text: `⏳ *ELAUN DAH DITUNTUT!* Jangan tamak sangat bro, datang balik lagi *${remH} jam* nanti.` });
      }
      user.cash += 250;
      user.cooldowns.daily = now + (24 * 3600 * 1000);
      updateUser(cleanSender, user);

      const roast = ROASTS.daily[Math.floor(Math.random() * ROASTS.daily.length)];
      return sock.sendMessage(from, { 
        text: `🎁 *BANTUAN HARIAN AIRI:* +RM 250 tunai telah dimasukkan ke dalam poket!\n\n💬 _"${roast}"_` 
      });
    }

    // =====================================================================
    // 📱 SEKSYEN 2: KEDAI TELEFON PINTAR TEMPATAN
    // =====================================================================
    if (cmd === "device" || cmd === "phone_shop" || cmd === "kedai_phone") {
      let ui = `╭━━━ 📱 *KEDAI TELEFON PINTAR AIRI* ━━━\n┃ Naik taraf telefon untuk dapat buff pasif kerjaya & lumba!\n┃\n`;
      PHONE_DEVICES.forEach(p => {
        ui += `┃ • *[${p.id}]* ${p.name}\n┃   💰 Harga: RM ${p.price.toLocaleString()}\n┃   ⚡ Kelebihan: _${p.bonus}_\n┃\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 *Cara Beli:* Taip *.beli_phone [id]* (Contoh: *.beli_phone iqoo12*)\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_phone") {
      const pId = args[0]?.toLowerCase();
      const phone = PHONE_DEVICES.find(p => p.id === pId);
      if (!phone) return sock.sendMessage(from, { text: `❌ Kod telefon tidak wujud! Semak senarai di *.device*.` });

      if (user.cash < phone.price) {
        return sock.sendMessage(from, { text: `❌ Poket kempis ada hati nak beli *${phone.name}* (Harga: RM ${phone.price.toLocaleString()}). Kumpul duit dulu bro!` });
      }

      if (user.phoneDevice === phone.id) {
        return sock.sendMessage(from, { text: `⚠️ Telefon *${phone.name}* dah ada di tangan anda, nak beli buat pekasam ke?` });
      }

      user.cash -= phone.price;
      user.phoneDevice = phone.id;
      user.phoneName = phone.name;
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `📱 *PEMBELIAN PERANTI BERJAYA!* 📱\nTahniah *${user.name}*, peranti utama anda kini dinaik taraf ke *${phone.name}*!\n⚡ Buff Aktif: _${phone.bonus}_` 
      });
    }

    // =====================================================================
    // 🏎️ SEKSYEN 3: SHOWROOM, BENGKEL MODIFIKASI & DRAG RACE
    // =====================================================================
    if (cmd === "showroom") {
      const page = args[0] === "2" ? 2 : 1;
      const start = (page - 1) * 20;
      const end = start + 20;
      const pageVehicles = VEHICLES.slice(start, end);

      let ui = `╭━━━ 🏎️ *SHOWROOM JENTERA AIRI (PAGE ${page}/2)* ━━━\n┃\n`;
      pageVehicles.forEach(v => {
        ui += `┃ • *[${v.id}]* ${v.name} (${v.type})\n┃   💰 Harga: RM ${v.price.toLocaleString()} | ⚡ Kelajuan: ${v.speed} km/h\n┃   ℹ️ _${v.desc}_\n┃\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      ui += page === 1 ? `💡 *Cara Beli:* Taip *.beli_kenderaan [id]* (Contoh: *.beli_kenderaan y15*)\nTaip *.showroom 2* untuk senarai 20 kereta mewah.` : `💡 *Cara Beli:* Taip *.beli_kenderaan [id]* (Contoh: *.beli_kenderaan myvi*)`;
      ui += `\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_kenderaan") {
      const vId = args[0]?.toLowerCase();
      const v = VEHICLES.find(x => x.id === vId);
      if (!v) return sock.sendMessage(from, { text: `❌ Kod jentera tidak wujud! Semak senarai di *.showroom*.` });

      if (user.cash < v.price) {
        return sock.sendMessage(from, { text: `❌ Baki tunai tidak cukup untuk beli *${v.name}* (Harga: RM ${v.price.toLocaleString()})!` });
      }

      if (user.vehicles.includes(v.id)) {
        return sock.sendMessage(from, { text: `⚠️ Jentera *${v.name}* sudah ada dalam garaj anda!` });
      }

      user.cash -= v.price;
      user.vehicles.push(v.id);
      await checkAndAwardBadges(user, sock, from);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `🎉 *PEMBELIAN JENTERA BERJAYA!* 🎉\nGeran rasmi *${v.name}* kini sah didaftarkan atas nama *${user.name}*.\nMasuk ke garaj untuk modifikasi: *.bengkel ${v.id}*` 
      });
    }

    // BENGKEL DINAMIK MENGIKUT GARAJ
    if (cmd === "bengkel" || cmd === "workshop") {
      const vId = args[0]?.toLowerCase();

      if (!vId) {
        if (!user.vehicles || user.vehicles.length === 0) {
          return sock.sendMessage(from, { text: `❌ Garaj anda kosong habuk pun takde! Beli jentera di *.showroom* dahulu.` });
        }

        let garajUI = `╭━━━ 🔧 *BENGKEL MODIFIKASI DINAMIK AIRI* ━━━\n┃ 👤 Pemilik: *${user.name}*\n┃\n┃ 🏎️ *PILIH JENTERA GARAJ UNTUK DIUBAH SUAI:*\n`;
        user.vehicles.forEach((userVId, index) => {
          const vData = VEHICLES.find(v => v.id === userVId);
          if (vData) {
            garajUI += `┃ ${index + 1}. ${vData.name} [${vData.type}] ➔ Kod: *${vData.id}*\n`;
          }
        });
        garajUI += `┃\n┃ 💡 *Cara Pilih:* Taip *.bengkel [kod_jentera]*\n┃ (Contoh: *.bengkel y15* atau *.bengkel myvi*)\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: garajUI });
      }

      if (!user.vehicles.includes(vId)) {
        return sock.sendMessage(from, { text: `❌ Jentera [*${vId}*] tiada dalam garaj anda! Semak *.profile*.` });
      }

      const vehicle = VEHICLES.find(v => v.id === vId);
      const partsAvailable = MOD_PARTS[vehicle.type] || [];
      const installedMods = user.vehicleMods?.[vId] || [];

      let modUI = `╭━━━ 🛠️ *MODIFIKASI : ${vehicle.name.toUpperCase()}* ━━━\n`;
      modUI += `┃ 🏎️ Kategori: ${vehicle.type} | ⚡ Kelajuan Asas: ${vehicle.speed} km/h\n`;
      modUI += `┃ 🔧 Mod Terpasang: ${installedMods.length > 0 ? installedMods.join(", ") : "Standard Kilang"}\n┃\n`;

      partsAvailable.forEach(p => {
        const isInstalled = installedMods.includes(p.name);
        const statusTag = isInstalled ? `✅ [TERPASANG]` : `RM ${p.price.toLocaleString()}`;
        modUI += `┃ • *[ID ${p.id}]* ${p.name} ➔ ${statusTag}\n┃   _${p.desc}_\n\n`;
      });

      modUI += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      modUI += `💡 *Cara Pasang:* Taip *.pasang ${vId} [ID_Barang]*\n(Contoh: *.pasang ${vId} 46*)`;
      modUI += `\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: modUI });
    }

    if (cmd === "pasang" || cmd === "upgrade") {
      const vId = args[0]?.toLowerCase();
      const partId = parseInt(args[1]);

      if (!vId || isNaN(partId)) {
        return sock.sendMessage(from, { text: `❌ Format salah! Taip: *.pasang [kod_jentera] [id_barang]*\nContoh: *.pasang y15 46*` });
      }

      if (!user.vehicles.includes(vId)) {
        return sock.sendMessage(from, { text: `❌ Jentera [*${vId}*] bukan milik anda!` });
      }

      const vehicle = VEHICLES.find(v => v.id === vId);
      const part = MOD_PARTS[vehicle.type]?.find(p => p.id === partId);

      if (!part) {
        return sock.sendMessage(from, { text: `❌ Barang ID [${partId}] tidak sesuai untuk jentera jenis ${vehicle.type}!` });
      }

      if (!user.vehicleMods) user.vehicleMods = {};
      if (!user.vehicleMods[vId]) user.vehicleMods[vId] = [];

      if (user.vehicleMods[vId].includes(part.name) && !part.oneTime) {
        return sock.sendMessage(from, { text: `⚠️ Jentera ini sudah pun dipasang *${part.name}*!` });
      }

      if (user.cash < part.price) {
        return sock.sendMessage(from, { text: `❌ Baki tunai tidak cukup untuk pasang *${part.name}* (Harga: RM ${part.price.toLocaleString()})!` });
      }

      user.cash -= part.price;
      if (!part.oneTime) {
        user.vehicleMods[vId].push(part.name);
      } else {
        if (!user.nosStock) user.nosStock = {};
        user.nosStock[vId] = (user.nosStock[vId] || 0) + 1;
      }

      updateUser(cleanSender, user);
      return sock.sendMessage(from, { 
        text: `🔧 *MODIFIKASI SELESAI!* 🔧\n*${part.name}* telah selamat dipasang pada jentera *${vehicle.name}*!\nKelebihan: _${part.desc}_` 
      });
    }

    if (cmd === "lumba" || cmd === "race") {
      const vId = args[0]?.toLowerCase();
      if (!vId) return sock.sendMessage(from, { text: `❌ Sila letak kod jentera! Contoh: *.lumba y15* atau *.lumba myvi*.` });

      if (!user.vehicles.includes(vId)) {
        return sock.sendMessage(from, { text: `❌ Jentera [*${vId}*] tiada dalam garaj anda!` });
      }

      const vehicle = VEHICLES.find(v => v.id === vId);
      const raceCd = 3.5 * 60 * 1000;
      if (now < user.cooldowns.race && !isOwner) {
        const rem = Math.ceil((user.cooldowns.race - now) / 1000);
        return sock.sendMessage(from, { text: `🏎️ Enjin tengah panas membara tu! Tunggu *${rem} saat* lagi sebelum tayar meletup.` });
      }

      user.cooldowns.race = now + raceCd;

      let speedBonus = 0;
      const mods = user.vehicleMods?.[vId] || [];
      mods.forEach(mName => {
        const pObj = MOD_PARTS[vehicle.type]?.find(p => p.name === mName);
        if (pObj) speedBonus += pObj.boostSpeed;
      });

      let totalSpeed = vehicle.speed + speedBonus;
      let winChance = totalSpeed / 220;
      if (activePhoneObj?.perk === "race" || activePhoneObj?.perk === "god") winChance += activePhoneObj.val;

      const isWin = Math.random() < winChance || isOwner;

      if (isWin) {
        const reward = Math.floor((vehicle.price * 0.08) + 300);
        user.cash += reward;
        user.stats.racesWon = (user.stats.racesWon || 0) + 1;
        await checkAndAwardBadges(user, sock, from);
        updateUser(cleanSender, user);

        const roast = ROASTS.race_win[Math.floor(Math.random() * ROASTS.race_win.length)];
        const dragWinUI = `╭━━━ 🏁 *JUARA DRAG RACE MALAM* 🏁 ━━━
┃ 🏎️ Jentera: *${vehicle.name}*
┃ ⚡ Kelajuan Tercapai: *${totalSpeed} km/h*
┃ 👤 Pelumba: *${user.name}*
┃ 💰 Hadiah Taruhan: *+RM ${reward.toLocaleString()}*
┃
┃ 💬 _"${roast}"_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: dragWinUI });
      } else {
        const repairCost = Math.floor(vehicle.price * 0.02);
        user.cash = Math.max(0, user.cash - repairCost);
        updateUser(cleanSender, user);

        const roast = ROASTS.race_lose[Math.floor(Math.random() * ROASTS.race_lose.length)];
        const dragLoseUI = `╭━━━ 💥 *KEMALANGAN SELEKOH MAUT* 💥 ━━━
┃ 🏎️ Jentera: *${vehicle.name}*
┃ 👤 Pelumba: *${user.name}*
┃ ❌ Status: Tewas & Terbabas di Divider!
┃ 🛠️ Kos Baiki Bengkel: *-RM ${repairCost.toLocaleString()}*
┃
┃ 💬 _"${roast}"_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: dragLoseUI });
      }
    }

    // =====================================================================
    // 🏴‍☠️ SEKSYEN 4: BLACK MARKET & 15 MISI UNDERWORLD
    // =====================================================================
    if (cmd === "bm" || cmd === "blackmarket") {
      let ui = `╭━━━ 🏴‍☠️ *PASARAN GELAP AIRI (BLACK MARKET)* ━━━\n┃ Gajet godam, dokumen palsu & kenderaan kargo kontraban!\n┃\n`;
      BLACKMARKET_ITEMS.forEach(i => {
        ui += `┃ • *[ID ${i.id}]* ${i.name}\n┃   💰 Harga: RM ${i.price.toLocaleString()} | _${i.desc}_\n┃\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 *Cara Beli:* Taip *.beli_bm [ID]* (Contoh: *.beli_bm 8*)\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_bm" || cmd === "beli_device") {
      const bId = parseInt(args[0]);
      const item = BLACKMARKET_ITEMS.find(i => i.id === bId);
      if (!item) return sock.sendMessage(from, { text: `❌ ID perkakasan gelap tidak wujud! Semak di *.bm*.` });

      if (user.cash < item.price) {
        return sock.sendMessage(from, { text: `❌ Tunai tidak cukup untuk beli *${item.name}* (Harga: RM ${item.price.toLocaleString()})!` });
      }

      if (user.inventory.some(i => i.id === item.id)) {
        return sock.sendMessage(from, { text: `⚠️ Perkakasan gelap ini sudah ada dalam beg anda!` });
      }

      user.cash -= item.price;
      user.inventory.push({ id: item.id, name: item.name });
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `🛒 *PEMBELIAN BLACK MARKET BERJAYA!* 🛒\n*${item.name}* selamat masuk beg. Jangan sampai pihak berkuasa hidu!` 
      });
    }

    if (cmd === "jenayah" || cmd === "crime_menu" || cmd === "jenayah_menu") {
      let ui = `╭━━━ 💀 *DARKWEB UNDERWORLD NETWORK* 💀 ━━━\n┃ Misi rompakan berskala tinggi & sindiket penyeludupan!\n┃\n`;
      CRIMES.forEach(c => {
        const reqObj = c.reqItem ? BLACKMARKET_ITEMS.find(i => i.id === c.reqItem) : null;
        const reqStr = reqObj ? `[Syarat: ${reqObj.name}]` : `[Bebas]`;
        ui += `┃ • *[ID ${c.id}]* ${c.name}\n┃   💵 Loot: RM ${c.rewardMin.toLocaleString()} - ${c.rewardMax.toLocaleString()} | ⚠️ Denda: RM ${c.fine.toLocaleString()}\n┃   🔒 ${reqStr}\n┃\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 *Cara Mula:* Taip *.buat_jenayah [id]* (Contoh: *.buat_jenayah 6*)\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "buat_jenayah" || cmd === "crime") {
      const cId = parseInt(args[0]);
      const c = CRIMES.find(x => x.id === cId);
      if (!c) return sock.sendMessage(from, { text: `❌ ID misi tidak wujud! Semak senarai di *.jenayah*.` });

      if (c.reqItem && !user.inventory.some(i => i.id === c.reqItem)) {
        const reqObj = BLACKMARKET_ITEMS.find(i => i.id === c.reqItem);
        return sock.sendMessage(from, { text: `❌ Misi ini memerlukan perkakasan *[${reqObj?.name || c.reqItem}]* dari *.bm*!` });
      }

      user.cooldowns.crime = now + (4 * 60 * 1000);

      let crimeRate = 0.50;
      if (activePhoneObj?.perk === "crime" || activePhoneObj?.perk === "god") crimeRate += activePhoneObj.val;
      if (user.inventory.some(i => i.id === 6)) crimeRate += 0.20;

      const isSuccess = Math.random() < crimeRate || isOwner;

      if (isSuccess) {
        const reward = Math.floor(Math.random() * (c.rewardMax - c.rewardMin + 1)) + c.rewardMin;
        user.cash += reward;
        user.stats.crimes += 1;
        user.stars = Math.min(5, user.stars + c.stars);
        await checkAndAwardBadges(user, sock, from);
        updateUser(cleanSender, user);

        const roast = ROASTS.crime_win[Math.floor(Math.random() * ROASTS.crime_win.length)];
        const ui = `╭━━━ 🦹 *UNDERWORLD : OPERASI BERJAYA* ━━━
┃ 👤 Pelaku: *${user.name}*
┃ 🚨 Misi: ${c.name} [ID ${c.id}]
┃ 💵 Rampasan Loot: +RM ${reward.toLocaleString()}
┃ ⭐ Tahap Wanted: ${"⭐".repeat(user.stars)}
┃
┃ 💬 _"${roast}"_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: ui });
      } else {
        let fine = c.fine;
        if (activePhoneObj?.perk === "def" || activePhoneObj?.perk === "god") fine -= Math.floor(fine * activePhoneObj.val);
        user.cash = Math.max(0, user.cash - fine);
        user.cooldowns.jailUntil = now + (3 * 60 * 1000);
        updateUser(cleanSender, user);

        const roast = ROASTS.crime_fail[Math.floor(Math.random() * ROASTS.crime_fail.length)];
        const arrestUI = `╭━━━ 🚨 *SERBUAN KONTRAK POLIS DI-KUTIP!* 🚨 ━━━
┃ 🚔 Unit Tindakan Khas Polis menyerbu lokasi!
┃ 👤 Pesalah: *${user.name}*
┃ ❌ Misi: ${c.name} Gagal!
┃ 💸 Denda Mahkamah: *-RM ${fine.toLocaleString()}*
┃ ⛓️ Hukuman: Dihumban ke lokap balai selama 3 minit!
┃
┃ 💬 _"${roast}"_
┃ 💡 *Bebas Cepat:* Taip *.upah_lawyer* (RM 500).
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: arrestUI });
      }
    }

    if (cmd === "upah_lawyer") {
      if (now >= user.cooldowns.jailUntil && !isOwner) {
        return sock.sendMessage(from, { text: `ℹ️ Anda bukan dalam tahanan lokap balai polis!` });
      }
      if (user.cash < 500 && !isOwner) {
        return sock.sendMessage(from, { text: `❌ Peguam pro tidak layan orang poket kering! Sediakan RM 500 tunai dahulu.` });
      }
      if (!isOwner) user.cash -= 500;
      user.cooldowns.jailUntil = 0;
      user.stars = Math.max(0, user.stars - 1);
      user.stats.bails = (user.stats.bails || 0) + 1;
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `⚖️ *IKAT JAMIN DILULUSKAN!* Peguam pro telah menyelesaikan kes mahkamah untuk *${user.name}*. Anda kini bebas bergerak semula!` 
      });
    }

    // =====================================================================
    // 🏢 SEKSYEN 5: HARTANAH & PENDAPATAN PASIF SEWAAN
    // =====================================================================
    if (cmd === "list_hartanah") {
      let ui = `╭━━━ 🏢 *PASARAN HARTANAH AIRI* ━━━\n┃ Beli aset kediaman untuk kutip hasil sewaan pasif setiap hari!\n┃\n`;
      PROPERTIES.forEach(p => {
        ui += `┃ • *[ID ${p.id}]* ${p.name}\n┃   💰 Harga: RM ${p.price.toLocaleString()} | 💵 Sewaan: RM ${p.rent.toLocaleString()}/hari\n┃\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 *Cara Beli:* Taip *.beli_rumah [id]* (Contoh: *.beli_rumah 1*)\n💡 *Kutip Sewa:* Taip *.kutip_sewa*\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_rumah") {
      const pId = parseInt(args[0]);
      const pr = PROPERTIES.find(x => x.id === pId);
      if (!pr) return sock.sendMessage(from, { text: `❌ ID hartanah tidak wujud! Semak di *.list_hartanah*.` });

      if (user.cash < pr.price) {
        return sock.sendMessage(from, { text: `❌ Baki tunai tidak cukup untuk beli *${pr.name}* (Harga: RM ${pr.price.toLocaleString()})!` });
      }

      if (user.properties.includes(pr.id)) {
        return sock.sendMessage(from, { text: `⚠️ Anda sudah memiliki unit hartanah ini!` });
      }

      user.cash -= pr.price;
      user.properties.push(pr.id);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `🏠 *PEMBELIAN HARTANAH BERJAYA!* 🏠\nGeran sah *${pr.name}* kini rasmi didaftarkan atas nama *${user.name}*.\nTaip *.kutip_sewa* setiap 24 jam untuk jana pasif income!` 
      });
    }

    if (cmd === "kutip_sewa") {
      if (!user.properties || user.properties.length === 0) {
        return sock.sendMessage(from, { text: `❌ Anda tiada hartanah untuk dikutip sewa. Beli di *.list_hartanah* dahulu!` });
      }

      if (now < user.cooldowns.rent && !isOwner) {
        const remH = Math.ceil((user.cooldowns.rent - now) / 3600000);
        return sock.sendMessage(from, { text: `⏳ Penyewa baru bayar sewa tadi bro. Datang kutip lagi *${remH} jam* nanti!` });
      }

      let totalRent = 0;
      user.properties.forEach(pId => {
        const pr = PROPERTIES.find(x => x.id === pId);
        if (pr) totalRent += pr.rent;
      });

      user.cash += totalRent;
      user.cooldowns.rent = now + (24 * 3600 * 1000);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `💵 *HASIL SEWAAN HARTANAH:* +RM ${totalRent.toLocaleString()} tunai telah dikutip daripada penyewa dan masuk ke dalam akaun anda!` 
      });
    }

    // =====================================================================
    // 🎰 SEKSYEN 6: KASINO UNDERGROUND, MANCING & PINJAMAN AH LONG
    // =====================================================================
    if (cmd === "coinflip") {
      const choice = args[0]?.toLowerCase();
      const bet = parseInt(args[1]);

      if (!["kepala", "bunga"].includes(choice) || isNaN(bet) || bet <= 0) {
        return sock.sendMessage(from, { text: `❌ Format salah! Taip: *.coinflip [kepala/bunga] [taruhan]*\nContoh: *.coinflip kepala 500*` });
      }

      if (user.cash < bet) {
        return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup untuk taruhan RM ${bet.toLocaleString()}!` });
      }

      const isWin = Math.random() < 0.49 || isOwner;
      user.cash -= bet;

      if (isWin) {
        const reward = bet * 2;
        user.cash += reward;
        user.stats.casinoWon += 1;
        updateUser(cleanSender, user);

        const roast = ROASTS.casino_win[Math.floor(Math.random() * ROASTS.casino_win.length)];
        return sock.sendMessage(from, { 
          text: `🪙 *COINFLIP MENANG!* Syiling menunjukkan *${choice.toUpperCase()}*!\n💰 Pulangan: *+RM ${reward.toLocaleString()}*\n\n💬 _"${roast}"_` 
        });
      } else {
        updateUser(cleanSender, user);
        const roast = ROASTS.casino_lose[Math.floor(Math.random() * ROASTS.casino_lose.length)];
        return sock.sendMessage(from, { 
          text: `🪙 *COINFLIP TEWAS!* Syiling tersasar ke muka bertentangan.\n💸 Kerugian: *-RM ${bet.toLocaleString()}*\n\n💬 _"${roast}"_` 
        });
      }
    }

    if (cmd === "slot") {
      const bet = parseInt(args[0]);
      if (isNaN(bet) || bet < 10) {
        return sock.sendMessage(from, { text: `❌ Format salah! Taip: *.slot [taruhan]* (Minima RM 10)\nContoh: *.slot 200*` });
      }

      if (user.cash < bet) {
        return sock.sendMessage(from, { text: `❌ Baki tunai tidak cukup untuk taruhan slot RM ${bet.toLocaleString()}!` });
      }

      const icons = ["🍒", "🍋", "🍇", "💎", "7️⃣"];
      const r1 = icons[Math.floor(Math.random() * icons.length)];
      const r2 = icons[Math.floor(Math.random() * icons.length)];
      const r3 = icons[Math.floor(Math.random() * icons.length)];

      let mult = 0;
      if (r1 === r2 && r2 === r3) mult = (r1 === "7️⃣" ? 10 : 5);
      else if (r1 === r2 || r2 === r3 || r1 === r3) mult = 1.5;

      user.cash -= bet;

      if (mult > 0 || isOwner) {
        const finalMult = isOwner && mult === 0 ? 3 : mult;
        const reward = Math.floor(bet * finalMult);
        user.cash += reward;
        user.stats.casinoWon += 1;
        updateUser(cleanSender, user);

        const roast = ROASTS.casino_win[Math.floor(Math.random() * ROASTS.casino_win.length)];
        return sock.sendMessage(from, { 
          text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n🔥 *JACKPOT KASINO!* Anda menang *+RM ${reward.toLocaleString()}*!\n\n💬 _"${roast}"_` 
        });
      } else {
        updateUser(cleanSender, user);
        const roast = ROASTS.casino_lose[Math.floor(Math.random() * ROASTS.casino_lose.length)];
        return sock.sendMessage(from, { 
          text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n❌ Tiada kombinasi menang. Duit taruhan *-RM ${bet.toLocaleString()}* lesap!\n\n💬 _"${roast}"_` 
        });
      }
    }

    if (cmd === "mancing") {
      if (now < user.cooldowns.fish && !isOwner) {
        const rem = Math.ceil((user.cooldowns.fish - now) / 1000);
        return sock.sendMessage(from, { text: `🎣 Umpan joran baru dicampak! Tunggu ikan sambar *${rem} saat* lagi.` });
      }

      user.cooldowns.fish = now + 45000;
      const fishes = [
        { name: "Ikan Kembung Segar 🐟", price: 20 },
        { name: "Ikan Siakap Muara 🐠", price: 80 },
        { name: "Ikan Jenahak Merah 🐡", price: 180 },
        { name: "Ikan Kerapu Bara Monster 🦈", price: 450 },
        { name: "Udang Galah Sungai 🦐", price: 90 },
        { name: "Kasut But Getah Koyak 🥾", price: 0 }
      ];

      const caught = fishes[Math.floor(Math.random() * fishes.length)];
      user.cash += caught.price;
      user.stats.fishes += 1;
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `🎣 *HASIL TANGKAPAN JETI!* 🎣\nJoran bergetar kuat dan anda menaikkan *${caught.name}*!\n💰 Nilai Jualan: *+RM ${caught.price.toLocaleString()}*` 
      });
    }

    if (cmd === "hutang_ahlong") {
      const amt = parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || amt > 50000) {
        return sock.sendMessage(from, { text: `❌ Had pinjaman Ah Long adalah RM 1 hingga RM 50,000 sahaja!\nContoh: *.hutang_ahlong 10000*` });
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

    // =====================================================================
    // 🏦 SEKSYEN 7: PERBANKAN, WARUNG & PVP INTERACTION
    // =====================================================================
    if (cmd === "deposit" || cmd === "dep") {
      const amt = args[0] === "all" ? user.cash : parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || user.cash < amt) {
        return sock.sendMessage(from, { text: `❌ Jumlah simpanan tidak sah atau baki tunai tidak cukup!` });
      }
      user.cash -= amt;
      user.bank += amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { 
        text: `🏦 *SIMPANAN BANK BERJAYA!* +RM ${amt.toLocaleString()} selamat disimpan dalam akaun bank dari ancaman perompak.` 
      });
    }

    if (cmd === "withdraw" || cmd === "wd") {
      const amt = args[0] === "all" ? user.bank : parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || user.bank < amt) {
        return sock.sendMessage(from, { text: `❌ Jumlah pengeluaran tidak sah atau baki bank tidak cukup!` });
      }
      user.bank -= amt;
      user.cash += amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { 
        text: `💵 *PENGELUARAN TUNAI BERJAYA!* +RM ${amt.toLocaleString()} dikeluarkan ke poket.` 
      });
    }

    if (cmd === "transfer" || cmd === "pay") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt) || amt <= 0 || user.cash < amt) {
        return sock.sendMessage(from, { text: `❌ Format salah! Taip: *.transfer @user [jumlah]*` });
      }
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) {
        return sock.sendMessage(from, { text: `❌ Nak transfer duit kat diri sendiri kenapa? Otak tertinggal ke bro?` });
      }

      const targetUser = getUser(cleanTarget);
      user.cash -= amt;
      targetUser.cash += amt;
      updateUser(cleanSender, user);
      updateUser(cleanTarget, targetUser);

      return sock.sendMessage(from, { 
        text: `💸 *PINDAHAN WANG BERJAYA!* *${user.name}* telah memindahkan *RM ${amt.toLocaleString()}* kepada *${targetUser.name}*! Rezeki jangan ditolak.`,
        mentions: [cleanTarget]
      });
    }

    if (cmd === "rompak") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa yang mahu dirompak! Contoh: *.rompak @user*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Merompak poket sendiri? Gila ke apa?` });

      const targetUser = getUser(cleanTarget);
      if (targetUser.cash < 100) {
        return sock.sendMessage(from, { text: `😅 Mangsa (*${targetUser.name}*) poket kempis bawah RM100. Cari mangsa kaya lain la!` });
      }

      user.cooldowns.crime = now + (5 * 60 * 1000);
      let successRate = 0.45;
      if (activePhoneObj?.perk === "pvp") successRate += activePhoneObj.val;

      const isSuccess = Math.random() < successRate || isOwner;

      if (isSuccess) {
        const stolen = Math.floor(targetUser.cash * 0.25);
        targetUser.cash -= stolen;
        user.cash += stolen;
        user.stars = Math.min(5, user.stars + 1);
        await checkAndAwardBadges(user, sock, from);
        updateUser(cleanSender, user);
        updateUser(cleanTarget, targetUser);

        const roast = ROASTS.rompak_win[Math.floor(Math.random() * ROASTS.rompak_win.length)];
        return sock.sendMessage(from, { 
          text: `🥷 *ROMPAKAN PVP BERJAYA!* 🥷\n*${user.name}* menyamun *RM ${stolen.toLocaleString()}* daripada poket *${targetUser.name}*!\n\n💬 _"${roast}"_`,
          mentions: [cleanTarget]
        });
      } else {
        let fine = 300;
        if (activePhoneObj?.perk === "def" || activePhoneObj?.perk === "god") fine -= Math.floor(fine * activePhoneObj.val);
        user.cash = Math.max(0, user.cash - fine);
        user.cooldowns.jailUntil = now + (3 * 60 * 1000);
        updateUser(cleanSender, user);

        const roast = ROASTS.rompak_fail[Math.floor(Math.random() * ROASTS.rompak_fail.length)];
        return sock.sendMessage(from, { 
          text: `🚨 *KANTOI MENYAMUN KAWAN!* Cubaan merompak *${targetUser.name}* gagal. Denda *-RM ${fine}* dan masuk lokap 3 minit!\n\n💬 _"${roast}"_`,
          mentions: [cleanTarget]
        });
      }
    }

    if (cmd === "shop" || cmd === "warung") {
      let ui = `╭━━━ 🍔 *WARUNG MAKANAN AIRI* ━━━\n┃ Beli makanan untuk pulihkan stamina & reset cooldown!\n┃\n`;
      FOOD_ITEMS.forEach(f => {
        ui += `┃ • *[${f.id}]* ${f.name} ➔ RM ${f.price}\n┃   _${f.desc}_\n┃\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💡 *Cara Beli:* Taip *.beli_makanan [id]*\n💡 *Cara Makan:* Taip *.makan [id]*\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_makanan") {
      const fId = args[0]?.toLowerCase();
      const f = FOOD_ITEMS.find(x => x.id === fId);
      if (!f) return sock.sendMessage(from, { text: `❌ Menu makanan tidak wujud! Semak di *.shop*.` });

      if (user.cash < f.price) {
        return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup nak beli *${f.name}*!` });
      }

      user.cash -= f.price;
      user.food.push(f.id);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `🍽️ Berjaya order *${f.name}*! Makanan disimpan dalam beg. Taip *.makan ${f.id}* bila lapar.` 
      });
    }

    if (cmd === "makan") {
      const fId = args[0]?.toLowerCase();
      const idx = user.food.indexOf(fId);
      if (idx === -1) {
        return sock.sendMessage(from, { text: `❌ Makanan itu tiada dalam beg anda! Beli di *.shop* dahulu.` });
      }

      user.food.splice(idx, 1);
      if (fId === "nasilemak") {
        user.cooldowns.workJobs = {};
      }
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `😋 *KENYANG SENDURIA!* Anda telah makan *${fId.toUpperCase()}*. Semua cooldown kerja anda diset semula serta-merta!` 
      });
    }

    // =====================================================================
    // 🪪 SEKSYEN 8: IDENTITI, PROFIL & LEADERBOARD
    // =====================================================================
    if (cmd === "myid" || cmd === "ic") {
      const title = getTitle(user);
      const activeJob = JOBS.find(j => j.id === user.jobId)?.name || "Pekerja Am";
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

      const ui = `╭━━━ 🪪 *CYBER IDENTITY CARD (AIRI OS)* ━━━
┃ 👤 *Nama Warga:* ${user.name}
┃ 📝 *Bio / Status:* _"${currentBio}"_
┃ 🎖️ *Gelaran:* ${title}
┃ 📱 *Peranti Aktif:* ${user.phoneName}
┃ 💼 *Jawatan:* ${activeJob} [ID ${user.jobId}]
┃ 💵 *Tunai Poket:* RM ${user.cash.toLocaleString()}
┃ 🏦 *Simpanan Bank:* RM ${user.bank.toLocaleString()}
┃ 🦈 *Hutang Ah Long:* RM ${user.debt ? user.debt.toLocaleString() : "0"}
┃ 💎 *Jumlah Nilai Aset:* RM ${totalWealth.toLocaleString()}
┃ 🏎️ *Koleksi Jentera:* ${user.vehicles.length} Unit
┃ ⭐ *Bintang Wanted:* ${"⭐".repeat(user.stars) || "0 (Suci Murni)"}
┃ 🏅 *Jumlah Badges:* ${user.badges.length} Lencana
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "profile" || cmd === "garaj") {
      const vehicleList = user.vehicles.length > 0
        ? user.vehicles.map(vId => {
            const v = VEHICLES.find(x => x.id === vId);
            const mods = user.vehicleMods?.[vId] || [];
            return `• ${v?.name || vId} (${v?.type}) [Mod: ${mods.length > 0 ? mods.join(", ") : "Standard"}]`;
          }).join("\n┃ ")
        : "Garaj kosong tiada jentera.";

      const itemList = user.inventory.length > 0
        ? user.inventory.map(i => `• ${i.name}`).join("\n┃ ")
        : "Beg kosong tiada gajet gelap.";

      const propList = user.properties.length > 0
        ? user.properties.map(pId => {
            const p = PROPERTIES.find(x => x.id === pId);
            return `• ${p?.name || pId} [Sewa: RM ${p?.rent}/hari]`;
          }).join("\n┃ ")
        : "Tiada rekod pemilikan hartanah.";

      const ui = `╭━━━ 🎒 *PROFIL GARAJ, GAJET & ASET* ━━━
┃ 👤 Pemilik: *${user.name}*
┃ 📱 Peranti Semasa: *${user.phoneName}*
┃
┃ 🏎️ *GARAJ KENDERAAN:*
┃ ${vehicleList}
┃
┃ 🏴‍☠️ *GAJET BLACK MARKET:*
┃ ${itemList}
┃
┃ 🏢 *HARTANAH DIBAWAH MILIK:*
┃ ${propList}
┃
┃ 🍔 *BEKALAN MAKANAN:*
┃ ${user.food.length > 0 ? user.food.join(", ") : "Peti kosong lapar."}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "badges" || cmd === "lencana") {
      const ui = `╭━━━ 🏅 *KOLEKSI LENCANA AIRI'S CORNER* ━━━
┃ 👤 Warga: *${user.name}*
┃ 🎖️ Jumlah Dikumpul: ${user.badges.length} Lencana
┃
┃ ${user.badges.map(b => `• ${b}`).join("\n┃ ")}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "top" || cmd === "leaderboard") {
      const db = loadDB();
      const topUsers = Object.entries(db.users || {})
        .map(([id, d]) => ({ name: d.name || id.split("@")[0], total: (d.cash || 0) + (d.bank || 0) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      let ui = `╭━━━ 🏆 *LEADERBOARD 5 JUTAWAN TERKAYA* ━━━\n┃\n`;
      topUsers.forEach((u, i) => {
        ui += `┃ ${i + 1}. *${u.name}* ➔ RM ${u.total.toLocaleString()}\n`;
      });
      ui += `┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nYang tak tersenarai tu jangan malas, pergi kerja cari duit!`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "tanya_mamak" || cmd === "mamak") {
      const mamakQuotes = [
        "Boss! Minum teh tarik ni dulu. Mamak tengok muka kau macam tak makan 3 hari, poket kering sangat ke?",
        "Aney nak pesan, malam ni ada roadblock besar kat simpang. Siapa bawak motor takde cukai jalan elok tidur kat rumah!",
        "Duduk dulu boss! Rezeki halal biar lambat asal selamat, jangan sibuk nak godam ATM lorong belakang.",
        "Bossku, kalau kena tangkap polis jangan sebut nama Mamak eh! Sediakan RM500 siap-siap upah peguam pro.",
        "Mamak tengok budak-budak sekarang lumba drag tak ingat dunia. Ingat mak ayah kat kampung tu sama bro!",
        "Koleksi jentera banyak tapi hutang kedai mamak RM5 pun liat nak bayar. Apa cerita bos?",
        "Nak kaya cepat pergi beli hartanah kat Airi Grid, tiap-tiap hari goyang kaki kutip duit sewa!"
      ];
      const quote = mamakQuotes[Math.floor(Math.random() * mamakQuotes.length)];
      return sock.sendMessage(from, { text: `👨‍🍳 *Mamak Bistro Cyber Intel:*\n\n_"${quote}"_` });
    }

  });
}

startBotEngine();
