import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import http from "http";
import QRCode from "qrcode";
import dotenv from "dotenv";
dotenv.config();

// --- 0. KUNCI KESELAMATAN OWNER MUTLAK (AMAR) ---
const OWNER_NUMBER = "601166533534@s.whatsapp.net";

let currentQR = "";
let isConnected = false;

// --- 1. PELAYAN WEB UNTUK DISPLAY QR DI RENDER ---
const PORT = process.env.PORT || 3000;
http.createServer(async (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  if (isConnected) {
    res.end("<div style='text-align:center;margin-top:50px;font-family:sans-serif;'><h1 style='color:#00e676;'>✅ AIRI'S CORNER BOT ONLINE!</h1><p>Sistem aktif 24/7. Kuasa Founder terkunci selamat.</p></div>");
  } else if (currentQR) {
    try {
      const qrImage = await QRCode.toDataURL(currentQR);
      res.end(`
        <div style="text-align:center;margin-top:30px;font-family:sans-serif;background:#0d1117;color:#fff;padding:20px;min-height:90vh;">
          <h1 style="color:#00ffff;">⚡ AIRI'S CORNER : SCAN QR ⚡</h1>
          <p style="color:#aaa;">Buka WhatsApp > Linked Devices > Imbas Kod QR di bawah:</p>
          <div style="margin:20px auto;display:inline-block;padding:15px;background:#fff;border-radius:12px;">
            <img src="${qrImage}" style="width:280px;height:280px;display:block;"/>
          </div>
        </div>
      `);
    } catch (e) {
      res.end("Ralat QR: " + e.message);
    }
  } else {
    res.end("<div style='text-align:center;margin-top:50px;font-family:sans-serif;'><h2>⚡ Menjana Kod QR... Sila refresh sebentar.</h2></div>");
  }
}).listen(PORT);

// --- 2. SISTEM DATABASE JSON ---
const DB_FILE = "./database.json";
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, groups: [] }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE));
  } catch (e) {
    return { users: {}, groups: [] };
  }
}
function saveDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

function getUser(userId, pushName = "Warga Cyber") {
  const db = loadDB();
  if (!db.users[userId]) {
    db.users[userId] = {
      name: pushName || "Warga Cyber",
      cash: 500,
      bank: 0,
      jobId: 1,
      phoneDevice: null,
      phoneName: "Public Phone Awam",
      inventory: [],
      vehicles: [],
      food: [],
      stars: 0,
      badges: ["🌱 [COMMON] Warga Baru"],
      stats: { works: 0, crimes: 0, bails: 0, racesWon: 0 },
      cooldowns: { workJobs: {}, crime: 0, jailUntil: 0, daily: 0, race: 0 }
    };
    saveDB(db);
  }
  const u = db.users[userId];
  if (pushName && pushName !== "Warga Cyber") u.name = pushName;
  if (!u.stats) u.stats = { works: 0, crimes: 0, bails: 0, racesWon: 0 };
  if (!u.badges) u.badges = ["🌱 [COMMON] Warga Baru"];
  if (!u.food) u.food = [];
  if (!u.vehicles) u.vehicles = [];
  if (!u.inventory) u.inventory = [];
  if (!u.phoneName) u.phoneName = "Public Phone Awam";
  if (!u.jobId) u.jobId = 1;
  if (!u.cooldowns) u.cooldowns = { workJobs: {}, crime: 0, jailUntil: 0, daily: 0, race: 0 };
  if (!u.cooldowns.workJobs) u.cooldowns.workJobs = {};
  return u;
}

function updateUser(userId, userData) {
  const db = loadDB();
  db.users[userId] = userData;
  saveDB(db);
}

// --- 3. 10 SENARAI TELEFON / PERANTI ASLI BESERTA FUNGSI ---
const PHONE_DEVICES = [
  { id: "nokia3310", name: "Nokia 3310 Brick", price: 150, bonus: "Tahan lasak! Potong 15% denda polis", perk: "def", val: 0.15 },
  { id: "redmi12", name: "Redmi Note 12 5G", price: 750, bonus: "Multi-tasking asas, gaji kerja halal +5%", perk: "work", val: 0.05 },
  { id: "infinixgt", name: "Infinix GT 20 Pro", price: 1200, bonus: "Sistem cip bypass, potong 30s cooldown kerja", perk: "cd", val: 30000 },
  { id: "poco_f6", name: "POCO F6 Speed", price: 1800, bonus: "Talaan cip litar, peluang menang lumba drag +7%", perk: "race", val: 0.07 },
  { id: "iqoo12", name: "iQOO 12 Monster Gaming", price: 3300, bonus: "Skrin 144Hz, peluang menang lumba drag +15%", perk: "race", val: 0.15 },
  { id: "rog8", name: "ROG Phone 8 Pro", price: 4600, bonus: "AirTrigger haptic, kejayaan rompakan PvP +12%", perk: "pvp", val: 0.12 },
  { id: "ip15pro", name: "iPhone 15 Pro Titanium", price: 5400, bonus: "Gaya korporat VIP, gaji kerja halal +20%", perk: "work", val: 0.20 },
  { id: "s24ultra", name: "Samsung Galaxy S24 Ultra AI", price: 6200, bonus: "S-Pen Decryptor AI, kejayaan misi jenayah +15%", perk: "crime", val: 0.15 },
  { id: "magicv2", name: "HONOR Magic V2 Fold", price: 6900, bonus: "Dwi-skrin pelaburan, dividen bank harian +10%", perk: "bank", val: 0.10 },
  { id: "shadow_phone", name: "Shadow Legion X CyberDeck", price: 15000, bonus: "Gajet Ultimate, +20% Lumba, +20% Kerja & 50% Kebal Denda!", perk: "god", val: 0.20 }
];

// --- 4. 50 KERJA HALAL LENGKAP ---
const JOBS = [
  { id: 1, name: "Pekerja Am", pay: 30 }, { id: 2, name: "Pencuci Pinggan", pay: 40 }, { id: 3, name: "Rider GrabFood", pay: 60 },
  { id: 4, name: "Runner Foodpanda", pay: 65 }, { id: 5, name: "Pemandu Van", pay: 80 }, { id: 6, name: "Kerani Pejabat", pay: 100 },
  { id: 7, name: "Juruteknik", pay: 120 }, { id: 8, name: "Operator Kilang", pay: 130 }, { id: 9, name: "Penjual Burger", pay: 150 },
  { id: 10, name: "Barista", pay: 160 }, { id: 11, name: "Jurujual", pay: 180 }, { id: 12, name: "Tukang Masak", pay: 200 },
  { id: 13, name: "Graphic Designer", pay: 250 }, { id: 14, name: "Video Editor", pay: 260 }, { id: 15, name: "Social Media Admin", pay: 280 },
  { id: 16, name: "Ejen Hartanah", pay: 300 }, { id: 17, name: "Tukang Paip", pay: 320 }, { id: 18, name: "Juruelektrik", pay: 350 },
  { id: 19, name: "Mekanik", pay: 380 }, { id: 20, name: "Foreman", pay: 400 }, { id: 21, name: "Cikgu Tuisyen", pay: 420 },
  { id: 22, name: "Jurutera Awam", pay: 500 }, { id: 23, name: "Akauntan", pay: 550 }, { id: 24, name: "Pengurus Projek", pay: 600 },
  { id: 25, name: "Peguam", pay: 700 }, { id: 26, name: "Doktor", pay: 800 }, { id: 27, name: "Software Engineer", pay: 900 },
  { id: 28, name: "Data Scientist", pay: 950 }, { id: 29, name: "Pilot", pay: 1200 }, { id: 30, name: "Kapten Kapal", pay: 1300 },
  { id: 31, name: "Arkitek", pay: 1100 }, { id: 32, name: "Pakar Bedah", pay: 1500 }, { id: 33, name: "Trader Forex", pay: 400 },
  { id: 34, name: "Crypto Miner", pay: 450 }, { id: 35, name: "YouTuber", pay: 500 }, { id: 36, name: "Streamer", pay: 550 },
  { id: 37, name: "Tukang Jahit", pay: 200 }, { id: 38, name: "Pembina Web", pay: 800 }, { id: 39, name: "Ejen Insurans", pay: 350 },
  { id: 40, name: "Pengurus Bank", pay: 1000 }, { id: 41, name: "Cef Eksekutif", pay: 1100 }, { id: 42, name: "Jurugambar", pay: 400 },
  { id: 43, name: "Juruaudit", pay: 750 }, { id: 44, name: "Kontraktor", pay: 900 }, { id: 45, name: "Ahli Farmasi", pay: 850 },
  { id: 46, name: "Psikologis", pay: 950 }, { id: 47, name: "Penganalisis Siber", pay: 1200 }, { id: 48, name: "Pakar Ekonomi", pay: 1400 },
  { id: 49, name: "Pelabur", pay: 2000 }, { id: 50, name: "CEO Korporat", pay: 2500 }
];

