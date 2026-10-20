"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import {
  Disc3,
  CalendarCheck,
  Ticket,
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function ActivityTab() {
  const {
    setDepositModalOpen,
    setCheckInModalOpen,
    setSpinModalOpen,
    setGiftModalOpen,
  } = useApp();

  const promotions = [
    {
      id: "welcome",
      title: "ডিপোজিট ক্যাশব্যাক ও রিচার্জ বোনাস",
      desc: "সর্বনিম্ন মাত্র ৳৫০ রিচার্জ করে আপনার ইচ্ছেমতো বেট ধরুন এবং অতিরিক্ত ডিপোজিট বোনাস পান!",
      tag: "DEPOSIT BONUS",
      color: "from-amber-600 to-red-600",
      action: () => setDepositModalOpen(true),
    },
    {
      id: "checkin",
      title: "৭ দিনের ধারাবাহিক সাইন-ইন বোনাস",
      desc: "প্রতিদিন লগইন করে ক্লেইম করুন নগদ টাকা ও স্পিন টিকেট।",
      tag: "DAILY FREE",
      color: "from-blue-600 to-indigo-700",
      action: () => setCheckInModalOpen(true),
    },
    {
      id: "spin",
      title: "লাকি হুইল জ্যাকপট (৳৫,০০০ পর্যন্ত)",
      desc: "প্রতিদিন ফ্রি স্পিন ঘুরিয়ে জিতে নিন ইনস্ট্যান্ট ক্যাশ প্রাইজ।",
      tag: "FREE SPIN",
      color: "from-purple-600 to-pink-700",
      action: () => setSpinModalOpen(true),
    },
    {
      id: "gift",
      title: "স্পেশাল রিডিম গিফট কোড",
      desc: "'DKWIN2026' বা এডমিন প্রদত্ত ভিআইপি গিফট কোড দিয়ে তাৎক্ষণিক বোনাস নিন।",
      tag: "GIFT CODE",
      color: "from-rose-600 to-red-700",
      action: () => setGiftModalOpen(true),
    },
  ];

  const vipTiers = [
    { level: "VIP 1", exp: "৳0", bonus: "৳50", monthly: "৳100", rebate: "0.2%" },
    { level: "VIP 2", exp: "৳1,000", bonus: "৳100", monthly: "৳250", rebate: "0.3%" },
    { level: "VIP 3", exp: "৳5,000", bonus: "৳300", monthly: "৳600", rebate: "0.4%" },
    { level: "VIP 4", exp: "৳20,000", bonus: "৳1,000", monthly: "৳2,000", rebate: "0.5%" },
    { level: "VIP 5", exp: "৳50,000", bonus: "৳3,000", monthly: "৳5,000", rebate: "0.6%" },
    { level: "VIP 10", exp: "৳500,000", bonus: "৳50,000", monthly: "৳100,000", rebate: "1.2%" },
  ];

  return (
    <div className="space-y-4 p-2 pb-24 max-w-lg mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-black text-white">DKWIN অফার ও বোনাস সেন্টার</h2>
        </div>
        <p className="text-xs text-slate-300">
          DKWIN এর সমস্ত স্পেশাল বোনাস, লাকি হুইল ও ভিআইপি রিওয়ার্ড ক্লেইম করুন।
        </p>
      </div>

      {/* Promotions List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
          সক্রিয় ইভেন্টসমূহ
        </h3>
        {promotions.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              soundManager.playClick();
              p.action();
            }}
            className={`bg-gradient-to-r ${p.color} border border-white/10 rounded-2xl p-3.5 shadow-lg cursor-pointer transform hover:-translate-y-0.5 active:scale-95 transition`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block text-[9px] font-black px-2 py-0.5 rounded-full bg-black/40 text-amber-300 mb-1">
                  {p.tag}
                </span>
                <h4 className="text-sm font-black text-white">{p.title}</h4>
                <p className="text-xs text-slate-100/90 mt-0.5">{p.desc}</p>
              </div>
              <div className="p-2 rounded-xl bg-white/15 text-white">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VIP Club Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white">DKWIN ভিআইপি রিওয়ার্ড চার্ট</h3>
          </div>
          <span className="text-[10px] text-amber-400 font-semibold">অটো আপগ্রেড</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1.5 px-2">লেভেল</th>
                <th className="py-1.5 px-2">প্রয়োজনীয় বেট</th>
                <th className="py-1.5 px-2">লেভেল বোনাস</th>
                <th className="py-1.5 px-2">মাসিক</th>
                <th className="py-1.5 px-2">রিবেট</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {vipTiers.map((v, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="py-2 px-2 font-black text-amber-400">{v.level}</td>
                  <td className="py-2 px-2">{v.exp}</td>
                  <td className="py-2 px-2 text-emerald-400 font-bold">{v.bonus}</td>
                  <td className="py-2 px-2 text-amber-300 font-bold">{v.monthly}</td>
                  <td className="py-2 px-2">{v.rebate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>সব বোনাস সরাসরি মেইন ব্যালেন্সে যুক্ত হয়</span>
      </div>
    </div>
  );
}
