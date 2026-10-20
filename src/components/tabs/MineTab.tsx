"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import {
  User,
  ShieldCheck,
  Gift,
  History,
  Headphones,
  Globe,
  Volume2,
  VolumeX,
  LogOut,
  ChevronRight,
  Award,
  Lock,
} from "lucide-react";

export default function MineTab() {
  const {
    user,
    setUser,
    lang,
    setLang,
    soundEnabled,
    setSoundEnabled,
    setAuthModalOpen,
    setAuthModalMode,
    setChatModalOpen,
    showToast,
    setActiveTab,
  } = useApp();

  const handleLogout = async () => {
    soundManager.playClick();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      showToast("সফলভাবে লগআউট হয়েছে", "info");
    } catch {}
  };

  const nextVipExp = (user?.vipLevel || 1) * 1000;
  const currentExp = user?.vipExp || 0;
  const vipPercent = Math.min(100, Math.floor((currentExp / Math.max(1, nextVipExp)) * 100));

  return (
    <div className="space-y-4 p-2 pb-24 max-w-lg mx-auto">
      {/* Profile Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 p-5 shadow-2xl text-white space-y-3">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
                <User className="w-8 h-8 text-slate-950" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-black text-white">{user.username}</h2>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-bold">
                    VIP {user.vipLevel || 1}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{user.phone}</p>
                <div className="text-xs text-amber-400 font-bold mt-1">
                  রেফার কোড: <span className="font-mono text-white">{user.inviteCode}</span>
                </div>
              </div>
            </div>

            {/* VIP Level Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">VIP {user.vipLevel || 1} অগ্রগতি</span>
                <span className="text-amber-400 font-bold">
                  {currentExp} / {nextVipExp} EXP ({vipPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
                  style={{ width: `${vipPercent}%` }}
                ></div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 space-y-3">
            <h2 className="text-base font-black text-white">DKWIN এ স্বাগতম</h2>
            <p className="text-xs text-slate-400">খেলতে ও রিচার্জ করতে অনুগ্রহ করে লগইন করুন</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setAuthModalMode("login");
                  setAuthModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                লগইন
              </button>
              <button
                onClick={() => {
                  setAuthModalMode("register");
                  setAuthModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black"
              >
                রেজিস্ট্রেশন
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Betting & Financial Stats */}
      {user && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-slate-400 block">মোট বেট ভলিউম</span>
            <span className="text-sm font-black text-white tabular-nums">
              ৳{(user.totalBetAmount || 0).toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-slate-400 block">মোট জেতা টাকা</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums">
              ৳{(user.totalWinAmount || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Menu List (Web-only, no app download per user request) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden shadow-md">
        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab("wallet");
          }}
          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">ডিপোজিট ও উত্তোলন হিস্ট্রি</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab("promotion");
          }}
          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center gap-3">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">রেফার ও কমিশন ড্যাশবোর্ড</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            setActiveTab("activity");
          }}
          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center gap-3">
            <Gift className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-slate-200">ভিআইপি ক্লাব ও গিফট কোড</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => {
            soundManager.playClick();
            setChatModalOpen(true);
          }}
          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-800/50 transition"
        >
          <div className="flex items-center gap-3">
            <Headphones className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-slate-200">২৪/৭ টেলিগ্রাম ও লাইভ সাপোর্ট</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* Admin Panel Link */}
        <Link
          href="/admin"
          onClick={() => soundManager.playClick()}
          className="w-full p-3.5 flex items-center justify-between bg-amber-500/5 hover:bg-amber-500/10 transition"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-black text-amber-400 block">এডমিন কন্ট্রোল প্যানেল (Admin Panel)</span>
              <span className="text-[10px] text-slate-400">গেম রেজাল্ট, ডিপোজিট, উইথড্র ও সেটিংস কন্ট্রোল</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </Link>

        {/* Sound Toggle */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-xs font-bold text-slate-200">গেম সাউন্ড ইফেক্ট</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1 rounded-full text-[10px] font-black transition ${
              soundEnabled ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
            }`}
          >
            {soundEnabled ? "ON" : "OFF"}
          </button>
        </div>

        {/* Language Toggle */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">ভাষা (Language)</span>
          </div>
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-amber-300"
          >
            {lang === "bn" ? "বাংলা (BN)" : "English (EN)"}
          </button>
        </div>
      </div>

      {/* Logout Button */}
      {user && (
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-2xl bg-red-950/50 hover:bg-red-900/50 border border-red-500/30 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>লগআউট করুন</span>
        </button>
      )}

      <div className="text-center text-[10px] text-slate-600 pt-2 flex items-center justify-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>DKWIN Official Web Gaming Platform · Curacao Verified</span>
      </div>
    </div>
  );
}
