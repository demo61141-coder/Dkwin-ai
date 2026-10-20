"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import { ArrowLeft, Rocket, Users, Plane, Sparkles } from "lucide-react";

interface AviatorPlayer {
  username: string;
  bet: number;
  cashedOut: boolean;
  cashoutMult?: number;
}

const CRASH_VARIANTS: Record<
  string,
  {
    title: string;
    provider: string;
    icon: string;
    accent: string;
    bgGlow: string;
    subtitle: string;
  }
> = {
  aviator: {
    title: "Aviator Crash",
    provider: "SPRIBE",
    icon: "✈️",
    accent: "from-rose-500 to-red-600",
    bgGlow: "border-rose-500/30",
    subtitle: "লাল বিমান ওড়ার আগে ক্যাশআউট করুন",
  },
  jetx: {
    title: "JetX Fighter",
    provider: "SMARTSOFT",
    icon: "🛩️",
    accent: "from-sky-500 to-blue-600",
    bgGlow: "border-sky-500/30",
    subtitle: "সুপারসনিক ফাইটার জেট মাল্টিপ্লায়ার",
  },
  spacexy: {
    title: "SpaceXY Rocket",
    provider: "BGAMING",
    icon: "🚀",
    accent: "from-purple-500 to-indigo-600",
    bgGlow: "border-purple-500/30",
    subtitle: "ইন্টারস্টেলার রকেট অরবিট ক্যাশআউট",
  },
  cricket_crash: {
    title: "Crash Cricket X",
    provider: "JILI CRASH",
    icon: "🏏",
    accent: "from-emerald-500 to-green-600",
    bgGlow: "border-emerald-500/30",
    subtitle: "বল স্টেডিয়াম পার হওয়ার আগে ক্যাশআউট করুন",
  },
};

