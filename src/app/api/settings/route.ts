import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { ensureSeedData } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeedData();
    const [settings] = await db.select().from(siteSettings).limit(1);

    return NextResponse.json({
      settings: settings || {
        bkashNumber: "01788223344",
        nagadNumber: "01899112233",
        rocketNumber: "01955443322",
        upayNumber: "01622334455",
        usdtAddress: "TQx7Y2bnWpL8mQ9vZxKrP3sD1fG5hJ4kL8",
        bkashType: "Send Money (সেন্ড মানি)",
        nagadType: "Send Money (সেন্ড মানি)",
        rocketType: "Cash Out (ক্যাশ আউট)",
        depositRules:
          "১. উপরে দেওয়া অফিসিয়াল নাম্বারে নির্ধারিত পদ্ধতিতে (Send Money বা Cash Out) টাকা পাঠান।\n২. সর্বনিম্ন ডিপোজিট ৫০ টাকা। আপনার ইচ্ছেমতো যেকোনো পরিমাণ বসিয়ে ডিপোজিট করতে পারবেন।\n৩. টাকা পাঠানোর পর সঠিক TrxID এবং আপনার প্রেরক নাম্বার দিয়ে সাবমিট করুন।",
        pendingNotice:
          "আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন, এডমিন যাচাই করে অনুমোদন করবেন।",
        minDeposit: 50.0,
        minWithdraw: 110.0,
        minBet: 1.0,
        depositBonusPercent: 5.0,
        welcomeBonus: 0.0,
        wingoFeePercent: 2.0,
        referralCommissionPercent: 2.0,
        referralSignupBonus: 0.0,
        telegramUsername: "@DKWIN_Official_Support",
        siteNotice:
          "DKWIN অফিসিয়াল গেমিং প্ল্যাটফর্মে স্বাগতম! সর্বনিম্ন ডিপোজিট ৫০ টাকা এবং সর্বনিম্ন বেট ১ টাকা। বিকাশ ও নগদে দ্রুত পেমেন্ট।",
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      {
        settings: {
          bkashNumber: "01788223344",
          nagadNumber: "01899112233",
          rocketNumber: "01955443322",
          upayNumber: "01622334455",
          usdtAddress: "TQx7Y2bnWpL8mQ9vZxKrP3sD1fG5hJ4kL8",
          bkashType: "Send Money (সেন্ড মানি)",
          nagadType: "Send Money (সেন্ড মানি)",
          rocketType: "Cash Out (ক্যাশ আউট)",
          depositRules:
            "১. উপরে দেওয়া অফিসিয়াল নাম্বারে নির্ধারিত পদ্ধতিতে (Send Money বা Cash Out) টাকা পাঠান।\n২. সর্বনিম্ন ডিপোজিট ৫০ টাকা।\n৩. টাকা পাঠানোর পর সঠিক TrxID দিয়ে সাবমিট করুন।",
          pendingNotice:
            "আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন।",
          minDeposit: 50.0,
          minWithdraw: 110.0,
          minBet: 1.0,
          depositBonusPercent: 5.0,
          welcomeBonus: 0.0,
          wingoFeePercent: 2.0,
          referralCommissionPercent: 2.0,
          referralSignupBonus: 0.0,
          telegramUsername: "@DKWIN_Official_Support",
          siteNotice: "DKWIN অফিসিয়াল গেমিং প্ল্যাটফর্মে স্বাগতম!",
        },
      },
      { status: 200 }
    );
  }
}
