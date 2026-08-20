import makeWASocket, { useMultiFileAuthState, DisconnectReason, Browsers } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import http from "http";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => { res.end("Airi's Corner Bot Online"); }).listen(PORT);

const DB_FILE = "./database.json";
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, groups: [], bounties: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE));
  } catch (e) {
    return { users: {}, groups: [], bounties: {} };
  }
}
function saveDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

function getUser(userId) {
  const db = loadDB();
  if (!db.users[userId]) {
    db.users[userId] = {
      cash: 1000,
      bank: 0,
      jobId: null,
      inventory: [],
      vehicles: [],
      food: [],
      stars: 0,
      stats: { works: 0, crimes: 0, bails: 0 },
      cooldowns: { work: 0, crime: 0, jailUntil: 0 }
    };
    saveDB(db);
  }
  if (!db.users[userId].stats) {
    db.users[userId].stats = { works: 0, crimes: 0, bails: 0 };
  }
  return db.users[userId];
}

function updateUser(userId, userData) {
  const db = loadDB();
  db.users[userId] = userData;
  saveDB(db);
}

// --- 50 KERJA HALAL ---
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

// --- KEDAI MAKANAN (SHOP) ---
const FOOD_ITEMS = [
  { id: "tehtarik", name: "Teh Tarik Madu", price: 5, desc: "Segarkan badan lepas kerja." },
  { id: "roticanai", name: "Roti Canai Special", price: 8, desc: "Breakfast mantap." },
  { id: "nasilemak", name: "Nasi Lemak Ayam", price: 12, desc: "Tenaga penuh untuk merempit." },
  { id: "burger", name: "Burger Special Banjir", price: 15, desc: "Mengenyangkan." }
];

// --- 40 KENDERAAN SHOWROOM ---
const VEHICLES = [
  // MOTOR (20)
  { id: "ex5", name: "Honda EX5", price: 3000, type: "Motor" }, { id: "wave125", name: "Honda Wave 125i", price: 5500, type: "Motor" },
  { id: "lagenda", name: "Yamaha Lagenda 115Z", price: 6000, type: "Motor" }, { id: "y15", name: "Yamaha Y15ZR", price: 10000, type: "Motor" },
  { id: "rs150", name: "Honda RS150R", price: 10500, type: "Motor" }, { id: "lc135", name: "Yamaha LC135", price: 7500, type: "Motor" },
  { id: "nvx", name: "Yamaha NVX 155", price: 12000, type: "Motor" }, { id: "nmax", name: "Yamaha NMAX 155", price: 13000, type: "Motor" },
  { id: "adv160", name: "Honda ADV 160", price: 15000, type: "Motor" }, { id: "r15", name: "Yamaha YZF-R15", price: 14000, type: "Motor" },
  { id: "cbr150", name: "Honda CBR150R", price: 14500, type: "Motor" }, { id: "ninja250", name: "Kawasaki Ninja 250", price: 22000, type: "Motor" },
  { id: "z250", name: "Kawasaki Z250", price: 21000, type: "Motor" }, { id: "mt07", name: "Yamaha MT-07", price: 40000, type: "Motor" },
  { id: "z800", name: "Kawasaki Z800", price: 48000, type: "Motor" }, { id: "r6", name: "Yamaha YZF-R6", price: 85000, type: "Motor" },
  { id: "zx6r", name: "Kawasaki ZX-6R", price: 90000, type: "Motor" }, { id: "panigale", name: "Ducati Panigale V4", price: 180000, type: "Motor" },
  { id: "s1000rr", name: "BMW S1000RR", price: 175000, type: "Motor" }, { id: "h2", name: "Kawasaki Ninja H2", price: 250000, type: "Motor" },
  // KERETA (20)
  { id: "kancil", name: "Perodua Kancil", price: 5000, type: "Kereta" }, { id: "saga", name: "Proton Saga BLM", price: 12000, type: "Kereta" },
  { id: "iswara", name: "Proton Iswara", price: 8000, type: "Kereta" }, { id: "myvi", name: "Perodua Myvi King", price: 50000, type: "Kereta" },
  { id: "wira", name: "Proton Wira 1.5", price: 15000, type: "Kereta" }, { id: "persona", name: "Proton Persona", price: 45000, type: "Kereta" },
  { id: "preve", name: "Proton Preve", price: 40000, type: "Kereta" }, { id: "x50", name: "Proton X50", price: 90000, type: "Kereta" },
  { id: "x70", name: "Proton X70", price: 120000, type: "Kereta" }, { id: "civic", name: "Honda Civic FC", price: 130000, type: "Kereta" },
  { id: "accord", name: "Honda Accord", price: 180000, type: "Kereta" }, { id: "vios", name: "Toyota Vios", price: 95000, type: "Kereta" },
  { id: "alphard", name: "Toyota Alphard", price: 350000, type: "Kereta" }, { id: "mustang", name: "Ford Mustang", price: 550000, type: "Kereta" },
  { id: "gtr", name: "Nissan GT-R R35", price: 650000, type: "Kereta" }, { id: "m4", name: "BMW M4 Competition", price: 750000, type: "Kereta" },
  { id: "c63", name: "Mercedes C63 AMG", price: 780000, type: "Kereta" }, { id: "ferrari", name: "Ferrari 488", price: 1500000, type: "Kereta" },
  { id: "lambo", name: "Lamborghini Huracan", price: 1600000, type: "Kereta" }, { id: "911", name: "Porsche 911 GT3 RS", price: 1800000, type: "Kereta" }
];

