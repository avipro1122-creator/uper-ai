export const STOCK_DATA = {
  RELIANCE: {
    name: "Reliance Industries Ltd. (RIL)",
    ticker: "RELIANCE",
    price: "₹2,945.60",
    change: "+1.85%",
    marketCap: "₹19.92 Lakh Cr",
    peRatio: "27.4",
    divYield: "0.34%",
    roe: "9.6%",
    chartData: [
      { label: "Q1 FY25", revenue: 236110, pat: 17448, jioUsers: 485 },
      { label: "Q2 FY25", revenue: 240350, pat: 19101, jioUsers: 489 },
      { label: "Q3 FY25", revenue: 248160, pat: 18049, jioUsers: 493 },
      { label: "Q4 FY25", revenue: 254820, pat: 19876, jioUsers: 497 },
      { label: "Q1 FY26 (P)", revenue: 258900, pat: 20120, jioUsers: 502 }
    ]
  },
  TATA_POWER: {
    name: "Tata Power Company Ltd.",
    ticker: "TATAPOWER",
    price: "₹435.25",
    change: "+4.12%",
    marketCap: "₹1.39 Lakh Cr",
    peRatio: "34.8",
    divYield: "0.52%",
    roe: "12.4%",
    chartData: [
      { label: "Q1 FY25", revenue: 17290, pat: 972 },
      { label: "Q2 FY25", revenue: 16210, pat: 1017 },
      { label: "Q3 FY25", revenue: 15440, pat: 1076 },
      { label: "Q4 FY25", revenue: 18600, pat: 1109 },
      { label: "Q1 FY26 (P)", revenue: 19250, pat: 1250 }
    ]
  },
  AUTO_SECTOR: [
    { name: "Tata Motors", ticker: "TATAMOTORS", price: "₹960.40", pe: "11.2", peg: "0.45", roe: "22.4%", ebitda: "14.3%" },
    { name: "M&M", ticker: "M&M", price: "₹2,820.15", pe: "26.8", peg: "1.25", roe: "18.9%", ebitda: "12.8%" },
    { name: "Maruti Suzuki", ticker: "MARUTI", price: "₹12,410.00", pe: "28.5", peg: "1.40", roe: "15.6%", ebitda: "11.2%" },
    { name: "Bajaj Auto", ticker: "BAJAJ-AUTO", price: "₹9,850.50", pe: "24.1", peg: "0.95", roe: "28.1%", ebitda: "19.5%" }
  ]
};

