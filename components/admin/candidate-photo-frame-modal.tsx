'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  Move,
  Loader2,
  Sparkles,
  Eye,
} from 'lucide-react';

interface CandidatePhotoFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  candidateNumber: number | string;
  candidateNames?: string;
  onConfirm: (croppedFile: File) => Promise<void> | void;
  isUploading?: boolean;
}

export function CandidatePhotoFrameModal({
  isOpen,
  onClose,
  imageUrl,
  candidateNumber,
  candidateNames = 'Pasangan Calon',
  onConfirm,
  isUploading = false,
}: CandidatePhotoFrameModalProps) {
  const [zoom, setZoom] = useState<number>(1.0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset zoom & pan ketika modal baru dibuka atau ganti gambar
  useEffect(() => {
    if (isOpen) {
      setZoom(1.0);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageUrl]);

  // Muat ukuran asli gambar
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth || 800,
        height: imageRef.current.naturalHeight || 600,
      });
      setImageLoaded(true);
    }
  };

  // Pointer drag handling (mouse & touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isUploading) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isUploading) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setOffset({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Abaikan jika capture sudah terlepas
      }
    }
  };

  // Wheel zoom handling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isUploading) return;
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3.0, Math.max(1.0, +(prev + delta).toFixed(2))));
  };

  const handleReset = () => {
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
  };

  // Render & Ekspor hasil framing ke Canvas 1200x900 (Rasio 4:3 HD)
  const handleApply = useCallback(async () => {
    if (!containerRef.current || !imageRef.current || !imageLoaded) return;

    const container = containerRef.current;
    const img = imageRef.current;

    const viewWidth = container.clientWidth;
    const viewHeight = container.clientHeight;

    const OUTPUT_WIDTH = 1200;
    const OUTPUT_HEIGHT = 900;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Hitung dimensi dasar gambar agar "cover" viewport
    const scaleToFit = Math.max(viewWidth / img.naturalWidth, viewHeight / img.naturalHeight);
    const baseWidth = img.naturalWidth * scaleToFit;
    const baseHeight = img.naturalHeight * scaleToFit;

    // Dimensi aktual saat di-zoom
    const renderedWidth = baseWidth * zoom;
    const renderedHeight = baseHeight * zoom;

    // Posisi di dalam viewport
    const baseX = (viewWidth - renderedWidth) / 2 + offset.x;
    const baseY = (viewHeight - renderedHeight) / 2 + offset.y;

    // Rasio transformasi ke output canvas (1200x900)
    const canvasScale = OUTPUT_WIDTH / viewWidth;

    const drawX = baseX * canvasScale;
    const drawY = baseY * canvasScale;
    const drawWidth = renderedWidth * canvasScale;
    const drawHeight = renderedHeight * canvasScale;

    // Isi background gelap terlebih dahulu jika ada ruang kosong
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

    // Gambar foto ter-frame
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Konversi ke File WebP (dengan fallback JPEG)
    const blobPromise = new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', 0.92);
    });

    let blob = await blobPromise;
    let ext = '.webp';
    let mime = 'image/webp';

    if (!blob) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
      });
      ext = '.jpg';
      mime = 'image/jpeg';
    }

    if (!blob) {
      alert('Gagal memproses gambar pada canvas.');
      return;
    }

    const filename = `paslon-${candidateNumber}-frame-${Date.now()}${ext}`;
    const file = new File([blob], filename, { type: mime });

    await onConfirm(file);
  }, [candidateNumber, imageLoaded, offset.x, offset.y, onConfirm, zoom]);

  if (!isOpen) return null;

  // Hitung transformasi gaya CSS untuk pratinjau di viewport
  const getTransformStyle = () => {
    return {
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
      transformOrigin: 'center center',
      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container border border-outline-variant/30 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface leading-tight">
                Sesuaikan Frame Foto Paslon {candidateNumber}
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Rasio paten 4:3 &bull; Menjamin tampilan proporsional di bilik suara pemilih
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Tutup Editor Frame"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Area Kerja */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* Instruksi Singkat */}
          <div className="flex items-center justify-between text-xs text-on-surface-variant bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant/20">
            <span className="flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-primary" />
              <span>Geser untuk memposisikan kepala/wajah paslon</span>
            </span>
            <span className="font-mono text-[11px] font-semibold text-primary">
              Rasio 4:3
            </span>
          </div>

          {/* Viewport Frame Interaktif (Rasio 4:3) */}
          <div className="flex justify-center">
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              className={`relative w-full max-w-[460px] aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 ${
                isDragging ? 'border-primary cursor-grabbing' : 'border-outline-variant/50 cursor-grab hover:border-primary/60'
              } select-none touch-none shadow-inner flex items-center justify-center`}
            >
              {/* Gambar Utama yang Diatur */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Framing Target"
                onLoad={handleImageLoad}
                draggable={false}
                style={getTransformStyle()}
                className="max-w-none w-full h-full object-cover pointer-events-none select-none"
              />

              {/* Garis Pandu Rule of Thirds (Bantu penempatan mata/wajah) */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                <div className="border-r border-b border-dashed border-white/40"></div>
                <div className="border-r border-b border-dashed border-white/40"></div>
                <div className="border-b border-dashed border-white/40"></div>
                <div className="border-r border-b border-dashed border-white/40"></div>
                <div className="border-r border-b border-dashed border-white/40"></div>
                <div className="border-b border-dashed border-white/40"></div>
                <div className="border-r border-white/40"></div>
                <div className="border-r border-white/40"></div>
                <div></div>
              </div>

              {/* Badge Petunjuk Geser */}
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-white/80 border border-white/10 flex items-center gap-1.5 pointer-events-none">
                <Move className="w-3 h-3 text-primary" />
                <span>Drag untuk Menggeser</span>
              </div>

              {/* Zoom Level Pill */}
              <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-primary font-bold border border-white/10 pointer-events-none">
                {zoom.toFixed(2)}x
              </div>
            </div>
          </div>

          {/* Kontrol Zoom & Posisi */}
          <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-primary" />
                <span>Perbesar / Perkecil (Zoom)</span>
              </span>
              <span className="font-mono text-primary">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Slider Zoom */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(1.0, +(prev - 0.1).toFixed(2)))}
                aria-label="Zoom Out"
                disabled={zoom <= 1.0 || isUploading}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface border border-outline-variant/30 disabled:opacity-40"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.05"
                value={zoom}
                disabled={isUploading}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-primary cursor-pointer h-2 bg-surface-container rounded-lg"
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3.0, +(prev + 0.1).toFixed(2)))}
                aria-label="Zoom In"
                disabled={zoom >= 3.0 || isUploading}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface border border-outline-variant/30 disabled:opacity-40"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isUploading}
                title="Reset Zoom & Posisi"
                className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Pratinjau Tampilan Bilik Suara (Miniature) */}
          <div className="p-3 bg-surface-container-high/50 rounded-2xl border border-outline-variant/20 flex items-center gap-3">
            <div className="w-16 h-12 rounded-lg bg-black overflow-hidden relative border border-outline-variant/30 shrink-0 shadow-sm flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Mini Preview"
                style={getTransformStyle()}
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider">
                <Eye className="w-3 h-3" />
                <span>Pratinjau Bilik Suara</span>
              </div>
              <p className="text-xs font-semibold text-on-surface truncate mt-0.5">
                Paslon {candidateNumber} &bull; {candidateNames}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                Foto akan tampil persis seperti kotak di atas pada kartu suara pemilih.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-outline-variant/20 bg-surface-container flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!imageLoaded || isUploading}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold uppercase tracking-wider hover:bg-secondary-fixed transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan Foto...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Terapkan &amp; Simpan Foto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
