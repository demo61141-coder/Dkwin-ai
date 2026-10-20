import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, transactions, siteSettings } from "@/db/schema";
import { generateInviteCode } from "@/lib/auth";
import { ensureSeedData } from "@/lib/seed";
import { eq, or } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { phone, password, inviteCode } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: "মোবাইল নাম্বার ও পাসওয়ার্ড প্রয়োজন" }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন" }, { status: 400 });
    }

    // Check existing
    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.phone, cleanPhone), eq(users.username, cleanPhone)));

    if (existing.length > 0) {
      return NextResponse.json({ error: "এই নাম্বার দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে" }, { status: 400 });
    }

    const [settings] = await db.select().from(siteSettings).limit(1);
    const welcomeBonus = settings?.welcomeBonus ?? 0.0;

    const userInviteCode = generateInviteCode();
    const cleanRef = inviteCode ? inviteCode.trim().toUpperCase() : null;

    const [newUser] = await db
      .insert(users)
      .values({
        username: `DK_${cleanPhone.slice(-4)}_${Math.floor(100 + Math.random() * 900)}`,
        phone: cleanPhone,
        password: password,
        balance: welcomeBonus, // Default 0.0 unless admin sets welcomeBonus
        bonusBalance: 0.0,
        commissionBalance: 0.0,
        vipLevel: 1,
        inviteCode: userInviteCode,
        referredBy: cleanRef,
        isDemo: false,
      })
      .returning();

    if (welcomeBonus > 0) {
      await db.insert(transactions).values({
        userId: newUser.id,
        type: "bonus",
        amount: welcomeBonus,
        method: "system",
        status: "completed",
        note: "ওয়েলকাম সাইনআপ বোনাস (Welcome Bonus)",
      });
    }

    // Credit referrer signup bonus if configured in admin
    if (cleanRef && (settings?.referralSignupBonus ?? 0) > 0) {
      const [referrer] = await db.select().from(users).where(eq(users.inviteCode, cleanRef));
      if (referrer) {
        const refBonus = settings!.referralSignupBonus;
        await db
          .update(users)
          .set({
            commissionBalance: (referrer.commissionBalance || 0) + refBonus,
            balance: referrer.balance + refBonus,
          })
          .where(eq(users.id, referrer.id));

        await db.insert(transactions).values({
          userId: referrer.id,
          type: "commission",
          amount: refBonus,
          method: "system",
          status: "completed",
          note: `রেফারেল বোনাস (${newUser.username})`,
        });
      }
    }

    const res = NextResponse.json({
      success: true,
      message:
        welcomeBonus > 0
          ? `রেজিস্ট্রেশন সফল হয়েছে! ৳${welcomeBonus} ওয়েলকাম বোনাস যোগ হয়েছে।`
          : "রেজিস্ট্রেশন সফল হয়েছে! খেলা শুরু করতে ডিপোজিট করুন।",
      user: newUser,
    });

    res.cookies.set("bdwin_user_id", String(newUser.id), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "রেজিস্ট্রেশন করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
