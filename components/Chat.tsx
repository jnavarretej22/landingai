"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Message } from '@/lib/types';
import ImageUploader from './ImageUploader';
import LogoUploader from './LogoUploader';

const STORAGE_MESSAGES   = 'minegocio_messages';
const STORAGE_IMG_URLS   = 'minegocio_image_urls';

interface UploadedImage {
  url: string;
  base64: string;
  isEphemeral?: boolean;
}

interface ChatProps {
  onGenerate: (messages: Message[], images: string[], logo?: string | null) => void;
  isGenerating: boolean;
  onImageUpload?: (url: string) => void;
  templateLabel?: string;
  onTemplateChange?: () => void;
}

const READY_PATTERNS = [
  'generando tu landing page',
  'creando tu página',
  'lista para generar',
  'suficiente información',
  'voy a crear',
  'generaré tu',
  'ya tengo todo lo que necesito',
];

function detectReadySignal(text: string): boolean {
  const lower = text.toLowerCase();
  return READY_PATTERNS.some(p => lower.includes(p));
}

const ERROR_MESSAGES: Record<string, string> = {
  rate_limit:     '⚠️ Servicio ocupado. Espera un momento e intenta de nuevo.',
  parse_error:    '❌ Error interno. Por favor intenta de nuevo.',
  template_error: '❌ Error de plantilla. Por favor intenta de nuevo.',
  upload_error:   '❌ Error al subir imagen. Intenta con otra foto.',
};

export default function Chat({ onGenerate, isGenerating, onImageUpload }: ChatProps) {
  const INITIAL_MSG: Message[] = [
    { role: 'assistant', content: '¡Hola! Soy el asistente de MiNegocioDigital. Voy a ayudarte a crear la página web de tu negocio. ¿Cuál es el nombre de tu negocio?' },
  ];

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_MESSAGES);
      return saved ? (JSON.parse(saved) as Message[]) : INITIAL_MSG;
    } catch { return INITIAL_MSG; }
  });
  const [input,           setInput]           = useState('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [uploadedImages,  setUploadedImages]  = useState<UploadedImage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_IMG_URLS);
      // Restore URL-only previews (base64 is not stored)
      const urls: string[] = saved ? JSON.parse(saved) : [];
      return urls.map(url => ({ url, base64: '' }));
    } catch { return []; }
  });
const [rateLimitTimer,  setRateLimitTimer]  = useState<number | null>(null);
const [logoDecision,    setLogoDecision]    = useState<'yes' | 'no' | null>('no');
const [logoImage,       setLogoImage]       = useState<UploadedImage | null>(null);
const [pendingAutoMsgs, setPendingAutoMsgs] = useState<Message[] | null>(null);
const [showImageUploader, setShowImageUploader] = useState(false);
const [showLogoUploader,  setShowLogoUploader]  = useState(false);

const isLogoStepSatisfied = logoDecision === 'no' || (logoDecision === 'yes' && Boolean(logoImage));

