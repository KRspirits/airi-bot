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

let activeAirdrop = null; // Storan event kargo airdrop aktif

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
      `Kau adalah ${BOT_NAME}, bot WhatsApp Malaysia bergaya streetwise, berpengetahuan luas, santai tapi padu.`;
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: persona },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    return res.choices[0]?.message?.content || "Tiada respon dari Groq.";
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
  { id: 14, name: "Penjual Nasi Lemak Sambal Sotong", pay: 220 },
  { id: 15, name: "Pengusaha Carwash Detailing", pay: 270 },
  { id: 16, name: "Tauke Bundle Chow Kit", pay: 310 },
  { id: 17, name: "Peniaga Air Balang Padu", pay: 250 },
  { id: 18, name: "Barista Kafe Hipster Bangsar", pay: 210 },
  { id: 19, name: "Chef Ikan Bakar Jalan Bellamy", pay: 350 },
  { id: 20, name: "Pembekal Durian Musang King", pay: 450 },
  { id: 21, name: "Full-Stack Web Developer", pay: 650 },
  { id: 22, name: "Software Engineer", pay: 700 },
  { id: 23, name: "Cyber Security Analyst", pay: 750 },
  { id: 24, name: "Graphic Designer Agensi", pay: 380 },
  { id: 25, name: "Jurutera Offshore Petronas", pay: 1200 },
  { id: 26, name: "Akauntan Bertauliah", pay: 520 },
  { id: 27, name: "Pegawai Bank Cawangan", pay: 480 },
  { id: 28, name: "Peguam Sivil", pay: 800 },
  { id: 29, name: "Arkitek Pelan Bangunan", pay: 780 },
  { id: 30, name: "Data Analyst Korporat", pay: 620 },
  { id: 31, name: "Mekanik Bengkel Turbo", pay: 360 },
  { id: 32, name: "Foreman Motor Modenas/Yamaha", pay: 300 },
  { id: 33, name: "Juruelektrik Pendawaian Rumah", pay: 340 },
  { id: 34, name: "Tukang Paip Profesional", pay: 290 },
  { id: 35, name: "Kontraktor Ubah Suai Rumah", pay: 580 },
  { id: 36, name: "Tukang Gunting Barbershop", pay: 260 },
  { id: 37, name: "Jurukimpal Besi Under-Water", pay: 1100 },
  { id: 38, name: "Tukang Jahit Baju Melayu", pay: 280 },
  { id: 39, name: "Technician Repair Phone/Laptop", pay: 320 },
  { id: 40, name: "Pemasang Tinted Kereta", pay: 300 },
  { id: 41, name: "Streamer MLBB & Valorant", pay: 400 },
  { id: 42, name: "Video Editor TikTok Viral", pay: 350 },
  { id: 43, name: "Jurugambar Majlis Sanding", pay: 390 },
  { id: 44, name: "Personal Trainer Gym", pay: 330 },
  { id: 45, name: "Marshall Litar Sepang", pay: 310 },
  { id: 46, name: "Jurutera Bunyi Konsert", pay: 440 },
  { id: 47, name: "Ejen Hartanah Berdaftar", pay: 850 },
  { id: 48, name: "Guru Tuisyen Addmath", pay: 290 },
  { id: 49, name: "Pet Groomer & Ranger Kucing", pay: 240 },
  { id: 50, name: "Runner Puspakom & JPJ", pay: 320 }
];

const VEHICLES = [
  { id: "ex5", name: "Honda EX5 High Power", price: 3500, escapeBonus: 10, type: "Motor" },
  { id: "y15", name: "Yamaha Y15ZR V2", price: 9500, escapeBonus: 20, type: "Motor" },
  { id: "r1", name: "Yamaha YZF-R1M", price: 85000, escapeBonus: 35, type: "Superbike" },
  { id: "myvi", name: "Perodua Myvi King Turbo", price: 45000, escapeBonus: 30, type: "Kereta" },
  { id: "civic", name: "Honda Civic Type-R FK8", price: 180000, escapeBonus: 45, type: "Kereta" },
  { id: "gtr", name: "Nissan GT-R R35 Nismo", price: 450000, escapeBonus: 65, type: "Supercar" },
  { id: "gt3rs", name: "Porsche 911 GT3 RS", price: 980000, escapeBonus: 75, type: "Supercar" }
];

