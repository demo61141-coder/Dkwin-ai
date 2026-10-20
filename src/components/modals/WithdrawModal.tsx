"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import { X, ArrowUpRight, ShieldCheck, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

export default function WithdrawModal() {
  const { withdrawModalOpen, setWithdrawModalOpen, refreshUser, showToast, user } = useApp();

  const [method, setMethod] = useState<"bkash" | "nagad" | "rocket" | "upay">("bkash");
  const [amountStr, setAmountStr] = useState<string>("500");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [minWithdraw, setMinWithdraw] = useState<number>(110);
  const [pendingNotice, setPendingNotice] = useState<string>(
    "আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন, এডমিন যাচাই করে অনুমোদন করবেন।"
  );
  const [submittedPending, setSubmittedPending] = useState<{
    amount: number;
    method: string;
    accountNumber: string;
    notice: string;
  } | null>(null);

  useEffect(() => {
    if (withdrawModalOpen) {
      setSubmittedPending(null);
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            if (data.settings.minWithdraw !== undefined) {
              setMinWithdraw(Number(data.settings.minWithdraw) || 110);
            }
            if (data.settings.pendingNotice) {
              setPendingNotice(data.settings.pendingNotice);
            }
          }
        })
        .catch(() => {});
    }
  }, [withdrawModalOpen]);

  if (!withdrawModalOpen) return null;

  const parsedAmount = parseFloat(amountStr) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    if (parsedAmount < minWithdraw) {
      showToast(`সর্বনিম্ন উত্তোলন পরিমাণ ৳${minWithdraw}`, "error");
      return;
    }

    if (user.balance < parsedAmount) {
      showToast("আপনার ব্যালেন্সে পর্যাপ্ত টাকা নেই!", "error");
      return;
    }

    if (!accountNumber || accountNumber.trim().length < 11) {
      showToast("সঠিক ১১ ডিজিটের ওয়ালেট নাম্বার দিন", "error");
      return;
    }

    setLoading(true);
    soundManager.playClick();

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          method,
          accountNumber: accountNumber.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundManager.playWin();
        await refreshUser();
        setSubmittedPending({
          amount: parsedAmount,
          method: method.toUpperCase(),
          accountNumber: accountNumber.trim(),
          notice: data.pendingNotice || pendingNotice,
        });
        showToast(data.message, "success");
      } else {
        showToast(data.error || "উত্তোলন সম্পন্ন করা যায়নি", "error");
      }
    } catch {
      showToast("সার্ভার ত্রুটি, পুনরায় চেষ্টা করুন", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/30 p-5 shadow-2xl text-white space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setWithdrawModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <ArrowUpRight className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">টাকা উত্তোলন (Withdraw)</h2>
            <p className="text-[11px] text-amber-400 font-semibold">
              সর্বনিম্ন উত্তোলন ৳{minWithdraw} · দ্রুত পেমেন্ট গ্যারান্টি
            </p>
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">উত্তোলনযোগ্য ব্যালেন্স:</span>
          <span className="text-base font-black text-amber-400 tabular-nums">
            ৳{user?.balance?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </span>
        </div>

        {submittedPending ? (
          <div className="space-y-4 py-2">
            <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-6 h-6" />
              </div>
              <span className="inline-block px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                STATUS: PENDING (পেন্ডিং)
              </span>
              <h3 className="text-base font-black text-white">
                ৳{submittedPending.amount.toLocaleString()} উত্তোলন রিকোয়েস্ট জমা হয়েছে!
              </h3>
              <div className="bg-slate-950/80 rounded-xl p-2.5 text-xs text-slate-300 space-y-1 border border-slate-800 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">মাধ্যম:</span>
                  <span className="font-bold text-amber-300">{submittedPending.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">রিসিভার নাম্বার:</span>
                  <span className="font-mono font-bold text-white">{submittedPending.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">বর্তমান অবস্থা:</span>
                  <span className="font-bold text-amber-400">পেন্ডিং (এডমিন চেক করছেন)</span>
                </div>
              </div>

              <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 font-medium leading-relaxed text-left flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{submittedPending.notice}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubmittedPending(null);
                setWithdrawModalOpen(false);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm shadow-lg transition"
            >
              ঠিক আছে (ওয়ালেটে দেখুন)
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">পেমেন্ট মাধ্যম</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "bkash", label: "বিকাশ" },
                  { id: "nagad", label: "নগদ" },
                  { id: "rocket", label: "রকেট" },
                  { id: "upay", label: "উপায়" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setMethod(m.id as "bkash" | "nagad" | "rocket" | "upay");
                    }}
                    className={`py-2 rounded-xl border text-xs font-bold transition ${
                      method === m.id
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                উত্তোলন পরিমাণ (সর্বনিম্ন ৳{minWithdraw})
              </label>
              <input
                type="number"
                min={minWithdraw}
                step="any"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-black text-amber-400 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                আপনার পার্সোনাল {method.toUpperCase()} নাম্বার
              </label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX (১১ ডিজিট)"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">লগইন পাসওয়ার্ড / পিন</label>
              <input
                type="password"
                placeholder="আপনার পাসওয়ার্ড দিন"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition transform active:scale-95 disabled:opacity-50"
            >
              {loading ? "প্রসেসিং হচ্ছে..." : `৳${parsedAmount || 0} উত্তোলনের আবেদন করুন`}
            </button>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-200 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{pendingNotice}</span>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>২৪ ঘণ্টা অটোমেটেড ও ভেরিফাইড উত্তোলন সেবা</span>
        </div>
      </div>
    </div>
  );
}
