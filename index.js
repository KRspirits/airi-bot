import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import fs from "fs";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

// ==========================================
// 1. PELAYAN WEB UNTUK RENDER (QR DISPLAY)
// ==========================================
let currentQR = null;
let isConnected = false;

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

  if (isConnected) {
    res.end(`
      <html>
        <head><title>Airi Bot Online</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="background:#0b0f19; color:#10b981; font-family:sans-serif; text-align:center; padding:50px 20px;">
          <h1 style="font-size:2.2rem; letter-spacing:1px;">⚡ AIRI BOT SYSTEM OPERATIONAL</h1>
          <p style="color:#94a3b8; font-size:1.1rem;">WhatsApp Bot beroperasi 24/7 di Cloud Server.</p>
        </body>
      </html>
    `);
  } else if (currentQR) {
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentQR)}`;
    res.end(`
      <html>
        <head>
          <title>Imbas QR Airi Bot</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="15">
        </head>
        <body style="background:#0b0f19; color:#f8fafc; font-family:sans-serif; text-align:center; padding:30px 15px;">
          <h2 style="color:#38bdf8;">⚡ IMBAS QR CODE AIRI BOT</h2>
          <p style="color:#94a3b8;">Buka WhatsApp > Linked Devices > Link a Device > Imbas kod:</p>
          <div style="background:white; display:inline-block; padding:15px; border-radius:12px; margin-top:15px;">
            <img src="${qrImageUrl}" alt="WhatsApp QR Code" style="display:block;" />
          </div>
          <p style="color:#64748b; font-size:0.85rem; margin-top:15px;">Auto-refresh setiap 15 saat.</p>
        </body>
      </html>
    `);
  } else {
    res.end(`
      <html>
        <head><title>Menjana QR...</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="refresh" content="4"></head>
        <body style="background:#0b0f19; color:#f8fafc; font-family:sans-serif; text-align:center; padding:50px 20px;">
          <h2 style="color:#fbbf24;">⏳ Memulakan Sub-Sistem Baileys...</h2>
          <p style="color:#94a3b8;">Sila tunggu sebentar.</p>
        </body>
      </html>
    `);
  }
}).listen(PORT, () => {
  console.log(`🌐 Web QR Service aktif pada port: ${PORT}`);
});

// ==========================================
// 2. CONFIGURATION & DATABASE
// ==========================================
const DB_FILE = "./database.json";
const BOT_NAME = "Airi";

// Senarai Padanan Nombor Telefon CEO Amar
const CEO_NUMBER_STRINGS = ["601166533534", "01166533534", "1166533534", "66533534"];

let activeAirdrop = null; 
let activeRaces = {}; 

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, groups: [], bounties: {} }, null, 2));
  }
  const data = JSON.parse(fs.readFileSync(DB_FILE));
  if (!data.bounties) data.bounties = {};
  return data;
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function cleanUserId(rawId) {
  if (!rawId) return "unknown@s.whatsapp.net";
  const numOnly = rawId.split('@')[0].split(':')[0].replace(/\D/g, "");
  return numOnly + "@s.whatsapp.net";
}

function getUser(userId) {
  const db = loadDB();
  const cleanId = cleanUserId(userId);
  if (!db.users[cleanId]) {
    db.users[cleanId] = {
      cash: 1000,
      bank: 5000,
      stars: 0,
      job: "Penganggur",
      vehicle: null,
      phone: null,
      inventory: [],
      frozen: false,
      stats: { successJobs: 0, jailCount: 0, robCount: 0, msgCount: 0, racesWon: 0, bountiesClaimed: 0 },
      cooldowns: { work: 0, crime: 0, hack: 0, steal: 0, hunt: 0, race: 0, jailUntil: 0, claimOnline: 0 },
      lastActive: Date.now()
    };
    saveDB(db);
  }
  return db.users[cleanId];
}

function updateUser(userId, data) {
  const db = loadDB();
  const cleanId = cleanUserId(userId);
  db.users[cleanId] = { ...getUser(cleanId), ...data };
  saveDB(db);
}

// Pengecaman Nombor CEO Amar Kebal Semua Format WhatsApp
function checkIsCEO(m, sender) {
  if (!m) return false;
  if (m.key?.fromMe) return true; // Jika mesej dihantar oleh akaun bot itu sendiri

  const checkPool = [
    sender,
    m.key?.remoteJid,
    m.key?.participant,
    m.participant,
    m.message?.extendedTextMessage?.contextInfo?.participant
  ].filter(Boolean);

  for (let raw of checkPool) {
    const digits = raw.split('@')[0].split(':')[0].replace(/\D/g, "");
    if (CEO_NUMBER_STRINGS.some(val => digits.endsWith(val) || digits === val)) {
      return true;
    }
  }
  return false;
}

function getUserTitle(user) {
  const netWorth = (user.cash || 0) + (user.bank || 0);
  if (netWorth >= 2000000) return "👑 Bilionair Korporat";
  if (netWorth >= 800000) return "💎 Tycoon Elit";
  if (netWorth >= 300000) return "🕶️ Kingpin Siber";
  if (netWorth >= 100000) return "💼 Tauke Pasar";
  if (netWorth >= 30000) return "⚡ Runner Berpengaruh";
  if (netWorth >= 10000) return "🛵 Rider Jalanan";
  return "🧢 Gelandangan Moden";
}

const LAWYER_ARGUMENTS = [
  "Yang Arif, serbuan polis dijalankan tanpa waran geledah sah Seksyen 62 KPJ. Klien saya mangsa salah tangkap!",
  "Rakaman CCTV pangkalan data didapati telah disunting dan tidak memenuhi piawaian Akta Keterangan 1950!",
  "Pihak pendakwaan gagal mengemukakan bukti kukuh 'Actus Reus' dan 'Mens Rea' terhadap klien saya!",
  "Klien saya berada di Hangzhou pada waktu kejadian. Alibi disahkan oleh pihak pengurusan korporat!",
  "Terdapat kecacatan teknikal serius pada kertas pertuduhan. Saya mohon kes ini digugurkan serta-merta!"
];

// ==========================================
// 3. MASTER DATA
// ==========================================
const JOBS = [
  { id: 1, name: "Rider GrabFood", pay: 180 },
  { id: 2, name: "Runner Foodpanda", pay: 170 },
  { id: 3, name: "Driver Lalamove Van", pay: 250 },
  { id: 4, name: "Pemandu GrabCar", pay: 220 },
  { id: 5, name: "Kurier J&T Express", pay: 190 },
  { id: 6, name: "Penghantar Shopee Xpress", pay: 200 },
  { id: 7, name: "Despatch Mahkamah", pay: 230 },
  { id: 8, name: "Runner Pasar Selayang", pay: 210 },
  { id: 9, name: "Driver Towing Kereta", pay: 280 },
  { id: 10, name: "Pemandu Bas RapidKL", pay: 260 },
  { id: 11, name: "Penebar Roti Canai Mamak", pay: 190 },
  { id: 12, name: "Tukang Bancuh Teh Tarik", pay: 160 },
  { id: 13, name: "Peniaga Burger Ramly", pay: 240 },
  { id: 14, name: "Penjual Nasi Lemak", pay: 220 },
  { id: 15, name: "Pengusaha Carwash", pay: 270 },
  { id: 16, name: "Tauke Bundle", pay: 310 },
  { id: 17, name: "Peniaga Air Balang", pay: 250 },
  { id: 18, name: "Barista Kafe Hipster", pay: 210 },
  { id: 19, name: "Chef Ikan Bakar", pay: 350 },
  { id: 20, name: "Tauke Musang King", pay: 450 },
  { id: 21, name: "Full-Stack Web Developer", pay: 650 },
  { id: 22, name: "Software Engineer", pay: 700 },
  { id: 23, name: "Cyber Security Analyst", pay: 750 },
  { id: 24, name: "Graphic Designer", pay: 380 },
  { id: 25, name: "Jurutera Offshore", pay: 1200 },
  { id: 26, name: "Akauntan Bertauliah", pay: 520 },
  { id: 27, name: "Pegawai Bank", pay: 480 },
  { id: 28, name: "Peguam Sivil", pay: 800 },
  { id: 29, name: "Arkitek Pelan", pay: 780 },
  { id: 30, name: "Data Analyst", pay: 620 },
  { id: 31, name: "Mekanik Bengkel Turbo", pay: 360 },
  { id: 32, name: "Foreman Motor", pay: 300 },
  { id: 33, name: "Juruelektrik", pay: 340 },
  { id: 34, name: "Tukang Paip", pay: 290 },
  { id: 35, name: "Kontraktor Ubah Suai", pay: 580 },
  { id: 36, name: "Tukang Gunting", pay: 260 },
  { id: 37, name: "Jurukimpal Besi", pay: 1100 },
  { id: 38, name: "Tukang Jahit", pay: 280 },
  { id: 39, name: "Technician Laptop", pay: 320 },
  { id: 40, name: "Pemasang Tinted", pay: 300 },
  { id: 41, name: "Streamer MLBB", pay: 400 },
  { id: 42, name: "Video Editor", pay: 350 },
  { id: 43, name: "Jurugambar", pay: 390 },
  { id: 44, name: "Personal Trainer", pay: 330 },
  { id: 45, name: "Marshall Litar", pay: 310 },
  { id: 46, name: "Jurutera Bunyi", pay: 440 },
  { id: 47, name: "Ejen Hartanah", pay: 850 },
  { id: 48, name: "Guru Tuisyen", pay: 290 },
  { id: 49, name: "Pet Groomer", pay: 240 },
  { id: 50, name: "Runner Puspakom", pay: 320 }
];

const VEHICLES = [
  { id: "ex5", name: "Honda EX5 High Power", price: 3500, escapeBonus: 10, type: "Motor" },
  { id: "y15", name: "Yamaha Y15ZR V2", price: 9500, escapeBonus: 20, type: "Motor" },
  { id: "r1", name: "Yamaha YZF-R1M", price: 85000, escapeBonus: 35, type: "Superbike" },
  { id: "myvi", name: "Perodua Myvi King", price: 45000, escapeBonus: 30, type: "Kereta" },
  { id: "civic", name: "Honda Civic FK8", price: 180000, escapeBonus: 45, type: "Kereta" },
  { id: "gtr", name: "Nissan GT-R R35", price: 450000, escapeBonus: 65, type: "Supercar" },
  { id: "gt3rs", name: "Porsche 911 GT3 RS", price: 980000, escapeBonus: 75, type: "Supercar" }
];

const FOODS = [
  { id: "kopi", name: "Kopi Jantan Kaw", price: 100, targetCD: "work", desc: "Hilangkan ngantuk (Reset CD Kerja)" },
  { id: "redbull", name: "Red Bull Tin Emas", price: 350, targetCD: "crime", desc: "Energy boost (Reset CD Jenayah)" },
  { id: "vitamin", name: "Pil Vitamin Minda", price: 500, targetCD: "hack", desc: "Fokus jari dewa (Reset CD Godam)" }
];

const DEVICES = [
  { id: "nokia", name: "Nokia 3310 (Burner)", price: 250, stealthBonus: 10, desc: "Kebal trace polis (+10% Escape)" },
  { id: "vpn", name: "Mini Router VPN", price: 450, hackBonus: 10, desc: "Bypass firewall (+10% Godam)" },
  { id: "eclipse", name: "Shadow Eclipse Watch", price: 850, stealthBonus: 15, desc: "Jam rasmi syarikat (+15% Escape)" },
  { id: "drone", name: "Drone Peninjau DJI", price: 1500, stealthBonus: 20, desc: "Pantau radar polis (+20% Escape)" },
  { id: "tablet", name: "Samsung Galaxy Tab", price: 2200, workBonus: 15, desc: "Mudahkan kerja (+15% Gaji Kerja)" },
  { id: "iqoo", name: "iQOO 12 Flagship", price: 3400, workBonus: 25, desc: "Prestasi tinggi (+25% Gaji Kerja)" },
  { id: "iphone", name: "iPhone 16 Pro Max", price: 6500, workBonus: 35, desc: "Prestasi maks (+35% Gaji Kerja)" },
  { id: "pi5", name: "Raspberry Pi 5 Kit", price: 1200, hackBonus: 15, desc: "Set godam mudah alih (+15% Godam)" },
  { id: "rog", name: "Laptop ROG Zephyrus", price: 9500, hackBonus: 30, desc: "Mesin hacking padu (+30% Godam)" },
  { id: "rtx", name: "Server PC RTX 5090", price: 18000, hackBonus: 50, desc: "Penembus brute-force (+50% Godam)" }
];

const BLACKMARKET_ITEMS = [
  { id: "flipper", name: "Flipper Zero Zero-Day", price: 25000, immuneHack: false, hackBonus: 60, desc: "Alat penggodam siber (+60% Godam)" },
  { id: "jammer", name: "EMP Radio Jammer", price: 45000, immuneHack: true, desc: "Kebal 100% dari godaman musuh" },
  { id: "masterkey", name: "Kunci Master Penjara", price: 12000, type: "consumable", desc: "Pelepasan lokap secara automatik" }
];

const CRIMES = [
  { id: "ragut", name: "Ragut Beg Jalanan", baseChance: 75, rewardMin: 800, rewardMax: 2500, reqType: "motor", reqDesc: "Motor (EX5/Y15)", stars: 1 },
  { id: "rompak", name: "Rompak Kedai Emas & Bank", baseChance: 55, rewardMin: 3500, rewardMax: 9000, reqType: "car", reqDesc: "Kereta (Myvi/FK8)", stars: 2 },
  { id: "seludup_rokok", name: "Seludup Rokok Kontraban", baseChance: 70, rewardMin: 6500, rewardMax: 6500, reqItem: "nokia", reqDesc: "Nokia 3310", stars: 2 },
  { id: "seludup_gajet", name: "Seludup Komponen Gelap", baseChance: 50, rewardMin: 24000, rewardMax: 24000, reqItem: "eclipse", reqDesc: "Shadow Eclipse", stars: 3 },
  { id: "seludup_eksotik", name: "Seludup Haiwan Eksotik", baseChance: 35, rewardMin: 80000, rewardMax: 80000, reqItem: "drone", reqDesc: "Drone DJI", stars: 4 },
  { id: "seludup_cip", name: "Seludup Cip AI Cyberjaya", baseChance: 25, rewardMin: 300000, rewardMax: 300000, reqItem: "iqoo", reqDesc: "iQOO 12 / iPhone", stars: 5 },
  { id: "skimming", name: "Skimming Mesin ATM", baseChance: 45, rewardMin: 18000, rewardMax: 35000, reqItem: "pi5", reqDesc: "Raspberry Pi 5", stars: 3 },
  { id: "godam_server", name: "Godam Pangkalan Korporat", baseChance: 30, rewardMin: 60000, rewardMax: 120000, reqItem: "rog", reqDesc: "ROG / RTX 5090", stars: 4 },
  { id: "heist_kasino", name: "Heist Bilik Kebal Kasino", baseChance: 20, rewardMin: 200000, rewardMax: 500000, reqType: "supercar", reqDesc: "Supercar (GTR/GT3)", stars: 5 },
  { id: "darkweb_zero", name: "Eksploitasi Darkweb Zero", baseChance: 15, rewardMin: 600000, rewardMax: 1500000, reqItem: "flipper", reqDesc: "Flipper Zero (BM)", stars: 5 }
];

function isBlackMarketOpen() {
  const hour = new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur", hour: 'numeric', hour12: false });
  const h = parseInt(hour);
  return h >= 0 && h < 5;
}

function calculateCrimeRate(user, crime) {
  let rate = crime.baseChance;
  if (crime.reqType === "motor" && user.vehicle?.type === "Motor") rate += 20;
  if (crime.reqType === "car" && ["Kereta", "Supercar"].includes(user.vehicle?.type)) rate += 25;
  if (crime.reqType === "supercar" && user.vehicle?.type === "Supercar") rate += 35;
  if (crime.reqItem && user.phone?.id === crime.reqItem) rate += 30;
  if (crime.reqItem === "flipper" && user.inventory?.some(i => i.id === "flipper")) rate += 40;

  let vBonus = user.vehicle?.escapeBonus || 0;
  let pBonus = user.phone?.stealthBonus || 0;
  let penalty = (user.stars || 0) * 8;

  let finalRate = rate + (vBonus * 0.5) + (pBonus * 0.5) - penalty;
  return Math.random() * 100 <= Math.max(10, Math.min(95, finalRate));
}

// ==========================================
// 4. ENJIN BAILEYS WHATSAPP
// ==========================================
async function startBotEngine() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    browser: Browsers.macOS("Desktop"),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) currentQR = qr;

    if (connection === "close") {
      isConnected = false;
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        startBotEngine();
      }
    } else if (connection === "open") {
      isConnected = true;
      currentQR = null;
      console.log(`\n🔥 [${BOT_NAME.toUpperCase()} BOT ONLINE 24/7 SIAP SEDIA!]\n`);
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    try {
      if (update.action === "add") {
        const metadata = await sock.groupMetadata(update.id);
        if (metadata.subject.toLowerCase().includes("airi corner")) {
          for (let participant of update.participants) {
            const welcomeText = 
              `*⚡ AIRI CORNER : NODE ACCESS*\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n` +
              `• *Subjek:* @${participant.split("@")[0]}\n` +
              `• *Status:* Biometrik Disahkan\n` +
              `• *Pengasas:* Shadow Legacy Co., Ltd.\n` +
              `━━━━━━━━━━━━━━━━━━━━━━\n` +
              `Selamat datang! Taip *.menu* untuk memulakan konsol operasi anda.`;
            await sock.sendMessage(update.id, { text: welcomeText, mentions: [participant] });
          }
        }
      }
    } catch (e) {}
  });

  setInterval(async () => {
    try {
      const db = loadDB();
      const groupList = db.groups || [];
      if (groupList.length === 0) return;
      const targetGroup = groupList[Math.floor(Math.random() * groupList.length)];
      const groupMeta = await sock.groupMetadata(targetGroup);
      const members = groupMeta.participants.map(p => p.id);

      if (Math.random() < 0.5) {
        const picked = members.sort(() => 0.5 - Math.random()).slice(0, 3);
        let report = `*🚨 OPS CANTAS TRAFIK*\n━━━━━━━━━━━━━━━━━━━━━━\nPolis mengadakan sekatan mengejut!\n\n`;
        picked.forEach(p => {
          const u = getUser(p);
          if (u.stars > 0) {
            const denda = Math.floor(u.cash * 0.2);
            u.cash -= denda;
            u.stars = 0;
            updateUser(p, u);
            report += `⚠️ @${p.split('@')[0]} disita *RM ${denda.toLocaleString()}* (Rekod dibersihkan)\n`;
          } else {
            report += `✅ @${p.split('@')[0]} rekod bersih.\n`;
          }
        });
        report += `━━━━━━━━━━━━━━━━━━━━━━`;
        await sock.sendMessage(targetGroup, { text: report, mentions: picked });
      } else {
        const dropValue = Math.floor(Math.random() * 4000) + 2000;
        activeAirdrop = { reward: dropValue, groupId: targetGroup, claimed: false };
        let tagMsg = 
          `*📦 AIRDROP KARGO GELAP*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Kargo bernilai *RM ${dropValue.toLocaleString()}* terhempas!\n` +
          `Taip *.claim_drop* terpantas untuk kebas!\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        members.forEach(m => { tagMsg += `@${m.split('@')[0]} `; });
        await sock.sendMessage(targetGroup, { text: tagMsg, mentions: members });
      }
    } catch (e) {}
  }, 40 * 60 * 1000);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;

    const from = m.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    
    // Kenalpasti penghantar sebenar (DM mahupun Group)
    const sender = isGroup 
      ? (m.key.participant || m.participant || from)
      : (m.key.fromMe ? (sock.user?.id || from) : from);

    const body = m.message.conversation || m.message.extendedTextMessage?.text || "";

    if (isGroup) {
      const db = loadDB();
      if (!db.groups) db.groups = [];
      if (!db.groups.includes(from)) {
        db.groups.push(from);
        saveDB(db);
      }
    }

    const user = getUser(sender);
    user.cash += 2;
    user.stats.msgCount = (user.stats.msgCount || 0) + 1;
    updateUser(sender, user);

    if (!body.startsWith(".")) return;

    const args = body.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const now = Date.now();
    const isCEO = checkIsCEO(m, sender);

    // Arahan Diagnosis ID Pengguna
    if (cmd === "myid") {
      const clean = cleanUserId(sender);
      return sock.sendMessage(from, { 
        text: `*🔍 MAKLUMAT IDENTITI JID*\n━━━━━━━━━━━━━━━━━━━━━━\n• *Raw Sender:* ${sender}\n• *Clean ID:* ${clean}\n• *Status CEO:* ${isCEO ? "👑 DISAHKAN (CEO AMAR)" : "❌ PENGGUNA BIASA"}\n• *FromMe:* ${m.key.fromMe ? "Ya" : "Bukan"}\n━━━━━━━━━━━━━━━━━━━━━━` 
      }, { quoted: m });
    }

    // ==========================================
    // 🛡️ AMARAN KESELAMATAN & KUASA VETO CEO
    // ==========================================
    if (cmd.startsWith("ceo_") && !isCEO) {
      const warningUI = 
        `*🚨 PENCEROBOHAN SISTEM DIKESAN*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*AKSES DITOLAK: TAHAP KESELAMATAN 5*\n\n` +
        `Identiti anda TIDAK sepadan dengan pangkalan data *Shadow Legacy Co., Ltd.*\n` +
        `Perintah \`.${cmd}\` adalah hak mutlak milik *CEO Amar*.\n\n` +
        `_Koordinat IP dan peranti anda telah direkodkan._ 💀\n` +
        `━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: warningUI }, { quoted: m });
    }

    function extractTargetUser() {
      const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (mentioned) return cleanUserId(mentioned);
      
      // Jika taip nombor terus
      for (let arg of args) {
        const numOnly = arg.replace(/\D/g, "");
        if (numOnly.length >= 9) {
          return numOnly + "@s.whatsapp.net";
        }
      }
      return null;
    }

    if (cmd === "ceo_duit") {
      const target = extractTargetUser();
      // Ambil argumen yang mengandungi digit tulen untuk jumlah duit
      const amountArg = args.find(a => !isNaN(parseInt(a)) && parseInt(a) < 100000000000);
      const amount = parseInt(amountArg);

      if (!target || isNaN(amount)) {
        return sock.sendMessage(from, { text: `Format: \`.ceo_duit @user [jumlah]\` atau \`.ceo_duit 601166533534 [jumlah]\`` });
      }

      const targetUser = getUser(target);
      targetUser.cash += amount;
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *KUASA VETO CEO:* Suntikan tunai *+RM ${amount.toLocaleString()}* ke akaun @${target.split('@')[0]} selesai.`, mentions: [target] });
    }

    if (cmd === "ceo_jail") {
      const target = extractTargetUser();
      const minutes = parseInt(args.find(a => !isNaN(parseInt(a)))) || 10;
      if (!target) return sock.sendMessage(from, { text: `Format: \`.ceo_jail @user [minit]\`` });
      const targetUser = getUser(target);
      targetUser.cooldowns.jailUntil = now + (minutes * 60 * 1000);
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *KUASA VETO CEO:* @${target.split('@')[0]} disumbat ke penjara selama ${minutes} minit!`, mentions: [target] });
    }

    if (cmd === "ceo_freeze") {
      const target = extractTargetUser();
      if (!target) return sock.sendMessage(from, { text: `Format: \`.ceo_freeze @user\`` });
      const targetUser = getUser(target);
      targetUser.frozen = !targetUser.frozen;
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *KUASA VETO CEO:* Status akaun @${target.split('@')[0]} kini: *${targetUser.frozen ? "FROZEN (DIBEKUKAN)" : "AKTIF NORMAL"}*!`, mentions: [target] });
    }

    if (cmd === "ceo_unwanted") {
      const target = extractTargetUser();
      if (!target) return sock.sendMessage(from, { text: `Format: \`.ceo_unwanted @user\`` });
      const targetUser = getUser(target);
      targetUser.stars = 0;
      targetUser.cooldowns.jailUntil = 0;
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *KUASA VETO CEO:* Rekod jenayah @${target.split('@')[0]} telah dipadamkan sepenuhnya.`, mentions: [target] });
    }

    if (user.frozen && !cmd.startsWith("ceo_")) {
      return sock.sendMessage(from, { text: `🥶 *AKAUN ANDA DIBEKUKAN*\nAkaun anda telah dibekukan oleh CEO Amar. Hubungi beliau untuk rayuan.` }, { quoted: m });
    }

    if (user.cooldowns.jailUntil > now && !["bicara", "ikatjamin", "lokap", "myid"].includes(cmd)) {
      const rem = Math.ceil((user.cooldowns.jailUntil - now) / 1000);
      const jailUI = 
        `*🔒 LOKAP DANG WANGI*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Status: *Sedang Ditahan*\n` +
        `Baki Masa: *${rem} saat*\n\n` +
        `*Pilihan Pembebasan:*\n` +
        `1. \`.bicara free\` (40% Peluang)\n` +
        `2. \`.bicara pro\` (RM100, 85% Peluang)\n` +
        `3. \`.ikatjamin\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: jailUI }, { quoted: m });
    }

    // ==========================================
    // 🏎️ SISTEM LUMBA HARAM / STREET RACE
    // ==========================================
    if (cmd === "race" || cmd === "lumba") {
      const target = extractTargetUser();
      const bet = parseInt(args.find(a => !isNaN(parseInt(a))));

      if (!target || isNaN(bet) || bet <= 0) {
        return sock.sendMessage(from, { text: `❌ Format: \`.race @user [taruhan_cash]\`` });
      }
      if (cleanUserId(target) === cleanUserId(sender)) return sock.sendMessage(from, { text: `❌ Tak boleh lumba dengan diri sendiri!` });
      if (!user.vehicle) return sock.sendMessage(from, { text: `❌ Anda tiada kenderaan! Sila beli di \`.showroom\`.` });
      if (user.cash < bet) return sock.sendMessage(from, { text: `❌ Tunai anda tidak cukup untuk taruhan RM ${bet.toLocaleString()}!` });

      const targetUser = getUser(target);
      if (!targetUser.vehicle) return sock.sendMessage(from, { text: `❌ Sasaran tidak memiliki sebarang kenderaan!` });
      if (targetUser.cash < bet) return sock.sendMessage(from, { text: `❌ Sasaran tidak mempunyai baki tunai yang cukup!` });

      const cd = 3 * 60 * 1000;
      if (now - (user.cooldowns.race || 0) < cd) {
        const rem = Math.ceil((cd - (now - (user.cooldowns.race || 0))) / 1000);
        return sock.sendMessage(from, { text: `⏱️ Enjin kenderaan anda masih panas! Tunggu *${rem}s* lagi.` });
      }

      activeRaces[from] = {
        challenger: cleanUserId(sender),
        target: cleanUserId(target),
        bet: bet,
        timestamp: now
      };

      const challengeUI = 
        `*🏎️ CABARAN LUMBA HARAM DILEPASKAN*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Pencabar:* @${sender.split('@')[0]} (${user.vehicle.name})\n` +
        `• *Lawan:* @${target.split('@')[0]} (${targetUser.vehicle.name})\n` +
        `• *Taruhan:* RM ${bet.toLocaleString()}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `@${target.split('@')[0]}, taip *.accept_race* dalam masa 60 saat untuk sahkan litar!`;
      return sock.sendMessage(from, { text: challengeUI, mentions: [cleanUserId(sender), cleanUserId(target)] });
    }

    if (cmd === "accept_race") {
      const race = activeRaces[from];
      const curSender = cleanUserId(sender);
      if (!race || race.target !== curSender) {
        return sock.sendMessage(from, { text: `❌ Tiada sebarang cabaran lumba aktif untuk anda di kumpulan ini.` });
      }
      if (now - race.timestamp > 60 * 1000) {
        delete activeRaces[from];
        return sock.sendMessage(from, { text: `⏱️ Masa cabaran lumba telah tamat!` });
      }

      const p1 = getUser(race.challenger);
      const p2 = getUser(race.target);

      if (p1.cash < race.bet || p2.cash < race.bet) {
        delete activeRaces[from];
        return sock.sendMessage(from, { text: `❌ Duit taruhan salah seorang peserta tidak mencukupi. Lumba dibatalkan!` });
      }

      const p1Speed = (p1.vehicle?.escapeBonus || 10) + Math.floor(Math.random() * 50);
      const p2Speed = (p2.vehicle?.escapeBonus || 10) + Math.floor(Math.random() * 50);

      let winnerId, loserId, winnerVehicle, loserVehicle;
      if (p1Speed >= p2Speed) {
        winnerId = race.challenger;
        loserId = race.target;
        winnerVehicle = p1.vehicle.name;
        loserVehicle = p2.vehicle.name;
        p1.cash += race.bet;
        p2.cash -= race.bet;
        p1.stats.racesWon = (p1.stats.racesWon || 0) + 1;
      } else {
        winnerId = race.target;
        loserId = race.challenger;
        winnerVehicle = p2.vehicle.name;
        loserVehicle = p1.vehicle.name;
        p2.cash += race.bet;
        p1.cash -= race.bet;
        p2.stats.racesWon = (p2.stats.racesWon || 0) + 1;
      }

      p1.cooldowns.race = now;
      p2.cooldowns.race = now;
      updateUser(race.challenger, p1);
      updateUser(race.target, p2);
      delete activeRaces[from];

      const resultUI = 
        `*🏁 KEPUTUSAN DRAG RACE JALANAN*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🥇 *Pemenang:* @${winnerId.split('@')[0]} (${winnerVehicle})\n` +
        `🥈 *Kalah:* @${loserId.split('@')[0]} (${loserVehicle})\n` +
        `💰 *Ganjaran Dimenangi:* +RM ${(race.bet * 2).toLocaleString()}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Tayar berasap, ekzos membelah malam. Pemenang sapu bersih wang tunai!_`;
      return sock.sendMessage(from, { text: resultUI, mentions: [winnerId, loserId] });
    }

    // ==========================================
    // 🎯 SISTEM BOUNTY & PEMBURU UPAHAN
    // ==========================================
    if (cmd === "bounty") {
      const target = extractTargetUser();
      const amount = parseInt(args.find(a => !isNaN(parseInt(a))));

      if (!target || isNaN(amount) || amount < 500) {
        return sock.sendMessage(from, { text: `❌ Format: \`.bounty @user [jumlah_min_RM500]\`` });
      }
      if (cleanUserId(target) === cleanUserId(sender)) return sock.sendMessage(from, { text: `❌ Jangan letak bounty atas kepala sendiri bro!` });
      if (user.cash < amount) return sock.sendMessage(from, { text: `❌ Duit tunai anda tidak cukup untuk meletakkan bounty!` });

      user.cash -= amount;
      updateUser(sender, user);

      const db = loadDB();
      const cleanTarget = cleanUserId(target);
      db.bounties[cleanTarget] = (db.bounties[cleanTarget] || 0) + amount;
      saveDB(db);

      const bountyUI = 
        `*🎯 KONTRAK BOUNTY DIKELUARKAN*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Sasaran Diburu:* @${cleanTarget.split('@')[0]}\n` +
        `• *Nilai Tambahan:* RM ${amount.toLocaleString()}\n` +
        `• *Jumlah Terkumpul:* RM ${db.bounties[cleanTarget].toLocaleString()}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Gunakan arahan *.hunt @user* untuk memburu sasaran ini!`;
      return sock.sendMessage(from, { text: bountyUI, mentions: [cleanTarget] });
    }

    if (cmd === "bounty_list" || cmd === "bounties") {
      const db = loadDB();
      const list = Object.entries(db.bounties || {}).filter(([_, val]) => val > 0);
      if (list.length === 0) {
        return sock.sendMessage(from, { text: `📋 *SENARAI BURUAN KOSONG*\nTiada sebarang harga diletakkan atas mana-mana ahli setakat ini.` });
      }

      let ui = `*🎯 SENARAI BURUAN PALING DIKEHENDAKI*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      let mentions = [];
      list.sort((a, b) => b[1] - a[1]).forEach(([uid, val], i) => {
        ui += `*${i+1}.* @${uid.split('@')[0]} • *RM ${val.toLocaleString()}*\n`;
        mentions.push(uid);
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━\nTaip *.hunt @user* untuk tebus kepala sasaran!`;
      return sock.sendMessage(from, { text: ui, mentions: mentions });
    }

    if (cmd === "hunt" || cmd === "buru") {
      const target = extractTargetUser();
      if (!target) return sock.sendMessage(from, { text: `❌ Format: \`.hunt @user\`` });
      if (cleanUserId(target) === cleanUserId(sender)) return sock.sendMessage(from, { text: `❌ Tidak boleh memburu diri sendiri!` });

      const db = loadDB();
      const cleanTarget = cleanUserId(target);
      const bountyReward = db.bounties[cleanTarget] || 0;

      if (bountyReward <= 0) {
        return sock.sendMessage(from, { text: `❌ Sasaran ini tiada sebarang nilai bounty atas kepalanya!` });
      }

      const cd = 15 * 60 * 1000;
      if (now - (user.cooldowns.hunt || 0) < cd) {
        const rem = Math.ceil((cd - (now - (user.cooldowns.hunt || 0))) / 1000);
        return sock.sendMessage(from, { text: `⏱️ Jejak pemburu sedang disejukkan! Tunggu *${rem}s* lagi.` });
      }

      const targetUser = getUser(target);
      if (targetUser.cooldowns.jailUntil > now) {
        return sock.sendMessage(from, { text: `🔒 Sasaran kini sedang merengkuk di dalam lokap. Tunggu dia bebas!` });
      }

      let huntRate = 45 + (user.phone?.stealthBonus || 0) + (user.vehicle?.escapeBonus ? 15 : 0);
      const isSuccess = Math.random() * 100 <= Math.max(20, Math.min(85, huntRate));

      if (isSuccess) {
        user.cash += bountyReward;
        user.stats.bountiesClaimed = (user.stats.bountiesClaimed || 0) + 1;
        user.cooldowns.hunt = now;

        db.bounties[cleanTarget] = 0;
        saveDB(db);

        targetUser.cooldowns.jailUntil = now + (5 * 60 * 1000);
        targetUser.stars = Math.min(5, (targetUser.stars || 0) + 2);
        updateUser(target, targetUser);
        updateUser(sender, user);

        const huntWinUI = 
          `*🎯 KONTRAK SELESAI: SASARAN DITUMBANGKAN*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `• *Pemburu:* @${sender.split('@')[0]}\n` +
          `• *Mangsa:* @${cleanTarget.split('@')[0]}\n` +
          `• *Ganjaran Dikutip:* +RM ${bountyReward.toLocaleString()}\n` +
          `• *Hukuman Mangsa:* Disumbat ke Lokap (5 Minit)\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: huntWinUI, mentions: [cleanUserId(sender), cleanTarget] });
      } else {
        user.cooldowns.hunt = now;
        user.stars = Math.min(5, (user.stars || 0) + 1);
        user.cooldowns.jailUntil = now + (3 * 60 * 1000);
        updateUser(sender, user);

        const huntFailUI = 
          `*🚨 SERANGAN HENDAP GAGAL!*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Sasaran berjaya melepaskan diri dan menghubungi skuad peronda!\n` +
          `Anda cedera dan ditahan polis di lokap (3 Minit).\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: huntFailUI }, { quoted: m });
      }
    }

    // ==========================================
    // 1. JENAYAH, CURI POKET & OPERASI GELAP
    // ==========================================
    if (cmd === "curi" || cmd === "copet") {
      const target = extractTargetUser();
      if (!target) return sock.sendMessage(from, { text: `❌ Format: \`.curi @user\`` });
      if (cleanUserId(target) === cleanUserId(sender)) return sock.sendMessage(from, { text: `❌ Takkan nak curi duit poket sendiri bro!` });

      const cd = 10 * 60 * 1000;
      if (now - (user.cooldowns.steal || 0) < cd) {
        const rem = Math.ceil((cd - (now - (user.cooldowns.steal || 0))) / 1000);
        return sock.sendMessage(from, { text: `🚨 Anda sedang diperhatikan orang sekeliling! Tunggu *${rem}s* lagi.` });
      }

      const targetUser = getUser(target);
      if (targetUser.cash < 200) {
        return sock.sendMessage(from, { text: `❌ Dompet sasaran kering (kurang daripada RM 200 cash)!` });
      }

      let stealRate = 50 + (user.phone?.stealthBonus || 0) + (user.vehicle ? 10 : 0) - ((user.stars || 0) * 8);
      const isSuccess = Math.random() * 100 <= Math.max(15, Math.min(90, stealRate));

      if (isSuccess) {
        const percent = (Math.floor(Math.random() * 16) + 10) / 100;
        const stolen = Math.floor(targetUser.cash * percent);
        targetUser.cash -= stolen;
        user.cash += stolen;
        user.cooldowns.steal = now;
        user.stars = Math.min(5, (user.stars || 0) + 1);
        updateUser(target, targetUser);
        updateUser(sender, user);

        const curiUI = 
          `*🥷 MISI PENCOPET BERJAYA*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `• *Sasaran:* @${target.split('@')[0]}\n` +
          `• *Tunai Dikebas:* +RM ${stolen.toLocaleString()}\n` +
          `• *Wanted:* ${"⭐".repeat(user.stars)}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: curiUI, mentions: [cleanUserId(target)] }, { quoted: m });
      } else {
        const penalty = Math.min(user.cash, Math.floor(targetUser.cash * 0.1));
        user.cash -= penalty;
        targetUser.cash += penalty;
        user.cooldowns.steal = now;
        user.stars = Math.min(5, (user.stars || 0) + 2);
        user.cooldowns.jailUntil = now + (4 * 60 * 1000);
        user.stats.jailCount = (user.stats.jailCount || 0) + 1;
        updateUser(target, targetUser);
        updateUser(sender, user);

        const kantoiUI = 
          `*🚨 KANTOI MENYELUK POKET!*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Mangsa perasan dan menjerit minta tolong!\n` +
          `• *Pampasan Ganti Rugi:* -RM ${penalty.toLocaleString()} diberikan ke mangsa.\n` +
          `• *Hukuman:* Disumbat ke Lokap Dang Wangi (4 Minit).\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: kantoiUI, mentions: [cleanUserId(target)] }, { quoted: m });
      }
    }

    if (cmd === "jenayah_menu" || cmd === "crime_menu") {
      let ui = `*🔫 OPERASI GELAP & JENAYAH*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      CRIMES.forEach((c, i) => {
        ui += `*${i+1}. ${c.name}*\n`;
        ui += `   💵 Ganjaran: RM ${c.rewardMin.toLocaleString()} - RM ${c.rewardMax.toLocaleString()}\n`;
        ui += `   🎯 Syarat/Buff: ${c.reqDesc}\n`;
        ui += `   ⚡ Arahan: \`.buat_jenayah ${c.id}\`\n\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui }, { quoted: m });
    }

    if (cmd === "buat_jenayah" || cmd === "crime") {
      const cId = args[0]?.toLowerCase();
      const targetCrime = CRIMES.find(c => c.id === cId);
      if (!targetCrime) return sock.sendMessage(from, { text: `❌ ID Jenayah salah. Taip \`.jenayah_menu\` untuk semak.` });

      const cd = 12 * 60 * 1000;
      if (now - user.cooldowns.crime < cd) {
        const rem = Math.ceil((cd - (now - user.cooldowns.crime)) / 1000);
        return sock.sendMessage(from, { text: `🚨 Polis aktif meronda kawasan ini! Tunggu *${rem}s* lagi.` });
      }

      const isSuccess = calculateCrimeRate(user, targetCrime);

      if (isSuccess) {
        const reward = Math.floor(Math.random() * (targetCrime.rewardMax - targetCrime.rewardMin + 1)) + targetCrime.rewardMin;
        user.cash += reward;
        user.stars = Math.min(5, (user.stars || 0) + targetCrime.stars);
        user.cooldowns.crime = now;
        user.stats.robCount = (user.stats.robCount || 0) + 1;
        updateUser(sender, user);
        
        const successUI = 
          `*💥 MISI BERJAYA DILAKSANAKAN*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `• *Operasi:* ${targetCrime.name}\n` +
          `• *Habuan:* +RM ${reward.toLocaleString()}\n` +
          `• *Wanted:* ${"⭐".repeat(user.stars)}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: successUI }, { quoted: m });
      } else {
        user.stars = Math.min(5, (user.stars || 0) + 2);
        user.cooldowns.crime = now;
        user.cooldowns.jailUntil = now + (6 * 60 * 1000);
        user.stats.jailCount = (user.stats.jailCount || 0) + 1;
        updateUser(sender, user);
        
        const failUI = 
          `*🚨 KOD MERAH: DIKEPUNG POLIS*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Operasi *${targetCrime.name}* gagal!\n` +
          `Anda disumbat ke lokap (6 Minit).\n\n` +
          `Taip \`.bicara free\` atau \`.bicara pro\` untuk rayuan mahkamah.\n` +
          `━━━━━━━━━━━━━━━━━━━━━━`;
        return sock.sendMessage(from, { text: failUI }, { quoted: m });
      }
    }

    if (cmd === "rompak") {
      return sock.sendMessage(from, { text: `Taip \`.buat_jenayah rompak\` atau semak \`.jenayah_menu\`` });
    }

    if (cmd === "bicara") {
      if (user.cooldowns.jailUntil <= now) return sock.sendMessage(from, { text: `Lu bebas, tak perlu peguam!` });
      const tier = args[0]?.toLowerCase();

      if (tier === "free") {
        if (Math.random() <= 0.40) {
          user.cooldowns.jailUntil = 0;
          user.stars = Math.max(0, user.stars - 1);
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `*⚖️ MAHKAMAH MAJISTRET*\nPeguam Bantuan Guaman berjaya! Anda DIBEBASKAN atas isu teknikal.` }, { quoted: m });
        } else {
          user.cooldowns.jailUntil += 2 * 60 * 1000;
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `*⚖️ MAHKAMAH MAJISTRET*\nHujah ditolak hakim. Penalti +2 Minit penjara ditambah!` }, { quoted: m });
        }
      } else if (tier === "pro") {
        if (user.cash < 100) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi (RM 100 diperlukan)!` });
        user.cash -= 100;
        const randomArgument = LAWYER_ARGUMENTS[Math.floor(Math.random() * LAWYER_ARGUMENTS.length)];
        
        if (Math.random() <= 0.85) {
          user.cooldowns.jailUntil = 0;
          user.stars = 0;
          updateUser(sender, user);
          const winUI = 
            `*⚖️ HUJAH PEGUAM SENIOR KORPORAT*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `"${randomArgument}"\n\n` +
            `🔥 *Keputusan:* TIDAK BERSALAH. Rekod jenayah dipadamkan.\n` +
            `━━━━━━━━━━━━━━━━━━━━━━`;
          return sock.sendMessage(from, { text: winUI }, { quoted: m });
        } else {
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `*⚖️ MAHKAMAH TINGGI*\nBukti pendakwaan terlalu kukuh. Peguam Pro gagal, namun tiada penalti masa.` }, { quoted: m });
        }
      }
    }

    if (cmd === "ikatjamin") {
      const bail = (user.stars || 1) * 2500;
      if (user.cash < bail) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi (RM ${bail.toLocaleString()})!` });
      user.cash -= bail;
      user.stars = 0;
      user.cooldowns.jailUntil = 0;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🔓 *BEBAS IKAT JAMIN:* Bayaran jamin RM ${bail.toLocaleString()} selesai.` });
    }

    // ==========================================
    // 2. KEDAI & PAJAK GADAI
    // ==========================================
    if (cmd === "kedai") {
      let ui = `*🏪 KEDAI MAKANAN (BOOSTER)*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      FOODS.forEach((f, i) => {
        ui += `*${i+1}. ${f.name}*\n`;
        ui += `   💰 RM ${f.price} • ${f.desc}\n`;
        ui += `   🛒 \`.beli_makanan ${f.id}\`\n\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui }, { quoted: m });
    }

    if (cmd === "beli_makanan") {
      const fId = args[0]?.toLowerCase();
      const targetF = FOODS.find(f => f.id === fId);
      if (!targetF) return sock.sendMessage(from, { text: `❌ Makanan tidak sah.` });
      if (user.cash < targetF.price) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi!` });

      user.cash -= targetF.price;
      user.cooldowns[targetF.targetCD] = 0;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🍽️ Mengambil *${targetF.name}*. Cooldown *${targetF.targetCD}* telah disifarkan!` }, { quoted: m });
    }

    if (cmd === "device") {
      let ui = `*💻 GADGET & TECH STORE*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      DEVICES.forEach((d, i) => {
        ui += `*${i+1}. ${d.name}*\n`;
        ui += `   💰 RM ${d.price.toLocaleString()} • ${d.desc}\n`;
        ui += `   🛒 \`.beli_device ${d.id}\`\n\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui }, { quoted: m });
    }

    if (cmd === "beli_device") {
      const dId = args[0]?.toLowerCase();
      const targetD = DEVICES.find(d => d.id === dId);
      if (!targetD) return sock.sendMessage(from, { text: `❌ Model gajet tidak sah.` });
      if (user.cash < targetD.price) return sock.sendMessage(from, { text: `❌ Duit cash tidak mencukupi!` });

      user.cash -= targetD.price;
      user.phone = targetD;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🖥️ Pembelian disahkan! Anda kini memiliki *${targetD.name}*.` }, { quoted: m });
    }

    if (cmd === "jual_device" || cmd === "pajak_device") {
      if (!user.phone) return sock.sendMessage(from, { text: `❌ Anda tiada sebarang gajet untuk dipajak!` });
      const refund = Math.floor(user.phone.price * 0.7);
      const devName = user.phone.name;
      user.cash += refund;
      user.phone = null;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🏷️ *PAJAK GADAI TECH:* Berjaya menjual *${devName}* dengan pulangan *+RM ${refund.toLocaleString()}* (70%).` }, { quoted: m });
    }

    if (cmd === "jual_kenderaan" || cmd === "pajak_kenderaan") {
      if (!user.vehicle) return sock.sendMessage(from, { text: `❌ Anda tiada sebarang kenderaan untuk dipajak!` });
      const refund = Math.floor(user.vehicle.price * 0.7);
      const vehName = user.vehicle.name;
      user.cash += refund;
      user.vehicle = null;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🏎️ *PAJAK GADAI KENDERAAN:* Berjaya menjual *${vehName}* dengan pulangan *+RM ${refund.toLocaleString()}* (70%).` }, { quoted: m });
    }

    if (cmd === "showroom") {
      let ui = `*🏎️ SHOWROOM KENDERAAN*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      VEHICLES.forEach((v, i) => {
        ui += `*${i+1}. ${v.name}*\n`;
        ui += `   💰 RM ${v.price.toLocaleString()} • +${v.escapeBonus}% Kelajuan/Escape\n`;
        ui += `   🛒 \`.beli_kenderaan ${v.id}\`\n\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui }, { quoted: m });
    }

    if (cmd === "beli_kenderaan") {
      const vId = args[0]?.toLowerCase();
      const targetV = VEHICLES.find(v => v.id === vId);
      if (!targetV) return sock.sendMessage(from, { text: `❌ Model kenderaan tidak sah.` });
      if (user.cash < targetV.price) return sock.sendMessage(from, { text: `❌ Duit tunai tidak mencukupi!` });
      user.cash -= targetV.price;
      user.vehicle = targetV;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🎉 Tahniah! Anda telah membeli *${targetV.name}*.` }, { quoted: m });
    }

    if (cmd === "blackmarket") {
      if (!isBlackMarketOpen()) return sock.sendMessage(from, { text: `🔒 *BLACK MARKET DITUTUP*\nPasaran gelap hanya dibuka dari jam *12:00 AM - 5:00 AM* sahaja.` });
      let ui = `*🏴‍☠️ PASARAN GELAP (MIDNIGHT)*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      BLACKMARKET_ITEMS.forEach((b, i) => {
        ui += `*${i+1}. ${b.name}*\n`;
        ui += `   💰 RM ${b.price.toLocaleString()} • ${b.desc}\n`;
        ui += `   🛒 \`.beli_bm ${b.id}\`\n\n`;
      });
      ui += `━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui }, { quoted: m });
    }

    if (cmd === "beli_bm") {
      if (!isBlackMarketOpen()) return sock.sendMessage(from, { text: `🔒 Pintu masuk pasaran gelap berkunci!` });
      const bId = args[0]?.toLowerCase();
      const targetB = BLACKMARKET_ITEMS.find(b => b.id === bId);
      if (!targetB) return;
      if (user.cash < targetB.price) return sock.sendMessage(from, { text: `❌ Tunai tidak mencukupi!` });
      user.cash -= targetB.price;
      if (!user.inventory) user.inventory = [];
      user.inventory.push(targetB);
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🏴‍☠️ *TRANSAKSI BAWAH TANAH:* Berjaya memperoleh *${targetB.name}*.` }, { quoted: m });
    }

    // ==========================================
    // 3. KEWANGAN, KERJA & PROFIL
    // ==========================================
    if (cmd === "dompet" || cmd === "wallet") {
      const title = getUserTitle(user);
      const ui = 
        `*💼 PROFIL & STATUS KEWANGAN*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Pemilik:* @${sender.split('@')[0]}\n` +
        `• *Pangkat:* ${title}\n` +
        `• *Tunai:* RM ${user.cash.toLocaleString()}\n` +
        `• *Bank:* RM ${user.bank.toLocaleString()}\n` +
        `• *Jawatan:* ${user.job}\n` +
        `• *Kenderaan:* ${user.vehicle ? user.vehicle.name : "Jalan Kaki"}\n` +
        `• *Peranti:* ${user.phone ? user.phone.name : "Tiada"}\n` +
        `• *Wanted:* ${user.stars > 0 ? "⭐".repeat(user.stars) : "Bersih"}\n` +
        `• *Status Akaun:* ${user.frozen ? "❌ DIBEKUKAN" : "✅ AKTIF"}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: ui, mentions: [cleanUserId(sender)] }, { quoted: m });
    }

    if (cmd === "bank") {
      const action = args[0]?.toLowerCase();
      const amount = parseInt(args[1]);
      if (action === "dep") {
        if (isNaN(amount) || amount <= 0 || amount > user.cash) return sock.sendMessage(from, { text: `❌ Jumlah cash tidak sah!` });
        user.cash -= amount; user.bank += amount;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🏦 *MAYBANK:* Deposit *RM ${amount.toLocaleString()}* berjaya disahkan.` });
      } else if (action === "wit") {
        if (isNaN(amount) || amount <= 0 || amount > user.bank) return sock.sendMessage(from, { text: `❌ Baki bank tidak mencukupi!` });
        user.bank -= amount; user.cash += amount;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🏧 *ATM:* Pengeluaran tunai *RM ${amount.toLocaleString()}* selesai.` });
      }
      return sock.sendMessage(from, { text: `Format: \`.bank dep [jumlah]\` atau \`.bank wit [jumlah]\`` });
    }

    if (cmd === "senarai_kerja") {
      let list = `*📋 SENARAI 50 KERJAYA*\n━━━━━━━━━━━━━━━━━━━━━━\n`;
      JOBS.forEach(j => { list += `*ID ${j.id}:* ${j.name} (RM ${j.pay})\n`; });
      list += `━━━━━━━━━━━━━━━━━━━━━━\nTaip \`.pilih_kerja [ID]\` untuk menukar jawatan.`;
      return sock.sendMessage(from, { text: list }, { quoted: m });
    }

    if (cmd === "pilih_kerja") {
      const id = parseInt(args[0]);
      const found = JOBS.find(j => j.id === id);
      if (!found) return sock.sendMessage(from, { text: `❌ ID Jawatan tidak dijumpai.` });
      user.job = found.name;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `✅ Anda kini bekerja sebagai *${found.name}* (Gaji asas: RM ${found.pay}).` }, { quoted: m });
    }

    if (cmd === "kerja") {
      const cd = 5 * 60 * 1000;
      if (now - user.cooldowns.work < cd) {
        const rem = Math.ceil((cd - (now - user.cooldowns.work)) / 1000);
        return sock.sendMessage(from, { text: `⏳ Rehat syif aktif! Sila tunggu *${rem}s* atau beli booster di \`.kedai\`.` }, { quoted: m });
      }
      const curJob = JOBS.find(j => j.name === user.job) || { pay: 150, name: "Kerja Part-Time" };
      let gaji = curJob.pay;
      if (user.phone?.workBonus) gaji += Math.floor(gaji * (user.phone.workBonus / 100));
      if (user.vehicle) gaji += Math.floor(gaji * 0.15);

      user.cash += gaji;
      user.cooldowns.work = now;
      updateUser(sender, user);
      
      const workUI = 
        `*💼 SYIF SELESAI*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• *Jawatan:* ${curJob.name}\n` +
        `• *Gaji Masuk:* +RM ${gaji.toLocaleString()}\n` +
        `• *Baki Tunai:* RM ${user.cash.toLocaleString()}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: workUI }, { quoted: m });
    }

    if (cmd === "hack") {
      const target = extractTargetUser();
      if (!target) return sock.sendMessage(from, { text: `❌ Format: \`.hack @user\`` });
      const cd = 20 * 60 * 1000;
      if (now - user.cooldowns.hack < cd) return sock.sendMessage(from, { text: `🛡️ Cooldown sistem godam sedang aktif!` });

      const targetUser = getUser(target);
      if (targetUser.inventory?.some(i => i.immuneHack)) {
        user.cooldowns.hack = now; updateUser(sender, user);
        return sock.sendMessage(from, { text: `🛡️ Serangan gagal! Sasaran dilindungi oleh *EMP Radio Jammer*.` });
      }
      if (targetUser.bank < 1000) return sock.sendMessage(from, { text: `❌ Baki akaun bank sasaran kosong.` });

      let hackRate = 50 + (user.phone?.hackBonus || 0) + (user.inventory?.some(i => i.id === "flipper") ? 60 : 0);
      if (Math.random() * 100 <= hackRate) {
        const stolen = Math.floor(targetUser.bank * 0.20);
        targetUser.bank -= stolen; user.cash += stolen; user.cooldowns.hack = now;
        updateUser(target, targetUser); updateUser(sender, user);
        return sock.sendMessage(from, { text: `💻 *EKSPLOIT BERJAYA:* Rampasan *RM ${stolen.toLocaleString()}* dari akaun bank @${target.split('@')[0]}!`, mentions: [cleanUserId(target)] });
      } else {
        user.cooldowns.hack = now; updateUser(sender, user);
        return sock.sendMessage(from, { text: `🛑 Serangan godam disekat oleh sekuriti firewall mangsa!` });
      }
    }

    if (cmd === "claim_online") {
      const cd = 60 * 60 * 1000;
      if (now - user.cooldowns.claimOnline < cd) return sock.sendMessage(from, { text: `⏳ Tuntutan seterusnya dalam ${Math.ceil((cd - (now - user.cooldowns.claimOnline))/60000)} minit.` });
      const reward = 500 + (user.stats.msgCount || 0);
      user.cash += reward; user.cooldowns.claimOnline = now;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🎁 *ELAUN AKTIF:* Tuntutan kehadiran diterima: *+RM ${reward.toLocaleString()}*` });
    }

    if (cmd === "claim_drop") {
      if (!activeAirdrop || activeAirdrop.groupId !== from || activeAirdrop.claimed) return;
      user.cash += activeAirdrop.reward; activeAirdrop.claimed = true;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `⚡ @${sender.split('@')[0]} berjaya menyambar kargo tunai *+RM ${activeAirdrop.reward.toLocaleString()}*!`, mentions: [cleanUserId(sender)] });
    }

    // ==========================================
    // 📖 MENU UTAMA OS
    // ==========================================
    if (cmd === "menu" || cmd === "help") {
      const uiMenu = 
        `*⚡ AIRI STREET SYSTEM OS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*1. PROFIL & KEWANGAN*\n` +
        `• \`.dompet\` - Semak baki & pangkat\n` +
        `• \`.bank dep [RM]\` - Simpan tunai\n` +
        `• \`.bank wit [RM]\` - Keluarkan duit\n` +
        `• \`.claim_online\` - Tuntut elaun aktif\n` +
        `• \`.myid\` - Semak identiti JID anda\n\n` +
        `*2. KERJAYA HALAL*\n` +
        `• \`.senarai_kerja\` - Papar 50 jawatan\n` +
        `• \`.pilih_kerja [ID]\` - Pilih jawatan\n` +
        `• \`.kerja\` - Buat syif kutip gaji\n\n` +
        `*3. SHOWROOM & GAJET*\n` +
        `• \`.showroom\` - Beli kenderaan lumba\n` +
        `• \`.device\` - 10 Gajet tech & server\n` +
        `• \`.kedai\` - Makanan reset cooldown\n` +
        `• \`.jual_device\` / \`.jual_kenderaan\` (Pajak 70%)\n` +
        `• \`.blackmarket\` - Barangan gelap _(12AM-5AM)_\n\n` +
        `*4. LUMBA & PEMBURU UPAHAN*\n` +
        `• \`.race @user [RM]\` - Cabar drag race\n` +
        `• \`.accept_race\` - Sahkan cabaran race\n` +
        `• \`.bounty @user [RM]\` - Letak harga kepala\n` +
        `• \`.bounty_list\` - Senarai buruan aktif\n` +
        `• \`.hunt @user\` - Buru & kutip ganjaran\n\n` +
        `*5. JALANAN & JENAYAH*\n` +
        `• \`.curi @user\` - Copet tunai poket mangsa\n` +
        `• \`.hack @user\` - Godam baki bank akaun\n` +
        `• \`.jenayah_menu\` - Senarai 10 operasi gelap\n` +
        `• \`.buat_jenayah [id]\` - Laksana misi gelap\n` +
        `• \`.bicara free/pro\` - Rayuan peguam lokap\n` +
        `• \`.ikatjamin\` - Bayar jaminan lokap\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Dimiliki oleh CEO Amar • Shadow Legacy Co., Ltd._`;

      return sock.sendMessage(from, { text: uiMenu }, { quoted: m });
    }
  });
}

startBotEngine();
