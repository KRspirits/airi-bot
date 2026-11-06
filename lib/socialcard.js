import { createCanvas, loadImage } from '@napi-rs/canvas';

// =========================================================================
// 🎵📸 KAD PROFIL TIKTOK & INSTAGRAM. Gambar profil pemain diambil dari WhatsApp (jika boleh).
// TikTok: hitam dengan cahaya cyan & merah jambu. Instagram: gradient ungu-jingga.
// =========================================================================

export async function renderSocialProfile({ platform, nama, avatar, pengikut, likes, posts, tuntutan }) {
    const ig = platform === 'ig';
    const W = 720, H = 900;
    const c = createCanvas(W, H), ctx = c.getContext('2d');

    const latar = ctx.createLinearGradient(0, 0, W, H);
    if (ig) { latar.addColorStop(0, '#833ab4'); latar.addColorStop(0.5, '#fd1d1d'); latar.addColorStop(1, '#fcb045'); }
    else { latar.addColorStop(0, '#000000'); latar.addColorStop(1, '#101018'); }
    ctx.fillStyle = latar; ctx.fillRect(0, 0, W, H);

    if (!ig) {
        const cahaya1 = ctx.createRadialGradient(W * 0.2, 120, 10, W * 0.2, 120, 320);
        cahaya1.addColorStop(0, 'rgba(37,244,238,0.35)'); cahaya1.addColorStop(1, 'rgba(37,244,238,0)');
        const cahaya2 = ctx.createRadialGradient(W * 0.85, 260, 10, W * 0.85, 260, 320);
        cahaya2.addColorStop(0, 'rgba(254,44,85,0.35)'); cahaya2.addColorStop(1, 'rgba(254,44,85,0)');
        ctx.fillStyle = cahaya1; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = cahaya2; ctx.fillRect(0, 0, W, H);
    }

    // gambar profil (bulat)
    const cx = 180, cy = 200, r = 110;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.fillStyle = ig ? '#fcb045' : '#25f4ee'; ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    let gambar = null;
    if (avatar) { try { gambar = await loadImage(avatar); } catch { gambar = null; } }
    if (gambar) {
        const s = Math.max((r * 2) / gambar.width, (r * 2) / gambar.height);
        ctx.drawImage(gambar, cx - (gambar.width * s) / 2, cy - (gambar.height * s) / 2, gambar.width * s, gambar.height * s);
    } else {
        ctx.fillStyle = '#334155'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 96px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText((nama || '?').charAt(0).toUpperCase(), cx, cy + 34); ctx.textAlign = 'left';
    }
    ctx.restore();

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif';
    ctx.fillText(String(nama || 'Pengguna').slice(0, 22), 320, 170);
    ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = ig ? '#fde68a' : '#25f4ee';
    ctx.fillText(ig ? 'Instagram' : 'TikTok', 320, 214);

    // statistik
    const stat = [['Pengikut', String(pengikut)], ['Like', String(likes)], ['Post', String(posts.length)]];
    stat.forEach(([label, nilai], i) => {
        const x = 60 + i * 215;
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, 360, 190, 120);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 46px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(nilai, x + 95, 422);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '24px sans-serif';
        ctx.fillText(label, x + 95, 460); ctx.textAlign = 'left';
    });

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`Tuntutan tertunggak: RM ${Number(tuntutan).toLocaleString('en-US')}`, 60, 540);

    ctx.fillStyle = ig ? '#fde68a' : '#25f4ee'; ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Post terkini', 60, 600);
    const senarai = posts.slice(0, 3);
    if (!senarai.length) {
        ctx.fillStyle = '#cbd5e1'; ctx.font = '24px sans-serif';
        ctx.fillText(`Belum ada post. Taip .${ig ? 'instagram' : 'tiktok'} post [caption]`, 60, 650);
    }
    senarai.forEach((p, i) => {
        const y = 630 + i * 90;
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(60, y, 600, 74);
        ctx.fillStyle = '#ffffff'; ctx.font = '24px sans-serif';
        const teks = `${p.gambar ? '📷 ' : ''}${p.caption || '(gambar sahaja)'}`;
        ctx.fillText(teks.slice(0, 40), 80, y + 32);
        ctx.fillStyle = '#e2e8f0'; ctx.font = '20px sans-serif';
        ctx.fillText(`❤️ ${p.likes}   🔁 ${p.shares}`, 80, y + 60);
    });
    return c.toBuffer('image/png');
}
