"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import {
  Wallet,
  ArrowUpRight,
  CalendarCheck,
  Disc3,
  Ticket,
  Crown,
  Headphones,
  Sparkles,
} from "lucide-react";

export default function QuickActions() {
  const {
    t,
    setDepositModalOpen,
    setWithdrawModalOpen,
    setCheckInModalOpen,
    setSpinModalOpen,
    setGiftModalOpen,
    setChatModalOpen,
    setActiveTab,
    setActiveGame,
  } = useApp();

  const actions = [
    {
      id: "deposit",
      label: t.deposit,
      icon: Wallet,
      color: "from-emerald-500 to-teal-600",
      border: "border-emerald-500/30",
      badge: "৳৫০+",
      onClick: () => setDepositModalOpen(true),
    },
    {
      id: "withdraw",
      label: t.withdraw,
      icon: ArrowUpRight,
      color: "from-amber-500 to-orange-600",
      border: "border-amber-500/30",
      onClick: () => setWithdrawModalOpen(true),
    },
    {
      id: "thimble",
      label: "থিম্বল গেম",
      icon: Sparkles,
      color: "from-amber-400 to-red-600",
      border: "border-amber-500/30",
      badge: "HOT",
      onClick: () => setActiveGame("thimble"),
    },
    {
      id: "spin",
      label: t.luckySpin,
      icon: Disc3,
      color: "from-purple-500 to-pink-600",
      border: "border-purple-500/30",
      badge: "৳৫০০০",
      onClick: () => setSpinModalOpen(true),
    },
    {
      id: "checkin",
      label: t.checkIn,
      icon: CalendarCheck,
      color: "from-blue-500 to-indigo-600",
      border: "border-blue-500/30",
      onClick: () => setCheckInModalOpen(true),
    },
    {
      id: "gift",
      label: t.giftCode,
      icon: Ticket,
      color: "from-rose-500 to-red-600",
      border: "border-rose-500/30",
      onClick: () => setGiftModalOpen(true),
    },
    {
      id: "refer",
      label: "রেফার আয়",
      icon: Crown,
      color: "from-yellow-400 to-amber-600",
      border: "border-yellow-500/30",
      onClick: () => setActiveTab("promotion"),
    },
    {
      id: "support",
      label: "টেলিগ্রাম চ্যাট",
      icon: Headphones,
      color: "from-sky-500 to-cyan-600",
      border: "border-sky-500/30",
      onClick: () => setChatModalOpen(true),
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 px-1 my-3">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={() => {
              soundManager.playClick();
              act.onClick();
            }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border ${act.border} hover:bg-slate-800 transition transform active:scale-95 relative group shadow-sm`}
          >
            {act.badge && (
              <span className="absolute -top-1.5 -right-1 text-[8px] bg-red-600 text-white font-extrabold px-1 py-0.2 rounded-full shadow-md">
                {act.badge}
              </span>
            )}
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${act.color} flex items-center justify-center shadow-md mb-1.5 group-hover:scale-110 transition-transform`}
            >
              <Icon className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <span className="text-[11px] font-bold text-slate-200 text-center tracking-tight truncate max-w-full">
              {act.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
