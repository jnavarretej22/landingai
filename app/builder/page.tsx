"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Chat from '@/components/Chat';
import PreviewFrame from '@/components/PreviewFrame';
import DownloadButton from '@/components/DownloadButton';
import TemplateSelector, { TemplateStyle } from '@/components/TemplateSelector';
import { Message } from '@/lib/types';
import Link from 'next/link';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

const WS_NUMBER = "5930939667369";
const WS_MESSAGE = encodeURIComponent("Hola! Me interesa que diseñen mi página web profesional 🚀");
const WS_URL = `https://wa.me/${WS_NUMBER}?text=${WS_MESSAGE}`;

const STORAGE_HTML      = 'minegocio_html';
const STORAGE_TEMPLATE  = 'minegocio_template';
const CLEANUP_ENDPOINT  = '/api/upload/cleanup';

export default function BuilderPage() {
  const [html,              setHtml]              = useState<string>('');
  const [isGenerating,      setIsGenerating]      = useState(false);
  const [chatKey,           setChatKey]           = useState(0);
  const [selectedTemplate,  setSelectedTemplate]  = useState<TemplateStyle | 'ai' | null>(null);
  // Track uploaded image URLs for server-side cleanup
  const [uploadedUrls,      setUploadedUrls]      = useState<string[]>([]);

  // ── Restore state on mount ────────────────────────────
  useEffect(() => {
    try {
      const savedHtml     = sessionStorage.getItem(STORAGE_HTML);
      const savedTemplate = sessionStorage.getItem(STORAGE_TEMPLATE);
      if (savedHtml)     setHtml(savedHtml);
      if (savedTemplate) setSelectedTemplate(savedTemplate as TemplateStyle | 'ai');
    } catch { /* sessionStorage unavailable */ }
  }, []);

  // ── Persist html ──────────────────────────────────────
  useEffect(() => {
    try { if (html) sessionStorage.setItem(STORAGE_HTML, html); }
    catch { }
  }, [html]);

  // ── Delete uploads when page closes / navigates away ─
  useEffect(() => {
    const handleUnload = () => {
      if (uploadedUrls.length === 0) return;
      // sendBeacon is the only API that works reliably during page unload
      navigator.sendBeacon(
        CLEANUP_ENDPOINT,
        new Blob([JSON.stringify({ urls: uploadedUrls })], { type: 'application/json' })
      );
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [uploadedUrls]);

  // ── Template selection handler ────────────────────────
  const handleTemplateSelect = useCallback((style: TemplateStyle | null) => {
    const value = style ?? 'ai';
    setSelectedTemplate(value);
    try { sessionStorage.setItem(STORAGE_TEMPLATE, value); }
    catch { }
  }, []);

  // ── Generate handler ──────────────────────────────────
  const handleGenerate = useCallback(async (messages: Message[], images: string[] = [], logo?: string | null) => {
    setIsGenerating(true);
    try {
      const res  = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages,
          images,
          logo,
          // Pass the user-selected template to the API (undefined if AI decides)
          forcedTemplate: selectedTemplate && selectedTemplate !== 'ai' ? selectedTemplate : undefined,
        }),
      });
      const data = await res.json();

      if (res.ok && data.html) {
        setHtml(data.html);
      } else {
        const ERR_MSGS: Record<string, string> = {
          rate_limit:     '⚠️ Servicio saturado. Espera un minuto e intenta de nuevo.',
          template_error: '❌ Error de plantilla. Por favor intenta de nuevo.',
          parse_error:    '❌ Error interno al generar. Por favor intenta de nuevo.',
        };
        alert(ERR_MSGS[data.code] || data.error || 'Error en la generación');
      }
    } catch {
      alert('Error de red durante la generación');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate]);

  // ── "Nuevo proyecto" ──────────────────────────────────
  const handleNewProject = useCallback(() => {
    if (!confirm('¿Empezar un nuevo proyecto? Se perderá la conversación y el diseño actual.')) return;
    try {
      ['minegocio_html', 'minegocio_template', 'minegocio_messages', 'minegocio_image_urls']
        .forEach(k => sessionStorage.removeItem(k));
    } catch { }
    setHtml('');
    setUploadedUrls([]);
    setSelectedTemplate(null);
    setChatKey(k => k + 1);
  }, []);

  // ── Step 1: Template selector ─────────────────────────
  if (selectedTemplate === null) {
    return <TemplateSelector onSelect={handleTemplateSelect} />;
  }

  // ── Step 2: Main builder ──────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] shrink-0 z-10">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 hover:opacity-80 transition-opacity"
          >
            MiNegocioDigital
          </Link>
          <span className="text-gray-300 font-light text-2xl">|</span>
          <h2 className="text-slate-600 font-semibold tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Estudio de creación
          </h2>

          {/* Template badge */}
          {selectedTemplate !== 'ai' && (
            <button
              onClick={() => setSelectedTemplate(null)}
              className="flex items-center gap-1.5 ml-2 text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-colors"
              title="Cambiar plantilla"
            >
              <span>🎨</span>
              {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)}
              <span className="text-indigo-400 ml-0.5">✎</span>
            </button>
          )}

          {selectedTemplate === 'ai' && (
            <button
              onClick={() => setSelectedTemplate(null)}
              className="flex items-center gap-1.5 ml-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 transition-colors"
              title="Seleccionar plantilla"
            >
              🤖 IA decide · cambiar
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNewProject}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo proyecto
          </button>
          <DownloadButton
            html={html}
            uploadedUrls={uploadedUrls}
            onCleaned={() => setUploadedUrls([])}
          />
        </div>
      </header>

      {/* Floating Banner */}
      <div className="pro-banner">
        <span>¿Quieres algo más profesional?</span>
        <a href={WS_URL} target="_blank" rel="noopener" className="pro-banner-btn">
          <WhatsAppIcon size={14} />
          Nosotros Diseñamos por Ti
        </a>
      </div>

      <main className="flex-1 overflow-hidden p-6 relative">
        <div className="absolute inset-0 bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="flex h-full gap-6 relative z-10">
          {/* Left Panel: Chat */}
          <div className="w-1/3 flex flex-col h-full shrink-0 shadow-lg rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm border border-white/50">
            <Chat
              key={chatKey}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              onImageUpload={(url) => setUploadedUrls(prev => [...prev, url])}
            />

            {/* Professional Card below chat */}
            <div className="pro-card">
              <p>💡 ¿Quieres un diseño 100% personalizado?</p>
              <a href={WS_URL} target="_blank" rel="noopener" className="pro-card-btn">
                <WhatsAppIcon size={14} />
                Contáctanos — Diseñamos por Ti
              </a>
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="w-2/3 flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-slate-100 border-b border-gray-200 px-4 py-3 flex items-center shrink-0">
              <div className="flex space-x-2">
                <div className="w-3.5 h-3.5 rounded-full bg-red-400 shadow-sm border border-red-500/20" />
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm border border-amber-500/20" />
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-sm border border-emerald-500/20" />
              </div>
              <div className="mx-auto flex items-center justify-center bg-white px-32 py-1.5 rounded-md shadow-sm border border-gray-200 text-xs text-slate-500 font-medium">
                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                minegociodigital.app/vista-previa
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-white">
              <PreviewFrame html={html} isGenerating={isGenerating} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