const BLACKMARKET_ITEMS = [
  { id: "skimmer", name: "Alat Skimming ATM", price: 20000, desc: "Skim mesin ATM" },
  { id: "decrypter", name: "Flash-Drive Decrypter", price: 50000, desc: "Pintas firewall bank" },
  { id: "jammer", name: "EMP Radio Jammer", price: 100000, desc: "Kebal radar polis" },
  { id: "keycard", name: "Kad Akses Master", price: 250000, desc: "Akses bilik kebal kasino" },
  { id: "flipper", name: "Flipper Zero Pro", price: 500000, desc: "Godam pusat Darkweb" }
];

const CRIMES = [
  { id: 1, name: "Ragut Beg Jalanan", rewardMin: 50, rewardMax: 150, stars: 1, fine: 100 },
  { id: 2, name: "Rompak Kedai Runcit", rewardMin: 150, rewardMax: 300, stars: 1, fine: 250 },
  { id: 3, name: "Curi Motor Parkir", rewardMin: 300, rewardMax: 600, stars: 2, fine: 500 },
  { id: 4, name: "Rompak Kedai Emas", rewardMin: 700, rewardMax: 1500, stars: 2, fine: 1200 },
  { id: 5, name: "Pecah Masuk Banglo", rewardMin: 1500, rewardMax: 3000, stars: 3, fine: 2500 },
  { id: 6, name: "Skimming ATM", rewardMin: 3500, rewardMax: 6000, reqItem: "skimmer", stars: 3, fine: 5000 },
  { id: 7, name: "Godam Sistem Bank", rewardMin: 7000, rewardMax: 12000, reqItem: "decrypter", stars: 4, fine: 9000 },
  { id: 8, name: "Penyeludupan Kontraban", rewardMin: 15000, rewardMax: 25000, reqItem: "jammer", stars: 4, fine: 15000 },
  { id: 9, name: "Heist Bilik Kebal Kasino", rewardMin: 30000, rewardMax: 60000, reqItem: "keycard", stars: 5, fine: 25000 },
  { id: 10, name: "Eksploitasi Darkweb Zero", rewardMin: 80000, rewardMax: 200000, reqItem: "flipper", stars: 5, fine: 50000 }
];

const DIALOG_KERJA = [
  "Wah, rajin sungguh kau cari rezeki halal hari ni! Gaji masuk poket, jangan lupa simpan sikit.",
  "Berpeluh jantan kau kerja hari ni! Gaji dah masuk, boleh la belanja kawan makan.",
  "Steady! Kerja ni kalau buat hari-hari, lama-lama boleh beli Myvi King. Teruskan usaha!",
  "Macam ni la baru betul, kerja cara bersih. Jauhkan diri dari cara haram.",
  "Power! Hasil kerja kau dah masuk bank. Sikit-sikit lama-lama jadi bukit!"
];