// Kekal barangan asal kedai biasa
const GADGETS = [
  { id: "burner", name: "Nokia 3310 (Burner Phone)", price: 250, stealthBonus: 15, desc: "Kebal trace polis" },
  { id: "iqoo", name: "iQOO 12 Flagship", price: 3400, workBonus: 25, desc: "Boost 25% gaji kerja & trading" },
  { id: "rog", name: "Laptop ROG Zephyrus", price: 8500, hackBonus: 30, desc: "Alat khas tingkatkan peluang godam" }
];

// Barangan Eksklusif Black Market
const BLACKMARKET_ITEMS = [
  { id: "flipper", name: "Flipper Zero Cyber Zero-Day", price: 15000, type: "gadget", hackBonus: 50, desc: "+50% Success rate godam bank" },
  { id: "jammer", name: "EMP Radio Frequency Jammer", price: 35000, type: "gadget", immuneHack: true, desc: "Kebal 100% daripada diserang hack" },
  { id: "masterkey", name: "Kunci Master Penjara Titanium", price: 8000, type: "consumable", desc: "Pelepasan automatik dari lokap tanpa bayaran" }
];

const SMUGGLE_ROUTES = [
  { id: "rokok", name: "Rokok & Vape Kontraban", baseChance: 70, reward: 6500 },
  { id: "gajet", name: "Komponen Telefon Gelap", baseChance: 50, reward: 24000 },
  { id: "eksotik", name: "Haiwan Eksotik Rentas Sempadan", baseChance: 35, reward: 80000 },
  { id: "cip", name: "Cip AI Rahsia Cyberjaya", baseChance: 20, reward: 300000 }
];

const CRIME_TARGETS = [
  "Maybank Cawangan Menara Raja Chulan",
  "Kedai Emas Habib Jewels KLCC",
  "Stesen Minyak Petronas Bukit Bintang",
  "Kedai 7-Eleven Chow Kit",
  "CIMB Bank Cawangan Dataran Merdeka"
];

