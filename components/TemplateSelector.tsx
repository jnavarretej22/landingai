"use client";

import React, { useState } from 'react';

export type TemplateStyle = 'glass' | 'brutal' | 'editorial' | 'neon' | 'organic' | 'default';

interface Template {
  id: TemplateStyle;
  name: string;
  tagline: string;
  tags: string[];
  icon: string;
  gradient: string;
  accentColor: string;
  bgPreview: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'glass',
    name: 'Glass',
    tagline: 'Elegancia translúcida',
    tags: ['Tech', 'Apps', 'Startups', 'Fotografía'],
    icon: '💠',
    gradient: 'from-blue-600/30 via-cyan-500/20 to-indigo-600/30',
    accentColor: '#00D4FF',
    bgPreview: '#050510',
  },
  {
    id: 'brutal',
    name: 'Brutal',
    tagline: 'Audaz sin límites',
    tags: ['Moda urbana', 'Música', 'Tattoo', 'Streetwear'],
    icon: '⚡',
    gradient: 'from-yellow-400/30 via-orange-500/20 to-red-500/30',
    accentColor: '#FACC15',
    bgPreview: '#0a0a0a',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    tagline: 'Autoridad y claridad',
    tags: ['Abogados', 'Coaches', 'Finanzas', 'Consultoras'],
    icon: '📐',
    gradient: 'from-slate-600/30 via-gray-500/20 to-zinc-600/30',
    accentColor: '#7B6CF6',
    bgPreview: '#08080f',
  },
  {
    id: 'neon',
    name: 'Neon',
    tagline: 'Energía futurista',
    tags: ['Gaming', 'Crypto', 'Clubs', 'Electrónica'],
    icon: '🎮',
    gradient: 'from-green-400/30 via-emerald-500/20 to-cyan-500/30',
    accentColor: '#39FF14',
    bgPreview: '#030a03',
  },
  {
    id: 'organic',
    name: 'Organic',
    tagline: 'Naturaleza y calidez',
    tags: ['Restaurantes', 'Spas', 'Flores', 'Bienestar'],
    icon: '🌿',
    gradient: 'from-green-600/30 via-lime-500/20 to-emerald-600/30',
    accentColor: '#A8E6CF',
    bgPreview: '#06100a',
  },
  {
    id: 'default',
    name: 'Clásico',
    tagline: 'Versátil y efectivo',
    tags: ['Tiendas', 'Delivery', 'Zapatos', 'Ropa'],
    icon: '🏪',
    gradient: 'from-orange-500/30 via-amber-500/20 to-red-500/30',
    accentColor: '#FF4D00',
    bgPreview: '#0a0800',
  },
];

interface TemplateSelectorProps {
  onSelect: (style: TemplateStyle | null) => void;
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [hovered,  setHovered]  = useState<TemplateStyle | null>(null);
  const [selected, setSelected] = useState<TemplateStyle | null>(null);

  const handleConfirm = () => onSelect(selected);
  const handleSkip    = () => onSelect(null);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-slate-400 font-medium mb-6">
            ✦ Paso 1 de 2
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-4">
            Elige tu estilo<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
              visual
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Selecciona la plantilla que mejor represente tu negocio.
            La IA puede ajustar colores y contenido automáticamente.
          </p>
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {TEMPLATES.map((t) => {
            const isSelected = selected === t.id;
            const isHovered  = hovered  === t.id;

            return (
              <button
                key={t.id}
                onClick={() => setSelected(isSelected ? null : t.id)}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
                className={`group relative rounded-2xl p-5 text-left transition-all duration-300 overflow-hidden border ${
                  isSelected
                    ? 'border-white/40 scale-[1.02] shadow-2xl'
                    : isHovered
                    ? 'border-white/20 scale-[1.01]'
                    : 'border-white/8 hover:border-white/20'
                }`}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, ${t.bgPreview}ee, ${t.bgPreview}cc)`
                    : `linear-gradient(135deg, ${t.bgPreview}cc, ${t.bgPreview}99)`,
                  boxShadow: isSelected
                    ? `0 0 40px ${t.accentColor}33, 0 20px 60px rgba(0,0,0,0.5)`
                    : isHovered
                    ? `0 0 20px ${t.accentColor}22, 0 10px 30px rgba(0,0,0,0.4)`
                    : '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                {/* Gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${t.gradient} transition-opacity duration-300 ${
                    isSelected || isHovered ? 'opacity-100' : 'opacity-40'
                  }`}
                />

                {/* Selected checkmark */}
                {isSelected && (
                  <div
                    className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black z-10"
                    style={{ background: t.accentColor }}
                  >
                    ✓
                  </div>
                )}

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{
                        background: `${t.accentColor}22`,
                        border: `1px solid ${t.accentColor}44`,
                      }}
                    >
                      {t.icon}
                    </div>
                    <div>
                      <div className="text-white font-bold text-base leading-tight">{t.name}</div>
                      <div className="text-xs font-medium" style={{ color: t.accentColor }}>
                        {t.tagline}
                      </div>
                    </div>
                  </div>

                  {/* Visual preview bar */}
                  <div
                    className="w-full h-1.5 rounded-full mb-3 opacity-70"
                    style={{
                      background: `linear-gradient(to right, ${t.accentColor}, ${t.accentColor}44)`,
                    }}
                  />

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {t.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${t.accentColor}18`,
                          color: `${t.accentColor}cc`,
                          border: `1px solid ${t.accentColor}30`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleSkip}
            className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors px-5 py-2.5 rounded-xl hover:bg-white/5"
          >
            Dejar que la IA decida →
          </button>

          <button
            onClick={handleConfirm}
            disabled={!selected}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-base transition-all duration-300 ${
              selected
                ? 'bg-white text-slate-950 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            Continuar con {selected ? TEMPLATES.find(t => t.id === selected)?.name : 'estilo'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