// --- 5. 40 KENDERAAN LENGKAP ---
const VEHICLES = [
  // 20 MOTOR
  { id: "ex5", name: "Honda EX5 High Power", price: 3000, type: "Motor", speed: 50, desc: "Jentera legenda bandar, servis murah & jimat petrol" },
  { id: "wave125", name: "Honda Wave 125i", price: 5500, type: "Motor", speed: 55, desc: "Selesa untuk perjalanan harian dan tugas penghantaran" },
  { id: "lagenda", name: "Yamaha Lagenda 115Z", price: 6000, type: "Motor", speed: 58, desc: "Tunggang santai dengan pengendalian mantap di jalan raya" },
  { id: "lc135", name: "Yamaha LC135 V8", price: 7500, type: "Motor", speed: 65, desc: "Pickup pantas untuk kegunaan lari daripada kesesakan" },
  { id: "y15", name: "Yamaha Y15ZR (Ysuku)", price: 10000, type: "Motor", speed: 72, desc: "Raja jalanan dengan potensi menang drag race yang stabil" },
  { id: "rs150", name: "Honda RS150R V2", price: 10500, type: "Motor", speed: 73, desc: "DOHC enjin lasak, stabil pada kelajuan tinggi di lebuh raya" },
  { id: "nvx", name: "Yamaha NVX 155 ABS", price: 12000, type: "Motor", speed: 75, desc: "Skuter pintar moden dengan sistem brek anti-kunci ABS" },
  { id: "nmax", name: "Yamaha NMAX 155", price: 13000, type: "Motor", speed: 74, desc: "Kusyen empuk untuk perjalanan jarak jauh tanpa keletihan" },
  { id: "r15", name: "Yamaha YZF-R15M", price: 14000, type: "Motor", speed: 78, desc: "Gaya jentera lumba super sport dengan Quickshifter" },
  { id: "cbr150", name: "Honda CBR150R", price: 14500, type: "Motor", speed: 79, desc: "Aerodinamik tajam, pengendalian lincah membelah angin" },
  { id: "adv160", name: "Honda ADV 160", price: 15000, type: "Motor", speed: 76, desc: "Jentera lasak serba guna jalan bertar mahupun laluan sukar" },
  { id: "z250", name: "Kawasaki Z250", price: 21000, type: "Motor", speed: 85, desc: "Streetfighter 2 silinder dengan tork padu gear rendah" },
  { id: "ninja250", name: "Kawasaki Ninja 250", price: 22000, type: "Motor", speed: 88, desc: "Reka bentuk ikonik trek perlumbaan dengan kelajuan tinggi" },
  { id: "mt07", name: "Yamaha MT-07", price: 40000, type: "Motor", speed: 105, desc: "Master of Torque (CP2 Engine), tayar depan mudah terangkat" },
  { id: "z800", name: "Kawasaki Z800 Monster", price: 48000, type: "Motor", speed: 115, desc: "Naked 4 silinder bersuara garang untuk intimidasi lawan" },
  { id: "r6", name: "Yamaha YZF-R6 Scream", price: 85000, type: "Motor", speed: 135, desc: "Jeritan enjin 16,000 RPM, penguasa podium perlumbaan trek" },
  { id: "zx6r", name: "Kawasaki ZX-6R Ninja", price: 90000, type: "Motor", speed: 140, desc: "Jentera supersport 636cc berkuasa tinggi untuk kelajuan mutlak" },
  { id: "s1000rr", name: "BMW S1000RR M", price: 175000, type: "Motor", speed: 165, desc: "Superbike berteknologi tinggi dengan Dynamic Traction Control" },
  { id: "panigale", name: "Ducati Panigale V4S", price: 180000, type: "Motor", speed: 170, desc: "Jentera eksotik Itali dengan kuasa tork luar biasa" },
  { id: "h2", name: "Kawasaki Ninja H2", price: 250000, type: "Motor", speed: 190, desc: "Enjin Supercharged buatan aeroangkasa, peluru darat terpantas" },
  // 20 KERETA
  { id: "kancil", name: "Perodua Kancil Turbo", price: 5000, type: "Kereta", speed: 45, desc: "Kereta kompak ringan, mudah selit dan jimat kos penyelenggaraan" },
  { id: "iswara", name: "Proton Iswara Aeroback", price: 8000, type: "Kereta", speed: 50, desc: "Kereta kebal klasik rakyat Malaysia, tahan lasak" },
  { id: "saga", name: "Proton Saga BLM", price: 12000, type: "Kereta", speed: 55, desc: "Sedan harian keluarga dengan ruang bonet luas" },
  { id: "wira", name: "Proton Wira 1.5 GLi", price: 15000, type: "Kereta", speed: 60, desc: "Platform terbaik pengubahsuaian enjin perlumbaan jalanan" },
  { id: "preve", name: "Proton Preve Turbo", price: 40000, type: "Kereta", speed: 75, desc: "Handling Lotus mantap, stabil pada selekoh kelajuan tinggi" },
  { id: "persona", name: "Proton Persona Premium", price: 45000, type: "Kereta", speed: 70, desc: "Pemanduan harian selesa dengan ciri keselamatan moden" },
  { id: "myvi", name: "Perodua Myvi King 1.5", price: 50000, type: "Kereta", speed: 82, desc: "Raja Segala Jalan Raya Malaysia, serba boleh dalam apa jua misi" },
  { id: "x50", name: "Proton X50 TGDi", price: 90000, type: "Kereta", speed: 95, desc: "SUV segmen-B berkuasa turbo dengan ciri pemanduan autonomi" },
  { id: "vios", name: "Toyota Vios GR-Sport", price: 95000, type: "Kereta", speed: 85, desc: "Suspensi talaan sukan untuk pengendalian tajam di litar" },
  { id: "x70", name: "Proton X70 Premium", price: 120000, type: "Kereta", speed: 100, desc: "SUV mewah kelas eksekutif dengan kabin senyap dan luas" },
  { id: "civic", name: "Honda Civic FC Ketam", price: 130000, type: "Kereta", speed: 110, desc: "VTEC Turbo ikonik kegemaran ramai, laju dan bergaya" },
  { id: "accord", name: "Honda Accord Turbo", price: 180000, type: "Kereta", speed: 120, desc: "Sedan mewah VIP untuk penampilan korporat berprestij" },
  { id: "alphard", name: "Toyota Alphard Executive", price: 350000, type: "Kereta", speed: 95, desc: "Lambang kekayaan jutawan dan pemimpin berprofil tinggi" },
  { id: "mustang", name: "Ford Mustang 5.0 V8 GT", price: 550000, type: "Kereta", speed: 145, desc: "Muscle car sejati dengan deruman enjin V8 berkuasa" },
  { id: "gtr", name: "Nissan GT-R R35 Nismo", price: 650000, type: "Kereta", speed: 165, desc: "Godzilla jalanan, sistem pacuan semua roda AWD peluncur kilat" },
  { id: "m4", name: "BMW M4 Competition", price: 750000, type: "Kereta", speed: 170, desc: "Jentera drift litar dengan imbangan berat 50:50 sempurna" },
  { id: "c63", name: "Mercedes-AMG C63s", price: 780000, type: "Kereta", speed: 172, desc: "Bi-turbo V8 mewah dengan pecutan garang tiada kompromi" },
  { id: "ferrari", name: "Ferrari 488 Pista", price: 1500000, type: "Kereta", speed: 185, desc: "Supercar Itali tulen dengan aero litar F1 yang menakjubkan" },
  { id: "lambo", name: "Lamborghini Huracan EVO", price: 1600000, type: "Kereta", speed: 190, desc: "Enjin V10 Naturally Aspirated dengan jeritan ekzos memukau" },
  { id: "911", name: "Porsche 911 GT3 RS", price: 1800000, type: "Kereta", speed: 195, desc: "Senjata litar terhebat dunia, raja selekoh dan penakluk rekod" }
];

