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
    const minWithdraw = settings?.minWithdraw ?? 110;
    const pendingNotice =
      settings?.pendingNotice ||
      "আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন।";

    const body = await req.json();
    const { amount, method, accountNumber } = body;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < minWithdraw) {
      return NextResponse.json({ error: `সর্বনিম্ন উত্তোলন পরিমাণ ৳${minWithdraw}` }, { status: 400 });
    }

    if (user.balance < withdrawAmount) {
      return NextResponse.json({ error: "আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!" }, { status: 400 });
    }

    if (!accountNumber || accountNumber.trim().length < 10) {
      return NextResponse.json({ error: "সঠিক ওয়ালেট / মোবাইল নাম্বার দিন" }, { status: 400 });
    }

    // Deduct balance immediately while withdrawal is pending
    const newBalance = parseFloat((user.balance - withdrawAmount).toFixed(2));

    await db
      .update(users)
      .set({
        balance: newBalance,
      })
      .where(eq(users.id, user.id));

    const [txn] = await db
      .insert(transactions)
      .values({
        userId: user.id,
        type: "withdraw",
        amount: withdrawAmount,
        method: method || "bkash",
        accountNumber: accountNumber.trim(),
        status: "pending", // Pending until Admin approves or rejects
        note: `পেন্ডিং উত্তোলন আবেদন (${(method || "bkash").toUpperCase()}: ${accountNumber.trim()})`,
      })
      .returning();

    return NextResponse.json({
      success: true,
      status: "pending",
      message: `৳${withdrawAmount} উত্তোলনের আবেদন সাবমিট হয়েছে (পেন্ডিং)! ${pendingNotice}`,
      pendingNotice,
      transaction: txn,
      newBalance,
    });
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json({ error: "উত্তোলন সম্পন্ন করা যায়নি" }, { status: 500 });
  }
}
