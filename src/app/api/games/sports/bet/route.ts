import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, gameBets } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে প্রথমে লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { selections, matchId, pick, odds, amount } = body;

    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount < 1) {
      return NextResponse.json({ error: "সর্বনিম্ন স্পোর্টস বেট ৳১" }, { status: 400 });
    }

    if (user.balance < betAmount) {
      return NextResponse.json({ error: "পর্যাপ্ত ব্যালেন্স নেই! রিচার্জ করুন" }, { status: 400 });
    }

    // Support both 1xBet Multi-Bet (selections array) and single bet
    let combinedOdds = 1.0;
    let slipSummary = "";
    let gameIdStr = "";

    if (Array.isArray(selections) && selections.length > 0) {
      combinedOdds = selections.reduce((acc, s) => acc * (parseFloat(s.odds) || 1.0), 1.0);
      combinedOdds = parseFloat(combinedOdds.toFixed(2));
      const isMulti = selections.length > 1;
      slipSummary = `${isMulti ? `[MULTI ${selections.length}x] ` : ""}${selections
        .map((s) => `${s.pick} (@${s.odds})`)
        .join(" + ")}`;
      gameIdStr = selections.map((s) => s.matchId).join(",");
    } else {
      combinedOdds = parseFloat(odds) || 1.85;
      slipSummary = `${pick} (@${combinedOdds})`;
      gameIdStr = String(matchId || "1");
    }

    const newBalance = parseFloat((user.balance - betAmount).toFixed(2));
    await db
      .update(users)
      .set({
        balance: newBalance,
        totalBetAmount: parseFloat(((user.totalBetAmount || 0) + betAmount).toFixed(2)),
      })
      .where(eq(users.id, user.id));

    const potentialWin = parseFloat((betAmount * combinedOdds).toFixed(2));

    const [bet] = await db
      .insert(gameBets)
      .values({
        userId: user.id,
        gameType: "sports",
        gameId: gameIdStr,
        betAmount,
        multiplier: combinedOdds,
        prediction: slipSummary,
        outcome: `চলমান (সম্ভাব্য জয়: ৳${potentialWin.toFixed(2)})`,
        isWin: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `বেট স্লিপ নিশ্চিত হয়েছে! মোট অডস: ${combinedOdds}x | সম্ভাব্য জয়: ৳${potentialWin.toFixed(2)}`,
      bet,
      newBalance,
    });
  } catch (error) {
    console.error("Sports bet error:", error);
    return NextResponse.json({ error: "স্পোর্টস বেট স্থাপন করা যায়নি" }, { status: 500 });
  }
}
