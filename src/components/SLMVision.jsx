import React, { useState } from 'react';
import { Cpu, Terminal, Zap, Gauge, Award, Layers } from 'lucide-react';

export default function SLMVision() {
  const [inputText, setInputText] = useState(
    "Reliance announced ₹15,400 Crore capex for green hydrogen and 45 Lakh subscriber ads in Q4 FY25."
  );
  const [tokens, setTokens] = useState([]);
  const [isTokenized, setIsTokenized] = useState(false);

  const handleTokenize = () => {
    // A simple mock parser simulating Indian financial tokenization rules
    const words = inputText.split(/(\s+)/);
    const parsedTokens = [];
    
    let currentIdx = 0;
    for (let i = 0; i < words.length; i++) {
      const part = words[i];
      if (part.trim() === "") continue;
      
      let type = "word";
      let subtext = "Token";
      let colorClass = "rgba(255,255,255,0.05)";
      let textColor = "var(--text-secondary)";
      
      // Checking for Indian currency phrases (Crore, Lakh, ₹)
      if (
        part.includes("₹") || 
        part.toLowerCase().includes("crore") || 
        part.toLowerCase().includes("lakh") ||
        (i > 0 && words[i - 2] && (words[i].toLowerCase() === "crore" || words[i].toLowerCase() === "lakh"))
      ) {
        type = "currency";
        subtext = "IN Financial Num";
        colorClass = "rgba(16, 185, 129, 0.15)";
        textColor = "#10b981";
      } 
      // Checking for Ticker symbols / Companies
      else if (
        part.toLowerCase() === "reliance" || 
        part.toLowerCase() === "ril" || 
        part.toLowerCase() === "tata" || 
        part.toLowerCase() === "hdfc"
      ) {
        type = "ticker";
        subtext = "Equity Ticker";
        colorClass = "rgba(56, 189, 248, 0.15)";
        textColor = "#38bdf8";
      }
      // Checking for Fiscal Dates (Q4, FY25, etc.)
      else if (
        part.toUpperCase().includes("Q1") || 
        part.toUpperCase().includes("Q2") || 
        part.toUpperCase().includes("Q3") || 
        part.toUpperCase().includes("Q4") || 
        part.toUpperCase().includes("FY")
      ) {
        type = "fiscal";
        subtext = "Fiscal Period";
        colorClass = "rgba(167, 139, 250, 0.15)";
        textColor = "#c084fc";
      }
      // Financial concepts
      else if (
        part.toLowerCase() === "capex" || 
        part.toLowerCase() === "ebitda" || 
        part.toLowerCase() === "pat" || 
        part.toLowerCase() === "revenue"
      ) {
        type = "concept";
        subtext = "Finance Concept";
        colorClass = "rgba(251, 191, 36, 0.15)";
        textColor = "#fbbf24";
      }

      parsedTokens.push({
        text: part,
        type,
        subtext,
        bg: colorClass,
        color: textColor
      });
    }

    setTokens(parsedTokens);
    setIsTokenized(true);
  };

  const performanceMetrics = [
    { label: "Inference Latency (lower is better)", val1: "850ms", val2: "65ms", pct1: 100, pct2: 7.6, label1: "Llama-3-70B", label2: "Uper SLM (4.8B)" },
    { label: "Token Efficiency for Indian Financial Jargon", val1: "340 tokens", val2: "112 tokens", pct1: 33, pct2: 100, label1: "Standard Tokenizer", label2: "Uper Custom Tokenizer" },
    { label: "Indian Tax Code Compliance Score", val1: "74%", val2: "98.5%", pct1: 74, pct2: 98.5, label1: "GPT-4o", label2: "Uper SLM (4.8B)" }
  ];

  return (
    <div className="slm-container">
      {/* Header section */}
      <div className="slm-header">
        <h1>Uper SLM Roadmap & Vision</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '800px', lineHeight: '1.6' }}>
          Building a proprietary 4.8-Billion parameter Small Language Model specialized exclusively for Indian Equities, regulatory compliance, and multi-source financial statements.
        </p>
      </div>

      <div className="slm-grid-2">
        {/* Core Description & Benchmarks */}
        <div className="slm-card">
          <h2>
            <Gauge size={20} style={{ color: 'var(--accent-color)' }} />
            Performance Benchmarks
          </h2>
          <p>
            Standard LLMs struggle with Indian counting notations (Lakhs/Crores), local regulatory filings (SEBI/MCA), and have latency profiles unsuitable for high-frequency user conversations.
          </p>
          
          <div className="perf-comparison-bar">
            {performanceMetrics.map((metric, i) => (
              <div className="bar-wrapper" key={i}>
                <div className="bar-labels">
                  <span>{metric.label}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '6px 0' }}>
                  {/* Model 1 Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{metric.label1}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{metric.val1}</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${metric.pct1}%`, background: 'var(--text-muted)' }} />
                  </div>
                  
                  {/* Uper SLM Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--accent-color)' }}>{metric.label2}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)' }}>{metric.val2}</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${metric.pct2}%`, background: 'var(--accent-gradient)' }} />
                  </div>
                </div>
                {i < performanceMetrics.length - 1 && <div style={{ borderBottom: '1px solid var(--border-subtle)', margin: '12px 0 6px 0' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Tokenizer Sandbox */}
        <div className="slm-card">
          <h2>
            <Terminal size={20} style={{ color: 'var(--accent-color)' }} />
            Indian Financial Tokenizer Sandbox
          </h2>
          <p>
            Test how our specialized model tokenizes Indian numeric formats and equity terms natively, reducing context footprint and computational costs.
          </p>

          <div className="tokenizer-demo">
            <div className="tokenizer-input-group">
              <input
                type="text"
                className="tokenizer-field"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a financial sentence..."
              />
              <button className="tokenizer-btn" onClick={handleTokenize}>
                Tokenize
              </button>
            </div>

            <div className="tokenizer-tokens-wrapper">
              {!isTokenized ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto' }}>
                  Click Tokenize to analyze tokens...
                </div>
              ) : (
                tokens.map((tok, i) => (
                  <div
                    key={i}
                    className="token-pill"
                    style={{
                      backgroundColor: tok.bg,
                      color: tok.color,
                      borderColor: tok.color + "25"
                    }}
                  >
                    <span>{tok.text}</span>
                    <span className="token-subtext">{tok.subtext}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Model Development Timeline */}
      <div className="slm-card" style={{ width: '100%' }}>
        <h2>
          <Layers size={20} style={{ color: 'var(--accent-color)' }} />
          Model Architecture & Training Roadmap
        </h2>
        <p style={{ marginBottom: '24px' }}>
          Uper SLM uses a RoPE attention module with custom vocab extensions. Our timeline transitions from baseline token alignment to direct integration with brokerage order blocks.
        </p>

        <div className="roadmap-timeline">
          <div className="timeline-milestone active">
            <div className="milestone-dot">1</div>
            <div className="milestone-content">
              <h3>Phase 1: Pretraining & Token Alignment (Completed)</h3>
              <p>Aligned model weights on 400 Billion tokens of SEBI corporate disclosures, MCA company records, and BSE/NSE pricing history.</p>
            </div>
          </div>

          <div className="timeline-milestone active">
            <div className="milestone-dot">2</div>
            <div className="milestone-content">
              <h3>Phase 2: Analyst RLHF & Instruction Tuning (Active)</h3>
              <p>Aligning model responses with leading equity research desks and charter financial analysts for reasoning accuracy.</p>
            </div>
          </div>

          <div className="timeline-milestone">
            <div className="milestone-dot">3</div>
            <div className="milestone-content">
              <h3>Phase 3: Edge Slicing & Sub-100ms Inference (Preview)</h3>
              <p>Optimizing model weights to 4-bit quantizations, allowing sub-100ms streaming responses natively on client dashboards.</p>
            </div>
          </div>

          <div className="timeline-milestone">
            <div className="milestone-dot">4</div>
            <div className="milestone-content">
              <h3>Phase 4: Agentic Trading Executions (Upcoming)</h3>
              <p>Integrating direct API connections to leading Indian brokerages (Zerodha, Groww, AngelOne) for conversation-initiated trade orders.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
