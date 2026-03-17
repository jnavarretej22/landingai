"use client";

import React, { useRef, useState } from 'react';
import Image from 'next/image';

interface LogoUploaderProps {
  onUploadSuccess: (url: string, base64: string, isEphemeral?: boolean) => void;
  onRemove?: () => void;
  preview?: { url: string } | null;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

export default function LogoUploader({ onUploadSuccess, onRemove, preview, disabled }: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (disabled) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formato no válido. Usa JPG, PNG o SVG.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('El logo debe pesar máximo 4MB.');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res  = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok && data.url && data.base64) {
        onUploadSuccess(data.url, data.base64, Boolean(data.isEphemeral));
      } else {
        setError(data.error || 'No se pudo subir el logo.');
      }
    } catch {
      setError('Error de red al subir el logo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : 'hover:bg-white border-gray-300'
        }`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png,image/jpeg,image/svg+xml"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
          }}
          disabled={disabled}
        />
        {isUploading ? (
          <p className="text-blue-600 font-medium text-sm">Subiendo logo...</p>
        ) : (
          <div>
            <p className="text-gray-600 text-sm font-semibold">Sube tu logo (PNG, SVG o JPG)</p>
            <p className="text-gray-400 text-[11px]">Se adapta automáticamente al espacio disponible</p>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {preview?.url && (
        <div className="border border-gray-200 rounded-lg p-2 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-20 h-12 relative bg-gray-50 rounded-md border border-gray-100">
              <Image
                src={preview.url}
                alt="Logo cargado"
                fill
                className="object-contain"
                sizes="80px"
                unoptimized
              />
            </div>
            <p className="text-xs text-gray-600">Logo listo · Se mostrará en el encabezado</p>
          </div>
          <button
            type="button"
            className="text-[11px] text-red-500 font-semibold"
            onClick={onRemove}
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  );
}
