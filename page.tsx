/**
 * UperAI · Home Page
 * app/page.tsx
 *
 * Pro Investor Terminal — Google-style search entry point
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import CompanyCard from "@/components/CompanyCard";
import SignalRadar from "@/components/SignalRadar";
import FinancialTable from "@/components/FinancialTable";

const PLACEHOLDERS = [
  "Search Tata Motors...",
  "Analyze Zomato's debt...",
  "Find profitable mid-caps...",
  "Is Infosys undervalued?",
  "Compare HDFC vs Kotak Bank...",
];

const PILL_QUERIES = [
  { label: "Top Nifty 50", query: "Top Nifty 50 stocks by fundamentals" },
  { label: "Zero Debt Companies", query: "Zero debt companies India large cap" },
  { label: "High Growth Tech", query: "High growth tech stocks India" },
];

// ── TICKER DATA (replace with live feed in prod) ──────────────────────────
const TICKERS = [
  { name: "RELIANCE", price: "2,941", change: "+1.2%", up: true },
  { name: "TCS", price: "3,882", change: "-0.4%", up: false },
  { name: "INFY", price: "1,628", change: "+0.8%", up: true },
  { name: "TATAMOTORS", price: "963", change: "+2.1%", up: true },
  { name: "ZOMATO", price: "228", change: "-1.2%", up: false },
  { name: "NIFTY 50", price: "24,633", change: "+0.5%", up: true },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | Record<string, unknown>>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate placeholder
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (document.activeElement !== inputRef.current) {
        i = (i + 1) % PLACEHOLDERS.length;
        setPlaceholder(PLACEHOLDERS[i]);
      }
    }, 3000);
    return () => clearInterval(id);
  }, []);

  async function handleSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handlePill(q: string) {
    setQuery(q);
    handleSearch(q);
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E8E8E4] font-sans">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-3.5 border-b border-[#222] bg-[#0A0A0A]/95 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="text-lg font-semibold tracking-tight">
            Uper<span className="text-[#00D4A0]">AI</span>
          </span>
          <span className="font-mono text-[9px] tracking-[1.5px] bg-[#00D4A0]/10 text-[#00D4A0] border border-[#00D4A0]/20 px-2 py-0.5 rounded-sm">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-5">
          {["Markets", "Screener", "Portfolio"].map((l) => (
            <span key={l} className="text-xs text-[#888882] hover:text-[#E8E8E4] cursor-pointer transition-colors">
              {l}
            </span>
          ))}
          <button className="text-xs font-medium px-3.5 py-1.5 rounded-md bg-[#00D4A0]/10 text-[#00D4A0] border border-[#00D4A0]/20 hover:bg-[#00D4A0]/20 transition-colors">
            Sign in
          </button>
        </div>
      </nav>

      {/* ── TICKER BAR ── */}
      <div className="border-b border-[#222] bg-[#111] py-1.5 overflow-hidden">
        <div className="flex gap-0 animate-marquee w-max">
          {[...TICKERS, ...TICKERS].map((t, i) => (
            <div key={i} className="flex items-center gap-2 px-5 border-r border-[#222]">
              <span className="font-mono text-[11px] text-[#888882] tracking-wide">{t.name}</span>
              <span className="font-mono text-[12px]">₹{t.price}</span>
              <span className={`font-mono text-[11px] ${t.up ? "text-[#00D4A0]" : "text-[#FF4D4D]"}`}>
                {t.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HERO ── */}
      <section className={`flex flex-col items-center justify-center px-8 transition-all duration-500 ${result ? "pt-10 pb-6 min-h-[200px]" : "min-h-[420px] py-16"}`}>
        <p className="font-mono text-[10px] tracking-[2.5px] text-[#00D4A0]/80 uppercase mb-5">
          Pro Investor Terminal · India
        </p>
        <h1 className="text-[42px] font-semibold tracking-tight text-center leading-none mb-3">
          Find the{" "}
          <em className="not-italic text-[#00D4A0]">signal</em>
          <br />
          in the noise.
        </h1>
        <p className="text-sm text-[#888882] font-light text-center mb-9 max-w-md leading-relaxed">
          AI-powered fundamentals for Indian retail investors. No jargon. No noise. Just clarity.
        </p>

        {/* Search Input */}
        <div className="relative w-full max-w-[620px] mb-6">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            placeholder={placeholder}
            className="w-full px-5 py-4 pr-12 bg-[#111] border border-[#2a2a2a] rounded-xl text-[15px] text-[#E8E8E4] placeholder-[#555] outline-none transition-all duration-200 focus:border-[#00D4A0]/40 focus:shadow-[0_0_0_3px_rgba(0,212,160,0.06)]"
          />
          <button
            onClick={() => handleSearch(query)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#00D4A0] transition-colors"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
          </button>
        </div>

        {/* Pill Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          {PILL_QUERIES.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePill(p.query)}
              className="text-xs font-medium px-4 py-2 rounded-full border border-[#2a2a2a] bg-[#161616] text-[#888882] hover:border-[#00D4A0]/35 hover:text-[#00D4A0] hover:bg-[#00D4A0]/10 transition-all duration-200"
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── LOADING ── */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#00D4A0] animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <span className="font-mono text-[11px] text-[#555] tracking-widest">
            SCANNING MARKETS
          </span>
        </div>
      )}

      {/* ── RESULTS ── */}
      {result && !loading && (
        <section className="max-w-[900px] mx-auto px-6 pb-16">
          <CompanyCard data={result} />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <SignalRadar signals={(result as any).signals} />
          </div>
          <FinancialTable />
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#222] px-8 py-4 flex items-center justify-between">
        <span className="font-mono text-[11px] text-[#555]">
          © 2025 UperAI · uperai.in
        </span>
        <div className="flex gap-5">
          {["Privacy", "Terms", "About"].map((l) => (
            <span key={l} className="text-[11px] text-[#555] hover:text-[#888882] cursor-pointer">
              {l}
            </span>
          ))}
        </div>
      </footer>
    </main>
  );
}
