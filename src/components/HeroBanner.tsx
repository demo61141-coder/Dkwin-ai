"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import { Sparkles, Trophy, Zap, Gift, ShieldCheck, ChevronRight } from "lucide-react";

export default function HeroBanner() {
  const { setDepositModalOpen, setSpinModalOpen, setActiveGame } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      id: 1,
      title: "সর্বনিম্ন ডিপোজিট মাত্র ৳৫০",
      subtitle: "বিকাশ, নগদ ও রকেটে নিজের ইচ্ছেমতো অ্যামাউন্ট বসিয়ে রিচার্জ করুন ও +৫% বোনাস পান!",
      cta: "এখনই ডিপোজিট করুন",
      icon: Gift,
      gradient: "from-amber-600 via-red-600 to-purple-800",
      action: () => setDepositModalOpen(true),
    },
    {
      id: 2,
      title: "Win Go কালার ও বিগ/স্মল",
      subtitle: "সর্বনিম্ন মাত্র ৳১ দিয়ে বেট ধরুন এবং প্রতি মিনিটে ৯ গুণ পর্যন্ত জিতুন!",
      cta: "উইন গো খেলুন",
      icon: Zap,
      gradient: "from-emerald-700 via-teal-800 to-slate-900",
      action: () => setActiveGame("wingo"),
    },
    {
      id: 3,
      title: "৪টি ক্র্যাশ প্লেন ও থিম্বল গেম",
      subtitle: "Aviator, JetX, SpaceXY এবং ৩ কাপের Thimble গেমে তাৎক্ষণিক ক্যাশআউট!",
      cta: "ক্র্যাশ গেম খেলুন",
      icon: Sparkles,
      gradient: "from-rose-700 via-pink-800 to-indigo-950",
      action: () => setActiveGame("aviator"),
    },
    {
      id: 4,
      title: "1xBet স্টাইল ক্রিকেট মাল্টি বেট",
      subtitle: "বিপিএল, আইপিএল ও ফুটবলে একসাথে একাধিক ম্যাচে মাল্টি বেট ধরুন!",
      cta: "স্পোর্টস বেট ধরুন",
      icon: Trophy,
      gradient: "from-purple-700 via-violet-800 to-amber-900",
      action: () => setActiveGame("sports"),
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const activeBanner = banners[currentSlide];
  const Icon = activeBanner.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r shadow-xl border border-amber-500/30 mx-1 my-2">
      <div className={`p-4 bg-gradient-to-r ${activeBanner.gradient} transition-all duration-700 flex flex-col justify-between min-h-[140px]`}>
        <div className="flex items-start justify-between">
          <div className="max-w-[74%]">
            <div className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>DKWIN অফিশিয়াল প্ল্যাটফর্ম</span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight drop-shadow-md">
              {activeBanner.title}
            </h2>
            <p className="text-xs text-slate-100 font-medium mt-0.5 line-clamp-2 drop-shadow">
              {activeBanner.subtitle}
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <Icon className="w-8 h-8 text-amber-300" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => {
              soundManager.playClick();
              activeBanner.action();
            }}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30 transition transform active:scale-95 whitespace-nowrap"
          >
            <span>{activeBanner.cta}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "w-5 bg-amber-400" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
