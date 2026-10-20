import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, transactions, siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে প্রথমে লগইন করুন" }, { status: 401 });
    }

    const [settings] = await db.select().from(siteSettings).limit(1);
    const minDeposit = settings?.minDeposit ?? 50;
    const bonusPct = settings?.depositBonusPercent ?? 5;
    const isAutoApprove = settings?.isDepositAutoApprove ?? false;
    const pendingNotice =
      settings?.pendingNotice ||
      "আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন, এডমিন যাচাই করে অনুমোদন করবেন।";

    const body = await req.json();
    const { amount, method, accountNumber, trxId } = body;

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < minDeposit) {
      return NextResponse.json({ error: `সর্বনিম্ন ডিপোজিট পরিমাণ ৳${minDeposit}` }, { status: 400 });
    }

    if (!trxId || trxId.trim().length < 4) {
      return NextResponse.json({ error: "সঠিক ট্রানজেকশন আইডি (TrxID) দিন" }, { status: 400 });
    }

    // Check duplicate TrxID
    const allTxns = await db.select().from(transactions).where(eq(transactions.trxId, trxId.trim().toUpperCase()));
    if (allTxns.length > 0) {
      return NextResponse.json({ error: "এই TrxID ইতিমধ্যে ব্যবহার করা হয়েছে!" }, { status: 400 });
    }

    if (isAutoApprove) {
      const extraBonus = (depositAmount * bonusPct) / 100;
      const totalCredit = depositAmount + extraBonus;
      const newBalance = user.balance + totalCredit;
      const newTotalDeposited = (user.totalDeposited || 0) + depositAmount;

      let newVip = user.vipLevel;
      const newExp = (user.vipExp || 0) + Math.floor(depositAmount);
      if (newExp >= 1000 && newVip < 10) {
        newVip = Math.min(10, 1 + Math.floor(newExp / 1000));
      }

      await db
        .update(users)
        .set({
          balance: newBalance,
          totalDeposited: newTotalDeposited,
          vipLevel: newVip,
          vipExp: newExp,
        })
        .where(eq(users.id, user.id));

      const [txn] = await db
        .insert(transactions)
        .values({
          userId: user.id,
          type: "deposit",
          amount: depositAmount,
          method: method || "bkash",
          accountNumber: accountNumber || "Unknown",
          trxId: trxId.trim().toUpperCase(),
          status: "completed",
          note: `অটো রিচার্জ সফল (+${bonusPct}% বোনাস ৳${extraBonus.toFixed(0)})`,
        })
        .returning();

      return NextResponse.json({
        success: true,
        status: "completed",
        message: `রিচার্জ সফল! ৳${depositAmount} আপনার ওয়ালেটে যোগ হয়েছে।`,
        pendingNotice,
        transaction: txn,
        newBalance,
      });
    }

    // Standard Manual Verification Flow -> Pending Status
    const [txn] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        type: "deposit",
        amount: depositAmount,
        method: method || "bkash",
        accountNumber: accountNumber || "Unknown",
        trxId: trxId.trim().toUpperCase(),
        status: "pending",
        note: `পেন্ডিং ডিপোজিট রিকোয়েস্ট (যাচাই চলছে)`,
      })
      .returning();

    return NextResponse.json({
      success: true,
      status: "pending",
      message: `ডিপোজিট রিকোয়েস্ট সাবমিট হয়েছে (পেন্ডিং)! ${pendingNotice}`,
      pendingNotice,
      transaction: txn,
      newBalance: user.balance,
    });
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: "ডিপোজিট রিকোয়েস্ট সম্পন্ন করা যায়নি" }, { status: 500 });
  }
}
