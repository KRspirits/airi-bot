import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import http from "http";
import QRCode from "qrcode";
import { createCanvas } from "canvas";
import dotenv from "dotenv";
dotenv.config();

let currentQR = "";
let isConnected = false;

// --- 1. PELAYAN WEB UNTUK DISPLAY QR DI RENDER ---
const PORT = process.env.PORT || 3000;
http.createServer(async (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  if (isConnected) {
    res.end("<div style='text-align:center;margin-top:50px;font-family:sans-serif;'><h1 style='color:#00e676;'>✅ AIRI'S CORNER BOT ONLINE!</h1><p>Sistem aktif 24/7 menerima arahan.</p></div>");
  } else if (currentQR) {
    try {
      const qrImage = await QRCode.toDataURL(currentQR);
      res.end(`
        <div style="text-align:center;margin-top:30px;font-family:sans-serif;background:#0d1117;color:#fff;padding:20px;min-height:90vh;">
          <h1 style="color:#00ffff;letter-spacing:1px;">⚡ AIRI'S CORNER : SCAN QR ⚡</h1>
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

function getUser(userId) {
  const db = loadDB();
  if (!db.users[userId]) {
    db.users[userId] = {
      cash: 500,
      bank: 0,
      jobId: 1,
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
  if (!u.jobId) u.jobId = 1;
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

  ctx.fillStyle = "#0a0d14";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⚡ AIRI'S CORNER : OFFICIAL BADGE ⚡", width / 2, 60);

  ctx.beginPath();
  ctx.moveTo(50, 75);
  ctx.lineTo(550, 75);
  ctx.strokeStyle = "#00e676";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(badgeName.toUpperCase(), width / 2, 140);

  ctx.fillStyle = "#ffffff";
  ctx.font = "18px sans-serif";
  ctx.fillText("DIANUGERAHKAN KEPADA:", width / 2, 195);

  ctx.fillStyle = "#00e676";
  ctx.font = "bold 24px monospace";
  ctx.fillText(`+${userPhone}`, width / 2, 235);

  ctx.fillStyle = "#666666";
  ctx.font = "13px monospace";
  ctx.fillText(`VERIFIED ID: 0x${Math.floor(Math.random() * 899999 + 100000)} • AIRI GRID SYSTEM`, width / 2, 285);

  return canvas.toBuffer("image/png");
}

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
  { id: "z800", name: "Kawasaki Z800", price: 48000, type: "Motor", speed: 115 },
  { id: "r6", name: "Yamaha YZF-R6 Scream", price: 85000, type: "Motor", speed: 135 },
  { id: "zx6r", name: "Kawasaki ZX-6R", price: 90000, type: "Motor", speed: 140 },
  { id: "s1000rr", name: "BMW S1000RR M", price: 175000, type: "Motor", speed: 165 },
  { id: "panigale", name: "Ducati Panigale V4S", price: 180000, type: "Motor", speed: 170 },
  { id: "h2", name: "Kawasaki Ninja H2", price: 250000, type: "Motor", speed: 190 },
  // 20 KERETA
  { id: "kancil", name: "Perodua Kancil Turbo", price: 5000, type: "Kereta", speed: 45 },
  { id: "iswara", name: "Proton Iswara Aeroback", price: 8000, type: "Kereta", speed: 50 },
  { id: "saga", name: "Proton Saga BLM", price: 12000, type: "Kereta", speed: 55 },
  { id: "wira", name: "Proton Wira 1.5 GLi", price: 15000, type: "Kereta", speed: 60 },
  { id: "preve", name: "Proton Preve Turbo", price: 40000, type: "Kereta", speed: 75 },
  { id: "persona", name: "Proton Persona Premium", price: 45000, type: "Kereta", speed: 70 },
  { id: "myvi", name: "Perodua Myvi King 1.5", price: 50000, type: "Kereta", speed: 82 },
  { id: "x50", name: "Proton X50 TGDi", price: 90000, type: "Kereta", speed: 95 },
  { id: "vios", name: "Toyota Vios GR-Sport", price: 95000, type: "Kereta", speed: 85 },
  { id: "x70", name: "Proton X70 Premium", price: 120000, type: "Kereta", speed: 100 },
  { id: "civic", name: "Honda Civic FC Ketam", price: 130000, type: "Kereta", speed: 110 },
  { id: "accord", name: "Honda Accord Turbo", price: 180000, type: "Kereta", speed: 120 },
  { id: "alphard", name: "Toyota Alphard Executive", price: 350000, type: "Kereta", speed: 95 },
  { id: "mustang", name: "Ford Mustang 5.0 V8 GT", price: 550000, type: "Kereta", speed: 145 },
  { id: "gtr", name: "Nissan GT-R R35 Nismo", price: 650000, type: "Kereta", speed: 165 },
  { id: "m4", name: "BMW M4 Competition", price: 750000, type: "Kereta", speed: 170 },
  { id: "c63", name: "Mercedes-AMG C63s", price: 780000, type: "Kereta", speed: 172 },
  { id: "ferrari", name: "Ferrari 488 Pista", price: 1500000, type: "Kereta", speed: 185 },
  { id: "lambo", name: "Lamborghini Huracan EVO", price: 1600000, type: "Kereta", speed: 190 },
  { id: "911", name: "Porsche 911 GT3 RS", price: 1800000, type: "Kereta", speed: 195 }
];

// --- 6. WARUNG MAKANAN & GAJET BLACK MARKET ---
const FOOD_ITEMS = [
  { id: "tehtarik", name: "Teh Tarik Kaw", price: 4, desc: "Potong 1 minit cooldown kerja" },
  { id: "roticanai", name: "Roti Canai Banjir", price: 7, desc: "Potong 2 minit cooldown kerja" },
  { id: "nasilemak", name: "Nasi Lemak Sotong", price: 12, desc: "Reset terus cooldown kerja" },
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

const DIALOG_KERJA = [
  "Wah berpeluh dahi grind rezeki halal hari ni! Gaji settle masuk poket.",
  "Titik peluh sendiri baru berkat bro. Simpan sikit dalam bank!",
  "Mantap! Konsisten macam ni cepat kaya beli kenderaan impian.",
  "Kerja selesai boss! Teruskan usaha rezeki halal sentiasa lapang."
];

const DIALOG_CRIME_SUCCESS = [
  "Licik gila taktik kau! Polis peronda pun terpinga-pinga cari tak jumpa.",
  "Operasi underground settle bersih tanpa tinggal sebarang bukti!",
  "Fuh selamat! Jantung berdegup laju tapi hasilnya memang padu.",
  "Masterclass! Senyap-senyap buat kerja terus kaut keuntungan besar."
];

const DIALOG_MAMAK = [
  "Boss! Mai duduk pekena teh tarik gelas besar dulu. Mamak dengar polis tengah buat roadblock kat jalan utama malam ni!",
  "Eh bossku! Mamak dengar cerita sindiket Darkweb tengah cari pakar godam. Siapa ada Flipper Zero boleh test nasib.",
  "Duduk dulu boss! Rezeki halal biar lambat asal selamat, jangan lupa simpan dalam bank.",
  "Aney habaq mai, mesin ATM lorong belakang tu sistem tengah slow malam ni, senang kalau ada alat skimmer.",
  "Rilek boss, minum dulu on the house! Kalau masuk lokap peguam cas RM500, simpan tunai sikit!"
];

function getTitle(user) {
  const total = user.cash + user.bank;
  if (user.stars >= 4) return "🏴‍☠️ Kingpin Underworld";
  if (user.stars >= 2) return "🥷 Buronan Dikehendaki";
  if (total >= 1000000) return "👑 Jutawan Korporat";
  if (total >= 200000) return "💼 Pengurus Eksekutif";
  if (total >= 50000) return "⭐ Pekerja Teladan";
  return "🌱 Warga Cyber";
}

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
    } catch (e) {
      console.log("Canvas Error:", e.message);
    }
  }
}

// --- 8. ENGINE UTAMA BAILEYS ---
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
        getUser(cleanId);
        await sock.sendMessage(anu.id, {
          text: `👋 Salam @${num.split("@")[0]}! Selamat datang ke Airi's Corner. Starter pack RM500 dan Badge [🌱 Warga Baru] sedia ada. Taip *.menu* untuk mula!`,
          mentions: [num]
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

  // --- AUTO-REPORT 12:00 TENGAH MALAM (5 KATEGORI LENGKAP) ---
  let lastResetDate = new Date().getDate();
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 0 && now.getDate() !== lastResetDate) {
      lastResetDate = now.getDate();
      const db = loadDB();
      const usersArr = Object.entries(db.users || {}).map(([id, d]) => ({
        id,
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
┃ Jam 12:00 Malam! Anugerah kegigihan warga Airi's Corner:
┃
┃ 🏆 *1. RAJA KERJA HALAL:*
┃ 👤 @${topWorker.id.split("@")[0]} (${topWorker.works} shift diselesaikan!)
┃
┃ 🏴‍☠️ *2. PENJENAYAH UNDERWORLD TERAKTIF:*
┃ 👤 @${topCriminal.id.split("@")[0]} (${topCriminal.crimes} operasi haram!)
┃
┃ 🏁 *3. RAJA TREK / DRAG KING:*
┃ 👤 @${topRacer.id.split("@")[0]} (${topRacer.races} kemenangan lumba!)
┃
┃ 💰 *4. JUTAWAN HARIAN TERKAYA:*
┃ 👤 @${topRich.id.split("@")[0]} (Jumlah Aset: RM ${topRich.total.toLocaleString()})
┃
┃ ⚖️ *5. KAKI LOKAP / PELANGGAN SETIA PEGUAM:*
┃ 👤 @${topBail.id.split("@")[0]} (${topBail.bails} kali jamin lokap!)
┃
┃ ✨ _Statistik harian diset semula. Selamat menggrind untuk hari esok!_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        const mentionsArr = [topWorker.id, topCriminal.id, topRacer.id, topRich.id, topBail.id].filter(Boolean);
        for (const gId of db.groups) {
          await sock.sendMessage(gId, { text: reportMsg, mentions: mentionsArr }).catch(() => {});
        }
      }

      // Reset statistik harian
      for (let id in db.users) {
        db.users[id].stats = { works: 0, crimes: 0, bails: 0, racesWon: 0 };
      }
      saveDB(db);
    }
  }, 60 * 1000);

  // --- 9. PENGENDALI MESEJ & ARAHAN ---
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
    const user = getUser(cleanSender);
    const now = Date.now();

    // Sekatan Lokap
    if (now < user.cooldowns.jailUntil && cmd !== "upah_lawyer" && cmd !== "myid") {
      const remMin = Math.ceil((user.cooldowns.jailUntil - now) / 60000);
      return sock.sendMessage(from, { text: `🚨 Anda sedang ditahan di lokap polis! Baki: *${remMin} minit*.\n\nTaip *.upah_lawyer* (RM500) untuk jamin bebas segera.`, mentions: [cleanSender] });
    }

    // MENU UTAMA
    if (cmd === "menu" || cmd === "help") {
      const menu = `╭━━━ 🖥️ *AIRI'S CORNER OS* 🖥️ ━━━
┃ 🌐 *Vibe Malaysia • Cyber RPG*
┃
┃ 💼 *[SEKTOR HALAL]*
┃ • *.list_kerja [1/2]* - Senarai 50 kerja
┃ • *.pilih_kerja [id]* - Tukar jawatan
┃ • *.kerja* - Mulakan tugas & terima gaji
┃ • *.daily* - Elaun percuma harian (RM250)
┃ • *.showroom [1/2]* - Katalog 40 kenderaan
┃ • *.beli_kenderaan [id]* - Beli kenderaan
┃ • *.shop* - Warung makanan tempatan
┃ • *.beli_makanan [id]* - Pesan hidangan
┃ • *.makan [id]* - Nikmati hidangan
┃
┃ 🏦 *[PERBANKAN & PVP]*
┃ • *.deposit [amt/all]* - Simpan tunai
┃ • *.withdraw [amt/all]* - Keluarkan tunai
┃ • *.transfer @user [amt]* - Pindah wang
┃ • *.rompak @user* - Rompak poket kawan
┃ • *.lumba [id_kenderaan]* - Drag race malam
┃
┃ 🏴‍☠️ *[UNDERWORLD & BLACK MARKET]*
┃ • *.jenayah_menu* - Senarai 10 misi
┃ • *.buat_jenayah [id]* - Jalankan misi
┃ • *.blackmarket* - Pasaran gajet gelap
┃ • *.beli_device [id]* - Beli gajet godam
┃
┃ 🪪 *[SISTEM & PROFIL]*
┃ • *.myid* - Kad pengenalan siber
┃ • *.profile* - Garaj & beg inventori penuh
┃ • *.badges* - Semak koleksi lencana
┃ • *.top* - Papan carta 5 terkaya
┃ • *.upah_lawyer* - Peguam jamin lokap (RM500)
┃ • *.tanya_mamak* - Intel & petua Mamak Bistro
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: menu });
    }

    // DAILY BONUS
    if (cmd === "daily") {
      if (now < user.cooldowns.daily) {
        const remH = Math.ceil((user.cooldowns.daily - now) / 3600000);
        return sock.sendMessage(from, { text: `⏳ Bantuan harian sudah dituntut! Tunggu *${remH} jam* lagi.`, mentions: [cleanSender] });
      }
      user.cash += 250;
      user.cooldowns.daily = now + (24 * 3600 * 1000);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎁 Elaun percuma *+RM 250* telah dimasukkan ke dalam baki tunai anda!`, mentions: [cleanSender] });
    }

    // MYID
    if (cmd === "myid" || cmd === "ic") {
      const title = getTitle(user);
      const activeJob = JOBS.find(j => j.id === user.jobId)?.name || "Pekerja Am";
      const totalWealth = user.cash + user.bank;
      const ui = `╭━━━ 🪪 *CYBER IDENTITY CARD* ━━━
┃ 👤 User: @${cleanSender.split("@")[0]}
┃ 🎖️ Gelaran: ${title}
┃ 💼 Jawatan: ${activeJob} [ID ${user.jobId}]
┃ 💵 Tunai: RM ${user.cash.toLocaleString()}
┃ 🏦 Bank: RM ${user.bank.toLocaleString()}
┃ 💎 Nilai Aset: RM ${totalWealth.toLocaleString()}
┃ 🚗 Kenderaan: ${user.vehicles.length} Unit
┃ ⭐ Wanted: ${"⭐".repeat(user.stars) || "0 (Bersih)"}
┃ 🏅 Badges: ${user.badges.join(" | ")}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui, mentions: [cleanSender] });
    }

    // PROFILE GARAJ & BEG
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

    // SENARAI BADGES
    if (cmd === "badges" || cmd === "lencana") {
      return sock.sendMessage(from, { 
        text: `╭━━━ 🏅 *KOLEKSI BADGES ANDA* ━━━\n┃ User: @${cleanSender.split("@")[0]}\n┃\n┃ ${user.badges.map(b => `• ${b}`).join("\n┃ ")}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 
        mentions: [cleanSender] 
      });
    }

    // SENARAI 50 KERJA (2 HALAMAN)
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
      if (!targetJob) return sock.sendMessage(from, { text: `❌ ID kerja tidak sah! Sila taip *.list_kerja* (ID 1 hingga 50).` });

      user.jobId = targetJob.id;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🏢 *TAWARAN DITERIMA!* Anda kini rasmi bertugas sebagai *${targetJob.name}* (Gaji: RM ${targetJob.pay.toLocaleString()} / shift).\n\nTaip *.kerja* untuk bertugas!`, mentions: [cleanSender] });
    }

    // KERJA
    if (cmd === "kerja" || cmd === "work") {
      const currentJob = JOBS.find(j => j.id === user.jobId) || JOBS[0];
      const cd = 3 * 60 * 1000;
      if (now < user.cooldowns.work) {
        const rem = Math.ceil((user.cooldowns.work - now) / 1000);
        return sock.sendMessage(from, { text: `⚠️ Rehat dulu boss, tunggu *${rem} saat* lagi. (Tip: Guna *.makan nasilemak* untuk reset cooldown).`, mentions: [cleanSender] });
      }

      user.cash += currentJob.pay;
      user.stats.works += 1;
      user.cooldowns.work = now + cd;

      await checkAndAwardBadges(user, sock, from, cleanSender);
      updateUser(cleanSender, user);

      const d = DIALOG_KERJA[Math.floor(Math.random() * DIALOG_KERJA.length)];
      return sock.sendMessage(from, { text: `╭━━━ 💼 *SLIP GAJI* ━━━\n┃ Jawatan: ${currentJob.name} [ID ${currentJob.id}]\n┃ Gaji Diterima: +RM ${currentJob.pay.toLocaleString()}\n┃\n┃ _"${d}"_\n╰━━━━━━━━━━━━━━━━━`, mentions: [cleanSender] });
    }

    // BANK : DEPOSIT
    if (cmd === "deposit" || cmd === "dep") {
      const amt = args[0] === "all" ? user.cash : parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || user.cash < amt) return sock.sendMessage(from, { text: `❌ Jumlah tidak sah atau tunai tidak mencukupi.` });
      user.cash -= amt; user.bank += amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🏦 Berjaya deposit *RM ${amt.toLocaleString()}* ke dalam akaun bank Airi.` });
    }

    // BANK : WITHDRAW
    if (cmd === "withdraw" || cmd === "wd") {
      const amt = args[0] === "all" ? user.bank : parseInt(args[0]);
      if (isNaN(amt) || amt <= 0 || user.bank < amt) return sock.sendMessage(from, { text: `❌ Jumlah tidak sah atau baki bank tidak mencukupi.` });
      user.bank -= amt; user.cash += amt;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `💵 Berjaya keluarkan *RM ${amt.toLocaleString()}* tunai.` });
    }

    // TRANSFER
    if (cmd === "transfer" || cmd === "pay") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amt = parseInt(args[1]);
      if (!targetTag || isNaN(amt) || amt <= 0 || user.cash < amt) return sock.sendMessage(from, { text: `❌ Format: *.transfer @user [jumlah]*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Anda tidak boleh transfer duit kepada diri sendiri.` });

      const targetUser = getUser(cleanTarget);
      user.cash -= amt; targetUser.cash += amt;
      updateUser(cleanSender, user); updateUser(cleanTarget, targetUser);
      return sock.sendMessage(from, { text: `💸 Berjaya transfer *RM ${amt.toLocaleString()}* kepada @${cleanTarget.split("@")[0]}!`, mentions: [cleanSender, cleanTarget] });
    }

    // ROMPAK PEMAIN (PVP)
    if (cmd === "rompak") {
      const targetTag = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!targetTag) return sock.sendMessage(from, { text: `❌ Tag mangsa! Contoh: *.rompak @user*` });
      const cleanTarget = targetTag.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      if (cleanTarget === cleanSender) return sock.sendMessage(from, { text: `❌ Nak rompak poket sendiri ke tu?` });

      const targetUser = getUser(cleanTarget);
      if (targetUser.cash < 100) return sock.sendMessage(from, { text: `😅 Mangsa poket kering bawah RM100!` });

      user.cooldowns.crime = now + (5 * 60 * 1000);
      if (Math.random() < 0.45) {
        const stolen = Math.floor(targetUser.cash * 0.25);
        targetUser.cash -= stolen; user.cash += stolen; user.stars = Math.min(5, user.stars + 1);
        await checkAndAwardBadges(user, sock, from, cleanSender);
        updateUser(cleanSender, user); updateUser(cleanTarget, targetUser);
        return sock.sendMessage(from, { text: `🥷 Rompakan berjaya! Anda merembat *RM ${stolen.toLocaleString()}* daripada @${cleanTarget.split("@")[0]}!`, mentions: [cleanSender, cleanTarget] });
      } else {
        user.cash = Math.max(0, user.cash - 300);
        user.cooldowns.jailUntil = now + (3 * 60 * 1000);
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 Kantoi polis! Denda RM 300 dan ditahan di lokap 3 minit.` });
      }
    }

    // LUMBA HARAM (.lumba)
    if (cmd === "lumba" || cmd === "race") {
      const vId = args[0];
      if (!vId) return sock.sendMessage(from, { text: `❌ Sila nyatakan ID kenderaan! Contoh: *.lumba y15* atau *.lumba myvi* (Semak *.profile*).` });

      if (!user.vehicles.includes(vId)) {
        return sock.sendMessage(from, { text: `❌ Anda tidak memiliki jentera tersebut di dalam garaj.` });
      }

      const vehicle = VEHICLES.find(v => v.id === vId);
      const raceCd = 4 * 60 * 1000;
      if (now < user.cooldowns.race) {
        const rem = Math.ceil((user.cooldowns.race - now) / 1000);
        return sock.sendMessage(from, { text: `🏎️ Enjin jentera masih panas! Tunggu *${rem} saat* lagi sebelum masuk trek.` });
      }

      user.cooldowns.race = now + raceCd;
      const winChance = (vehicle.speed || 50) / 220;
      const isWin = Math.random() < winChance;

      if (isWin) {
        const reward = Math.floor((vehicle.price * 0.08) + 250);
        user.cash += reward;
        user.stats.racesWon = (user.stats.racesWon || 0) + 1;
        await checkAndAwardBadges(user, sock, from, cleanSender);
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🏁 *KEMENANGAN DRAG RACE!* 🏁\nJentera *${vehicle.name}* anda membelah garisan penamat!\nHadiah Tunai: *+RM ${reward.toLocaleString()}*`, mentions: [cleanSender] });
      } else {
        const repairCost = Math.floor(vehicle.price * 0.02);
        user.cash = Math.max(0, user.cash - repairCost);
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `💥 Terbabas di selekoh! Jentera *${vehicle.name}* tewas. Kos baiki bengkel: *-RM ${repairCost.toLocaleString()}*.` });
      }
    }

    // SHOWROOM (2 HALAMAN LENGKAP 40 KENDERAAN)
    if (cmd === "showroom") {
      const page = args[0] === "2" ? 2 : 1;
      const start = (page - 1) * 20;
      const end = start + 20;
      const pageVehicles = VEHICLES.slice(start, end);

      let text = `╭━━━ 🏎️ *SHOWROOM TEMPATAN (PAGE ${page}/2)* ━━━\n`;
      pageVehicles.forEach(v => {
        text += `• *[${v.id}]* ${v.name} (${v.type}) ➔ RM ${v.price.toLocaleString()}\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += page === 1 ? `Taip *.showroom 2* untuk senarai 20 kenderaan seterusnya.\nTaip *.beli_kenderaan [id]* untuk beli.` : `Taip *.beli_kenderaan [id]* untuk beli.`;
      return sock.sendMessage(from, { text });
    }

    if (cmd === "beli_kenderaan") {
      const v = VEHICLES.find(x => x.id === args[0]);
      if (!v || user.cash < v.price) return sock.sendMessage(from, { text: `❌ Kenderaan tidak wujud atau baki tunai tidak mencukupi.` });
      user.cash -= v.price; user.vehicles.push(v.id);
      await checkAndAwardBadges(user, sock, from, cleanSender);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🎉 Tahniah! Geran pemilikan *${v.name}* rasmi menjadi milik anda!`, mentions: [cleanSender] });
    }

    // WARUNG & MAKAN
    if (cmd === "shop" || cmd === "warung") {
      let text = `╭━━━ 🍔 *WARUNG MAKANAN AIRI* ━━━\n`;
      FOOD_ITEMS.forEach(f => { text += `• *[${f.id}]* ${f.name} - RM ${f.price}\n  _${f.desc}_\n\n`; });
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip *.beli_makanan [id]* & *.makan [id]*`;
      return sock.sendMessage(from, { text });
    }

    if (cmd === "beli_makanan") {
      const f = FOOD_ITEMS.find(x => x.id === args[0]);
      if (!f || user.cash < f.price) return sock.sendMessage(from, { text: `❌ Item tidak sah atau duit tidak mencukupi.` });
      user.cash -= f.price; user.food.push(f.id);
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🍽️ Berjaya order *${f.name}*!` });
    }

    if (cmd === "makan") {
      const idx = user.food.indexOf(args[0]);
      if (idx === -1) return sock.sendMessage(from, { text: `❌ Makanan tiada dalam beg simpanan.` });
      user.food.splice(idx, 1);
      if (args[0] === "nasilemak") user.cooldowns.work = 0;
      if (args[0] === "roticanai") user.cooldowns.work = Math.max(0, user.cooldowns.work - (2 * 60 * 1000));
      if (args[0] === "tehtarik") user.cooldowns.work = Math.max(0, user.cooldowns.work - (1 * 60 * 1000));
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `😋 Makanan habis dinikmati! Cooldown kerja anda berjaya diset semula.` });
    }

    // BLACK MARKET
    if (cmd === "blackmarket" || cmd === "bm") {
      let bm = `╭━━━ 🏴‍☠️ *PASARAN GELAP (BLACK MARKET)* ━━━\n`;
      BLACKMARKET_ITEMS.forEach(i => { bm += `• *[${i.id}]* ${i.name} - RM ${i.price.toLocaleString()}\n  _${i.desc}_\n\n`; });
      return sock.sendMessage(from, { text: bm + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip *.beli_device [id]*` });
    }

    if (cmd === "beli_device") {
      const item = BLACKMARKET_ITEMS.find(i => i.id === args[0]);
      if (!item || user.cash < item.price) return sock.sendMessage(from, { text: `❌ Gajet gelap tidak dijumpai atau duit tak cukup.` });
      if (user.inventory.some(i => i.id === item.id)) return sock.sendMessage(from, { text: `⚠️ Anda sudah memiliki gajet ini di dalam beg!` });
      user.cash -= item.price; user.inventory.push({ id: item.id, name: item.name });
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `🛒 Perkakasan gelap *${item.name}* selamat masuk ke dalam beg anda!` });
    }

    // JENAYAH
    if (cmd === "jenayah_menu" || cmd === "crime_menu") {
      let text = `╭━━━ 🚨 *MISI UNDERWORLD MALAYSIA* ━━━\n`;
      CRIMES.forEach(c => {
        const reqStr = c.reqItem ? `[Syarat: ${c.reqItem}]` : `[Tiada Syarat]`;
        text += `• *[ID ${c.id}]* ${c.name}\n  Loot: RM ${c.rewardMin.toLocaleString()}-${c.rewardMax.toLocaleString()} | Denda: RM ${c.fine.toLocaleString()} ${reqStr}\n\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTaip *.buat_jenayah [id]*`;
      return sock.sendMessage(from, { text });
    }

    if (cmd === "buat_jenayah" || cmd === "crime") {
      const c = CRIMES.find(x => x.id.toString() === args[0]);
      if (!c) return sock.sendMessage(from, { text: `❌ Misi tidak wujud. Semak *.jenayah_menu*.` });

      if (c.reqItem && !user.inventory.some(i => i.id === c.reqItem)) {
        return sock.sendMessage(from, { text: `❌ Misi ini memerlukan perkakasan *[${c.reqItem}]* dari *.blackmarket*!` });
      }

      user.cooldowns.crime = now + (4 * 60 * 1000);
      if (Math.random() < 0.5) {
        const reward = Math.floor(Math.random() * (c.rewardMax - c.rewardMin + 1)) + c.rewardMin;
        user.cash += reward; user.stats.crimes += 1; user.stars = Math.min(5, user.stars + c.stars);
        await checkAndAwardBadges(user, sock, from, cleanSender);
        updateUser(cleanSender, user);
        const randD = DIALOG_CRIME_SUCCESS[Math.floor(Math.random() * DIALOG_CRIME_SUCCESS.length)];
        return sock.sendMessage(from, { text: `╭━━━ 🦹 *UNDERWORLD : BERJAYA* ━━━\n┃ Loot: +RM ${reward.toLocaleString()}\n┃ Wanted: ${"⭐".repeat(user.stars)}\n┃\n┃ _"${randD}"_\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━`, mentions: [cleanSender] });
      } else {
        user.cash = Math.max(0, user.cash - c.fine);
        user.cooldowns.jailUntil = now + (3 * 60 * 1000);
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `🚨 Tertangkap peronda polis! Denda RM ${c.fine.toLocaleString()} dan meringkuk di lokap 3 minit.\n\nTaip *.upah_lawyer* (RM500) untuk bebas segera.` });
      }
    }

    // UPAH LAWYER PRO
    if (cmd === "upah_lawyer") {
      if (now >= user.cooldowns.jailUntil) return sock.sendMessage(from, { text: `ℹ️ Anda tidak berada di dalam lokap.` });
      if (user.cash < 500) return sock.sendMessage(from, { text: `❌ Perlukan RM 500 tunai untuk yuran peguam.` });
      user.cash -= 500; user.cooldowns.jailUntil = 0; user.stars = Math.max(0, user.stars - 1);
      user.stats.bails = (user.stats.bails || 0) + 1;
      updateUser(cleanSender, user);
      return sock.sendMessage(from, { text: `⚖️ Peguam pro berjaya memfailkan jaminan! Anda kini bebas serta-merta daripada lokap.`, mentions: [cleanSender] });
    }

    // NPC MAMAK INTEL
    if (cmd === "tanya_mamak" || cmd === "mamak") {
      const tip = DIALOG_MAMAK[Math.floor(Math.random() * DIALOG_MAMAK.length)];
      return sock.sendMessage(from, { text: `👨‍🍳 *Mamak Bistro Intel:*\n\n_"${tip}"_` });
    }

    // LEADERBOARD
    if (cmd === "top" || cmd === "leaderboard") {
      const db = loadDB();
      const top = Object.entries(db.users || {}).map(([id, d]) => ({ id, total: (d.cash || 0) + (d.bank || 0) })).sort((a,b) => b.total - a.total).slice(0, 5);
      let t = `╭━━━ 🏆 *LEADERBOARD TERKAYA* ━━━\n`;
      top.forEach((u, i) => { t += `${i+1}. @${u.id.split("@")[0]} - RM ${u.total.toLocaleString()}\n`; });
      t += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: t, mentions: top.map(u => u.id) });
    }

  });
}

startBotEngine();
