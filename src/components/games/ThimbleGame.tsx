"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import { ArrowLeft, Sparkles, Trophy, HelpCircle, RotateCcw } from "lucide-react";

export default function ThimbleGame() {
  const { user, setActiveGame, refreshUser, showToast, fireConfetti, setDepositModalOpen } = useApp();

  const [ballCount, setBallCount] = useState<1 | 2>(1);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [customBet, setCustomBet] = useState<string>("10");
  const [gamePhase, setGamePhase] = useState<"idle" | "shuffling" | "picking" | "revealed">("idle");
  const [selectedCup, setSelectedCup] = useState<number | null>(null);
  const [ballPositions, setBallPositions] = useState<number[]>([1]);
  const [lastResult, setLastResult] = useState<{ isWin: boolean; winAmount: number; multiplier: number } | null>(null);
  const [history, setHistory] = useState<Array<{ isWin: boolean; mult: number; amount: number }>>([]);

  const activeMultiplier = ballCount === 1 ? 2.88 : 1.44;

  const handleStartShuffle = () => {
    const amt = parseFloat(customBet) || betAmount;
    if (amt < 1) {
      showToast("সর্বনিম্ন বেট ৳১", "error");
      return;
    }
    if (!user || user.balance < amt) {
      showToast("পর্যাপ্ত ব্যালেন্স নেই! রিচার্জ করুন।", "error");
      setDepositModalOpen(true);
      return;
    }

    setBetAmount(amt);
    setSelectedCup(null);
    setLastResult(null);
    setGamePhase("shuffling");
    soundManager.playClick();

    setTimeout(() => {
      setGamePhase("picking");
    }, 900);
  };

  const handlePickCup = async (cupIndex: number) => {
    if (gamePhase !== "picking") return;
    setSelectedCup(cupIndex);
    soundManager.playBet();

    const amt = parseFloat(customBet) || betAmount;

    try {
      const res = await fetch("/api/games/thimble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          betAmount: amt,
          ballCount,
          selectedCup: cupIndex,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBallPositions(data.ballPositions || []);
        setGamePhase("revealed");
        setLastResult({
          isWin: data.isWin,
          winAmount: data.winAmount,
          multiplier: data.multiplier,
        });
        setHistory((prev) => [{ isWin: data.isWin, mult: data.multiplier, amount: data.isWin ? data.winAmount : amt }, ...prev.slice(0, 9)]);

        if (data.isWin) {
          soundManager.playWin();
          fireConfetti();
          showToast(`অভিনন্দন! বল খুঁজে পেয়েছেন! +৳${data.winAmount.toFixed(2)} (${data.multiplier}x)`, "success");
        } else {
          soundManager.playCrash();
          showToast("দুঃখিত! এই কাপে বল ছিল না। আবার চেষ্টা করুন!", "error");
        }
        await refreshUser();
      } else {
        setGamePhase("idle");
        showToast(data.error || "বেট সম্পন্ন করা যায়নি", "error");
      }
    } catch {
      setGamePhase("idle");
      showToast("সার্ভার ত্রুটি", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/20 px-3 py-2.5 flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveGame(null);
          }}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-base font-black tracking-wider bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
            THIMBLES (থিম্বল গেম)
          </h1>
          <p className="text-[10px] text-slate-400">সঠিক কাপ বেছে নিন ও ২.৮৮ গুণ জিতুন</p>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500/30 text-amber-400 font-bold text-xs tabular-nums">
          ৳{user?.balance?.toFixed(2) || "0.00"}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Ball Mode Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            disabled={gamePhase === "shuffling" || gamePhase === "picking"}
            onClick={() => {
              soundManager.playClick();
              setBallCount(1);
            }}
            className={`py-2 rounded-lg text-xs font-black transition ${
              ballCount === 1
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ১টি বল (2.88x পেআউট)
          </button>
          <button
            disabled={gamePhase === "shuffling" || gamePhase === "picking"}
            onClick={() => {
              soundManager.playClick();
              setBallCount(2);
            }}
            className={`py-2 rounded-lg text-xs font-black transition ${
              ballCount === 2
                ? "bg-gradient-to-r from-emerald-500 to-green-400 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ২টি বল (1.44x পেআউট)
          </button>
        </div>

        {/* Thimble Table Stage */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 p-5 min-h-[250px] flex flex-col justify-between items-center shadow-2xl">
          <div className="text-center">
            <span className="text-xs font-bold text-amber-300">
              {gamePhase === "idle" && "বেট সেট করে 'খেলা শুরু করুন' বাটনে চাপুন"}
              {gamePhase === "shuffling" && "কাপগুলো শাফল হচ্ছে... মনোযোগ দিয়ে দেখুন!"}
              {gamePhase === "picking" && "এখন যেকোনো একটি কাপ (১, ২ বা ৩) সিলেক্ট করুন!"}
              {gamePhase === "revealed" &&
                (lastResult?.isWin
                  ? `অভিনন্দন! আপনি ৳${lastResult.winAmount.toFixed(2)} জিতেছেন!`
                  : "আবার চেষ্টা করুন! পরের দান আপনার হতে পারে।")}
            </span>
          </div>

          {/* 3 Cups Row */}
          <div className="grid grid-cols-3 gap-5 w-full max-w-xs my-6">
            {[0, 1, 2].map((cupIdx) => {
              const hasBall =
                (gamePhase === "idle" && (ballCount === 1 ? cupIdx === 1 : cupIdx !== 1)) ||
                (gamePhase === "revealed" && ballPositions.includes(cupIdx));
              const isLifted = gamePhase === "idle" || gamePhase === "revealed";
              const isChosen = selectedCup === cupIdx;

              return (
                <button
                  key={cupIdx}
                  onClick={() => handlePickCup(cupIdx)}
                  disabled={gamePhase !== "picking"}
                  className={`relative flex flex-col items-center justify-end h-28 rounded-2xl transition-all duration-300 ${
                    gamePhase === "picking" ? "cursor-pointer hover:scale-105" : "cursor-default"
                  }`}
                >
                  {/* Cup Visual */}
                  <div
                    className={`w-20 h-24 rounded-t-3xl rounded-b-lg bg-gradient-to-b from-amber-400 via-amber-600 to-amber-800 border-2 ${
                      isChosen ? "border-emerald-400 ring-4 ring-emerald-400/40" : "border-amber-300/60"
                    } shadow-xl flex flex-col items-center justify-center transition-transform duration-300 z-10 ${
                      isLifted ? "-translate-y-8" : "translate-y-0"
                    } ${gamePhase === "shuffling" ? "animate-bounce" : ""}`}
                  >
                    <span className="text-lg font-black text-slate-950 drop-shadow">#{cupIdx + 1}</span>
                    <span className="text-[9px] font-bold text-amber-100 uppercase">
                      {gamePhase === "picking" ? "চাপুন" : "CUP"}
                    </span>
                  </div>

                  {/* Hidden Ball underneath */}
                  <div className="absolute bottom-2 flex items-center justify-center h-8">
                    {hasBall && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 via-rose-500 to-amber-300 border-2 border-white shadow-lg flex items-center justify-center text-xs">
                        ⚽
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between w-full pt-2 border-t border-slate-800/80">
            <span>পেআউট গুণক: <strong className="text-amber-400">{activeMultiplier}x</strong></span>
            <span>সম্ভাব্য জয়: <strong className="text-emerald-400">৳{((parseFloat(customBet) || 0) * activeMultiplier).toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Betting Panel */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-300">বেট অ্যামাউন্ট (৳১ থেকে শুরু):</label>
            <input
              type="number"
              min={1}
              value={customBet}
              onChange={(e) => {
                setCustomBet(e.target.value);
                setBetAmount(parseFloat(e.target.value) || 1);
              }}
              className="w-28 bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-1.5 text-sm font-black text-amber-400 text-right focus:outline-none"
            />
          </div>

          {/* Quick Amount Chips */}
          <div className="grid grid-cols-6 gap-1.5">
            {[1, 5, 10, 20, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  soundManager.playClick();
                  setBetAmount(amt);
                  setCustomBet(String(amt));
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                  Number(customBet) === amt
                    ? "bg-amber-500 text-slate-950 font-black shadow"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                ৳{amt}
              </button>
            ))}
          </div>

          <button
            onClick={handleStartShuffle}
            disabled={gamePhase === "shuffling" || gamePhase === "picking"}
            className={`w-full py-3.5 rounded-xl font-black text-sm transition transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
              gamePhase === "shuffling" || gamePhase === "picking"
                ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-amber-500/20"
            }`}
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>
              {gamePhase === "picking"
                ? "উপরে যেকোনো একটি কাপে ক্লিক করুন"
                : gamePhase === "shuffling"
                ? "কাপ শাফল হচ্ছে..."
                : `খেলা শুরু করুন (৳${parseFloat(customBet) || 1})`}
            </span>
          </button>
        </div>

        {/* Recent History */}
        {history.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-400 block">সাম্প্রতিক ফলাফল:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {history.map((h, i) => (
                <span
                  key={i}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                    h.isWin ? "bg-emerald-950 border border-emerald-500/40 text-emerald-300" : "bg-red-950/60 border border-red-500/30 text-red-300"
                  }`}
                >
                  {h.isWin ? `+৳${h.amount.toFixed(1)} (${h.mult}x)` : `-৳${h.amount}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
