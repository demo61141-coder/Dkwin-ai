import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sportsMatches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSeedData } from "@/lib/seed";

export async function GET(req: NextRequest) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(req.url);
    const sport = searchParams.get("sport");

    let matches = await db.select().from(sportsMatches);
    if (sport && sport !== "all") {
      matches = matches.filter((m) => m.sport === sport);
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Get matches error:", error);
    return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { action, id, sport, tournament, teamA, teamB, oddsA, oddsDraw, oddsB, status, score, startTime } = body;

    if (action === "create") {
      if (!teamA || !teamB || !tournament) {
        return NextResponse.json({ error: "টুর্নামেন্ট এবং দুই দলের নাম আবশ্যক" }, { status: 400 });
      }
      const [created] = await db
        .insert(sportsMatches)
        .values({
          sport: sport || "cricket",
          tournament,
          teamA,
          teamB,
          oddsA: parseFloat(oddsA) || 1.85,
          oddsDraw: parseFloat(oddsDraw) || 3.5,
          oddsB: parseFloat(oddsB) || 1.95,
          status: status || "live",
          score: score || "Live Match",
          startTime: startTime || "LIVE NOW",
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: "নতুন ম্যাচ সফলভাবে যুক্ত হয়েছে!",
        match: created,
      });
    }

    if (action === "update" && id) {
      const [updated] = await db
        .update(sportsMatches)
        .set({
          score: score !== undefined ? score : undefined,
          oddsA: oddsA !== undefined ? parseFloat(oddsA) : undefined,
          oddsDraw: oddsDraw !== undefined ? parseFloat(oddsDraw) : undefined,
          oddsB: oddsB !== undefined ? parseFloat(oddsB) : undefined,
          status: status !== undefined ? status : undefined,
        })
        .where(eq(sportsMatches.id, Number(id)))
        .returning();

      return NextResponse.json({
        success: true,
        message: "ম্যাচ আপডেট হয়েছে!",
        match: updated,
      });
    }

    if (action === "delete" && id) {
      await db.delete(sportsMatches).where(eq(sportsMatches.id, Number(id)));
      return NextResponse.json({
        success: true,
        message: "ম্যাচ ডিলিট করা হয়েছে!",
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন" }, { status: 400 });
  } catch (error) {
    console.error("Manage sports matches error:", error);
    return NextResponse.json({ error: "ম্যাচ পরিবর্তন করা যায়নি" }, { status: 500 });
  }
}
