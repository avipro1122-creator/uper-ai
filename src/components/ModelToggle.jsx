import React from 'react';
import { Sparkles, Zap, Cpu } from 'lucide-react';

export default function ModelToggle({ activeModel, onChange }) {
  const models = [
    {
      id: 'gemini',
      name: 'Gemini Pro',
      icon: Sparkles,
      desc: 'Deep financial analysis',
      stats: 'Multimodal / 2M Context'
    },
    {
      id: 'xai',
      name: 'xAI Grok',
      icon: Zap,
      desc: 'Real-time social sentiment',
      stats: 'High-frequency signals'
    },
    {
      id: 'slm',
      name: 'Uper SLM (Preview)',
      icon: Cpu,
      desc: 'Proprietary Indian Equities model',
      stats: 'Sub-100ms local inference'
    }
  ];

  return (
    <div className="model-selector-bar">
      {models.map((model) => {
        const IconComponent = model.icon;
        const isActive = activeModel === model.id;
        return (
          <button
            key={model.id}
            className={`model-option ${isActive ? 'active' : ''}`}
            onClick={() => onChange(model.id)}
            title={`${model.desc} (${model.stats})`}
          >
            <IconComponent size={14} />
            <span>{model.name}</span>
          </button>
        );
      })}
    </div>
  );
}
