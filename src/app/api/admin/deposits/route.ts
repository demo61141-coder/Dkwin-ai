import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, users, siteSettings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const deposits = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        amount: transactions.amount,
        method: transactions.method,
        accountNumber: transactions.accountNumber,
        trxId: transactions.trxId,
        status: transactions.status,
        note: transactions.note,
        createdAt: transactions.createdAt,
        username: users.username,
        phone: users.phone,
        userBalance: users.balance,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.type, "deposit"))
      .orderBy(desc(transactions.createdAt))
      .limit(100);

    return NextResponse.json({ deposits });
  } catch (error) {
    console.error("Admin get deposits error:", error);
    return NextResponse.json({ error: "ডিপোজিট রেকর্ড আনা যায়নি" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txnId, action } = body; // action: 'approve' | 'reject'

    const [txn] = await db.select().from(transactions).where(eq(transactions.id, Number(txnId)));
    if (!txn || txn.type !== "deposit") {
      return NextResponse.json({ error: "ডিপোজিট রেকর্ড পাওয়া যায়নি" }, { status: 404 });
    }

    // Prevent double approval or double rejection
    if (txn.status !== "pending") {
      return NextResponse.json(
        { error: "এই ডিপোজিট রিকোয়েস্টটি ইতিমধ্যে প্রসেস করা হয়েছে!" },
        { status: 400 }
      );
    }

    const [settings] = await db.select().from(siteSettings).limit(1);
    const bonusPct = settings?.depositBonusPercent ?? 5;
    const refCommPct = settings?.referralCommissionPercent ?? 2;

    if (action === "approve") {
      // Mark transaction completed first to prevent race conditions
      await db
        .update(transactions)
        .set({
          status: "completed",
          note: `এডমিন কর্তৃক অনুমোদিত (+${bonusPct}% বোনাস)`,
        })
        .where(eq(transactions.id, txn.id));

      if (txn.userId) {
        const [u] = await db.select().from(users).where(eq(users.id, txn.userId));
        if (u) {
          const bonus = (txn.amount * bonusPct) / 100;
          const totalCredit = txn.amount + bonus;
          const newExp = (u.vipExp || 0) + Math.floor(txn.amount);
          const newVip = Math.min(10, Math.max(u.vipLevel || 1, 1 + Math.floor(newExp / 1000)));

          await db
            .update(users)
            .set({
              balance: u.balance + totalCredit,
              totalDeposited: (u.totalDeposited || 0) + txn.amount,
              vipExp: newExp,
              vipLevel: newVip,
            })
            .where(eq(users.id, u.id));

          // Referral Commission on Deposit
          if (u.referredBy && refCommPct > 0) {
            const [referrer] = await db
              .select()
              .from(users)
              .where(eq(users.inviteCode, u.referredBy));
            if (referrer) {
              const commAmount = parseFloat(((txn.amount * refCommPct) / 100).toFixed(2));
              if (commAmount > 0) {
                await db
                  .update(users)
                  .set({
                    balance: referrer.balance + commAmount,
                    commissionBalance: (referrer.commissionBalance || 0) + commAmount,
                  })
                  .where(eq(users.id, referrer.id));

                await db.insert(transactions).values({
                  userId: referrer.id,
                  type: "commission",
                  amount: commAmount,
                  method: "system",
                  status: "completed",
                  note: `রেফারেল ডিপোজিট কমিশন (${refCommPct}% from ${u.username})`,
                });
              }
            }
          }
        }
      }

      return NextResponse.json({ success: true, message: "ডিপোজিট সফলভাবে অনুমোদন করা হয়েছে!" });
    }

    if (action === "reject") {
      await db
        .update(transactions)
        .set({
          status: "rejected",
          note: "ভুল TrxID বা অপ্রাপ্ত পেমেন্ট (Rejected)",
        })
        .where(eq(transactions.id, txn.id));

      return NextResponse.json({ success: true, message: "ডিপোজিট বাতিল করা হয়েছে" });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন" }, { status: 400 });
  } catch (error) {
    console.error("Admin deposit action error:", error);
    return NextResponse.json({ error: "অ্যাকশন সম্পন্ন করা যায়নি" }, { status: 500 });
  }
}
