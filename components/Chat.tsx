"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Message } from '@/lib/types';
import ImageUploader from './ImageUploader';

const STORAGE_MESSAGES   = 'minegocio_messages';
const STORAGE_IMG_URLS   = 'minegocio_image_urls';

interface UploadedImage {
  url: string;
  base64: string;
}

interface ChatProps {
  onGenerate: (messages: Message[], images: string[]) => void;
  isGenerating: boolean;
  onImageUpload?: (url: string) => void;
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
      const urls = uploadedImages.map(i => i.url).filter(Boolean);
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
              if (data.isReady || detectReadySignal(finalMessages[finalMessages.length - 1]?.content ?? '')) {
                onGenerate(
                  finalMessages.filter(m => m.content !== ''), // remove empty placeholder if any
                  uploadedImages.map(i => i.base64)
                );
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

  const handleUploadSuccess = (url: string, base64: string) => {
    setUploadedImages(prev => [...prev, { url, base64 }]);
    onImageUpload?.(url); // notify parent so it can track for cleanup
    const msg: Message = {
      role:    'user',
      content: `He subido una foto del negocio (disponible en ${url}). Úsala en el carrusel y sección "Nosotros".`,
    };
    setMessages(prev => [...prev, msg]);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => {
          const isLast         = i === messages.length - 1;
          const isStreaming     = isLast && m.role === 'assistant' && isLoading;
          const showTypingDots  = isLast && m.role === 'assistant' && isLoading && m.content === '';

          return (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                {showTypingDots ? (
                  <div className="flex gap-1 items-center py-1">
                    {[0, 1, 2].map(j => (
                      <span
                        key={j}
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${j * 0.15}s` }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">
                    {m.content}
                    {isStreaming && m.content !== '' && (
                      <span className="inline-block w-0.5 h-4 bg-gray-500 ml-0.5 animate-pulse align-middle" />
                    )}
                  </p>
                )}
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
        <ImageUploader onUploadSuccess={handleUploadSuccess} />

        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedImages.map((img, i) => (
              <div key={i} className="relative w-12 h-12 rounded border border-gray-300 overflow-hidden shadow-sm">
                <Image src={img.url} alt={`Foto ${i + 1}`} width={48} height={48} className="w-full h-full object-cover" />
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-bl font-bold">✓</div>
              </div>
            ))}
            <div className="w-full text-[11px] text-gray-500 font-medium">
              {uploadedImages.length} {uploadedImages.length === 1 ? 'foto lista' : 'fotos listas'}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Escribe tus requerimientos..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading || isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
          >
            Enviar
          </button>
        </div>

        <button
          onClick={() => onGenerate(messages, uploadedImages.map(i => i.base64))}
          disabled={isGenerating || messages.length < 2 || isLoading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? '⏳ Generando diseño...' : '✨ Generar mi Landing Page'}
        </button>
      </div>
    </div>
  );
}
