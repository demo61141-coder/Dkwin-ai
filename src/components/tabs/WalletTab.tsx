"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  History,
  DollarSign,
  Gift,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface Txn {
  id: number;
  type: string;
  amount: number;
  method: string;
  status: string;
  trxId?: string;
  accountNumber?: string;
  note?: string;
  createdAt: string;
}

export default function WalletTab() {
  const { user, setDepositModalOpen, setWithdrawModalOpen, refreshUser, showToast } = useApp();
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingNotice, setPendingNotice] = useState<string>(
    "আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন, এডমিন যাচাই করে অনুমোদন করবেন।"
  );

  const fetchTxns = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [res, settingsRes] = await Promise.all([
        fetch("/api/wallet/transactions"),
        fetch("/api/settings"),
      ]);
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
      const sData = await settingsRes.json();
      if (sData.settings?.pendingNotice) {
        setPendingNotice(sData.settings.pendingNotice);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTxns();
  }, [fetchTxns]);

  const pendingTxns = transactions.filter((t) => t.status === "pending");

  return (
    <div className="space-y-4 p-2 pb-24 max-w-lg mx-auto">
      {/* Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 p-5 shadow-2xl text-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Wallet className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">মোট ব্যালেন্স (Main Balance)</span>
              <div className="text-2xl font-black text-amber-300 tracking-tight tabular-nums">
                ৳{user?.balance?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              soundManager.playClick();
              await refreshUser();
              await fetchTxns();
              showToast("ওয়ালেট রিফ্রেশ হয়েছে", "info");
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Bonus & Commission Pill Rows */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">বোনাস ব্যালেন্স</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums">
              ৳{user?.bonusBalance?.toFixed(2) || "0.00"}
            </span>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">রেফার কমিশন ব্যালেন্স</span>
            <span className="text-sm font-black text-amber-400 tabular-nums">
              ৳{user?.commissionBalance?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>

        {/* Deposit & Withdraw Big Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => {
              soundManager.playClick();
              setDepositModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ডিপোজিট (৳৫০+)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setWithdrawModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition transform active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>উত্তোলন (Withdraw)</span>
          </button>
        </div>
      </div>

      {/* Active Pending Requests Notice Box */}
      {pendingTxns.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-3.5 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-300 font-black text-xs">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>আপনার {pendingTxns.length}টি রিকোয়েস্ট পেন্ডিং (Pending) আছে</span>
            </div>
            <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
              যাচাই চলছে
            </span>
          </div>
          <p className="text-[11px] text-amber-100 leading-relaxed font-medium">
            {pendingNotice}
          </p>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white">সাম্প্রতিক লেনদেন হিস্ট্রি</h3>
          </div>
          <span className="text-[10px] text-slate-500">{transactions.length} টি রেকর্ড</span>
        </div>

        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500">লোড হচ্ছে...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">কোনো লেনদেন পাওয়া যায়নি</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className={`bg-slate-950 border p-3 rounded-xl space-y-1.5 ${
                  t.status === "pending" ? "border-amber-500/40" : "border-slate-800/90"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        t.type === "deposit"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : t.type === "withdraw"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}
                    >
                      {t.type === "deposit" ? (
                        <DollarSign className="w-4 h-4" />
                      ) : t.type === "withdraw" ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="capitalize">
                          {t.type === "deposit" ? "ডিপোজিট" : t.type === "withdraw" ? "উত্তোলন" : "বোনাস / জয়"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">
                          {t.method}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[190px]">{t.note}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black block tabular-nums ${
                        t.type === "withdraw" ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {t.type === "withdraw" ? "-" : "+"}৳{t.amount.toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
                        t.status === "completed"
                          ? "text-emerald-400"
                          : t.status === "rejected"
                          ? "text-red-400"
                          : "text-amber-400"
                      }`}
                    >
                      {t.status === "completed" ? (
                        <>
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>সফল (Approved)</span>
                        </>
                      ) : t.status === "rejected" ? (
                        <>
                          <XCircle className="w-2.5 h-2.5" />
                          <span>বাতিল (Rejected)</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-2.5 h-2.5 animate-spin" />
                          <span>পেন্ডিং (Pending)</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {t.status === "pending" && (
                  <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-amber-300/90 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{pendingNotice}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
