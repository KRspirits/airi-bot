import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import Groq from "groq-sdk";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// ==========================================
// 1. INISIALISASI GROQ AI & DATABASE
// ==========================================
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const DB_FILE = "./database.json";
const BOT_NAME = "Airi";

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
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
      stats: { successJobs: 0, jailCount: 0, robCount: 0 },
      cooldowns: { work: 0, rob: 0, smuggle: 0, hack: 0, jailUntil: 0 }
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
      `Kau adalah ${BOT_NAME}, bot WhatsApp Malaysia yang santai, gaya streetwise, berpengetahuan luas pasal tech, kereta, dan info jalanan tempatan. Jangan cakap gaya skema atau kaku.`;
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: persona },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    return res.choices[0]?.message?.content || "Takde respon dari Groq.";
  } catch (e) {
    console.error("Groq Error:", e);
    return "⚡ Ralat komunikasi dengan pelayan AI Groq.";
  }
}

// ==========================================
// 2. DATA STATIC & MASTER DATA
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

const GADGETS = [
  { id: "burner", name: "Nokia 3310 (Burner Phone)", price: 250, stealthBonus: 15, desc: "Kebal trace polis" },
  { id: "iqoo", name: "iQOO 12 Flagship", price: 3400, workBonus: 25, desc: "Boost 25% gaji kerja & trading" },
  { id: "rog", name: "Laptop ROG Zephyrus", price: 8500, hackBonus: 30, desc: "Alat khas tingkatkan peluang hack" }
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

function calculateChance(user, baseChance = 50) {
  let vBonus = user.vehicle?.escapeBonus || 0;
  let pBonus = user.phone?.stealthBonus || 0;
  let penalty = (user.stars || 0) * 10;
  let finalRate = baseChance + vBonus + pBonus - penalty;
  return Math.random() * 100 <= Math.max(10, Math.min(95, finalRate));
}

// ==========================================
// 3. ENJIN UTAMA WHATSAPP
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
    if (qr) {
      console.log("\n=========================================");
      console.log("SILA SCAN QR CODE DI BAWAH (LOG KOYEB):");
      console.log("=========================================");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        startBotEngine();
      } else {
        console.log("Sesi tamat.");
      }
    } else if (connection === "open") {
      console.log(`\n🔥 [${BOT_NAME.toUpperCase()} BOT ONLINE & READY 24/7!]\n`);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const sender = m.key.participant || from;
    const body = m.message.conversation || m.message.extendedTextMessage?.text || "";

    if (!body.startsWith(".")) return;

    const args = body.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const user = getUser(sender);
    const now = Date.now();

    if (user.cooldowns.jailUntil > now && !["ikatjamin", "lokap"].includes(cmd)) {
      const rem = Math.ceil((user.cooldowns.jailUntil - now) / 1000);
      return sock.sendMessage(from, { 
        text: `🔒 *[LOKAP POLIS DANG WANGI]*\nLu ditahan! Baki: *${rem}s*.\nTaip \`.ikatjamin\` untuk bebas.` 
      }, { quoted: m });
    }

    // 1. PROFIL & DOMPET
    if (cmd === "dompet" || cmd === "wallet") {
      return sock.sendMessage(from, {
        text: `💼 *[STATUS KEWANGAN - ${BOT_NAME}]*\n` +
              `👤 Pemilik: @${sender.split('@')[0]}\n` +
              `💵 Cash: *RM ${user.cash.toLocaleString()}*\n` +
              `🏦 Bank: *RM ${user.bank.toLocaleString()}*\n` +
              `🛠️ Kerjaya: *${user.job}*\n` +
              `🏎️ Kenderaan: *${user.vehicle ? user.vehicle.name : "Jalan Kaki"}*\n` +
              `📱 Peranti: *${user.phone ? user.phone.name : "Tiada"}*\n` +
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

    // 2. KERJA (50 KERJAYA)
    if (cmd === "senarai_kerja") {
      let list = `📋 *[SENARAI 50 KERJAYA]*\n\n`;
      JOBS.forEach(j => { list += `*ID ${j.id}:* ${j.name} (RM ${j.pay})\n`; });
      list += `\nTaip \`.pilih_kerja [ID]\` untuk menukar pekerjaan.`;
      return sock.sendMessage(from, { text: list }, { quoted: m });
    }

    if (cmd === "pilih_kerja") {
      const id = parseInt(args[0]);
      const found = JOBS.find(j => j.id === id);
      if (!found) return sock.sendMessage(from, { text: `❌ ID salah. Semak \`.senarai_kerja\`` }, { quoted: m });
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

    // 3. SHOWROOM & GAJET
    if (cmd === "showroom") {
      let catalog = `🏎️ *[SHOWROOM]*\n\n`;
      VEHICLES.forEach((v, i) => {
        catalog += `*${i+1}. ${v.name}*\n   💰 RM ${v.price.toLocaleString()} | ⚡ +${v.escapeBonus}% Escape\n   🛒 \`.beli_kenderaan ${v.id}\`\n\n`;
      });
      return sock.sendMessage(from, { text: catalog }, { quoted: m });
    }

    if (cmd === "beli_kenderaan") {
      const vId = args[0]?.toLowerCase();
      const targetV = VEHICLES.find(v => v.id === vId);
      if (!targetV) return sock.sendMessage(from, { text: `❌ Model tak ditemui.` }, { quoted: m });
      if (user.cash < targetV.price) return sock.sendMessage(from, { text: `❌ Duit tak cukup!` }, { quoted: m });
      user.cash -= targetV.price;
      user.vehicle = targetV;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🎉 Berjaya beli *${targetV.name}*!` }, { quoted: m });
    }

    if (cmd === "kedai") {
      let store = `📱 *[KEDAI GAJET]*\n\n`;
      GADGETS.forEach((g, i) => {
        store += `*${i+1}. ${g.name}*\n   💰 RM ${g.price.toLocaleString()}\n   ℹ️ ${g.desc}\n   🛒 \`.beli_gajet ${g.id}\`\n\n`;
      });
      return sock.sendMessage(from, { text: store }, { quoted: m });
    }

    if (cmd === "beli_gajet") {
      const gId = args[0]?.toLowerCase();
      const targetG = GADGETS.find(g => g.id === gId);
      if (!targetG) return sock.sendMessage(from, { text: `❌ Item tak wujud.` }, { quoted: m });
      if (user.cash < targetG.price) return sock.sendMessage(from, { text: `❌ Duit tak cukup!` }, { quoted: m });
      user.cash -= targetG.price;
      user.phone = targetG;
      updateUser(sender, user);
      return sock.sendMessage(from, { text: `🛒 Berjaya beli *${targetG.name}*!` }, { quoted: m });
    }

    // 4. JENAYAH & SELUDUP
    if (cmd === "rompak" || cmd === "ragut") {
      const cd = 15 * 60 * 1000;
      if (now - user.cooldowns.rob < cd) {
        const rem = Math.ceil((cd - (now - user.cooldowns.rob)) / 1000);
        return sock.sendMessage(from, { text: `🚨 Polis aktif ronda! Cooldown: *${rem}s*.` }, { quoted: m });
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
          text: `🚨 *[TERPERANGKAP]* Kereta polis memintas! Lu ke Lokap Dang Wangi (5 Minit).`
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

    // 5. HACKING & KASINO
    if (cmd === "hack") {
      const target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) return sock.sendMessage(from, { text: `❌ Tag sasaran: \`.hack @user\`` }, { quoted: m });

      const cd = 20 * 60 * 1000;
      if (now - user.cooldowns.hack < cd) {
        const rem = Math.ceil((cd - (now - user.cooldowns.hack)) / 1000);
        return sock.sendMessage(from, { text: `🛡️ Cooldown hack: *${rem}s*.` }, { quoted: m });
      }

      const targetUser = getUser(target);
      if (targetUser.bank < 1000) return sock.sendMessage(from, { text: `❌ Sasaran tiada duit bank.` }, { quoted: m });

      let hackRate = 50 + (user.phone?.hackBonus || 0);
      const isBreached = Math.random() * 100 <= hackRate;

      if (isBreached) {
        const stolen = Math.floor(targetUser.bank * 0.15);
        targetUser.bank -= stolen;
        user.cash += stolen;
        user.cooldowns.hack = now;
        updateUser(target, targetUser);
        updateUser(sender, user);
        return sock.sendMessage(from, {
          text: `💻 *[HACK SUCCESS]* Curi *+RM ${stolen.toLocaleString()}* dari @${target.split('@')[0]}!`,
          mentions: [target]
        }, { quoted: m });
      } else {
        user.cooldowns.hack = now;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🛑 Serangan disekat firewall!` }, { quoted: m });
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
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n🔥 MENANG 5X: *+RM ${win.toLocaleString()}*!` }, { quoted: m });
      } else {
        user.cash -= bet;
        updateUser(sender, user);
        return sock.sendMessage(from, { text: `🎰 [ ${r1} | ${r2} | ${r3} ]\n❌ Kalah: *-RM ${bet.toLocaleString()}*!` }, { quoted: m });
      }
    }

    // 6. GROQ AI & MENU
    if (cmd === "ai" || cmd === "tanya") {
      const prompt = args.join(" ");
      if (!prompt) return sock.sendMessage(from, { text: `Contoh: \`.ai cara buat duit\`` }, { quoted: m });
      const reply = await askGroq(prompt);
      return sock.sendMessage(from, { text: reply }, { quoted: m });
    }

    if (cmd === "menu" || cmd === "help") {
      const menu = 
        `⚡ *[${BOT_NAME.toUpperCase()} - BOT STREET]* ⚡\n\n` +
        `💼 *STATUS & KEWANGAN*\n` +
        `• \`.dompet\` | \`.bank dep/wit [RM]\`\n\n` +
        `🛠️ *KERJA (50 KERJA)*\n` +
        `• \`.senarai_kerja\` | \`.pilih_kerja [ID]\` | \`.kerja\`\n\n` +
        `🏎️ *SHOWROOM & GAJET*\n` +
        `• \`.showroom\` | \`.beli_kenderaan [id]\`\n` +
        `• \`.kedai\` | \`.beli_gajet [id]\`\n\n` +
        `🔫 *OPERASI GELAP*\n` +
        `• \`.rompak\` | \`.ikatjamin\` | \`.seludup_menu\`\n` +
        `• \`.hack @user\` | \`.slot [taruhan]\`\n\n` +
        `🧠 *GROQ AI*\n` +
        `• \`.ai [soalan]\``;

      return sock.sendMessage(from, { text: menu }, { quoted: m });
    }
  });
}

startBotEngine();
