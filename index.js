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
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const DB_FILE = "./database.json";
const BOT_NAME = "Airi";
const OWNER_CEO = "601166533534@s.whatsapp.net"; // Kuasa Veto CEO Amar

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
  if (!db.users[userId]) {
    db.users[userId] = {
      cash: 1000,
      bank: 5000,
      stars: 0,
      job: "Penganggur",
      vehicle: null,
      phone: null,
      inventory: [],
      stats: { successJobs: 0, jailCount: 0, robCount: 0, msgCount: 0 },
      cooldowns: { work: 0, rob: 0, smuggle: 0, hack: 0, jailUntil: 0, claimOnline: 0 },
      lastActive: Date.now()
    };
    saveDB(db);
  }
  return db.users[userId];
}

function updateUser(userId, data) {
  const db = loadDB();
  db.users[userId] = { ...getUser(userId), ...data };
  saveDB(db);
}

async function askGroq(prompt, systemPrompt = null) {
  try {
    const persona = systemPrompt || 
      `Kau adalah ${BOT_NAME}, bot WhatsApp Malaysia bergaya streetwise, berpengetahuan luas, santai tapi padu. Pemilik kau adalah CEO Amar dari Shadow Legacy Co., Ltd.`;
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: persona },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    return res.choices[0]?.message?.content || "Tiada respon dari pelayan AI.";
  } catch (e) {
    console.error("Groq Error:", e);
    return "⚡ Ralat komunikasi pelayan AI Groq.";
  }
}

