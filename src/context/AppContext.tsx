"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, Language } from "@/lib/translations";
import { soundManager } from "@/lib/audio";
import confetti from "canvas-confetti";

export interface UserProfile {
  id: number;
  username: string;
  phone: string;
  balance: number;
  bonusBalance: number;
  commissionBalance: number;
  vipLevel: number;
  vipExp: number;
  inviteCode: string;
  referredBy?: string | null;
  avatar?: string;
  isDemo?: boolean;
  totalDeposited?: number;
  totalWithdrawn?: number;
  totalBetAmount?: number;
  totalWinAmount?: number;
  checkInStreak?: number;
  lastCheckInDate?: string;
  lastSpinDate?: string;
}

export type TabType = "home" | "activity" | "wallet" | "promotion" | "mine";
export type GameType =
  | "wingo"
  | "aviator"
  | "slots"
  | "dragon_tiger"
  | "mines"
  | "dice"
  | "thimble"
  | "sports"
  | "roulette"
  | null;

interface AppContextType {
  user: UserProfile | null;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.bn;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  activeGame: GameType;
  setActiveGame: (game: GameType) => void;
  selectedSlotId: string;
  setSelectedSlotId: (id: string) => void;
  selectedCrashId: string;
  setSelectedCrashId: (id: string) => void;
  // Modals
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: "login" | "register";
  setAuthModalMode: (mode: "login" | "register") => void;
  depositModalOpen: boolean;
  setDepositModalOpen: (open: boolean) => void;
  withdrawModalOpen: boolean;
  setWithdrawModalOpen: (open: boolean) => void;
  checkInModalOpen: boolean;
  setCheckInModalOpen: (open: boolean) => void;
  spinModalOpen: boolean;
  setSpinModalOpen: (open: boolean) => void;
  giftModalOpen: boolean;
  setGiftModalOpen: (open: boolean) => void;
  chatModalOpen: boolean;
  setChatModalOpen: (open: boolean) => void;
  appDownloadModalOpen: boolean;
  setAppDownloadModalOpen: (open: boolean) => void;
  // Helpers
  refreshUser: () => Promise<void>;
  fireConfetti: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  toast: { message: string; type: "success" | "error" | "info" } | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [lang, setLangState] = useState<Language>("bn");
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("super_ace");
  const [selectedCrashId, setSelectedCrashId] = useState<string>("aviator");

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [spinModalOpen, setSpinModalOpen] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [appDownloadModalOpen, setAppDownloadModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  const fireConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#EF4444", "#10B981", "#8B5CF6", "#3B82F6"],
      });
    } catch {}
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("bdwin_lang", l);
    }
  };

  const setSoundEnabled = (v: boolean) => {
    setSoundEnabledState(v);
    soundManager.enabled = v;
    if (typeof window !== "undefined") {
      localStorage.setItem("bdwin_sound", v ? "1" : "0");
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.error("Refresh user failed", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("bdwin_lang") as Language;
      if (savedLang === "bn" || savedLang === "en") {
        setLangState(savedLang);
      }
      const savedSound = localStorage.getItem("bdwin_sound");
      if (savedSound !== null) {
        const en = savedSound === "1";
        setSoundEnabledState(en);
        soundManager.enabled = en;
      }
    }

    refreshUser();
  }, [refreshUser]);

  const t = translations[lang];

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        lang,
        setLang,
        t,
        soundEnabled,
        setSoundEnabled,
        activeTab,
        setActiveTab,
        activeGame,
        setActiveGame,
        selectedSlotId,
        setSelectedSlotId,
        selectedCrashId,
        setSelectedCrashId,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        depositModalOpen,
        setDepositModalOpen,
        withdrawModalOpen,
        setWithdrawModalOpen,
        checkInModalOpen,
        setCheckInModalOpen,
        spinModalOpen,
        setSpinModalOpen,
        giftModalOpen,
        setGiftModalOpen,
        chatModalOpen,
        setChatModalOpen,
        appDownloadModalOpen,
        setAppDownloadModalOpen,
        refreshUser,
        fireConfetti,
        showToast,
        toast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