const DIALOG_CRIME_SUCCESS = [
  "Fuh! Licik betul rancangan kau kali ni, polis langsung tak sempat nak kejar!",
  "Operasi berjaya dengan selamat! Barang curi dah in hand, Kaya cara pantas!",
  "Masterclass! Kau memang penjenayah profesional, senyap-senyap buat kerja terus lumayan."
];

const DIALOG_MAMAK = [
  "Boss! Mai duk sini minum teh tarik dulu. Mamak nak habaq rahsia, malam ni sistem ATM kat kawasan sana tengah lag, senang kalau nak skim!"
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

async function startBotEngine() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_session");
  
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.macOS("Desktop"),
    printQRInTerminal: true // PENTING: Membolehkan QR code dicetak pada log konsol
  });

  sock.ev.on("creds.update", saveCreds);

  // --- CONNECTION UPDATE (PENTING SUPAYA QR CODE KELUAR) ---
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
      console.log("Connection closed. Reconnecting...", shouldReconnect);
      if (shouldReconnect) {
        startBotEngine();
      }
    } else if (connection === "open") {
      console.log("✅ AIRI'S CORNER BOT SUCCESSFULLY CONNECTED TO WHATSAPP!");
    }
  });

  // Simpan group ID aktif untuk auto-report
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

  // --- AUTO REPORT PUKUL 12 MALAM ---
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

        const reportUI = `╭━━━ 🌙 *LAPORAN HARIAN AIRI'S CORNER* 🌙 ━━━
┃ Tepat jam 12:00 tengah malam! Rekod geng hari ni:
┃
┃ 🏆 *Raja Kerja Halal:* 
┃ 👤 @${topWorker.id.split("@")[0]} (${topWorker.works} shift)
┃
┃ 🏴‍☠️ *Penjenayah Paling Aktif:* 
┃ 👤 @${topCriminal.id.split("@")[0]} (${topCriminal.crimes} misi)
┃
┃ 💰 *Jutawan Harian:* 
┃ 👤 @${topRich.id.split("@")[0]} (RM ${topRich.cash.toLocaleString()})
┃
┃ ✨ *Statistik diset semula untuk hari baru!*
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        const groups = db.groups || [];
        for (const gId of groups) {
          try {
            await sock.sendMessage(gId, { text: reportUI, mentions: [topWorker.id, topCriminal.id, topRich.id] });
          } catch (e) {
            console.log("Gagal hantar auto report ke group:", e);
          }
        }
      }

      for (let id in db.users) {
        db.users[id].stats = { works: 0, crimes: 0, bails: 0 };
      }
      saveDB(db);
    }
  }, 60 * 1000);

  // --- WELCOME MESSAGE ---
  sock.ev.on("group-participants.update", async (anu) => {
    try {
      const { id, participants, action } = anu;
      if (action === "add") {
        for (const num of participants) {
          const tagUser = `@${num.split("@")[0]}`;
          const welcomeUI = `╭━━━ ⚡ *SYSTEM INITIALIZED* ⚡ ━━━
