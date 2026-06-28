import os
import re
import json
import time
import requests
import threading
from concurrent.futures import ThreadPoolExecutor
from pypdf import PdfReader
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

WORKSPACE_DIR = os.getcwd()
CONCALL_DIR = os.path.join(WORKSPACE_DIR, 'concall')
OUTPUT_FILE = os.path.join(WORKSPACE_DIR, 'concalls.json')

# Map folder names to tickers
TICKER_MAP = {
    "Adani Enterprises Ltd": "ADANIENT",
    "Adani Ports & Special Economic Zone Ltd": "ADANIPORTS",
    "Axis Bank Ltd": "AXISBANK",
    "Bajaj Auto Ltd": "BAJAJ-AUTO",
    "Bajaj Finance Ltd": "BAJFINANCE",
    "Bajaj Finserv Ltd": "BAJAJFINSV",
    "Bharat Electronics Ltd": "BEL",
    "Bharti Airtel Limited": "BHARTIARTL",
    "Coal India Ltd": "COALINDIA",
    "HCL Technologies Ltd": "HCLTECH",
    "HDFC Bank Limited": "HDFCBANK",
    "Hindustan Unilever Ltd": "HINDUNILVR",
    "ICICI Bank Ltd": "ICICIBANK",
    "Infosys Ltd": "INFY",
    "JSW Steel Ltd": "JSWSTEEL",
    "Kotak Mahindra Bank Ltd": "KOTAKBANK",
    "Larsen & Toubro Ltd": "LT",
    "Mahindra & Mahindra Ltd": "M&M",
    "Maruti Suzuki India Ltd": "MARUTI",
    "NTPC Ltd": "NTPC",
    "Nestle India Ltd": "NESTLEIND",
    "Oil & Natural Gas Corpn Ltd": "ONGC",
    "Reliance Industries Limited": "RELIANCE",
    "State Bank of India Limited": "SBIN",
    "Sun Pharmaceutical Industries Ltd": "SUNPHARMA",
    "Tata Consultancy Services limited": "TCS",
    "Titan Company Ltd": "TITAN",
    "UltraTech Cement Ltd": "ULTRACEMCO"
}

def clean_json_text(text):
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def parse_filename(filename):
    # Match pattern like: "RIL Q1 2025 - 2026.pdf" or "TCS Q4 2025-2026"
    match = re.search(r'(Q[1-4])\s+(\d{4})\s*-\s*(\d{4})', filename, re.IGNORECASE)
    if match:
        quarter = match.group(1).upper()
        year_start = match.group(2)
        year_end = match.group(3)[-2:] # last two digits
        financial_year = f"FY{year_end}"
        return quarter, financial_year
    
    # Fallback to simple regex matches
    q_match = re.search(r'(Q[1-4])', filename, re.IGNORECASE)
    fy_match = re.search(r'(FY\d{2})|(\d{4})', filename, re.IGNORECASE)
    quarter = q_match.group(1).upper() if q_match else "Q4"
    fy = fy_match.group(0).upper() if fy_match else "FY26"
    return quarter, fy

