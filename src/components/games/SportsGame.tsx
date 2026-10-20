"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import { ArrowLeft, Trophy, Trash2, Layers } from "lucide-react";

interface Match {
  id: number;
  sport: string;
  tournament: string;
  teamA: string;
  teamB: string;
  oddsA: number;
  oddsDraw: number;
  oddsB: number;
  status: string;
  score: string;
  startTime: string;
}

interface SlipItem {
  matchId: number;
  matchTitle: string;
  pick: string;
  odds: number;
}

export default function SportsGame() {
  const { user, setActiveGame, refreshUser, showToast, setDepositModalOpen } = useApp();

  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [slipItems, setSlipItems] = useState<SlipItem[]>([]);
  const [betAmountStr, setBetAmountStr] = useState<string>("20");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetch(`/api/games/sports/matches?sport=${selectedSport}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.matches) setMatches(data.matches);
      })
      .catch(() => {});
  }, [selectedSport]);

  const toggleSlipSelection = (match: Match, pickLabel: string, odds: number) => {
    soundManager.playClick();
    setSlipItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.matchId === match.id);
      if (existingIdx > -1) {
        if (prev[existingIdx].pick === pickLabel) {
          // Deselect
          return prev.filter((i) => i.matchId !== match.id);
        }
        // Replace selection for the same match
        const updated = [...prev];
        updated[existingIdx] = {
          matchId: match.id,
          matchTitle: `${match.teamA} vs ${match.teamB}`,
          pick: pickLabel,
          odds,
        };
        return updated;
      }
      // Add new match to multi-bet accumulator
      return [
        ...prev,
        {
          matchId: match.id,
          matchTitle: `${match.teamA} vs ${match.teamB}`,
          pick: pickLabel,
          odds,
        },
      ];
    });
  };

  const combinedOdds = slipItems.reduce((acc, item) => acc * item.odds, 1.0);
  const parsedBet = Math.max(1, parseFloat(betAmountStr) || 1);
  const potentialReturn = parseFloat((parsedBet * combinedOdds).toFixed(2));

  const handlePlaceSportsBet = async () => {
    if (slipItems.length === 0) return;

    if (parsedBet < 1) {
      showToast("সর্বনিম্ন বেট ৳১", "error");
      return;
    }

    if (!user || user.balance < parsedBet) {
      showToast("পর্যাপ্ত ব্যালেন্স নেই! রিচার্জ করুন।", "error");
      setDepositModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    soundManager.playBet();

    try {
      const res = await fetch("/api/games/sports/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections: slipItems,
          amount: parsedBet,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setSlipItems([]);
        await refreshUser();
      } else {
        showToast(data.error || "বেট সম্পন্ন করা যায়নি", "error");
      }
    } catch {
      showToast("সার্ভার ত্রুটি", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-52 max-w-lg mx-auto">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-emerald-500/20 px-3 py-2.5 flex items-center justify-between">
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
          <h1 className="text-base font-black tracking-wider bg-gradient-to-r from-emerald-400 to-green-200 bg-clip-text text-transparent flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>1X স্পোর্টসবুক ও মাল্টি বেট</span>
          </h1>
          <p className="text-[10px] text-slate-400">এক বা একাধিক ম্যাচে ক্লিক করে মাল্টি (Accumulator) করুন</p>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-emerald-500/30 text-emerald-400 font-bold text-xs tabular-nums">
          ৳{user?.balance?.toFixed(2) || "0.00"}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Sport Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "সব ম্যাচ (All)" },
            { id: "cricket", label: "ক্রিকেট (BPL/IPL/ICC)" },
            { id: "football", label: "ফুটবল (UCL/EPL)" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSport(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedSport === s.id
                  ? "bg-gradient-to-r from-emerald-500 to-green-400 text-slate-950 font-black shadow"
                  : "bg-slate-900 border border-slate-800 text-slate-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Matches List */}
        <div className="space-y-2.5">
          {matches.map((m) => {
            const selectedForMatch = slipItems.find((i) => i.matchId === m.id);
            return (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-bold">
                    {m.tournament}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      m.status === "live" ? "bg-red-500/20 text-red-400" : "bg-sky-500/20 text-sky-400"
                    }`}
                  >
                    {m.status === "live" ? "LIVE NOW" : m.startTime}
                  </span>
                </div>

                {/* Teams & Score */}
                <div className="flex items-center justify-between text-sm font-extrabold text-white">
                  <div className="flex-1">{m.teamA}</div>
                  <div className="text-center px-3 text-xs font-mono text-amber-400">{m.score}</div>
                  <div className="flex-1 text-right">{m.teamB}</div>
                </div>

                {/* 1x2 Odds Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => toggleSlipSelection(m, m.teamA, m.oddsA)}
                    className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                      selectedForMatch?.pick === m.teamA
                        ? "bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 font-black"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    <span className="text-[10px] truncate max-w-[85px]">W1 ({m.teamA})</span>
                    <span className="font-extrabold text-sm tabular-nums">{m.oddsA}x</span>
                  </button>

                  <button
                    onClick={() => toggleSlipSelection(m, `Draw (${m.teamA}/${m.teamB})`, m.oddsDraw || 3.2)}
                    className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                      selectedForMatch?.pick === `Draw (${m.teamA}/${m.teamB})`
                        ? "bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 font-black"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    <span className="text-[10px]">X (ড্র)</span>
                    <span className="font-extrabold text-sm tabular-nums">{m.oddsDraw || 3.2}x</span>
                  </button>

                  <button
                    onClick={() => toggleSlipSelection(m, m.teamB, m.oddsB)}
                    className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                      selectedForMatch?.pick === m.teamB
                        ? "bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 font-black"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    <span className="text-[10px] truncate max-w-[85px]">W2 ({m.teamB})</span>
                    <span className="font-extrabold text-sm tabular-nums">{m.oddsB}x</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 1xBet Style Single / Multi-Bet Accumulator Drawer */}
        {slipItems.length > 0 && (
          <div className="fixed bottom-14 left-0 right-0 z-30 bg-slate-900 border-t-2 border-emerald-500/60 p-3.5 shadow-2xl max-w-lg mx-auto rounded-t-3xl space-y-2.5">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="font-black text-white">
                  {slipItems.length > 1
                    ? `মাল্টি বেট স্লিপ (${slipItems.length}টি ম্যাচ Accumulator)`
                    : "সিঙ্গেল বেট স্লিপ (১টি ম্যাচ)"}
                </span>
              </div>
              <button
                onClick={() => setSlipItems([])}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 text-[11px] font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সব মুছুন</span>
              </button>
            </div>

            {/* Selected legs */}
            <div className="max-h-24 overflow-y-auto space-y-1">
              {slipItems.map((item) => (
                <div
                  key={item.matchId}
                  className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded-lg text-[11px]"
                >
                  <div className="truncate max-w-[230px]">
                    <span className="text-emerald-400 font-bold">{item.pick}</span>
                    <span className="text-slate-500 ml-1">({item.matchTitle})</span>
                  </div>
                  <span className="font-mono font-black text-amber-300">{item.odds}x</span>
                </div>
              ))}
            </div>

            {/* Bet Amount + Total Odds */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1">
                {[1, 10, 50, 100, 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setBetAmountStr(String(amt))}
                    className={`py-1 px-2 rounded-lg text-[11px] font-bold ${
                      Number(betAmountStr) === amt ? "bg-emerald-500 text-slate-950 font-black" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    ৳{amt}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  value={betAmountStr}
                  onChange={(e) => setBetAmountStr(e.target.value)}
                  className="w-16 bg-slate-950 border border-emerald-500/40 rounded-lg px-2 py-1 text-xs font-black text-amber-300 text-right focus:outline-none"
                />
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px]">
                  মোট অডস: <strong className="text-amber-300">{combinedOdds.toFixed(2)}x</strong>
                </span>
                <span className="text-emerald-400 font-extrabold text-sm tabular-nums">
                  জয়: ৳{potentialReturn.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceSportsBet}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-green-400 text-slate-950 shadow-lg"
            >
              {isSubmitting
                ? "বেট সাবমিট হচ্ছে..."
                : `${slipItems.length > 1 ? "মাল্টি বেট" : "বেট"} নিশ্চিত করুন (৳${parsedBet})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
