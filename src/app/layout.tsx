import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "DKWIN - Bangladesh's #1 Color Prediction, Crash, JILI Slots & Sports Platform",
  description:
    "DKWIN অফিসিয়াল গেমিং প্ল্যাটফর্ম। Win Go কালার প্রিডিকশন, এভিয়েটর ও জেটএক্স ক্র্যাশ, থিম্বল, জিলি স্লট এবং ১এক্স স্টাইল স্পোর্টস মাল্টি-বেট।",
  keywords: "dkwin, wingo, aviator, jetx, thimble, jili slots, spribe, casino bangladesh, bkash deposit",
  authors: [{ name: "DKWIN Official" }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
