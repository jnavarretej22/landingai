"use client";

import React from 'react';

interface PreviewFrameProps {
  html: string;
  isGenerating?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="w-full h-full bg-gray-50 overflow-auto p-0 animate-pulse">
      {/* Navbar skeleton */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="h-6 w-32 bg-gray-200 rounded"></div>
        <div className="flex gap-4">
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-blue-200 rounded-full"></div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="bg-gray-800 px-12 py-24 flex flex-col items-center gap-6">
        <div className="h-4 w-32 bg-gray-600 rounded-full"></div>
        <div className="h-16 w-2/3 bg-gray-600 rounded"></div>
        <div className="h-16 w-1/2 bg-gray-700 rounded"></div>
        <div className="h-4 w-96 bg-gray-600 rounded mt-2"></div>
        <div className="flex gap-3 mt-2">
          <div className="h-12 w-36 bg-orange-500/60 rounded-full"></div>
          <div className="h-12 w-28 bg-gray-600 rounded-full"></div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="px-12 py-12 grid grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 rounded-2xl p-6 flex flex-col gap-3">
            <div className="h-10 w-10 bg-gray-300 rounded-xl"></div>
            <div className="h-5 w-2/3 bg-gray-300 rounded"></div>
            <div className="h-3 w-full bg-gray-300 rounded"></div>
            <div className="h-3 w-3/4 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="bg-gray-800 px-12 py-10 flex gap-8">
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-5 w-24 bg-gray-600 rounded"></div>
          <div className="h-3 w-48 bg-gray-700 rounded"></div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 bg-gray-700 rounded"></div>
          <div className="h-3 w-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function PreviewFrame({ html, isGenerating }: PreviewFrameProps) {
  if (isGenerating) {
    return (
      <div className="w-full h-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-inner">
        <div className="w-full h-8 bg-gray-100 border-b border-gray-200 flex items-center px-3 gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="ml-3 text-[10px] text-gray-400 font-medium">Generando diseño...</span>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (!html) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 border border-gray-200 rounded-lg gap-3">
        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">Tu landing page aparecerá aquí</p>
        <p className="text-xs text-gray-300">Completa el chat y haz clic en &quot;Generar&quot;</p>
      </div>
    );
  }

  // Inject a small script to intercept links and prevent navigation inside the preview
  const injectedHtml = html.replace('</body>', `
    <script>
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
          const href = link.getAttribute('href');
          // If it's a relative link or same-origin, prevent it to avoid loading the app inside the iframe
          if (href && (href === '/' || href.startsWith(window.location.origin) || href.startsWith('#'))) {
            e.preventDefault();
          } else if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('https://wa.me')) {
            // External links should open in a new tab
            link.setAttribute('target', '_blank');
          }
        }
      }, true);
    </script>
    </body>
  `);

  return (
    <div className="w-full h-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-inner">
      <iframe
        title="Vista previa"
        srcDoc={injectedHtml}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
