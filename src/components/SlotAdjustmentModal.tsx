import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  RotateCw, 
  FlipHorizontal, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  Upload, 
  Camera, 
  Check, 
  Sparkles,
  Move
} from 'lucide-react';
import { FilterId, PhotoSlotData, TransformState } from '../types/photobooth';
import { FILTER_PRESETS } from '../constants/presets';
import { getFilterCssString } from '../utils/filterEngine';

interface SlotAdjustmentModalProps {
  slot: PhotoSlotData;
  slotIndex: number;
  totalSlots: number;
  slotAspectRatio: number; // width / height
  globalFilter: FilterId;
  onUpdateTransform: (slotId: string, transform: TransformState) => void;
  onUpdateSlotFilter: (slotId: string, filter?: FilterId) => void;
  onReplaceImageWithUpload: (slotId: string, file: File) => void;
  onOpenCameraForSlot: (slotId: string) => void;
  onRemoveImage: (slotId: string) => void;
  onClose: () => void;
}

export const SlotAdjustmentModal: React.FC<SlotAdjustmentModalProps> = ({
  slot,
  slotIndex,
  totalSlots,
  slotAspectRatio,
  globalFilter,
  onUpdateTransform,
  onUpdateSlotFilter,
  onReplaceImageWithUpload,
  onOpenCameraForSlot,
  onRemoveImage,
  onClose,
}) => {
  const [transform, setTransform] = useState<TransformState>({ ...slot.transform });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initTransformX: number; initTransformY: number }>({
    startX: 0,
    startY: 0,
    initTransformX: 0,
    initTransformY: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync back to parent
  const applyTransform = useCallback((newTransform: TransformState) => {
    setTransform(newTransform);
    onUpdateTransform(slot.id, newTransform);
  }, [slot.id, onUpdateTransform]);

  // Handle Drag to Pan (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initTransformX: transform.x,
      initTransformY: transform.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - dragStartRef.current.startX) / rect.width;
    const deltaY = (e.clientY - dragStartRef.current.startY) / rect.height;

    // Apply sensitivity clamp to keep photo visible
    const maxOffset = 0.85 * (transform.scale);
    const newX = Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.initTransformX + deltaX));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.initTransformY + deltaY));

    applyTransform({
      ...transform,
      x: newX,
      y: newY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe catch
      }
    }
  };

  // Wheel to Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = 0.1;
    const newScale = e.deltaY < 0 
      ? Math.min(3.0, transform.scale + zoomStep) 
      : Math.max(1.0, transform.scale - zoomStep);
    
    applyTransform({
      ...transform,
      scale: parseFloat(newScale.toFixed(2)),
    });
  };

  const handleScaleChange = (val: number) => {
    applyTransform({
      ...transform,
      scale: parseFloat(val.toFixed(2)),
    });
  };

  const handleRotate = () => {
    const nextRotation = (transform.rotation + 90) % 360;
    applyTransform({
      ...transform,
      rotation: nextRotation,
    });
  };

  const handleFlip = () => {
    applyTransform({
      ...transform,
      flipH: !transform.flipH,
    });
  };

  const handleReset = () => {
    const resetState: TransformState = {
      x: 0,
      y: 0,
      scale: 1.0,
      rotation: 0,
      flipH: false,
    };
    applyTransform(resetState);
  };

  const activeFilter = slot.slotFilter || globalFilter;
  const filterStyle = getFilterCssString(activeFilter);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-bold font-mono">
              {slotIndex + 1}
            </span>
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm md:text-base">
                Adjust Frame Photo ({slotIndex + 1} of {totalSlots})
              </h3>
              <p className="text-xs text-zinc-500">
                Drag to pan • Pinch or scroll to zoom
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 rounded-full transition-colors"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Visual Crop Viewport */}
          <div className="flex flex-col items-center">
            <div 
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              style={{
                aspectRatio: `${slotAspectRatio}`,
                maxHeight: '380px',
                width: '100%',
                maxWidth: slotAspectRatio > 1 ? '480px' : '320px',
              }}
              className="relative rounded-2xl overflow-hidden bg-zinc-900 border-4 border-white shadow-xl cursor-grab active:cursor-grabbing select-none touch-none group"
            >
              {slot.imageSrc ? (
                <div 
                  className="w-full h-full flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `translate(${transform.x * 100}%, ${transform.y * 100}%) scale(${transform.scale}) rotate(${transform.rotation}deg) scaleX(${transform.flipH ? -1 : 1})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                >
                  <img
                    src={slot.imageSrc}
                    alt="Slot Preview"
                    className="w-full h-full object-cover"
                    style={{ filter: filterStyle }}
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-6 text-center">
                  <Camera className="w-10 h-10 mb-2 opacity-60" />
                  <p className="text-sm font-medium">No photo selected</p>
                </div>
              )}

              {/* Viewport Overlay Controls Guide */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-white/90 font-medium flex items-center space-x-1.5 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                <Move className="w-3.5 h-3.5 text-rose-400" />
                <span>Drag to reposition</span>
              </div>

              {transform.scale > 1 && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] text-rose-300 font-mono pointer-events-none">
                  {transform.scale.toFixed(1)}x Zoom
                </div>
              )}

              {/* Composition Grid Lines Guide */}
              <div className="absolute inset-0 pointer-events-none opacity-15 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-r border-b border-white"></div>
                <div className="border-b border-white"></div>
                <div className="border-r border-white"></div>
                <div className="border-r border-white"></div>
                <div></div>
              </div>
            </div>
          </div>

          {/* Transformation Controls */}
          <div className="space-y-4 bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
            {/* Zoom Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-zinc-600">
                <span className="flex items-center space-x-1">
                  <ZoomIn className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Zoom Level</span>
                </span>
                <span className="font-mono text-zinc-800 bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                  {transform.scale.toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleScaleChange(Math.max(1.0, transform.scale - 0.2))}
                  className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.05"
                  value={transform.scale}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <button
                  onClick={() => handleScaleChange(Math.min(3.0, transform.scale + 0.2))}
                  className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Rotation, Flip, Reset Button Toolbar */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={handleRotate}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-xl border border-zinc-200 shadow-sm transition active:scale-95"
              >
                <RotateCw className="w-4 h-4 text-zinc-600" />
                <span>Rotate 90°</span>
              </button>

              <button
                onClick={handleFlip}
                className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition active:scale-95 ${
                  transform.flipH 
                    ? 'bg-rose-50 text-rose-600 border-rose-300' 
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-sm'
                }`}
              >
                <FlipHorizontal className="w-4 h-4" />
                <span>{transform.flipH ? 'Mirrored' : 'Mirror Flip'}</span>
              </button>

              <button
                onClick={handleReset}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-semibold rounded-xl border border-zinc-200 shadow-sm transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-zinc-500" />
                <span>Reset Fit</span>
              </button>
            </div>
          </div>

          {/* Per-Slot Filter Override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>Slot Filter Preset</span>
              </span>
              {slot.slotFilter && (
                <button 
                  onClick={() => onUpdateSlotFilter(slot.id, undefined)}
                  className="text-xs text-rose-500 hover:underline"
                >
                  Reset to Global ({FILTER_PRESETS.find(f => f.id === globalFilter)?.name})
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {FILTER_PRESETS.map((f) => {
                const isSelected = activeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onUpdateSlotFilter(slot.id, f.id)}
                    className={`flex flex-col items-center p-1.5 rounded-xl border transition-all text-center ${
                      isSelected 
                        ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-300/60' 
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <div 
                      className="w-7 h-7 rounded-lg mb-1 border border-zinc-300 shadow-inner flex items-center justify-center"
                      style={{ 
                        backgroundColor: f.toneColor || '#ddd',
                      }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-700 leading-tight truncate w-full">
                      {f.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Source Image Management (Retake / Upload New / Remove) */}
          <div className="pt-2 flex flex-wrap gap-2 border-t border-zinc-100">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onReplaceImageWithUpload(slot.id, file);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl transition"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-600" />
              <span>Upload New Photo</span>
            </button>

            <button
              onClick={() => onOpenCameraForSlot(slot.id)}
              className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition"
            >
              <Camera className="w-3.5 h-3.5 text-rose-600" />
              <span>Retake with Camera</span>
            </button>

            {slot.imageSrc && (
              <button
                onClick={() => {
                  onRemoveImage(slot.id);
                  onClose();
                }}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition"
                title="Remove photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-xl shadow-sm transition active:scale-95"
          >
            Done Adjusting
          </button>
        </div>
      </div>
    </div>
  );
};
