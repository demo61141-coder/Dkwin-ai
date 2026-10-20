"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { soundManager } from "@/lib/audio";
import { X, Send, Headphones, Bot, Copy, Check, ExternalLink } from "lucide-react";

interface ChatMsg {
  id: number;
  username: string;
  message: string;
  isSupport: boolean;
  createdAt: string;
}

export default function LiveChatModal() {
  const { chatModalOpen, setChatModalOpen, user, showToast } = useApp();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState("@DKWIN_Official_Support");
  const [telegramChannel, setTelegramChannel] = useState("https://t.me/DKWIN_Official_Support");
  const [copiedTg, setCopiedTg] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatModalOpen) {
      fetch("/api/chat")
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) setMessages(data.messages);
        })
        .catch(() => {});

      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) {
            if (data.settings.telegramUsername) {
              setTelegramUsername(data.settings.telegramUsername);
            }
            if (data.settings.telegramChannel) {
              setTelegramChannel(data.settings.telegramChannel);
            }
          }
        })
        .catch(() => {});
    }
  }, [chatModalOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!chatModalOpen) return null;

  const cleanUsername = telegramUsername.startsWith("@") ? telegramUsername : `@${telegramUsername}`;
  const telegramUrl = telegramChannel?.startsWith("http")
    ? telegramChannel
    : `https://t.me/${cleanUsername.replace("@", "")}`;

  const handleCopyTelegram = () => {
    soundManager.playClick();
    navigator.clipboard.writeText(cleanUsername);
    setCopiedTg(true);
    showToast(`টেলিগ্রাম ইউজারনেম (${cleanUsername}) কপি হয়েছে!`, "success");
    setTimeout(() => setCopiedTg(false), 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userText = input.trim();
    setInput("");
    setSending(true);
    soundManager.playClick();

    const tempMsg: ChatMsg = {
      id: Date.now(),
      username: user ? user.username : "You",
      message: userText,
      isSupport: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      if (data.success) {
        setTimeout(() => {
          fetch("/api/chat")
            .then((r) => r.json())
            .then((d) => {
              if (d.messages) setMessages(d.messages);
            })
            .catch(() => {});
        }, 1200);
      }
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-sky-500/30 shadow-2xl text-white flex flex-col h-[560px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">DKWIN ২৪/৭ সাপোর্ট ও টেলিগ্রাম</h3>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>সাপোর্ট এজেন্ট অনলাইন আছেন</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => setChatModalOpen(false)}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Official Telegram Direct Contact Card (Editable from Admin Panel) */}
        <div className="bg-gradient-to-r from-sky-950 via-blue-950 to-slate-900 px-3.5 py-2.5 border-b border-sky-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-sky-300 font-bold block">অফিসিয়াল টেলিগ্রাম সাপোর্ট ইউজারনেম:</span>
              <span className="font-mono font-black text-xs text-amber-300 select-all">{cleanUsername}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyTelegram}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-sky-500/40 text-sky-300 hover:text-white text-[11px] font-bold transition"
              >
                {copiedTg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTg ? "কপি" : "ইউজারনেম কপি"}</span>
              </button>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-black transition shadow"
              >
                <span>Telegram</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <p className="text-[10px] text-slate-300">
            ডিপোজিট বা উত্তোলন সংক্রান্ত যেকোনো প্রয়োজনে নিচের লাইভ চ্যাটে মেসেজ দিন অথবা সরাসরি টেলিগ্রামে যোগাযোগ করুন।
          </p>
        </div>

        {/* Quick Topic Shortcuts */}
        <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            "ডিপোজিট পেন্ডিং সমস্যা",
            "উত্তোলন আপডেট চাই",
            "গিফট কোড কিভাবে পাবো?",
            "রেফার কমিশন নিয়ম",
          ].map((topic, i) => (
            <button
              key={i}
              onClick={() => setInput(topic)}
              className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:border-sky-500/40 whitespace-nowrap"
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.isSupport ? "items-start" : "items-end"}`}
            >
              <div className="flex items-center gap-1 mb-0.5 px-1">
                {m.isSupport && <Bot className="w-3 h-3 text-sky-400" />}
                <span className="text-[9px] text-slate-500 font-bold">{m.username}</span>
              </div>
              <div
                className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  m.isSupport
                    ? "bg-slate-800 text-slate-100 rounded-tl-xs border border-slate-700"
                    : "bg-gradient-to-r from-sky-600 to-blue-600 text-white font-medium rounded-tr-xs shadow"
                }`}
              >
                {m.message}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="আপনার বার্তা এখানে লিখুন..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={sending}
            className="p-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
