"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";

interface WingoRound {
  id: number;
  periodNumber: string;
  winningNumber: number;
  winningColor: string;
  winningSize: string;
  createdAt: string;
}

interface BetRecord {
  id: number;
  betAmount: number;
  feeAmount?: number;
  winAmount: number;
  multiplier: number;
  prediction: string;
  outcome: string;
  isWin: boolean;
  periodNumber: string;
}

export default function WingoGame() {
  const { user, setActiveGame, refreshUser, showToast, fireConfetti, setDepositModalOpen } = useApp();

  const [timerType, setTimerType] = useState<"30s" | "1m" | "3m" | "5m">("1m");
  const [activePeriod, setActivePeriod] = useState<string>("");
  const [remainingSec, setRemainingSec] = useState<number>(60);
  const [feePercent, setFeePercent] = useState<number>(2.0);
  const [history, setHistory] = useState<WingoRound[]>([]);
  const [stats, setStats] = useState<{
    redCount: number;
    greenCount: number;
    violetCount: number;
    bigCount: number;
    smallCount: number;
    total: number;
  }>({
    redCount: 12,
    greenCount: 14,
    violetCount: 4,
    bigCount: 15,
    smallCount: 15,
    total: 30,
  });

  const [activeTab, setActiveTab] = useState<"game" | "chart" | "myBets">("game");
  const [myBets, setMyBets] = useState<BetRecord[]>([]);

  // Bet selection state (Minimum ৳1)
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [customAmountStr, setCustomAmountStr] = useState<string>("10");
  const [betMultiplier, setBetMultiplier] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serverOffsetRef = useRef<number>(0);
  const settledPeriodRef = useRef<string>("");

  const getIntervalSec = useCallback((t: string) => {
    if (t === "30s") return 30;
    if (t === "3m") return 180;
    if (t === "5m") return 300;
    return 60;
  }, []);

  const fetchHistoryAndState = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/wingo/history?timerType=${timerType}`);
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
        setActivePeriod(data.activePeriod);
        setRemainingSec(data.remainingSeconds);
        if (data.serverTime) {
          serverOffsetRef.current = data.serverTime - Date.now();
        }
        if (data.feePercent !== undefined) {
          setFeePercent(data.feePercent);
        }
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error("Wingo fetch error", e);
    }
  }, [timerType]);

  const fetchMyBets = useCallback(async () => {
    try {
      const res = await fetch("/api/games/wingo/bet");
      const data = await res.json();
      if (data.bets) {
        setMyBets(data.bets);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchHistoryAndState();
    fetchMyBets();
  }, [fetchHistoryAndState, fetchMyBets]);

  // Exact Real-Time Synchronized Countdown Clock
  useEffect(() => {
    const intervalSec = getIntervalSec(timerType);

    const tick = () => {
      const syncedNow = Date.now() + serverOffsetRef.current;
      const currentEpochSec = Math.floor(syncedNow / 1000);
      const rem = intervalSec - (currentEpochSec % intervalSec);
      const periodIdx = Math.floor(currentEpochSec / intervalSec);
      const dateStr = new Date(syncedNow).toISOString().slice(0, 10).replace(/-/g, "");
      const computedPeriod = `${dateStr}${periodIdx}`;
      const prevPeriod = `${dateStr}${periodIdx - 1}`;

      setRemainingSec(rem);

      if (rem <= 5 && rem >= 1) {
        soundManager.playTick();
      }

      // When a new period starts (or at second 1 -> 0 transition), settle the finished period once
      if (rem === intervalSec || (activePeriod && activePeriod !== computedPeriod)) {
        const periodToSettle = activePeriod && activePeriod !== computedPeriod ? activePeriod : prevPeriod;
        setActivePeriod(computedPeriod);

        if (periodToSettle && settledPeriodRef.current !== periodToSettle) {
          settledPeriodRef.current = periodToSettle;
          fetch("/api/games/wingo/settle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ periodNumber: periodToSettle, timerType }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.result) {
                soundManager.playWin();
              }
              refreshUser();
              fetchHistoryAndState();
              fetchMyBets();
            })
            .catch(() => {});
        }
      }
    };

    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activePeriod, timerType, getIntervalSec, refreshUser, fetchHistoryAndState, fetchMyBets]);

  const parsedCustomAmt = Math.max(1, parseFloat(customAmountStr) || 1);
  const totalBet = parseFloat((parsedCustomAmt * betMultiplier).toFixed(2));
  const feeAmount = parseFloat(((totalBet * feePercent) / 100).toFixed(2));
  const netContractAmount = parseFloat((totalBet - feeAmount).toFixed(2));

  const handlePlaceBet = async () => {
    if (!selectedBet) {
      showToast("প্রথমে প্রিডিকশন নির্বাচন করুন (Big, Small, Green, Red বা Number)", "error");
      return;
    }

    if (totalBet < 1) {
      showToast("সর্বনিম্ন বেট ৳১", "error");
      return;
    }

    if (!user || user.balance < totalBet) {
      showToast("পর্যাপ্ত ব্যালেন্স নেই! অনুগ্রহ করে ডিপোজিট করুন।", "error");
      setDepositModalOpen(true);
      return;
    }

    if (remainingSec <= 5) {
      showToast("এই রাউন্ডের বেটিং সময় শেষ! পরবর্তী রাউন্ডের জন্য অপেক্ষা করুন।", "error");
      return;
    }

    setIsSubmitting(true);
    soundManager.playBet();

    try {
      const res = await fetch("/api/games/wingo/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodNumber: activePeriod,
          prediction: selectedBet,
          amount: totalBet,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        await refreshUser();
        await fetchMyBets();
        setSelectedBet(null);
      } else {
        showToast(data.error || "বেট সম্পন্ন করা যায়নি", "error");
      }
    } catch {
      showToast("সার্ভার ত্রুটি, পুনরায় চেষ্টা করুন", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNumberColorClass = (num: number) => {
    if (num === 0) return "bg-gradient-to-r from-red-600 to-purple-600";
    if (num === 5) return "bg-gradient-to-r from-emerald-600 to-purple-600";
    if (num % 2 === 0) return "bg-red-600";
    return "bg-emerald-600";
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 max-w-lg mx-auto">
      {/* Top Header */}
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
            DKWIN · WIN GO
          </h1>
          <p className="text-[10px] text-slate-400">সর্বনিম্ন বেট ৳১ · লাইভ কাউন্টডাউন</p>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500/30 text-amber-400 font-bold text-xs tabular-nums">
          ৳{user?.balance?.toFixed(2) || "0.00"}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Timer Modes */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {(["30s", "1m", "3m", "5m"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                soundManager.playClick();
                setTimerType(type);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold transition ${
                timerType === type
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Win Go {type}
            </button>
          ))}
        </div>

        {/* Current Round Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 p-3.5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>পিরিয়ড নাম্বার ({timerType}):</span>
              </div>
              <div className="text-base font-black text-amber-300 font-mono tracking-wider mt-0.5 tabular-nums">
                {activePeriod || "Loading..."}
              </div>
            </div>

            {/* Countdown Clock */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-medium">বাকি সময়</span>
              <div
                className={`text-2xl font-black font-mono tracking-tight tabular-nums ${
                  remainingSec <= 5 ? "text-red-500 animate-pulse" : "text-emerald-400"
                }`}
              >
                {formatTimer(remainingSec)}
              </div>
            </div>
          </div>

          {/* Last Result Row */}
          {history.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">সর্বশেষ ৫ রাউন্ড ফলাফল:</span>
              <div className="flex items-center gap-1.5">
                {history.slice(0, 5).map((h, idx) => (
                  <span
                    key={idx}
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-white text-[10px] shadow ${getNumberColorClass(
                      h.winningNumber
                    )}`}
                  >
                    {h.winningNumber}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs (Game, Trend Chart, My Bets) */}
        <div className="flex border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab("game")}
            className={`flex-1 py-2 text-center border-b-2 transition ${
              activeTab === "game" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400"
            }`}
          >
            বেটিং প্যানেল
          </button>
          <button
            onClick={() => setActiveTab("chart")}
            className={`flex-1 py-2 text-center border-b-2 transition ${
              activeTab === "chart" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400"
            }`}
          >
            ফলাফল চার্ট
          </button>
          <button
            onClick={() => setActiveTab("myBets")}
            className={`flex-1 py-2 text-center border-b-2 transition ${
              activeTab === "myBets" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400"
            }`}
          >
            আমার বেট ({myBets.length})
          </button>
        </div>

        {/* Tab 1: Game Betting Controls */}
        {activeTab === "game" && (
          <div className="space-y-3">
            {/* Color Betting Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setSelectedBet("green");
                }}
                className={`py-3 rounded-xl font-black text-sm flex flex-col items-center justify-center transition shadow-lg ${
                  selectedBet === "green"
                    ? "bg-emerald-500 text-white ring-4 ring-emerald-400/50"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                <span>সবুজ (Green)</span>
                <span className="text-[10px] font-bold text-emerald-100">2x Payout</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setSelectedBet("violet");
                }}
                className={`py-3 rounded-xl font-black text-sm flex flex-col items-center justify-center transition shadow-lg ${
                  selectedBet === "violet"
                    ? "bg-purple-500 text-white ring-4 ring-purple-400/50"
                    : "bg-purple-600 hover:bg-purple-500 text-white"
                }`}
              >
                <span>বেগুনী (Violet)</span>
                <span className="text-[10px] font-bold text-purple-100">4.5x Payout</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setSelectedBet("red");
                }}
                className={`py-3 rounded-xl font-black text-sm flex flex-col items-center justify-center transition shadow-lg ${
                  selectedBet === "red"
                    ? "bg-red-500 text-white ring-4 ring-red-400/50"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
              >
                <span>লাল (Red)</span>
                <span className="text-[10px] font-bold text-red-100">2x Payout</span>
              </button>
            </div>

            {/* Numbers 0 - 9 Grid */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl">
              <div className="text-[11px] font-bold text-slate-400 mb-2 text-center">
                নাম্বার সিলেক্ট করুন (০ থেকে ৯ · ৯ গুণ পেআউট!)
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                  const isSelected = selectedBet === String(num);
                  return (
                    <button
                      key={num}
                      onClick={() => {
                        soundManager.playClick();
                        setSelectedBet(String(num));
                      }}
                      className={`h-11 rounded-xl font-black text-base flex flex-col items-center justify-center shadow-md transition transform active:scale-95 ${getNumberColorClass(
                        num
                      )} ${isSelected ? "ring-4 ring-amber-300 scale-105" : "hover:opacity-90"}`}
                    >
                      <span>{num}</span>
                      <span className="text-[8px] opacity-80">9x</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Big / Small Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setSelectedBet("big");
                }}
                className={`py-3 rounded-xl font-black text-sm transition shadow-md ${
                  selectedBet === "big"
                    ? "bg-amber-500 text-slate-950 ring-4 ring-amber-400/50"
                    : "bg-amber-600 hover:bg-amber-500 text-white"
                }`}
              >
                BIG / বড় (৫-৯) · 2x
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setSelectedBet("small");
                }}
                className={`py-3 rounded-xl font-black text-sm transition shadow-md ${
                  selectedBet === "small"
                    ? "bg-sky-500 text-slate-950 ring-4 ring-sky-400/50"
                    : "bg-sky-600 hover:bg-sky-500 text-white"
                }`}
              >
                SMALL / ছোট (০-৪) · 2x
              </button>
            </div>

            {/* Stake Amount Selector (Minimum 1 BDT + Custom Input + Fee Info) */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-300 font-bold">বেট পরিমাণ (সর্বনিম্ন ৳১):</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-amber-400 font-bold">৳</span>
                  <input
                    type="number"
                    min={1}
                    value={customAmountStr}
                    onChange={(e) => {
                      setCustomAmountStr(e.target.value);
                      setBetAmount(parseFloat(e.target.value) || 1);
                    }}
                    className="w-24 bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs font-black text-amber-300 text-right focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              {/* Amount Chips starting from ৳1 */}
              <div className="grid grid-cols-7 gap-1">
                {[1, 5, 10, 20, 50, 100, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      soundManager.playClick();
                      setBetAmount(amt);
                      setCustomAmountStr(String(amt));
                    }}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                      Number(customAmountStr) === amt
                        ? "bg-amber-500 text-slate-950 font-black shadow"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>

              {/* Multiplier Chips */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium">গুণক:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 5, 10, 20, 50].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => {
                        soundManager.playClick();
                        setBetMultiplier(mult);
                      }}
                      className={`px-2 py-1 rounded text-xs font-bold transition ${
                        betMultiplier === mult
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      x{mult}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transparent Contract Fee Breakdown */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80">
                <span>মোট বেট: <strong className="text-white">৳{totalBet}</strong></span>
                <span>ফি ({feePercent}%): <strong className="text-amber-400">৳{feeAmount}</strong></span>
                <span>নেট চুক্তি: <strong className="text-emerald-400">৳{netContractAmount}</strong></span>
              </div>

              {/* Submit Bet Button */}
              <button
                onClick={handlePlaceBet}
                disabled={isSubmitting || remainingSec <= 5}
                className={`w-full py-3 rounded-xl font-black text-sm transition transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                  remainingSec <= 5
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/30"
                }`}
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>
                  {remainingSec <= 5
                    ? `লকড (${remainingSec}s)... পরবর্তী রাউন্ড আসছে`
                    : selectedBet
                    ? `বেট নিশ্চিত করুন (${selectedBet.toUpperCase()} · ৳${totalBet})`
                    : "প্রিডিকশন সিলেক্ট করুন"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Trend Chart & Parity Table */}
        {activeTab === "chart" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-center text-xs">
              <div>
                <span className="text-red-400 font-bold block">Red: {stats.redCount}</span>
                <span className="text-[10px] text-slate-400">
                  {((stats.redCount / (stats.total || 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-emerald-400 font-bold block">Green: {stats.greenCount}</span>
                <span className="text-[10px] text-slate-400">
                  {((stats.greenCount / (stats.total || 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-purple-400 font-bold block">Violet: {stats.violetCount}</span>
                <span className="text-[10px] text-slate-400">
                  {((stats.violetCount / (stats.total || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 bg-slate-800/80 px-3 py-2 text-[11px] font-bold text-slate-300">
                <span>পিরিয়ড</span>
                <span className="text-center">নাম্বার</span>
                <span className="text-center">বিগ/স্মল</span>
                <span className="text-right">কালার</span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                {history.map((h) => (
                  <div key={h.id || h.periodNumber} className="grid grid-cols-4 px-3 py-2 text-xs items-center font-mono">
                    <span className="text-slate-400 text-[10px]">{h.periodNumber.slice(-6)}</span>
                    <div className="flex justify-center">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-white text-[11px] ${getNumberColorClass(
                          h.winningNumber
                        )}`}
                      >
                        {h.winningNumber}
                      </span>
                    </div>
                    <span className="text-center text-[11px] font-bold uppercase text-amber-300">
                      {h.winningSize}
                    </span>
                    <div className="flex justify-end gap-1">
                      {h.winningColor.includes("red") && <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>}
                      {h.winningColor.includes("green") && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>}
                      {h.winningColor.includes("violet") && <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: My Bet History */}
        {activeTab === "myBets" && (
          <div className="space-y-2">
            {myBets.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">কোনো বেট হিস্ট্রি পাওয়া যায়নি</div>
            ) : (
              myBets.map((bet) => (
                <div
                  key={bet.id}
                  className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white uppercase">{bet.prediction}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (পিরিয়ড: {bet.periodNumber?.slice(-6)})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      বেট: ৳{bet.betAmount} {bet.feeAmount ? `(ফি: ৳${bet.feeAmount})` : ""}
                    </div>
                  </div>

                  <div className="text-right">
                    {bet.isWin ? (
                      <div>
                        <span className="text-emerald-400 font-black">+৳{bet.winAmount.toFixed(2)}</span>
                        <span className="text-[10px] text-emerald-400 block font-semibold">উইন ({bet.multiplier}x)</span>
                      </div>
                    ) : bet.outcome ? (
                      <div>
                        <span className="text-red-400 font-bold">-৳{bet.betAmount}</span>
                        <span className="text-[10px] text-slate-500 block">ফলাফল: {bet.outcome}</span>
                      </div>
                    ) : (
                      <span className="text-amber-400 text-[11px] font-bold">চলমান...</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