const handleManualGenerate = useCallback(() => {
  if (!isLogoStepSatisfied) return;
  const sanitized = messages.filter(m => m.content !== '');
  onGenerate(sanitized, uploadedImages.map(i => i.base64), logoImage?.base64 || null);
}, [isLogoStepSatisfied, messages, uploadedImages, logoImage, onGenerate]);

  useEffect(() => {
    const handleOpenPhotos = () => {
      setShowImageUploader(true);
      setShowLogoUploader(false);
    };
    const handleOpenLogo = () => {
      setShowLogoUploader(true);
      setShowImageUploader(false);
    };
    const handleRequestGenerate = () => {
      handleManualGenerate();
    };
    window.addEventListener('openChatPhotos', handleOpenPhotos);
    window.addEventListener('openChatLogo', handleOpenLogo);
    window.addEventListener('requestChatGenerate', handleRequestGenerate);
    return () => {
      window.removeEventListener('openChatPhotos', handleOpenPhotos);
      window.removeEventListener('openChatLogo', handleOpenLogo);
      window.removeEventListener('requestChatGenerate', handleRequestGenerate);
    };
  }, [handleManualGenerate]);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const latestMessages  = useRef<Message[]>(messages);
  const abortRef        = useRef<AbortController | null>(null);

  // Keep ref in sync for use inside stream callbacks
  useEffect(() => { latestMessages.current = messages; }, [messages]);

  // Persist messages to sessionStorage on every change
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages)); }
    catch { }
  }, [messages]);

  // Persist uploaded image URLs (not base64) on every change
  useEffect(() => {
    try {
      const urls = uploadedImages
        .map(i => i.url)
        .filter((url): url is string => Boolean(url) && url.startsWith('/uploads/'));
      sessionStorage.setItem(STORAGE_IMG_URLS, JSON.stringify(urls));
    } catch { }
  }, [uploadedImages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Rate limit countdown
  useEffect(() => {
    if (rateLimitTimer !== null && rateLimitTimer > 0) {
      const t = setTimeout(() => setRateLimitTimer(c => (c ?? 1) - 1), 1000);
      return () => clearTimeout(t);
    }
    if (rateLimitTimer === 0) setRateLimitTimer(null);
  }, [rateLimitTimer]);

  useEffect(() => {
    if (pendingAutoMsgs && isLogoStepSatisfied) {
      onGenerate(
        pendingAutoMsgs,
        uploadedImages.map(i => i.base64),
        logoImage?.base64 || null
      );
      setPendingAutoMsgs(null);
    }
  }, [pendingAutoMsgs, isLogoStepSatisfied, uploadedImages, logoImage, onGenerate]);

  const sendMessage = async (userContent: string, retryMsgs?: Message[]) => {
    if (isLoading) return;

    // Abort any previous in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    // Build message list for the API call
    const baseMessages: Message[] = retryMsgs ?? [
      ...latestMessages.current,
      { role: 'user', content: userContent },
    ];

    // Optimistically add user msg + empty assistant placeholder
    if (!retryMsgs) {
      setMessages([...baseMessages, { role: 'assistant', content: '' }]);
    } else {
      setMessages([...baseMessages, { role: 'assistant', content: '' }]);
    }

    setIsLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: baseMessages }),
        signal:  abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      let finalMessages = [...baseMessages, { role: 'assistant' as const, content: '' }];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? ''; // keep incomplete chunk

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.token) {
              // Append token to last assistant message in real time
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + data.token,
                };
                finalMessages = updated;
                return updated;
              });
            }

            if (data.error) {
              const code = data.code || 'parse_error';
              if (code === 'rate_limit') setRateLimitTimer(60);
              const errText = ERROR_MESSAGES[code] || data.error;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: errText };
                return updated;
              });
              setIsLoading(false);
              return;
            }

            if (data.done) {
              setIsLoading(false);
              const isAssistantReady = data.isReady || detectReadySignal(finalMessages[finalMessages.length - 1]?.content ?? '');
              if (isAssistantReady) {
                const sanitized = finalMessages.filter(m => m.content !== '');
                if (isLogoStepSatisfied) {
                  onGenerate(sanitized, uploadedImages.map(i => i.base64), logoImage?.base64 || null);
                } else {
                  setPendingAutoMsgs(sanitized);
                }
              }
            }

          } catch { /* skip malformed SSE line */ }
        }
      }

    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return; // cancelled intentionally
      console.error('Chat fetch error:', (err as Error)?.message);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: '❌ Error de red. Verifica tu conexión.' };
        return updated;
      });
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading || rateLimitTimer !== null) return;
    sendMessage(input);
  };

  const handleUploadSuccess = (url: string, base64: string, isEphemeral?: boolean) => {
    setUploadedImages(prev => [...prev, { url, base64, isEphemeral }]);
    const isPersistedFile = url.startsWith('/uploads/') && !isEphemeral;
    if (isPersistedFile) {
      onImageUpload?.(url); // only track URLs that exist on disk
    }
    const msg: Message = {
      role:    'user',
      content: isPersistedFile
        ? `He subido una foto del negocio (disponible temporalmente en ${url}). Úsala en el carrusel y sección "Nosotros".`
        : 'He subido una foto del negocio y se adjunta para el carrusel y la sección "Nosotros".',
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleLogoChoice = (choice: 'yes' | 'no') => {
    setLogoDecision(choice);
    if (choice === 'no') {
      setLogoImage(null);
    }
  };

  const handleLogoUpload = (url: string, base64: string, isEphemeral?: boolean) => {
    const logoPayload = { url, base64, isEphemeral };
    setLogoImage(logoPayload);
    setLogoDecision('yes');
    const isPersistedFile = url.startsWith('/uploads/') && !isEphemeral;
    if (isPersistedFile) {
      onImageUpload?.(url);
    }
    setMessages(prev => [...prev, {
      role: 'user',
      content: 'Acabo de subir el logo de mi marca. Úsalo en el encabezado y donde aporte credibilidad.',
    }]);
  };

  const clearLogo = () => {
    setLogoImage(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Herramientas</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`h-8 px-3 rounded-md border text-sm font-semibold transition ${
              showImageUploader ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            onClick={() => {
              setShowImageUploader(v => !v);
              if (!showImageUploader) setShowLogoUploader(false);
            }}
          >
            📷 Fotos
          </button>
          <button
            type="button"
            className={`h-8 px-3 rounded-md border text-sm font-semibold transition ${
              showLogoUploader ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            onClick={() => {
              setShowLogoUploader(v => !v);
              if (!showLogoUploader) setShowImageUploader(false);
            }}
          >
            🏷️ Logo
          </button>
        </div>
      </div>

      {(showImageUploader || showLogoUploader) && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 space-y-3">
          {showImageUploader && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3">
              <p className="text-xs text-gray-500 mb-2">Carga imágenes del negocio (JPG/PNG, máx. 5MB).</p>
              <ImageUploader onUploadSuccess={handleUploadSuccess} />
            </div>
          )}
          {showLogoUploader && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">Logo opcional</p>
              <div className="flex gap-2 text-xs font-semibold">
                {(['yes', 'no'] as const).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleLogoChoice(option)}
                    className={`px-3 py-1 rounded-full border transition ${
                      logoDecision === option
                        ? option === 'yes'
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/40'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={isGenerating}
                  >
                    {option === 'yes' ? 'Sí' : 'No'}
                  </button>
                ))}
              </div>
              {logoDecision === 'yes' && (
                <LogoUploader
                  onUploadSuccess={handleLogoUpload}
                  onRemove={clearLogo}
                  preview={logoImage}
                  disabled={isGenerating || isLoading}
                />
              )}
              {logoDecision === 'no' && (
                <p className="text-[11px] text-gray-500">Puedes activarlo más tarde.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => {
          const isLast         = i === messages.length - 1;
          const isStreaming     = isLast && m.role === 'assistant' && isLoading;
          const showTypingDots  = isLast && m.role === 'assistant' && isLoading && m.content === '';
          const isUser          = m.role === 'user';

          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-[85%]`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-[rgba(99,102,241,0.2)] text-[#6366F1] text-[11px] font-semibold flex items-center justify-center">
                    IA
                  </div>
                )}
                <div
                  className={`chat-bubble ${
                    isUser
                      ? 'bg-[#6366F1] text-white rounded-[18px_18px_4px_18px]'
                      : 'bg-[#1E1E1E] text-gray-100 border-l-2 border-[#6366F1] rounded-[18px_18px_18px_4px]'
                  } px-4 py-3 shadow-sm w-full`}
                >
                  {showTypingDots ? (
                    <div className="flex gap-1 items-center py-1">
                      {[0, 1, 2].map(j => (
                        <span
                          key={j}
                          className="typing-dot w-2 h-2 rounded-full bg-current animate-bounce"
                          style={{ animationDelay: `${j * 0.15}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="chat-bubble-text text-sm whitespace-pre-wrap">
                      {m.content}
                      {isStreaming && m.content !== '' && (
                        <span className="inline-block w-0.5 h-4 bg-gray-500 ml-0.5 animate-pulse align-middle" />
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Rate limit banner */}
        {rateLimitTimer !== null && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mx-2 flex flex-col items-center space-y-2">
            <p className="text-amber-800 text-xs font-semibold">⚠️ Servicio ocupado</p>
            <p className="text-amber-700 text-[11px] text-center">
              Reintenta en <span className="font-bold">{rateLimitTimer}s</span>
            </p>
            <button
              onClick={() => sendMessage('', latestMessages.current)}
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-3 py-1 rounded-md font-bold transition-all disabled:opacity-50"
            >
              Reintentar ahora
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50 rounded-b-lg">

        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedImages.map((img, i) => (
              <div key={i} className="relative w-12 h-12 rounded border border-gray-300 overflow-hidden shadow-sm">
                <Image
                  src={img.url}
                  alt={`Foto ${i + 1}`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-bl font-bold">✓</div>
              </div>
            ))}
            <div className="w-full text-[11px] text-gray-500 font-medium">
              {uploadedImages.length} {uploadedImages.length === 1 ? 'foto lista' : 'fotos listas'}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            className="chat-input flex-1 border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Escribe tus requerimientos..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading || isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
          >
            Enviar
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 animate-pulse">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generando...
            </div>
          )}
          <button
            onClick={handleManualGenerate}
            disabled={isGenerating || messages.length < 2 || isLoading || !isLogoStepSatisfied}
            className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-[15px] py-3 px-6 rounded-[10px] flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm">✦</span>
            {isGenerating ? 'Generando diseño...' : 'Generar mi web'}
          </button>
        </div>
      </div>
    </div>
  );
}
