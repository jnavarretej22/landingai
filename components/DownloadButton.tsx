"use client";

import React, { useRef } from 'react';

interface DownloadButtonProps {
  html: string;
  uploadedUrls?: string[];
  onCleaned?: () => void;
}

export default function DownloadButton({ html, uploadedUrls = [], onCleaned }: DownloadButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleDownload = async () => {
    if (!html || !formRef.current) return;

    // Submit the hidden form — the server responds with Content-Disposition: attachment
    // so the browser downloads the file with the correct name, no blob URLs needed.
    formRef.current.submit();

    // Delete uploaded images from server after download (best-effort)
    if (uploadedUrls.length > 0) {
      try {
        await fetch('/api/upload/cleanup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ urls: uploadedUrls }),
        });
        onCleaned?.();
      } catch { /* not critical */ }
    }
  };

  return (
    <>
      {/* Hidden form that POSTs the HTML to the server-side download route */}
      <form
        ref={formRef}
        method="POST"
        action="/api/download"
        style={{ display: 'none' }}
      >
        <textarea name="html" readOnly value={html} onChange={() => {}} />
      </form>

      <button
        onClick={handleDownload}
        disabled={!html}
        className={`px-4 py-2 font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2
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
    </>
  );
}
