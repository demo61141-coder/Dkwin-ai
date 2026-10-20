"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

// Header & Navigation
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

// Tabs
import HomeTab from "@/components/tabs/HomeTab";
import ActivityTab from "@/components/tabs/ActivityTab";
import WalletTab from "@/components/tabs/WalletTab";
import PromotionTab from "@/components/tabs/PromotionTab";
import MineTab from "@/components/tabs/MineTab";

// Games
import WingoGame from "@/components/games/WingoGame";
import AviatorGame from "@/components/games/AviatorGame";
import SlotsGame from "@/components/games/SlotsGame";
import LiveCasinoGame from "@/components/games/LiveCasinoGame";
import MinesGame from "@/components/games/MinesGame";
import DiceGame from "@/components/games/DiceGame";
import ThimbleGame from "@/components/games/ThimbleGame";
import SportsGame from "@/components/games/SportsGame";

// Modals (No App Download Modal per user request)
import AuthModal from "@/components/modals/AuthModal";
import DepositModal from "@/components/modals/DepositModal";
import WithdrawModal from "@/components/modals/WithdrawModal";
import CheckInModal from "@/components/modals/CheckInModal";
import SpinWheelModal from "@/components/modals/SpinWheelModal";
import GiftCodeModal from "@/components/modals/GiftCodeModal";
import LiveChatModal from "@/components/modals/LiveChatModal";

export default function MainPage() {
  const { activeTab, activeGame, toast } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Main Container Shell */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col">
        {!activeGame && <Header />}

        <main className="flex-1 px-1">
          {/* Active Game Launcher */}
          {activeGame === "wingo" && <WingoGame />}
          {activeGame === "aviator" && <AviatorGame />}
          {activeGame === "slots" && <SlotsGame />}
          {(activeGame === "dragon_tiger" || activeGame === "roulette") && <LiveCasinoGame />}
          {activeGame === "mines" && <MinesGame />}
          {activeGame === "dice" && <DiceGame />}
          {activeGame === "thimble" && <ThimbleGame />}
          {activeGame === "sports" && <SportsGame />}

          {/* Active Tab Router */}
          {!activeGame && (
            <>
              {activeTab === "home" && <HomeTab />}
              {activeTab === "activity" && <ActivityTab />}
              {activeTab === "wallet" && <WalletTab />}
              {activeTab === "promotion" && <PromotionTab />}
              {activeTab === "mine" && <MineTab />}
            </>
          )}
        </main>

        <BottomNav />
      </div>

      {/* Global Modals */}
      <AuthModal />
      <DepositModal />
      <WithdrawModal />
      <CheckInModal />
      <SpinWheelModal />
      <GiftCodeModal />
      <LiveChatModal />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 max-w-xs w-full px-3">
          <div
            className={`p-3 rounded-2xl shadow-2xl text-xs font-bold text-center border backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : toast.type === "error"
                ? "bg-red-950/90 border-red-500/50 text-red-200"
                : "bg-slate-900/90 border-amber-500/50 text-amber-200"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
