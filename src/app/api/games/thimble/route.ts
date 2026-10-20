import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, gameBets, transactions, siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে প্রথমে লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { betAmount = 10, ballCount = 1, selectedCup = 0 } = body;

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 1) {
      return NextResponse.json({ error: "সর্বনিম্ন বেট ৳১" }, { status: 400 });
    }

    if (user.balance < amount) {
      return NextResponse.json({ error: "পর্যাপ্ত ব্যালেন্স নেই! রিচার্জ করুন।" }, { status: 400 });
    }

    const [settings] = await db.select().from(siteSettings).limit(1);
    const adminWinRate = settings?.slotWinRate ?? 42; // 0 to 100

    // Base win probability adjusted by adminWinRate
    const effectiveWinChance =
      ballCount === 2 ? Math.min(0.85, (adminWinRate / 100) * 1.35) : Math.min(0.75, (adminWinRate / 100) * 0.85);

    const isWin = Math.random() < effectiveWinChance;
    const multiplier = ballCount === 2 ? 1.44 : 2.88;
    const winAmount = isWin ? parseFloat((amount * multiplier).toFixed(2)) : 0;

    // Determine ball positions (0, 1, 2)
    const cups = [0, 1, 2];
    const otherCups = cups.filter((c) => c !== Number(selectedCup));
    let ballPositions: number[] = [];

    if (ballCount === 1) {
      if (isWin) {
        ballPositions = [Number(selectedCup)];
      } else {
        ballPositions = [otherCups[Math.floor(Math.random() * otherCups.length)]];
      }
    } else {
      // 2 balls
      if (isWin) {
        ballPositions = [Number(selectedCup), otherCups[Math.floor(Math.random() * otherCups.length)]];
      } else {
        ballPositions = otherCups;
      }
    }

    const newBalance = parseFloat((user.balance - amount + winAmount).toFixed(2));

    await db
      .update(users)
      .set({
        balance: newBalance,
        totalBetAmount: parseFloat(((user.totalBetAmount || 0) + amount).toFixed(2)),
        totalWinAmount: parseFloat(((user.totalWinAmount || 0) + winAmount).toFixed(2)),
      })
      .where(eq(users.id, user.id));

    await db.insert(gameBets).values({
      userId: user.id,
      gameType: "thimble",
      betAmount: amount,
      winAmount,
      multiplier: isWin ? multiplier : 0,
      prediction: `Cup #${Number(selectedCup) + 1} (${ballCount} Ball)`,
      outcome: isWin ? `Win ${multiplier}x` : `Ball in Cup #${ballPositions.map((p) => p + 1).join(",")}`,
      isWin,
    });

    if (isWin && winAmount > 0) {
      await db.insert(transactions).values({
        userId: user.id,
        type: "bonus",
        amount: winAmount,
        method: "system",
        status: "completed",
        note: `থিম্বল উইন (${multiplier}x) - ৳${winAmount.toFixed(2)}`,
      });
    }

    return NextResponse.json({
      success: true,
      isWin,
      multiplier: isWin ? multiplier : 0,
      winAmount,
      ballPositions,
      newBalance,
    });
  } catch (error) {
    console.error("Thimble game error:", error);
    return NextResponse.json({ error: "থিম্বল গেম সম্পন্ন করা যায়নি" }, { status: 500 });
  }
}
