import { db, pool } from "@/db";
import { giftCodes, sportsMatches, wingoHistory, siteSettings } from "@/db/schema";
import { count } from "drizzle-orm";

let schemaInitialized = false;

async function ensurePostgresTables() {
  if (!pool || schemaInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        balance DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        bonus_balance DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        commission_balance DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        vip_level INTEGER NOT NULL DEFAULT 1,
        vip_exp INTEGER NOT NULL DEFAULT 0,
        invite_code TEXT NOT NULL UNIQUE,
        referred_by TEXT,
        avatar TEXT DEFAULT '1',
        is_demo BOOLEAN NOT NULL DEFAULT false,
        is_banned BOOLEAN NOT NULL DEFAULT false,
        total_deposited DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        total_withdrawn DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        total_bet_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        total_win_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        last_check_in_date TEXT,
        check_in_streak INTEGER NOT NULL DEFAULT 0,
        last_spin_date TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        method TEXT NOT NULL DEFAULT 'bkash',
        account_number TEXT,
        trx_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS game_bets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        game_id TEXT DEFAULT 'default',
        period_number TEXT,
        bet_amount DOUBLE PRECISION NOT NULL,
        fee_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        win_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        multiplier DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        prediction TEXT NOT NULL,
        outcome TEXT,
        is_win BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      ALTER TABLE game_bets ADD COLUMN IF NOT EXISTS period_number TEXT;
      ALTER TABLE game_bets ADD COLUMN IF NOT EXISTS fee_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0;

      CREATE TABLE IF NOT EXISTS wingo_history (
        id SERIAL PRIMARY KEY,
        period_number TEXT NOT NULL UNIQUE,
        timer_type TEXT NOT NULL DEFAULT '1m',
        winning_number INTEGER NOT NULL,
        winning_color TEXT NOT NULL,
        winning_size TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS gift_codes (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        amount DOUBLE PRECISION NOT NULL,
        max_claims INTEGER NOT NULL DEFAULT 100,
        claims_count INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS gift_code_claims (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sports_matches (
        id SERIAL PRIMARY KEY,
        sport TEXT NOT NULL DEFAULT 'cricket',
        tournament TEXT NOT NULL,
        team_a TEXT NOT NULL,
        team_b TEXT NOT NULL,
        odds_a DOUBLE PRECISION NOT NULL DEFAULT 1.85,
        odds_draw DOUBLE PRECISION NOT NULL DEFAULT 3.4,
        odds_b DOUBLE PRECISION NOT NULL DEFAULT 1.95,
        status TEXT NOT NULL DEFAULT 'live',
        score TEXT DEFAULT '0/0 (0.0 ov)',
        start_time TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username TEXT NOT NULL DEFAULT 'Guest',
        message TEXT NOT NULL,
        is_support BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        bkash_number TEXT NOT NULL DEFAULT '01788223344',
        bkash_type TEXT NOT NULL DEFAULT 'সেন্ড মানি (Send Money)',
        nagad_number TEXT NOT NULL DEFAULT '01899112233',
        nagad_type TEXT NOT NULL DEFAULT 'সেন্ড মানি (Send Money)',
        rocket_number TEXT NOT NULL DEFAULT '01955443322',
        rocket_type TEXT NOT NULL DEFAULT 'ক্যাশ আউট (Cash Out)',
        upay_number TEXT NOT NULL DEFAULT '01622334455',
        upay_type TEXT NOT NULL DEFAULT 'সেন্ড মানি (Send Money)',
        usdt_address TEXT NOT NULL DEFAULT 'TQx7Y2bnWpL8mQ9vZxKrP3sD1fG5hJ4kL8',
        min_deposit DOUBLE PRECISION NOT NULL DEFAULT 50.0,
        min_withdraw DOUBLE PRECISION NOT NULL DEFAULT 110.0,
        min_bet DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        deposit_bonus_percent DOUBLE PRECISION NOT NULL DEFAULT 5.0,
        welcome_bonus DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        wingo_fee_percent DOUBLE PRECISION NOT NULL DEFAULT 2.0,
        next_wingo_result TEXT NOT NULL DEFAULT 'auto',
        next_crash_point DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        crash_max_multiplier DOUBLE PRECISION NOT NULL DEFAULT 25.0,
        thimble_win_rate DOUBLE PRECISION NOT NULL DEFAULT 40.0,
        slot_win_rate DOUBLE PRECISION NOT NULL DEFAULT 42.0,
        referral_commission_percent DOUBLE PRECISION NOT NULL DEFAULT 3.0,
        referral_bonus_amount DOUBLE PRECISION NOT NULL DEFAULT 50.0,
        telegram_username TEXT NOT NULL DEFAULT '@DKWIN_Official_Support',
        telegram_channel TEXT NOT NULL DEFAULT 'https://t.me/DKWIN_Official_Support',
        deposit_rules TEXT NOT NULL DEFAULT '১. উপরে দেওয়া অফিসিয়াল নাম্বারে নির্ধারিত নিয়মে (সেন্ড মানি / ক্যাশ আউট) টাকা পাঠান।',
        pending_notice TEXT NOT NULL DEFAULT 'আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন, এডমিন যাচাই করে অনুমোদন করবেন।',
        admin_pin TEXT NOT NULL DEFAULT '123456',
        site_notice TEXT NOT NULL DEFAULT 'DKWIN এ স্বাগতম! সর্বনিম্ন ডিপোজিট ৳৫০ এবং সর্বনিম্ন বেট ৳১।',
        is_deposit_auto_approve BOOLEAN NOT NULL DEFAULT false,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bkash_type TEXT NOT NULL DEFAULT 'সেন্ড মানি (Send Money)';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS nagad_type TEXT NOT NULL DEFAULT 'সেন্ড মানি (Send Money)';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS rocket_type TEXT NOT NULL DEFAULT 'ক্যাশ আউট (Cash Out)';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS upay_type TEXT NOT NULL DEFAULT 'সেন্ড মানি (Send Money)';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS min_bet DOUBLE PRECISION NOT NULL DEFAULT 1.0;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS wingo_fee_percent DOUBLE PRECISION NOT NULL DEFAULT 2.0;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS next_wingo_result TEXT NOT NULL DEFAULT 'auto';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS next_crash_point DOUBLE PRECISION NOT NULL DEFAULT 0.0;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS crash_max_multiplier DOUBLE PRECISION NOT NULL DEFAULT 25.0;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS thimble_win_rate DOUBLE PRECISION NOT NULL DEFAULT 40.0;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS slot_win_rate DOUBLE PRECISION NOT NULL DEFAULT 42.0;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS referral_commission_percent DOUBLE PRECISION NOT NULL DEFAULT 3.0;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS referral_bonus_amount DOUBLE PRECISION NOT NULL DEFAULT 50.0;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS telegram_username TEXT NOT NULL DEFAULT '@DKWIN_Official_Support';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS telegram_channel TEXT NOT NULL DEFAULT 'https://t.me/DKWIN_Official_Support';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS deposit_rules TEXT NOT NULL DEFAULT '১. উপরে দেওয়া অফিসিয়াল নাম্বারে নির্ধারিত নিয়মে (সেন্ড মানি / ক্যাশ আউট) টাকা পাঠান।';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS pending_notice TEXT NOT NULL DEFAULT 'আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন, এডমিন যাচাই করে অনুমোদন করবেন।';
    `);
    schemaInitialized = true;
  } catch (e) {
    console.warn("Postgres auto-schema check:", e);
  }
}

export async function ensureSeedData() {
  try {
    await ensurePostgresTables();

    // 1. Seed Site Settings if not existing
    const settingsCount = await db.select({ val: count() }).from(siteSettings);
    if (settingsCount[0]?.val === 0) {
      await db.insert(siteSettings).values({
        bkashNumber: "01788223344",
        bkashType: "সেন্ড মানি (Send Money)",
        nagadNumber: "01899112233",
        nagadType: "সেন্ড মানি (Send Money)",
        rocketNumber: "01955443322",
        rocketType: "ক্যাশ আউট (Cash Out)",
        upayNumber: "01622334455",
        upayType: "সেন্ড মানি (Send Money)",
        usdtAddress: "TQx7Y2bnWpL8mQ9vZxKrP3sD1fG5hJ4kL8",
        depositRules:
          "১. উপরে দেওয়া অফিসিয়াল নাম্বারে নির্ধারিত নিয়মে (সেন্ড মানি / ক্যাশ আউট) টাকা পাঠান।\n২. সর্বনিম্ন ডিপোজিট ৫০ টাকা। আপনার ইচ্ছেমতো যেকোনো পরিমাণ বসিয়ে ডিপোজিট করতে পারবেন।\n৩. টাকা পাঠানোর পর সঠিক TrxID এবং আপনার প্রেরক নাম্বার দিয়ে সাবমিট করুন।",
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
        thimbleWinRate: 40,
        slotWinRate: 42,
        referralCommissionPercent: 3.0,
        referralBonusAmount: 50.0,
        telegramUsername: "@DKWIN_Official_Support",
        telegramChannel: "https://t.me/DKWIN_Official_Support",
        adminPin: "123456",
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