// --- 6. WARUNG MAKANAN & BLACK MARKET ---
const FOOD_ITEMS = [
  { id: "tehtarik", name: "Teh Tarik Kaw", price: 4, desc: "Potong 1 minit cooldown kerja" },
  { id: "roticanai", name: "Roti Canai Banjir", price: 7, desc: "Potong 2 minit cooldown kerja" },
  { id: "nasilemak", name: "Nasi Lemak Sotong", price: 12, desc: "Reset terus cooldown semua kerja" },
  { id: "burger", name: "Burger Ramly Special", price: 15, desc: "Pulihkan stamina & kurangkan denda" }
];

const BLACKMARKET_ITEMS = [
  { id: "skimmer", name: "Alat Skimming ATM", price: 20000, desc: "Curi data kad ATM lorong gelap" },
  { id: "decrypter", name: "Flash-Drive Decrypter", price: 50000, desc: "Pintas firewall keselamatan bank" },
  { id: "jammer", name: "EMP Radio Jammer", price: 100000, desc: "Kacau frekuensi radio peronda polis" },
  { id: "keycard", name: "Kad Akses VIP Kasino", price: 250000, desc: "Akses pintu bilik kebal kasino" },
  { id: "flipper", name: "Flipper Zero Modded", price: 500000, desc: "Godam pangkalan data induk bandar" }
];

// --- 7. 10 MISI JENAYAH ---
const CRIMES = [
  { id: 1, name: "Ragut Beg Tepi Jalan", rewardMin: 50, rewardMax: 150, stars: 1, fine: 100 },
  { id: 2, name: "Rompak Kedai Runcit Acheh", rewardMin: 150, rewardMax: 300, stars: 1, fine: 250 },
  { id: 3, name: "Kopek Mangga Motor Parkir", rewardMin: 300, rewardMax: 600, stars: 2, fine: 500 },
  { id: 4, name: "Pecah Masuk Kedai Emas", rewardMin: 700, rewardMax: 1500, stars: 2, fine: 1200 },
  { id: 5, name: "Rompak Banglo Orang Kaya", rewardMin: 1500, rewardMax: 3000, stars: 3, fine: 2500 },
  { id: 6, name: "Skimming Mesin ATM", rewardMin: 3500, rewardMax: 6000, reqItem: "skimmer", stars: 3, fine: 4500 },
  { id: 7, name: "Godam Sistem Bank Pusat", rewardMin: 7000, rewardMax: 12000, reqItem: "decrypter", stars: 4, fine: 8500 },
  { id: 8, name: "Penyeludupan Kontraban Port", rewardMin: 15000, rewardMax: 25000, reqItem: "jammer", stars: 4, fine: 14000 },
  { id: 9, name: "Heist Bilik Kebal Kasino", rewardMin: 30000, rewardMax: 60000, reqItem: "keycard", stars: 5, fine: 25000 },
  { id: 10, name: "Eksploitasi Darkweb Zero", rewardMin: 80000, rewardMax: 200000, reqItem: "flipper", stars: 5, fine: 45000 }
];

// --- 8. DIALOG ROASTING MALAYSIA ---
const ROAST_KERJA = [
  "Wah berpeluh dahi macam lari marathon tapi gaji ciput je masuk. Jadilah buat beli kuaci!",
  "Rajin betul kau grind harini, ingatkan pemalas tegar dalam group ni.",
  "Dah dapat gaji tu beringat sikit, jangan petang ni terus habis kat warung kopi hipster!",
  "Gaji masuk dah. Muka ada senyum, tapi baki bank menangis tengok komitmen.",
  "Kerja macam nak gila tapi poket macam kena hisap jembalang. Teruskan usaha jangan give up!"
];

const ROAST_DAILY = [
  "Nah sedekah RM250! Jangan buat beli vape perisa pelik-pelik pulak.",
  "Setiap 24 jam muka kau tercegat mintak elaun free, dasar B40 tegar.",
  "Bantuan dah masuk poket! Kalau poket bocor lagi esok, jangan lupa tadah tangan balik.",
  "Ambil duit ni buat beli beras, jangan sibuk nak belanja awek cyber!"
];

const ROAST_CRIME_SUCCESS = [
  "Fuh licik! Polis peronda pun rabun tak nampak kau rembat duit haram ni.",
  "Bagus bakat menyamun kau, mak bapak tengok pun geleng kepala bangga.",
  "Duit haram masuk poket! Hati-hati jangan sampai kantoi kena sebat kat lokap nanti.",
  "Operasi underground settle bersih! Jangan pamer sangat kekayaan tu kang polis hidu."
];

const ROAST_CRIME_FAIL = [
  "Muka macam perompak legend tapi kopek mangga pun kantoi, tepuk dahi polis balai!",
  "Acah-acah kingpin sekali polis hon terus terkencing dalam seluar. Masuk lokap padan muka!",
  "Skill menyamun taraf budak tadika. Duduk lokap diam-diam renung dinding tu!",
  "Nak buat jahat tapi otak tinggal kat rumah. Kan dah kena denda dengan mahkamah!"
];

const ROAST_ROMPAK_SUCCESS = [
  "Aduh kesian mangsa kena rembat! Lain kali simpan duit dalam bank bukan bawah bantal.",
  "Penyamun terlatih! Mangsa tercari-cari wallet dia ingat tertinggal kat kedai mamak.",
  "Masyuk poket kau merompak kawan sendiri. Kawan makan kawan betul!"
];

