"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Wallet,
  Users,
  ArrowUpRight,
  PlusCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Ticket,
  Headphones,
  Settings,
  DollarSign,
  TrendingUp,
  Save,
  Send,
  LogOut,
  Smartphone,
  ExternalLink,
  Gamepad2,
  Trophy,
  Trash2,
  Sliders,
} from "lucide-react";

interface WingoBreakdown {
  activePeriod?: string;
  remainingSeconds?: number;
  totalRoundBet?: number;
  totalWingoBet?: number;
  big: number;
  small: number;
  green: number;
  red: number;
  violet: number;
  numbers: Record<string, number>;
}

interface AdminStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDepositsCount: number;
  pendingWithdrawalsCount: number;
  totalBetVolume: number;
  totalPaidWinnings: number;
  totalFeeEarned: number;
  houseProfit: number;
  wingoLive: WingoBreakdown;
  wingoOverall: WingoBreakdown;
}

interface SiteSettingsData {
  id?: number;
  bkashNumber: string;
  bkashType: string;
  nagadNumber: string;
  nagadType: string;
  rocketNumber: string;
  rocketType: string;
  upayNumber: string;
  upayType: string;
  usdtAddress: string;
  minDeposit: number;
  minWithdraw: number;
  minBet: number;
  depositBonusPercent: number;
  welcomeBonus: number;
  wingoFeePercent: number;
  nextWingoResult: string;
  nextCrashPoint: number;
  crashMaxMultiplier: number;
  thimbleWinRate: number;
  slotWinRate: number;
  referralCommissionPercent: number;
  referralBonusAmount: number;
  telegramUsername: string;
  telegramChannel: string;
  depositRules: string;
  pendingNotice: string;
  adminPin: string;
  siteNotice: string;
  isDepositAutoApprove: boolean;
}

interface DepositRecord {
  id: number;
  userId: number;
  amount: number;
  method: string;
  accountNumber: string;
  trxId: string;
  status: string;
  note: string;
  createdAt: string;
  username: string;
  phone: string;
  userBalance: number;
}

interface WithdrawRecord {
  id: number;
  userId: number;
  amount: number;
  method: string;
  accountNumber: string;
  status: string;
  note: string;
  createdAt: string;
  username: string;
  phone: string;
  userBalance: number;
}

interface UserItem {
  id: number;
  username: string;
  phone: string;
  balance: number;
  bonusBalance: number;
  commissionBalance?: number;
  vipLevel: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalBetAmount: number;
  totalWinAmount: number;
  isBanned: boolean;
  isDemo: boolean;
  createdAt: string;
}

interface GiftCodeItem {
  id: number;
  code: string;
  amount: number;
  maxClaims: number;
  claimsCount: number;
  isActive: boolean;
  createdAt: string;
}

