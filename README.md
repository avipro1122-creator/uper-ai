# UperAI · Pro Investor Terminal

> Find the signal in the noise. AI-powered stock fundamentals for Indian retail investors.

**Domain**: uperai.in  
**Stack**: Next.js 14 · Tailwind CSS · Gemini AI · TypeScript

---

## Project Structure

```
uperai/
├── app/
│   ├── page.tsx              ← Main terminal homepage (search + results)
│   ├── globals.css           ← Terminal aesthetic + font imports
│   ├── layout.tsx            ← Root layout (metadata, fonts)
│   └── api/
│       └── analyze/
│           └── route.ts      ← POST /api/analyze — Gemini integration
│
├── components/
│   ├── CompanyCard.tsx       ← Stock header + metrics grid
│   ├── SignalRadar.tsx       ← Bull/bear/watch signal tags
│   ├── FinancialTable.tsx    ← Annual P&L table
│   ├── MiniChart.tsx         ← 52-week price sparkline (Chart.js)
│   ├── AiAnalysis.tsx        ← Gemini plain-English analysis card
│   ├── TickerBar.tsx         ← Scrolling live price marquee
│   └── SearchBar.tsx         ← Search input + pill buttons
│
├── services/
│   └── gemini.ts             ← Gemini API client + system instructions
│
├── types/
│   └── stock.ts              ← TypeScript interfaces
│
├── tailwind.config.js        ← Terminal color system + fonts
├── .env.example              ← Environment variable template
└── package.json
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Add your Gemini API key to .env.local

# 3. Run dev server
npm run dev

# Open http://localhost:3000
```

---

## Design System

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0A0A0A` | Pure matte black background |
| `--card` | `#111111` | Card surfaces |
| `--border` | `#222222` | Structural borders |
| `--text` | `#E8E8E4` | Primary text |
| `--muted` | `#888882` | Secondary text |
| `--green` | `#00D4A0` | Positive signals, accents, CTAs |
| `--red` | `#FF4D4D` | Risk signals, negative P&L |
| `--amber` | `#F5A623` | Warning / watch signals |

### Typography

- **Body**: Space Grotesk (weight 300–600)
- **Numbers / Tickers**: JetBrains Mono (weight 300–500)

---

## Gemini Integration

The Gemini service (`services/gemini.ts`) is initialized with strict system instructions:

- Translate raw financial data into plain-English business stories
- Always use Indian numbering (Lakhs, Crores)
- Focus on: business model health, growth catalysts, valuation risks
- Never give explicit Buy/Sell/Hold advice
- Structure responses in 3 sections: The Story · Growth Engine · Key Risk

### Adding Your API Key

1. Get a free Gemini API key: https://aistudio.google.com/app/apikey
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
   ```
3. If no key is present, the app falls back to mock responses automatically.

---

## API Reference

### POST `/api/analyze`

**Free-form search:**
```json
{ "query": "Analyze Zomato fundamentals" }
```

**Structured stock analysis:**
```json
{
  "companyName": "Tata Motors Ltd",
  "ticker": "TATAMOTORS",
  "sector": "Auto · Large Cap",
  "metrics": {
    "marketCap": "₹3.55L Cr",
    "revenue": "₹4.38L Cr",
    "netProfit": "₹31,807 Cr",
    "peRatio": 10.2,
    "debtToEquity": 1.42,
    "revenueGrowthYoY": 29.4,
    "ebitdaMargin": 11.8,
    "promoterHolding": 46.4
  }
}
```

**Response:**
```json
{
  "story": "...",
  "growthEngine": "...",
  "keyRisk": "...",
  "signals": {
    "earningsMomentum": "bullish",
    "debtTrajectory": "watch",
    "marketPosition": "bullish",
    "macroExposure": "risk",
    "valuation": "cheap",
    "promoterPledging": "neutral"
  }
}
```

---

## Roadmap

- [ ] Live BSE/NSE price feed via Polygon.io or Upstox API
- [ ] Stock screener (zero debt, high ROE, consistent dividends)
- [ ] Portfolio tracker with Gemini-powered rebalancing suggestions
- [ ] Mobile app (React Native)
- [ ] WhatsApp bot integration
- [ ] SEBI disclaimer + legal compliance page

---

## Legal

UperAI is an educational and informational platform. It is not a SEBI-registered investment advisor. All content is for informational purposes only and does not constitute financial advice. Always consult a qualified financial advisor before making investment decisions.

---

Built with ♦ by the UperAI team · uperai.in
