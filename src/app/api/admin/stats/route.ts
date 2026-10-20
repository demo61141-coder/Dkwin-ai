import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions, gameBets } from "@/db/schema";
import { count } from "drizzle-orm";
import { getWingoPeriodInfo } from "@/app/api/games/wingo/history/route";

export async function GET() {
  try {
    const totalUsersResult = await db.select({ val: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.val || 0;

    const allTxns = await db.select().from(transactions);

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let pendingDepositsCount = 0;
    let pendingWithdrawalsCount = 0;

    allTxns.forEach((t) => {
      if (t.type === "deposit" && t.status === "completed") {
        totalDeposits += t.amount;
      }
      if (t.type === "deposit" && t.status === "pending") {
        pendingDepositsCount++;
      }
      if (t.type === "withdraw" && t.status === "completed") {
        totalWithdrawals += t.amount;
      }
      if (t.type === "withdraw" && t.status === "pending") {
        pendingWithdrawalsCount++;
      }
    });

    const allBets = await db.select().from(gameBets);
    let totalBetVolume = 0;
    let totalPaidWinnings = 0;
    let totalFeeEarned = 0;

    // Live current round breakdown + All-time WinGo breakdown
    const periodInfo = getWingoPeriodInfo("1m");
    const liveBreakdown = {
      activePeriod: periodInfo.activePeriod,
      remainingSeconds: periodInfo.remainingSeconds,
      totalRoundBet: 0,
      big: 0,
      small: 0,
      green: 0,
      red: 0,
      violet: 0,
      numbers: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0 } as Record<string, number>,
    };

    const overallWingoBreakdown = {
      totalWingoBet: 0,
      big: 0,
      small: 0,
      green: 0,
      red: 0,
      violet: 0,
      numbers: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0 } as Record<string, number>,
    };

    allBets.forEach((b) => {
      totalBetVolume += b.betAmount;
      totalFeeEarned += b.feeAmount || 0;
      if (b.isWin) {
        totalPaidWinnings += b.winAmount;
      }

      if (b.gameType === "wingo") {
        const pred = (b.prediction || "").toLowerCase();
        overallWingoBreakdown.totalWingoBet += b.betAmount;
        if (pred === "big") overallWingoBreakdown.big += b.betAmount;
        else if (pred === "small") overallWingoBreakdown.small += b.betAmount;
        else if (pred === "green") overallWingoBreakdown.green += b.betAmount;
        else if (pred === "red") overallWingoBreakdown.red += b.betAmount;
        else if (pred === "violet") overallWingoBreakdown.violet += b.betAmount;
        else if (pred in overallWingoBreakdown.numbers) {
          overallWingoBreakdown.numbers[pred] += b.betAmount;
        }

        // Current active round or unsettled bets
        if (!b.outcome || b.periodNumber === periodInfo.activePeriod) {
          liveBreakdown.totalRoundBet += b.betAmount;
          if (pred === "big") liveBreakdown.big += b.betAmount;
          else if (pred === "small") liveBreakdown.small += b.betAmount;
          else if (pred === "green") liveBreakdown.green += b.betAmount;
          else if (pred === "red") liveBreakdown.red += b.betAmount;
          else if (pred === "violet") liveBreakdown.violet += b.betAmount;
          else if (pred in liveBreakdown.numbers) {
            liveBreakdown.numbers[pred] += b.betAmount;
          }
        }
      }
    });

    const houseProfit = parseFloat((totalBetVolume - totalPaidWinnings).toFixed(2));

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDeposits,
        totalWithdrawals,
        pendingDepositsCount,
        pendingWithdrawalsCount,
        totalBetVolume,
        totalPaidWinnings,
        totalFeeEarned: parseFloat(totalFeeEarned.toFixed(2)),
        houseProfit,
        wingoLive: liveBreakdown,
        wingoOverall: overallWingoBreakdown,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "পরিসংখ্যান আনা যায়নি" }, { status: 500 });
  }
}
