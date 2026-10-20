import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, gameBets, transactions, siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SLOT_SYMBOLS: Record<string, string[]> = {
  super_ace: ["🃏", "♠️", "♥️", "♦️", "♣️", "👑", "🌟"],
  fortune_tiger: ["🐯", "🧧", "🍊", "🪙", "🔔", "💎", "⭐"],
  golden_empire: ["🏛️", "👑", "🦅", "🏺", "💎", "🪙", "☀️"],
  gates_of_olympus: ["⚡", "👑", "💍", "⏳", "💎", "🏆", "🔥"],
  boxing_king: ["🥊", "🏆", "🔔", "🩳", "💥", "👑", "⭐"],
  sweet_bonanza: ["🍭", "🍬", "🍇", "🍉", "🍎", "🍌", "💣"],
  money_coming: ["💵", "🪙", "💰", "7️⃣", "💎", "🎯", "⚡"],
  crazy_777: ["7️⃣", "🔔", "🍒", "BAR", "💎", "🪙", "⭐"],
  fortune_gems: ["💎", "🔮", "👑", "💍", "🌟", "🪙", "🔥"],
  wild_bounty: ["🤠", "🔫", "💰", "🥃", "⭐", "🪙", "💎"],
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে প্রথমে লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { slotId = "super_ace", betAmount = 10 } = body;

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 1) {
      return NextResponse.json({ error: "সর্বনিম্ন বেটের পরিমাণ ৳১" }, { status: 400 });
    }

    if (user.balance < amount) {
      return NextResponse.json({ error: "পর্যাপ্ত ব্যালেন্স নেই! রিচার্জ করুন" }, { status: 400 });
    }

    const [settings] = await db.select().from(siteSettings).limit(1);
    const slotWinRate = settings?.slotWinRate ?? 42; // 0 to 100%

    let balance = user.balance - amount;

    const symbolPool = SLOT_SYMBOLS[slotId] || SLOT_SYMBOLS.super_ace;
    const shouldWin = Math.random() * 100 < slotWinRate;

    const randSym = () => symbolPool[Math.floor(Math.random() * symbolPool.length)];
    const grid: string[][] = [
      [randSym(), randSym(), randSym()],
      [randSym(), randSym(), randSym()],
      [randSym(), randSym(), randSym()],
    ];

    let isWin = false;
    let multiplier = 0;
    const winningLines: number[] = [];

    if (shouldWin) {
      isWin = true;
      const winSym = randSym();
      const roll = Math.random();
      if (roll < 0.08) {
        // Mega Win (15x - 25x)
        multiplier = 15.0;
        grid[1] = [winSym, winSym, winSym];
        grid[0] = [winSym, winSym, winSym];
        winningLines.push(0, 1);
      } else if (roll < 0.35) {
        // Full 3-in-a-row (3x - 5x)
        multiplier = 3.5;
        grid[1] = [winSym, winSym, winSym];
        winningLines.push(1);
      } else {
        // Standard Win (1.5x - 2.2x)
        multiplier = 1.8;
        grid[1][0] = winSym;
        grid[1][1] = winSym;
        winningLines.push(1);
      }
    } else {
      // Ensure no accidental 3-match when shouldWin is false
      if (grid[1][0] === grid[1][1] && grid[1][1] === grid[1][2]) {
        grid[1][2] = symbolPool[(symbolPool.indexOf(grid[1][2]) + 1) % symbolPool.length];
      }
      if (grid[0][0] === grid[0][1] && grid[0][1] === grid[0][2]) {
        grid[0][2] = symbolPool[(symbolPool.indexOf(grid[0][2]) + 1) % symbolPool.length];
      }
      if (grid[2][0] === grid[2][1] && grid[2][1] === grid[2][2]) {
        grid[2][2] = symbolPool[(symbolPool.indexOf(grid[2][2]) + 1) % symbolPool.length];
      }
    }

    const winAmount = isWin ? parseFloat((amount * multiplier).toFixed(2)) : 0;
    balance = parseFloat((balance + winAmount).toFixed(2));

    await db
      .update(users)
      .set({
        balance,
        totalBetAmount: parseFloat(((user.totalBetAmount || 0) + amount).toFixed(2)),
        totalWinAmount: parseFloat(((user.totalWinAmount || 0) + winAmount).toFixed(2)),
      })
      .where(eq(users.id, user.id));

    await db.insert(gameBets).values({
      userId: user.id,
      gameType: "slots",
      gameId: slotId,
      betAmount: amount,
      winAmount,
      multiplier,
      prediction: "Spin",
      outcome: isWin ? `Win ${multiplier.toFixed(1)}x` : "No Match",
      isWin,
    });

    if (isWin && winAmount > 0) {
      await db.insert(transactions).values({
        userId: user.id,
        type: "bonus",
        amount: winAmount,
        method: "system",
        status: "completed",
        note: `স্লট উইন (${slotId}) - ৳${winAmount.toFixed(2)}`,
      });
    }

    return NextResponse.json({
      success: true,
      grid,
      isWin,
      multiplier,
      winAmount,
      winningLines,
      newBalance: balance,
    });
  } catch (error) {
    console.error("Slots spin error:", error);
    return NextResponse.json({ error: "স্লট স্পিন সম্পন্ন করা যায়নি" }, { status: 500 });
  }
}
