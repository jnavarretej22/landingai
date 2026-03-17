"use client";

import React, { useState, useRef } from 'react';

interface ImageUploaderProps {
  onUploadSuccess: (url: string, base64: string) => void;
}

/** Compress image client-side before uploading (max 800px, quality 0.8) */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else                 { width  = Math.round((width  * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          else resolve(file); // fallback to original if compression fails
        },
        'image/jpeg',
        0.8
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver,  setIsDragOver]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, sube un archivo de imagen.');
      return;
    }
    setError(null);
    setIsUploading(true);

    try {
      const compressed  = await compressImage(file);
      const formData    = new FormData();
      formData.append('file', compressed);

      const res  = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok && data.url && data.base64) {
        onUploadSuccess(data.url, data.base64);
      } else {
        setError(data.error || 'Error al subir la imagen.');
      }
    } catch {
      setError('Error de red al subir la imagen.');
    } finally {
      setIsUploading(false);
      setIsDragOver(false);
    }
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
          isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          className="hidden"
          accept="image/*"
        />
        {isUploading ? (
          <p className="text-blue-600 font-medium text-sm">Subiendo y comprimiendo...</p>
        ) : (
          <p className="text-gray-500 text-xs">
            📷 Arrastra una imagen o <span className="text-blue-600 underline">explora</span>
            <span className="block text-gray-400 text-[10px] mt-0.5">Máx. 5MB · Se comprimirá automáticamente</span>
          </p>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