function isBlackMarketOpen() {
  const hour = new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur", hour: 'numeric', hour12: false });
  const h = parseInt(hour);
  return h >= 0 && h < 5; // Dibuka hanya 12:00 AM - 5:00 AM
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
      } else {
        console.log("Sesi tamat.");
      }
    } else if (connection === "open") {
      isConnected = true;
      currentQR = null;
      console.log(`\n🔥 [${BOT_NAME.toUpperCase()} BOT ONLINE 24/7!]\n`);
    }
  });

  // Welcome Message High-Tech untuk Airi Corner
  sock.ev.on("group-participants.update", async (update) => {
    try {
      if (update.action === "add") {
        const metadata = await sock.groupMetadata(update.id);
        if (metadata.subject.toLowerCase().includes("airi corner")) {
          for (let participant of update.participants) {
            const welcomeText = 
              `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
              `  ⚡ [ AIRI CORNER : CYBERSPACE ] ⚡\n` +
              `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
              `👤 *SUBJEK BARU DIKESAN:* @${participant.split("@")[0]}\n` +
              `🛡️ *STATUS KELULUSAN:* BIOMETRIC VERIFIED\n` +
              `🌐 *NODE KUMPULAN:* ${metadata.subject}\n\n` +
              `Selamat datang ke pangkalan data rasmi Airi Corner.\n` +
              `Taip \`.menu\` untuk membuka konsol arahan dan mulakan operasi ekonomi jalanan anda!`;

            await sock.sendMessage(update.id, {
              text: welcomeText,
              mentions: [participant]
            });
          }
        }
      }
    } catch (e) {
      console.error("Welcome Msg Error:", e);
    }
  });

  // Sistem Random Event Automatik Setiap 40 Minit
  setInterval(async () => {
    try {
      const db = loadDB();
      const groupList = db.groups || [];
      if (groupList.length === 0) return;

      const targetGroup = groupList[Math.floor(Math.random() * groupList.length)];
      const groupMeta = await sock.groupMetadata(targetGroup);
      const members = groupMeta.participants.map(p => p.id);

      const eventType = Math.random();

      // Event 1: Ops Sekatan Polis Cantas (Tag 3 Ahli Rawak)
      if (eventType < 0.5) {
        const picked = members.sort(() => 0.5 - Math.random()).slice(0, 3);
        let report = `🚨 *[OPS CANTAS TRAFIK & POLIS DANG WANGI]* 🚨\n\nSekatan jalan raya mengejut diadakan di pusat bandar!\n`;
        picked.forEach(p => {
          const u = getUser(p);
          if (u.stars > 0) {
            const denda = Math.floor(u.cash * 0.2);
            u.cash -= denda;
            u.stars = 0;
            updateUser(p, u);
            report += `⚠️ @${p.split('@')[0]} disita *RM ${denda.toLocaleString()}* & rekod disifarkan!\n`;
          } else {
            report += `✅ @${p.split('@')[0]} lulus pemeriksaan rekod bersih.\n`;
          }
        });
        await sock.sendMessage(targetGroup, { text: report, mentions: picked });

      // Event 2: Airdrop Kargo Gelap (Tag All)
      } else {
        const dropValue = Math.floor(Math.random() * 4000) + 2000;
        activeAirdrop = { reward: dropValue, groupId: targetGroup, claimed: false };
        let tagMsg = `📦 *[AIRDROP KARGO GELAP TERHEMPAS]* 📦\n\nKargo bernilai *RM ${dropValue.toLocaleString()}* dikesan jatuh di zon kumpulan!\nSiapa taip \`.claim_drop\` terpantas akan kebas semua wang tunai ini!\n\n`;
        members.forEach(m => { tagMsg += `@${m.split('@')[0]} `; });
        await sock.sendMessage(targetGroup, { text: tagMsg, mentions: members });
      }
    } catch (e) {
      console.error("Random Event Error:", e);
    }
  }, 40 * 60 * 1000);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = m.key.participant || from;
    const body = m.message.conversation || m.message.extendedTextMessage?.text || "";

    // Simpan group ID untuk event
    if (isGroup) {
      const db = loadDB();
      if (!db.groups) db.groups = [];
      if (!db.groups.includes(from)) {
        db.groups.push(from);
        saveDB(db);
      }
    }

    // Online Activity Tracking: Tambah reward RM1 setiap mesej chat
    const user = getUser(sender);
    user.cash += 2;
    user.stats.msgCount = (user.stats.msgCount || 0) + 1;
    user.lastActive = Date.now();
    updateUser(sender, user);

    if (!body.startsWith(".")) return;

    const args = body.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const now = Date.now();
    const isCEO = sender === OWNER_CEO;

    // Kuasa Veto CEO Amar
    if (cmd.startsWith("ceo_") && !isCEO) {
      return sock.sendMessage(from, { text: `⛔ Akses Ditolak: Perintah ini khas untuk CEO Amar sahaja.` }, { quoted: m });
    }

    if (cmd === "ceo_duit") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const amount = parseInt(args[1]);
      if (!target || isNaN(amount)) return sock.sendMessage(from, { text: `Format: \`.ceo_duit @user [jumlah]\`` }, { quoted: m });
      const targetUser = getUser(target);
      targetUser.cash += amount;
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *[KUASA VETO CEO]* RM ${amount.toLocaleString()} tunai disuntik ke akaun @${target.split('@')[0]}!`, mentions: [target] }, { quoted: m });
    }

    if (cmd === "ceo_jail") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      const minutes = parseInt(args[1]) || 10;
      if (!target) return sock.sendMessage(from, { text: `Format: \`.ceo_jail @user [minit]\`` }, { quoted: m });
      const targetUser = getUser(target);
      targetUser.cooldowns.jailUntil = now + (minutes * 60 * 1000);
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *[KUASA VETO CEO]* @${target.split('@')[0]} disumbat ke penjara selama ${minutes} minit atas arahan CEO!`, mentions: [target] }, { quoted: m });
    }

    if (cmd === "ceo_unwanted") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return sock.sendMessage(from, { text: `Format: \`.ceo_unwanted @user\`` }, { quoted: m });
      const targetUser = getUser(target);
      targetUser.stars = 0;
      targetUser.cooldowns.jailUntil = 0;
      updateUser(target, targetUser);
      return sock.sendMessage(from, { text: `👑 *[KUASA VETO CEO]* Rekod polis @${target.split('@')[0]} telah dipadamkan sepenuhnya!`, mentions: [target] }, { quoted: m });
    }

    // Kawalan Lokap
    if (user.cooldowns.jailUntil > now && !["bicara", "ikatjamin", "lokap"].includes(cmd)) {
      const rem = Math.ceil((user.cooldowns.jailUntil - now) / 1000);
      return sock.sendMessage(from, { 
        text: `🔒 *[LOKAP POLIS DANG WANGI]*\nLu sedang ditahan! Baki hukuman: *${rem}s*.\n\nPilihan Pembebasan:\n1. \`.bicara free\` - Bantuan Guaman Percuma (40% Peluang)\n2. \`.bicara pro\` - Peguam Korporat RM100 (85% Peluang)\n3. \`.ikatjamin\` - Bayar jaminan penuh` 
      }, { quoted: m });
    }

    // 1. MAHKAMAH & LAWYER DEBAT
    if (cmd === "bicara") {
      if (user.cooldowns.jailUntil <= now) return sock.sendMessage(from, { text: `Lu bebas, bukan dalam lokap pun!` }, { quoted: m });
      const tier = args[0]?.toLowerCase();

      if (tier === "free") {
        const win = Math.random() <= 0.40;
        if (win) {
          user.cooldowns.jailUntil = 0;
          user.stars = Math.max(0, user.stars - 1);
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `⚖️ *[MAHKAMAH MAJISTRET]*\nPeguam Bantuan Guaman berjaya mencari kecacatan teknikal waran! Lu DIBEBASKAN serta-merta!` }, { quoted: m });
        } else {
          user.cooldowns.jailUntil += 2 * 60 * 1000;
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `⚖️ *[MAHKAMAH MAJISTRET]*\nHujah peguam percuma ditolak hakim! Penalti +2 Minit penjara ditambah.` }, { quoted: m });
        }
      } else if (tier === "pro") {
        if (user.cash < 100) return sock.sendMessage(from, { text: `❌ Duit cash tak cukup RM 100 untuk peguam pro!` }, { quoted: m });
        user.cash -= 100;
        const win = Math.random() <= 0.85;
        const groqDebate = await askGroq("Beri satu baris hujah undang-undang korporat yang sangat mantap dan santai untuk membebaskan klien daripada tuduhan rompakan.");
        if (win) {
          user.cooldowns.jailUntil = 0;
          user.stars = 0;
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `⚖️ *[MAHKAMAH TINGGI]*\nPeguam Korporat Senior berhujah:\n_"${groqDebate}"_\n\n🔥 Hakim memutuskan lu *TIDAK BERSALAH*! Semua rekod jenayah dipadamkan.` }, { quoted: m });
        } else {
          updateUser(sender, user);
          return sock.sendMessage(from, { text: `⚖️ *[MAHKAMAH TINGGI]*\nBukti CCTV pendakwaan terlalu kukuh. Peguam pro gagal, tapi tiada penalti masa tambahan dikenakan.` }, { quoted: m });
        }
      } else {
        return sock.sendMessage(from, { text: `Taip \`.bicara free\` (Percuma, 40%) atau \`.bicara pro\` (RM100, 85%).` }, { quoted: m });
      }
    }

    // 2. ONLINE REWARDS & AIRDROP
    if (cmd === "claim_online" || cmd === "daily") {
      const cd = 60 * 60 * 1000; // Claim setiap 1 jam aktif
      if (now - user.cooldowns.claimOnline < cd) {
        const rem = Math.ceil((cd - (now - user.cooldowns.claimOnline)) / 60000);
        return sock.sendMessage(from, { text: `⏳ Elaun aktif boleh dituntut dalam *${rem} minit* lagi.` }, { quoted: m });
      }
      const reward = 500 + (user.stats.msgCount || 0);
      user.cash += reward;
      user.cooldowns.claimOnline = now;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🎁 *[ELAUN KEHADIRAN AKTIF]*\nTahniah kerana setia bersembang! Duit poket diterima: *+RM ${reward.toLocaleString()}*` }, { quoted: m });
    }

    if (cmd === "claim_drop") {
      if (!activeAirdrop || activeAirdrop.groupId !== from || activeAirdrop.claimed) {
        return sock.sendMessage(from, { text: `❌ Tiada kargo airdrop aktif di sini!` }, { quoted: m });
      }
      const loot = activeAirdrop.reward;
      activeAirdrop.claimed = true;
      activeAirdrop = null;
      user.cash += loot;
      updateUser(sender, user);
      return sock.sendMessage(from, {
        text: `⚡ *[AIRDROP DIKEBAS]*\n@${sender.split('@')[0]} paling pantas menyambar peti kargo dan mengaut *+RM ${loot.toLocaleString()}* tunai!`,
        mentions: [sender]
      }, { quoted: m });
    }

    // 3. BLACK MARKET (MIDNIGHT 12 AM - 5 AM)
    if (cmd === "blackmarket") {
      if (!isBlackMarketOpen()) {
        return sock.sendMessage(from, { text: `🔒 *[BLACK MARKET BERKUNCI]*\nPasaran gelap hanya beroperasi antara jam *12:00 AM - 5:00 AM* waktu Malaysia.` }, { quoted: m });
      }
      let bmCatalog = `🏴‍☠️ *[PASARAN GELAP TENGAH MALAM]*\n\n`;
      BLACKMARKET_ITEMS.forEach((b, i) => {
        bmCatalog += `*${i+1}. ${b.name}*\n   💰 RM ${b.price.toLocaleString()}\n   ℹ️ ${b.desc}\n   🛒 \`.beli_bm ${b.id}\`\n\n`;
      });
      return sock.sendMessage(from, { text: bmCatalog }, { quoted: m });
    }

    if (cmd === "beli_bm") {
      if (!isBlackMarketOpen()) return sock.sendMessage(from, { text: `🔒 Black Market sedang ditutup!` }, { quoted: m });
      const bId = args[0]?.toLowerCase();
      const targetB = BLACKMARKET_ITEMS.find(b => b.id === bId);
      if (!targetB) return sock.sendMessage(from, { text: `❌ Item tidak sah.` }, { quoted: m });
      if (user.cash < targetB.price) return sock.sendMessage(from, { text: `❌ Duit tunai tidak mencukupi!` }, { quoted: m });

      user.cash -= targetB.price;
      if (!user.inventory) user.inventory = [];
      user.inventory.push(targetB);
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🏴‍☠️ *[TRANSAKSI BAWAH TANAH]* Berjaya membeli *${targetB.name}* secara rahsia!` }, { quoted: m });
    }

    // 4. KEDAI BIASA, GAJET & KENDERAAN (KEKAL ASAL)
    if (cmd === "kedai") {
      let store = `📱 *[KEDAI GAJET BIASA]*\n\n`;
      GADGETS.forEach((g, i) => {
        store += `*${i+1}. ${g.name}*\n   💰 RM ${g.price.toLocaleString()}\n   ℹ️ ${g.desc}\n   🛒 \`.beli_gajet ${g.id}\`\n\n`;
      });
      return sock.sendMessage(from, { text: store }, { quoted: m });
    }

    if (cmd === "beli_gajet") {
      const gId = args[0]?.toLowerCase();
      const targetG = GADGETS.find(g => g.id === gId);
      if (!targetG) return sock.sendMessage(from, { text: `❌ Item tidak wujud.` }, { quoted: m });
      if (user.cash < targetG.price) return sock.sendMessage(from, { text: `❌ Duit tunai tidak mencukupi!` }, { quoted: m });
      user.cash -= targetG.price;
      user.phone = targetG;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🛒 Berjaya membeli *${targetG.name}*!` }, { quoted: m });
    }

    if (cmd === "showroom") {
      let catalog = `🏎️ *[SHOWROOM KENDERAAN]*\n\n`;
      VEHICLES.forEach((v, i) => {
        catalog += `*${i+1}. ${v.name}*\n   💰 RM ${v.price.toLocaleString()} | ⚡ +${v.escapeBonus}% Escape\n   🛒 \`.beli_kenderaan ${v.id}\`\n\n`;
      });
      return sock.sendMessage(from, { text: catalog }, { quoted: m });
    }

    if (cmd === "beli_kenderaan") {
      const vId = args[0]?.toLowerCase();
      const targetV = VEHICLES.find(v => v.id === vId);
      if (!targetV) return sock.sendMessage(from, { text: `❌ Model kenderaan tidak sah.` }, { quoted: m });
      if (user.cash < targetV.price) return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup!` }, { quoted: m });
      user.cash -= targetV.price;
      user.vehicle = targetV;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🎉 Berjaya membeli *${targetV.name}*!` }, { quoted: m });
    }

    // 5. STATUS, BANK, & KERJAYA
    if (cmd === "dompet" || cmd === "wallet") {
      return sock.sendMessage(from, {
        text: `💼 *[STATUS KEWANGAN - ${BOT_NAME}]*\n` +
              `👤 Pemilik: @${sender.split('@')[0]}\n` +
              `💵 Cash: *RM ${user.cash.toLocaleString()}*\n` +
              `🏦 Bank: *RM ${user.bank.toLocaleString()}*\n` +
              `🛠️ Kerjaya: *${user.job}*\n` +
              `🏎️ Kenderaan: *${user.vehicle ? user.vehicle.name : "Jalan Kaki"}*\n` +
              `📱 Peranti: *${user.phone ? user.phone.name : "Tiada"}*\n` +
              `🎒 Inventori BM: *${user.inventory?.length || 0} Barang*\n` +
              `⭐ Wanted: *${user.stars > 0 ? "⭐".repeat(user.stars) : "Bersih"}*`,
        mentions: [sender]
      }, { quoted: m });
    }

    if (cmd === "bank") {
      const action = args[0]?.toLowerCase();
      const amount = parseInt(args[1]);

      if (action === "dep" || action === "deposit") {
        if (isNaN(amount) || amount <= 0 || amount > user.cash) return sock.sendMessage(from, { text: `❌ Jumlah cash tidak sah!` }, { quoted: m });
        user.cash -= amount;
        user.bank += amount;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🏦 *[MAYBANK]* Simpan *RM ${amount.toLocaleString()}* ke akaun.` }, { quoted: m });
      }
      if (action === "wit" || action === "withdraw") {
        if (isNaN(amount) || amount <= 0 || amount > user.bank) return sock.sendMessage(from, { text: `❌ Baki bank tidak cukup!` }, { quoted: m });
        user.bank -= amount;
        user.cash += amount;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🏧 *[ATM]* Keluarkan *RM ${amount.toLocaleString()}* tunai.` }, { quoted: m });
      }
      return sock.sendMessage(from, { text: `Format: \`.bank dep [jumlah]\` atau \`.bank wit [jumlah]\`` }, { quoted: m });
    }

    if (cmd === "senarai_kerja") {
      let list = `📋 *[SENARAI 50 KERJAYA]*\n\n`;
      JOBS.forEach(j => { list += `*ID ${j.id}:* ${j.name} (RM ${j.pay})\n`; });
      list += `\nTaip \`.pilih_kerja [ID]\` untuk tukar kerja.`;
      return sock.sendMessage(from, { text: list }, { quoted: m });
    }

    if (cmd === "pilih_kerja") {
      const id = parseInt(args[0]);
      const found = JOBS.find(j => j.id === id);
      if (!found) return sock.sendMessage(from, { text: `❌ ID salah.` }, { quoted: m });
      user.job = found.name;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `✅ Lu kini bekerja sebagai *${found.name}* (Gaji: RM ${found.pay}).` }, { quoted: m });
    }

    if (cmd === "kerja") {
      const cd = 5 * 60 * 1000;
      if (now - user.cooldowns.work < cd) {
        const rem = Math.ceil((cd - (now - user.cooldowns.work)) / 1000);
        return sock.sendMessage(from, { text: `⏳ Rehat dulu! Cooldown: *${rem}s*.` }, { quoted: m });
      }
      const curJob = JOBS.find(j => j.name === user.job) || { pay: 150, name: "Kerja Sambilan" };
      let gaji = curJob.pay;
      if (user.phone?.workBonus) gaji += Math.floor(gaji * (user.phone.workBonus / 100));
      if (user.vehicle) gaji += Math.floor(gaji * 0.15);

      user.cash += gaji;
      user.cooldowns.work = now;
      user.stats.successJobs = (user.stats.successJobs || 0) + 1;
      updateUser(sender, user);

      return sock.sendMessage(from, {
        text: `💼 *[SYIF SELESAI]*\nJawatan: *${curJob.name}*\n💰 Gaji: *+RM ${gaji.toLocaleString()}*\n💵 Cash: *RM ${user.cash.toLocaleString()}*`
      }, { quoted: m });
    }

    // 6. OPERASI GELAP, GODAM & JUDI
    if (cmd === "rompak" || cmd === "ragut") {
      const cd = 15 * 60 * 1000;
      if (now - user.cooldowns.rob < cd) {
        const rem = Math.ceil((cd - (now - user.cooldowns.rob)) / 1000);
        return sock.sendMessage(from, { text: `🚨 Skuad ronda aktif! Cooldown: *${rem}s*.` }, { quoted: m });
      }

      const targetPlace = CRIME_TARGETS[Math.floor(Math.random() * CRIME_TARGETS.length)];
      const success = calculateChance(user, 50);

      if (success) {
        const loot = Math.floor(Math.random() * 4000) + 1200;
        user.cash += loot;
        user.stars = Math.min(5, (user.stars || 0) + 1);
        user.cooldowns.rob = now;
        user.stats.robCount = (user.stats.robCount || 0) + 1;
        updateUser(sender, user);
        return sock.sendMessage(from, {
          text: `💥 *[BERJAYA]* Rompak *${targetPlace}*!\n💰 Rembat: *+RM ${loot.toLocaleString()}*\n⭐ Wanted: ${"⭐".repeat(user.stars)}`
        }, { quoted: m });
      } else {
        user.stars = Math.min(5, (user.stars || 0) + 2);
        user.cooldowns.rob = now;
        user.cooldowns.jailUntil = now + (5 * 60 * 1000);
        user.stats.jailCount = (user.stats.jailCount || 0) + 1;
        updateUser(sender, user);
        return sock.sendMessage(from, {
          text: `🚨 *[KOD MERAH]* Kereta peronda memintas! Lu disumbat ke lokap (5 Minit).\nTaip \`.bicara free\` atau \`.bicara pro\` untuk berdebat di mahkamah.`
        }, { quoted: m });
      }
    }

    if (cmd === "ikatjamin") {
      const bail = (user.stars || 1) * 2000;
      if (user.cash < bail) return sock.sendMessage(from, { text: `❌ Cash tak cukup (RM ${bail.toLocaleString()})!` }, { quoted: m });
      user.cash -= bail;
      user.stars = 0;
      user.cooldowns.jailUntil = 0;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🔓 Bebas ikat jamin RM ${bail.toLocaleString()}!` }, { quoted: m });
    }

    if (cmd === "seludup_menu") {
      let menu = `📦 *[MISI SELUDUP]*\n\n`;
      SMUGGLE_ROUTES.forEach(r => {
        menu += `*${r.name}*\n   💵 RM ${r.reward.toLocaleString()} | Peluang: ${r.baseChance}%\n   🚀 \`.seludup ${r.id}\`\n\n`;
      });
      return sock.sendMessage(from, { text: menu }, { quoted: m });
    }

    if (cmd === "seludup") {
      const sId = args[0]?.toLowerCase();
      const route = SMUGGLE_ROUTES.find(r => r.id === sId);
      if (!route) return sock.sendMessage(from, { text: `❌ Laluan salah.` }, { quoted: m });

      const cd = 30 * 60 * 1000;
      if (now - user.cooldowns.smuggle < cd) {
        const rem = Math.ceil((cd - (now - user.cooldowns.smuggle)) / 1000);
        return sock.sendMessage(from, { text: `🚢 Kawalan sempadan ketat! Tunggu *${rem}s*.` }, { quoted: m });
      }

      const success = calculateChance(user, route.baseChance);
      if (success) {
        user.cash += route.reward;
        user.cooldowns.smuggle = now;
        user.stars = Math.min(5, (user.stars || 0) + 1);
        updateUser(sender, user);
        return sock.sendMessage(from, {
          text: `🚢 *[BERJAYA]* Kargo *${route.name}* selamat!\n💰 Bayaran: *+RM ${route.reward.toLocaleString()}*`
        }, { quoted: m });
      } else {
        user.cooldowns.smuggle = now;
        user.stars = 5;
        user.cooldowns.jailUntil = now + (15 * 60 * 1000);
        updateUser(sender, user);
        return sock.sendMessage(from, {
          text: `🚨 *[KASTAM MERAMPAS]* Kargo disita. Lu disumbat ke lokap reman 15 minit.`
        }, { quoted: m });
      }
    }

    if (cmd === "hack") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return sock.sendMessage(from, { text: `❌ Tag sasaran: \`.hack @user\`` }, { quoted: m });

      const cd = 20 * 60 * 1000;
      if (now - user.cooldowns.hack < cd) {
        const rem = Math.ceil((cd - (now - user.cooldowns.hack)) / 1000);
        return sock.sendMessage(from, { text: `🛡️ Cooldown hack: *${rem}s*.` }, { quoted: m });
      }

      const targetUser = getUser(target);
      const hasJammer = targetUser.inventory?.some(i => i.immuneHack);
      if (hasJammer) {
        user.cooldowns.hack = now;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🛡️ Serangan gagal! Sasaran memiliki *EMP Radio Jammer* pertahanan kebal!` }, { quoted: m });
      }

      if (targetUser.bank < 1000) return sock.sendMessage(from, { text: `❌ Sasaran tiada duit bank.` }, { quoted: m });

      const flipperBoost = user.inventory?.some(i => i.id === "flipper") ? 50 : 0;
      let hackRate = 50 + (user.phone?.hackBonus || 0) + flipperBoost;
      const isBreached = Math.random() * 100 <= hackRate;

      if (isBreached) {
        const stolen = Math.floor(targetUser.bank * 0.20);
        targetUser.bank -= stolen;
        user.cash += stolen;
        user.cooldowns.hack = now;
        updateUser(target, targetUser);
        updateUser(sender, user);
        return sock.sendMessage(from, {
          text: `💻 *[EXPLOIT BERJAYA]* Godam akaun bank @${target.split('@')[0]} dan rampas *+RM ${stolen.toLocaleString()}*!`,
          mentions: [target]
        }, { quoted: m });
      } else {
        user.cooldowns.hack = now;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🛑 Serangan godam disekat firewall mangsa!` }, { quoted: m });
      }
    }

    if (cmd === "slot" || cmd === "judi") {
      const bet = parseInt(args[0]);
      if (isNaN(bet) || bet <= 0 || bet > user.cash) return sock.sendMessage(from, { text: `❌ Taruhan tidak sah!` }, { quoted: m });

      const icons = ["🍒", "🍋", "🍉", "⭐", "💎", "7️⃣"];
      const r1 = icons[Math.floor(Math.random() * icons.length)];
      const r2 = icons[Math.floor(Math.random() * icons.length)];
      const r3 = icons[Math.floor(Math.random() * icons.length)];

      if (r1 === r2 && r2 === r3) {
        const win = bet * 5;
        user.cash += win;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n🔥 JACKPOT 5X: *+RM ${win.toLocaleString()}*!` }, { quoted: m });
      } else {
        user.cash -= bet;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n❌ Kalah: *-RM ${bet.toLocaleString()}*!` }, { quoted: m });
      }
    }

    // 7. GROQ AI & MENU
    if (cmd === "ai" || cmd === "tanya") {
      const prompt = args.join(" ");
      if (!prompt) return sock.sendMessage(from, { text: `Contoh: \`.ai strategi buat duit pantas\`` }, { quoted: m });
      const reply = await askGroq(prompt);
      return sock.sendMessage(from, { text: reply }, { quoted: m });
    }

    if (cmd === "menu" || cmd === "help") {
      const menu = 
        `⚡ *[${BOT_NAME.toUpperCase()} STREET SYSTEM]* ⚡\n\n` +
        `💼 *STATUS & KEWANGAN*\n` +
        `• \`.dompet\` | \`.bank dep/wit [RM]\`\n` +
        `• \`.claim_online\` - Tuntut elaun aktif sembang\n\n` +
        `🛠️ *KERJAYA (50 KERJA)*\n` +
        `• \`.senarai_kerja\` | \`.pilih_kerja [ID]\` | \`.kerja\`\n\n` +
        `🏎️ *PERNIAGAAN & KEDAI*\n` +
        `• \`.showroom\` | \`.beli_kenderaan [id]\`\n` +
        `• \`.kedai\` | \`.beli_gajet [id]\`\n` +
        `• \`.blackmarket\` | \`.beli_bm [id]\` _(12AM-5AM)_\n\n` +
        `🔫 *OPERASI JALANAN*\n` +
        `• \`.rompak\` | \`.seludup_menu\` | \`.hack @user\`\n` +
        `• \`.bicara free/pro\` - Debat di mahkamah\n` +
        `• \`.ikatjamin\` | \`.slot [jumlah]\`\n\n` +
        `🧠 *GROQ AI*\n` +
        `• \`.ai [soalan]\``;

      return sock.sendMessage(from, { text: menu }, { quoted: m });
    }
  });
}

startBotEngine();
