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
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [toolbarOpen,       setToolbarOpen]       = useState(false);
  const [autoOpenBlocked,  setAutoOpenBlocked]   = useState(false);
  const [previewUrl,        setPreviewUrl]        = useState<string | null>(null);
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
    // Clean up previous preview URL
    setAutoOpenBlocked(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

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

        // Auto-open generated page in new tab
        const blob = new Blob([data.html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const newTab = window.open(url, '_blank');

        if (!newTab || newTab.closed) {
          // Fallback: popup blocked
          setAutoOpenBlocked(true);
          setPreviewUrl(url);
        }

        // Revoke URL after 5 minutes to free memory
        setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
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
  }, [selectedTemplate, previewUrl]);

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
  const templateDisplay = selectedTemplate === 'ai'
    ? 'Plantilla IA'
    : selectedTemplate
    ? `${selectedTemplate.charAt(0).toUpperCase()}${selectedTemplate.slice(1)}`
    : 'Seleccionar plantilla';

  return (
    <>
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] shrink-0 z-10">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 hover:opacity-80 transition-opacity"
          >
            MiNegocioDigital
          </Link>
          <span className="text-gray-300 font-light text-2xl hidden sm:inline">|</span>
          <h2 className="text-slate-600 font-semibold tracking-wide flex items-center gap-2 text-base sm:text-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Estudio de creación
          </h2>
        </div>

        <div className="hidden md:flex w-full md:w-auto flex-wrap gap-2 justify-center md:justify-end">
            <button
              onClick={handleNewProject}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors font-medium w-full md:w-auto justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo proyecto
          </button>
          <div className="w-full md:w-auto flex justify-center">
            <DownloadButton
              html={html}
              uploadedUrls={uploadedUrls}
              onCleaned={() => setUploadedUrls([])}
            />
          </div>
          </div>
        <button
          type="button"
          className="md:hidden bg-slate-900 text-white px-4 py-2 rounded-full shadow border border-white/10"
          onClick={() => setToolbarOpen(true)}
        >
          ☰ Opciones
        </button>
      </header>

      <main className="flex-1 overflow-hidden p-6 relative">
        <div className="absolute inset-0 bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="flex flex-col lg:flex-row h-full gap-5 relative z-10">
          {/* Left Panel: Chat */}
          <div className="flex-1 w-full lg:flex-[0.42] min-w-[300px] flex flex-col h-full shadow-lg rounded-xl bg-white/80 backdrop-blur-sm border border-white/60">
            <div className="flex-1 min-h-0 overflow-hidden">
              <Chat
                key={chatKey}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                onImageUpload={(url) => setUploadedUrls(prev => [...prev, url])}
                templateLabel={templateDisplay}
                onTemplateChange={() => setSelectedTemplate(null)}
              />
            </div>
          <div className="pro-card desktop-only">
              <div className="pro-card-copy">
                <p className="pro-card-eyebrow">Servicio experto</p>
                <p className="pro-card-title">💡 ¿Quieres un diseño 100% personalizado?</p>
                <p className="pro-card-sub">Nuestro equipo puede crear tu sitio completo, listo para publicar.</p>
              </div>
              <a href={WS_URL} target="_blank" rel="noopener" className="pro-card-btn">
                <WhatsAppIcon size={14} />
                Hablemos
              </a>
            </div>
            <div className="lg:hidden mt-3 space-y-2">
              {isGenerating && (
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 animate-pulse py-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generando tu landing page...
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-full text-sm font-semibold text-white bg-slate-900 px-4 py-2.5 rounded-lg border border-white/10 shadow-sm"
                  onClick={() => setShowPreviewMobile(true)}
                >
                  Visualizar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-full text-sm font-semibold text-white bg-[#6366F1] px-4 py-2.5 rounded-lg shadow disabled:opacity-50"
                  onClick={() => window.dispatchEvent(new Event('requestChatGenerate'))}
                  disabled={isGenerating}
                >
                  Generar web
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="hidden w-full lg:flex-[0.58] lg:flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
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
            {autoOpenBlocked && previewUrl && (
              <div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver mi página en nueva pestaña →
                </a>
              </div>
            )}
          </div>
        </div>
        {showPreviewMobile && (
          <div className="fixed inset-0 z-50 bg-black/70 lg:hidden flex items-center justify-center px-4 py-6">
            <div className="relative w-full max-w-3xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-semibold text-slate-700">Vista previa de tu landing</p>
                <button
                  type="button"
                  onClick={() => setShowPreviewMobile(false)}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cerrar ✕
                </button>
              </div>
              {autoOpenBlocked && previewUrl && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver mi página en nueva pestaña →
                  </a>
                </div>
              )}
              <div className="flex-1 overflow-hidden bg-white">
                <PreviewFrame html={html} isGenerating={isGenerating} />
              </div>
            </div>
          </div>
        )}
        {toolbarOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setToolbarOpen(false)} />
            <div className="mobile-toolbar-sheet fixed inset-x-0 top-0 z-50 lg:hidden">
              <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-5" />
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { handleNewProject(); setToolbarOpen(false); }}
                  className="w-full bg-white text-slate-900 font-semibold text-base px-4 py-3 rounded-xl"
                >
                  Nuevo proyecto
                </button>
                <div className="mobile-toolbar-download w-full">
                  <DownloadButton
                    html={html}
                    uploadedUrls={uploadedUrls}
                    onCleaned={() => setUploadedUrls([])}
                  />
                </div>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') window.dispatchEvent(new Event('openChatPhotos'));
                    setToolbarOpen(false);
                  }}
                  className="w-full bg-white/10 border border-white/20 text-white font-semibold text-base px-4 py-3 rounded-xl"
                >
                  📷 Fotos
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') window.dispatchEvent(new Event('openChatLogo'));
                    setToolbarOpen(false);
                  }}
                  className="w-full bg-white/10 border border-white/20 text-white font-semibold text-base px-4 py-3 rounded-xl"
                >
                  🏷️ Logo
                </button>
                <a
                  href={WS_URL}
                  target="_blank"
                  rel="noopener"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] text-slate-900 font-semibold text-base px-4 py-3 rounded-xl"
                >
                  <WhatsAppIcon size={16} /> Nosotros diseñamos por ti
                </a>
                <button
                  onClick={() => { setShowPreviewMobile(true); setToolbarOpen(false); }}
                  className="w-full bg-indigo-500 text-white font-semibold text-base px-4 py-3 rounded-xl"
                >
                  Visualizar página
                </button>
                {autoOpenBlocked && previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener"
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base px-4 py-3 rounded-xl"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver mi página en nueva pestaña
                  </a>
                )}
                <button
                  onClick={() => setToolbarOpen(false)}
                  className="w-full text-white/70 text-sm mt-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
    <style jsx global>{`
      @media (max-width: 768px) {
        .chat-messages { min-height: 55vh; }
        .chat-bubble { padding: 14px 16px !important; }
        .chat-bubble-text { font-size: 15px !important; line-height: 1.6 !important; }
        .chat-input { font-size: 16px !important; height: 52px !important; }
        .typing-dot { transform: scale(1.3); }
        .mobile-toolbar-sheet {
          background: #1a1a2e;
          border-radius: 20px 20px 0 0;
          padding: 24px 20px 28px;
          box-shadow: 0 -8px 32px rgba(0,0,0,0.4);
          transform: translateY(0);
          transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .desktop-only { display: none !important; }
        .mobile-toolbar-download > div {
          flex-direction: column;
          width: 100%;
          gap: 12px;
        }
        .mobile-toolbar-download .publish-btn,
        .mobile-toolbar-download button:last-child {
          width: 100%;
          justify-content: center;
          border-radius: 12px;
          padding: 16px;
          font-size: 16px;
        }
      }
    `}</style>
    </>
  );
}
