"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import { X, Copy, Check, Zap, ShieldCheck, Clock, Info, CheckCircle2 } from "lucide-react";

export default function DepositModal() {
  const { depositModalOpen, setDepositModalOpen, refreshUser, showToast, fireConfetti, user, setAuthModalOpen } = useApp();

  const [method, setMethod] = useState<"bkash" | "nagad" | "rocket" | "upay" | "usdt">("bkash");
  const [amountStr, setAmountStr] = useState<string>("50");
  const [trxId, setTrxId] = useState<string>("");
  const [senderNumber, setSenderNumber] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submittedPending, setSubmittedPending] = useState<{
    amount: number;
    method: string;
    trxId: string;
    notice: string;
  } | null>(null);

  const [paymentNumbers, setPaymentNumbers] = useState({
    bkash: "01788223344",
    nagad: "01899112233",
    rocket: "01955443322",
    upay: "01622334455",
    usdt: "TQx7Y2bnWpL8mQ9vZxKrP3sD1fG5hJ4kL8",
  });
  const [paymentTypes, setPaymentTypes] = useState({
    bkash: "সেন্ড মানি (Send Money)",
    nagad: "সেন্ড মানি (Send Money)",
    rocket: "ক্যাশ আউট (Cash Out)",
    upay: "সেন্ড মানি (Send Money)",
    usdt: "TRC20 Transfer",
  });
  const [minDeposit, setMinDeposit] = useState<number>(50);
  const [bonusPercent, setBonusPercent] = useState<number>(5);
  const [depositRules, setDepositRules] = useState<string>(
    "১. উপরে দেওয়া অফিসিয়াল নাম্বারে নির্ধারিত নিয়মে (সেন্ড মানি / ক্যাশ আউট) টাকা পাঠান।\n২. সর্বনিম্ন ডিপোজিট ৫০ টাকা। আপনার ইচ্ছেমতো যেকোনো অ্যামাউন্ট বসিয়ে ডিপোজিট করতে পারবেন।\n৩. টাকা পাঠানোর পর সঠিক TrxID এবং আপনার প্রেরক নাম্বার দিয়ে সাবমিট করুন।"
  );
  const [pendingNotice, setPendingNotice] = useState<string>(
    "আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন, এডমিন যাচাই করে অনুমোদন করবেন।"
  );

  useEffect(() => {
    if (depositModalOpen) {
      setSubmittedPending(null);
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            const s = data.settings;
            setPaymentNumbers({
              bkash: s.bkashNumber || "01788223344",
              nagad: s.nagadNumber || "01899112233",
              rocket: s.rocketNumber || "01955443322",
              upay: s.upayNumber || "01622334455",
              usdt: s.usdtAddress || "TQx7Y2bnWpL8mQ9vZxKrP3sD1fG5hJ4kL8",
            });
            setPaymentTypes({
              bkash: s.bkashType || "সেন্ড মানি (Send Money)",
              nagad: s.nagadType || "সেন্ড মানি (Send Money)",
              rocket: s.rocketType || "ক্যাশ আউট (Cash Out)",
              upay: s.upayType || "সেন্ড মানি (Send Money)",
              usdt: "TRC20 Transfer",
            });
            if (s.minDeposit !== undefined) {
              setMinDeposit(Number(s.minDeposit) || 50);
            }
            if (s.depositBonusPercent !== undefined) {
              setBonusPercent(Number(s.depositBonusPercent));
            }
            if (s.depositRules) {
              setDepositRules(s.depositRules);
            }
            if (s.pendingNotice) {
              setPendingNotice(s.pendingNotice);
            }
          }
        })
        .catch(() => {});
    }
  }, [depositModalOpen]);

  if (!depositModalOpen) return null;

  const currentNumber = paymentNumbers[method] || "01788223344";
  const currentTypeLabel = paymentTypes[method] || "সেন্ড মানি (Send Money)";
  const parsedAmount = parseFloat(amountStr) || 0;

  const handleCopy = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(currentNumber);
    setCopied(true);
    showToast("নাম্বার সফলভাবে কপি হয়েছে!", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setDepositModalOpen(false);
      setAuthModalOpen(true);
      return;
    }

    if (parsedAmount < minDeposit) {
      showToast(`সর্বনিম্ন ডিপোজিট পরিমাণ ৳${minDeposit}`, "error");
      return;
    }

    if (!senderNumber || senderNumber.trim().length < 11) {
      showToast("সঠিক ১১ ডিজিটের প্রেরক নাম্বার দিন", "error");
      return;
    }

    if (!trxId || trxId.trim().length < 4) {
      showToast("সঠিক ট্রানজেকশন আইডি (TrxID) দিন", "error");
      return;
    }

    setLoading(true);
    soundManager.playClick();

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          method,
          trxId: trxId.trim(),
          senderNumber: senderNumber.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundManager.playWin();
        if (data.status === "completed") {
          fireConfetti();
        }
        await refreshUser();
        setSubmittedPending({
          amount: parsedAmount,
          method: method.toUpperCase(),
          trxId: trxId.trim().toUpperCase(),
          notice: data.pendingNotice || pendingNotice,
        });
        setTrxId("");
        showToast(data.message, "success");
      } else {
        showToast(data.error || "ডিপোজিট ব্যর্থ হয়েছে", "error");
      }
    } catch {
      showToast("সার্ভার ত্রুটি, পুনরায় চেষ্টা করুন", "error");
    } finally {
      setLoading(false);
    }
  };

  const presets = [50, 100, 200, 500, 1000, 5000];

  const methods = [
    { id: "bkash", name: "বিকাশ", color: "bg-pink-600", badge: "bKash" },
    { id: "nagad", name: "নগদ", color: "bg-orange-600", badge: "Nagad" },
    { id: "rocket", name: "রকেট", color: "bg-purple-600", badge: "Rocket" },
    { id: "upay", name: "উপায়", color: "bg-blue-600", badge: "Upay" },
    { id: "usdt", name: "USDT", color: "bg-emerald-600", badge: "TRC20" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/30 p-5 shadow-2xl text-white space-y-3.5 my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setDepositModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Zap className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">দ্রুত ডিপোজিট (সর্বনিম্ন ৳{minDeposit})</h2>
            <p className="text-[11px] text-emerald-400 font-semibold">
              নিজের ইচ্ছেমতো অ্যামাউন্ট বসিয়ে রিচার্জ করুন {bonusPercent > 0 ? `(+${bonusPercent}% বোনাস)` : ""}
            </p>
          </div>
        </div>

        {/* If Submitted -> Show Clear Pending Status Card + 2-10 Minute Notice */}
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
                ৳{submittedPending.amount.toLocaleString()} ডিপোজিট রিকোয়েস্ট জমা হয়েছে!
              </h3>
              <div className="bg-slate-950/80 rounded-xl p-2.5 text-xs text-slate-300 space-y-1 border border-slate-800 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">পেমেন্ট মাধ্যম:</span>
                  <span className="font-bold text-amber-300">{submittedPending.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TrxID:</span>
                  <span className="font-mono font-bold text-white">{submittedPending.trxId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">বর্তমান অবস্থা:</span>
                  <span className="font-bold text-amber-400">এডমিন অনুমোদনের অপেক্ষায় (Pending)</span>
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
                setDepositModalOpen(false);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm shadow-lg transition"
            >
              ঠিক আছে (ওয়ালেটে দেখুন)
            </button>
          </div>
        ) : (
          <>
            {/* Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">১. পেমেন্ট মাধ্যম বেছে নিন</label>
              <div className="grid grid-cols-5 gap-1.5">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setMethod(m.id);
                    }}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                      method === m.id
                        ? "bg-amber-500/20 border-amber-400 text-white shadow-md"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white mb-1 ${m.color}`}>
                      {m.badge}
                    </span>
                    <span className="text-[11px] font-bold">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Official Number + Admin-Controlled Payment Mode (Send Money / Cash Out) */}
            <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300 font-semibold">
                  অফিসিয়াল {method.toUpperCase()} নাম্বার:
                </span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black">
                  {currentTypeLabel}
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                <span className="font-mono font-black text-sm text-amber-400 tracking-wider select-all truncate">
                  {currentNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "কপি হয়েছে" : "কপি"}</span>
                </button>
              </div>
            </div>

            {/* Admin-Editable Deposit Rules Box */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-400">
                <Info className="w-3.5 h-3.5" />
                <span>ডিপোজিট করার নিয়মাবলী ({currentTypeLabel}):</span>
              </div>
              <p className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                {depositRules}
              </p>
            </div>

            {/* Custom Amount Input + Quick Presets */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    ২. টাকার পরিমাণ লেখুন (সর্বনিম্ন ৳{minDeposit})
                  </label>
                  {bonusPercent > 0 && parsedAmount >= minDeposit && (
                    <span className="text-[11px] text-emerald-400 font-bold">
                      পাবেন: ৳{(parsedAmount + (parsedAmount * bonusPercent) / 100).toFixed(0)}
                    </span>
                  )}
                </div>

                {/* Custom Free-form Amount Input */}
                <div className="relative mb-2">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-black text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min={minDeposit}
                    step="any"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder={`নিজের ইচ্ছেমতো টাকার পরিমাণ লিখুন (৳${minDeposit}+)`}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-sm text-white font-black focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-6 gap-1.5">
                  {presets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setAmountStr(String(val));
                      }}
                      className={`py-1.5 rounded-lg font-bold text-[11px] border transition ${
                        parsedAmount === val
                          ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-300 font-black"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      ৳{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Phone & TrxID */}
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    আপনার প্রেরক {method.toUpperCase()} নাম্বার (যে নাম্বার থেকে পাঠিয়েছেন)
                  </label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    ট্রানজেকশন আইডি (TrxID) দিন
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: BJM82K90LP"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition transform active:scale-95 disabled:opacity-50"
              >
                {loading ? "সাবমিট হচ্ছে..." : `৳${parsedAmount || 0} ডিপোজিট রিকোয়েস্ট পাঠান`}
              </button>

              {/* Pending Time Notice Below Submit */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-200 leading-relaxed">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{pendingNotice}</span>
              </div>
            </form>
          </>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>১০০% নিরাপদ ভেরিফাইড পেমেন্ট সিস্টেম</span>
        </div>
      </div>
    </div>
  );
}
