import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const withdrawals = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        amount: transactions.amount,
        method: transactions.method,
        accountNumber: transactions.accountNumber,
        status: transactions.status,
        note: transactions.note,
        createdAt: transactions.createdAt,
        username: users.username,
        phone: users.phone,
        userBalance: users.balance,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.type, "withdraw"))
      .orderBy(desc(transactions.createdAt))
      .limit(100);

    return NextResponse.json({ withdrawals });
  } catch (error) {
    console.error("Admin get withdrawals error:", error);
    return NextResponse.json({ error: "উত্তোলন রেকর্ড আনা যায়নি" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txnId, action } = body; // action: 'approve' | 'reject'

    const [txn] = await db.select().from(transactions).where(eq(transactions.id, Number(txnId)));
    if (!txn || txn.type !== "withdraw") {
      return NextResponse.json({ error: "উত্তোলন রেকর্ড পাওয়া যায়নি" }, { status: 404 });
    }

    // CRITICAL FIX: Block repeated clicks if already completed or rejected!
    if (txn.status !== "pending") {
      return NextResponse.json(
        { error: "এই উত্তোলন রিকোয়েস্টটি ইতিমধ্যে প্রসেস করা হয়েছে! পুনরায় পরিবর্তন করা যাবে না।" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      await db
        .update(transactions)
        .set({
          status: "completed",
          note: `পেমেন্ট সম্পন্ন হয়েছে (${txn.method?.toUpperCase()}: ${txn.accountNumber})`,
        })
        .where(eq(transactions.id, txn.id));

      if (txn.userId) {
        const [u] = await db.select().from(users).where(eq(users.id, txn.userId));
        if (u) {
          await db
            .update(users)
            .set({
              totalWithdrawn: (u.totalWithdrawn || 0) + txn.amount,
            })
            .where(eq(users.id, u.id));
        }
      }

      return NextResponse.json({ success: true, message: "উত্তোলন পেমেন্ট সম্পন্ন ও অনুমোদিত হয়েছে!" });
    }

    if (action === "reject") {
      // Mark as rejected FIRST so repeated clicks cannot refund multiple times
      await db
        .update(transactions)
        .set({
          status: "rejected",
          note: "উত্তোলন বাতিল ও ব্যালেন্স রিফান্ড করা হয়েছে",
        })
        .where(eq(transactions.id, txn.id));

      // Refund balance to user ONCE
      if (txn.userId) {
        const [u] = await db.select().from(users).where(eq(users.id, txn.userId));
        if (u) {
          await db
            .update(users)
            .set({
              balance: parseFloat((u.balance + txn.amount).toFixed(2)),
            })
            .where(eq(users.id, u.id));
        }
      }

      return NextResponse.json({
        success: true,
        message: "উত্তোলন বাতিল হয়েছে এবং টাকা ইউজারের ব্যালেন্সে একবার ফেরত গেছে",
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন" }, { status: 400 });
  } catch (error) {
    console.error("Admin withdraw action error:", error);
    return NextResponse.json({ error: "অ্যাকশন সম্পন্ন করা যায়নি" }, { status: 500 });
  }
}
