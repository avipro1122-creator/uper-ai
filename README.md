# UperAI - Indian Equities Investment Research Terminal

UperAI is a conversation-first AI investment research platform built exclusively for Indian equities. Instead of switching between multiple applications and websites, investors ask questions in natural language and receive instant, research-backed insights synthesizing financial statements, annual reports, earnings calls, market news, valuation metrics, and sector trends.

This repository contains the interactive prototype website built with **React**, **Vite**, and **Vanilla CSS**.

---

## Key Prototype Features

* **AI Model Toggle**: Swaps the execution environment between:
  1. **Gemini Pro**: Deep financial analysis, multi-source citations, and detailed segment performance.
  2. **xAI Grok**: Real-time market sentiment, social metrics, and high-frequency news indicators.
  3. **Uper SLM (Preview)**: Sub-100ms structured local financial intelligence.
* **Accent Theme Shifting**: The layout border glow and details card highlights automatically shift dynamically between model colors (Gemini Blue, Grok Stark, SLM Neon Mint).
* **Interactive SVG Stock Charts**: Responsive canvas-like area chart mapping quarterly segment revenues, with mouse hover states and absolute coordinate tooltips.
* **Indian Equities Tokenizer Sandbox**: A working demo of a custom tokenizer that parses Indian numerical formats (`Crores`, `Lakhs`, `₹`) and fiscal periods (`Q4 FY25`, `FY26`) natively.
* **Collapsible Financial Layouts**: Neatly organized segment-by-segment breakdowns using collapsible details blocks.
* **Valuation Grid & Matrices**: Responsive stock tables displaying PE, PEG, ROE, and EBITDA parameters.

---

## Local Development

Ensure you have [Node.js](https://nodejs.org/) installed.

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Local Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

3. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## Deployment to Vercel & GitHub

This application compiles into a standard static bundle (`dist/`) and is deployable on Vercel with zero configurations:

### Deploy to Vercel (CLI)
1. Install Vercel CLI: `npm install -g vercel`
2. Run command: `vercel` (follow command prompts to select project name and link)
3. Push to production: `vercel --prod`

### Deploy to GitHub Pages / Vercel Integration
1. Push this repository to GitHub.
2. In the Vercel dashboard, click **Add New Project**, import this repository.
3. Vercel will auto-detect Vite, set the build command to `npm run build` and output directory to `dist`, deploying the site on every git push.

