"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import { Users, Copy, Check, Share2, DollarSign, Sparkles, Headphones } from "lucide-react";

export default function PromotionTab() {
  const { user, showToast, setChatModalOpen } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referralCommissionPercent, setReferralCommissionPercent] = useState<number>(3.0);
  const [referralBonusAmount, setReferralBonusAmount] = useState<number>(50.0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          if (d.settings.referralCommissionPercent !== undefined) {
            setReferralCommissionPercent(Number(d.settings.referralCommissionPercent));
          }
          if (d.settings.referralBonusAmount !== undefined) {
            setReferralBonusAmount(Number(d.settings.referralBonusAmount));
          }
        }
      })
      .catch(() => {});
  }, []);

  const inviteCode = user?.inviteCode || "DKWIN88";
  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${inviteCode}`
      : `https://dkwin.live/?ref=${inviteCode}`;

  const handleCopyLink = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    showToast("আমন্ত্রণ লিংক কপি হয়েছে!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    showToast("আমন্ত্রণ কোড কপি হয়েছে!", "success");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4 p-2 pb-24 max-w-lg mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 border border-amber-400/40 rounded-2xl p-4 shadow-xl text-white space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-300" />
          <h2 className="text-base font-black">DKWIN রেফার ও আনলিমিটেড কমিশন</h2>
        </div>
        <p className="text-xs text-slate-100 font-medium">
          প্রতিটি সফল রেফারে ফিক্সড ৳{referralBonusAmount} বোনাস এবং বন্ধুর প্রতিটি ডিপোজিটে {referralCommissionPercent}% লাইফটাইম কমিশন!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="bg-slate-950/60 rounded-xl p-2.5 text-center border border-white/10">
            <span className="text-[10px] text-slate-300 block">রেফার বোনাস রেট</span>
            <span className="text-base font-black text-amber-300">
              ৳{referralBonusAmount} + {referralCommissionPercent}%
            </span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-2.5 text-center border border-white/10">
            <span className="text-[10px] text-slate-300 block">মোট অর্জিত কমিশন</span>
            <span className="text-base font-black text-emerald-400">
              ৳{(user?.commissionBalance || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Referral Link & Code Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-md">
        <h3 className="text-xs font-black text-white">আপনার পার্সোনাল রেফারেল লিংক ও কোড</h3>

        {/* Code */}
        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
          <div>
            <span className="text-[10px] text-slate-400 block">আপনার রেফার কোড</span>
            <span className="font-mono font-black text-sm text-amber-400 tracking-wider">{inviteCode}</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? "কপি হয়েছে" : "কোড কপি"}</span>
          </button>
        </div>

        {/* Link */}
        <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
          <div className="truncate max-w-[200px]">
            <span className="text-[10px] text-slate-400 block">আমন্ত্রণ লিংক</span>
            <span className="font-mono text-xs text-slate-300 truncate block">{inviteLink}</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-3 py-1.5 rounded-lg shadow font-black transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "কপি হয়েছে" : "লিংক শেয়ার"}</span>
          </button>
        </div>
      </div>

      {/* Commission Rules Controlled from Admin Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-white">রেফারেল কমিশন কাঠামো</h3>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
            অটোমেটিক ক্রেডিট
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-amber-400">নতুন একাউন্ট রেফার বোনাস</span>
              <p className="text-[10px] text-slate-400">আপনার রেফার কোড ব্যবহার করে একাউন্ট খুললে</p>
            </div>
            <span className="font-black text-emerald-400 text-sm">৳{referralBonusAmount} বোনাস</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-sky-400">ডিপোজিট রিবেট কমিশন</span>
              <p className="text-[10px] text-slate-400">রেফারকৃত ইউজারের প্রতিটি সফল রিচার্জে</p>
            </div>
            <span className="font-black text-emerald-400 text-sm">{referralCommissionPercent}% কমিশন</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-purple-400">ভিআইপি এজেন্ট সাপোর্ট</span>
              <p className="text-[10px] text-slate-400">বড় টিমের জন্য স্পেশাল ডেইলি স্যালারি</p>
            </div>
            <button
              onClick={() => setChatModalOpen(true)}
              className="text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1"
            >
              <Headphones className="w-3 h-3" />
              <span>টেলিগ্রাম</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-2.5">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
        <p className="text-[11px] text-slate-300 leading-relaxed">
          আপনার রেফার কমিশন সরাসরি মেইন ব্যালেন্স ও কমিশন ব্যালেন্সে যোগ হয়, যা দিয়ে আপনি যেকোনো গেম খেলতে বা উত্তোলন করতে পারবেন।
        </p>
      </div>
    </div>
  );
}
