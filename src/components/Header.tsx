"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import {
  Volume2,
  VolumeX,
  Globe,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
  Headphones,
  User,
  ShieldCheck,
  Flame,
} from "lucide-react";

export default function Header() {
  const {
    user,
    lang,
    setLang,
    t,
    soundEnabled,
    setSoundEnabled,
    setAuthModalOpen,
    setAuthModalMode,
    setDepositModalOpen,
    setWithdrawModalOpen,
    setChatModalOpen,
    refreshUser,
    showToast,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    soundManager.playClick();
    setRefreshing(true);
    await refreshUser();
    setTimeout(() => {
      setRefreshing(false);
      showToast(lang === "bn" ? "ব্যালেন্স আপডেট হয়েছে" : "Balance Refreshed", "info");
    }, 400);
  };

  const handleDemoClick = async () => {
    soundManager.playClick();
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (data.success && data.user) {
        await refreshUser();
        showToast(data.message, "success");
      }
    } catch {
      showToast("ডেমো লোড হতে ব্যর্থ হয়েছে", "error");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/20 shadow-lg px-3 py-2.5 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between gap-2">
        {/* Brand Logo: DKWIN */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 shadow-md shadow-amber-500/30 font-black text-slate-950 text-sm tracking-tighter">
            DK
          </div>
          <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-red-400 bg-clip-text text-transparent whitespace-nowrap">
            DKWIN
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Language Switch */}
          <button
            onClick={() => {
              soundManager.playClick();
              setLang(lang === "bn" ? "en" : "bn");
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition whitespace-nowrap"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === "bn" ? "বাং" : "EN"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
            }}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition"
            title="Toggle Sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {/* Live Support & Telegram */}
          <button
            onClick={() => {
              soundManager.playClick();
              setChatModalOpen(true);
            }}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition"
            title="24/7 Live Support & Telegram"
          >
            <Headphones className="w-3.5 h-3.5 text-sky-400" />
          </button>
        </div>
      </div>

      {/* User Balance Bar OR Guest Login Bar */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        {user ? (
          <>
            {/* Balance info */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-bold text-xs shadow">
                <User className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="font-medium truncate max-w-[90px]">{user.username}</span>
                  <span>·</span>
                  <span className="text-amber-300 font-bold">VIP {user.vipLevel || 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 font-extrabold text-sm tracking-tight tabular-nums">
                    ৳{(user.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={handleRefresh}
                    className={`text-slate-400 hover:text-amber-300 transition ${refreshing ? "animate-spin" : ""}`}
                    title="Refresh Balance"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Deposit & Withdraw Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setDepositModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition transform active:scale-95 whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t.deposit}</span>
              </button>

              <button
                onClick={() => {
                  soundManager.playClick();
                  setWithdrawModalOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 hover:bg-slate-800 text-amber-300 font-semibold text-xs transition transform active:scale-95 whitespace-nowrap"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.withdraw}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Guest Action Bar */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDemoClick}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-300 font-medium text-xs transition whitespace-nowrap"
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{t.demoPlay}</span>
              </button>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">ডিপোজিট ৳৫০ · বেট ৳১</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setAuthModalMode("login");
                  setAuthModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition whitespace-nowrap"
              >
                {t.login}
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  setAuthModalMode("register");
                  setAuthModalOpen(true);
                }}
                className="px-3 py-1 rounded-md bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition transform active:scale-95 whitespace-nowrap"
              >
                {t.register}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
