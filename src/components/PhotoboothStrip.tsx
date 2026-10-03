import React, { useRef, useState } from 'react';
import { 
  Camera, 
  Upload, 
  Sliders, 
  X, 
  RotateCw, 
  FlipHorizontal, 
  Move,
  Trash2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { 
  FrameBorderConfig, 
  CaptionConfig, 
  DateStampConfig, 
  FilterId, 
  LayoutConfig, 
  PhotoSlotData, 
  StickerItem, 
  TransformState 
} from '../types/photobooth';
import { getFilterCssString } from '../utils/filterEngine';
import { STICKER_PALETTE } from '../constants/presets';

interface PhotoboothStripProps {
  layout: LayoutConfig;
  slots: PhotoSlotData[];
  globalFilter: FilterId;
  borderConfig: FrameBorderConfig;
  captionConfig: CaptionConfig;
  dateStampConfig: DateStampConfig;
  stickers: StickerItem[];
  activeSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  onOpenAdjustment: (slotId: string) => void;
  onOpenCamera: (slotId: string) => void;
  onFileUpload: (slotId: string, file: File) => void;
  onRemovePhoto: (slotId: string) => void;
  onUpdateTransform: (slotId: string, transform: TransformState) => void;
  onUpdateSticker?: (stickerId: string, updates: Partial<StickerItem>) => void;
  onRemoveSticker?: (stickerId: string) => void;
  onAddStickerAtPos?: (emoji: string, x: number, y: number) => void;
  isRoomConnected?: boolean;
  duoMode?: 'shared' | 'alternating';
  userName?: string;
  partnerName?: string;
}

export const PhotoboothStrip: React.FC<PhotoboothStripProps> = ({
  layout,
  slots,
  globalFilter,
  borderConfig,
  captionConfig,
  dateStampConfig,
  stickers,
  activeSlotId,
  onSelectSlot,
  onOpenAdjustment,
  onOpenCamera,
  onFileUpload,
  onRemovePhoto,
  onUpdateTransform,
  onUpdateSticker,
  onRemoveSticker,
  onAddStickerAtPos,
  isRoomConnected,
  duoMode,
  userName = 'You',
  partnerName = 'Partner',
}) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const [isDragOverStrip, setIsDragOverStrip] = useState(false);
  
  // Sticker dragging state
  const [draggingStickerId, setDraggingStickerId] = useState<string | null>(null);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const stickerDragStartRef = useRef<{ startClientX: number; startClientY: number; initX: number; initY: number }>({
    startClientX: 0,
    startClientY: 0,
    initX: 0,
    initY: 0,
  });

  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  const isPolaroid = layout.id === 'polaroid-single';
  const isSquareCollage = layout.id === 'square-2x2';

  let baseWidth = 360;
  if (isSquareCollage) baseWidth = 420;
  if (isPolaroid) baseWidth = 340;

  // Direct Inline Drag Pan handler for Photo Slots
  const handlePointerDownInline = (
    e: React.PointerEvent, 
    slot: PhotoSlotData, 
    containerEl: HTMLElement
  ) => {
    e.stopPropagation();
    setDraggingSlotId(slot.id);
    containerEl.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: slot.transform.x,
      initY: slot.transform.y,
    };
  };

  const handlePointerMoveInline = (
    e: React.PointerEvent, 
    slot: PhotoSlotData, 
    containerEl: HTMLElement
  ) => {
    if (draggingSlotId !== slot.id) return;
    const rect = containerEl.getBoundingClientRect();
    const deltaX = (e.clientX - dragStartRef.current.startX) / rect.width;
    const deltaY = (e.clientY - dragStartRef.current.startY) / rect.height;

    const maxOffset = 0.85 * (slot.transform.scale);
    const newX = Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.initX + deltaX));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.initY + deltaY));

    onUpdateTransform(slot.id, {
      ...slot.transform,
      x: newX,
      y: newY,
    });
  };

  const handlePointerUpInline = (e: React.PointerEvent, containerEl: HTMLElement) => {
    if (draggingSlotId) {
      setDraggingSlotId(null);
      try {
        containerEl.releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
    }
  };

  // Direct Inline Wheel Zoom
  const handleWheelInline = (e: React.WheelEvent, slot: PhotoSlotData) => {
    e.preventDefault();
    e.stopPropagation();
    const step = 0.1;
    const newScale = e.deltaY < 0 
      ? Math.min(3.0, slot.transform.scale + step) 
      : Math.max(1.0, slot.transform.scale - step);

    onUpdateTransform(slot.id, {
      ...slot.transform,
      scale: parseFloat(newScale.toFixed(2)),
    });
  };

  // Drag and drop image files directly onto a specific slot
  const handleSlotDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlotId(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileUpload(slotId, file);
      }
    }
  };

  // Drag and drop emoji stickers from palette onto strip
  const handleStripDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOverStrip(true);
  };

  const handleStripDragLeave = () => {
    setIsDragOverStrip(false);
  };

  const handleStripDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverStrip(false);
    
    // Check if an emoji is being dropped
    const emoji = e.dataTransfer.getData('application/photobooth-emoji') || e.dataTransfer.getData('text/plain');
    if (emoji && (STICKER_PALETTE.includes(emoji) || emoji.length <= 4)) {
      if (!stripRef.current) return;
      const rect = stripRef.current.getBoundingClientRect();
      const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
      onAddStickerAtPos?.(emoji, x, y);
    }
  };

  // Drag existing sticker on the strip
  const handleStickerPointerDown = (e: React.PointerEvent, st: StickerItem) => {
    e.stopPropagation();
    setSelectedStickerId(st.id);
    setDraggingStickerId(st.id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    stickerDragStartRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      initX: st.x,
      initY: st.y,
    };
  };

  const handleStickerPointerMove = (e: React.PointerEvent, st: StickerItem) => {
    if (draggingStickerId !== st.id || !stripRef.current) return;
    const rect = stripRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - stickerDragStartRef.current.startClientX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - stickerDragStartRef.current.startClientY) / rect.height) * 100;

    const newX = Math.max(3, Math.min(97, stickerDragStartRef.current.initX + deltaXPercent));
    const newY = Math.max(3, Math.min(97, stickerDragStartRef.current.initY + deltaYPercent));

    onUpdateSticker?.(st.id, { x: newX, y: newY });
  };

  const handleStickerPointerUp = (e: React.PointerEvent) => {
    if (draggingStickerId) {
      setDraggingStickerId(null);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe catch
      }
    }
  };

  return (
    <div 
      className="relative flex justify-center items-center py-6 px-2 select-none"
      onClick={() => setSelectedStickerId(null)}
    >
      {/* Physical Strip Container */}
      <div
        ref={stripRef}
        id="photobooth-preview-strip"
        onDragOver={handleStripDragOver}
        onDragLeave={handleStripDragLeave}
        onDrop={handleStripDrop}
        style={{
          width: `${baseWidth}px`,
          backgroundColor: borderConfig.customColor || borderConfig.color,
          padding: `${borderConfig.width}px`,
          gap: `${borderConfig.gap}px`,
        }}
        className={`relative rounded-2xl shadow-strip transition-all duration-200 border border-black/5 ${
          isDragOverStrip ? 'ring-4 ring-rose-400/80 scale-[1.01]' : ''
        } ${
          borderConfig.texture === 'grain' ? 'bg-film-grain' : 
          borderConfig.texture === 'matte' ? 'bg-paper-texture' : ''
        }`}
      >
        {/* Photo Grid Slots */}
        <div 
          className="grid w-full"
          style={{
            gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
            gap: `${borderConfig.gap}px`,
          }}
        >
          {slots.map((slot, index) => {
            const hasPhoto = Boolean(slot.imageSrc);
            const isSelected = activeSlotId === slot.id;
            const effectiveFilter = slot.slotFilter || globalFilter;
            const filterCss = getFilterCssString(effectiveFilter);

            return (
              <div
                key={slot.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverSlotId(slot.id);
                }}
                onDragLeave={() => setDragOverSlotId(null)}
                onDrop={(e) => handleSlotDrop(e, slot.id)}
                onClick={() => onSelectSlot(slot.id)}
                style={{
                  aspectRatio: `${layout.slotAspectRatio}`,
                  borderRadius: `${borderConfig.borderRadius}px`,
                }}
                className={`group relative overflow-hidden bg-zinc-100 transition-all ${
                  dragOverSlotId === slot.id ? 'ring-4 ring-rose-400 bg-rose-50' : ''
                } ${
                  isSelected ? 'ring-2 ring-rose-500 shadow-md' : 'shadow-inner'
                }`}
              >
                {hasPhoto ? (
                  /* Filled Slot View */
                  <div
                    className="relative w-full h-full cursor-grab active:cursor-grabbing touch-none overflow-hidden"
                    onPointerDown={(e) => handlePointerDownInline(e, slot, e.currentTarget)}
                    onPointerMove={(e) => handlePointerMoveInline(e, slot, e.currentTarget)}
                    onPointerUp={(e) => handlePointerUpInline(e, e.currentTarget)}
                    onWheel={(e) => handleWheelInline(e, slot)}
                  >
                    {/* Rendered transformed image */}
                    <div
                      className="w-full h-full flex items-center justify-center pointer-events-none"
                      style={{
                        transform: `translate(${slot.transform.x * 100}%, ${slot.transform.y * 100}%) scale(${slot.transform.scale}) rotate(${slot.transform.rotation}deg) scaleX(${slot.transform.flipH ? -1 : 1})`,
                        transformOrigin: 'center center',
                        transition: draggingSlotId === slot.id ? 'none' : 'transform 0.12s ease-out',
                      }}
                    >
                      <img
                        src={slot.imageSrc!}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        style={{ filter: filterCss }}
                        draggable={false}
                      />
                    </div>

                    {/* Badge showing slot index and duo turn */}
                    <div className="absolute top-2 left-2 pointer-events-none flex items-center space-x-1 z-20">
                      <span className="bg-black/60 backdrop-blur-sm text-white/95 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                        #{index + 1}
                      </span>
                      {isRoomConnected && duoMode === 'alternating' && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs ${
                          index % 2 === 0 ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'
                        }`}>
                          {index % 2 === 0 ? userName : partnerName}
                        </span>
                      )}
                    </div>

                    {/* DIRECT TOP-RIGHT DELETE BUTTON (Always works & easy to click) */}
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePhoto(slot.id);
                      }}
                      className="absolute top-2 right-2 z-30 p-1.5 bg-red-500/90 hover:bg-red-600 active:scale-90 text-white rounded-full shadow-md transition cursor-pointer"
                      title="Delete / Remove this photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Hover Controls Overlay */}
                    <div 
                      onPointerDown={(e) => e.stopPropagation()}
                      className={`absolute inset-0 bg-black/35 backdrop-blur-[1px] ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity flex items-center justify-center gap-2 p-2 z-20`}
                    >
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAdjustment(slot.id);
                        }}
                        className="p-2.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded-xl shadow-md transition transform hover:scale-110 active:scale-95 cursor-pointer"
                        title="Open Adjustment Editor"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>

                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateTransform(slot.id, {
                            ...slot.transform,
                            rotation: (slot.transform.rotation + 90) % 360,
                          });
                        }}
                        className="p-2.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded-xl shadow-md transition transform hover:scale-110 active:scale-95 cursor-pointer"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>

                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateTransform(slot.id, {
                            ...slot.transform,
                            flipH: !slot.transform.flipH,
                          });
                        }}
                        className="p-2.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded-xl shadow-md transition transform hover:scale-110 active:scale-95 cursor-pointer"
                        title="Mirror Flip"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </button>

                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePhoto(slot.id);
                        }}
                        className="p-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-xl shadow-md transition transform hover:scale-110 cursor-pointer"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom gesture hint on hover */}
                    <div className="absolute bottom-1.5 inset-x-0 flex justify-center pointer-events-none opacity-0 group-hover:opacity-90 transition-opacity z-20">
                      <span className="bg-black/60 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <Move className="w-2.5 h-2.5 text-rose-300" />
                        <span>Drag to Pan • Scroll to Zoom</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Empty Slot View with Camera or Upload Options */
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-50 border-2 border-dashed border-zinc-200 hover:border-rose-400 hover:bg-rose-50/30 transition group/empty">
                    {isRoomConnected && duoMode === 'alternating' && (
                      <span className={`mb-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs ${
                        index % 2 === 0 ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {index % 2 === 0 ? `Your Turn (${userName})` : `${partnerName}'s Turn`}
                      </span>
                    )}
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCamera(slot.id);
                        }}
                        className="p-2.5 bg-white group-hover/empty:bg-rose-500 group-hover/empty:text-white text-zinc-700 rounded-full shadow-sm hover:shadow transition transform hover:scale-105 active:scale-95"
                        title="Take Camera Snapshot"
                      >
                        <Camera className="w-4 h-4" />
                      </button>

                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 bg-white group-hover/empty:bg-rose-500 group-hover/empty:text-white text-zinc-700 rounded-full shadow-sm hover:shadow transition transform hover:scale-105 active:scale-95 cursor-pointer"
                        title="Upload Image from Disk"
                      >
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onFileUpload(slot.id, file);
                          }}
                        />
                      </label>
                    </div>

                    <span className="text-[11px] font-semibold text-zinc-500 group-hover/empty:text-rose-600 transition">
                      Frame {index + 1}
                    </span>
                    <span className="text-[9px] text-zinc-400 mt-0.5">
                      Snap or drop image
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Text / Caption / Date Stamp Area */}
        <div className={`flex flex-col items-center justify-center text-center ${
          isPolaroid ? 'pt-8 pb-4' : 'pt-4 pb-2'
        }`}>
          {/* Custom Caption */}
          {captionConfig.enabled && captionConfig.text && (
            <p 
              className={`leading-tight font-semibold tracking-wide ${
                captionConfig.font === 'caveat' ? 'font-caveat' :
                captionConfig.font === 'mono' ? 'font-mono-retro' :
                captionConfig.font === 'playfair' ? 'font-serif-vintage' : 'font-sans'
              }`}
              style={{
                color: captionConfig.color,
                fontSize: `${captionConfig.size}px`,
              }}
            >
              {captionConfig.text}
            </p>
          )}

          {/* Date Stamp */}
          {dateStampConfig.enabled && dateStampConfig.date && (
            <span
              className="mt-1 font-mono-retro font-bold text-[10px] tracking-widest uppercase opacity-90"
              style={{
                color: dateStampConfig.color,
              }}
            >
              {dateStampConfig.date}
            </span>
          )}
        </div>

        {/* DRAGGABLE & DROP EMOTE STICKERS */}
        {stickers.map((st) => {
          const isSelected = selectedStickerId === st.id;
          return (
            <div
              key={st.id}
              onPointerDown={(e) => handleStickerPointerDown(e, st)}
              onPointerMove={(e) => handleStickerPointerMove(e, st)}
              onPointerUp={handleStickerPointerUp}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStickerId(st.id);
              }}
              style={{
                position: 'absolute',
                left: `${st.x}%`,
                top: `${st.y}%`,
                transform: `translate(-50%, -50%) rotate(${st.rotation}deg) scale(${st.scale})`,
                fontSize: '28px',
              }}
              className={`cursor-grab active:cursor-grabbing select-none group/sticker z-30 touch-none transition-transform ${
                isSelected ? 'ring-2 ring-rose-400 rounded-xl p-1 bg-white/40 backdrop-blur-xs' : ''
              }`}
              title="Drag to reposition sticker anywhere"
            >
              <span>{st.emoji}</span>

              {/* Floating controls when sticker is selected or hovered */}
              <div 
                onPointerDown={(e) => e.stopPropagation()}
                className={`absolute -top-7 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full z-40 transition-opacity ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover/sticker:opacity-100'
                }`}
              >
                {/* Scale Down */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateSticker?.(st.id, { scale: Math.max(0.6, st.scale - 0.2) });
                  }}
                  className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-[10px]"
                  title="Make smaller"
                >
                  -
                </button>

                {/* Scale Up */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateSticker?.(st.id, { scale: Math.min(2.5, st.scale + 0.2) });
                  }}
                  className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-[10px]"
                  title="Make larger"
                >
                  +
                </button>

                {/* Rotate 15 deg */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateSticker?.(st.id, { rotation: (st.rotation + 15) % 360 });
                  }}
                  className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-[9px]"
                  title="Rotate sticker"
                >
                  ⟳
                </button>

                {/* Delete */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSticker?.(st.id);
                  }}
                  className="w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-[9px]"
                  title="Delete sticker"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
