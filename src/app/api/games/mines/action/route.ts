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
    const { action, betAmount = 20, minesCount = 3, gemsRevealed = 0, tileIndex } = body;

    // 1. Start Game
    if (action === "start") {
      const amount = parseFloat(betAmount);
      if (isNaN(amount) || amount < 1) {
        return NextResponse.json({ error: "সর্বনিম্ন বেট ৳১" }, { status: 400 });
      }

      if (user.balance < amount) {
        return NextResponse.json({ error: "পর্যাপ্ত ব্যালেন্স নেই!" }, { status: 400 });
      }

      // Generate 25 tiles (0 to 24) with mine locations
      const totalTiles = 25;
      const minesSet = new Set<number>();
      while (minesSet.size < Math.min(24, Math.max(1, minesCount))) {
        minesSet.add(Math.floor(Math.random() * totalTiles));
      }

      const newBalance = user.balance - amount;
      await db
        .update(users)
        .set({
          balance: newBalance,
          totalBetAmount: (user.totalBetAmount || 0) + amount,
        })
        .where(eq(users.id, user.id));

      return NextResponse.json({
        success: true,
        mineIndices: Array.from(minesSet),
        newBalance,
      });
    }

    // 2. Cashout
    if (action === "cashout") {
      const amount = parseFloat(betAmount);
      const gems = parseInt(gemsRevealed, 10);
      const mines = parseInt(minesCount, 10);

      // Multiplier formula: 0.98 * (25 / (25 - mines))^gems
      let multiplier = 1.0;
      for (let i = 0; i < gems; i++) {
        multiplier *= (25 - i) / (25 - mines - i);
      }
      multiplier = Math.max(1.1, parseFloat((multiplier * 0.98).toFixed(2)));

      const winAmount = amount * multiplier;
      const newBalance = user.balance + winAmount;

      await db
        .update(users)
        .set({
          balance: newBalance,
          totalWinAmount: (user.totalWinAmount || 0) + winAmount,
        })
        .where(eq(users.id, user.id));

      await db.insert(gameBets).values({
        userId: user.id,
        gameType: "mines",
        betAmount: amount,
        winAmount,
        multiplier,
        prediction: `${gems} Gems`,
        outcome: `Cashed out at ${multiplier.toFixed(2)}x`,
        isWin: true,
      });

      await db.insert(transactions).values({
        userId: user.id,
        type: "bonus",
        amount: winAmount,
        method: "system",
        status: "completed",
        note: `মাইনস ক্যাশআউট (${multiplier.toFixed(2)}x) - ৳${winAmount.toFixed(0)}`,
      });

      return NextResponse.json({
        success: true,
        winAmount,
        multiplier,
        newBalance,
      });
    }

    // 3. Hit Mine (Lost)
    if (action === "hit_mine") {
      const amount = parseFloat(betAmount);
      await db.insert(gameBets).values({
        userId: user.id,
        gameType: "mines",
        betAmount: amount,
        winAmount: 0,
        multiplier: 0,
        prediction: `Tile ${tileIndex}`,
        outcome: "Hit Mine",
        isWin: false,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন" }, { status: 400 });
  } catch (error) {
    console.error("Mines game error:", error);
    return NextResponse.json({ error: "মাইনস গেম চালাতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