const ROAST_ROMPAK_FAIL = [
  "Nak merompak kawan sekali kawan tu lagi gangster dari kau! Kena tibai free-free.",
  "Tangan bergetar macam kena parkinson masa nak seluk poket. Kan dah kantoi!",
  "Gagal menyamun! Sekarang kau kena denda dan dihumban ke lokap, buat malu keturunan."
];

const ROAST_RACE_WIN = [
  "Jentera berdesup tinggalkan asap tebal! Lawan kau tengah menangis tolak motor kat belakang.",
  "Menang drag race! Boleh la sembang kencang kat kedai mamak malam ni.",
  "Pecutan mantap! Lawan kau ingatkan tengah lumba dengan roket Elon Musk."
];

const ROAST_RACE_LOSE = [
  "Acah-acah pelumba F1 sekali terbabas cium divider jalan. Kos bengkel lagi mahal dari maruah kau!",
  "Bawa jentera macam siput sedut ada hati nak ajak drag race. Pergi balik kampung la!",
  "Enjin berasap tayar meletup! Mekanik gelak besar tengok dompet kau kena kikis."
];

const ROAST_MAMAK = [
  "Boss! Minum teh tarik ni dulu. Mamak tengok muka kau macam tak makan 3 hari, poket kering sangat ke?",
  "Aney nak pesan, malam ni ada roadblock besar kat simpang. Siapa bawak motor takde cukai jalan elok tidur kat rumah!",
  "Duduk dulu boss! Rezeki halal biar lambat asal selamat, jangan sibuk nak godam ATM lorong belakang.",
  "Bossku, kalau kena tangkap polis jangan sebut nama Mamak eh! Sediakan RM500 siap-siap upah peguam pro."
];

function getTitle(user) {
  const total = user.cash + user.bank;
  if (user.isOwner) return "👑 Pengasas Mutlak (Founder)";
  if (user.stars >= 4) return "🏴‍☠️ Kingpin Underworld";
  if (user.stars >= 2) return "🥷 Buronan Dikehendaki";
  if (total >= 1000000) return "💎 Jutawan Korporat";
  if (total >= 200000) return "💼 Pengurus Eksekutif";
  if (total >= 50000) return "⭐ Pekerja Teladan";
  return "🌱 Warga Cyber";
}