def query_llm_for_analysis(company_name, ticker, quarter, fy, transcript_text, gemini_key, openai_key=None):
    system_prompt = (
        "You are a Senior Equity Research Analyst specializing in the Indian stock market (NSE/BSE). "
        f"Analyze the conference call transcript for {company_name} ({ticker}) for {quarter} {fy} "
        "and return a highly professional, institutional-grade equity research analysis in a valid JSON object matching the requested schema. "
        "Ensure the tone is analytical, objective, and dense with financial insight. Do not return any text other than the JSON object. "
        "Double quotes inside string values must be properly escaped as \\\"."
    )
    
    user_prompt = f"""
Analyze the quarterly earnings conference call transcript for {company_name} ({ticker}) for {quarter} {fy}.
Below is the full transcript text extracted from the corporate filing PDF.

---
TRANSCRIPT TEXT:
{transcript_text[:100000]} # Limit to 100k characters for API safety
---

Format the output strictly as a JSON object with the following keys and structure:
{{
  "companyName": "{company_name}",
  "symbol": "{ticker}",
  "quarter": "{quarter}",
  "financialYear": "{fy}",
  "date": "June 2025",
  "executiveSummary": {{
    "bullets": [
      "8 to 10 dense bullet points explaining the core results, business pivots, operational drivers, and strategic direction."
    ],
    "overallSentiment": "Detailed paragraph analyzing the overall management tone and market positioning."
  }},
  "quarterlyPerformance": {{
    "revenue": "Revenue figures with YoY/QoQ growth (e.g. ₹25,482 Cr, +6.8% YoY)",
    "ebitda": "EBITDA figures and margin performance (e.g. ₹4,251 Cr, margin at 16.7%)",
    "pat": "Profit After Tax and EPS growth details",
    "margins": "Gross margin and operating margin trends",
    "volumeGrowth": "Volume growth metrics (e.g. +4.5% volume growth)",
    "segmentPerformance": "Detailed breakdown of key business segments and their contributions"
  }},
  "managementCommentary": {{
    "businessUpdates": ["Business Update 1", "Business Update 2"],
    "capacityExpansion": ["Capacity expansion updates"],
    "newProducts": ["New product launches"],
    "demandTrends": ["Current demand trends"],
    "pricing": ["Pricing decisions"],
    "costPressures": ["Cost inflation or margin pressures"]
  }},
  "futureGuidance": {{
    "revenueGuidance": "Expected top-line growth rate",
    "marginGuidance": "Expected margin trajectory",
    "capexPlans": "Planned capital expenditure outlay",
    "growthOutlook": "Growth opportunities",
    "risksHighlighted": ["Risk 1", "Risk 2"]
  }},
  "analystQA": {{
    "questionsAndAnswers": [
      {{
        "question": "Realistic analyst question",
        "answer": "Detailed management answer"
      }}
    ],
    "unansweredConcerns": ["Concern 1"]
  }},
  "bullishSignals": ["Signal 1", "Signal 2"],
  "bearishSignals": ["Signal 1", "Signal 2"],
  "redFlags": {{
    "weakGuidance": "Guidance risk",
    "decliningMargins": "Margin pressure analysis",
    "demandSlowdown": "Demand slowdown analysis",
    "customerConcentration": "Customer risk",
    "regulatoryRisks": "Regulations or SEBI risks",
    "debtConcerns": "Debt risk",
    "governanceConcerns": "Audits/Pledges/Governance risk"
  }},
  "aiSentiment": {{
    "score": 75,
    "classification": "Bullish"
  }},
  "keyNumbers": {{
    "revenue": "₹XX,XXX Cr",
    "ebitda": "₹X,XXX Cr",
    "pat": "₹X,XXX Cr",
    "eps": "₹XX.XX",
    "roce": "XX.X%",
    "roe": "XX.X%",
    "debt": "₹XX,XXX Cr",
    "cash": "₹X,XXX Cr",
    "capex": "₹X,XXX Cr",
    "orderBook": "₹XX,XXX Cr or N/A",
    "volumeGrowth": "X.X%"
  }},
  "comparePrevious": {{
    "improvements": ["Improvement 1", "Improvement 2"],
    "deterioration": ["Deterioration 1", "Deterioration 2"],
    "newDevelopments": ["Development 1", "Development 2"]
  }},
  "investmentThesis": {{
    "bullCase": ["Bull Case 1"],
    "bearCase": ["Bear Case 1"],
    "longTermOutlook": "Long-term growth thesis."
  }},
  "importantQuotes": [
    "Important verbatim quote from CEO/CFO"
  ],
  "aiGeneratedRisks": [
    "AI generated future predictive risk"
  ],
  "keywords": ["Sector Tag", "NSE", "Growth"]
}}
"""

    max_retries = 3
    for attempt in range(max_retries):
        try:
            if openai_key:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_key}"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"}
                }
                res = requests.post(url, headers=headers, json=payload, timeout=60)
            else:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
                headers = {'Content-Type': 'application/json'}
                payload = {
                    "contents": [{
                        "role": "user",
                        "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]
                    }],
                    "generationConfig": {
                        "responseMimeType": "application/json"
                    }
                }
                res = requests.post(url, headers=headers, json=payload, timeout=60)

            if res.status_code != 200:
                raise Exception(f"API returned status {res.status_code}: {res.text}")
                
            data = res.json()
            if openai_key:
                text_out = data['choices'][0]['message']['content']
            else:
                text_out = data['candidates'][0]['content']['parts'][0]['text']
                
            cleaned = clean_json_text(text_out)
            return json.loads(cleaned)
            
        except json.JSONDecodeError as e:
            if attempt == max_retries - 1:
                raise e
            print(f"JSONDecodeError on attempt {attempt + 1}. Retrying in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            print(f"Exception on attempt {attempt + 1}: {e}. Retrying in 5 seconds...")
            time.sleep(5)

def main():
    gemini_key = os.getenv('GEMINI_API_KEY') or os.getenv('VITE_GEMINI_API_KEY')
    openai_key = os.getenv('OPENAI_API_KEY')
    
    if not gemini_key and not openai_key:
        print("Error: Neither VITE_GEMINI_API_KEY/GEMINI_API_KEY nor OPENAI_API_KEY is defined in environment/.env file.")
        return

    concalls_db = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                concalls_db = json.load(f)
            print(f"Loaded existing concalls database with {len(concalls_db)} companies.")
        except Exception as e:
            print("Failed to read existing concalls.json, creating a new one:", e)

    if not os.path.exists(CONCALL_DIR):
        print(f"Error: concall directory not found at {CONCALL_DIR}")
        return

    company_folders = [d for d in os.listdir(CONCALL_DIR) if os.path.isdir(os.path.join(CONCALL_DIR, d))]
    
    tasks = []
    for folder in company_folders:
        ticker = TICKER_MAP.get(folder)
        if not ticker:
            print(f"Skipping directory '{folder}' - no ticker mapping found.")
            continue
            
        folder_path = os.path.join(CONCALL_DIR, folder)
        pdf_files = [f for f in os.listdir(folder_path) if f.endswith('.pdf')]
        
        for pdf in pdf_files:
            pdf_path = os.path.join(folder_path, pdf)
            quarter, fy = parse_filename(pdf)
            quarter_key = f"{quarter}_{fy}"
            
            # Check if already processed
            if ticker in concalls_db and quarter_key in concalls_db[ticker]:
                continue
                
            tasks.append({
                'company_name': folder,
                'ticker': ticker,
                'quarter': quarter,
                'fy': fy,
                'quarter_key': quarter_key,
                'pdf_path': pdf_path,
                'pdf_name': pdf
            })

    print(f"Found {len(tasks)} new PDF files to process out of {len(company_folders)} company folders.")
    if not tasks:
        print("All PDFs are already processed!")
        return

    write_lock = threading.Lock()
    db_lock = threading.Lock()

    def process_task(task):
        ticker = task['ticker']
        quarter_key = task['quarter_key']
        pdf_path = task['pdf_path']
        pdf_name = task['pdf_name']
        company_name = task['company_name']
        quarter = task['quarter']
        fy = task['fy']
        
        provider = "OpenAI" if openai_key else "Gemini"
        print(f"[{provider}] Processing {ticker} ({company_name}) for {quarter} {fy} - {pdf_name}...")
        
        try:
            # 1. Extract text from PDF
            text = extract_text_from_pdf(pdf_path)
            if len(text.strip()) < 100:
                print(f"Warning: Extracted text for {pdf_name} is too short. Skipping.")
                return

            # 2. Query LLM
            analysis = query_llm_for_analysis(company_name, ticker, quarter, fy, text, gemini_key, openai_key)
            
            # 3. Save result
            with db_lock:
                if ticker not in concalls_db:
                    concalls_db[ticker] = {}
                concalls_db[ticker][quarter_key] = analysis
            
            # 4. Save to disk incrementally
            with write_lock:
                with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                    json.dump(concalls_db, f, indent=2, ensure_ascii=False)
                    
            print(f"Successfully processed and saved {ticker} {quarter_key}.")
            
        except Exception as e:
            print(f"Error processing {ticker} {pdf_name}: {e}")
            time.sleep(5)

    # Use ThreadPoolExecutor with 4 concurrent workers to speed up processing safely
    with ThreadPoolExecutor(max_workers=4) as executor:
        executor.map(process_task, tasks)

    print("\nDone! Ingestion completed.")

if __name__ == '__main__':
    main()
