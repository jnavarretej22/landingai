"use client";

import React, { useRef } from 'react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface DownloadButtonProps {
  html: string;
  uploadedUrls?: string[];
  onCleaned?: () => void;
}

const WS_NUMBER = "5930939667369";
const WS_PUBLISH_MSG = encodeURIComponent(
  "Hola! Ya diseñé mi página en MiNegocioDigital y quiero que me ayuden a publicarla en internet 🌐"
);
const WS_PUBLISH_URL = `https://wa.me/${WS_NUMBER}?text=${WS_PUBLISH_MSG}`;

export default function DownloadButton({ html, uploadedUrls = [], onCleaned }: DownloadButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleDownload = async () => {
    if (!html || !formRef.current) return;
    formRef.current.submit();
    if (uploadedUrls.length > 0) {
      try {
        await fetch('/api/upload/cleanup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ urls: uploadedUrls }),
        });
        onCleaned?.();
      } catch { }
    }
  };

  const handlePublish = async () => {
    // 1. Trigger the actual download logic
    handleDownload();

    // 2. Open WhatsApp with a more relevant message
    const msg = encodeURIComponent(
      "¡Hola! Ya diseñé mi página en MiNegocioDigital y quiero publicarla 🌐. Acabo de descargar el archivo HTML y estoy listo para enviarlo."
    );
    window.open(`https://wa.me/${WS_NUMBER}?text=${msg}`, '_blank');
  };

  return (
    <div className="flex items-center gap-3">
      <form ref={formRef} method="POST" action="/api/download" style={{ display: 'none' }}>
        <textarea name="html" readOnly value={html} onChange={() => {}} />
      </form>

      <button 
        onClick={handlePublish} 
        disabled={!html}
        className="publish-btn"
      >
        <WhatsAppIcon size={18} />
        Publicar Mi Sitio
      </button>

      <button
        onClick={handleDownload}
        disabled={!html}
        className={`px-4 py-2 h-[52px] font-semibold rounded-full shadow-md transition-colors flex items-center gap-2
          ${html
            ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Descargar HTML
      </button>
    </div>
  );
}