// --- 9. SISTEM BADGE BERKATEGORI (COMMON -> MYTHIC) ---
async function checkAndAwardBadges(user, sock, from) {
  const newBadges = [];
  const totalMoney = user.cash + user.bank;
  const userName = user.name;

  // COMMON & UNCOMMON
  if (user.stats.works >= 5 && !user.badges.includes("🔨 [COMMON] Buruh Gigih")) {
    user.badges.push("🔨 [COMMON] Buruh Gigih");
    newBadges.push("🔨 [COMMON] Buruh Gigih");
  }
  if (user.stats.crimes >= 5 && !user.badges.includes("🕶️ [UNCOMMON] Pencuri Jalanan")) {
    user.badges.push("🕶️ [UNCOMMON] Pencuri Jalanan");
    newBadges.push("🕶️ [UNCOMMON] Pencuri Jalanan");
  }

  // RARE
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

  // EPIC
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

  // LEGENDARY
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

  // MYTHIC
  if (totalMoney >= 1000000 && !user.badges.includes("👑 [MYTHIC] Jutawan Trilion Airi")) {
    user.badges.push("👑 [MYTHIC] Jutawan Trilion Airi");
    newBadges.push("👑 [MYTHIC] Jutawan Trilion Airi");
  }
  if (user.vehicles.length >= 15 && !user.badges.includes("🌌 [MYTHIC] Maharaja Garaj")) {
    user.badges.push("🌌 [MYTHIC] Maharaja Garaj");
    newBadges.push("🌌 [MYTHIC] Maharaja Garaj");
  }

  // HANTAR NOTIFIKASI KAD LENCANA DIGITAL (TEKS KEMAS)
  for (const bName of newBadges) {
    const badgeCert = `╭━━━ 🎖️ *PENSIJILAN LENCANA RASMI* ━━━
┃ 🌐 *AIRI'S CORNER RECOGNITION*
┃ 👤 Penerima: *${userName}*
┃ 🏅 Lencana: *${bName}*
┃ 🏛️ Pengeluar: *Airi's Corner Grid Authority*
┃ 📜 Status: *SAH & TERPAUT DI PROFIL*
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    await sock.sendMessage(from, { text: badgeCert });
  }
}

// --- 10. ENGINE UTAMA BAILEYS ---
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
      console.log("⚡ QR Code sedia untuk diimbas di pelayar web.");
    }
    if (connection === "close") {
      isConnected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBotEngine();
    } else if (connection === "open") {
      isConnected = true;
      currentQR = "";
      console.log("✅ BOT AIRI'S CORNER TELAH BERSAMBUNG KE WHATSAPP!");
    }
  });

  sock.ev.on("group-participants.update", async (anu) => {
    if (anu.action === "add") {
      for (const num of anu.participants) {
        const cleanId = num.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        getUser(cleanId, "Warga Baru");
        await sock.sendMessage(anu.id, {
          text: `👋 Salam @${num.split("@")[0]}! Selamat datang ke Airi's Corner. Starter pack RM500 dan Badge [🌱 [COMMON] Warga Baru] sedia ada. Taip *.menu* untuk mula! Jangan jadi batu kayu dalam group ni ya.`,
          mentions: [cleanId]
        }).catch(() => {});
      }
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

  // --- AUTO-REPORT 12:00 MALAM ---
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
        db.users[id].stats = { works: 0, crimes: 0, bails: 0, racesWon: 0 };
      }
      saveDB(db);
    }
  }, 60 * 1000);

  // --- 11. PENGENDALI MESEJ & PERINTAH ---
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

    // KUNCI ISOWNER KEPADA NOMBOR AMAR SAHAJA
    const isOwner = cleanSender === OWNER_NUMBER;
    const activePhoneObj = PHONE_DEVICES.find(p => p.id === user.phoneDevice);

    // Sekatan Lokap
    if (now < user.cooldowns.jailUntil && cmd !== "upah_lawyer" && cmd !== "myid" && !isOwner) {
      const remMin = Math.ceil((user.cooldowns.jailUntil - now) / 60000);
      return sock.sendMessage(from, { text: `🚨 Duduk diam-diam dalam lokap tu *${remMin} minit* lagi! Buat jahat kantoi, kan dah mereput.\n\nTaip *.upah_lawyer* (RM500) kalau ada duit nak tebus bebas.` });
    }

    // --- VETO PERINTAH KHAS PENGASAS (AMAR) ---
    if (cmd === "claimfounder" || cmd === "iamowner") {
      if (!isOwner) {
        return sock.sendMessage(from, { text: `🚫 *AKSES DITOLAK!* Muka macam kau ada hati nak mengaku Pengasas? Jangan sampai aku humban dalam lokap seumur hidup!` });
      }
      user.isOwner = true;
      if (!user.badges.includes("👑 [MYTHIC] Pengasas Mutlak")) user.badges.push("👑 [MYTHIC] Pengasas Mutlak");
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `👑 *SISTEM VETO PENGASAS AKTIF:* Selamat kembali, Bos Amar! Kuasa mutlak kini beroperasi sepenuhnya.` });
    }

    if (cmd === "setmoney" && isOwner) {
      const amt = parseInt(args[0]) || 1000000;
      user.cash = amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `👑 [VETO] Petik jari terus masuk *RM ${amt.toLocaleString()}*. Kaya cara kayangan!` });
    }

    if (cmd === "resetlokap" && isOwner) {
      user.cooldowns.jailUntil = 0;
      user.stars = 0;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `👑 [VETO] Rekod polis & lokap dibersihkan serta-merta. Kebal undang-undang!` });
    }

    // VETO ADMIN : JAIL USER
    if (cmd === "jail" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const minutes = parseInt(args[1]) || 3;
      if (!targetTag) return sock.sendMessage(from, { text: `👑 [VETO] Tag mangsa yang nak dihumban ke lokap! Contoh: *.jail @user 5*` });
      
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      targetUser.cooldowns.jailUntil = Date.now() + (minutes * 60 * 1000);
      targetUser.stars = 5;
      updateUser(cleanTarget, targetUser);

      return sock.sendMessage(from, { 
        text: `🚨 *[HUKUMAN VETO PENGASAS]*\nAtas titah perintah Pengasas Amar, *${targetUser.name}* telah dihumban ke lokap selama *${minutes} minit* dan dilabel 5 bintang wanted! Mereput lah dalam tu.` 
      });
    }

    // VETO ADMIN : UNJAIL USER
    if (cmd === "unjail" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `👑 [VETO] Tag pemain yang nak diampunkan! Contoh: *.unjail @user*` });
      
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      targetUser.cooldowns.jailUntil = 0;
      targetUser.stars = 0;
      updateUser(cleanTarget, targetUser);

      return sock.sendMessage(from, { 
        text: `⚖️ *[PENGAMPUNAN VETO]*\nPengasas Amar telah memberi pengampunan khas! *${targetUser.name}* dibebaskan daripada lokap serta-merta dengan rekod suci murni.` 
      });
    }

    // VETO ADMIN : CETAK DUIT KE ORANG LAIN
    if (cmd === "vtotransfer" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt) || amt <= 0) {
        return sock.sendMessage(from, { text: `👑 [VETO] Format: *.vtotransfer @user [jumlah]*` });
      }
      
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      targetUser.cash += amt;
      updateUser(cleanTarget, targetUser);

      return sock.sendMessage(from, { 
        text: `💸 *[CETAKAN DUIT VETO]*\nPengasas Amar telah memasukkan *RM ${amt.toLocaleString()}* terus ke poket *${targetUser.name}*! Rezeki terpijak.` 
      });
    }

    // VETO ADMIN : RAMPAS DAN KOSONGKAN DUIT USER
    if (cmd === "vtoclear" && isOwner) {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `👑 [VETO] Tag sasaran yang mahu di-bankrupt-kan! Contoh: *.vtoclear @user*` });
      
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      const targetUser = getUser(cleanTarget);
      const totalTaken = targetUser.cash + targetUser.bank;
      targetUser.cash = 0;
      targetUser.bank = 0;
      updateUser(cleanTarget, targetUser);

      return sock.sendMessage(from, { 
        text: `🏴‍☠️ *[CUKAI PENGASAS / BANKRUPT]*\nPengasas Amar telah menyita dan merampas kesemua harta (RM ${totalTaken.toLocaleString()}) milik *${targetUser.name}*! Poket kini sifar merempat.` 
      });
    }

    // MENU UTAMA
    if (cmd === "menu" || cmd === "help") {
      const menu = `╭━━━ 🖥️ *AIRI'S CORNER OS* 🖥️ ━━━
┃ 🌐 *Vibe Malaysia • Cyber RPG & Roasting*
┃
┃ 📱 *[KEDAI TELEFON & GAJET]*
┃ • *.device* - Senarai 10 telefon & buff
┃ • *.beli_phone [id]* - Beli smartphone baru
┃
┃ 💼 *[SEKTOR HALAL]*
┃ • *.list_kerja [1/2]* - Senarai 50 kerja
┃ • *.pilih_kerja [id]* - Tukar kerjaya tetap
┃ • *.kerja* - Bekerja (Cooldown asing-asing!)
┃ • *.daily* - Sedekah harian (RM250)
┃ • *.showroom [1/2]* - Katalog 40 kenderaan
┃ • *.beli_kenderaan [id]* - Beli jentera litar
┃ • *.shop* - Warung makanan
┃ • *.beli_makanan [id]* & *.makan [id]*
┃
┃ 🏦 *[PERBANKAN & PVP]*
┃ • *.deposit [amt/all]* & *.withdraw [amt/all]*
┃ • *.transfer @user [amt]* - Belanja member
┃ • *.rompak @user* - Rompak poket kawan
┃ • *.lumba [id_kenderaan]* - Drag race malam
┃
┃ 🏴‍☠️ *[UNDERWORLD & BLACK MARKET]*
┃ • *.jenayah_menu* - Senarai 10 misi
┃ • *.buat_jenayah [id]* - Jalankan misi
┃ • *.blackmarket* & *.beli_device [id]*
┃
┃ 🪪 *[SISTEM & PROFIL]*
┃ • *.myid* - Kad pengenalan siber
┃ • *.profile* - Garaj, telefon & beg
┃ • *.badges* - Semak koleksi lencana
┃ • *.top* - Papan carta 5 terkaya
┃ • *.upah_lawyer* - Peguam jamin lokap (RM500)
┃ • *.tanya_mamak* - Intel & sembang Mamak
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: menu });
    }

    // KEDAI TELEFON & GAJET
    if (cmd === "device" || cmd === "phone_shop" || cmd === "kedai_phone") {
      let phoneUI = `╭━━━ 📱 *KEDAI TELEFON & GAJET TEMPATAN* ━━━\n\n`;
      PHONE_DEVICES.forEach(p => {
        phoneUI += `• *[${p.id}]* ${p.name}\n  💰 Harga: RM ${p.price.toLocaleString()}\n  ⚡ Kelebihan: _${p.bonus}_\n\n`;
      });
      phoneUI += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip *.beli_phone [id]* untuk beli. Jangan pakai fon pecah skrin tu lagi!`;
      return sock.sendMessage(from, { text: phoneUI });
    }

    if (cmd === "beli_phone" || cmd === "beli_device_phone") {
      const pId = args[0];
      const phone = PHONE_DEVICES.find(p => p.id === pId);
      if (!phone) return sock.sendMessage(from, { text: `❌ ID peranti tak wujud bro. Semak betul-betul kat *.device* tu!` });

      if (user.cash < phone.price) {
        return sock.sendMessage(from, { text: `❌ Poket kempis ada hati nak beli *${phone.name}* (Harga: RM ${phone.price.toLocaleString()}). Kumpul duit dulu bro!` });
      }

      if (user.phoneDevice === phone.id) {
        return sock.sendMessage(from, { text: `⚠️ Fon *${phone.name}* dah ada kat tangan, nak beli buat koleksi muzium ke?` });
      }

      user.cash -= phone.price;
      user.phoneDevice = phone.id;
      user.phoneName = phone.name;
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `📱 *PEMBELIAN BERJAYA!* 📱\n*${user.name}* dah upgrade gajet ke *${phone.name}*!\nBuff Aktif: _${phone.bonus}_` 
      });
    }

    // DAILY BONUS
    if (cmd === "daily") {
      if (now < user.cooldowns.daily && !isOwner) {
        const remH = Math.ceil((user.cooldowns.daily - now) / 3600000);
        return sock.sendMessage(from, { text: `⏳ Tamaknya manusia ni! Baru tuntut tadi kan? Datang balik lagi *${remH} jam* nanti.` });
      }
      user.cash += 250;
      user.cooldowns.daily = now + (24 * 3600 * 1000);
      updateUser(cleanSender, user);
      const randR = ROAST_DAILY[Math.floor(Math.random() * ROAST_DAILY.length)];
      return sock.sendMessage(from, { text: `🎁 *BANTUAN HARIAN:* +RM 250 tunai masuk poket!\n\n💬 _"${randR}"_` });
    }

    // MYID
    if (cmd === "myid" || cmd === "ic") {
      const title = getTitle(user);
      const activeJob = JOBS.find(j => j.id === user.jobId)?.name || "Pekerja Am";
      const totalWealth = user.cash + user.bank;
      const ui = `╭━━━ 🪪 *CYBER IDENTITY CARD* ━━━
┃ 👤 Nama: *${user.name}*
┃ 🎖️ Gelaran: ${title}
┃ 📱 Peranti: ${user.phoneName}
┃ 💼 Jawatan: ${activeJob} [ID ${user.jobId}]
┃ 💵 Tunai: RM ${user.cash.toLocaleString()}
┃ 🏦 Bank: RM ${user.bank.toLocaleString()}
┃ 💎 Nilai Aset: RM ${totalWealth.toLocaleString()}
┃ 🚗 Kenderaan: ${user.vehicles.length} Unit
┃ ⭐ Wanted: ${"⭐".repeat(user.stars) || "0 (Suci Murni)"}
┃ 🏅 Badges (${user.badges.length}):\n┃ ${user.badges.join("\n┃ ")}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui });
    }

    // PROFILE GARAJ & BEG
    if (cmd === "profile" || cmd === "garaj") {
      const vehicleNames = user.vehicles.length > 0 
        ? user.vehicles.map(vId => {
            const v = VEHICLES.find(item => item.id === vId);
            return v ? `• ${v.name} (${v.type}) - Top Speed: ${v.speed}km/h` : `• ${vId}`;
          }).join("\n┃ ")
        : "Garaj kosong habuk pun takde.";

      const itemNames = user.inventory.length > 0
        ? user.inventory.map(i => `• ${i.name || i.id}`).join("\n┃ ")
        : "Beg kosong takde gajet gelap.";

      const foodNames = user.food.length > 0
        ? user.food.map(fId => {
            const f = FOOD_ITEMS.find(item => item.id === fId);
            return f ? `• ${f.name}` : `• ${fId}`;
          }).join("\n┃ ")
        : "Peti makanan kosong, lapar la tu.";

      const profileUI = `╭━━━ 🎒 *GARAJ, PERANTI & INVENTORI* ━━━
┃ 👤 Pemilik: *${user.name}*
┃ 📱 Peranti Semasa: *${user.phoneName}*
┃
┃ 🏎️ *GARAJ KENDERAAN:*
┃ ${vehicleNames}
┃
┃ 🏴‍☠️ *GAJET BLACK MARKET:*
┃ ${itemNames}
┃
┃ 🍔 *BEKALAN MAKANAN:*
┃ ${foodNames}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: profileUI });
    }

    // SENARAI BADGES
    if (cmd === "badges" || cmd === "lencana") {
      return sock.sendMessage(from, { 
        text: `╭━━━ 🏅 *KOLEKSI BADGES ANDA* ━━━\n┃ Nama: *${user.name}*\n┃ Jumlah: ${user.badges.length} Lencana\n┃\n┃ ${user.badges.join("\n┃ ")}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      });
    }

    // SENARAI 50 KERJA
    if (cmd === "list_kerja" || cmd === "jobs") {
      const page = args[0] === "2" ? 2 : 1;
      const start = (page - 1) * 25;
      const end = start + 25;
      const pageJobs = JOBS.slice(start, end);

      let text = `╭━━━ 💼 *BURSA KERJAYA (PAGE ${page}/2)* ━━━\n`;
      pageJobs.forEach(j => {
        text += `• *[ID ${j.id}]* ${j.name} ➔ RM ${j.pay.toLocaleString()}\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += page === 1 ? `Taip *.list_kerja 2* untuk senarai ID 26-50.\nTaip *.pilih_kerja [id]* untuk mohon.` : `Taip *.pilih_kerja [id]* untuk mohon.`;
      return sock.sendMessage(from, { text });
    }

    // PILIH KERJA
    if (cmd === "pilih_kerja" || cmd === "setjob") {
      const jId = parseInt(args[0]);
      const targetJob = JOBS.find(j => j.id === jId);
      if (!targetJob) return sock.sendMessage(from, { text: `❌ ID kerja tak wujud bro. Check *.list_kerja* dulu jangan main hentam!` });

      user.jobId = targetJob.id;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🏢 *TAWARAN KERJA DITERIMA!* Anda kini rasmi bertugas sebagai *${targetJob.name}* (Gaji: RM ${targetJob.pay.toLocaleString()} / shift).\n\nTaip *.kerja* sekarang, jangan dok mengular pulak!` });
    }

    // KERJA
    if (cmd === "kerja" || cmd === "work") {
      const currentJob = JOBS.find(j => j.id === user.jobId) || JOBS[0];
      const jobCdKey = `job_${currentJob.id}`;
      const jobCooldown = user.cooldowns.workJobs[jobCdKey] || 0;

      let cdDuration = 2.5 * 60 * 1000;
      if (activePhoneObj?.perk === "cd") cdDuration -= activePhoneObj.val;

      if (now < jobCooldown && !isOwner) {
        const rem = Math.ceil((jobCooldown - now) / 1000);
        return sock.sendMessage(from, { text: `⚠️ Baru buat satu shift dah penat ke? Rehat *${rem} saat* lagi.\n\n💡 *Tip:* Malas tunggu? Tukar kerja lain guna *.pilih_kerja [id]* atau pekena *.makan nasilemak*!` });
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

      const d = ROAST_KERJA[Math.floor(Math.random() * ROAST_KERJA.length)];
      return sock.sendMessage(from, { text: `╭━━━ 💼 *SLIP GAJI HALAL* ━━━\n┃ Pekerja: *${user.name}*\n┃ Jawatan: ${currentJob.name} [ID ${currentJob.id}]\n┃ Gaji Diterima: +RM ${payout.toLocaleString()}\n┃ Peranti: ${user.phoneName}\n┃\n┃ _"${d}"_\n╰━━━━━━━━━━━━━━━━━` });
    }

    // BANK : DEPOSIT
    if (cmd === "deposit" || cmd === "dep") {
      const amt = args[0] === "all" ? user.cash : parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || user.cash < amt) return sock.sendMessage(from, { text: `❌ Nak simpan angin ke? Masukkan jumlah duit yang betul!` });
      user.cash -= amt; user.bank += amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🏦 Berjaya simpan *RM ${amt.toLocaleString()}* dalam bank. Selamat sikit dari kena rompak member group!` });
    }

    // BANK : WITHDRAW
    if (cmd === "withdraw" || cmd === "wd") {
      const amt = args[0] === "all" ? user.bank : parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || user.bank < amt) return sock.sendMessage(from, { text: `❌ Duit dalam bank tak cukup bro. Jangan mimpi nak keluarkan lebih!` });
      user.bank -= amt; user.cash += amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `💵 Berjaya withdraw *RM ${amt.toLocaleString()}* tunai. Hati-hati jangan sampai tercicir!` });
    }

    // TRANSFER
    if (cmd === "transfer" || cmd === "pay") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt) || amt <= 0 || user.cash < amt) return sock.sendMessage(from, { text: `❌ Format salah! Taip: *.transfer @user [jumlah]*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Nak transfer duit kat diri sendiri kenapa? Otak tertinggal ke?` });

      const targetUser = getUser(cleanTarget);
      user.cash -= amt; targetUser.cash += amt;
      updateUser(cleanSender, user); updateUser(cleanTarget, targetUser);
      return sock.sendMessage(from, { text: `💸 *PEMURAH SANGAT!* *${user.name}* memindahkan *RM ${amt.toLocaleString()}* kepada *${targetUser.name}*. Jangan lupa mintak belanja balik!` });
    }

    // ROMPAK PEMAIN (PVP)
    if (cmd === "rompak") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa yang nak dirompak! Contoh: *.rompak @user*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Merompak poket sendiri? Gila ke apa?` });

      const targetUser = getUser(cleanTarget);
      if (targetUser.cash < 100) return sock.sendMessage(from, { text: `😅 Mangsa (*${targetUser.name}*) poket kering bawah RM100. Kesian cari mangsa lain la!` });

      user.cooldowns.crime = now + (5 * 60 * 1000);
      let successRate = 0.45;
      if (activePhoneObj?.perk === "pvp") successRate += activePhoneObj.val;

      if (Math.random() < successRate) {
        const stolen = Math.floor(targetUser.cash * 0.25);
        targetUser.cash -= stolen; user.cash += stolen; user.stars = Math.min(5, user.stars + 1);
        await checkAndAwardBadges(user, sock, from);
        updateUser(cleanSender, user); updateUser(cleanTarget, targetUser);
        const rR = ROAST_ROMPAK_SUCCESS[Math.floor(Math.random() * ROAST_ROMPAK_SUCCESS.length)];
        return sock.sendMessage(from, { text: `🥷 *ROMPAKAN BERJAYA!*\n*${user.name}* merembat *RM ${stolen.toLocaleString()}* daripada poket *${targetUser.name}*!\n\n💬 _"${rR}"_` });
      } else {
        let fine = 300;
        if (activePhoneObj?.perk === "def" || activePhoneObj?.perk === "god") fine -= Math.floor(fine * activePhoneObj.val);
        user.cash = Math.max(0, user.cash - fine);
        user.cooldowns.jailUntil = now + (3 * 60 * 1000);
        updateUser(cleanSender, user);
        const rF = ROAST_ROMPAK_FAIL[Math.floor(Math.random() * ROAST_ROMPAK_FAIL.length)];
        return sock.sendMessage(from, { text: `🚨 *KANTOI MENYAMUN!*\nCubaan merompak *${targetUser.name}* gagal. Denda RM ${fine} dan meringkuk lokap 3 minit!\n\n💬 _"${rF}"_` });
      }
    }

    // LUMBA HARAM (.lumba)
    if (cmd === "lumba" || cmd === "race") {
      const vId = args[0];
      if (!vId) return sock.sendMessage(from, { text: `❌ Letak la ID jentera! Contoh: *.lumba y15* atau *.lumba myvi* (Check *.profile*).` });

      if (!user.vehicles.includes(vId)) {
        return sock.sendMessage(from, { text: `❌ Jentera tu takde dalam garaj kau. Jangan nak acah meminjam jentera jiran!` });
      }

      const vehicle = VEHICLES.find(v => v.id === vId);
      const raceCd = 3.5 * 60 * 1000;
      if (now < user.cooldowns.race && !isOwner) {
        const rem = Math.ceil((user.cooldowns.race - now) / 1000);
        return sock.sendMessage(from, { text: `🏎️ Enjin tengah panas membara tu! Tunggu *${rem} saat* lagi sebelum tayar meletup.` });
      }

      user.cooldowns.race = now + raceCd;
      let winChance = (vehicle.speed || 50) / 220;
      if (activePhoneObj?.perk === "race" || activePhoneObj?.perk === "god") winChance += activePhoneObj.val;

      const isWin = Math.random() < winChance;

      if (isWin) {
        const reward = Math.floor((vehicle.price * 0.08) + 250);
        user.cash += reward;
        user.stats.racesWon = (user.stats.racesWon || 0) + 1;
        await checkAndAwardBadges(user, sock, from);
        updateUser(cleanSender, user);
        const rW = ROAST_RACE_WIN[Math.floor(Math.random() * ROAST_RACE_WIN.length)];
        return sock.sendMessage(from, { text: `🏁 *MENANG DRAG RACE!* 🏁\nJentera *${vehicle.name}* dipandu *${user.name}* potong angin di garisan penamat!\nHadiah Tunai: *+RM ${reward.toLocaleString()}*\n\n💬 _"${rW}"_` });
      } else {
        const repairCost = Math.floor(vehicle.price * 0.02);
        user.cash = Math.max(0, user.cash - repairCost);
        updateUser(cleanSender, user);
        const rL = ROAST_RACE_LOSE[Math.floor(Math.random() * ROAST_RACE_LOSE.length)];
        return sock.sendMessage(from, { text: `💥 *TERBABAS DI SELEKOH!* Jentera *${vehicle.name}* tewas. Kos baiki: *-RM ${repairCost.toLocaleString()}*.\n\n💬 _"${rL}"_` });
      }
    }

    // SHOWROOM
    if (cmd === "showroom") {
      const page = args[0] === "2" ? 2 : 1;
      const start = (page - 1) * 20;
      const end = start + 20;
      const pageVehicles = VEHICLES.slice(start, end);

      let text = `╭━━━ 🏎️ *SHOWROOM TEMPATAN (PAGE ${page}/2)* ━━━\n`;
      pageVehicles.forEach(v => {
        text += `• *[${v.id}]* ${v.name} (${v.type})\n  💰 Harga: RM ${v.price.toLocaleString()} | ⚡ Speed: ${v.speed}km/h\n  ℹ️ _${v.desc}_\n\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += page === 1 ? `Taip *.showroom 2* untuk senarai 20 kenderaan seterusnya.\nTaip *.beli_kenderaan [id]* untuk beli.` : `Taip *.beli_kenderaan [id]* untuk beli.`;
      return sock.sendMessage(from, { text });
    }

    if (cmd === "beli_kenderaan") {
      const v = VEHICLES.find(x => x.id === args[0]);
      if (!v) return sock.sendMessage(from, { text: `❌ Jentera tidak wujud. Semak *.showroom*!` });
      if (user.cash < v.price) return sock.sendMessage(from, { text: `❌ Duit poket tak cukup nak angkat *${v.name}*! Jangan nak berangan kaya sangat.` });
      
      user.cash -= v.price; user.vehicles.push(v.id);
      await checkAndAwardBadges(user, sock, from);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎉 Tahniah *${user.name}*! Geran sah *${v.name}* kini milik anda. Bawa elok-elok jangan sampai hancur lumba nanti!` });
    }

    // WARUNG & MAKAN
    if (cmd === "shop" || cmd === "warung") {
      let text = `╭━━━ 🍔 *WARUNG MAKANAN AIRI* ━━━\n`;
      FOOD_ITEMS.forEach(f => { text += `• *[${f.id}]* ${f.name} - RM ${f.price}\n  _${f.desc}_\n\n`; });
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip *.beli_makanan [id]* & *.makan [id]*. Lapar order jangan bising!`;
      return sock.sendMessage(from, { text });
    }

    if (cmd === "beli_makanan") {
      const f = FOOD_ITEMS.find(x => x.id === args[0]);
      if (!f || user.cash < f.price) return sock.sendMessage(from, { text: `❌ Duit tak cukup nak makan atau menu tak wujud. Kesian!` });
      user.cash -= f.price; user.food.push(f.id);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🍽️ Berjaya order *${f.name}*! Simpan dalam beg dulu, lapar nanti guna *.makan*.` });
    }

    if (cmd === "makan") {
      const idx = user.food.indexOf(args[0]);
      if (idx === -1) return sock.sendMessage(from, { text: `❌ Makanan tu takde dalam beg kau. Beli dulu kat *.shop*!` });
      user.food.splice(idx, 1);
      if (args[0] === "nasilemak") {
        user.cooldowns.workJobs = {};
      }
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `😋 Kenyang sampai sendawa! Cooldown semua kerja anda diset semula serta-merta.` });
    }

    // BLACK MARKET
    if (cmd === "blackmarket" || cmd === "bm") {
      let bm = `╭━━━ 🏴‍☠️ *PASARAN GELAP (BLACK MARKET)* ━━━\n`;
      BLACKMARKET_ITEMS.forEach(i => { bm += `• *[${i.id}]* ${i.name} - RM ${i.price.toLocaleString()}\n  _${i.desc}_\n\n`; });
      return sock.sendMessage(from, { text: bm + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip *.beli_device [id]*. Berani buat berani tanggung!` });
    }

    if (cmd === "beli_device") {
      const item = BLACKMARKET_ITEMS.find(i => i.id === args[0]);
      if (!item || user.cash < item.price) return sock.sendMessage(from, { text: `❌ Gajet gelap tak wujud atau duit poket ciput!` });
      if (user.inventory.some(i => i.id === item.id)) return sock.sendMessage(from, { text: `⚠️ Gajet ni dah ada dalam beg, nak buka kedai pasar malam ke?` });
      user.cash -= item.price; user.inventory.push({ id: item.id, name: item.name });
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🛒 Perkakasan gelap *${item.name}* selamat masuk beg. Jangan sampai polis hidu!` });
    }

    // JENAYAH
    if (cmd === "jenayah_menu" || cmd === "crime_menu") {
      let text = `╭━━━ 🚨 *MISI UNDERWORLD MALAYSIA* ━━━\n`;
      CRIMES.forEach(c => {
        const reqStr = c.reqItem ? `[Syarat: ${c.reqItem}]` : `[Tiada Syarat]`;
        text += `• *[ID ${c.id}]* ${c.name}\n  Loot: RM ${c.rewardMin.toLocaleString()}-${c.rewardMax.toLocaleString()} | Denda: RM ${c.fine.toLocaleString()} ${reqStr}\n\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip *.buat_jenayah [id]*.`;
      return sock.sendMessage(from, { text });
    }

    if (cmd === "buat_jenayah" || cmd === "crime") {
      const c = CRIMES.find(x => x.id.toString() === args[0]);
      if (!c) return sock.sendMessage(from, { text: `❌ ID Misi salah bro. Semak *.jenayah_menu*!` });

      if (c.reqItem && !user.inventory.some(i => i.id === c.reqItem)) {
        return sock.sendMessage(from, { text: `❌ Misi ni perlukan gajet *[${c.reqItem}]* dari *.blackmarket*!` });
      }

      user.cooldowns.crime = now + (4 * 60 * 1000);
      let crimeRate = 0.5;
      if (activePhoneObj?.perk === "crime" || activePhoneObj?.perk === "god") crimeRate += activePhoneObj.val;

      if (Math.random() < crimeRate || isOwner) {
        const reward = Math.floor(Math.random() * (c.rewardMax - c.rewardMin + 1)) + c.rewardMin;
        user.cash += reward; user.stats.crimes += 1; user.stars = Math.min(5, user.stars + c.stars);
        await checkAndAwardBadges(user, sock, from);
        updateUser(cleanSender, user);
        const randD = ROAST_CRIME_SUCCESS[Math.floor(Math.random() * ROAST_CRIME_SUCCESS.length)];
        return sock.sendMessage(from, { text: `╭━━━ 🦹 *UNDERWORLD : BERJAYA* ━━━\n┃ Pelaku: *${user.name}*\n┃ Loot: +RM ${reward.toLocaleString()}\n┃ Wanted: ${"⭐".repeat(user.stars)}\n┃\n┃ _"${randD}"_\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
      } else {
        let fine = c.fine;
        if (activePhoneObj?.perk === "def" || activePhoneObj?.perk === "god") fine -= Math.floor(fine * activePhoneObj.val);
        user.cash = Math.max(0, user.cash - fine);
        user.cooldowns.jailUntil = now + (3 * 60 * 1000);
        updateUser(cleanSender, user);
        const randF = ROAST_CRIME_FAIL[Math.floor(Math.random() * ROAST_CRIME_FAIL.length)];
        return sock.sendMessage(from, { text: `🚨 *KANTOI DENGAN POLIS!* Misi gagal. Denda RM ${fine.toLocaleString()} dan dihumban ke lokap 3 minit!\n\n💬 _"${randF}"_\n\nTaip *.upah_lawyer* (RM500) kalau nak bebas cepat.` });
      }
    }

    // UPAH LAWYER PRO
    if (cmd === "upah_lawyer") {
      if (now >= user.cooldowns.jailUntil && !isOwner) return sock.sendMessage(from, { text: `ℹ️ Kau kat luar balai la bro. Tak payah nak buang duit upah peguam!` });
      if (user.cash < 500 && !isOwner) return sock.sendMessage(from, { text: `❌ Peguam pro tak layan orang poket kering! Sediakan RM 500 tunai dulu.` });
      if (!isOwner) user.cash -= 500;
      user.cooldowns.jailUntil = 0; user.stars = Math.max(0, user.stars - 1);
      user.stats.bails = (user.stats.bails || 0) + 1;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `⚖️ Peguam pro dah selesaikan ikat jamin untuk *${user.name}*! Lain kali buat kerja biar kemas jangan menyusahkan mahkamah.` });
    }

    // NPC MAMAK INTEL
    if (cmd === "tanya_mamak" || cmd === "mamak") {
      const tip = ROAST_MAMAK[Math.floor(Math.random() * ROAST_MAMAK.length)];
      return sock.sendMessage(from, { text: `👨‍🍳 *Mamak Bistro Intel:*\n\n_"${tip}"_` });
    }

    // LEADERBOARD
    if (cmd === "top" || cmd === "leaderboard") {
      const db = loadDB();
      const top = Object.entries(db.users || {}).map(([id, d]) => ({ name: d.name || id.split("@")[0], total: (d.cash || 0) + (d.bank || 0) })).sort((a,b) => b.total - a.total).slice(0, 5);
      let t = `╭━━━ 🏆 *LEADERBOARD TERKAYA* ━━━\n`;
      top.forEach((u, i) => { t += `${i+1}. *${u.name}* - RM ${u.total.toLocaleString()}\n`; });
      t += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nYang tak tersenarai tu jangan malas, pergi kerja!`;
      return sock.sendMessage(from, { text: t });
    }

  });
}

startBotEngine();
