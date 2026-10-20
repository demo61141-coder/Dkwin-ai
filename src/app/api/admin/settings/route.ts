import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSeedData } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeedData();
    const [settings] = await db.select().from(siteSettings).limit(1);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Admin get settings error:", error);
    return NextResponse.json({ error: "সেটিংস লোড করা যায়নি" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const [existing] = await db.select().from(siteSettings).limit(1);

    if (existing) {
      const [updated] = await db
        .update(siteSettings)
        .set({
          bkashNumber: body.bkashNumber !== undefined ? body.bkashNumber : existing.bkashNumber,
          nagadNumber: body.nagadNumber !== undefined ? body.nagadNumber : existing.nagadNumber,
          rocketNumber: body.rocketNumber !== undefined ? body.rocketNumber : existing.rocketNumber,
          upayNumber: body.upayNumber !== undefined ? body.upayNumber : existing.upayNumber,
          usdtAddress: body.usdtAddress !== undefined ? body.usdtAddress : existing.usdtAddress,
          bkashType: body.bkashType !== undefined ? body.bkashType : existing.bkashType,
          nagadType: body.nagadType !== undefined ? body.nagadType : existing.nagadType,
          rocketType: body.rocketType !== undefined ? body.rocketType : existing.rocketType,
          depositRules: body.depositRules !== undefined ? body.depositRules : existing.depositRules,
          pendingNotice: body.pendingNotice !== undefined ? body.pendingNotice : existing.pendingNotice,
          minDeposit: body.minDeposit !== undefined ? parseFloat(body.minDeposit) : existing.minDeposit,
          minWithdraw: body.minWithdraw !== undefined ? parseFloat(body.minWithdraw) : existing.minWithdraw,
          minBet: body.minBet !== undefined ? parseFloat(body.minBet) : existing.minBet,
          depositBonusPercent:
            body.depositBonusPercent !== undefined ? parseFloat(body.depositBonusPercent) : existing.depositBonusPercent,
          welcomeBonus: body.welcomeBonus !== undefined ? parseFloat(body.welcomeBonus) : existing.welcomeBonus,
          wingoFeePercent:
            body.wingoFeePercent !== undefined ? parseFloat(body.wingoFeePercent) : existing.wingoFeePercent,
          nextWingoResult: body.nextWingoResult !== undefined ? body.nextWingoResult : existing.nextWingoResult,
          nextCrashPoint:
            body.nextCrashPoint !== undefined ? parseFloat(body.nextCrashPoint) : existing.nextCrashPoint,
          crashMaxMultiplier:
            body.crashMaxMultiplier !== undefined ? parseFloat(body.crashMaxMultiplier) : existing.crashMaxMultiplier,
          slotWinRate: body.slotWinRate !== undefined ? parseInt(body.slotWinRate, 10) : existing.slotWinRate,
          referralCommissionPercent:
            body.referralCommissionPercent !== undefined
              ? parseFloat(body.referralCommissionPercent)
              : existing.referralCommissionPercent,
          referralSignupBonus:
            body.referralSignupBonus !== undefined
              ? parseFloat(body.referralSignupBonus)
              : existing.referralSignupBonus,
          telegramUsername: body.telegramUsername !== undefined ? body.telegramUsername : existing.telegramUsername,
          adminPin: body.adminPin || existing.adminPin,
          siteNotice: body.siteNotice !== undefined ? body.siteNotice : existing.siteNotice,
          isDepositAutoApprove:
            body.isDepositAutoApprove !== undefined ? Boolean(body.isDepositAutoApprove) : existing.isDepositAutoApprove,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.id, existing.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: "সিস্টেম ও গেম কন্ট্রোল সেটিংস সফলভাবে সংরক্ষিত হয়েছে!",
        settings: updated,
      });
    }

    return NextResponse.json({ error: "সেটিংস পাওয়া যায়নি" }, { status: 404 });
  } catch (error) {
    console.error("Admin update settings error:", error);
    return NextResponse.json({ error: "সেটিংস আপডেট করা যায়নি" }, { status: 500 });
  }
}
