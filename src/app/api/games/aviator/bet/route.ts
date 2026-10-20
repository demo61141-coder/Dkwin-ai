import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, gameBets, transactions, siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSeedData } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeedData();
    const [settings] = await db.select().from(siteSettings).limit(1);
    const forced = settings?.nextCrashPoint ?? 0;
    const maxCap = settings?.crashMaxMultiplier ?? 25.0;

    let crashPoint = 1.05 + Math.random() * 2.8;
    if (Math.random() < 0.25) crashPoint = 3.5 + Math.random() * 10.0;
    if (Math.random() < 0.06) crashPoint = 12.0 + Math.random() * 40.0;
    if (Math.random() < 0.15) crashPoint = 1.0 + Math.random() * 0.25; // Low crash for house balance

    crashPoint = Math.min(maxCap, parseFloat(crashPoint.toFixed(2)));

    if (forced > 0 && settings) {
      crashPoint = parseFloat(forced.toFixed(2));
      await db
        .update(siteSettings)
        .set({ nextCrashPoint: 0 })
        .where(eq(siteSettings.id, settings.id));
    }

    return NextResponse.json({
      crashPoint: Math.max(1.0, crashPoint),
      maxCap,
    });
  } catch {
    return NextResponse.json({ crashPoint: 1.85, maxCap: 25.0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে প্রথমে লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { action, amount, multiplier, crashPoint, betId, gameVariant = "aviator" } = body;

    // Action: 'place_bet'
    if (action === "place_bet") {
      const betAmount = parseFloat(amount);
      if (isNaN(betAmount) || betAmount < 1) {
        return NextResponse.json({ error: "সর্বনিম্ন বেটের পরিমাণ ৳১" }, { status: 400 });
      }

      if (user.balance < betAmount) {
        return NextResponse.json({ error: "পর্যাপ্ত ব্যালেন্স নেই!" }, { status: 400 });
      }

      const newBalance = parseFloat((user.balance - betAmount).toFixed(2));
      await db
        .update(users)
        .set({
          balance: newBalance,
          totalBetAmount: parseFloat(((user.totalBetAmount || 0) + betAmount).toFixed(2)),
        })
        .where(eq(users.id, user.id));

      const [bet] = await db
        .insert(gameBets)
        .values({
          userId: user.id,
          gameType: "aviator",
          gameId: String(gameVariant),
          betAmount,
          prediction: `Crash (${gameVariant})`,
          isWin: false,
        })
        .returning();

      return NextResponse.json({
        success: true,
        betId: bet.id,
        newBalance,
      });
    }

    // Action: 'cashout'
    if (action === "cashout") {
      const parsedMult = parseFloat(multiplier);
      const parsedBetId = parseInt(betId, 10);

      if (!parsedBetId || isNaN(parsedMult) || parsedMult < 1.01) {
        return NextResponse.json({ error: "অবৈধ ক্যাশআউট রিকোয়েস্ট" }, { status: 400 });
      }

      const [bet] = await db.select().from(gameBets).where(eq(gameBets.id, parsedBetId));
      if (!bet || bet.userId !== user.id || bet.isWin || bet.outcome) {
        return NextResponse.json({ error: "বেট পাওয়া যায়নি বা ইতিমধ্যে ক্যাশআউট হয়েছে" }, { status: 400 });
      }

      const winAmount = parseFloat((bet.betAmount * parsedMult).toFixed(2));
      const newBalance = parseFloat((user.balance + winAmount).toFixed(2));

      await db
        .update(users)
        .set({
          balance: newBalance,
          totalWinAmount: parseFloat(((user.totalWinAmount || 0) + winAmount).toFixed(2)),
        })
        .where(eq(users.id, user.id));

      await db
        .update(gameBets)
        .set({
          isWin: true,
          multiplier: parsedMult,
          winAmount,
          outcome: `Cashed out at ${parsedMult.toFixed(2)}x`,
        })
        .where(eq(gameBets.id, parsedBetId));

      await db.insert(transactions).values({
        userId: user.id,
        type: "bonus",
        amount: winAmount,
        method: "system",
        status: "completed",
        note: `ক্র্যাশ গেম উইন (${parsedMult.toFixed(2)}x) - ৳${winAmount.toFixed(2)}`,
      });

      return NextResponse.json({
        success: true,
        message: `অভিনন্দন! ${parsedMult.toFixed(2)}x এ ক্যাশআউট করে ৳${winAmount.toFixed(2)} জিতেছেন!`,
        winAmount,
        newBalance,
      });
    }

    // Action: 'crashed' (Lost)
    if (action === "crashed") {
      const parsedBetId = parseInt(betId, 10);
      if (parsedBetId) {
        await db
          .update(gameBets)
          .set({
            isWin: false,
            outcome: `Crashed at ${crashPoint || "1.00"}x`,
          })
          .where(eq(gameBets.id, parsedBetId));
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "অজানা অ্যাকশন" }, { status: 400 });
  } catch (error) {
    console.error("Aviator bet error:", error);
    return NextResponse.json({ error: "ক্র্যাশ বেট সম্পন্ন করা যায়নি" }, { status: 500 });
  }
}