export const MOCK_RESPONSES = {
  reliance_q4: {
    question: "Analyze Reliance Industries Q4 performance and segmental growth",
    gemini: {
      latency: "840ms",
      sources: ["Q4 FY25 Investor Presentation", "SEBI Disclosures", "RIL Concall Transcript", "Jio Platforms Press Release"],
      summary: `**Reliance Industries (RIL)** reported a stable Q4 FY25 with consolidated revenue at **₹2,54,820 Cr** (+6.8% YoY) and net profit at **₹19,876 Cr** (+0.8% YoY). Consumer business expansions (Retail/Jio) effectively neutralized margin contractions in the fossil-fuel O2C division.`,
      sections: [
        {
          title: "1. Digital Services (Jio Concall Highlights)",
          content: "• **ARPU Stabilization**: Stood at **₹182.4** (+2.5% QoQ) driven by migration to 5G tariffs and fiber traction.\n• **Subscriber Scale**: Reached **497M** total users, maintaining lowest churn rate in industry (0.9%).\n• **EBITDA Margin**: Stable at **50.2%** due to scale benefits offsetting 5G infrastructure expenses."
        },
        {
          title: "2. Organized Retail (Reliance Retail Concall Highlights)",
          content: "• **Footfall Surge**: Documented **272M+** visits across 18,800+ stores (+10.2% YoY).\n• **Digital Traction**: Digital commerce and new commerce channels contributed **12%** of total segment revenue.\n• **EBITDA Growth**: Expanded by **11.5% YoY** to ₹5,820 Cr, led by grocery and consumer electronics segments."
        },
        {
          title: "3. O2C Segment & Capex Guidance",
          content: "• **Margin Drag**: EBITDA down by **1.2%** to ₹17,215 Cr due to compressed global refining spreads (GRMs).\n• **Concall Capex Guidance**: Projected FY26 capital outlay of **₹1.2 - 1.4 Lakh Cr**; shift in allocation towards the Dhirubhai Ambani Green Energy complex.\n• **Renewables Timeline**: Solar gigafactory module line set to commission in late FY26."
        }
      ],
      metrics: [
        { label: "Consol Revenue", value: "₹2.54 L Cr", change: "+6.8% YoY" },
        { label: "Jio ARPU", value: "₹182.4", change: "+2.5% QoQ" },
        { label: "Retail Stores", value: "18,800+", change: "+1,20Net Add" },
        { label: "O2C EBITDA Margin", value: "7.9%", change: "-120 bps YoY" }
      ],
      chartData: STOCK_DATA.RELIANCE.chartData,
      chartTitle: "Reliance Quarterly Segment Revenue & Jio Users"
    },
    xai: {
      latency: "410ms",
      sources: ["Real-time X Stream", "Global Energy Crudes Index", "Bloomberg Oil Terminal", "Live Market Sentiment"],
      summary: `RIL's Q4 numbers beat muted street expectations but underline the transition friction from fossil fuels to consumer tech. Sentiment on retail remain highly bullish, but institutional money is closely tracking O2C margin recovery and green energy timeline slippages.`,
      bullets: [
        "🔥 **O2C Under Fire:** Global petrochemical overcapacity (specifically from China) is capping upside. RIL's margins are protected only by deep-discounted Russian Urals crude sourcing.",
        "📱 **Jio 5G Monetization:** Free unlimited 5G data packages are coming to an end. Next leg of growth depends entirely on tariff hikes expected post-elections (15-20% estimated).",
        "⚡ **New Energy IPO rumors:** X feeds are abuzz with speculation regarding a prospective carve-out and listing of Reliance Retail and Jio Platforms by late 2026 to unlock massive value.",
        "📊 **Brokerage Targets:** Jefferies maintains BUY with ₹3,350 target; Macquarie remains Underperform with ₹2,630 citing capex drag."
      ]
    },
    slm: {
      latency: "65ms",
      sources: ["Uper Financial Weights (v1.2)"],
      summary: `### Uper SLM Financial Summary (Reliance Q4)
* **Consol. Revenue**: ₹2,54,820 Cr (+6.8% YoY)
* **Consol. EBITDA**: ₹42,516 Cr (+8.2% YoY)
* **EBITDA Margin**: 16.7% (+22 bps YoY)
* **PAT**: ₹19,876 Cr (+0.8% YoY)
* **Net Debt/EBITDA**: 1.18x (stable)

**Critical Segmental Contribution:**
* **Jio EBITDA**: ₹14,688 Cr (34.5% share)
* **Retail EBITDA**: ₹5,820 Cr (13.7% share)
* **O2C EBITDA**: ₹17,215 Cr (40.5% share)
* **Others**: ₹4,793 Cr (11.3% share)`
    }
  },
  auto_valuation: {
    question: "List undervalued stocks in the Indian Auto sector",
    gemini: {
      latency: "920ms",
      sources: ["Nifty Auto Valuation Model", "FY25 Annual Reports", "Ambit Institutional Equities Research"],
      summary: `Valuations across the **Nifty Auto Index** are showing wide dispersion. Commercial Vehicles (CVs) are stabilizing near cyclical peaks, while Two-Wheelers (2Ws) are enjoying rural consumption recovery. **Tata Motors** and **Bajaj Auto** show the strongest margin of safety.`,
      sections: [
        {
          title: "1. Tata Motors (TATAMOTORS) Concall Analysis",
          content: "• **Valuation Gap**: Trades at EV/EBITDA of **6.2x** and forward P/E of **11.2x**, which is a significant historical discount.\n• **JLR Margin Guidance**: Management guides JLR EBITDA margins to remain stable at **>16%** for FY26 despite heavy EV capex.\n• **Debt Profile**: Net automotive debt stands fully eliminated, generating strong free cash flows."
        },
        {
          title: "2. Bajaj Auto & Two-Wheeler Export Traction",
          content: "• **Financial Strength**: Boasts the highest sector ROE (**28.1%**) and premium EBITDA margins (**19.5%**).\n• **EV Scaling**: Chetak brand is scaling rapidly, targeting **20,000+ monthly retail volumes**.\n• **Export Recovery**: Concall signals export inventory normalization in African/LATAM markets, hinting at volume double-digit recovery in Q2 FY26."
        }
      ],
      tableData: STOCK_DATA.AUTO_SECTOR,
      metrics: [
        { label: "Nifty Auto P/E", value: "24.6x", change: "Historical Avg: 21x" },
        { label: "Top Pick (Value)", value: "Tata Motors", change: "P/E: 11.2x" },
        { label: "Top Pick (Growth)", value: "Bajaj Auto", change: "ROE: 28.1%" }
      ]
    },
    xai: {
      latency: "460ms",
      sources: ["Auto dealer inventory reports", "FADA registration data", "FII flow trackers"],
      bullets: [
        "🚗 **Tata Motors (TATAMOTORS):** High beta stock. Retail traders love it, but FIIs are locking in profits due to JLR margin normalization warning signs. Decent margin of safety at ₹960.",
        "🚜 **Mahindra & Mahindra (M&M):** SUV bookings are backlogged, but tractor volumes are volatile due to monsoon concerns. High valuation (P/E 26.8x) is pricing in perfection.",
        "🏍️ **Bajaj Auto:** EV sales (Chetak) are catching up to TVS iQube. Massive cash reserves make it a defensive play during market corrections.",
        "📦 **Inventory Concerns:** FADA reports vehicle inventory at dealerships has hit an all-time high of 60 days. Discounting wars will compress margins in Q2 FY26."
      ]
    },
    slm: {
      latency: "45ms",
      sources: ["Uper Financial Weights (v1.2)"],
      summary: `### Auto Sector Valuation Dashboard
| Company | P/E Ratio | PEG Ratio | ROE | EV/EBITDA |
| :--- | :---: | :---: | :---: | :---: |
| **Tata Motors** | 11.2x | 0.45 | 22.4% | 6.2x |
| **Bajaj Auto** | 24.1x | 0.95 | 28.1% | 16.8x |
| **M&M** | 26.8x | 1.25 | 18.9% | 18.2x |
| **Maruti Suzuki** | 28.5x | 1.40 | 15.6% | 17.5x |

*Uper SLM Score:* **Tata Motors** represents the highest valuation discount with robust operational cash flows.`
    }
  },
  tata_power: {
    question: "Impact of the new rooftop solar policy on Tata Power",
    gemini: {
      latency: "790ms",
      sources: ["PM Surya Ghar Muft Bijli Yojana circular", "Tata Power Renewable Energy filings", "MNRE notifications"],
      summary: `The launch of the **PM Surya Ghar: Muft Bijli Yojana** (subsidizing solar installs for 10M homes) is a structural tailwind for **Tata Power**. Holding a **13.2% market share** in solar rooftop EPC, the policy dramatically scales up Tata Power's addressable retail market.`,
      sections: [
        {
          title: "1. Manufacturing Capacity & Margins",
          content: "• **Backward Integration**: Active 4.3 GW solar cell & module line in Tamil Nadu protects margins from Chinese import dependencies.\n• **Margin Guidance**: Concall indicators guide solar EPC margin expansion of **+80 bps** due to localization of supply lines.\n• **Order Book Visibility**: Standing order book at **₹15,400 Cr**, ensuring solid revenue pipeline."
        },
        {
          title: "2. Financial Projections & Return Ratios",
          content: "• **Growth Forecast**: Rooftop solar segment is projected to grow at **35% CAGR** over FY26-FY28.\n• **Return Profile**: Expected expansion of consolidated ROCE to **14.5% - 16.0%** (up from 12.4% present) over the next two fiscals.\n• **Valuation Justification**: Higher cash flow visibility justifies forward P/E premium of **34.8x**."
        }
      ],
      metrics: [
        { label: "Solar Order Book", value: "₹15,400 Cr", change: "+18% YoY" }
      ],
      chartData: STOCK_DATA.TATA_POWER.chartData,
      chartTitle: "Tata Power Quarterly Solar Revenue & Net Profit"
    },
    xai: {
      latency: "380ms",
      sources: ["Policy sentiment trackers", "Solar cell spot price indicators", "Domestic retail solar queries"],
      bullets: [
        "☀️ **Policy Push:** Govt is subsidizing up to 60% of solar installation costs. Tata Power is launching sub-brands to capture retail tier-2 and tier-3 city households.",
        "🇨🇳 **China Tariff Risks:** Rising anti-dumping duties on Chinese solar wafers may impact Tata Power's manufacturing cost structures unless local cell supply ramps up ahead of schedule.",
        "📈 **Stock Sentiment:** Highly momentum-driven. Retail holding in Tata Power has jumped 8% in the last two quarters. Resistance level at ₹450, support at ₹410."
      ]
    },
    slm: {
      latency: "52ms",
      sources: ["Uper Financial Weights (v1.2)"],
      summary: `### Uper SLM Policy Impact Matrix (Tata Power)
* **Direct Beneficiary**: Tata Power Solar (100% subsidiary)
* **EPC Market Share**: 13.2% (1st overall)
* **Manufacturing Capacity**: 4.3 GW cell & module line (Tamil Nadu)
* **Projected Revenue Impact**: +₹4,500 - 6,000 Cr incremental sales in FY26
* **Margin Impact**: Solar EPC margins projected to expand by +80 bps due to localized supply chain.

*Conclusion*: Policy accelerates corporate solar conversion and pushes utility-scale developers into premium segments.`
    }
  }
};

