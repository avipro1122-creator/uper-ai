# UperAI // Pro Investor Terminal

UperAI is a high-fidelity equity intelligence terminal for the Indian Stock Market (NSE/BSE). Translating raw financial metrics into clean, First-Principles business narratives, it helps modern investors understand companies at a structural level rather than just wrapping data in basic chatbots.

---

## Technical Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 (Glassmorphism, ultra-premium dark theme, fluid glow animations)
- **Icons**: Lucide React
- **Core Engine**: Google Gemini 3.5 Flash via `@google/generative-ai`

---

## Getting Started

### 1. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Google Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If the API key is not present, the terminal automatically falls back to a high-fidelity offline mock intelligence mode for popular stocks like Reliance, HDFC Bank, Tata Motors, and Infosys.)*

### 2. Run the Development Server
Install dependencies and run:
```bash
# Install dependencies
npm install

# Start local server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the terminal.

---

## Deploy to Vercel & GitHub (Step-by-Step)

This application is built using standard Next.js directory guidelines, making it extremely straightforward to deploy.

### Step 1: Initialize Git and Commit
If Git is installed on your machine, initialize the repository and commit:
```bash
git init
git add .
git commit -m "feat: UperAI Pro Investor Terminal initial build"
```

### Step 2: Push to GitHub
1. Go to [GitHub](https://github.com) and create a new **Private** or **Public** repository (e.g., `uperai-terminal`).
2. Run the following commands to link and push your code:
```bash
git branch -M main
git remote add origin https://github.com/your-username/uperai-terminal.git
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project**.
3. Select your `uperai-terminal` repository from the list.
4. Under **Environment Variables**, add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: *[Your Google Gemini API Key]*
5. Click **Deploy**. Vercel will automatically build and serve your app. Subsequent pushes to `main` will trigger instant preview deployments.
