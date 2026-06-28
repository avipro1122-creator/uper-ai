import React, { useState } from 'react';
import { Shield, Settings, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const TradeModal = ({ isOpen, onClose, symbol, companyName }) => {
  const [activeTab, setActiveTab] = useState('BUY');
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState('MIS'); // Intraday
  const [exchange, setExchange] = useState('NSE');
  
  // Credentials config
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('groww_api_key') || '');
  const [secretKey, setSecretKey] = useState(localStorage.getItem('groww_secret') || '');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderResult, setOrderResult] = useState(null);

  if (!isOpen) return null;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrderResult(null);

    // Save credentials to localStorage for convenience
    if (apiKey) localStorage.setItem('groww_api_key', apiKey);
    if (secretKey) localStorage.setItem('groww_secret', secretKey);

    try {
      const response = await fetch('/api/trade/groww', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          secretKey,
          symbol,
          quantity: Number(quantity),
          transactionType: activeTab,
          product,
          exchange
        })
      });

      const json = await response.json();
      if (json.success) {
        setOrderResult(json.data);
      } else {
        setError(json.error || "Order execution rejected by brokerage.");
      }
    } catch (err) {
      setError("Network error connecting to Groww API.");
    } finally {
      setLoading(false);
    }
  };

  const adjustQty = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-px-4 print-hidden">
      {/* Backdrop */}
      <div 
        className="tw-absolute tw-inset-0 tw-bg-black/75 tw-backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="tw-relative tw-w-full tw-max-w-md tw-bg-[#0c101b] tw-border tw-border-white/[0.08] tw-rounded-xl tw-shadow-2xl tw-overflow-hidden tw-z-10">
        
        {/* Header */}
        <div className="tw-p-5 tw-border-b tw-border-white/[0.06] tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-sm tw-font-bold tw-text-white tw-tracking-wide tw-flex tw-items-center tw-gap-1.5">
              <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-[#00D1B2]" />
              Groww Brokerage Terminal
            </h3>
            <p className="tw-text-[11px] tw-text-slate-400 tw-mt-0.5">{companyName || symbol}</p>
          </div>
          <button 
            onClick={onClose}
            className="tw-text-slate-400 hover:tw-text-white tw-text-sm"
          >
            ✕
          </button>
        </div>

        {orderResult ? (
          /* Success Screen */
          <div className="tw-p-6 tw-flex tw-flex-col tw-items-center tw-text-center tw-gap-4">
            <CheckCircle2 size={48} className="tw-text-[#00D1B2] tw-animate-bounce" />
            <div>
              <h4 className="tw-text-sm tw-font-bold tw-text-white">Order Placed Successfully</h4>
              <p className="tw-text-xs tw-text-[#00D1B2] tw-font-mono tw-mt-1">{orderResult.groww_order_id}</p>
              <p className="tw-text-[11px] tw-text-slate-400 tw-mt-3 tw-leading-relaxed">
                {orderResult.message}
              </p>
            </div>
            
            <div className="tw-w-full tw-bg-white/[0.02] tw-border tw-border-white/[0.04] tw-rounded-lg tw-p-4 tw-text-left tw-space-y-1.5 tw-text-[11px] tw-font-mono">
              <div className="tw-flex tw-justify-between"><span className="tw-text-slate-500">Asset:</span> <span className="tw-text-white">{symbol}</span></div>
              <div className="tw-flex tw-justify-between"><span className="tw-text-slate-500">Type:</span> <span className="tw-text-[#00D1B2] tw-font-bold">{activeTab}</span></div>
              <div className="tw-flex tw-justify-between"><span className="tw-text-slate-500">Quantity:</span> <span className="tw-text-white">{quantity}</span></div>
              <div className="tw-flex tw-justify-between"><span className="tw-text-slate-500">Validity:</span> <span className="tw-text-white">DAY</span></div>
            </div>

            <button 
              onClick={onClose}
              className="tw-w-full tw-py-2 tw-mt-2 tw-bg-[#00D1B2] tw-text-[#06080e] tw-font-bold tw-rounded-lg tw-text-xs hover:tw-brightness-110 tw-transition-all"
            >
              Back to terminal
            </button>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handlePlaceOrder} className="tw-p-5 tw-space-y-4">
            
            {/* Tabs BUY/SELL */}
            <div className="tw-grid tw-grid-cols-2 tw-p-1 tw-bg-white/[0.03] tw-border tw-border-white/[0.06] tw-rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('BUY')}
                className={`tw-py-1.5 tw-text-xs tw-font-bold tw-rounded-md tw-transition-all ${activeTab === 'BUY' ? 'tw-bg-[#00D1B2] tw-text-[#06080e]' : 'tw-text-slate-400 hover:tw-text-white'}`}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SELL')}
                className={`tw-py-1.5 tw-text-xs tw-font-bold tw-rounded-md tw-transition-all ${activeTab === 'SELL' ? 'tw-bg-red-500 tw-text-white' : 'tw-text-slate-400 hover:tw-text-white'}`}
              >
                SELL / SHORT
              </button>
            </div>

            {/* Qty and Exchange controls */}
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div>
                <label className="tw-block tw-text-[10px] tw-text-slate-400 tw-font-bold tw-tracking-wide tw-mb-1.5">QUANTITY</label>
                <div className="tw-flex tw-items-center tw-bg-white/[0.03] tw-border tw-border-white/[0.08] tw-rounded-lg tw-overflow-hidden">
                  <button 
                    type="button" 
                    onClick={() => adjustQty(-1)}
                    className="tw-px-3 tw-py-1.5 tw-text-slate-400 hover:tw-text-white hover:tw-bg-white/5"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="tw-w-full tw-bg-transparent tw-text-center tw-text-xs tw-text-white tw-font-bold tw-outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => adjustQty(1)}
                    className="tw-px-3 tw-py-1.5 tw-text-slate-400 hover:tw-text-white hover:tw-bg-white/5"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="tw-block tw-text-[10px] tw-text-slate-400 tw-font-bold tw-tracking-wide tw-mb-1.5">EXCHANGE</label>
                <div className="tw-grid tw-grid-cols-2 tw-p-1 tw-bg-white/[0.03] tw-border tw-border-white/[0.08] tw-rounded-lg">
                  {['NSE', 'BSE'].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setExchange(ex)}
                      className={`tw-py-1 tw-text-[10px] tw-font-bold tw-rounded ${exchange === ex ? 'tw-bg-white/10 tw-text-white' : 'tw-text-slate-500'}`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Type Intraday / Delivery */}
            <div>
              <label className="tw-block tw-text-[10px] tw-text-slate-400 tw-font-bold tw-tracking-wide tw-mb-1.5">PRODUCT TYPE</label>
              <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                <button
                  type="button"
                  onClick={() => setProduct('MIS')}
                  className={`tw-py-2 tw-px-3 tw-border tw-rounded-lg tw-text-left tw-transition-all ${product === 'MIS' ? 'tw-border-[#00D1B2] tw-bg-[#00D1B2]/5' : 'tw-border-white/[0.06] hover:tw-border-white/10'}`}
                >
                  <span className="tw-block tw-text-xs tw-font-bold tw-text-white">Intraday (MIS)</span>
                  <span className="tw-block tw-text-[9px] tw-text-slate-400 tw-mt-0.5">Auto square-off before 3:20 PM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProduct('CNC')}
                  className={`tw-py-2 tw-px-3 tw-border tw-rounded-lg tw-text-left tw-transition-all ${product === 'CNC' ? 'tw-border-[#00D1B2] tw-bg-[#00D1B2]/5' : 'tw-border-white/[0.06] hover:tw-border-white/10'}`}
                >
                  <span className="tw-block tw-text-xs tw-font-bold tw-text-white">Delivery (CNC)</span>
                  <span className="tw-block tw-text-[9px] tw-text-slate-400 tw-mt-0.5">Hold stocks in your Demat account</span>
                </button>
              </div>
            </div>

            {/* API Config settings (collapsible) */}
            <div className="tw-border-t tw-border-white/[0.06] tw-pt-3">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="tw-flex tw-items-center tw-justify-between tw-w-full tw-text-[10px] tw-text-slate-400 hover:tw-text-white tw-font-bold"
              >
                <span className="tw-flex tw-items-center tw-gap-1.5">
                  <Settings size={12} />
                  API GATEWAY SETTINGS
                </span>
                <span>{showConfig ? '▲' : '▼'}</span>
              </button>

              {showConfig && (
                <div className="tw-space-y-3 tw-mt-3 tw-p-3 tw-bg-white/[0.01] tw-border tw-border-white/[0.04] tw-rounded-lg">
                  <div>
                    <label className="tw-block tw-text-[9px] tw-text-slate-500 tw-font-bold tw-mb-1">GROWW API KEY</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="grw_api_..."
                      className="tw-w-full tw-bg-white/[0.03] tw-border tw-border-white/[0.06] tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-xs tw-text-white tw-outline-none focus:tw-border-[#00D1B2]/50"
                    />
                  </div>
                  <div>
                    <label className="tw-block tw-text-[9px] tw-text-slate-500 tw-font-bold tw-mb-1">GROWW SECRET KEY</label>
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="grw_sec_..."
                      className="tw-w-full tw-bg-white/[0.03] tw-border tw-border-white/[0.06] tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-xs tw-text-white tw-outline-none focus:tw-border-[#00D1B2]/50"
                    />
                  </div>
                  <p className="tw-text-[9px] tw-text-slate-500 tw-leading-relaxed tw-flex tw-items-start tw-gap-1">
                    <Shield size={10} className="tw-mt-0.5 tw-shrink-0" />
                    Credentials are saved in your local browser storage and processed securely in the API proxy.
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="tw-flex tw-items-start tw-gap-2 tw-p-3 tw-bg-red-500/10 tw-border tw-border-red-500/20 tw-rounded-lg tw-text-xs tw-text-red-400">
                <AlertCircle size={14} className="tw-shrink-0 tw-mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`tw-w-full tw-py-2.5 tw-font-bold tw-rounded-lg tw-text-xs tw-transition-all tw-flex tw-items-center tw-justify-center tw-gap-1.5 ${
                loading 
                  ? 'tw-bg-white/5 tw-text-slate-400 tw-cursor-not-allowed'
                  : activeTab === 'BUY'
                    ? 'tw-bg-[#00D1B2] tw-text-[#06080e] hover:tw-brightness-110'
                    : 'tw-bg-red-500 tw-text-white hover:tw-brightness-110'
              }`}
            >
              {loading ? (
                <>
                  <svg className="tw-animate-spin tw-h-3 tw-w-3 tw-text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Transmitting Order...</span>
                </>
              ) : (
                <>
                  <span>TRANSMIT {activeTab} ORDER</span>
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
