import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wingoHistory, gameBets, users, transactions, siteSettings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const colorsMap: Record<number, { color: string; size: string }> = {
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

function calculatePayoutForNumber(num: number, bets: Array<typeof gameBets.$inferSelect>, feePct: number): number {
  const meta = colorsMap[num];
  let totalPayout = 0;

  for (const bet of bets) {
    const pred = bet.prediction?.toLowerCase();
    if (!pred) continue;
    let mult = 0;
    if (pred === "green" && (meta.color === "green" || meta.color === "green_violet")) {
      mult = meta.color === "green_violet" ? 1.5 : 2.0;
    } else if (pred === "red" && (meta.color === "red" || meta.color === "red_violet")) {
      mult = meta.color === "red_violet" ? 1.5 : 2.0;
    } else if (pred === "violet" && (num === 0 || num === 5)) {
      mult = 4.5;
    } else if (pred === "big" && meta.size === "big") {
      mult = 2.0;
    } else if (pred === "small" && meta.size === "small") {
      mult = 2.0;
    } else if (pred === String(num)) {
      mult = 9.0;
    }

    if (mult > 0) {
      const fee = bet.feeAmount !== null && bet.feeAmount !== undefined ? bet.feeAmount : (bet.betAmount * feePct) / 100;
      const effectiveBet = Math.max(0, bet.betAmount - fee);
      totalPayout += effectiveBet * mult;
    }
  }
  return totalPayout;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { periodNumber, timerType = "1m" } = body;

    if (!periodNumber) {
      return NextResponse.json({ error: "পিরিয়ড নাম্বার প্রয়োজন" }, { status: 400 });
    }

    // Check if already settled
    const existing = await db
      .select()
      .from(wingoHistory)
      .where(eq(wingoHistory.periodNumber, periodNumber));

    let winningResult = existing[0];

    const [settings] = await db.select().from(siteSettings).limit(1);
    const feePct = settings?.wingoFeePercent ?? 2.0;
    const controlMode = (settings?.nextWingoResult || "auto").toLowerCase();

    // Fetch pending bets for this period
    const pendingBets = await db
      .select()
      .from(gameBets)
      .where(and(eq(gameBets.gameType, "wingo"), eq(gameBets.periodNumber, periodNumber)));

    if (!winningResult) {
      let chosenNumber = Math.floor(Math.random() * 10);

      // 1. Check if Admin forced a specific number 0-9
      if (/^[0-9]$/.test(controlMode)) {
        chosenNumber = parseInt(controlMode, 10);
      }
      // 2. Check if Admin forced Big / Small / Green / Red / Violet
      else if (controlMode === "big") {
        const candidates = [5, 6, 7, 8, 9];
        chosenNumber = candidates.sort(
          (a, b) => calculatePayoutForNumber(a, pendingBets, feePct) - calculatePayoutForNumber(b, pendingBets, feePct)
        )[0];
      } else if (controlMode === "small") {
        const candidates = [0, 1, 2, 3, 4];
        chosenNumber = candidates.sort(
          (a, b) => calculatePayoutForNumber(a, pendingBets, feePct) - calculatePayoutForNumber(b, pendingBets, feePct)
        )[0];
      } else if (controlMode === "green") {
        const candidates = [1, 3, 7, 9, 5];
        chosenNumber = candidates.sort(
          (a, b) => calculatePayoutForNumber(a, pendingBets, feePct) - calculatePayoutForNumber(b, pendingBets, feePct)
        )[0];
      } else if (controlMode === "red") {
        const candidates = [2, 4, 6, 8, 0];
        chosenNumber = candidates.sort(
          (a, b) => calculatePayoutForNumber(a, pendingBets, feePct) - calculatePayoutForNumber(b, pendingBets, feePct)
        )[0];
      } else if (controlMode === "violet") {
        const candidates = [0, 5];
        chosenNumber = candidates.sort(
          (a, b) => calculatePayoutForNumber(a, pendingBets, feePct) - calculatePayoutForNumber(b, pendingBets, feePct)
        )[0];
      } else if (controlMode === "least_bet" && pendingBets.length > 0) {
        const candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        chosenNumber = candidates.sort(
          (a, b) => calculatePayoutForNumber(a, pendingBets, feePct) - calculatePayoutForNumber(b, pendingBets, feePct)
        )[0];
      } else if (pendingBets.length > 0 && Math.random() < 0.6) {
        // Balanced auto mode: 60% of the time pick among the 5 lowest-payout numbers so house stays profitable while giving average wins
        const candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(
          (a, b) => calculatePayoutForNumber(a, pendingBets, feePct) - calculatePayoutForNumber(b, pendingBets, feePct)
        );
        chosenNumber = candidates[Math.floor(Math.random() * 4)];
      }

      const meta = colorsMap[chosenNumber];

      const [newRound] = await db
        .insert(wingoHistory)
        .values({
          periodNumber,
          timerType,
          winningNumber: chosenNumber,
          winningColor: meta.color,
          winningSize: meta.size,
        })
        .returning();

      winningResult = newRound;

      // If Admin set a specific one-shot result (0-9, big, small, green, red, violet), reset to "auto" after applying
      if (settings && controlMode !== "auto" && controlMode !== "least_bet") {
        await db
          .update(siteSettings)
          .set({ nextWingoResult: "auto" })
          .where(eq(siteSettings.id, settings.id));
      }
    }

    const updatedUserWinnings: Record<number, number> = {};

    for (const bet of pendingBets) {
      // Skip already settled bets
      if (bet.outcome) continue;

      let isWin = false;
      let multiplier = 0;
      const pred = bet.prediction?.toLowerCase();

      if (!pred) continue;

      if (pred === "green" && (winningResult.winningColor === "green" || winningResult.winningColor === "green_violet")) {
        isWin = true;
        multiplier = winningResult.winningColor === "green_violet" ? 1.5 : 2.0;
      } else if (pred === "red" && (winningResult.winningColor === "red" || winningResult.winningColor === "red_violet")) {
        isWin = true;
        multiplier = winningResult.winningColor === "red_violet" ? 1.5 : 2.0;
      } else if (pred === "violet" && (winningResult.winningNumber === 0 || winningResult.winningNumber === 5)) {
        isWin = true;
        multiplier = 4.5;
      } else if (pred === "big" && winningResult.winningSize === "big") {
        isWin = true;
        multiplier = 2.0;
      } else if (pred === "small" && winningResult.winningSize === "small") {
        isWin = true;
        multiplier = 2.0;
      } else if (pred === String(winningResult.winningNumber)) {
        isWin = true;
        multiplier = 9.0;
      }

      // House retains fee (1% - 3%) on both win and loss
      const fee = bet.feeAmount !== null && bet.feeAmount !== undefined ? bet.feeAmount : (bet.betAmount * feePct) / 100;
      const effectiveBet = Math.max(0, bet.betAmount - fee);
      const winAmount = isWin ? parseFloat((effectiveBet * multiplier).toFixed(2)) : 0;

      await db
        .update(gameBets)
        .set({
          isWin,
          multiplier,
          winAmount,
          outcome: `${winningResult.winningNumber} (${winningResult.winningSize.toUpperCase()} · ${winningResult.winningColor})`,
        })
        .where(eq(gameBets.id, bet.id));

      if (isWin && bet.userId) {
        updatedUserWinnings[bet.userId] = (updatedUserWinnings[bet.userId] || 0) + winAmount;
      }
    }

    // Credit winners
    for (const [userIdStr, totalWin] of Object.entries(updatedUserWinnings)) {
      const uId = parseInt(userIdStr, 10);
      const [u] = await db.select().from(users).where(eq(users.id, uId));
      if (u) {
        await db
          .update(users)
          .set({
            balance: parseFloat((u.balance + totalWin).toFixed(2)),
            totalWinAmount: parseFloat(((u.totalWinAmount || 0) + totalWin).toFixed(2)),
          })
          .where(eq(users.id, uId));

        await db.insert(transactions).values({
          userId: uId,
          type: "bonus",
          amount: totalWin,
          method: "system",
          status: "completed",
          note: `Win Go জয় - পিরিয়ড ${periodNumber}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      result: winningResult,
    });
  } catch (error) {
    console.error("Wingo settle error:", error);
    return NextResponse.json({ error: "উইন গো সেটেল করা যায়নি" }, { status: 500 });
  }
}
