import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, gameBets, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

const CARDS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const CARD_VALUES: Record<string, number> = {
  A: 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
};
const SUITS = ["♠️", "♥️", "♦️", "♣️"];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে প্রথমে লগইন করুন" }, { status: 401 });
    }

    const body = await req.json();
    const { gameType = "dragon_tiger", betSide, amount } = body;

    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount < 1) {
      return NextResponse.json({ error: "সর্বনিম্ন বেটের পরিমাণ ৳১" }, { status: 400 });
    }

    if (user.balance < betAmount) {
      return NextResponse.json({ error: "পর্যাপ্ত ব্যালেন্স নেই! রিচার্জ করুন" }, { status: 400 });
    }

    let isWin = false;
    let multiplier = 0;
    let gameDetails: Record<string, unknown> = {};

    // 1. Dragon Tiger
    if (gameType === "dragon_tiger") {
      const dragonCard = CARDS[Math.floor(Math.random() * CARDS.length)];
      const dragonSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
      const tigerCard = CARDS[Math.floor(Math.random() * CARDS.length)];
      const tigerSuit = SUITS[Math.floor(Math.random() * SUITS.length)];

      const dragonVal = CARD_VALUES[dragonCard];
      const tigerVal = CARD_VALUES[tigerCard];

      let resultSide = "tie";
      if (dragonVal > tigerVal) resultSide = "dragon";
      else if (tigerVal > dragonVal) resultSide = "tiger";

      if (betSide === resultSide) {
        isWin = true;
        multiplier = resultSide === "tie" ? 8.0 : 2.0;
      }

      gameDetails = {
        dragon: `${dragonCard}${dragonSuit}`,
        tiger: `${tigerCard}${tigerSuit}`,
        winner: resultSide,
      };
    }
    // 2. Roulette
    else if (gameType === "roulette") {
      const number = Math.floor(Math.random() * 37); // 0 to 36
      const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(number);
      const color = number === 0 ? "green" : isRed ? "red" : "black";
      const parity = number === 0 ? "zero" : number % 2 === 0 ? "even" : "odd";

      if (betSide === color && color !== "green") {
        isWin = true;
        multiplier = 2.0;
      } else if (betSide === parity && parity !== "zero") {
        isWin = true;
        multiplier = 2.0;
      } else if (betSide === String(number)) {
        isWin = true;
        multiplier = 36.0;
      }

      gameDetails = {
        number,
        color,
        parity,
      };
    }
    // 3. Andar Bahar
    else if (gameType === "andar_bahar") {
      const jokerCard = CARDS[Math.floor(Math.random() * CARDS.length)];
      const winner = Math.random() < 0.5 ? "andar" : "bahar";
      const rounds = Math.floor(2 + Math.random() * 8);

      if (betSide === winner) {
        isWin = true;
        multiplier = winner === "andar" ? 1.95 : 2.0;
      }

      gameDetails = {
        joker: `${jokerCard}♠️`,
        winner,
        totalCardsDealt: rounds,
      };
    }

    const winAmount = isWin ? betAmount * multiplier : 0;
    const newBalance = user.balance - betAmount + winAmount;

    await db
      .update(users)
      .set({
        balance: newBalance,
        totalBetAmount: (user.totalBetAmount || 0) + betAmount,
        totalWinAmount: (user.totalWinAmount || 0) + winAmount,
      })
      .where(eq(users.id, user.id));

    await db.insert(gameBets).values({
      userId: user.id,
      gameType,
      betAmount,
      winAmount,
      multiplier,
      prediction: betSide,
      outcome: isWin ? `Win ${multiplier.toFixed(1)}x` : "Lost",
      isWin,
    });

    if (isWin && winAmount > 0) {
      await db.insert(transactions).values({
        userId: user.id,
        type: "bonus",
        amount: winAmount,
        method: "system",
        status: "completed",
        note: `লাইভ ক্যাসিনো উইন (${gameType}) - ৳${winAmount.toFixed(0)}`,
      });
    }

    return NextResponse.json({
      success: true,
      isWin,
      multiplier,
      winAmount,
      gameDetails,
      newBalance,
    });
  } catch (error) {
    console.error("Live game error:", error);
    return NextResponse.json({ error: "গেম সম্পন্ন করা যায়নি" }, { status: 500 });
  }
}