// ==========================================
// 3. MASTER DATA LENGKAP
// ==========================================
const JOBS = [
  { id: 1, name: "Rider GrabFood", pay: 180 },
  { id: 2, name: "Runner Foodpanda", pay: 170 },
  { id: 3, name: "Driver Lalamove Van", pay: 250 },
  { id: 4, name: "Pemandu GrabCar", pay: 220 },
  { id: 5, name: "Kurier J&T Express", pay: 190 },
  { id: 6, name: "Penghantar Shopee Xpress", pay: 200 },
  { id: 7, name: "Despatch Mahkamah", pay: 230 },
  { id: 8, name: "Runner Borong Pasar Selayang", pay: 210 },
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

// MAKANAN UNTUK RESET COOLDOWN (KEDAI BIASA)
const FOODS = [
  { id: "kopi", name: "Kopi Jantan Kaw", price: 100, targetCD: "work", desc: "Hilangkan ngantuk. Reset cooldown kerja." },
  { id: "redbull", name: "Red Bull Tin Emas", price: 350, targetCD: "rob", desc: "Energy boost! Reset cooldown merompak." },
  { id: "nasikandar", name: "Nasi Kandar Ganja", price: 600, targetCD: "smuggle", desc: "Fokus 100%. Reset cooldown seludup." },
  { id: "vitamin", name: "Pil Vitamin Minda", price: 500, targetCD: "hack", desc: "Fokus jari dewa. Reset cooldown godam." }
];

// 10 JENIS GAJET DI KEDAI DEVICE
const DEVICES = [
  { id: "nokia", name: "Nokia 3310 (Burner)", price: 250, stealthBonus: 10, desc: "Kebal trace polis asas (+10% Escape)" },
  { id: "vpn", name: "Mini Router VPN", price: 450, hackBonus: 10, desc: "Bypass firewall asas (+10% Godam)" },
  { id: "eclipse", name: "Shadow Eclipse Smartwatch", price: 850, stealthBonus: 15, desc: "Jam rasmi Shadow Legacy (+15% Escape)" },
  { id: "drone", name: "Drone Peninjau DJI", price: 1500, stealthBonus: 20, desc: "Pantau polis dari udara (+20% Escape)" },
  { id: "tablet", name: "Samsung Galaxy Tab", price: 2200, workBonus: 15, desc: "Mudahkan tugas pejabat (+15% Gaji Kerja)" },
  { id: "iqoo", name: "iQOO 12 Flagship", price: 3400, workBonus: 25, desc: "Lancar buat kerja berat (+25% Gaji Kerja)" },
  { id: "iphone", name: "iPhone 16 Pro Max", price: 6500, workBonus: 35, desc: "Prestasi maksimum (+35% Gaji Kerja)" },
  { id: "pi5", name: "Raspberry Pi 5 Kit", price: 1200, hackBonus: 15, desc: "Set godam mudah alih (+15% Godam)" },
  { id: "rog", name: "Laptop ROG Zephyrus", price: 9500, hackBonus: 30, desc: "Mesin hacking padu (+30% Godam)" },
  { id: "rtx", name: "Server PC RTX 5090", price: 18000, hackBonus: 50, desc: "Penembus brute-force bank (+50% Godam)" }
];

// BARANGAN BLACK MARKET (12 AM - 5 AM)
const BLACKMARKET_ITEMS = [
  { id: "flipper", name: "Flipper Zero Zero-Day", price: 25000, immuneHack: false, hackBonus: 60, desc: "Alat penggodam tersirat (+60% Godam)" },
  { id: "jammer", name: "EMP Radio Jammer", price: 45000, immuneHack: true, desc: "Kebal 100% daripada diserang godam" },
  { id: "masterkey", name: "Kunci Master Penjara", price: 12000, type: "consumable", desc: "Pelepasan lokap automatik (Boleh guna di lokap)" }
];

const SMUGGLE_ROUTES = [
  { id: "rokok", name: "Rokok Kontraban", baseChance: 70, reward: 6500 },
  { id: "gajet", name: "Komponen Gelap", baseChance: 50, reward: 24000 },
  { id: "eksotik", name: "Haiwan Eksotik", baseChance: 35, reward: 80000 },
  { id: "cip", name: "Cip AI Rahsia", baseChance: 20, reward: 300000 }
];

const CRIME_TARGETS = [
  "Maybank Menara Raja Chulan",
  "Habib Jewels KLCC",
  "Petronas Bukit Bintang",
  "7-Eleven Chow Kit",
  "CIMB Dataran Merdeka"
];

function isBlackMarketOpen() {
  const hour = new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur", hour: 'numeric', hour12: false });
  const h = parseInt(hour);
  return h >= 0 && h < 5;
}

function calculateChance(user, baseChance = 50) {
  let vBonus = user.vehicle?.escapeBonus || 0;
  let pBonus = user.phone?.stealthBonus || 0;
  let penalty = (user.stars || 0) * 10;
  let finalRate = baseChance + vBonus + pBonus - penalty;
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
      console.log(`\n🔥 [${BOT_NAME.toUpperCase()} BOT ONLINE 24/7!]\n`);
    }
  });

  // Welcome Message Airi Corner
  sock.ev.on("group-participants.update", async (update) => {
    try {
      if (update.action === "add") {
        const metadata = await sock.groupMetadata(update.id);
        if (metadata.subject.toLowerCase().includes("airi corner")) {
          for (let participant of update.participants) {
            const welcomeText = 
              `╔════════════════════════════╗\n` +
              `║  ⚡ AIRI CORNER : SYSTEM ⚡  ║\n` +
              `╚════════════════════════════╝\n\n` +
              `👤 *SUBJEK BARU:* @${participant.split("@")[0]}\n` +
              `🛡️ *BIOMETRIK:* DISAHKAN\n` +
              `🏢 *A.I. HOST:* Shadow Legacy Co., Ltd.\n\n` +
              `Selamat datang ke pangkalan data rasmi. Taip \`.menu\` untuk mulakan log ekonomi jalanan anda.`;
            await sock.sendMessage(update.id, { text: welcomeText, mentions: [participant] });
          }
        }
      }
    } catch (e) {}
  });

  // Random Event (40 Minit)
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
        let report = `🚨 *[OPS CANTAS TRAFIK]* 🚨\nPolis buat sekatan rawak!\n\n`;
        picked.forEach(p => {
          const u = getUser(p);
          if (u.stars > 0) {
            const denda = Math.floor(u.cash * 0.2);
            u.cash -= denda;
            u.stars = 0;
            updateUser(p, u);
            report += `⚠️ @${p.split('@')[0]} disita *RM ${denda.toLocaleString()}* (Rekod dibersihkan)\n`;
          } else {
            report += `✅ @${p.split('@')[0]} lulus rekod bersih.\n`;
          }
        });
        await sock.sendMessage(targetGroup, { text: report, mentions: picked });
      } else {
        const dropValue = Math.floor(Math.random() * 4000) + 2000;
        activeAirdrop = { reward: dropValue, groupId: targetGroup, claimed: false };
        let tagMsg = `📦 *[AIRDROP KARGO GELAP]* 📦\nKargo RM ${dropValue.toLocaleString()} jatuh! Taip \`.claim_drop\` pantas!\n\n`;
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
    user.cash += 2; // Passive chat reward
    user.stats.msgCount = (user.stats.msgCount || 0) + 1;
    updateUser(sender, user);

    if (!body.startsWith(".")) return;

    const args = body.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const now = Date.now();
    const isCEO = sender === OWNER_CEO;

    // ==========================================
    // 🛡️ AMARAN KESELAMATAN CEO VETO
    // ==========================================
    if (cmd.startsWith("ceo_") && !isCEO) {
      const warningUI = 
        `╔══════════════════════════════════╗\n` +
        `║ 🚨 PENCEROBOHAN SISTEM DIKESAN 🚨 ║\n` +
        `╚══════════════════════════════════╝\n\n` +
        `⚠️ *AKSES DITOLAK: PROTOKOL KESELAMATAN TAHAP 5*\n\n` +
        `Identiti anda TIDAK sepadan dengan pangkalan data *Shadow Legacy Co., Ltd.*\n` +
        `Perintah \`${cmd}\` adalah HAK MUTLAK milik **CEO Amar** sahaja.\n\n` +
        `_Amaran: Skuad elit siber telah merekodkan koordinat IP dan nombor telefon anda. Jangan cuba lagi._💀`;
      return sock.sendMessage(from, { text: warningUI }, { quoted: m });
    }

    if (cmd === "ceo_duit") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amount = parseInt(args[1]);
      if (!target || isNaN(amount)) return sock.sendMessage(from, { text: `Format: \`.ceo_duit @user [jumlah]\`` });
      const targetUser = getUser(target);
      targetUser.cash += amount;
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *[KUASA VETO CEO]* RM ${amount.toLocaleString()} disuntik ke akaun @${target.split('@')[0]}!`, mentions: [target] });
    }

    if (cmd === "ceo_jail") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const minutes = parseInt(args[1]) || 10;
      if (!target) return sock.sendMessage(from, { text: `Format: \`.ceo_jail @user [minit]\`` });
      const targetUser = getUser(target);
      targetUser.cooldowns.jailUntil = now + (minutes * 60 * 1000);
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *[KUASA VETO CEO]* @${target.split('@')[0]} disumbat ke penjara ${minutes} minit!`, mentions: [target] });
    }

    if (cmd === "ceo_unwanted") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return sock.sendMessage(from, { text: `Format: \`.ceo_unwanted @user\`` });
      const targetUser = getUser(target);
      targetUser.stars = 0;
      targetUser.cooldowns.jailUntil = 0;
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *[KUASA VETO CEO]* Rekod jenayah @${target.split('@')[0]} dipadam sepenuhnya.`, mentions: [target] });
    }

    // Kawalan Lokap
    if (user.cooldowns.jailUntil > now && !["bicara", "ikatjamin", "lokap"].includes(cmd)) {
      const rem = Math.ceil((user.cooldowns.jailUntil - now) / 1000);
      return sock.sendMessage(from, { 
        text: `🔒 *[LOKAP DANG WANGI]*\nLu ditahan! Baki: *${rem}s*.\nPilihan:\n1. \`.bicara free\` (40% Peluang)\n2. \`.bicara pro\` (RM100, 85% Peluang)\n3. \`.ikatjamin\`` 
      }, { quoted: m });
    }

    if (cmd === "bicara") {
      if (user.cooldowns.jailUntil <= now) return sock.sendMessage(from, { text: `Lu bebas, tak perlu peguam!` });
      const tier = args[0]?.toLowerCase();

      if (tier === "free") {
        if (Math.random() <= 0.40) {
          user.cooldowns.jailUntil = 0;
          user.stars = Math.max(0, user.stars - 1);
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `⚖️ *Bantuan Guaman berjaya!* Lu dibebaskan atas kecacatan teknikal waran.` }, { quoted: m });
        } else {
          user.cooldowns.jailUntil += 2 * 60 * 1000;
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `⚖️ *Peguam free gagal!* Penalti +2 Minit penjara.` }, { quoted: m });
        }
      } else if (tier === "pro") {
        if (user.cash < 100) return sock.sendMessage(from, { text: `❌ Cash tak cukup RM 100!` });
        user.cash -= 100;
        const groqDebate = await askGroq("Beri satu baris hujah undang-undang korporat Malaysia yang sangat teknikal untuk membebaskan klien.");
        if (Math.random() <= 0.85) {
          user.cooldowns.jailUntil = 0;
          user.stars = 0;
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `⚖️ *PEGUAM PRO BERHUJAH:*\n_"${groqDebate}"_\n\n🔥 Hakim memutuskan lu *TIDAK BERSALAH*! Rekod dipadam.` }, { quoted: m });
        } else {
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `⚖️ Bukti CCTV terlalu jelas. Peguam Pro gagal, tapi tiada penalti masa.` }, { quoted: m });
        }
      }
    }

    // ==========================================
    // 🏪 KEDAI MAKANAN (RESET COOLDOWN)
    // ==========================================
    if (cmd === "kedai") {
      let ui = `╔════════════════════════════╗\n║ 🏪 KEDAI MAKANAN (BOOSTER) ║\n╚════════════════════════════╝\n\n`;
      FOODS.forEach((f, i) => {
        ui += `*${i+1}. ${f.name}*\n   💰 RM ${f.price} | ℹ️ ${f.desc}\n   🛒 \`.beli_makanan ${f.id}\`\n\n`;
      });
      return sock.sendMessage(from, { text: ui }, { quoted: m });
    }

    if (cmd === "beli_makanan") {
      const fId = args[0]?.toLowerCase();
      const targetF = FOODS.find(f => f.id === fId);
      if (!targetF) return sock.sendMessage(from, { text: `❌ Makanan tak wujud dalam menu.` });
      if (user.cash < targetF.price) return sock.sendMessage(from, { text: `❌ Duit tak cukup nak makan!` });

      user.cash -= targetF.price;
      user.cooldowns[targetF.targetCD] = 0; // Reset Cooldown terus
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🍽️ Siap telan *${targetF.name}*! Kesan ubat bertindak: Cooldown *${targetF.targetCD}* lu dah reset.` }, { quoted: m });
    }

    // ==========================================
    // 💻 KEDAI DEVICE (10 GAJET)
    // ==========================================
    if (cmd === "device") {
      let ui = `╔════════════════════════════╗\n║ 💻 SYARIKAT DEVICE & TECH  ║\n╚════════════════════════════╝\n\n`;
      DEVICES.forEach((d, i) => {
        ui += `*${i+1}. ${d.name}*\n   💰 RM ${d.price.toLocaleString()}\n   ℹ️ ${d.desc}\n   🛒 \`.beli_device ${d.id}\`\n\n`;
      });
      return sock.sendMessage(from, { text: ui }, { quoted: m });
    }

    if (cmd === "beli_device") {
      const dId = args[0]?.toLowerCase();
      const targetD = DEVICES.find(d => d.id === dId);
      if (!targetD) return sock.sendMessage(from, { text: `❌ Model gajet tidak sah.` });
      if (user.cash < targetD.price) return sock.sendMessage(from, { text: `❌ Duit cash tak cukup bro!` });

      user.cash -= targetD.price;
      user.phone = targetD;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🖥️ Resit Pembelian Sah: Berjaya memiliki *${targetD.name}*!` }, { quoted: m });
    }

    // SHOWROOM & KENDERAAN
    if (cmd === "showroom") {
      let ui = `╔════════════════════════════╗\n║ 🏎️ SHOWROOM KENDERAAN ASING║\n╚════════════════════════════╝\n\n`;
      VEHICLES.forEach((v, i) => {
        ui += `*${i+1}. ${v.name}*\n   💰 RM ${v.price.toLocaleString()} | ⚡ +${v.escapeBonus}% Escape\n   🛒 \`.beli_kenderaan ${v.id}\`\n\n`;
      });
      return sock.sendMessage(from, { text: ui }, { quoted: m });
    }

    if (cmd === "beli_kenderaan") {
      const vId = args[0]?.toLowerCase();
      const targetV = VEHICLES.find(v => v.id === vId);
      if (!targetV) return sock.sendMessage(from, { text: `❌ Model tak sah.` });
      if (user.cash < targetV.price) return sock.sendMessage(from, { text: `❌ Duit tak cukup!` });
      user.cash -= targetV.price;
      user.vehicle = targetV;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🎉 Bawa pulang *${targetV.name}* baharu!` }, { quoted: m });
    }

    // BLACK MARKET
    if (cmd === "blackmarket") {
      if (!isBlackMarketOpen()) return sock.sendMessage(from, { text: `🔒 *[BLACK MARKET BERKUNCI]*\nBuka jam *12:00 AM - 5:00 AM* sahaja.` });
      let ui = `╔════════════════════════════╗\n║ 🏴‍☠️ PASARAN GELAP (MIDNIGHT)║\n╚════════════════════════════╝\n\n`;
      BLACKMARKET_ITEMS.forEach((b, i) => {
        ui += `*${i+1}. ${b.name}*\n   💰 RM ${b.price.toLocaleString()}\n   ℹ️ ${b.desc}\n   🛒 \`.beli_bm ${b.id}\`\n\n`;
      });
      return sock.sendMessage(from, { text: ui }, { quoted: m });
    }

    if (cmd === "beli_bm") {
      if (!isBlackMarketOpen()) return sock.sendMessage(from, { text: `🔒 Buka tengah malam bro.` });
      const bId = args[0]?.toLowerCase();
      const targetB = BLACKMARKET_ITEMS.find(b => b.id === bId);
      if (!targetB) return;
      if (user.cash < targetB.price) return sock.sendMessage(from, { text: `❌ Tunai kurang!` });
      user.cash -= targetB.price;
      if (!user.inventory) user.inventory = [];
      user.inventory.push(targetB);
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🏴‍☠️ Seludup masuk *${targetB.name}* secara rahsia.` }, { quoted: m });
    }

    // KEWANGAN & DOMPET
    if (cmd === "dompet" || cmd === "wallet") {
      const ui = 
        `╔════════════════════════════╗\n` +
        `║ 💼 STATUS PROFIL & KEWANGAN ║\n` +
        `╚════════════════════════════╝\n\n` +
        `👤 Pemilik: @${sender.split('@')[0]}\n` +
        `💵 Cash Tunai: *RM ${user.cash.toLocaleString()}*\n` +
        `🏦 Bank Akaun: *RM ${user.bank.toLocaleString()}*\n` +
        `🛠️ Pekerjaan: *${user.job}*\n` +
        `🏎️ Kenderaan: *${user.vehicle ? user.vehicle.name : "Kaki Ayam"}*\n` +
        `💻 Gajet: *${user.phone ? user.phone.name : "Tiada"}*\n` +
        `⭐ Wanted: *${user.stars > 0 ? "⭐".repeat(user.stars) : "Bersih"}*`;
      return sock.sendMessage(from, { text: ui, mentions: [sender] }, { quoted: m });
    }

    if (cmd === "bank") {
      const action = args[0]?.toLowerCase();
      const amount = parseInt(args[1]);
      if (action === "dep") {
        if (isNaN(amount) || amount <= 0 || amount > user.cash) return;
        user.cash -= amount; user.bank += amount;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🏦 Deposit *RM ${amount.toLocaleString()}* sah.` });
      } else if (action === "wit") {
        if (isNaN(amount) || amount <= 0 || amount > user.bank) return;
        user.bank -= amount; user.cash += amount;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🏧 Withdraw *RM ${amount.toLocaleString()}* tunai.` });
      }
    }

    // KERJA
    if (cmd === "senarai_kerja") {
      let list = `📋 *[SENARAI 50 KERJAYA]*\n\n`;
      JOBS.forEach(j => { list += `*ID ${j.id}:* ${j.name} (RM ${j.pay})\n`; });
      list += `\nTaip \`.pilih_kerja [ID]\``;
      return sock.sendMessage(from, { text: list }, { quoted: m });
    }

    if (cmd === "pilih_kerja") {
      const id = parseInt(args[0]);
      const found = JOBS.find(j => j.id === id);
      if (!found) return;
      user.job = found.name;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `✅ Berkerja sebagai *${found.name}*.` }, { quoted: m });
    }

    if (cmd === "kerja") {
      const cd = 5 * 60 * 1000;
      if (now - user.cooldowns.work < cd) {
        const rem = Math.ceil((cd - (now - user.cooldowns.work)) / 1000);
        return sock.sendMessage(from, { text: `⏳ Rehat dulu bro! (Baki: *${rem}s*).\nBeli minuman di \`.kedai\` untuk reset masa.` }, { quoted: m });
      }
      const curJob = JOBS.find(j => j.name === user.job) || { pay: 150, name: "Kerja Part-Time" };
      let gaji = curJob.pay;
      if (user.phone?.workBonus) gaji += Math.floor(gaji * (user.phone.workBonus / 100));
      if (user.vehicle) gaji += Math.floor(gaji * 0.15);

      user.cash += gaji;
      user.cooldowns.work = now;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `💼 *[SYIF SELESAI]* Gaji: *+RM ${gaji.toLocaleString()}*` }, { quoted: m });
    }

    // JENAYAH & GODAM
    if (cmd === "rompak") {
      const cd = 15 * 60 * 1000;
      if (now - user.cooldowns.rob < cd) return sock.sendMessage(from, { text: `🚨 Skuad ronda aktif! Baki masa selamat: *${Math.ceil((cd - (now - user.cooldowns.rob)) / 1000)}s*.` });
      
      const targetPlace = CRIME_TARGETS[Math.floor(Math.random() * CRIME_TARGETS.length)];
      if (calculateChance(user, 50)) {
        const loot = Math.floor(Math.random() * 4000) + 1200;
        user.cash += loot; user.stars = Math.min(5, user.stars + 1);
        user.cooldowns.rob = now;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `💥 Rompak *${targetPlace}*!\n💰 Dapat: *+RM ${loot.toLocaleString()}*\n⭐ Wanted: ${"⭐".repeat(user.stars)}` });
      } else {
        user.stars = Math.min(5, user.stars + 2);
        user.cooldowns.rob = now; user.cooldowns.jailUntil = now + (5 * 60 * 1000);
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🚨 Kantoi merompak! Sila masuk lokap 5 minit.` });
      }
    }

    if (cmd === "hack") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return sock.sendMessage(from, { text: `❌ Tag sasaran: \`.hack @user\`` });
      const cd = 20 * 60 * 1000;
      if (now - user.cooldowns.hack < cd) return sock.sendMessage(from, { text: `🛡️ Cooldown hack aktif! Tunggu sistem sejuk.` });

      const targetUser = getUser(target);
      if (targetUser.inventory?.some(i => i.immuneHack)) {
        user.cooldowns.hack = now; updateUser(sender, user);
        return sock.sendMessage(from, { text: `🛡️ Gagal! Firewall musuh dilindungi Jammer EMP.` });
      }
      if (targetUser.bank < 1000) return sock.sendMessage(from, { text: `❌ Akaun bank sasaran kering.` });

      let hackRate = 50 + (user.phone?.hackBonus || 0) + (user.inventory?.some(i => i.id === "flipper") ? 60 : 0);
      if (Math.random() * 100 <= hackRate) {
        const stolen = Math.floor(targetUser.bank * 0.20);
        targetUser.bank -= stolen; user.cash += stolen; user.cooldowns.hack = now;
        updateUser(target, targetUser); updateUser(sender, user);
        return sock.sendMessage(from, { text: `💻 *[HACK BERJAYA]* Rampas *RM ${stolen.toLocaleString()}* dari @${target.split('@')[0]}!`, mentions: [target] });
      } else {
        user.cooldowns.hack = now; updateUser(sender, user);
        return sock.sendMessage(from, { text: `🛑 Sekuriti bank kebal. Godam gagal!` });
      }
    }

    if (cmd === "slot") {
      const bet = parseInt(args[0]);
      if (isNaN(bet) || bet <= 0 || bet > user.cash) return;
      const icons = ["🍒", "🍋", "🍉", "⭐", "💎", "7️⃣"];
      const r1 = icons[Math.floor(Math.random() * 6)], r2 = icons[Math.floor(Math.random() * 6)], r3 = icons[Math.floor(Math.random() * 6)];
      if (r1 === r2 && r2 === r3) {
        user.cash += bet * 5; updateUser(sender, user);
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n🔥 JACKPOT: *+RM ${(bet * 5).toLocaleString()}*!` });
      } else {
        user.cash -= bet; updateUser(sender, user);
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n❌ Rugi: *-RM ${bet.toLocaleString()}*!` });
      }
    }

    // AI & CLAIM
    if (cmd === "claim_online") {
      const cd = 60 * 60 * 1000;
      if (now - user.cooldowns.claimOnline < cd) return sock.sendMessage(from, { text: `⏳ Tuntutan seterusnya dalam ${Math.ceil((cd - (now - user.cooldowns.claimOnline))/60000)} minit.` });
      const reward = 500 + (user.stats.msgCount || 0);
      user.cash += reward; user.cooldowns.claimOnline = now;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🎁 Elaun online dikutip: *+RM ${reward.toLocaleString()}*` });
    }

    if (cmd === "claim_drop") {
      if (!activeAirdrop || activeAirdrop.groupId !== from || activeAirdrop.claimed) return;
      user.cash += activeAirdrop.reward; activeAirdrop.claimed = true;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `⚡ @${sender.split('@')[0]} menyapu licin kargo *RM ${activeAirdrop.reward.toLocaleString()}*!`, mentions: [sender] });
    }

    if (cmd === "ai" || cmd === "tanya") {
      const prompt = args.join(" ");
      if (!prompt) return;
      const reply = await askGroq(prompt);
      return sock.sendMessage(from, { text: reply }, { quoted: m });
    }

    if (cmd === "menu" || cmd === "help") {
      const uiMenu = 
        `╔════════════════════════════╗\n` +
        `║ ⚡ AIRI BOT OS TERMINAL ⚡ ║\n` +
        `╚════════════════════════════╝\n\n` +
        `*1. PROFIL & DOMPET*\n` +
        `▸ \`.dompet\` | \`.bank dep/wit [RM]\`\n` +
        `▸ \`.claim_online\`\n\n` +
        `*2. KERJAYA (HALAL)*\n` +
        `▸ \`.senarai_kerja\` | \`.pilih_kerja [ID]\`\n` +
        `▸ \`.kerja\`\n\n` +
        `*3. PASARAN & KEDAI*\n` +
        `▸ \`.kedai\` (Booster Kerja & CD)\n` +
        `▸ \`.device\` (10 Gajet Hack/Kerja)\n` +
        `▸ \`.showroom\` (Kenderaan lari polis)\n` +
        `▸ \`.blackmarket\` (12AM-5AM)\n\n` +
        `*4. JALANAN & JENAYAH*\n` +
        `▸ \`.rompak\` | \`.hack @user\`\n` +
        `▸ \`.bicara free/pro\` (Lawan kes lokap)\n` +
        `▸ \`.ikatjamin\` | \`.slot [RM]\`\n\n` +
        `*5. KECERDASAN BUATAN*\n` +
        `▸ \`.ai [soalan]\`\n\n` +
        `_Dimiliki oleh CEO Amar • Shadow Legacy Co., Ltd._`;

      return sock.sendMessage(from, { text: uiMenu }, { quoted: m });
    }
  });
}

startBotEngine();
