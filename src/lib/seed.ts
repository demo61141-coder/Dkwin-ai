import { db } from "@/db";
import { giftCodes, sportsMatches, wingoHistory, siteSettings } from "@/db/schema";
import { count } from "drizzle-orm";

export async function ensureSeedData() {
  try {
    // 1. Seed Site Settings if not existing
    const settingsCount = await db.select({ val: count() }).from(siteSettings);
    if (settingsCount[0]?.val === 0) {
      await db.insert(siteSettings).values({
        bkashNumber: "01788223344",
        nagadNumber: "01899112233",
        rocketNumber: "01955443322",
        upayNumber: "01622334455",
        usdtAddress: "TQx7Y2bnWpL8mQ9vZxKrP3sD1fG5hJ4kL8",
        bkashType: "Send Money (সেন্ড মানি)",
        nagadType: "Send Money (সেন্ড মানি)",
        rocketType: "Cash Out (ক্যাশ আউট)",
        depositRules:
          "১. উপরে দেওয়া অফিসিয়াল নাম্বারে নির্ধারিত পদ্ধতিতে (Send Money বা Cash Out) টাকা পাঠান।\n২. সর্বনিম্ন ডিপোজিট ৫০ টাকা। আপনার ইচ্ছেমতো যেকোনো পরিমাণ বসিয়ে ডিপোজিট করতে পারবেন।\n৩. টাকা পাঠানোর পর সঠিক TrxID এবং আপনার প্রেরক নাম্বার দিয়ে সাবমিট করুন।",
        pendingNotice:
          "আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন, এডমিন যাচাই করে অনুমোদন করবেন।",
        minDeposit: 50.0,
        minWithdraw: 110.0,
        minBet: 1.0,
        depositBonusPercent: 5.0,
        welcomeBonus: 0.0,
        wingoFeePercent: 2.0,
        nextWingoResult: "auto",
        nextCrashPoint: 0.0,
        crashMaxMultiplier: 25.0,
        slotWinRate: 42,
        referralCommissionPercent: 2.0,
        referralSignupBonus: 0.0,
        telegramUsername: "@DKWIN_Official_Support",
        adminPin: "admin1234",
        siteNotice:
          "DKWIN অফিসিয়াল গেমিং প্ল্যাটফর্মে স্বাগতম! সর্বনিম্ন ডিপোজিট ৫০ টাকা এবং সর্বনিম্ন বেট ১ টাকা। বিকাশ ও নগদে দ্রুত পেমেন্ট।",
        isDepositAutoApprove: false,
      });
    }

    // 2. Seed Gift Codes if not existing
    const giftCountResult = await db.select({ val: count() }).from(giftCodes);
    if (giftCountResult[0]?.val === 0) {
      await db.insert(giftCodes).values([
        { code: "DKWIN2026", amount: 50, maxClaims: 10000, isActive: true },
        { code: "DKWINVIP", amount: 100, maxClaims: 10000, isActive: true },
        { code: "BONUS50", amount: 50, maxClaims: 10000, isActive: true },
        { code: "LUCKY25", amount: 25, maxClaims: 10000, isActive: true },
      ]);
    }

    // 3. Seed Sports Matches
    const sportsCountResult = await db.select({ val: count() }).from(sportsMatches);
    if (sportsCountResult[0]?.val === 0) {
      await db.insert(sportsMatches).values([
        {
          sport: "cricket",
          tournament: "BPL 2026 (Bangladesh Premier League)",
          teamA: "Comilla Victorians",
          teamB: "Fortune Barishal",
          oddsA: 1.85,
          oddsDraw: 4.5,
          oddsB: 1.95,
          status: "live",
          score: "Comilla: 142/3 (15.2 ov) | RR: 9.26",
          startTime: "LIVE NOW",
        },
        {
          sport: "cricket",
          tournament: "ICC T20 Internationals",
          teamA: "Bangladesh Tigers",
          teamB: "India",
          oddsA: 2.45,
          oddsDraw: 5.0,
          oddsB: 1.55,
          status: "live",
          score: "BAN: 98/2 (11.0 ov) | Target: 176",
          startTime: "LIVE NOW",
        },
        {
          sport: "cricket",
          tournament: "IPL T20 (Indian Premier League)",
          teamA: "Chennai Super Kings",
          teamB: "Mumbai Indians",
          oddsA: 1.9,
          oddsDraw: 4.8,
          oddsB: 1.9,
          status: "upcoming",
          score: "Starts at 8:00 PM",
          startTime: "Today 20:00",
        },
        {
          sport: "football",
          tournament: "UEFA Champions League",
          teamA: "Real Madrid",
          teamB: "Manchester City",
          oddsA: 2.3,
          oddsDraw: 3.4,
          oddsB: 2.1,
          status: "live",
          score: "2 - 2 (78')",
          startTime: "LIVE NOW",
        },
        {
          sport: "football",
          tournament: "English Premier League",
          teamA: "Arsenal",
          teamB: "Chelsea",
          oddsA: 1.72,
          oddsDraw: 3.6,
          oddsB: 3.8,
          status: "upcoming",
          score: "Match Tonight",
          startTime: "Tonight 22:00",
        },
      ]);
    }

    // 4. Seed Wingo History if empty
    const wingoCountResult = await db.select({ val: count() }).from(wingoHistory);
    if (wingoCountResult[0]?.val === 0) {
      const now = Date.now();
      const initialRounds = [];
      const colorsMap = {
        0: { color: "red_violet", size: "small" },
        1: { color: "green", size: "small" },
        2: { color: "red", size: "small" },
        3: { color: "green", size: "small" },
        4: { color: "red", size: "small" },
        5: { color: "green_violet", size: "big" },
        6: { color: "red", size: "big" },
        7: { color: "green", size: "big" },
        8: { color: "red", size: "big" },
        9: { color: "green", size: "big" },
      };

      const timers: Array<{ type: string; sec: number }> = [
        { type: "30s", sec: 30 },
        { type: "1m", sec: 60 },
        { type: "3m", sec: 180 },
        { type: "5m", sec: 300 },
      ];

      for (const t of timers) {
        const currentEpochSec = Math.floor(now / 1000);
        const currentIndex = Math.floor(currentEpochSec / t.sec);
        for (let i = 15; i >= 1; i--) {
          const num = Math.floor(Math.random() * 10);
          const meta = colorsMap[num as keyof typeof colorsMap];
          const pastTime = now - i * t.sec * 1000;
          const dateStr = new Date(pastTime).toISOString().slice(0, 10).replace(/-/g, "");
          const period = `${dateStr}${currentIndex - i}`;
          initialRounds.push({
            periodNumber: `${t.type}_${period}`,
            timerType: t.type,
            winningNumber: num,
            winningColor: meta.color,
            winningSize: meta.size,
            createdAt: new Date(pastTime),
          });
        }
      }

      await db.insert(wingoHistory).values(initialRounds);
    }
  } catch (err) {
    console.error("Seed data error:", err);
  }
}
