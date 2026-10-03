import React from 'react';
import { Image as ImageIcon, Plus, Trash2, ArrowUpRight, Camera } from 'lucide-react';

interface PhotoTrayProps {
  photoHistory: { id: string; src: string; timestamp: number }[];
  onSelectPhotoForSlot: (photoSrc: string) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const PhotoTray: React.FC<PhotoTrayProps> = ({
  photoHistory,
  onSelectPhotoForSlot,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  if (photoHistory.length === 0) return null;

  return (
    <div className="w-full mt-4 bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-zinc-200/70 shadow-2xs">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center space-x-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-xs font-bold text-zinc-700">Captured Photos Tray</span>
          <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full font-mono">
            {photoHistory.length} saved
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-zinc-400 hidden sm:inline">
            Click any photo to insert into active or next empty frame
          </span>
          <button
            onClick={onClearHistory}
            className="text-[10px] text-zinc-400 hover:text-red-500 transition"
            title="Clear saved photo tray"
          >
            Clear Tray
          </button>
        </div>
      </div>

      {/* Horizontal thumbnail list */}
      <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 pt-0.5">
        {photoHistory.map((item, idx) => (
          <div
            key={item.id}
            className="relative group flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-zinc-200 hover:border-rose-400 cursor-pointer shadow-2xs transition transform hover:scale-105"
            onClick={() => onSelectPhotoForSlot(item.src)}
            title={`Insert Photo #${idx + 1} into strip`}
          >
            <img
              src={item.src}
              alt={`Captured ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Overlay hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
              <ArrowUpRight className="w-4 h-4 text-white" />
              <span className="text-[9px] font-semibold mt-0.5">Use</span>
            </div>

            {/* Individual delete badge */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteHistoryItem(item.id);
              }}
              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[9px]"
              title="Remove from tray"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