export const DEFAULT_RESPONSES = {
  nifty: {
    gemini: {
      latency: "610ms",
      summary: "The **Nifty 50 Index** is consolidating in the 23,200 - 23,600 range. DII support (averaging **₹20,000+ Cr monthly** SIP inflows) provides a solid floor, buffering against steady FII selloffs triggered by high US yields. Triggers to track: upcoming budget capex outlays and Q1 corporate earnings guidance."
    },
    xai: {
      latency: "280ms",
      summary: "Nifty is battling gravity. Bears are screaming overvaluation, but the SIP army doesn't care. Watch the 23,100 support level; if it breaks, we might see automated long liquidation. Banks are holding the line."
    },
    slm: {
      latency: "30ms",
      summary: "Nifty 50 PE: 21.8x (Historical Mean: 20.2x). India VIX: 13.4. DII Net flows (MTD): +₹22,400 Cr. FII Net flows (MTD): -₹18,900 Cr. Short-term bias remains neutral-positive with critical support at 23,150."
    }
  },
  generic: {
    gemini: {
      latency: "750ms",
      summary: "I can help you analyze Indian equities by integrating financial statements, earnings call concalls, annual reports, and live news. Try asking: \n\n1. *'Analyze Reliance Industries Q4 performance and segmental growth'*\n2. *'List undervalued stocks in the Indian Auto sector'*\n3. *'Impact of the new rooftop solar policy on Tata Power'*"
    },
    xai: {
      latency: "320ms",
      summary: "Ask me anything about Indian stocks. I scan live market sentiment, regulatory files, and earnings presentations. Type a specific query or use the presets like 'Reliance Q4 results' to see me stream real-time insights."
    },
    slm: {
      latency: "35ms",
      summary: "Uper Financial SLM (v1.2) ready. Average token response time < 50ms. Highly trained on SEBI rules, NSE/BSE filings, corporate announcements, and Indian tax code structures."
    }
  }
};

export const getResponse = (query, model) => {
  const cleanQuery = query.toLowerCase();
  let key = "";

  if (cleanQuery.includes("reliance") || cleanQuery.includes("ril")) {
    key = "reliance_q4";
  } else if (cleanQuery.includes("auto") || cleanQuery.includes("undervalued") || cleanQuery.includes("tata motors") || cleanQuery.includes("mahindra")) {
    key = "auto_valuation";
  } else if (cleanQuery.includes("solar") || cleanQuery.includes("tata power") || cleanQuery.includes("policy")) {
    key = "tata_power";
  } else if (cleanQuery.includes("nifty") || cleanQuery.includes("sensex") || cleanQuery.includes("market")) {
    return DEFAULT_RESPONSES.nifty[model];
  } else {
    return DEFAULT_RESPONSES.generic[model];
  }

  return MOCK_RESPONSES[key][model];
};
