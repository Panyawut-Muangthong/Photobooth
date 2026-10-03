import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { PhotoboothStrip } from './components/PhotoboothStrip';
import { ControlPanel } from './components/ControlPanel';
import { CameraModal } from './components/CameraModal';
import { SlotAdjustmentModal } from './components/SlotAdjustmentModal';
import { ExportModal } from './components/ExportModal';
import { RoomModal } from './components/RoomModal';
import { PhotoTray } from './components/PhotoTray';
import { 
  CaptionConfig, 
  DateStampConfig, 
  FilterId, 
  FrameBorderConfig, 
  LayoutId, 
  PhotoSlotData, 
  StickerItem, 
  TransformState 
} from './types/photobooth';
import { LAYOUT_CONFIGS } from './constants/presets';
import { generateSamplePhoto } from './utils/samplePhotos';
import { renderPhotoboothToCanvas } from './utils/canvasRenderer';
import { roomManager, RoomSyncMessage } from './utils/roomSync';
import { Camera, Sparkles, MessageCircle } from 'lucide-react';

export function App() {
  const [layoutId, setLayoutId] = useState<LayoutId>('korean-4cut');
  const currentLayout = LAYOUT_CONFIGS[layoutId];

  // Persistent slot memory across layout/size switches (preserves up to 10 slots)
  const slotMemoryRef = useRef<Record<number, PhotoSlotData>>({});

  // Session photo history (all photos taken or uploaded)
  const [photoHistory, setPhotoHistory] = useState<{ id: string; src: string; timestamp: number }[]>(() => {
    try {
      const saved = sessionStorage.getItem('lensbooth_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('lensbooth_history', JSON.stringify(photoHistory.slice(0, 20)));
    } catch {
      // Ignore quota error
    }
  }, [photoHistory]);

  // Helper to create slots while restoring remembered photos
  const createSlotsForLayout = useCallback((count: number): PhotoSlotData[] => {
    return Array.from({ length: count }, (_, i) => {
      if (slotMemoryRef.current[i]) {
        return { ...slotMemoryRef.current[i] };
      }
      return {
        id: `slot-${i}-${Date.now()}`,
        imageSrc: null,
        transform: { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: false },
      };
    });
  }, []);

  const [slots, setSlots] = useState<PhotoSlotData[]>(() => createSlotsForLayout(currentLayout.slotsCount));
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  // Global styling states
  const [globalFilter, setGlobalFilter] = useState<FilterId>('vintage-grain');
  const [borderConfig, setBorderConfig] = useState<FrameBorderConfig>({
    color: '#FAF6EE', // Vintage Cream
    width: 16,
    gap: 10,
    borderRadius: 8,
    texture: 'clean',
    aspectRatioLock: true,
  });

  const [captionConfig, setCaptionConfig] = useState<CaptionConfig>({
    enabled: true,
    text: 'LENSBOOTH • SEOUL ♡',
    font: 'caveat',
    size: 20,
    color: '#18181B',
  });

  const [dateStampConfig, setDateStampConfig] = useState<DateStampConfig>({
    enabled: true,
    date: "'26 10 03",
    format: 'retro-digital',
    color: '#EA580C',
    position: 'strip-footer',
  });

  const [stickers, setStickers] = useState<StickerItem[]>([
    { id: 'st-1', emoji: '✨', x: 88, y: 8, scale: 1.1, rotation: 12 },
    { id: 'st-2', emoji: '🎀', x: 12, y: 92, scale: 1.0, rotation: -10 },
  ]);

  // Modals
  const [cameraModalSlotId, setCameraModalSlotId] = useState<string | null>(null);
  const [adjustingSlotId, setAdjustingSlotId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedCanvas, setExportedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Room (2 Peoples in the same Room Code)
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [isRoomConnected, setIsRoomConnected] = useState<boolean>(false);
  const [partnerName, setPartnerName] = useState<string>('Partner');
  const [userName, setUserName] = useState<string>('You');
  const [duoMode, setDuoMode] = useState<'shared' | 'alternating'>('shared');
  const [incomingNudge, setIncomingNudge] = useState<{ sender: string; emoji: string; text: string } | null>(null);

  // Remember slots whenever they change
  useEffect(() => {
    slots.forEach((s, idx) => {
      slotMemoryRef.current[idx] = s;
    });
  }, [slots]);

  // Handle layout change while preserving all photos
  const handleSelectLayout = (newLayoutId: LayoutId, syncToRoom = true) => {
    setLayoutId(newLayoutId);
    const newConfig = LAYOUT_CONFIGS[newLayoutId];

    setSlots((prev) => {
      // Save current state into memory ref first
      prev.forEach((s, idx) => {
        slotMemoryRef.current[idx] = s;
      });

      // Build new slots using remembered cache
      const updated: PhotoSlotData[] = [];
      for (let i = 0; i < newConfig.slotsCount; i++) {
        if (slotMemoryRef.current[i]) {
          updated.push({ ...slotMemoryRef.current[i] });
        } else {
          updated.push({
            id: `slot-${i}-${Date.now()}`,
            imageSrc: null,
            transform: { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: false },
          });
        }
      }
      return updated;
    });

    if (newLayoutId === 'polaroid-single') {
      setBorderConfig((prev) => ({ ...prev, width: 18, borderRadius: 4 }));
    }

    if (syncToRoom && currentRoomId) {
      roomManager.broadcast('LAYOUT_UPDATE', { layoutId: newLayoutId }, userName);
    }
  };

  // Record photo in persistent history tray
  const recordPhotoInHistory = (photoSrc: string) => {
    setPhotoHistory((prev) => {
      // Don't add duplicate if already most recent
      if (prev.length > 0 && prev[0].src === photoSrc) return prev;
      return [{ id: `photo-${Date.now()}`, src: photoSrc, timestamp: Date.now() }, ...prev];
    });
  };

  // Insert photo from tray into active or first empty slot
  const handleInsertFromTray = (photoSrc: string) => {
    setSlots((prev) => {
      let targetIndex = -1;
      if (activeSlotId) {
        targetIndex = prev.findIndex((s) => s.id === activeSlotId);
      }
      if (targetIndex === -1) {
        targetIndex = prev.findIndex((s) => !s.imageSrc);
      }
      if (targetIndex === -1) targetIndex = 0; // replace first if all filled

      const targetSlot = prev[targetIndex];
      const updated = prev.map((s, idx) =>
        idx === targetIndex
          ? { ...s, imageSrc: photoSrc, transform: { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: false } }
          : s
      );

      slotMemoryRef.current[targetIndex] = updated[targetIndex];

      if (currentRoomId && targetSlot) {
        roomManager.broadcast(
          'SLOT_PHOTO_UPDATE',
          { slotIndex: targetIndex, imageSrc: photoSrc, transform: updated[targetIndex].transform },
          userName
        );
      }

      return updated;
    });
  };

  // Update image transformation
  const handleUpdateTransform = (slotId: string, newTransform: TransformState, syncToRoom = true) => {
    setSlots((prev) => {
      const slotIndex = prev.findIndex((s) => s.id === slotId);
      const updated = prev.map((s) => (s.id === slotId ? { ...s, transform: newTransform } : s));
      if (slotIndex >= 0) {
        slotMemoryRef.current[slotIndex] = updated[slotIndex];
      }
      if (syncToRoom && currentRoomId && slotIndex >= 0) {
        roomManager.broadcast('SLOT_TRANSFORM_UPDATE', { slotIndex, transform: newTransform }, userName);
      }
      return updated;
    });
  };

  // Update per-slot filter
  const handleUpdateSlotFilter = (slotId: string, filter?: FilterId) => {
    setSlots((prev) => {
      const slotIndex = prev.findIndex((s) => s.id === slotId);
      const updated = prev.map((s) => (s.id === slotId ? { ...s, slotFilter: filter } : s));
      if (slotIndex >= 0) {
        slotMemoryRef.current[slotIndex] = updated[slotIndex];
      }
      return updated;
    });
  };

  // Replace slot photo from file upload
  const handleFileUpload = (slotId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        recordPhotoInHistory(dataUrl);
        setSlots((prev) => {
          const slotIndex = prev.findIndex((s) => s.id === slotId);
          const defaultTransform = { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: false };
          const updated = prev.map((s) =>
            s.id === slotId
              ? { ...s, imageSrc: dataUrl, transform: defaultTransform }
              : s
          );
          if (slotIndex >= 0) {
            slotMemoryRef.current[slotIndex] = updated[slotIndex];
          }
          if (currentRoomId && slotIndex >= 0) {
            roomManager.broadcast(
              'SLOT_PHOTO_UPDATE',
              { slotIndex, imageSrc: dataUrl, transform: defaultTransform },
              userName
            );
          }
          return updated;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Capture photo from webcam
  const handleCameraCapture = (slotId: string, imageDataUrl: string) => {
    recordPhotoInHistory(imageDataUrl);
    setSlots((prev) => {
      const slotIndex = prev.findIndex((s) => s.id === slotId);
      const defaultTransform = { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: false };
      const updated = prev.map((s) =>
        s.id === slotId
          ? { ...s, imageSrc: imageDataUrl, transform: defaultTransform }
          : s
      );
      if (slotIndex >= 0) {
        slotMemoryRef.current[slotIndex] = updated[slotIndex];
      }
      if (currentRoomId && slotIndex >= 0) {
        roomManager.broadcast(
          'SLOT_PHOTO_UPDATE',
          { slotIndex, imageSrc: imageDataUrl, transform: defaultTransform },
          userName
        );
      }
      return updated;
    });
  };

  // Burst capture completes
  const handleBurstCaptureComplete = (captures: { slotId: string; imageDataUrl: string }[]) => {
    captures.forEach((c) => recordPhotoInHistory(c.imageDataUrl));
    setSlots((prev) => {
      const defaultTransform = { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: false };
      const updated = prev.map((s, idx) => {
        const match = captures.find((c) => c.slotId === s.id);
        if (match) {
          const newSlot = { ...s, imageSrc: match.imageDataUrl, transform: defaultTransform };
          slotMemoryRef.current[idx] = newSlot;
          if (currentRoomId) {
            roomManager.broadcast(
              'SLOT_PHOTO_UPDATE',
              { slotIndex: idx, imageSrc: match.imageDataUrl, transform: defaultTransform },
              userName
            );
          }
          return newSlot;
        }
        return s;
      });
      return updated;
    });
  };

  // Remove photo from slot
  const handleRemovePhoto = (slotId: string) => {
    setSlots((prev) => {
      const slotIndex = prev.findIndex((s) => s.id === slotId);
      const updated = prev.map((s) =>
        s.id === slotId
          ? { ...s, imageSrc: null, transform: { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: false }, slotFilter: undefined }
          : s
      );
      if (slotIndex >= 0) {
        slotMemoryRef.current[slotIndex] = updated[slotIndex];
      }
      if (currentRoomId && slotIndex >= 0) {
        roomManager.broadcast('SLOT_PHOTO_UPDATE', { slotIndex, imageSrc: null }, userName);
      }
      return updated;
    });
  };

  // Clear all photos in current strip
  const handleClearAllPhotos = () => {
    setSlots((prev) =>
      prev.map((s, idx) => {
        const cleared = { ...s, imageSrc: null, transform: { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: false }, slotFilter: undefined };
        slotMemoryRef.current[idx] = cleared;
        return cleared;
      })
    );
  };

  // Load sample photos for instant demonstration
  const handleLoadSamplePhotos = () => {
    const demoThemes: ('pose1' | 'pose2' | 'pose3' | 'pose4')[] = ['pose1', 'pose2', 'pose3', 'pose4'];
    setSlots((prev) => {
      const updated = prev.map((s, idx) => {
        const img = generateSamplePhoto(demoThemes[idx % demoThemes.length]);
        recordPhotoInHistory(img);
        const slotData = { ...s, imageSrc: img, transform: { x: 0, y: 0, scale: 1.0, rotation: 0, flipH: false } };
        slotMemoryRef.current[idx] = slotData;
        if (currentRoomId) {
          roomManager.broadcast(
            'SLOT_PHOTO_UPDATE',
            { slotIndex: idx, imageSrc: img, transform: slotData.transform },
            userName
          );
        }
        return slotData;
      });
      return updated;
    });
  };

  // Add sticker at specific position
  const handleAddStickerAtPos = (emoji: string, x: number, y: number, syncToRoom = true) => {
    const newSticker: StickerItem = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      emoji,
      x: Math.round(x),
      y: Math.round(y),
      scale: 1.0,
      rotation: Math.floor(Math.random() * 20) - 10,
    };
    const updated = [...stickers, newSticker];
    setStickers(updated);
    if (syncToRoom && currentRoomId) {
      roomManager.broadcast('STICKER_UPDATE', { stickers: updated }, userName);
    }
  };

  // Add sticker randomly
  const handleAddSticker = (emoji: string, syncToRoom = true) => {
    handleAddStickerAtPos(
      emoji,
      20 + Math.floor(Math.random() * 60),
      15 + Math.floor(Math.random() * 70),
      syncToRoom
    );
  };

  const handleUpdateSticker = (stickerId: string, updates: Partial<StickerItem>, syncToRoom = true) => {
    setStickers((prev) => {
      const updated = prev.map((st) => (st.id === stickerId ? { ...st, ...updates } : st));
      if (syncToRoom && currentRoomId) {
        roomManager.broadcast('STICKER_UPDATE', { stickers: updated }, userName);
      }
      return updated;
    });
  };

  const handleRemoveSticker = (stickerId: string) => {
    const updated = stickers.filter((st) => st.id !== stickerId);
    setStickers(updated);
    if (currentRoomId) {
      roomManager.broadcast('STICKER_UPDATE', { stickers: updated }, userName);
    }
  };

  // Style change broadcasters
  const handleChangeBorderConfig = (updates: Partial<FrameBorderConfig>) => {
    const newConfig = { ...borderConfig, ...updates };
    setBorderConfig(newConfig);
    if (currentRoomId) {
      roomManager.broadcast('STYLE_UPDATE', { borderConfig: newConfig }, userName);
    }
  };

  const handleChangeGlobalFilter = (filter: FilterId) => {
    setGlobalFilter(filter);
    if (currentRoomId) {
      roomManager.broadcast('STYLE_UPDATE', { globalFilter: filter }, userName);
    }
  };

  const handleChangeCaptionConfig = (updates: Partial<CaptionConfig>) => {
    const newConfig = { ...captionConfig, ...updates };
    setCaptionConfig(newConfig);
    if (currentRoomId) {
      roomManager.broadcast('STYLE_UPDATE', { captionConfig: newConfig }, userName);
    }
  };

  const handleChangeDateStampConfig = (updates: Partial<DateStampConfig>) => {
    const newConfig = { ...dateStampConfig, ...updates };
    setDateStampConfig(newConfig);
    if (currentRoomId) {
      roomManager.broadcast('STYLE_UPDATE', { dateStampConfig: newConfig }, userName);
    }
  };

  // Export Photobooth Strip to Canvas at 300 DPI
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const canvas = await renderPhotoboothToCanvas({
        layout: currentLayout,
        slots,
        globalFilter,
        borderConfig,
        captionConfig,
        dateStampConfig,
        stickers,
        dpi: 300,
      });
      setExportedCanvas(canvas);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate high-resolution export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Room synchronization listeners
  useEffect(() => {
    roomManager.setCallbacks(
      (msg: RoomSyncMessage) => {
        switch (msg.type) {
          case 'SYNC_FULL_STATE': {
            if (msg.payload.layoutId) {
              setLayoutId(msg.payload.layoutId);
            }
            if (msg.payload.slots) {
              setSlots(msg.payload.slots);
              msg.payload.slots.forEach((s: PhotoSlotData, idx: number) => {
                slotMemoryRef.current[idx] = s;
                if (s.imageSrc) recordPhotoInHistory(s.imageSrc);
              });
            }
            if (msg.payload.borderConfig) setBorderConfig(msg.payload.borderConfig);
            if (msg.payload.globalFilter) setGlobalFilter(msg.payload.globalFilter);
            if (msg.payload.captionConfig) setCaptionConfig(msg.payload.captionConfig);
            if (msg.payload.stickers) setStickers(msg.payload.stickers);
            break;
          }
          case 'SLOT_PHOTO_UPDATE': {
            const { slotIndex, imageSrc, transform } = msg.payload;
            if (imageSrc) recordPhotoInHistory(imageSrc);
            setSlots((prev) => {
              if (!prev[slotIndex]) return prev;
              const updated = prev.map((s, idx) =>
                idx === slotIndex
                  ? { ...s, imageSrc, transform: transform || s.transform }
                  : s
              );
              slotMemoryRef.current[slotIndex] = updated[slotIndex];
              return updated;
            });
            break;
          }
          case 'SLOT_TRANSFORM_UPDATE': {
            const { slotIndex, transform } = msg.payload;
            setSlots((prev) => {
              if (!prev[slotIndex]) return prev;
              const updated = prev.map((s, idx) =>
                idx === slotIndex ? { ...s, transform } : s
              );
              slotMemoryRef.current[slotIndex] = updated[slotIndex];
              return updated;
            });
            break;
          }
          case 'LAYOUT_UPDATE': {
            if (msg.payload.layoutId) {
              handleSelectLayout(msg.payload.layoutId, false);
            }
            break;
          }
          case 'STYLE_UPDATE': {
            if (msg.payload.borderConfig) setBorderConfig(msg.payload.borderConfig);
            if (msg.payload.globalFilter) setGlobalFilter(msg.payload.globalFilter);
            if (msg.payload.captionConfig) setCaptionConfig(msg.payload.captionConfig);
            if (msg.payload.dateStampConfig) setDateStampConfig(msg.payload.dateStampConfig);
            break;
          }
          case 'STICKER_UPDATE': {
            if (msg.payload.stickers) setStickers(msg.payload.stickers);
            break;
          }
          case 'PARTNER_CHAT': {
            setIncomingNudge({
              sender: msg.senderName || 'Partner',
              emoji: msg.payload.emoji || '💬',
              text: msg.payload.text || '',
            });
            setTimeout(() => setIncomingNudge(null), 4000);
            break;
          }
        }
      },
      (connected: boolean, pName: string) => {
        setIsRoomConnected(connected);
        if (connected) {
          setPartnerName(pName);
          // If I am host, send my current photobooth state to partner!
          roomManager.broadcast('SYNC_FULL_STATE', {
            layoutId,
            slots,
            borderConfig,
            globalFilter,
            captionConfig,
            stickers,
          }, userName);
        }
      }
    );
  }, [layoutId, slots, borderConfig, globalFilter, captionConfig, stickers, userName]);

  // Create Room
  const handleCreateRoom = async (code: string) => {
    const assignedCode = await roomManager.createRoom(code, userName);
    setCurrentRoomId(assignedCode);
    setIsRoomConnected(false);
  };

  // Join Room
  const handleJoinRoom = async (code: string) => {
    const success = await roomManager.joinRoom(code, userName);
    if (success) {
      setCurrentRoomId(code);
    }
  };

  // Leave Room
  const handleLeaveRoom = () => {
    roomManager.leaveRoom();
    setCurrentRoomId('');
    setIsRoomConnected(false);
  };

  // Send Nudge reaction
  const handleSendNudge = (emoji: string, text: string) => {
    roomManager.broadcast('PARTNER_CHAT', { emoji, text }, userName);
  };

  const filledCount = slots.filter((s) => Boolean(s.imageSrc)).length;
  const emptySlots = slots.filter((s) => !s.imageSrc);
  const adjustingSlot = slots.find((s) => s.id === adjustingSlotId);
  const adjustingSlotIndex = slots.findIndex((s) => s.id === adjustingSlotId);

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col selection:bg-rose-200">
      {/* Top Navigation */}
      <Navbar
        onLoadSamplePhotos={handleLoadSamplePhotos}
        onClearAllPhotos={handleClearAllPhotos}
        onExport={handleExport}
        isExporting={isExporting}
        filledCount={filledCount}
        totalSlots={currentLayout.slotsCount}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        currentRoomId={currentRoomId}
        isRoomConnected={isRoomConnected}
        partnerName={partnerName}
      />

      {/* Real-time Partner Nudge Toast Notification */}
      {incomingNudge && (
        <div className="fixed top-18 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-zinc-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-zinc-700 flex items-center space-x-3">
            <span className="text-2xl">{incomingNudge.emoji}</span>
            <div>
              <div className="text-[11px] font-bold text-rose-400">{incomingNudge.sender} says:</div>
              <div className="text-xs font-semibold">{incomingNudge.text}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Photo Strip Interactive Stage */}
        <section className="lg:col-span-7 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl p-4 sm:p-8 border border-zinc-200/60 shadow-xs relative">
          
          {/* Subtle Top Info Bar */}
          <div className="w-full flex items-center justify-between mb-2 px-2 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-700 flex items-center space-x-1.5">
              <span>{currentLayout.name}</span>
              <span className="text-[10px] bg-zinc-200/70 text-zinc-600 px-2 py-0.5 rounded-full font-mono">
                {filledCount}/{currentLayout.slotsCount} Frames Filled
              </span>
              {currentRoomId && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                  isRoomConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Room: {currentRoomId} ({isRoomConnected ? '2/2' : '1/2'})
                </span>
              )}
            </span>
            <span className="text-zinc-400 hidden sm:inline text-[11px]">
              Drag & pan inside frames • Scroll to zoom
            </span>
          </div>

          {/* Interactive Photobooth Physical Strip */}
          <PhotoboothStrip
            layout={currentLayout}
            slots={slots}
            globalFilter={globalFilter}
            borderConfig={borderConfig}
            captionConfig={captionConfig}
            dateStampConfig={dateStampConfig}
            stickers={stickers}
            activeSlotId={activeSlotId}
            onSelectSlot={(slotId) => setActiveSlotId(slotId)}
            onOpenAdjustment={(slotId) => setAdjustingSlotId(slotId)}
            onOpenCamera={(slotId) => setCameraModalSlotId(slotId)}
            onFileUpload={handleFileUpload}
            onRemovePhoto={handleRemovePhoto}
            onUpdateTransform={handleUpdateTransform}
            onUpdateSticker={handleUpdateSticker}
            onRemoveSticker={handleRemoveSticker}
            onAddStickerAtPos={handleAddStickerAtPos}
            isRoomConnected={isRoomConnected}
            duoMode={duoMode}
            userName={userName}
            partnerName={partnerName}
          />

          {/* Captured Photos Tray (Remembers all photos across size/layout changes!) */}
          <PhotoTray
            photoHistory={photoHistory}
            onSelectPhotoForSlot={handleInsertFromTray}
            onClearHistory={() => setPhotoHistory([])}
            onDeleteHistoryItem={(id) => setPhotoHistory((prev) => prev.filter((p) => p.id !== id))}
          />

          {/* Quick Slot Helper Action Bar */}
          {emptySlots.length > 0 && (
            <div className="mt-4 flex items-center space-x-3 text-xs">
              <button
                onClick={() => setCameraModalSlotId(emptySlots[0].id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-medium shadow-sm transition active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Next Empty Frame</span>
              </button>
            </div>
          )}
        </section>

        {/* Right Side: Control & Customization Sidebar */}
        <section className="lg:col-span-5 h-[calc(100vh-120px)] lg:sticky lg:top-20">
          <ControlPanel
            currentLayoutId={layoutId}
            onSelectLayout={(lid) => handleSelectLayout(lid, true)}
            globalFilter={globalFilter}
            onSelectFilter={handleChangeGlobalFilter}
            borderConfig={borderConfig}
            onChangeBorderConfig={handleChangeBorderConfig}
            captionConfig={captionConfig}
            onChangeCaptionConfig={handleChangeCaptionConfig}
            dateStampConfig={dateStampConfig}
            onChangeDateStampConfig={handleChangeDateStampConfig}
            stickers={stickers}
            onAddSticker={(emoji) => handleAddSticker(emoji, true)}
            onClearStickers={() => {
              setStickers([]);
              if (currentRoomId) roomManager.broadcast('STICKER_UPDATE', { stickers: [] }, userName);
            }}
          />
        </section>
      </main>

      {/* Webcam Capture Modal */}
      {cameraModalSlotId && (
        <CameraModal
          targetSlotId={cameraModalSlotId}
          slotIndex={slots.findIndex((s) => s.id === cameraModalSlotId)}
          totalSlots={slots.length}
          emptySlotsCount={emptySlots.length}
          emptySlotIds={emptySlots.map((s) => s.id)}
          onCaptureComplete={handleCameraCapture}
          onBurstCaptureComplete={handleBurstCaptureComplete}
          onClose={() => setCameraModalSlotId(null)}
        />
      )}

      {/* Slot Fine-Adjustment Modal */}
      {adjustingSlot && (
        <SlotAdjustmentModal
          slot={adjustingSlot}
          slotIndex={adjustingSlotIndex}
          totalSlots={slots.length}
          slotAspectRatio={currentLayout.slotAspectRatio}
          globalFilter={globalFilter}
          onUpdateTransform={handleUpdateTransform}
          onUpdateSlotFilter={handleUpdateSlotFilter}
          onReplaceImageWithUpload={handleFileUpload}
          onOpenCameraForSlot={(slotId) => {
            setAdjustingSlotId(null);
            setCameraModalSlotId(slotId);
          }}
          onRemoveImage={handleRemovePhoto}
          onClose={() => setAdjustingSlotId(null)}
        />
      )}

      {/* Export & Print 300 DPI Modal */}
      {exportedCanvas && (
        <ExportModal
          canvas={exportedCanvas}
          layoutName={currentLayout.name}
          dpi={300}
          widthInches={currentLayout.exportWidthInches}
          heightInches={currentLayout.exportHeightInches}
          onClose={() => setExportedCanvas(null)}
        />
      )}

      {/* Two-Player Photobooth Room Modal */}
      {isRoomModalOpen && (
        <RoomModal
          currentRoomId={currentRoomId}
          isConnected={isRoomConnected}
          partnerName={partnerName}
          userName={userName}
          duoMode={duoMode}
          onSetDuoMode={setDuoMode}
          onSetUserName={setUserName}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
          onSendNudge={handleSendNudge}
          onClose={() => setIsRoomModalOpen(false)}
        />
      )}
    </div>
  );
}
export default App;
