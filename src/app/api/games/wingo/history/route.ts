import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wingoHistory, siteSettings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ensureSeedData } from "@/lib/seed";

export function getWingoPeriodInfo(timerType: string, nowMs = Date.now()) {
  let secondsInterval = 60;
  if (timerType === "30s") secondsInterval = 30;
  if (timerType === "3m") secondsInterval = 180;
  if (timerType === "5m") secondsInterval = 300;

  const currentEpochSec = Math.floor(nowMs / 1000);
  const remainingSeconds = secondsInterval - (currentEpochSec % secondsInterval);
  const periodIndex = Math.floor(currentEpochSec / secondsInterval);
  const dateStr = new Date(nowMs).toISOString().slice(0, 10).replace(/-/g, "");
  const activePeriod = `${dateStr}${periodIndex}`;
  const prevPeriod = `${dateStr}${periodIndex - 1}`;

  return {
    secondsInterval,
    remainingSeconds,
    activePeriod,
    prevPeriod,
    serverTime: nowMs,
  };
}

export async function GET(req: NextRequest) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(req.url);
    const timerType = searchParams.get("timerType") || "1m";

    const info = getWingoPeriodInfo(timerType);

    const allHistory = await db
      .select()
      .from(wingoHistory)
      .where(eq(wingoHistory.timerType, timerType))
      .orderBy(desc(wingoHistory.createdAt))
      .limit(30);

    const [settings] = await db.select().from(siteSettings).limit(1);

    let redCount = 0;
    let greenCount = 0;
    let violetCount = 0;
    let bigCount = 0;
    let smallCount = 0;

    allHistory.forEach((h) => {
      if (h.winningColor.includes("red")) redCount++;
      if (h.winningColor.includes("green")) greenCount++;
      if (h.winningColor.includes("violet")) violetCount++;
      if (h.winningSize === "big") bigCount++;
      if (h.winningSize === "small") smallCount++;
    });

    return NextResponse.json({
      history: allHistory,
      activePeriod: info.activePeriod,
      prevPeriod: info.prevPeriod,
      remainingSeconds: info.remainingSeconds,
      secondsInterval: info.secondsInterval,
      serverTime: info.serverTime,
      feePercent: settings?.wingoFeePercent ?? 2.0,
      minBet: settings?.minBet ?? 1.0,
      stats: {
        redCount,
        greenCount,
        violetCount,
        bigCount,
        smallCount,
        total: allHistory.length,
      },
    });
  } catch (error) {
    console.error("Wingo history error:", error);
    return NextResponse.json({ error: "উইন গো হিস্ট্রি পাওয়া যায়নি" }, { status: 500 });
  }
}
