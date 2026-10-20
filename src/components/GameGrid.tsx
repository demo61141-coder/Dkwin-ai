"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import { CategoryKey } from "./CategoryNav";
import { Play, Users } from "lucide-react";

interface GameGridProps {
  selectedCategory: CategoryKey;
}

export default function GameGrid({ selectedCategory }: GameGridProps) {
  const { setActiveGame, setSelectedSlotId, setSelectedCrashId } = useApp();

  const games = [
    // WIN GO & LOTTERY
    {
      id: "wingo_1m",
      title: "Win Go কালার লটারী",
      provider: "DKWIN ORIGINAL",
      category: "lottery",
      subtitle: "বিগ/স্মল, গ্রিন/রেড ও নাম্বার (বেট ৳১+)",
      badge: "HOT #1",
      badgeColor: "bg-red-600",
      players: "18,420",
      gradient: "from-emerald-600 via-teal-700 to-slate-900",
      icon: "🎯",
      action: () => setActiveGame("wingo"),
    },
    // 4 CRASH PLANE GAMES (SPRIBE / SMARTSOFT / BGAMING)
    {
      id: "aviator_spribe",
      title: "Aviator Spribe",
      provider: "SPRIBE",
      category: "aviator",
      subtitle: "ক্লাসিক লাল বিমান ক্র্যাশ গেম ১০০x",
      badge: "SPRIBE",
      badgeColor: "bg-rose-600",
      players: "24,850",
      gradient: "from-rose-600 via-red-800 to-slate-950",
      icon: "✈️",
      action: () => {
        setSelectedCrashId("aviator");
        setActiveGame("aviator");
      },
    },
    {
      id: "jetx_crash",
      title: "JetX Fighter Crash",
      provider: "SMARTSOFT",
      category: "aviator",
      subtitle: "সুপারসনিক ফাইটার জেট ক্র্যাশ প্লেন",
      badge: "JETX",
      badgeColor: "bg-sky-600",
      players: "15,320",
      gradient: "from-sky-600 via-blue-800 to-slate-950",
      icon: "🛩️",
      action: () => {
        setSelectedCrashId("jetx");
        setActiveGame("aviator");
      },
    },
    {
      id: "spacexy_crash",
      title: "SpaceXY Rocket",
      provider: "BGAMING",
      category: "aviator",
      subtitle: "গ্যালাক্সি স্পেস রকেট মাল্টিপ্লায়ার",
      badge: "NEW CRASH",
      badgeColor: "bg-purple-600",
      players: "11,940",
      gradient: "from-purple-600 via-indigo-900 to-slate-950",
      icon: "🚀",
      action: () => {
        setSelectedCrashId("spacexy");
        setActiveGame("aviator");
      },
    },
    {
      id: "cricket_crash",
      title: "Crash Cricket X",
      provider: "JILI CRASH",
      category: "aviator",
      subtitle: "ছক্কা বল বাউন্ডারি ক্র্যাশ মাল্টিপ্লায়ার",
      badge: "BD SPECIAL",
      badgeColor: "bg-emerald-600",
      players: "13,200",
      gradient: "from-emerald-600 via-green-800 to-slate-950",
      icon: "🏏",
      action: () => {
        setSelectedCrashId("cricket_crash");
        setActiveGame("aviator");
      },
    },
    // THIMBLE & FAST MINI GAMES
    {
      id: "thimble_game",
      title: "Thimbles (থিম্বল)",
      provider: "1X GAMES",
      category: "mini",
      subtitle: "৩ কাপের নিচে বল খুঁজুন ও ২.৮৮x জিতুন",
      badge: "POPULAR",
      badgeColor: "bg-amber-600",
      players: "16,740",
      gradient: "from-amber-600 via-yellow-800 to-slate-950",
      icon: "🥃",
      action: () => setActiveGame("thimble"),
    },
    {
      id: "mines",
      title: "Mines Spribe",
      provider: "SPRIBE",
      category: "mini",
      subtitle: "৫x৫ গ্রিড ডায়মন্ড ও বম্ব ক্যাশআউট",
      badge: "SPRIBE",
      badgeColor: "bg-teal-600",
      players: "16,100",
      gradient: "from-cyan-700 via-teal-800 to-slate-950",
      icon: "💣",
      action: () => setActiveGame("mines"),
    },
    {
      id: "dice",
      title: "Dice Hi-Lo Spribe",
      provider: "SPRIBE",
      category: "mini",
      subtitle: "ডাইস ওভার/আন্ডার ইনস্ট্যান্ট পেআউট",
      badge: "INSTANT",
      badgeColor: "bg-indigo-600",
      players: "8,300",
      gradient: "from-indigo-700 via-purple-900 to-slate-950",
      icon: "🎲",
      action: () => setActiveGame("dice"),
    },
    // JILI & PG SOFT SLOTS
    {
      id: "super_ace",
      title: "Super Ace",
      provider: "JILI",
      category: "slots",
      subtitle: "জিলি গোল্ডেন কার্ড কম্বো স্লট",
      badge: "JILI #1",
      badgeColor: "bg-blue-600",
      players: "21,910",
      gradient: "from-blue-700 via-indigo-900 to-slate-950",
      icon: "🃏",
      action: () => {
        setSelectedSlotId("super_ace");
        setActiveGame("slots");
      },
    },
    {
      id: "golden_empire",
      title: "Golden Empire",
      provider: "JILI",
      category: "slots",
      subtitle: "জিলি গোল্ডেন এম্পায়ার মেগাওয়েজ",
      badge: "JILI HOT",
      badgeColor: "bg-amber-600",
      players: "14,250",
      gradient: "from-yellow-600 via-amber-800 to-slate-950",
      icon: "🏛️",
      action: () => {
        setSelectedSlotId("golden_empire");
        setActiveGame("slots");
      },
    },
    {
      id: "boxing_king",
      title: "Boxing King",
      provider: "JILI",
      category: "slots",
      subtitle: "জিলি বক্সিং চ্যাম্পিয়ন ফ্রি স্পিন",
      badge: "JILI",
      badgeColor: "bg-red-600",
      players: "12,480",
      gradient: "from-red-700 via-rose-900 to-slate-950",
      icon: "🥊",
      action: () => {
        setSelectedSlotId("boxing_king");
        setActiveGame("slots");
      },
    },
    {
      id: "money_coming",
      title: "Money Coming",
      provider: "JILI",
      category: "slots",
      subtitle: "জিলি মানি হুইল ১০০০x জ্যাকপট",
      badge: "JILI",
      badgeColor: "bg-emerald-600",
      players: "15,890",
      gradient: "from-emerald-600 via-teal-900 to-slate-950",
      icon: "💵",
      action: () => {
        setSelectedSlotId("money_coming");
        setActiveGame("slots");
      },
    },
    {
      id: "fortune_gems",
      title: "Fortune Gems 2",
      provider: "JILI",
      category: "slots",
      subtitle: "জিলি ফরচুন জেমস মাল্টিপ্লায়ার রিল",
      badge: "JILI",
      badgeColor: "bg-purple-600",
      players: "10,640",
      gradient: "from-fuchsia-700 via-purple-900 to-slate-950",
      icon: "💎",
      action: () => {
        setSelectedSlotId("fortune_gems");
        setActiveGame("slots");
      },
    },
    {
      id: "crazy_777",
      title: "Crazy 777",
      provider: "JILI",
      category: "slots",
      subtitle: "জিলি ট্রিপল সেভেন রিস্পিন স্লট",
      badge: "JILI",
      badgeColor: "bg-orange-600",
      players: "9,120",
      gradient: "from-red-600 via-orange-800 to-slate-950",
      icon: "7️⃣",
      action: () => {
        setSelectedSlotId("crazy_777");
        setActiveGame("slots");
      },
    },
    {
      id: "fortune_tiger",
      title: "Fortune Tiger",
      provider: "PG SOFT",
      category: "slots",
      subtitle: "পিজি স্লট - গোল্ডেন টাইগার ২৫০০x",
      badge: "PG SOFT",
      badgeColor: "bg-amber-600",
      players: "13,840",
      gradient: "from-amber-600 via-orange-700 to-slate-950",
      icon: "🐯",
      action: () => {
        setSelectedSlotId("fortune_tiger");
        setActiveGame("slots");
      },
    },
    {
      id: "wild_bounty",
      title: "Wild Bounty Showdown",
      provider: "PG SOFT",
      category: "slots",
      subtitle: "পিজি কাউবয় গোল্ড ফ্রেম ১০২৪x",
      badge: "PG SOFT",
      badgeColor: "bg-yellow-700",
      players: "11,500",
      gradient: "from-amber-700 via-stone-800 to-slate-950",
      icon: "🤠",
      action: () => {
        setSelectedSlotId("wild_bounty");
        setActiveGame("slots");
      },
    },
    {
      id: "gates_of_olympus",
      title: "Gates of Olympus",
      provider: "PRAGMATIC",
      category: "slots",
      subtitle: "জিউস লাইটনিং ৫০০x মাল্টিপ্লায়ার",
      badge: "500X",
      badgeColor: "bg-purple-600",
      players: "11,200",
      gradient: "from-purple-700 via-indigo-800 to-slate-950",
      icon: "⚡",
      action: () => {
        setSelectedSlotId("gates_of_olympus");
        setActiveGame("slots");
      },
    },
    {
      id: "sweet_bonanza",
      title: "Sweet Bonanza",
      provider: "PRAGMATIC",
      category: "slots",
      subtitle: "ক্যান্ডি টাম্বলিং স্লট ও ফ্রি স্পিন",
      badge: "SWEET",
      badgeColor: "bg-pink-600",
      players: "8,820",
      gradient: "from-pink-600 via-rose-700 to-slate-950",
      icon: "🍭",
      action: () => {
        setSelectedSlotId("sweet_bonanza");
        setActiveGame("slots");
      },
    },
    // SPORTS & LIVE CASINO
    {
      id: "sports_cricket",
      title: "1x স্পোর্টস ও ক্রিকেট মাল্টি",
      provider: "1X SPORTS",
      category: "sports",
      subtitle: "বিপিএল, আইপিএল ও ফুটবল মাল্টি বেট",
      badge: "MULTI BET",
      badgeColor: "bg-emerald-600",
      players: "19,400",
      gradient: "from-emerald-700 via-green-900 to-slate-950",
      icon: "🏆",
      action: () => setActiveGame("sports"),
    },
    {
      id: "dragon_tiger",
      title: "Dragon vs Tiger",
      provider: "EVO LIVE",
      category: "live",
      subtitle: "লাইভ কার্ড টেবিল - ড্রাগন বনাম টাইগার",
      badge: "LIVE",
      badgeColor: "bg-red-600",
      players: "8,950",
      gradient: "from-red-700 via-rose-900 to-slate-950",
      icon: "🐉",
      action: () => setActiveGame("dragon_tiger"),
    },
    {
      id: "roulette",
      title: "European Roulette",
      provider: "EVO LIVE",
      category: "live",
      subtitle: "৩৬x পর্যন্ত লাকি নাম্বার পেআউট",
      badge: "CLASSIC",
      badgeColor: "bg-amber-600",
      players: "6,600",
      gradient: "from-amber-700 via-yellow-900 to-slate-950",
      icon: "🎡",
      action: () => setActiveGame("roulette"),
    },
  ];

  const filteredGames = selectedCategory === "all" ? games : games.filter((g) => g.category === selectedCategory);

  return (
    <div className="grid grid-cols-2 gap-2.5 px-1 my-2">
      {filteredGames.map((game) => (
        <div
          key={game.id}
          onClick={() => {
            soundManager.playClick();
            game.action();
          }}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.gradient} border border-white/10 hover:border-amber-400/50 p-3 shadow-lg cursor-pointer transition-all duration-200 transform hover:-translate-y-1 active:scale-95 group flex flex-col justify-between min-h-[140px]`}
        >
          {/* Top provider + icon */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className={`text-[9px] font-black text-white px-1.5 py-0.5 rounded-md ${game.badgeColor} shadow-sm w-fit`}>
                {game.badge}
              </span>
              <span className="text-[9px] text-amber-300/90 font-bold tracking-wider uppercase">{game.provider}</span>
            </div>
            <span className="text-2xl group-hover:scale-125 transition-transform duration-200 drop-shadow">
              {game.icon}
            </span>
          </div>

          {/* Title and details */}
          <div className="mt-2">
            <h3 className="text-sm font-black text-white tracking-tight drop-shadow-sm group-hover:text-amber-300 transition-colors">
              {game.title}
            </h3>
            <p className="text-[10px] text-slate-200 font-medium line-clamp-1 opacity-90 mt-0.5">
              {game.subtitle}
            </p>
          </div>

          {/* Bottom Live Stats & Play Button */}
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-slate-300 tabular-nums">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>{game.players}</span>
            </div>

            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] shadow group-hover:bg-amber-300 transition">
              <Play className="w-2.5 h-2.5 fill-slate-950" />
              <span>খেলুন</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
