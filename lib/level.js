// LEVEL PEMAIN. Level = floor(sqrt(XP/50)) + 1.  L3 = 200 XP, L6 = 1250 XP, L8 = 2450 XP.
// XP datang dari .kerja (+15) dan .daily (+50). Command tertentu dikunci mengikut level.
export const LEVEL_REQUIRED = { mancing: 3, jala: 8, magnet: 6, baling_magnet: 6 };

export function levelOf(user) {
    return Math.floor(Math.sqrt(Math.max(0, Number(user?.xp) || 0) / 50)) + 1;
}

export function xpUntukLevel(level) {
    return (Math.max(1, level) - 1) ** 2 * 50;
}