interface MatchItem {
  id: number;
  sport: string;
  tournament: string;
  teamA: string;
  teamB: string;
  oddsA: number;
  oddsDraw: number;
  oddsB: number;
  status: string;
  score: string;
  startTime: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  const [activeTab, setActiveTab] = useState<
    "overview" | "games" | "numbers" | "deposits" | "withdrawals" | "sports" | "users" | "gifts" | "chat"
  >("overview");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [settings, setSettings] = useState<SiteSettingsData>({
    bkashNumber: "01788223344",
    bkashType: "সেন্ড মানি (Send Money)",
    nagadNumber: "01899112233",
    nagadType: "সেন্ড মানি (Send Money)",
    rocketNumber: "01955443322",
    rocketType: "ক্যাশ আউট (Cash Out)",
    upayNumber: "01622334455",
    upayType: "সেন্ড মানি (Send Money)",
    usdtAddress: "TQx7Y2bnWpL8mQ9vZxKrP3sD1fG5hJ4kL8",
    minDeposit: 50,
    minWithdraw: 110,
    minBet: 1,
    depositBonusPercent: 5,
    welcomeBonus: 0,
    wingoFeePercent: 2.0,
    nextWingoResult: "auto",
    nextCrashPoint: 0,
    crashMaxMultiplier: 25.0,
    thimbleWinRate: 40,
    slotWinRate: 42,
    referralCommissionPercent: 3.0,
    referralBonusAmount: 50.0,
    telegramUsername: "@DKWIN_Official_Support",
    telegramChannel: "https://t.me/DKWIN_Official_Support",
    depositRules:
      "১. উপরে দেওয়া অফিসিয়াল নাম্বারে নির্ধারিত নিয়মে (সেন্ড মানি / ক্যাশ আউট) টাকা পাঠান।\n২. সর্বনিম্ন ডিপোজিট ৫০ টাকা। আপনার ইচ্ছেমতো যেকোনো অ্যামাউন্ট বসিয়ে ডিপোজিট করতে পারবেন।\n৩. টাকা পাঠানোর পর সঠিক TrxID এবং আপনার প্রেরক নাম্বার দিয়ে সাবমিট করুন।",
    pendingNotice:
      "আপনার ব্যালেন্স পেতে ২ মিনিট থেকে সর্বোচ্চ ১০ মিনিট সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন, এডমিন যাচাই করে অনুমোদন করবেন।",
    adminPin: "123456",
    siteNotice: "DKWIN এ স্বাগতম! সর্বনিম্ন ডিপোজিট ৳৫০ এবং সর্বনিম্ন বেট ৳১।",
    isDepositAutoApprove: false,
  });

  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRecord[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [giftsList, setGiftsList] = useState<GiftCodeItem[]>([]);
  const [matchesList, setMatchesList] = useState<MatchItem[]>([]);
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: number; username: string; message: string; isSupport: boolean; createdAt: string }>
  >([]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // User balance edit modal state
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState<string>("");

  // New Gift Code form
  const [newGiftCode, setNewGiftCode] = useState<string>("");
  const [newGiftAmount, setNewGiftAmount] = useState<string>("100");
  const [newGiftMaxClaims, setNewGiftMaxClaims] = useState<string>("50");

  // New Sports Match form
  const [newMatchSport, setNewMatchSport] = useState<string>("cricket");
  const [newMatchTournament, setNewMatchTournament] = useState<string>("BPL / IPL Live");
  const [newMatchTeamA, setNewMatchTeamA] = useState<string>("");
  const [newMatchTeamB, setNewMatchTeamB] = useState<string>("");
  const [newMatchOddsA, setNewMatchOddsA] = useState<string>("1.85");
  const [newMatchOddsDraw, setNewMatchOddsDraw] = useState<string>("3.50");
  const [newMatchOddsB, setNewMatchOddsB] = useState<string>("1.95");
  const [newMatchScore, setNewMatchScore] = useState<string>("LIVE NOW");

  // Support reply input
  const [supportReplyText, setSupportReplyText] = useState<string>("");

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, settingsRes, depRes, witRes, usrRes, gftRes, chatRes, matchRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/settings"),
        fetch("/api/admin/deposits"),
        fetch("/api/admin/withdrawals"),
        fetch("/api/admin/users"),
        fetch("/api/admin/gifts"),
        fetch("/api/chat"),
        fetch("/api/games/sports/matches?sport=all"),
      ]);

      const [statsData, settingsData, depData, witData, usrData, gftData, chatData, matchData] = await Promise.all([
        statsRes.json(),
        settingsRes.json(),
        depRes.json(),
        witRes.json(),
        usrRes.json(),
        gftRes.json(),
        chatRes.json(),
        matchRes.json(),
      ]);

      if (statsData.stats) setStats(statsData.stats);
      if (settingsData.settings) setSettings((prev) => ({ ...prev, ...settingsData.settings }));
      if (depData.deposits) setDeposits(depData.deposits);
      if (witData.withdrawals) setWithdrawals(witData.withdrawals);
      if (usrData.users) setUsersList(usrData.users);
      if (gftData.gifts) setGiftsList(gftData.gifts);
      if (chatData.messages) setChatMessages(chatData.messages);
      if (matchData.matches) setMatchesList(matchData.matches);
    } catch (e) {
      console.error("Failed loading admin data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAuth = sessionStorage.getItem("dkwin_admin_auth");
      if (savedAuth === "1") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllAdminData();
      // Auto poll live WinGo bets every 4 seconds
      const timer = setInterval(() => {
        fetch("/api/admin/stats")
          .then((r) => r.json())
          .then((d) => {
            if (d.stats) setStats(d.stats);
          })
          .catch(() => {});
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, fetchAllAdminData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("dkwin_admin_auth", "1");
        }
      } else {
        setAuthError(data.error || "ভুল পিন কোড!");
      }
    } catch {
      setAuthError("সার্ভার কানেকশন ত্রুটি!");
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent, customOverride?: Partial<SiteSettingsData>) => {
    if (e) e.preventDefault();
    const payload = customOverride ? { ...settings, ...customOverride } : settings;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }));
        notify(data.message);
      } else {
        notify(data.error || "সেটিংস সেভ করা যায়নি");
      }
    } catch {
      notify("সেটিংস সেভ করতে ত্রুটি হয়েছে");
    }
  };

  const handleQuickWingoResult = async (resultKey: string) => {
    setSettings((prev) => ({ ...prev, nextWingoResult: resultKey }));
    await handleSaveSettings(undefined, { nextWingoResult: resultKey });
  };

  const handleQuickCrashSet = async (crashVal: number) => {
    setSettings((prev) => ({ ...prev, nextCrashPoint: crashVal }));
    await handleSaveSettings(undefined, { nextCrashPoint: crashVal });
  };

  const handleDepositAction = async (transactionId: number, action: "approve" | "reject") => {
    if (processingId === transactionId) return;
    setProcessingId(transactionId);
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, action }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message);
        await fetchAllAdminData();
      } else {
        notify(data.error || "অ্যাকশন ব্যর্থ হয়েছে");
      }
    } catch {
      notify("ত্রুটি ঘটেছে");
    } finally {
      setProcessingId(null);
    }
  };

  const handleWithdrawAction = async (transactionId: number, action: "approve" | "reject") => {
    if (processingId === transactionId) return;
    setProcessingId(transactionId);
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, action }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message);
        await fetchAllAdminData();
      } else {
        notify(data.error || "অ্যাকশন ব্যর্থ হয়েছে");
      }
    } catch {
      notify("ত্রুটি ঘটেছে");
    } finally {
      setProcessingId(null);
    }
  };

  const handleUserAction = async (userId: number, action: string, payload: Record<string, unknown> = {}) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message);
        setEditingUser(null);
        setBalanceAdjustment("");
        fetchAllAdminData();
      }
    } catch {
      notify("ইউজার আপডেট ব্যর্থ হয়েছে");
    }
  };

  const handleCreateGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGiftCode.trim()) return;
    try {
      const res = await fetch("/api/admin/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          code: newGiftCode,
          amount: parseFloat(newGiftAmount),
          maxClaims: parseInt(newGiftMaxClaims, 10),
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message);
        setNewGiftCode("");
        fetchAllAdminData();
      } else {
        notify(data.error || "গিফট কোড তৈরি ব্যর্থ");
      }
    } catch {
      notify("ত্রুটি ঘটেছে");
    }
  };

  const handleDeleteGift = async (id: number) => {
    try {
      const res = await fetch("/api/admin/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message);
        fetchAllAdminData();
      }
    } catch {}
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchTeamA.trim() || !newMatchTeamB.trim()) {
      notify("দুই দলের নাম দিন!");
      return;
    }
    try {
      const res = await fetch("/api/games/sports/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          sport: newMatchSport,
          tournament: newMatchTournament,
          teamA: newMatchTeamA,
          teamB: newMatchTeamB,
          oddsA: parseFloat(newMatchOddsA) || 1.85,
          oddsDraw: parseFloat(newMatchOddsDraw) || 3.5,
          oddsB: parseFloat(newMatchOddsB) || 1.95,
          score: newMatchScore || "LIVE NOW",
          status: "live",
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message);
        setNewMatchTeamA("");
        setNewMatchTeamB("");
        fetchAllAdminData();
      }
    } catch {
      notify("ম্যাচ যুক্ত করা যায়নি");
    }
  };

  const handleDeleteMatch = async (id: number) => {
    try {
      const res = await fetch("/api/games/sports/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message);
        fetchAllAdminData();
      }
    } catch {}
  };

  const handleSendSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportReplyText.trim()) return;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: supportReplyText,
          asAdmin: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSupportReplyText("");
        notify("সাপোর্ট রিপ্লাই পাঠানো হয়েছে!");
        fetchAllAdminData();
      }
    } catch {}
  };

  // ---------------- PIN LOGIN SCREEN ----------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto font-black shadow-lg shadow-amber-500/20">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white">DKWIN এডমিন প্যানেল</h1>
            <p className="text-xs text-slate-400">
              গেম রেজাল্ট, ডিপোজিট, উইথড্র এবং সাইট কন্ট্রোল করতে পিন দিন
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                এডমিন সিকিউরিটি পিন (ডিফল্ট: 123456)
              </label>
              <input
                type="password"
                placeholder="••••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-lg font-mono tracking-widest text-amber-400 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-300 text-center font-bold">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg transition"
            >
              এডমিন প্যানেলে প্রবেশ করুন
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-800">
            <Link href="/" className="text-xs text-slate-400 hover:text-amber-400 inline-flex items-center gap-1">
              <span>← মেইন গেমিং সাইটে ফিরে যান</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const liveWingo = stats?.wingoLive || {
    activePeriod: "-",
    remainingSeconds: 0,
    totalRoundBet: 0,
    big: 0,
    small: 0,
    green: 0,
    red: 0,
    violet: 0,
    numbers: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0 },
  };

  const overallWingo = stats?.wingoOverall || {
    totalWingoBet: 0,
    big: 0,
    small: 0,
    green: 0,
    red: 0,
    violet: 0,
    numbers: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0 },
  };

  // ---------------- MAIN ADMIN DASHBOARD ----------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/20 px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white flex items-center gap-2">
                <span>DKWIN মাস্টার কন্ট্রোল প্যানেল</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  LIVE CONTROL
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                WinGo বিগ/স্মল/নাম্বার কন্ট্রোল, ক্র্যাশ, ডিপোজিট, উইথড্র এবং স্পোর্টস ম্যানেজমেন্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllAdminData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
              <span>রিফ্রেশ</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>সাইট ভিউ</span>
            </Link>

            <button
              onClick={() => {
                sessionStorage.removeItem("dkwin_admin_auth");
                setIsAuthenticated(false);
              }}
              className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30"
              title="Logout Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-black animate-in fade-in slide-in-from-top-3">
          {toastMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5">
          {[
            { id: "overview", label: "লাইভ বেট ও ওভারভিউ", icon: TrendingUp },
            { id: "games", label: "WinGo ও ক্র্যাশ রেজাল্ট কন্ট্রোল", icon: Gamepad2 },
            { id: "deposits", label: `ডিপোজিট (${stats?.pendingDepositsCount || 0})`, icon: PlusCircle },
            { id: "withdrawals", label: `উত্তোলন (${stats?.pendingWithdrawalsCount || 0})`, icon: ArrowUpRight },
            { id: "numbers", label: "নাম্বার, নিয়ম ও রেফার সেটিংস", icon: Smartphone },
            { id: "sports", label: "ক্রিকেট ও স্পোর্টস ম্যাচ", icon: Trophy },
            { id: "users", label: `ইউজার (${stats?.totalUsers || 0})`, icon: Users },
            { id: "gifts", label: "গিফট কোড", icon: Ticket },
            { id: "chat", label: "সাপোর্ট চ্যাট", icon: Headphones },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  active
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 space-y-6">
        {/* ================= 1. OVERVIEW & LIVE WINGO BET MONITOR ================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">মোট ইউজার মোট বেট করেছে</span>
                <span className="text-2xl font-black text-amber-400 mt-1 block tabular-nums">
                  ৳{stats?.totalBetVolume?.toLocaleString() || 0}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  মোট নিবন্ধিত ইউজার: {stats?.totalUsers || 0} জন
                </span>
              </div>

              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">মোট অনুমোদিত ডিপোজিট</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block tabular-nums">
                  ৳{stats?.totalDeposits?.toLocaleString() || 0}
                </span>
                <span className="text-[11px] text-amber-400 font-bold mt-1 block">
                  পেন্ডিং ডিপোজিট: {stats?.pendingDepositsCount || 0} টি
                </span>
              </div>

              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">মোট অনুমোদিত উত্তোলন</span>
                <span className="text-2xl font-black text-amber-300 mt-1 block tabular-nums">
                  ৳{stats?.totalWithdrawals?.toLocaleString() || 0}
                </span>
                <span className="text-[11px] text-red-400 font-bold mt-1 block">
                  পেন্ডিং উত্তোলন: {stats?.pendingWithdrawalsCount || 0} টি
                </span>
              </div>

              <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">আপনার নেট লাভ (কমিশন সহ)</span>
                <span className="text-2xl font-black text-purple-400 mt-1 block tabular-nums">
                  ৳{stats?.houseProfit?.toLocaleString() || 0}
                </span>
                <span className="text-[11px] text-emerald-400 mt-1 block">
                  WinGo অটো ফি আয়: ৳{stats?.totalFeeEarned?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            {/* LIVE WINGO BET BREAKDOWN + INSTANT RESULT CONTROLLER */}
            <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 space-y-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-black text-white flex items-center gap-2">
                    <span>🎯 WinGo লাইভ বেট মনিটর ও রেজাল্ট কন্ট্রোলার</span>
                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                      LIVE ROUND
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    কোনটায় কত টাকা বেট পড়ছে তা নিচে দেখুন এবং এক ক্লিকে পরবর্তী রেজাল্ট (বিগ/স্মল/গ্রিন/নাম্বার) সেট করুন
                  </p>
                </div>
                <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-right">
                  <span className="text-[10px] text-slate-400 block">চলমান পিরিয়ড: {liveWingo.activePeriod}</span>
                  <span className="text-sm font-black text-amber-400 tabular-nums">
                    চলমান রাউন্ডে মোট বেট: ৳{liveWingo.totalRoundBet?.toFixed(2) || "0.00"} (বাকি {liveWingo.remainingSeconds}s)
                  </span>
                </div>
              </div>

              {/* Big / Small / Green / Red / Violet Live & Total Bet Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-3 text-center">
                  <span className="text-xs font-black text-amber-400 block">BIG (বিগ ৫-৯)</span>
                  <span className="text-lg font-black text-white tabular-nums block mt-0.5">
                    ৳{liveWingo.big.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">মোট: ৳{overallWingo.big.toFixed(0)}</span>
                </div>

                <div className="bg-slate-950 border border-sky-500/40 rounded-2xl p-3 text-center">
                  <span className="text-xs font-black text-sky-400 block">SMALL (স্মল ০-৪)</span>
                  <span className="text-lg font-black text-white tabular-nums block mt-0.5">
                    ৳{liveWingo.small.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">মোট: ৳{overallWingo.small.toFixed(0)}</span>
                </div>

                <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-3 text-center">
                  <span className="text-xs font-black text-emerald-400 block">GREEN (গ্রিন)</span>
                  <span className="text-lg font-black text-white tabular-nums block mt-0.5">
                    ৳{liveWingo.green.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">মোট: ৳{overallWingo.green.toFixed(0)}</span>
                </div>

                <div className="bg-slate-950 border border-rose-500/40 rounded-2xl p-3 text-center">
                  <span className="text-xs font-black text-rose-400 block">RED (রেড)</span>
                  <span className="text-lg font-black text-white tabular-nums block mt-0.5">
                    ৳{liveWingo.red.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">মোট: ৳{overallWingo.red.toFixed(0)}</span>
                </div>

                <div className="bg-slate-950 border border-purple-500/40 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
                  <span className="text-xs font-black text-purple-400 block">VIOLET (ভায়োলেট)</span>
                  <span className="text-lg font-black text-white tabular-nums block mt-0.5">
                    ৳{liveWingo.violet.toFixed(0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">মোট: ৳{overallWingo.violet.toFixed(0)}</span>
                </div>
              </div>

              {/* Numbers 0-9 Live Bets Breakdown */}
              <div>
                <h3 className="text-xs font-black text-slate-300 mb-2">
                  নাম্বার অনুযায়ী বেট হিসাব (০ থেকে ৯ পর্যন্ত কোন নাম্বারে কত বেট পড়েছে):
                </h3>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => {
                    const liveAmt = liveWingo.numbers?.[num] || 0;
                    const totalAmt = overallWingo.numbers?.[num] || 0;
                    return (
                      <div
                        key={num}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-center"
                      >
                        <span className="text-xs font-black text-amber-400 block">#{num}</span>
                        <span className="text-xs font-bold text-white tabular-nums block">৳{liveAmt}</span>
                        <span className="text-[9px] text-slate-500 block">মোট ৳{totalAmt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Direct Result Selection Buttons */}
              <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-white">
                    পরবর্তী WinGo রেজাল্ট কন্ট্রোল করুন (যা সিলেক্ট করবেন সেটাই রেজাল্ট আসবে):
                  </span>
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950">
                    বর্তমান মোড: {settings.nextWingoResult.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "auto", label: "🔄 অটো (হাউস সেফ)", cls: "bg-slate-800 text-white" },
                    { key: "big", label: "🟠 বিগ (Big 5-9)", cls: "bg-amber-500 text-slate-950" },
                    { key: "small", label: "🔵 স্মল (Small 0-4)", cls: "bg-sky-500 text-slate-950" },
                    { key: "green", label: "🟢 গ্রিন (Green)", cls: "bg-emerald-500 text-slate-950" },
                    { key: "red", label: "🔴 রেড (Red)", cls: "bg-rose-600 text-white" },
                    { key: "violet", label: "🟣 ভায়োলেট (0/5)", cls: "bg-purple-600 text-white" },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => handleQuickWingoResult(btn.key)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition transform active:scale-95 ${
                        settings.nextWingoResult === btn.key
                          ? "ring-2 ring-white scale-105 shadow-lg " + btn.cls
                          : "opacity-80 hover:opacity-100 " + btn.cls
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-2">
                    অথবা নির্দিষ্ট নাম্বার (০-৯) সিলেক্ট করুন:
                  </span>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleQuickWingoResult(num)}
                        className={`py-2 rounded-xl font-black text-xs border transition ${
                          settings.nextWingoResult === num
                            ? "bg-amber-400 text-slate-950 border-white ring-2 ring-amber-300"
                            : "bg-slate-900 border-slate-700 text-slate-200 hover:border-amber-400"
                        }`}
                      >
                        নাম্বার {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. GAME CONTROL TAB (WINGO FEE, CRASH, THIMBLE, SLOTS) ================= */}
        {activeTab === "games" && (
          <form onSubmit={(e) => handleSaveSettings(e)} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <Sliders className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-black text-white">
                  গেম রেজাল্ট, ক্র্যাশ মাল্টিপ্লায়ার ও অটো কমিশন কন্ট্রোল
                </h2>
                <p className="text-xs text-slate-400">
                  সবাইকে এভারেজ হার-জিত দেওয়ার জন্য এবং হাউস প্রফিট নিয়ন্ত্রণের জন্য এখান থেকে সব গেম কন্ট্রোল করুন
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* WinGo Fee % Control (1% - 3%+) */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black text-emerald-400">
                  ১. WinGo প্রতি বেটে অটো কমিশন কর্তন (১% - ৩% আপনার লাভ)
                </h3>
                <p className="text-[11px] text-slate-400">
                  ইউজার হারুক বা জিতুক, প্রতিটি WinGo বেট থেকে এই শতাংশ অটোমেটিক আপনার হাউস প্রফিটে কেটে রাখবে।
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setSettings({ ...settings, wingoFeePercent: pct })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black border ${
                        Number(settings.wingoFeePercent) === pct
                          ? "bg-emerald-500 text-slate-950 border-emerald-300"
                          : "bg-slate-900 border-slate-800 text-slate-300"
                      }`}
                    >
                      {pct}% ফি
                    </button>
                  ))}
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={settings.wingoFeePercent}
                    onChange={(e) => setSettings({ ...settings, wingoFeePercent: Number(e.target.value) })}
                    className="w-24 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-black text-amber-400"
                  />
                </div>
              </div>

              {/* Crash / Aviator / JetX Controller */}
              <div className="bg-slate-950 border border-rose-500/30 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black text-rose-400">
                  ২. ক্র্যাশ প্লেন গেম কন্ট্রোল (Aviator, JetX, SpaceXY, Cricket X)
                </h3>
                <p className="text-[11px] text-slate-400">
                  পরবর্তী রাউন্ডে প্লেন কত মাল্টিপ্লায়ারে ক্র্যাশ করবে তা নির্দিষ্ট করে দিন (0 দিলে অটো চলবে)।
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { val: 0, label: "অটো (Auto)" },
                    { val: 1.0, label: "1.00x (সাথে সাথে ক্র্যাশ)" },
                    { val: 1.15, label: "1.15x" },
                    { val: 1.85, label: "1.85x" },
                    { val: 3.5, label: "3.50x" },
                    { val: 10.0, label: "10.00x" },
                  ].map((c) => (
                    <button
                      key={c.val}
                      type="button"
                      onClick={() => handleQuickCrashSet(c.val)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black border ${
                        Number(settings.nextCrashPoint) === c.val
                          ? "bg-rose-600 text-white border-white"
                          : "bg-slate-900 border-slate-800 text-slate-300"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">পরবর্তী ফোর্সড ক্র্যাশ (0 = Auto)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.nextCrashPoint}
                      onChange={(e) => setSettings({ ...settings, nextCrashPoint: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">সর্বোচ্চ ক্র্যাশ লিমিট (Max Cap)</label>
                    <input
                      type="number"
                      step="1"
                      value={settings.crashMaxMultiplier}
                      onChange={(e) => setSettings({ ...settings, crashMaxMultiplier: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Thimble Win Rate Control */}
              <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <h3 className="text-xs font-black text-amber-400">৩. থিম্বল (Thimble) গেম জয়ের হার (%)</h3>
                  <span className="text-xs font-black text-white">{settings.thimbleWinRate}%</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  সবাইকে এভারেজ হার-জিত দেওয়ার জন্য জয়ের শতাংশ সেট করুন (যেমন: 35% - 45%)।
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.thimbleWinRate}
                  onChange={(e) => setSettings({ ...settings, thimbleWinRate: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* JILI / PG Slots Win Rate Control */}
              <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <h3 className="text-xs font-black text-purple-400">৪. JILI ও স্লট গেম এভারেজ জয়ের হার (%)</h3>
                  <span className="text-xs font-black text-white">{settings.slotWinRate}%</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  JILI Super Ace, Golden Empire, Money Coming সহ সব স্লট গেমের উইন রেট নিয়ন্ত্রণ করুন।
                </p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.slotWinRate}
                  onChange={(e) => setSettings({ ...settings, slotWinRate: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>সব গেম কন্ট্রোল সেটিংস সেভ করুন</span>
            </button>
          </form>
        )}

        {/* ================= 3. PAYMENT NUMBERS, RULES, REFERRAL & TELEGRAM ================= */}
        {activeTab === "numbers" && (
          <form
            onSubmit={(e) => handleSaveSettings(e)}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <Settings className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-black text-white">
                  পেমেন্ট নাম্বার (ক্যাশ আউট / সেন্ড মানি), ডিপোজিট নিয়ম, রেফার ও টেলিগ্রাম কন্ট্রোল
                </h2>
                <p className="text-xs text-slate-400">
                  এখান থেকে বিকাশ/নগদ/রকেট নাম্বার, ক্যাশ আউট নাকি সেন্ড মানি, পেন্ডিং মেসেজ ও রেফার কমিশন পরিবর্তন করুন
                </p>
              </div>
            </div>

            {/* Payment Numbers + Send Money / Cash Out Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* bKash */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-pink-400 block">বিকাশ (bKash) নাম্বার ও নিয়ম</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.bkashNumber}
                    onChange={(e) => setSettings({ ...settings, bkashNumber: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-white"
                  />
                  <select
                    value={settings.bkashType}
                    onChange={(e) => setSettings({ ...settings, bkashType: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs font-bold text-amber-300"
                  >
                    <option value="সেন্ড মানি (Send Money)">সেন্ড মানি (Send Money)</option>
                    <option value="ক্যাশ আউট (Cash Out)">ক্যাশ আউট (Cash Out)</option>
                    <option value="পেমেন্ট (Payment)">পেমেন্ট (Payment)</option>
                  </select>
                </div>
              </div>

              {/* Nagad */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-orange-400 block">নগদ (Nagad) নাম্বার ও নিয়ম</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.nagadNumber}
                    onChange={(e) => setSettings({ ...settings, nagadNumber: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-white"
                  />
                  <select
                    value={settings.nagadType}
                    onChange={(e) => setSettings({ ...settings, nagadType: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs font-bold text-amber-300"
                  >
                    <option value="সেন্ড মানি (Send Money)">সেন্ড মানি (Send Money)</option>
                    <option value="ক্যাশ আউট (Cash Out)">ক্যাশ আউট (Cash Out)</option>
                    <option value="পেমেন্ট (Payment)">পেমেন্ট (Payment)</option>
                  </select>
                </div>
              </div>

              {/* Rocket */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-purple-400 block">রকেট (Rocket) নাম্বার ও নিয়ম</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.rocketNumber}
                    onChange={(e) => setSettings({ ...settings, rocketNumber: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-white"
                  />
                  <select
                    value={settings.rocketType}
                    onChange={(e) => setSettings({ ...settings, rocketType: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs font-bold text-amber-300"
                  >
                    <option value="ক্যাশ আউট (Cash Out)">ক্যাশ আউট (Cash Out)</option>
                    <option value="সেন্ড মানি (Send Money)">সেন্ড মানি (Send Money)</option>
                  </select>
                </div>
              </div>

              {/* Upay */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-blue-400 block">উপায় (Upay) নাম্বার ও নিয়ম</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.upayNumber}
                    onChange={(e) => setSettings({ ...settings, upayNumber: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-white"
                  />
                  <select
                    value={settings.upayType}
                    onChange={(e) => setSettings({ ...settings, upayType: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-xs font-bold text-amber-300"
                  >
                    <option value="সেন্ড মানি (Send Money)">সেন্ড মানি (Send Money)</option>
                    <option value="ক্যাশ আউট (Cash Out)">ক্যাশ আউট (Cash Out)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Limits & Referral Commission */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">সর্বনিম্ন ডিপোজিট (৳)</label>
                <input
                  type="number"
                  value={settings.minDeposit}
                  onChange={(e) => setSettings({ ...settings, minDeposit: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">সর্বনিম্ন উত্তোলন (৳)</label>
                <input
                  type="number"
                  value={settings.minWithdraw}
                  onChange={(e) => setSettings({ ...settings, minWithdraw: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-400 block mb-1">রেফার ডিপোজিট কমিশন (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.referralCommissionPercent}
                  onChange={(e) => setSettings({ ...settings, referralCommissionPercent: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-400 block mb-1">নতুন রেফার ফিক্সড বোনাস (৳)</label>
                <input
                  type="number"
                  value={settings.referralBonusAmount}
                  onChange={(e) => setSettings({ ...settings, referralBonusAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>
            </div>

            {/* Telegram Support Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs font-bold text-sky-400 block mb-1">
                  সাপোর্ট টেলিগ্রাম ইউজারনেম (চ্যাটে দেখাবে)
                </label>
                <input
                  type="text"
                  value={settings.telegramUsername}
                  onChange={(e) => setSettings({ ...settings, telegramUsername: e.target.value })}
                  placeholder="@DKWIN_Official_Support"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-sky-400 block mb-1">টেলিগ্রাম ডিরেক্ট লিংক</label>
                <input
                  type="text"
                  value={settings.telegramChannel}
                  onChange={(e) => setSettings({ ...settings, telegramChannel: e.target.value })}
                  placeholder="https://t.me/DKWIN_Official_Support"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-400 block mb-1">এডমিন লগইন পিন (PIN)</label>
                <input
                  type="text"
                  value={settings.adminPin}
                  onChange={(e) => setSettings({ ...settings, adminPin: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-amber-400"
                />
              </div>
            </div>

            {/* Editable Deposit Rules & Pending 2-10 Minute Notice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs font-bold text-amber-300 block mb-1">
                  ডিপোজিট করার নিয়মাবলী (ডিপোজিট বক্সে দেখাবে)
                </label>
                <textarea
                  rows={4}
                  value={settings.depositRules}
                  onChange={(e) => setSettings({ ...settings, depositRules: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-300 block mb-1">
                  ডিপোজিট ও উইথড্র পেন্ডিং সময় মেসেজ (২ থেকে ১০ মিনিট নোটিশ)
                </label>
                <textarea
                  rows={4}
                  value={settings.pendingNotice}
                  onChange={(e) => setSettings({ ...settings, pendingNotice: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white leading-relaxed"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition"
            >
              <Save className="w-4 h-4" />
              <span>সব পেমেন্ট ও নিয়ম সেটিংস সেভ করুন</span>
            </button>
          </form>
        )}

        {/* ================= 4. DEPOSITS APPROVAL TAB ================= */}
        {activeTab === "deposits" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">ডিপোজিট রিকোয়েস্ট তালিকা</h2>
                <p className="text-xs text-slate-400">
                  ইউজারের পাঠানো TrxID ও নাম্বার চেক করে Approve করলে ইউজারের একাউন্টে ব্যালেন্স যোগ হবে
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400">মোট: {deposits.length} টি</span>
            </div>

            {deposits.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">কোনো ডিপোজিট রিকোয়েস্ট নেই</div>
            ) : (
              <div className="space-y-2.5">
                {deposits.map((d) => (
                  <div
                    key={d.id}
                    className={`bg-slate-950 border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 ${
                      d.status === "pending" ? "border-amber-500/50" : "border-slate-800"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-emerald-400">৳{d.amount.toLocaleString()}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-amber-300 uppercase">
                          {d.method}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            d.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : d.status === "rejected"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500 text-slate-950"
                          }`}
                        >
                          {d.status === "pending" ? "PENDING (পেন্ডিং)" : d.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        ইউজার: <strong className="text-white">{d.username}</strong> ({d.phone}) · প্রেরক:{" "}
                        <span className="text-amber-300 font-mono">{d.accountNumber || d.phone}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        TrxID: <span className="font-mono font-black text-amber-400 select-all">{d.trxId || "N/A"}</span> ·{" "}
                        {d.note}
                      </div>
                    </div>

                    {d.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={processingId === d.id}
                          onClick={() => handleDepositAction(d.id, "approve")}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve (ব্যালেন্স দিন)</span>
                        </button>
                        <button
                          disabled={processingId === d.id}
                          onClick={() => handleDepositAction(d.id, "reject")}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500">
                        {d.status === "completed" ? "✓ ইতিমধ্যে অনুমোদিত" : "✕ বাতিল করা হয়েছে"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= 5. WITHDRAWALS APPROVAL TAB (BUG FIXED) ================= */}
        {activeTab === "withdrawals" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">উত্তোলন (Withdraw) রিকোয়েস্ট তালিকা</h2>
                <p className="text-xs text-slate-400">
                  উত্তোলনের আবেদন করার সময়ই ইউজারের ব্যালেন্স কেটে নেওয়া হয়েছে। একবার কমপ্লিট বা রিজেক্ট করলে তা লক হয়ে যাবে।
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400">মোট: {withdrawals.length} টি</span>
            </div>

            {withdrawals.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">কোনো উত্তোলন রিকোয়েস্ট নেই</div>
            ) : (
              <div className="space-y-2.5">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className={`bg-slate-950 border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 ${
                      w.status === "pending" ? "border-amber-500/50" : "border-slate-800"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-amber-400">৳{w.amount.toLocaleString()}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-white uppercase">
                          {w.method}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            w.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : w.status === "rejected"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500 text-slate-950"
                          }`}
                        >
                          {w.status === "pending" ? "PENDING (পেন্ডিং)" : w.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        ইউজার: <strong className="text-white">{w.username}</strong> ({w.phone}) · বর্তমান ব্যালেন্স: ৳
                        {w.userBalance.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-400">
                        পাঠানোর নাম্বার:{" "}
                        <span className="font-mono font-black text-emerald-400 select-all">{w.accountNumber}</span>
                      </div>
                    </div>

                    {w.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={processingId === w.id}
                          onClick={() => handleWithdrawAction(w.id, "approve")}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Complete (পেমেন্ট সম্পন্ন)</span>
                        </button>
                        <button
                          disabled={processingId === w.id}
                          onClick={() => handleWithdrawAction(w.id, "reject")}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject & Refund</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500">
                        {w.status === "completed" ? "✓ পেমেন্ট কমপ্লিট (লকড)" : "✕ বাতিল ও রিফান্ড সম্পন্ন"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= 6. SPORTS & CRICKET MATCH MANAGER (1xBet Style) ================= */}
        {activeTab === "sports" && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateMatch}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4"
            >
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>নতুন ক্রিকেট / ফুটবল ম্যাচ যুক্ত করুন (1xBet Multi-Bet Sportsbook)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">খেলা (Sport)</label>
                  <select
                    value={newMatchSport}
                    onChange={(e) => setNewMatchSport(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white"
                  >
                    <option value="cricket">🏏 ক্রিকেট (Cricket)</option>
                    <option value="football">⚽ ফুটবল (Football)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">টুর্নামেন্টের নাম</label>
                  <input
                    type="text"
                    placeholder="যেমন: BPL T20 / IPL / World Cup"
                    value={newMatchTournament}
                    onChange={(e) => setNewMatchTournament(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">টিম ১ (Team A)</label>
                  <input
                    type="text"
                    placeholder="যেমন: Comilla Victorians"
                    value={newMatchTeamA}
                    onChange={(e) => setNewMatchTeamA(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">টিম ২ (Team B)</label>
                  <input
                    type="text"
                    placeholder="যেমন: Rangpur Riders"
                    value={newMatchTeamB}
                    onChange={(e) => setNewMatchTeamB(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Team A Odds (W1)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMatchOddsA}
                    onChange={(e) => setNewMatchOddsA(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Draw / Tie Odds (X)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMatchOddsDraw}
                    onChange={(e) => setNewMatchOddsDraw(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Team B Odds (W2)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMatchOddsB}
                    onChange={(e) => setNewMatchOddsB(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">লাইভ স্কোর / স্ট্যাটাস</label>
                  <input
                    type="text"
                    placeholder="BAN 145/3 (16.2 Ov)"
                    value={newMatchScore}
                    onChange={(e) => setNewMatchScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-lg"
              >
                + নতুন ম্যাচ যুক্ত করুন
              </button>
            </form>

            {/* Existing Matches List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-sm font-black text-white">চলমান ও আপকামিং ম্যাচ তালিকা ({matchesList.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchesList.map((m) => (
                  <div
                    key={m.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        {m.sport} · {m.tournament}
                      </span>
                      <div className="text-xs font-black text-white mt-0.5">
                        {m.teamA} vs {m.teamB}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{m.score}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Odds: W1 ({m.oddsA}) | X ({m.oddsDraw}) | W2 ({m.oddsB})
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMatch(m.id)}
                      className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/30"
                      title="Delete Match"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= 7. USERS MANAGEMENT TAB ================= */}
        {activeTab === "users" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h2 className="text-base font-black text-white">ইউজার এবং ব্যালেন্স কন্ট্রোল ({usersList.length} জন)</h2>

            {editingUser && (
              <div className="bg-slate-950 border-2 border-amber-500 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-400 block">
                    ব্যালেন্স পরিবর্তন: {editingUser.username} ({editingUser.phone})
                  </span>
                  <span className="text-xs text-slate-400">বর্তমান ব্যালেন্স: ৳{editingUser.balance.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="টাকার পরিমাণ দিন"
                    value={balanceAdjustment}
                    onChange={(e) => setBalanceAdjustment(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white w-36"
                  />
                  <button
                    onClick={() =>
                      handleUserAction(editingUser.id, "add_balance", { amount: parseFloat(balanceAdjustment) })
                    }
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black"
                  >
                    + যোগ করুন
                  </button>
                  <button
                    onClick={() =>
                      handleUserAction(editingUser.id, "set_balance", { amount: parseFloat(balanceAdjustment) })
                    }
                    className="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black"
                  >
                    সেট করুন
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs"
                  >
                    বাতিল
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">ইউজার</th>
                    <th className="py-2.5 px-3">মোবাইল</th>
                    <th className="py-2.5 px-3">ব্যালেন্স</th>
                    <th className="py-2.5 px-3">মোট ডিপোজিট</th>
                    <th className="py-2.5 px-3">মোট বেট</th>
                    <th className="py-2.5 px-3">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-950/60">
                      <td className="py-2.5 px-3 font-bold text-white">
                        {u.username} {u.isDemo && <span className="text-[10px] text-amber-400">(Demo)</span>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{u.phone}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-400">৳{u.balance.toFixed(2)}</td>
                      <td className="py-2.5 px-3">৳{(u.totalDeposited || 0).toFixed(0)}</td>
                      <td className="py-2.5 px-3 text-amber-300 font-bold">৳{(u.totalBetAmount || 0).toFixed(0)}</td>
                      <td className="py-2.5 px-3 flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setBalanceAdjustment(String(u.balance));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px]"
                        >
                          ব্যালেন্স এডিট
                        </button>
                        <button
                          onClick={() => handleUserAction(u.id, "toggle_ban")}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                            u.isBanned ? "bg-emerald-600 text-white" : "bg-red-950 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {u.isBanned ? "আনব্যান" : "ব্যান"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 8. GIFT CODES TAB ================= */}
        {activeTab === "gifts" && (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateGift}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-wrap items-end gap-3"
            >
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">গিফট কোড নাম</label>
                <input
                  type="text"
                  placeholder="DKWIN500"
                  value={newGiftCode}
                  onChange={(e) => setNewGiftCode(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono uppercase text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">বোনাস পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={newGiftAmount}
                  onChange={(e) => setNewGiftAmount(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white w-28"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">সর্বোচ্চ কতজন পাবে</label>
                <input
                  type="number"
                  value={newGiftMaxClaims}
                  onChange={(e) => setNewGiftMaxClaims(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white w-28"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs"
              >
                + নতুন কোড তৈরি করুন
              </button>
            </form>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2.5">
              <h3 className="text-sm font-black text-white">সক্রিয় গিফট কোড তালিকা</h3>
              {giftsList.map((g) => (
                <div
                  key={g.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-black text-sm text-amber-400">{g.code}</span>
                    <span className="text-xs text-emerald-400 font-bold ml-3">৳{g.amount}</span>
                    <span className="text-xs text-slate-400 ml-3">
                      ক্লেইম হয়েছে: {g.claimsCount} / {g.maxClaims}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteGift(g.id)}
                    className="px-3 py-1 rounded-lg bg-red-950/60 text-red-300 text-xs font-bold"
                  >
                    ডিলিট
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= 9. LIVE SUPPORT CHAT TAB ================= */}
        {activeTab === "chat" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">ইউজার সাপোর্ট চ্যাট ও টেলিগ্রাম কন্ট্রোল</h2>
                <p className="text-xs text-slate-400">
                  বর্তমান টেলিগ্রাম ইউজারনেম: <span className="text-sky-400 font-mono">{settings.telegramUsername}</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 h-80 overflow-y-auto space-y-2.5">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl text-xs ${
                    m.isSupport
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-200 ml-8"
                      : "bg-slate-900 border border-slate-800 text-slate-200 mr-8"
                  }`}
                >
                  <div className="font-black text-[10px] text-slate-400 mb-0.5">{m.username}</div>
                  <div>{m.message}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendSupportReply} className="flex gap-2">
              <input
                type="text"
                placeholder="এডমিন সাপোর্ট হিসেবে রিপ্লাই লিখুন..."
                value={supportReplyText}
                onChange={(e) => setSupportReplyText(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-black text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>পাঠান</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
