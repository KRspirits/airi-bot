import { MENU_ZONES } from '../lib/menudata.js';

// 📜 MENU - teks sahaja, ikut format yang dipilih owner.
// Nama, tunai, bank dan kenderaan diambil dari profil pemain.
export default {
    name: 'menu',
    alias: ['help', 'senarai', 'panel'],
    category: 'info',
    execute: async ({ sock, m, user }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const nama = user?.name || sender.split('@')[0];
        const tunai = Number(user?.wallet || 0).toLocaleString('en-US');
        const bank = Number(user?.bank || 0).toLocaleString('en-US');
        const kenderaan = user?.vehicle?.name ? String(user.vehicle.name).split(' ')[0] : 'Kaki';
        const teks = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
   ✨  AIRI'S CORNER  ·  MENU
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
👤  @${nama}
💵  Tunai   RM ${tunai}
🏦  Bank    RM ${bank}
🚗  Kenderaan  ${kenderaan}

━━ 1. AI, MUZIK & RPG ━━
   .airi [teks]   ·   .misi (RPG)   ·   .roast @user
   .puji @user   ·   .pantun_ai   ·   .teka_lagu
   .jawab [lirik]   ·   .buletin_cyber   ·   .taksir [gambar/teks]

━━ 2. EKONOMI, PASARAN & EVENT ━━
   .kerja   ·   .daily   ·   .bal
   .transfer @user   ·   .pasaran   ·   .beli_emas
   .beli_btc   ·   .pasar_pemain   ·   .jual_emas
   .jual_btc   ·   .lelong_kontena   ·   .bida [rm]
   .kutip [kod]

━━ 3. JENTERA, PLAT & HARTA ━━
   .showroom [1-5]   ·   .beli_kenderaan [id]   ·   .lelong_plat
   .beli_plat [no]   ·   .lumba [id]   ·   .bengkel
   .pasang   ·   .list_hartanah   ·   .beli_rumah [id]
   .kutip_sewa

━━ 4. PERTANIAN & JETI MEGA ━━
   .kebun   ·   .tanam [cili/strawberi]   ·   .tuai
   .kedai_pancing   ·   .beli_pancing [kategori] [id]   ·   .mancing (Joran)
   .jala (Tebaran Pukal)   ·   .ikan   ·   .jual_ikan
   .akuarium   ·   .bela_ikan [no]   ·   .baling_magnet
   .kedai_magnet   ·   .jual_besi

━━ 5. UNDERWORLD & MAHKAMAH ━━
   .jenayah (Senarai)   ·   .bm (Pasar Gelap)   ·   .beli_bm [nama]
   .cuci_duit [jumlah]   ·   .rompak @user   ·   .santau @user
   .hackbank   ·   .rayu [alasan]   ·   .ikat_jamin @user
   .hutang_ahlong   ·   .bayar_ahlong   ·   .bounty

━━ 6. GADGET, PET & WARUNG ━━
   .device   ·   .beli_phone [id]   ·   .shop (Warung)
   .makan [id]   ·   .kedai_pet   ·   .beli_pet [nama]
   .beli_telur   ·   .tetas_telur

━━ 7. KASINO & MINI-GAMES ━━
   .serang_boss   ·   .bgk   ·   .coinflip
   .slot   ·   .tarik_tali   ·   .teka_nombor
   .kotak_beracun   ·   .tembak_botol   ·   .lumba_kuda
   .tikam_nombor   ·   .gacha_mlbb   ·   .tiktok_affiliate
   .split_bil

━━ 8. INFO & GELARAN ━━
   .myid   ·   .profile   ·   .badge
   .top   ·   .musim

━━ 9. GENG, DRAMA & KOLEKSI ━━
   .geng   ·   .heist   ·   .sertai_heist
   .dendam   ·   .balas @user   ·   .profil
   .wanted   ·   .siasat @user   ·   .album
   .gabung [no] [no]   ·   .pameran [no]   ·   .tangkap [kod]
   .liga   ·   .panggil [nama]   ·   .ingat [fakta]

━━ 11. HIBURAN & RAWAK ━━
   .dadu   ·   .koin   ·   .suit [batu/gunting/kertas]
   .bola8 [soalan]   ·   .ship [nama1] [nama2]   ·   .rate
   .mood   ·   .horoskop   ·   .ramal
   .teka   ·   .jawab_teka [jawapan]   ·   .joke
   .fakta   ·   .motivasi   ·   .bmi [kg] [cm]
   .kira [a] [+-*/] [b]   ·   .passgen   ·   .lotot
   ada 50 fun; taip .dadu untuk mula

━━ 12. JUDI AI (TARASAN MAX RM5,000) ━━
   .tekaan [1-10] [rm]   ·   .roda [rm]   ·   .kad_besar h/r [rm]
   .dadu7 atas/bawah/tujuh [rm]   ·   .peti [1-5] [rm]   ·   .kupon [rm]
   .tarung @user [rm]

━━ 13. BERITA & JUAL GAMBAR ━━
   .berita_cyber   ·   .jual_gambar (hantar gambar barang)

━━ 14. PENCAPAIAN & ALBUM ━━
   .achievement   ·   .pencapaian (kad pencapaian)   ·   .album

Taip nama command untuk guna. Contoh: .mancing`;
        return sock.sendMessage(jid, { text: teks }, { quoted: m });
    }
};