export default function AviatorGame() {
  const {
    user,
    setActiveGame,
    selectedCrashId,
    setSelectedCrashId,
    refreshUser,
    showToast,
    fireConfetti,
    setDepositModalOpen,
  } = useApp();

  const activeVariant = CRASH_VARIANTS[selectedCrashId] || CRASH_VARIANTS.aviator;

  const [gameState, setGameState] = useState<"waiting" | "flying" | "crashed">("waiting");
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [waitingCountdown, setWaitingCountdown] = useState<number>(4);
  const [recentMultipliers, setRecentMultipliers] = useState<number[]>([1.42, 3.85, 12.4, 1.15, 2.2, 18.8, 1.08, 5.12]);

  // Bet 1 State (Min ৳1)
  const [bet1Amount, setBet1Amount] = useState<number>(10);
  const [customBet1, setCustomBet1] = useState<string>("10");
  const [bet1Active, setBet1Active] = useState<boolean>(false);
  const [bet1Id, setBet1Id] = useState<number | null>(null);
  const [bet1CashedOut, setBet1CashedOut] = useState<boolean>(false);

  // Live Players
  const [onlinePlayers, setOnlinePlayers] = useState<AviatorPlayer[]>([]);

  const animRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flightStartTimeRef = useRef<number>(0);
  const bet1StateRef = useRef<{ active: boolean; cashedOut: boolean; id: number | null }>({
    active: false,
    cashedOut: false,
    id: null,
  });

  useEffect(() => {
    bet1StateRef.current = { active: bet1Active, cashedOut: bet1CashedOut, id: bet1Id };
  }, [bet1Active, bet1CashedOut, bet1Id]);

  const generateSimulatedPlayers = useCallback(() => {
    const list: AviatorPlayer[] = [
      { username: "DK_***842", bet: 200, cashedOut: false },
      { username: "DK_***119", bet: 500, cashedOut: false },
      { username: "DK_***902", bet: 50, cashedOut: false },
      { username: "DK_***340", bet: 1000, cashedOut: false },
      { username: "DK_***718", bet: 20, cashedOut: false },
      { username: "DK_***553", bet: 150, cashedOut: false },
    ];
    setOnlinePlayers(list);
  }, []);

  const startNewRound = useCallback(async () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    let nextCrash = 1.85;
    try {
      const res = await fetch("/api/games/aviator/bet");
      const data = await res.json();
      if (data.crashPoint) nextCrash = Number(data.crashPoint);
    } catch {
      nextCrash = parseFloat((1.1 + Math.random() * 3.2).toFixed(2));
    }

    setMultiplier(1.0);
    setGameState("waiting");
    setWaitingCountdown(4);
    setBet1CashedOut(false);
    generateSimulatedPlayers();

    let count = 4;
    timerRef.current = setInterval(() => {
      count -= 1;
      setWaitingCountdown(count);
      if (count <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        launchFlight(nextCrash);
      }
    }, 1000);
  }, [generateSimulatedPlayers]);

  const launchFlight = (targetCrash: number) => {
    setGameState("flying");
    flightStartTimeRef.current = Date.now();

    const updateFrame = () => {
      const elapsed = (Date.now() - flightStartTimeRef.current) / 1000;
      const currentMult = parseFloat((1.0 + Math.pow(elapsed * 0.8, 1.85)).toFixed(2));

      if (currentMult >= targetCrash) {
        setMultiplier(targetCrash);
        setGameState("crashed");
        soundManager.playCrash();
        setRecentMultipliers((prev) => [targetCrash, ...prev.slice(0, 10)]);

        const st = bet1StateRef.current;
        if (st.active && !st.cashedOut && st.id) {
          fetch("/api/games/aviator/bet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "crashed", betId: st.id, crashPoint: targetCrash }),
          }).catch(() => {});
        }

        setBet1Active(false);

        setTimeout(() => {
          startNewRound();
        }, 3000);
      } else {
        setMultiplier(currentMult);

        setOnlinePlayers((prev) =>
          prev.map((p) => {
            if (!p.cashedOut && Math.random() < 0.035 && currentMult > 1.2) {
              return { ...p, cashedOut: true, cashoutMult: currentMult };
            }
            return p;
          })
        );

        animRef.current = requestAnimationFrame(updateFrame);
      }
    };

    animRef.current = requestAnimationFrame(updateFrame);
  };

  useEffect(() => {
    startNewRound();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startNewRound]);

  const parsedBet1 = Math.max(1, parseFloat(customBet1) || 1);

  const handlePlaceBet1 = async () => {
    if (parsedBet1 < 1) {
      showToast("সর্বনিম্ন বেট ৳১", "error");
      return;
    }
    if (!user || user.balance < parsedBet1) {
      showToast("পর্যাপ্ত ব্যালেন্স নেই! রিচার্জ করুন।", "error");
      setDepositModalOpen(true);
      return;
    }

    soundManager.playBet();
    try {
      const res = await fetch("/api/games/aviator/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "place_bet",
          amount: parsedBet1,
          gameVariant: selectedCrashId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBet1Amount(parsedBet1);
        setBet1Active(true);
        setBet1Id(data.betId);
        await refreshUser();
        showToast(`${activeVariant.title} বেট নিশ্চিত হয়েছে (৳${parsedBet1})`, "success");
      } else {
        showToast(data.error || "বেট স্থাপন করা যায়নি", "error");
      }
    } catch {
      showToast("সার্ভার ত্রুটি", "error");
    }
  };

  const handleCashout1 = async () => {
    if (!bet1Active || bet1CashedOut || !bet1Id || gameState !== "flying") return;

    soundManager.playWin();
    try {
      const res = await fetch("/api/games/aviator/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cashout",
          betId: bet1Id,
          multiplier: multiplier,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBet1CashedOut(true);
        setBet1Active(false);
        fireConfetti();
        await refreshUser();
        showToast(data.message, "success");
      } else {
        showToast(data.error || "ক্যাশআউট ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("সার্ভার ত্রুটি", "error");
    }
  };

  const calculatedProfit1 = (bet1Amount * multiplier).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 max-w-lg mx-auto">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-rose-500/20 px-3 py-2.5 flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveGame(null);
          }}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-lg">{activeVariant.icon}</span>
          <div className="text-center">
            <span className="font-black text-sm tracking-wider text-white block">{activeVariant.title}</span>
            <span className="text-[9px] text-amber-400 font-bold uppercase">{activeVariant.provider} · বেট ৳১+</span>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-rose-500/30 text-rose-400 font-bold text-xs tabular-nums">
          ৳{user?.balance?.toFixed(2) || "0.00"}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* 4 Crash Plane Games Switcher */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {Object.entries(CRASH_VARIANTS).map(([key, v]) => (
            <button
              key={key}
              onClick={() => {
                soundManager.playClick();
                setSelectedCrashId(key);
              }}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition flex flex-col items-center justify-center ${
                selectedCrashId === key
                  ? `bg-gradient-to-r ${v.accent} text-white font-black shadow`
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>{v.icon}</span>
              <span className="truncate max-w-full mt-0.5">{v.title.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Recent Multipliers Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs font-mono font-bold">
          <span className="text-[10px] text-slate-500 shrink-0 font-sans">হিস্ট্রি:</span>
          {recentMultipliers.map((m, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-md shrink-0 text-[11px] ${
                m >= 10.0
                  ? "bg-purple-900/60 text-purple-300 border border-purple-500/40"
                  : m >= 2.0
                  ? "bg-sky-900/60 text-sky-300 border border-sky-500/40"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {m.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Flight Radar Animation Canvas Box */}
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border ${activeVariant.bgGlow} min-h-[220px] flex flex-col items-center justify-center p-4 shadow-2xl`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>

          {gameState === "waiting" && (
            <div className="text-center z-10 space-y-2">
              <span className="text-3xl block">{activeVariant.icon}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                পরবর্তী {activeVariant.title} শুরু হচ্ছে
              </span>
              <div className="text-4xl font-black font-mono text-amber-400 tabular-nums">{waitingCountdown}s</div>
              <div className="w-32 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-1000"
                  style={{ width: `${((4 - waitingCountdown) / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {gameState === "flying" && (
            <div className="text-center z-10 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl animate-bounce">{activeVariant.icon}</span>
                <div className="text-5xl font-black font-mono text-white tracking-tight tabular-nums drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">
                  {multiplier.toFixed(2)}x
                </div>
              </div>
              <p className="text-[11px] text-amber-300 font-bold tracking-wider">{activeVariant.subtitle}</p>
            </div>
          )}

          {gameState === "crashed" && (
            <div className="text-center z-10 space-y-2">
              <div className="text-sm font-black text-red-500 uppercase tracking-widest">
                FLEW AWAY / ক্র্যাশ হয়েছে!
              </div>
              <div className="text-5xl font-black font-mono text-red-400 tabular-nums">{multiplier.toFixed(2)}x</div>
              <p className="text-xs text-slate-400">পরবর্তী রাউন্ডের জন্য প্রস্তুত হোন</p>
            </div>
          )}
        </div>

        {/* Betting Panel (Min ৳1 + Custom Input) */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-300 font-bold">
            <span>বেট অ্যামাউন্ট (সর্বনিম্ন ৳১):</span>
            <div className="flex items-center gap-1">
              <span className="text-amber-400 font-black">৳</span>
              <input
                type="number"
                min={1}
                value={customBet1}
                onChange={(e) => {
                  setCustomBet1(e.target.value);
                  setBet1Amount(parseFloat(e.target.value) || 1);
                }}
                className="w-24 bg-slate-950 border border-rose-500/40 rounded-lg px-2.5 py-1 text-xs font-black text-amber-300 text-right focus:outline-none tabular-nums"
              />
            </div>
          </div>

          {/* Quick Amount Chips starting from ৳1 */}
          <div className="grid grid-cols-6 gap-1.5">
            {[1, 5, 10, 20, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  soundManager.playClick();
                  setBet1Amount(amt);
                  setCustomBet1(String(amt));
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition ${
                  Number(customBet1) === amt
                    ? "bg-rose-500 text-white font-black shadow"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                ৳{amt}
              </button>
            ))}
          </div>

          {/* Bet Button OR Cashout Button */}
          {bet1Active && gameState === "flying" && !bet1CashedOut ? (
            <button
              onClick={handleCashout1}
              className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 hover:from-emerald-400 hover:to-green-300 text-slate-950 shadow-xl shadow-emerald-500/40 flex flex-col items-center justify-center transition transform active:scale-95"
            >
              <span>এখনই ক্যাশআউট করুন</span>
              <span className="text-xs font-extrabold text-slate-950 tabular-nums">
                ৳{calculatedProfit1} ({multiplier.toFixed(2)}x)
              </span>
            </button>
          ) : (
            <button
              onClick={handlePlaceBet1}
              disabled={bet1Active || gameState === "flying"}
              className={`w-full py-3.5 rounded-xl font-black text-sm transition transform active:scale-95 shadow-lg ${
                bet1Active
                  ? "bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 cursor-default"
                  : gameState === "flying"
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : `bg-gradient-to-r ${activeVariant.accent} text-white`
              }`}
            >
              {bet1Active
                ? `বেট অ্যাক্টিভ (৳${bet1Amount})`
                : gameState === "flying"
                ? "ফ্লাইট চলছে... পরের রাউন্ডে বেট ধরুন"
                : `বেট প্লেস করুন (৳${parsedBet1})`}
            </button>
          )}
        </div>

        {/* Live Online Players List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>লাইভ প্লেয়ারদের বাজি ({activeVariant.title})</span>
            </div>
            <span className="text-emerald-400 text-[11px] font-mono">লাইভ</span>
          </div>

          <div className="space-y-1.5 divide-y divide-slate-800/60 max-h-40 overflow-y-auto">
            {onlinePlayers.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between pt-1.5 text-xs font-mono">
                <span className="text-slate-400 text-[11px]">{p.username}</span>
                <span className="text-white font-bold">৳{p.bet}</span>
                {p.cashedOut ? (
                  <span className="text-emerald-400 font-bold text-[11px]">
                    +{p.cashoutMult?.toFixed(2)}x (৳{(p.bet * (p.cashoutMult || 1)).toFixed(0)})
                  </span>
                ) : (
                  <span className="text-amber-400 text-[10px]">ফ্লাইং...</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
