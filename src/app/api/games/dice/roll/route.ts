import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, gameBets, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে প্রথমে লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { target = 50, condition = "over", amount = 20 } = body;

    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount < 1) {
      return NextResponse.json({ error: "সর্বনিম্ন বেট ৳১" }, { status: 400 });
    }

    if (user.balance < betAmount) {
      return NextResponse.json({ error: "পর্যাপ্ত ব্যালেন্স নেই!" }, { status: 400 });
    }

    const roll = Math.floor(Math.random() * 100); // 0 to 99
    let isWin = false;
    let multiplier = 1.96;

    if (condition === "over") {
      isWin = roll > target;
      const winChance = (99 - target) / 100;
      multiplier = parseFloat((0.98 / Math.max(0.01, winChance)).toFixed(2));
    } else {
      isWin = roll < target;
      const winChance = target / 100;
      multiplier = parseFloat((0.98 / Math.max(0.01, winChance)).toFixed(2));
    }

    const winAmount = isWin ? betAmount * multiplier : 0;
    const newBalance = user.balance - betAmount + winAmount;

    await db
      .update(users)
      .set({
        balance: newBalance,
        totalBetAmount: (user.totalBetAmount || 0) + betAmount,
        totalWinAmount: (user.totalWinAmount || 0) + winAmount,
      })
      .where(eq(users.id, user.id));

    await db.insert(gameBets).values({
      userId: user.id,
      gameType: "dice",
      betAmount,
      winAmount,
      multiplier,
      prediction: `${condition.toUpperCase()} ${target}`,
      outcome: `Rolled ${roll}`,
      isWin,
    });

    if (isWin && winAmount > 0) {
      await db.insert(transactions).values({
        userId: user.id,
        type: "bonus",
        amount: winAmount,
        method: "system",
        status: "completed",
        note: `ডাইস উইন (${roll}) - ৳${winAmount.toFixed(0)}`,
      });
    }

    return NextResponse.json({
      success: true,
      roll,
      isWin,
      multiplier,
      winAmount,
      newBalance,
    });
  } catch (error) {
    console.error("Dice error:", error);
    return NextResponse.json({ error: "ডাইস রোল সম্পন্ন করা যায়নি" }, { status: 500 });
  }
}