┃ 🌐 **SECURE CHANNEL CONNECTED**
┃ 👤 *Target:* ${tagUser}
┃
┃ 🎉 *SELAMAT DATANG KE AIRI'S CORNER!* 🚀
┃ Taip \`.myid\` untuk kad pengenalan maya atau \`.kerja\` untuk mula mencari rezeki!
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
          await sock.sendMessage(id, { text: welcomeUI, mentions: [num] });
        }
      }
    } catch (err) {
      console.log("Error welcome message:", err);
    }
  });

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
      return sock.sendMessage(from, { text: `🚨 [DALAM LOKAP] Anda sedang ditahan polis! Baki hukuman: *${remMin} minit*.\nTaip \`.upah_lawyer\` (RM 500) untuk bebas dengan segera.` });
    }

    if (cmd === "menu" || cmd === "help") {
      let menuText = `╭━━━ 🖥️ *AIRI'S CORNER OS* 🖥️ ━━━
┃ 💼 *[HALAL]* \`.kerja\`, \`.showroom\`, \`.shop\`
┃ 🏴‍☠️ *[HARAM]* \`.jenayah_menu\`, \`.blackmarket\`
┃ ⚖️ *[SYSTEM]* \`.myid\`, \`.leaderboard\`, \`.upah_lawyer\`, \`.profile\`
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: menuText });
    }

    if (cmd === "myid" || cmd === "ic") {
      const title = getTitle(user);
      const activeJobName = user.jobId ? JOBS.find(j => j.id === user.jobId)?.name || "Freelancer" : "Unassigned";
      const cyberIdUI = `╭━━━ 🪪 *CYBER IDENTITY CARD* ━━━
┃ 👤 *ID:* @${cleanSender.split("@")[0]}
┃ 🌟 *Rank:* ${title}
┃ 💼 *Job:* ${activeJobName}
┃ 💵 *Cash:* RM ${user.cash.toLocaleString()}
┃ 🍔 *Food Storage:* ${user.food?.length || 0} items
┃ ⭐ *Threat:* ${"⭐".repeat(user.stars) || "Clean"}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: cyberIdUI, mentions: [cleanSender] });
    }

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

      if (sortedUsers.length === 0) return sock.sendMessage(from, { text: `ℹ️ Tiada data pengguna.` });

      let lbText = `╭━━━ 🏆 *LEADERBOARD UTAMA* 🏆 ━━━\n`;
      sortedUsers.forEach((u, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `🏅 #${index + 1}`;
        lbText += `${medal} @${u.id.split("@")[0]}\n   • Wang: RM ${u.totalMoney.toLocaleString()}\n   • Pangkat: ${u.title}\n\n`;
      });
      lbText += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: lbText, mentions: sortedUsers.map(u => u.id) });
    }

    if (cmd === "shop" || cmd === "makanan") {
      let shopText = `╭━━━ 🍔 *WARUNG MAKANAN (SHOP)* ━━━\n`;
      FOOD_ITEMS.forEach(f => {
        shopText += `• *[${f.id}]* ${f.name} - RM ${f.price}\n  (${f.desc})\n\n`;
      });
      shopText += `━━━━━━━━━━━━━━━━━━━━━━\nTaip \`.beli_makanan [id]\` untuk beli.`;
      return sock.sendMessage(from, { text: shopText });
    }

    if (cmd === "beli_makanan") {
      const fId = args[0];
      const food = FOOD_ITEMS.find(f => f.id === fId);
      if (!food) return sock.sendMessage(from, { text: `❌ Makanan tidak wujud.` });
      if (user.cash < food.price) return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup!` });

      user.cash -= food.price;
      if (!user.food) user.food = [];
      user.food.push(food.id);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { text: `🍽️ Berjaya beli *${food.name}*!` });
    }

    if (cmd === "upah_lawyer" || cmd === "lawyer") {
      if (now >= user.cooldowns.jailUntil) return sock.sendMessage(from, { text: `ℹ️ Anda tidak berada di dalam lokap.` });
      const lawyerFee = 500;
      if (user.cash < lawyerFee) return sock.sendMessage(from, { text: `❌ Duit tunai tidak cukup untuk upah peguam pro (RM ${lawyerFee}).` });

      user.cash -= lawyerFee;
      user.cooldowns.jailUntil = 0;
      user.stars = Math.max(0, user.stars - 1);
      updateUser(cleanSender, user);

      return sock.sendMessage(from, { text: `⚖️ [PEGUAM PRO BERJAYA] Anda telah membayar yuran guaman RM ${lawyerFee} dan bebas daripada lokap!` });
    }

    if (cmd === "kerja" || cmd === "work") {
      const cd = 3 * 60 * 1000;
      if (now < user.cooldowns.work) {
        const rem = Math.ceil((user.cooldowns.work - now) / 1000);
        return sock.sendMessage(from, { text: `⚠️ Sila berehat selama *${rem} saat* lagi.` });
      }

      const randomJob = JOBS[Math.floor(Math.random() * JOBS.length)];
      user.cash += randomJob.pay;
      user.jobId = randomJob.id;
      user.stats.works += 1;
      user.cooldowns.work = now + cd;
      updateUser(cleanSender, user);

      const randomDialog = DIALOG_KERJA[Math.floor(Math.random() * DIALOG_KERJA.length)];
      const halalUI = `╭━━━ 💼 *CORPORATE PAYROLL* ━━━
┃ Role: ${randomJob.name}
┃ Payout: +RM ${randomJob.pay.toLocaleString()}
┃ 💬 _"${randomDialog}"_
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      return sock.sendMessage(from, { text: halalUI });
    }

    if (cmd === "showroom") {
      let ui = `╭━━━ 🏎️ *VEHICLE SHOWROOM* ━━━\n*🏍️ MOTOR*\n`;
      VEHICLES.filter(v => v.type === "Motor").forEach(v => ui += `• [${v.id}] ${v.name} - RM ${v.price.toLocaleString()}\n`);
      ui += `\n*🚗 KERETA*\n`;
      VEHICLES.filter(v => v.type === "Kereta").forEach(v => ui += `• [${v.id}] ${v.name} - RM ${v.price.toLocaleString()}\n`);
      return sock.sendMessage(from, { text: ui });
    }

    if (cmd === "blackmarket" || cmd === "bm") {
      let bmText = `╭━━━ 🏴‍☠️ *DARKWEB MARKET* ━━━\n`;
      BLACKMARKET_ITEMS.forEach(i => {
        bmText += `• *[${i.id}]* ${i.name} - RM ${i.price.toLocaleString()}\n`;
      });
      return sock.sendMessage(from, { text: bmText });
    }

    if (cmd === "jenayah_menu" || cmd === "crime_menu") {
      let cText = `╭━━━ 🚨 *UNDERWORLD MISSIONS* ━━━\n`;
      CRIMES.forEach(c => {
        cText += `• *[ID ${c.id}]* ${c.name}\n  Payout: RM ${c.rewardMin} - RM ${c.rewardMax} | Denda Gagal: RM ${c.fine}\n\n`;
      });
      return sock.sendMessage(from, { text: cText });
    }

    if (cmd === "buat_jenayah" || cmd === "crime") {
      const cId = parseInt(args[0]);
      const targetCrime = CRIMES.find(c => c.id === cId || c.id.toString() === args[0]);

      if (!targetCrime) return sock.sendMessage(from, { text: `❌ ID Misi tidak sah.` });
      if (targetCrime.reqItem && !user.inventory.some(i => i.id === targetCrime.reqItem)) {
        return sock.sendMessage(from, { text: `❌ Perlukan gajet dari \`.blackmarket\`!` });
      }

      const cd = 5 * 60 * 1000;
      if (now < user.cooldowns.crime) return sock.sendMessage(from, { text: `🚨 Polis sedang meronda! Tunggu sebentar.` });

      const isSuccess = Math.random() < 0.5;
      user.cooldowns.crime = now + cd;

      if (isSuccess) {
        const reward = Math.floor(Math.random() * (targetCrime.rewardMax - targetCrime.rewardMin + 1)) + targetCrime.rewardMin;
        user.cash += reward;
        user.stats.crimes += 1;
        user.stars = Math.min(5, (user.stars || 0) + targetCrime.stars);
        updateUser(cleanSender, user);
        return sock.sendMessage(from, { text: `╭━━━ 🦹 *SUCCESS* ━━━\nLoot: +RM ${reward.toLocaleString()}\n╰━━━━━━━━━━━━━━━` });
      } else {
        const fineAmount = targetCrime.fine;
        user.cash = Math.max(0, user.cash - fineAmount);
        user.stars = Math.min(5, (user.stars || 0) + 1);
        user.cooldowns.jailUntil = now + (3 * 60 * 1000);
        updateUser(cleanSender, user);

        return sock.sendMessage(from, { text: `╭━━━ 🚨 *BUSTED!* ━━━\nMisi gagal! Denda *RM ${fineAmount}* dan masuk lokap 3 minit. (Taip \`.upah_lawyer\` untuk bebas segera).\n╰━━━━━━━━━━━━━━━━━━━━━━` });
      }
    }

  });
}

startBotEngine();
