import React from 'react';
import { 
  Camera, 
  Sparkles, 
  Download, 
  Trash2, 
  Wand2, 
  Users,
  Wifi
} from 'lucide-react';

interface NavbarProps {
  onLoadSamplePhotos: () => void;
  onClearAllPhotos: () => void;
  onExport: () => void;
  isExporting: boolean;
  filledCount: number;
  totalSlots: number;
  onOpenRoomModal: () => void;
  currentRoomId: string;
  isRoomConnected: boolean;
  partnerName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoadSamplePhotos,
  onClearAllPhotos,
  onExport,
  isExporting,
  filledCount,
  totalSlots,
  onOpenRoomModal,
  currentRoomId,
  isRoomConnected,
  partnerName,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-zinc-900 font-display">
                Lensbooth
              </span>
              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
              Korean 4-Cut & Vintage Photo Strip Studio • 인생네컷
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Room (2 Peoples in same room) */}
          <button
            onClick={onOpenRoomModal}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
              currentRoomId 
                ? isRoomConnected 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 ring-2 ring-emerald-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-300 ring-2 ring-amber-100'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
            }`}
            title="Connect 2 people in the same room code"
          >
            <Users className="w-3.5 h-3.5" />
            {currentRoomId ? (
              <span className="flex items-center space-x-1">
                <span className={`w-2 h-2 rounded-full ${isRoomConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className="font-mono font-bold">{currentRoomId}</span>
                <span className="hidden md:inline text-[10px] opacity-80">
                  ({isRoomConnected ? partnerName : '1/2'})
                </span>
              </span>
            ) : (
              <span>2 Peoples Room</span>
            )}
          </button>

          {/* Load Demo / Sample Photos */}
          <button
            onClick={onLoadSamplePhotos}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 transition active:scale-95"
            title="Load aesthetic demo photos for instant testing"
          >
            <Wand2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden md:inline">Sample Photos</span>
            <span className="md:hidden">Demo</span>
          </button>

          {/* Clear strip */}
          {filledCount > 0 && (
            <button
              onClick={onClearAllPhotos}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 transition active:scale-95 flex items-center space-x-1"
              title="Reset all frames"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Export Strip (300 DPI) */}
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold bg-rose-500 hover:bg-rose-600 active:scale-95 text-white shadow-md shadow-rose-500/25 transition disabled:opacity-50"
          >
            {isExporting ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Rendering...</span>
              </span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Strip</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono hidden sm:inline">
                  300 DPI
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
