import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import Groq from "groq-sdk";
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
const GROQ_KEY = process.env.GROQ_API_KEY || "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";
const groq = new Groq({ apiKey: GROQ_KEY });
const DB_FILE = "./database.json";
const BOT_NAME = "Airi";

// Pengecaman Nombor CEO Amar
const CEO_NUMBERS = ["601166533534", "01166533534", "1166533534"];

let activeAirdrop = null; 

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, groups: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getUser(userId) {
  const db = loadDB();
  const cleanId = userId.replace(/:\d+/, "");
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
      stats: { successJobs: 0, jailCount: 0, robCount: 0, msgCount: 0 },
      cooldowns: { work: 0, crime: 0, hack: 0, jailUntil: 0, claimOnline: 0 },
      lastActive: Date.now()
    };
    saveDB(db);
  }
  return db.users[cleanId];
}

function updateUser(userId, data) {
  const db = loadDB();
  const cleanId = userId.replace(/:\d+/, "");
  db.users[cleanId] = { ...getUser(cleanId), ...data };
  saveDB(db);
}

function checkIsCEO(senderJid) {
  const cleanNum = senderJid.replace(/:\d+/, "").replace(/@.+/, "").replace(/\D/g, "");
  return CEO_NUMBERS.some(num => cleanNum.endsWith(num) || cleanNum === num);
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

async function askAI(prompt, systemPrompt = null) {
  try {
    const persona = systemPrompt || 
      `Kau adalah ${BOT_NAME}, bot WhatsApp Malaysia streetwise, santai, padu. Pemilik rasmi kau CEO Amar dari Shadow Legacy Co., Ltd. Balas secara ringkas, padat dan natural.`;
    
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: persona },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    return res.choices[0]?.message?.content || "Tiada respon dari AI.";
  } catch (e) {
    console.error("Groq Error:", e);
    return `⚡ Ralat AI: ${e.message}`;
  }
}

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
      console.log(`\n🔥 [${BOT_NAME.toUpperCase()} BOT ONLINE 24/7 DENGAN UI BAHARU!]\n`);
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
              `• *A.I. Host:* Shadow Legacy Co., Ltd.\n` +
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
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = m.key.participant || from;
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
    const isCEO = checkIsCEO(sender);

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

    if (cmd === "ceo_duit") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amount = parseInt(args[1]);
      if (!target || isNaN(amount)) return sock.sendMessage(from, { text: `Format: \`.ceo_duit @user [jumlah]\`` });
      const targetUser = getUser(target);
      targetUser.cash += amount;
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *KUASA VETO CEO:* Suntikan tunai *+RM ${amount.toLocaleString()}* ke akaun @${target.split('@')[0]} selesai.`, mentions: [target] });
    }

    if (cmd === "ceo_jail") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const minutes = parseInt(args[1]) || 10;
      if (!target) return sock.sendMessage(from, { text: `Format: \`.ceo_jail @user [minit]\`` });
      const targetUser = getUser(target);
      targetUser.cooldowns.jailUntil = now + (minutes * 60 * 1000);
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *KUASA VETO CEO:* @${target.split('@')[0]} disumbat ke penjara selama ${minutes} minit!`, mentions: [target] });
    }

    if (cmd === "ceo_freeze") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return sock.sendMessage(from, { text: `Format: \`.ceo_freeze @user\`` });
      const targetUser = getUser(target);
      targetUser.frozen = !targetUser.frozen;
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *KUASA VETO CEO:* Status akaun @${target.split('@')[0]} kini: *${targetUser.frozen ? "FROZEN (DIBEKUKAN)" : "AKTIF NORMAL"}*!`, mentions: [target] });
    }

    if (cmd === "ceo_unwanted") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
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

    if (user.cooldowns.jailUntil > now && !["bicara", "ikatjamin", "lokap"].includes(cmd)) {
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

    // 1. 10 JENAYAH
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
        const debateText = await askAI("Beri satu baris hujah undang-undang korporat Malaysia yang sangat mantap untuk bebaskan klien.");
        if (Math.random() <= 0.85) {
          user.cooldowns.jailUntil = 0;
          user.stars = 0;
          updateUser(sender, user);
          const winUI = 
            `*⚖️ HUJAH PEGUAM SENIOR KORPORAT*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `"${debateText}"\n\n` +
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

    // 2. KEDAI & PAJAK GADAI
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
        ui += `   💰 RM ${v.price.toLocaleString()} • +${v.escapeBonus}% Escape\n`;
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

    // 3. KEWANGAN & KERJAYA
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
      return sock.sendMessage(from, { text: ui, mentions: [sender] }, { quoted: m });
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
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
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
        return sock.sendMessage(from, { text: `💻 *EKSPLOIT BERJAYA:* Rampasan *RM ${stolen.toLocaleString()}* dari akaun bank @${target.split('@')[0]}!`, mentions: [target] });
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
      return sock.sendMessage(from, { text: `⚡ @${sender.split('@')[0]} berjaya menyambar kargo tunai *+RM ${activeAirdrop.reward.toLocaleString()}*!`, mentions: [sender] });
    }

    if (cmd === "ai" || cmd === "tanya") {
      const prompt = args.join(" ");
      if (!prompt) return sock.sendMessage(from, { text: "Contoh: `.ai apa khabar?`" });
      const reply = await askAI(prompt);
      return sock.sendMessage(from, { text: reply }, { quoted: m });
    }

    if (cmd === "menu" || cmd === "help") {
      const uiMenu = 
        `*⚡ AIRI STREET SYSTEM OS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*1. PROFIL & KEWANGAN*\n` +
        `• \`.dompet\` - Semak baki & pangkat\n` +
        `• \`.bank dep [RM]\` - Simpan tunai\n` +
        `• \`.bank wit [RM]\` - Keluarkan duit\n` +
        `• \`.claim_online\` - Tuntut elaun aktif\n\n` +
        `*2. KERJAYA HALAL*\n` +
        `• \`.senarai_kerja\` - Papar 50 jawatan\n` +
        `• \`.pilih_kerja [ID]\` - Pilih jawatan\n` +
        `• \`.kerja\` - Buat syif kutip gaji\n\n` +
        `*3. PERNIAGAAN & GAJET*\n` +
        `• \`.kedai\` - Makanan reset cooldown\n` +
        `• \`.device\` - 10 Gajet tech & server\n` +
        `• \`.showroom\` - Kenderaan lari polis\n` +
        `• \`.jual_device\` / \`.jual_kenderaan\` (Pajak 70%)\n` +
        `• \`.blackmarket\` - Barangan gelap _(12AM-5AM)_\n\n` +
        `*4. JALANAN & JENAYAH*\n` +
        `• \`.jenayah_menu\` - Senarai 10 operasi gelap\n` +
        `• \`.buat_jenayah [id]\` - Laksana misi gelap\n` +
        `• \`.bicara free/pro\` - Rayuan peguam lokap\n` +
        `• \`.ikatjamin\` - Bayar jaminan lokap\n` +
        `• \`.hack @user\` - Godam bank musuh\n\n` +
        `*5. KECERDASAN BUATAN*\n` +
        `• \`.ai [soalan]\` - Groq LLaMA 3.3 Engine\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `_Dimiliki oleh CEO Amar • Shadow Legacy Co., Ltd._`;

      return sock.sendMessage(from, { text: uiMenu }, { quoted: m });
    }
  });
}

startBotEngine();
