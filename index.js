import makeWASocket, { useMultiFileAuthState, Browsers } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import http from "http";
import QRCode from "qrcode";
import { createCanvas } from "canvas";
import dotenv from "dotenv";
dotenv.config();

let currentQR = "";
let isConnected = false;

// --- 1. PELAYAN WEB UNTUK PAPARAN QR CODE DI BROWSER RENDER ---
const PORT = process.env.PORT || 3000;
http.createServer(async (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  if (isConnected) {
    res.end(`
      <div style="text-align:center;margin-top:50px;font-family:Arial,sans-serif;">
        <h1 style="color:#00e676;">✅ AIRI'S CORNER BOT ONLINE!</h1>
        <p style="font-size:18px;">Sistem WhatsApp aktif 24/7. Sedia menerima arahan!</p>
      </div>
    `);
  } else if (currentQR) {
    try {
      const qrImage = await QRCode.toDataURL(currentQR);
      res.end(`
        <div style="text-align:center;margin-top:30px;font-family:Arial,sans-serif;background:#0d1117;color:#fff;padding:20px;min-height:90vh;">
          <h1 style="color:#00ffff;letter-spacing:2px;">⚡ AIRI'S CORNER : CYBER GRID ⚡</h1>
          <p style="color:#aaa;">Buka WhatsApp > Linked Devices > Link a Device, dan imbas QR code di bawah:</p>
          <div style="margin:20px auto;display:inline-block;padding:15px;background:#fff;border-radius:12px;box-shadow:0 0 20px rgba(0,255,255,0.5);">
            <img src="${qrImage}" style="width:280px;height:280px;display:block;"/>
          </div>
          <p style="color:#888;font-size:13px;">Refresh page sekiranya kod QR tamat tempoh.</p>
        </div>
      `);
    } catch (err) {
      res.end("Ralat memaparkan QR: " + err.message);
    }
  } else {
    res.end(`
      <div style="text-align:center;margin-top:50px;font-family:Arial,sans-serif;">
        <h2>⚡ Menjana Kod QR Airi's Corner...</h2>
        <p>Sila tunggu sebentar dan muat semula (refresh) halaman ini.</p>
      </div>
    `);
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

function getUser(userId) {
  const db = loadDB();
  if (!db.users[userId]) {
    db.users[userId] = {
      cash: 500,
      bank: 0,
      jobId: null,
      inventory: [],
      vehicles: [],
      food: [],
      stars: 0,
      badges: ["🌱 Warga Baru"],
      stats: { works: 0, crimes: 0, bails: 0, racesWon: 0 },
      cooldowns: { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0 }
    };
    saveDB(db);
  }
  const u = db.users[userId];
  if (!u.stats) u.stats = { works: 0, crimes: 0, bails: 0, racesWon: 0 };
  if (!u.badges) u.badges = ["🌱 Warga Baru"];
  if (!u.food) u.food = [];
  if (!u.vehicles) u.vehicles = [];
  if (!u.inventory) u.inventory = [];
  if (!u.cooldowns) u.cooldowns = { work: 0, crime: 0, jailUntil: 0, daily: 0, race: 0 };
  return u;
}

function updateUser(userId, userData) {
  const db = loadDB();
  db.users[userId] = userData;
  saveDB(db);
}

// --- 3. JANA IMEJ BADGE BERNOMBOR USER (CANVAS) ---
async function generateBadge(badgeName, userPhone) {
  const width = 600;
  const height = 320;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background Cyber Dark
  ctx.fillStyle = "#0a0d14";
  ctx.fillRect(0, 0, width, height);

  // Border Neon Cyan & Glow Effect
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Header
  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⚡ AIRI'S CORNER : OFFICIAL BADGE ⚡", width / 2, 60);

  // Garisan Pemisah Neon
  ctx.beginPath();
  ctx.moveTo(50, 75);
  ctx.lineTo(550, 75);
  ctx.strokeStyle = "#00e676";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Nama Badge (Emas)
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText(badgeName.toUpperCase(), width / 2, 140);

  // Penerima / Nombor Telefon User
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px sans-serif";
  ctx.fillText("DIANUGERAHKAN KEPADA:", width / 2, 195);

  ctx.fillStyle = "#00e676";
  ctx.font = "bold 24px monospace";
  ctx.fillText(`+${userPhone}`, width / 2, 235);

  // Serial Verification Footer
  ctx.fillStyle = "#666666";
  ctx.font = "13px monospace";
  ctx.fillText(`VERIFIED ID: 0x${Math.floor(Math.random() * 899999 + 100000)} • SYSTEM VERIFIED`, width / 2, 285);

  return canvas.toBuffer("image/png");
}

// --- 4. 50 KERJA HALAL ---
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
  { id: 37, name: "Tukang Jahit", pay: 200 }, { id: 38, name: "Pembina Laman Web", pay: 800 }, { id: 39, name: "Ejen Insurans", pay: 350 },
  { id: 40, name: "Pengurus Bank", pay: 1000 }, { id: 41, name: "Cef Eksekutif", pay: 1100 }, { id: 42, name: "Jurugambar", pay: 400 },
  { id: 43, name: "Juruaudit", pay: 750 }, { id: 44, name: "Kontraktor", pay: 900 }, { id: 45, name: "Ahli Farmasi", pay: 850 },
  { id: 46, name: "Psikologis", pay: 950 }, { id: 47, name: "Penganalisis Cyber", pay: 1200 }, { id: 48, name: "Pakar Ekonomi", pay: 1400 },
  { id: 49, name: "Pelabur", pay: 2000 }, { id: 50, name: "CEO Korporat", pay: 2500 }
];

// --- 5. 40 KENDERAAN SHOWROOM ---
const VEHICLES = [
  // 20 MOTOR
  { id: "ex5", name: "Honda EX5 High Power", price: 3000, type: "Motor", speed: 50 },
  { id: "wave125", name: "Honda Wave 125i", price: 5500, type: "Motor", speed: 55 },
  { id: "lagenda", name: "Yamaha Lagenda 115Z", price: 6000, type: "Motor", speed: 58 },
  { id: "lc135", name: "Yamaha LC135 V8", price: 7500, type: "Motor", speed: 65 },
  { id: "y15", name: "Yamaha Y15ZR (Ysuku)", price: 10000, type: "Motor", speed: 72 },
  { id: "rs150", name: "Honda RS150R V2", price: 10500, type: "Motor", speed: 73 },
  { id: "nvx", name: "Yamaha NVX 155 ABS", price: 12000, type: "Motor", speed: 75 },
  { id: "nmax", name: "Yamaha NMAX 155", price: 13000, type: "Motor", speed: 74 },
  { id: "r15", name: "Yamaha YZF-R15M", price: 14000, type: "Motor", speed: 78 },
  { id: "cbr150", name: "Honda CBR150R", price: 14500, type: "Motor", speed: 79 },
  { id: "adv160", name: "Honda ADV 160", price: 15000, type: "Motor", speed: 76 },
  { id: "z250", name: "Kawasaki Z250", price: 21000, type: "Motor", speed: 85 },
  { id: "ninja250", name: "Kawasaki Ninja 250", price: 22000, type: "Motor", speed: 88 },
  { id: "mt07", name: "Yamaha MT-07", price: 40000, type: "Motor", speed: 105 },
  { id: "z800", name: "Kawasaki Z800 Monster", price: 48000, type: "Motor", speed: 115 },
  { id: "r6", name: "Yamaha YZF-R6 Scream", price: 85000, type: "Motor", speed: 135 },
  { id: "zx6r", name: "Kawasaki ZX-6R Ninja", price: 90000, type: "Motor", speed: 140 },
  { id: "s1000rr", name: "BMW S1000RR M-Package", price: 175000, type: "Motor", speed: 165 },
  { id: "panigale", name: "Ducati Panigale V4S", price: 180000, type: "Motor", speed: 170 },
  { id: "h2", name: "Kawasaki Ninja H2 Supercharged", price: 250000, type: "Motor", speed: 190 },
  // 20 KERETA
  { id: "kancil", name: "Perodua Kancil Turbo", price: 5000, type: "Kereta", speed: 45 },
  { id: "iswara", name: "Proton Iswara Aeroback", price: 8000, type: "Kereta", speed: 50 },
  { id: "saga", name: "Proton Saga BLM", price: 12000, type: "Kereta", speed: 55 },
  { id: "wira", name: "Proton Wira 1.5 GLi", price: 15000, type: "Kereta", speed: 60 },
  { id: "preve", name: "Proton Preve CFE Turbo", price: 40000, type: "Kereta", speed: 75 },
  { id: "persona", name: "Proton Persona Premium", price: 45000, type: "Kereta", speed: 70 },
  { id: "myvi", name: "Perodua Myvi King 1.5", price: 50000, type: "Kereta", speed: 82 },
  { id: "x50", name: "Proton X50 TGDi Flagship", price: 90000, type: "Kereta", speed: 95 },
  { id: "vios", name: "Toyota Vios GR-Sport", price: 95000, type: "Kereta", speed: 85 },
  { id: "x70", name: "Proton X70 Premium", price: 120000, type: "Kereta", speed: 100 },
  { id: "civic", name: "Honda Civic FC Ketam", price: 130000, type: "Kereta", speed: 110 },
  { id: "accord", name: "Honda Accord Turbo", price: 180000, type: "Kereta", speed: 120 },
  { id: "alphard", name: "Toyota Alphard Executive", price: 350000, type: "Kereta", speed: 95 },
  { id: "mustang", name: "Ford Mustang 5.0 V8 GT", price: 550000, type: "Kereta", speed: 145 },
  { id: "gtr", name: "Nissan GT-R R35 Nismo", price: 650000, type: "Kereta", speed: 165 },
  { id: "m4", name: "BMW M4 Competition G82", price: 750000, type: "Kereta", speed: 170 },
  { id: "c63", name: "Mercedes-AMG C63s V8", price: 780000, type: "Kereta", speed: 172 },
  { id: "ferrari", name: "Ferrari 488 Pista", price: 1500000, type: "Kereta", speed: 185 },
  { id: "lambo", name: "Lamborghini Huracan EVO", price: 1600000, type: "Kereta", speed: 190 },
  { id: "911", name: "Porsche 911 GT3 RS", price: 1800000, type: "Kereta", speed: 195 }
];

// --- 6. WARUNG MAKANAN ---
const FOOD_ITEMS = [
  { id: "tehtarik", name: "Teh Tarik Kaw", price: 4, desc: "Potong 1 minit cooldown kerja!" },
  { id: "roticanai", name: "Roti Canai Banjir", price: 7, desc: "Potong 2 minit cooldown kerja!" },
  { id: "nasilemak", name: "Nasi Lemak Sambal Sotong", price: 12, desc: "Reset terus cooldown kerja!" },
  { id: "burger", name: "Burger Ramly Special", price: 15, desc: "Pulihkan tenaga & kurangkan denda!" }
];

// --- 7. GAJET BLACK MARKET ---
const BLACKMARKET_ITEMS = [
  { id: "skimmer", name: "Alat Skimming ATM", price: 20000, desc: "Curi data kad ATM lorong gelap" },
  { id: "decrypter", name: "Flash-Drive Decrypter", price: 50000, desc: "Pintas firewall keselamatan bank" },
  { id: "jammer", name: "EMP Radio Jammer", price: 100000, desc: "Kacau frekuensi radio peronda polis" },
  { id: "keycard", name: "Kad Akses VIP Kasino", price: 250000, desc: "Akses pintu bilik kebal underground" },
  { id: "flipper", name: "Flipper Zero Modded", price: 500000, desc: "Godam pangkalan data induk pusat bandar" }
];

// --- 8. 10 MISI JENAYAH ---
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

// --- 9. DIALOG SEMPOI ---
const DIALOG_KERJA = [
  "Wah berpeluh dahi kau grind rezeki halal hari ni! Gaji dah masuk, steady bro.",
  "Macam ni lah kita nak, titik peluh sendiri baru berkat. Simpan sikit dalam bank!",
  "Fuh rajin betul! Kalau konsisten macam ni, hujung bulan boleh beli Ysuku cash.",
  "Bagus bos! Rezeki halal bawa tenang, teruskan usaha jangan putus asa.",
  "Gaji settle masuk poket! Boleh la singgah warung pekena Nasi Lemak jap lagi."
];

const DIALOG_CRIME_SUCCESS = [
  "Licik gila taktik kau! Polis peronda pun terpinga-pinga cari tak jumpa.",
  "Operasi underground settle bersih tanpa tinggal sebarang cap jari! Duit haram dah masuk poket.",
  "Fuh selamat! Jantung berdegup kencang tapi hasil memang padu!",
  "Masterclass! Senyap-senyap buat kerja terus kaut keuntungan besar.",
  "Misi selesai! Hati-hati jangan pamer sangat duit tu, kang polis hidu."
];

const DIALOG_MAMAK = [
  "Boss! Mai duduk pekena teh tarik gelas besar dulu. Mamak nak bisik, malam ni polis buat sekatan jalan raya, bawa bertenang!",
  "Eh bossku! Mamak dengar cerita sindiket Darkweb tengah cari hacker padu. Siapa ada Flipper Zero boleh la test.",
  "Duduk dulu boss! Rezeki halal biar lambat asal selamat, jangan lupa simpan dalam bank.",
  "Aney habaq mai, mesin ATM lorong belakang tu sistem tengah slow malam ni, senang kalau ada alat skimmer.",
  "Rilek boss, minum dulu on the house! Kalau masuk lokap peguam cas RM500, simpan cash sikit!"
];

function getTitle(user) {
  const totalMoney = user.cash + user.bank;
  if (user.stars >= 4) return "🏴‍☠️ Kingpin / Mafia Underworld";
  if (user.stars >= 2) return "🥷 Penjenayah Dikehendaki";
  if (totalMoney >= 1000000) return "👑 CEO Korporat / Jutawan";
  if (totalMoney >= 200000) return "💼 Pengurus Eksekutif";
  if (totalMoney >= 50000) return "⭐ Pekerja Teladan";
  return "🌱 Pekerja Am / Orang Awam";
}

// --- 10. SEMAK DAN ANUGERAHKAN BADGE DENGAN IMEJ ---
async function checkAndAwardBadges(user, sock, from, cleanSender) {
  const newBadges = [];
  const totalMoney = user.cash + user.bank;
  const userPhone = cleanSender.split("@")[0];

  if (user.stats.works >= 5 && !user.badges.includes("🔨 Buruh Gigih")) {
    user.badges.push("🔨 Buruh Gigih");
    newBadges.push("🔨 Buruh Gigih");
  }
  if (user.stats.works >= 25 && !user.badges.includes("🏆 Raja Halal")) {
    user.badges.push("🏆 Raja Halal");
    newBadges.push("🏆 Raja Halal");
  }
  if (user.stats.crimes >= 5 && !user.badges.includes("🕶️ Buronan Jalanan")) {
    user.badges.push("🕶️ Buronan Jalanan");
    newBadges.push("🕶️ Buronan Jalanan");
  }
  if (user.stats.crimes >= 20 && !user.badges.includes("💀 Legend Underworld")) {
    user.badges.push("💀 Legend Underworld");
    newBadges.push("💀 Legend Underworld");
  }
  if (totalMoney >= 100000 && !user.badges.includes("💰 Bangsawan Cyber")) {
    user.badges.push("💰 Bangsawan Cyber");
    newBadges.push("💰 Bangsawan Cyber");
  }
  if (user.vehicles.length >= 3 && !user.badges.includes("🏎️ Kaki Koleksi")) {
    user.badges.push("🏎️ Kaki Koleksi");
    newBadges.push("🏎️ Kaki Koleksi");
  }
  if ((user.stats.racesWon || 0) >= 5 && !user.badges.includes("⚡ Raja Rempit")) {
    user.badges.push("⚡ Raja Rempit");
    newBadges.push("⚡ Raja Rempit");
  }

  for (const bName of newBadges) {
    try {
      const imgBuffer = await generateBadge(bName, userPhone);
      await sock.sendMessage(from, {
        image: imgBuffer,
        caption: `╭━━━ 🎖️ *PENSIJILAN LENCANA RASMI* ━━━\n┃ 👤 Pemilik: @${userPhone}\n┃ 🏅 Lencana: *${bName}*\n┃ 🏛️ Pengeluar: *Airi's Corner Grid*\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        mentions: [cleanSender]
      });
    } catch (err) {
      console.log("Ralat menjana imej badge:", err);
    }
  }

  return newBadges;
}

// --- 11. ENGINE UTAMA BAILEYS & EVENT HANDLERS ---
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
      console.log("⚡ [AIRI BOT] QR Code baharu sedia untuk diimbas di pelayar!");
    }
    if (connection === "close") {
      isConnected = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
      console.log("⚠️ Sambungan terputus. Menyambung semula...", shouldReconnect);
      if (shouldReconnect) startBotEngine();
    } else if (connection === "open") {
      isConnected = true;
      currentQR = "";
      console.log("✅ AIRI'S CORNER BOT BERJAYA BERSAMBUNG KE WHATSAPP!");
    }
  });

  // Sambut Newbie Baru Masuk
  sock.ev.on("group-participants.update", async (anu) => {
    try {
      const { id, participants, action } = anu;
      if (action === "add") {
        for (const num of participants) {
          const cleanId = num.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
          getUser(cleanId);

          const welcomeMsg = `╭━━━ ⚡ *AIRI'S CORNER : CYBER GRID* ⚡ ━━━
┃ 🌐 *STATUS:* CHANNEL SECURE CONNECTED
┃ 👤 *TARGET:* @${num.split("@")[0]}
┃
┃ 🎉 *SELAMAT DATANG KE AIRI'S CORNER!* 🚀
┃ Starter pack *RM 500* dan Badge *[🌱 Warga Baru]* siap masuk akaun!
┃
┃ 📌 Taip \`.myid\` untuk tengok kad pengenalan maya.
┃ 📌 Taip \`.menu\` untuk senarai penuh arahan.
┃ 📌 Taip \`.daily\` untuk tuntut bantuan harian percuma.
┃
┃ _"Bina legasi korporat atau takluk takhta underworld!"_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
          await sock.sendMessage(id, { text: welcomeMsg, mentions: [num] });
        }
      }
    } catch (err) {
      console.log("Error welcome message:", err);
    }
  });

  // Simpan ID Group
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;
    const from = m.key.remoteJid;
    if (from.endsWith("@g.us")) {
      const db = loadDB();
      if (!db.groups) db.groups = [];
      if (!db.groups.includes(from)) {
        db.groups.push(from);
        saveDB(db);
      }
    }
  });

  // Auto-Report 12:00 Tengah Malam
  let lastResetDate = new Date().getDate();
  setInterval(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDate();

    if (currentHour === 0 && currentDay !== lastResetDate) {
      lastResetDate = currentDay;
      const db = loadDB();
      const usersObj = db.users || {};

      const usersArr = Object.entries(usersObj).map(([id, data]) => ({
        id,
        works: data.stats?.works || 0,
        crimes: data.stats?.crimes || 0,
        cash: (data.cash || 0) + (data.bank || 0)
      }));

      if (usersArr.length > 0) {
        const topWorker = [...usersArr].sort((a, b) => b.works - a.works)[0];
        const topCriminal = [...usersArr].sort((a, b) => b.crimes - a.crimes)[0];
        const topRich = [...usersArr].sort((a, b) => b.cash - a.cash)[0];

        const reportUI = `╭━━━ 🌙 *LAPORAN RASMI TENGAH MALAM* 🌙 ━━━
┃ Jam 12:00 Malam! Rekod kegigihan warga Airi's Corner hari ini:
┃
┃ 🏆 *RAJA KERJA HALAL:*
┃ 👤 @${topWorker.id.split("@")[0]} (${topWorker.works} shift diselesaikan!)
┃
┃ 🏴‍☠️ *PENJENAYAH PALING DIKEHENDAKI:*
┃ 👤 @${topCriminal.id.split("@")[0]} (${topCriminal.crimes} operasi dijalankan!)
┃
┃ 💰 *JUTAWAN HARIAN TERKAYA:*
┃ 👤 @${topRich.id.split("@")[0]} (Jumlah Aset: RM ${topRich.cash.toLocaleString()})
┃
┃ ✨ _Statistik harian telah diset semula. Selamat menggrind untuk hari esok!_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        const groups = db.groups || [];
        const mentionsArr = [topWorker.id, topCriminal.id, topRich.id].filter(Boolean);
        for (const gId of groups) {
          try {
            await sock.sendMessage(gId, { text: reportUI, mentions: mentionsArr });
          } catch (e) {
            console.log("Gagal hantar auto report:", e);
          }
        }
      }

      for (let id in db.users) {
        db.users[id].stats = { works: 0, crimes: 0, bails: 0, racesWon: db.users[id].stats?.racesWon || 0 };
      }
      saveDB(db);
    }
  }, 60 * 1000);

  // --- 12. PENGENDALI ARAHAN MESEJ ---
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;
    const from = m.key.remoteJid;
    const msgType = Object.keys(m.message)[0];
    const text = (msgType === "conversation") ? m.message.conversation :
                 (msgType === "extendedTextMessage") ? m.message.extendedTextMessage.text : "";

    if (!text.startsWith(".")) return;
    const args = text.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const sender = m.key.participant || from;
    const cleanSender = sender.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    const user = getUser(cleanSender);
    const now = Date.now();

    if (now < user.cooldowns.jailUntil && cmd !== "upah_lawyer" && cmd !== "myid") {
      const remMin = Math.ceil((user.cooldowns.jailUntil - now) / 60000);
      return sock.sendMessage(from, { 
        text: `🚨 [DALAM LOKAP POLIS] Anda sedang ditahan di lokap balai!\nBaki tahanan: *${remMin} minit*.\n\nTaip \`.upah_lawyer\` (RM 500) untuk jamin keluar serta-merta.`, 
        mentions: [cleanSender] 
      });
    }

    // --- MENU UTAMA ---
    if (cmd === "menu" || cmd === "help") {
      const menuText = `╭━━━ 🖥️ *AIRI'S CORNER OS* 🖥️ ━━━
┃ 🌐 *Vibe Malaysia • Cyber RPG*
┃
┃ 💼 *[SEKTOR HALAL]*
┃ • \`.kerja\` - Lakukan kerja halal (1-50)
┃ • \`.daily\` - Tuntut gaji percuma 24 jam
┃ • \`.showroom\` - Katalog 40 kenderaan
┃ • \`.beli_kenderaan [id]\` - Beli jentera
┃ • \`.shop\` - Warung makanan
┃ • \`.beli_makanan [id]\` - Pesan makanan
┃ • \`.makan [id]\` - Nikmati makanan
┃
┃ 🏦 *[PERBANKAN & PVP]*
┃ • \`.deposit [jumlah/all]\` - Simpan tunai
┃ • \`.withdraw [jumlah/all]\` - Keluarkan tunai
┃ • \`.transfer @user [jumlah]\` - Pindah wang
┃ • \`.rompak @user\` - Rompak poket kawan
┃ • \`.lumba [id_kenderaan]\` - Drag race malam
┃
┃ 🏴‍☠️ *[UNDERWORLD & PASARAN GELAP]*
┃ • \`.jenayah_menu\` - Senarai 10 misi
┃ • \`.buat_jenayah [id]\` - Jalankan misi
┃ • \`.blackmarket\` - Pasaran gajet gelap
┃ • \`.beli_device [id]\` - Beli peralatan godam
┃
┃ 🪪 *[SISTEM & PROFIL]*
┃ • \`.myid\` - Kad pengenalan siber
┃ • \`.profile\` - Garaj & beg inventori penuh
┃ • \`.badges\` - Semak koleksi lencana
┃ • \`.top\` - Papan carta 5 terkaya
┃ • \`.upah_lawyer\` - Peguam jamin lokap (RM500)
┃ • \`.tanya_mamak\` - Intel & petua Mamak
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: menuText });
    }

    // --- GAJI HARIAN FREE (.daily) ---
    if (cmd === "daily") {
      const dailyCd = 24 * 60 * 60 * 1000;
      if (now < user.cooldowns.daily) {
        const remHours = Math.ceil((user.cooldowns.daily - now) / 3600000);
        return sock.sendMessage(from, { text: `⏳ Bantuan harian sudah dituntut! Sila kembali semula dalam *${remHours} jam* lagi.`, mentions: [cleanSender] });
      }

      const dailyBonus = 250;
      user.cash += dailyBonus;
      user.cooldowns.daily = now + dailyCd;
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { text: `🎁 *BANTUAN HARIAN AIRI:* Anda menerima elaun *+RM ${dailyBonus}* tunai!`, mentions: [cleanSender] });
    }

    // --- CYBER ID CARD ---
    if (cmd === "myid" || cmd === "ic") {
      const title = getTitle(user);
      const activeJobName = user.jobId ? JOBS.find(j => j.id === user.jobId)?.name || "Freelancer" : "Belum Ada Pekerjaan";
      const totalWealth = user.cash + user.bank;

      const myIdUI = `╭━━━ 🪪 *KAD PENGENALAN SIBER* ━━━
┃ 👤 *Nama:* @${cleanSender.split("@")[0]}
┃ 🎖️ *Pangkat:* ${title}
┃ 💼 *Jawatan:* ${activeJobName}
┃ 💵 *Tunai:* RM ${user.cash.toLocaleString()}
┃ 🏦 *Bank:* RM ${user.bank.toLocaleString()}
┃ 💎 *Nilai Aset:* RM ${totalWealth.toLocaleString()}
┃ 🚗 *Kenderaan:* ${user.vehicles.length} Unit
┃ 🍔 *Peti Makanan:* ${user.food.length} Item
┃ ⭐ *Wanted Polis:* ${"⭐".repeat(user.stars) || "0 (Bersih)"}
┃ 🏅 *Badges:* ${user.badges.join(" | ")}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: myIdUI, mentions: [cleanSender] });
    }

    // --- PROFILE LENGKAP (GARAJ & BEG) ---
    if (cmd === "profile" || cmd === "garaj") {
      const vehicleNames = user.vehicles.length > 0 
        ? user.vehicles.map(vId => {
            const v = VEHICLES.find(item => item.id === vId);
            return v ? `• ${v.name} (${v.type})` : `• ${vId}`;
          }).join("\n┃ ")
        : "Tiada kenderaan dalam garaj.";

      const itemNames = user.inventory.length > 0
        ? user.inventory.map(i => `• ${i.name || i.id}`).join("\n┃ ")
        : "Beg inventori kosong.";

      const foodNames = user.food.length > 0
        ? user.food.map(fId => {
            const f = FOOD_ITEMS.find(item => item.id === fId);
            return f ? `• ${f.name}` : `• ${fId}`;
          }).join("\n┃ ")
        : "Peti makanan kosong.";

      const profileUI = `╭━━━ 🎒 *GARAJ & BEG INVENTORI* ━━━
┃ 👤 Pemilik: @${cleanSender.split("@")[0]}
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
      return sock.sendMessage(from, { text: profileUI, mentions: [cleanSender] });
    }

    // --- SENARAI BADGES ---
    if (cmd === "badges" || cmd === "lencana") {
      return sock.sendMessage(from, { 
        text: `╭━━━ 🏅 *KOLEKSI BADGES ANDA* ━━━\n┃ User: @${cleanSender.split("@")[0]}\n┃\n┃ ${user.badges.map(b => `• ${b}`).join("\n┃ ")}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 
        mentions: [cleanSender] 
      });
    }

    // --- BANK : DEPOSIT ---
    if (cmd === "deposit" || cmd === "dep") {
      const amount = args[0] === "all" ? user.cash : parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return sock.sendMessage(from, { text: `❌ Sila masukkan jumlah deposit yang sah atau taip \`.deposit all\`.` });
      if (user.cash < amount) return sock.sendMessage(from, { text: `❌ Baki tunai anda tidak mencukupi untuk deposit RM ${amount.toLocaleString()}.` });

      user.cash -= amount;
      user.bank += amount;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🏦 Berjaya simpan *RM ${amount.toLocaleString()}* ke dalam akaun bank Airi CyberBank.`, mentions: [cleanSender] });
    }

    // --- BANK : WITHDRAW ---
    if (cmd === "withdraw" || cmd === "wd") {
      const amount = args[0] === "all" ? user.bank : parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return sock.sendMessage(from, { text: `❌ Sila masukkan jumlah pengeluaran yang sah atau taip \`.withdraw all\`.` });
      if (user.bank < amount) return sock.sendMessage(from, { text: `❌ Baki bank anda tidak mencukupi untuk keluarkan RM ${amount.toLocaleString()}.` });

      user.bank -= amount;
      user.cash += amount;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `💵 Berjaya keluarkan *RM ${amount.toLocaleString()}* tunai dari mesin ATM.`, mentions: [cleanSender] });
    }

    // --- TRANSFER DUIT ---
    if (cmd === "transfer" || cmd === "pay") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amount = parseInt(args[1]);
      if (!targetTag || isNaN(amount) || amount <= 0) {
        return sock.sendMessage(from, { text: `❌ Format salah! Taip: \`.transfer @user [jumlah]\`` });
      }
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Anda tidak boleh transfer duit kepada diri sendiri bro.` });

      if (user.cash < amount) return sock.sendMessage(from, { text: `❌ Tunai di tangan tidak cukup untuk transfer RM ${amount.toLocaleString()}.` });

      const targetUser = getUser(cleanTarget);
      user.cash -= amount;
      targetUser.cash += amount;

      updateUser(cleanSender, user);
      updateUser(cleanTarget, targetUser);

      return sock.sendMessage(from, { 
        text: `💸 Transaksi Berjaya!\n@${cleanSender.split("@")[0]} memindahkan *RM ${amount.toLocaleString()}* kepada @${cleanTarget.split("@")[0]}!`, 
        mentions: [cleanSender, cleanTarget] 
      });
    }

    // --- ROMPAK PEMAIN (PVP) ---
    if (cmd === "rompak") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa yang mahu dirompak! Contoh: \`.rompak @user\`` });
      
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Nak rompak poket sendiri ke tu?` });

      const targetUser = getUser(cleanTarget);
      if (targetUser.cash < 100) {
        return sock.sendMessage(from, { text: `😅 Mangsa tiada tunai di tangan (poket kering bawah RM100). Cari sasaran lain!` });
      }

      const cd = 8 * 60 * 1000;
      if (now < user.cooldowns.crime) {
        const rem = Math.ceil((user.cooldowns.crime - now) / 1000);
        return sock.sendMessage(from, { text: `🚨 Polis sedang pantau kawasan! Tunggu *${rem} saat* lagi.` });
      }

      user.cooldowns.crime = now + cd;
      const isSuccess = Math.random() < 0.45;

      if (isSuccess) {
        const stolen = Math.floor(targetUser.cash * 0.25);
        targetUser.cash -= stolen;
        user.cash += stolen;
        user.stars = Math.min(5, user.stars + 1);

        await checkAndAwardBadges(user, sock, from, cleanSender);
        updateUser(cleanSender, user);
        updateUser(cleanTarget, targetUser);

        return sock.sendMessage(from, { 
          text: `🥷 *ROMPAKAN BERJAYA!*\n@${cleanSender.split("@")[0]} berjaya merembat *RM ${stolen.toLocaleString()}* dari poket @${cleanTarget.split("@")[0]}!`, 
          mentions: [cleanSender, cleanTarget] 
        });
      } else {
        const fine = 300;
        user.cash = Math.max(0, user.cash - fine);
        user.stars = Math.min(5, user.stars + 1);
        user.cooldowns.jailUntil = now + (3 * 60 * 1000);

        updateUser(cleanSender, user);

        return sock.sendMessage(from, { 
          text: `🚨 *KANTOI!* Cubaan @${cleanSender.split("@")[0]} menyamun @${cleanTarget.split("@")[0]} digagalkan polis! Denda *RM ${fine}* dan dihumban ke lokap 3 minit.`, 
          mentions: [cleanSender, cleanTarget] 
        });
      }
    }

    // --- LUMBA HARAM (.lumba) ---
    if (cmd === "lumba" || cmd === "race") {
      const vId = args[0];
      if (!vId) return sock.sendMessage(from, { text: `❌ Taip \`.lumba [id_kenderaan]\` (Contoh: \`.lumba y15\` atau \`.lumba myvi\`)` });

      if (!user.vehicles.includes(vId)) {
        return sock.sendMessage(from, { text: `❌ Anda tidak memiliki kenderaan tersebut di garaj. Semak \`.profile\`.` });
      }

      const vehicle = VEHICLES.find(v => v.id === vId);
      const raceCd = 5 * 60 * 1000;
      if (now < user.cooldowns.race) {
        const rem = Math.ceil((user.cooldowns.race - now) / 1000);
        return sock.sendMessage(from, { text: `🏎️ Enjin jentera tengah panas! Tunggu *${rem} saat* lagi sebelum masuk trek.` });
      }

      user.cooldowns.race = now + raceCd;
      const winChance = (vehicle.speed || 50) / 220;
      const isWin = Math.random() < winChance;

      if (isWin) {
        const reward = (vehicle.price * 0.1) + 200;
        user.cash += Math.floor(reward);
        user.stats.racesWon = (user.stats.racesWon || 0) + 1;
        await checkAndAwardBadges(user, sock, from, cleanSender);
        updateUser(cleanSender, user);

        return sock.sendMessage(from, { 
          text: `🏁 *KEMENANGAN DRAG RACE!* 🏁\nJentera *${vehicle.name}* anda membelah angin di garisan penamat!\nHadiah Tunai: *+RM ${Math.floor(reward).toLocaleString()}*`, 
          mentions: [cleanSender] 
        });
      } else {
        const repairCost = Math.floor(vehicle.price * 0.03);
        user.cash = Math.max(0, user.cash - repairCost);
        updateUser(cleanSender, user);

        return sock.sendMessage(from, { text: `💥 Terbabas di selekoh! Jentera *${vehicle.name}* anda tewas. Kos baiki bengkel: *-RM ${repairCost.toLocaleString()}*.` });
      }
    }

    // --- LEADERBOARD ---
    if (cmd === "leaderboard" || cmd === "top") {
      const db = loadDB();
      const usersObj = db.users || {};
      const sortedUsers = Object.entries(usersObj)
        .map(([id, data]) => ({
          id,
          totalMoney: (data.cash || 0) + (data.bank || 0),
          title: getTitle(data)
        }))
        .sort((a, b) => b.totalMoney - a.totalMoney)
        .slice(0, 5);

      if (sortedUsers.length === 0) return sock.sendMessage(from, { text: `ℹ️ Tiada data pengguna dalam pangkalan data.` });

      let lbText = `╭━━━ 🏆 *AIRI'S CORNER LEADERBOARD* 🏆 ━━━\n`;
      sortedUsers.forEach((u, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `🏅 #${index + 1}`;
        lbText += `${medal} @${u.id.split("@")[0]}\n   • Kekayaan: RM ${u.totalMoney.toLocaleString()}\n   • Gelaran: ${u.title}\n\n`;
      });
      lbText += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: lbText, mentions: sortedUsers.map(u => u.id) });
    }

    // --- KERJA HALAL ---
    if (cmd === "kerja" || cmd === "work") {
      const cd = 3 * 60 * 1000;
      if (now < user.cooldowns.work) {
        const rem = Math.ceil((user.cooldowns.work - now) / 1000);
        return sock.sendMessage(from, { text: `⚠️ Sabar bossku, baru lepas kerja! Rehat *${rem} saat* lagi. (Tip: Guna \`.makan\` untuk pulihkan tenaga).`, mentions: [cleanSender] });
      }

      const randomJob = JOBS[Math.floor(Math.random() * JOBS.length)];
      user.cash += randomJob.pay;
      user.jobId = randomJob.id;
      user.stats.works += 1;
      user.cooldowns.work = now + cd;

      await checkAndAwardBadges(user, sock, from, cleanSender);
      updateUser(cleanSender, user);

      const randomDialog = DIALOG_KERJA[Math.floor(Math.random() * DIALOG_KERJA.length)];
      const halalUI = `╭━━━ 💼 *SEKTOR HALAL : SLIP GAJI* ━━━
┃ 👤 Pekerja: @${cleanSender.split("@")[0]}
┃ 📋 Jawatan: ${randomJob.name}
┃ 💰 Payout: +RM ${randomJob.pay.toLocaleString()}
┃ 
┃ 💬 _"${randomDialog}"_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      return sock.sendMessage(from, { text: halalUI, mentions: [cleanSender] });
    }

    // --- SHOWROOM KENDERAAN ---
    if (cmd === "showroom") {
      let ui = `╭━━━ 🏎️ *SHOWROOM KENDERAAN MALAYSIA* ━━━\n\n*🏍️ SEKTOR MOTOSIKAL (20 Pilihan)*\n`;
      VEHICLES.filter(v => v.type === "Motor").forEach(v => {
        ui += `• *[${v.id}]* ${v.name} - RM ${v.price.toLocaleString()}\n`;
      });
      ui += `\n*🚗 SEKTOR KERETA (20 Pilihan)*\n`;
      VEHICLES.filter(v => v.type === "Kereta").forEach(v => {
        ui += `• *[${v.id}]* ${v.name} - RM ${v.price.toLocaleString()}\n`;
      });
      ui += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip \`.beli_kenderaan [id]\` untuk beli jentera idaman anda!`;
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "beli_kenderaan") {
      const vId = args[0];
      const vehicle = VEHICLES.find(v => v.id === vId);
      if (!vehicle) return sock.sendMessage(from, { text: `❌ ID Kenderaan tidak sah. Sila semak \`.showroom\`.` });

      if (user.cash < vehicle.price) {
        return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup untuk membeli *${vehicle.name}* (Harga: RM ${vehicle.price.toLocaleString()}).`, mentions: [cleanSender] });
      }

      user.cash -= vehicle.price;
      user.vehicles.push(vehicle.id);
      await checkAndAwardBadges(user, sock, from, cleanSender);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { text: `🎉 Tahniah @${cleanSender.split("@")[0]}! Geran sah kenderaan *${vehicle.name}* kini menjadi milik anda!`, mentions: [cleanSender] });
    }

    // --- WARUNG MAKANAN & MAKAN ---
    if (cmd === "shop" || cmd === "warung") {
      let shopUI = `╭━━━ 🍔 *WARUNG MAKANAN AIRI* ━━━\n`;
      FOOD_ITEMS.forEach(f => {
        shopUI += `• *[${f.id}]* ${f.name} - RM ${f.price}\n  ℹ️ _${f.desc}_\n\n`;
      });
      shopUI += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip \`.beli_makanan [id]\` untuk order, dan \`.makan [id]\` untuk nikmati hidangan.`;
      return sock.sendMessage(from, { text: shopUI });
    }

    if (cmd === "beli_makanan") {
      const fId = args[0];
      const food = FOOD_ITEMS.find(f => f.id === fId);
      if (!food) return sock.sendMessage(from, { text: `❌ Menu makanan tidak dijumpai. Semak \`.shop\`.` });

      if (user.cash < food.price) {
        return sock.sendMessage(from, { text: `❌ Baki tunai tidak cukup untuk beli ${food.name}.` });
      }

      user.cash -= food.price;
      user.food.push(food.id);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { text: `🍽️ Berjaya order *${food.name}*! Makanan disimpan dalam inventori.`, mentions: [cleanSender] });
    }

    if (cmd === "makan") {
      const fId = args[0];
      if (!fId) return sock.sendMessage(from, { text: `❌ Taip \`.makan [id_makanan]\` (Contoh: \`.makan nasilemak\`)` });
      
      const foodIndex = user.food.indexOf(fId);
      if (foodIndex === -1) return sock.sendMessage(from, { text: `❌ Anda tidak mempunyai item tersebut di dalam peti inventori. Sila beli di \`.shop\`.` });

      user.food.splice(foodIndex, 1);
      
      if (fId === "nasilemak") {
        user.cooldowns.work = 0;
      } else if (fId === "roticanai") {
        user.cooldowns.work = Math.max(0, user.cooldowns.work - (2 * 60 * 1000));
      } else if (fId === "tehtarik") {
        user.cooldowns.work = Math.max(0, user.cooldowns.work - (1 * 60 * 1000));
      }

      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `😋 *Slurpp!* Anda telah menikmati *${fId}*. Tenaga bertambah dan cooldown kerja berjaya dikurangkan!`, mentions: [cleanSender] });
    }

    // --- BLACK MARKET ---
    if (cmd === "blackmarket" || cmd === "bm") {
      let bmUI = `╭━━━ 🏴‍☠️ *PASARAN GELAP (BLACK MARKET)* ━━━\n`;
      BLACKMARKET_ITEMS.forEach(item => {
        bmUI += `• *[${item.id}]* ${item.name}\n  Harga: RM ${item.price.toLocaleString()}\n  Fungsi: ${item.desc}\n\n`;
      });
      bmUI += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip \`.beli_device [id]\` untuk beli peralatan gelap.`;
      return sock.sendMessage(from, { text: bmUI });
    }

    if (cmd === "beli_device") {
      const bId = args[0];
      const item = BLACKMARKET_ITEMS.find(i => i.id === bId);
      if (!item) return sock.sendMessage(from, { text: `❌ Gajet gelap tidak dijumpai dalam senarai Black Market.` });

      if (user.cash < item.price) {
        return sock.sendMessage(from, { text: `❌ Baki tunai tidak mencukupi untuk acquire *${item.name}*.` });
      }

      if (user.inventory.some(i => i.id === item.id)) {
        return sock.sendMessage(from, { text: `⚠️ Anda sudah memiliki perkakasan ini di dalam inventori.` });
      }

      user.cash -= item.price;
      user.inventory.push({ id: item.id, name: item.name });
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { text: `🛒 Perkakasan *${item.name}* selamat masuk ke dalam beg sandang anda!`, mentions: [cleanSender] });
    }

    // --- MISI JENAYAH ---
    if (cmd === "jenayah_menu" || cmd === "crime_menu") {
      let cUI = `╭━━━ 🚨 *MISI UNDERWORLD MALAYSIA* ━━━\n`;
      CRIMES.forEach(c => {
        const reqStr = c.reqItem ? `[Syarat: ${c.reqItem}]` : `[Tiada Syarat]`;
        cUI += `• *[ID ${c.id}]* ${c.name}\n  Loot: RM ${c.rewardMin.toLocaleString()} - RM ${c.rewardMax.toLocaleString()}\n  Denda Gagal: RM ${c.fine.toLocaleString()} | ${reqStr}\n\n`;
      });
      cUI += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip \`.buat_jenayah [id]\` untuk mulakan operasi.`;
      return sock.sendMessage(from, { text: cUI });
    }

    if (cmd === "buat_jenayah" || cmd === "crime") {
      const cId = parseInt(args[0]);
      const targetCrime = CRIMES.find(c => c.id === cId || c.id.toString() === args[0]);

      if (!targetCrime) return sock.sendMessage(from, { text: `❌ ID Misi tidak sah. Semak \`.jenayah_menu\`.` });

      if (targetCrime.reqItem && !user.inventory.some(i => i.id === targetCrime.reqItem)) {
        return sock.sendMessage(from, { text: `❌ Operasi '${targetCrime.name}' memerlukan gajet *[${targetCrime.reqItem}]* dari \`.blackmarket\`!` });
      }

      const cd = 5 * 60 * 1000;
      if (now < user.cooldowns.crime) {
        const rem = Math.ceil((user.cooldowns.crime - now) / 1000);
        return sock.sendMessage(from, { text: `🚨 Skuad polis sedang meronda kawasan! Sembunyi selama *${rem} saat* lagi.`, mentions: [cleanSender] });
      }

      const isSuccess = Math.random() < 0.5;
      user.cooldowns.crime = now + cd;

      if (isSuccess) {
        const reward = Math.floor(Math.random() * (targetCrime.rewardMax - targetCrime.rewardMin + 1)) + targetCrime.rewardMin;
        user.cash += reward;
        user.stats.crimes += 1;
        user.stars = Math.min(5, (user.stars || 0) + targetCrime.stars);
        await checkAndAwardBadges(user, sock, from, cleanSender);
        updateUser(cleanSender, user);

        const randomCrimeDialog = DIALOG_CRIME_SUCCESS[Math.floor(Math.random() * DIALOG_CRIME_SUCCESS.length)];
        const successUI = `╭━━━ 🦹 *UNDERWORLD : MISI BERJAYA* ━━━
┃ 👤 Pelaku: @${cleanSender.split("@")[0]}
┃ 🎯 Misi: ${targetCrime.name}
┃ 💰 Loot Bersih: +RM ${reward.toLocaleString()}
┃ ⭐ Wanted Level: ${"⭐".repeat(user.stars)}
┃
┃ 💬 _"${randomCrimeDialog}"_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: successUI, mentions: [cleanSender] });
      } else {
        const fineAmount = targetCrime.fine;
        user.cash = Math.max(0, user.cash - fineAmount);
        user.stars = Math.min(5, (user.stars || 0) + 1);
        user.cooldowns.jailUntil = now + (3 * 60 * 1000);
        updateUser(cleanSender, user);

        const bustedUI = `╭━━━ 🚨 *OPERASI KANTOI DENGAN POLIS* ━━━
┃ Misi *${targetCrime.name}* gagal! Anda ditahan peronda polis.
┃ 💸 Denda Mahkamah: -RM ${fineAmount.toLocaleString()}
┃ 🔒 Hukuman Lokap: 3 Minit
┃ 
┃ ℹ️ Taip \`.upah_lawyer\` (RM 500) untuk bebas serta-merta!
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: bustedUI, mentions: [cleanSender] });
      }
    }

    // --- UPAH LAWYER PRO ---
    if (cmd === "upah_lawyer" || cmd === "lawyer") {
      if (now >= user.cooldowns.jailUntil) {
        return sock.sendMessage(from, { text: `ℹ️ Anda tidak berada di dalam lokap sekarang.` });
      }
      const lawyerFee = 500;
      if (user.cash < lawyerFee) {
        return sock.sendMessage(from, { text: `❌ Baki tunai tidak cukup untuk upah peguam pro (RM ${lawyerFee}). Sila tunggu hukuman tamat.` });
      }

      user.cash -= lawyerFee;
      user.cooldowns.jailUntil = 0;
      user.stars = Math.max(0, user.stars - 1);
      user.stats.bails = (user.stats.bails || 0) + 1;
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { 
        text: `⚖️ [PEGUAM PRO BERJAYA] Bayaran guaman RM ${lawyerFee} diselesaikan. Kes anda dilepaskan serta-merta daripada lokap!`, 
        mentions: [cleanSender] 
      });
    }

    // --- NPC MAMAK INTEL ---
    if (cmd === "tanya_mamak" || cmd === "mamak") {
      const randomMamak = DIALOG_MAMAK[Math.floor(Math.random() * DIALOG_MAMAK.length)];
      return sock.sendMessage(from, { text: `👨‍🍳 *Mamak Bistro Intel:*\n\n_"${randomMamak}"_` });
    }

  });
}

startBotEngine();
