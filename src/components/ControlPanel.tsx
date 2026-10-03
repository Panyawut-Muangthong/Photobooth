import React, { useState } from 'react';
import { 
  Layout, 
  Palette, 
  Sparkles, 
  Type, 
  Smile, 
  Columns, 
  StretchVertical, 
  Grid2X2, 
  Square,
  Check,
  RotateCcw,
  Plus
} from 'lucide-react';
import { 
  FrameBorderConfig, 
  CaptionConfig, 
  DateStampConfig, 
  FilterId, 
  LayoutId, 
  StickerItem 
} from '../types/photobooth';
import { 
  FILTER_PRESETS, 
  FRAME_COLORS, 
  LAYOUT_CONFIGS, 
  STICKER_PALETTE 
} from '../constants/presets';

interface ControlPanelProps {
  currentLayoutId: LayoutId;
  onSelectLayout: (layoutId: LayoutId) => void;
  globalFilter: FilterId;
  onSelectFilter: (filterId: FilterId) => void;
  borderConfig: FrameBorderConfig;
  onChangeBorderConfig: (updates: Partial<FrameBorderConfig>) => void;
  captionConfig: CaptionConfig;
  onChangeCaptionConfig: (updates: Partial<CaptionConfig>) => void;
  dateStampConfig: DateStampConfig;
  onChangeDateStampConfig: (updates: Partial<DateStampConfig>) => void;
  stickers: StickerItem[];
  onAddSticker: (emoji: string) => void;
  onClearStickers: () => void;
}

type TabType = 'layout' | 'filters' | 'text' | 'stickers';

export const ControlPanel: React.FC<ControlPanelProps> = ({
  currentLayoutId,
  onSelectLayout,
  globalFilter,
  onSelectFilter,
  borderConfig,
  onChangeBorderConfig,
  captionConfig,
  onChangeCaptionConfig,
  dateStampConfig,
  onChangeDateStampConfig,
  stickers,
  onAddSticker,
  onClearStickers,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('layout');

  const getLayoutIcon = (id: LayoutId) => {
    switch (id) {
      case 'korean-4cut': return <Columns className="w-4 h-4" />;
      case 'vintage-3cut': return <StretchVertical className="w-4 h-4" />;
      case 'square-2x2': return <Grid2X2 className="w-4 h-4" />;
      case 'polaroid-single': return <Square className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-100 p-2 gap-1 bg-zinc-50/70">
        <button
          onClick={() => setActiveTab('layout')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-2xl text-xs font-semibold transition ${
            activeTab === 'layout'
              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60'
          }`}
        >
          <Layout className="w-3.5 h-3.5 text-rose-500" />
          <span>Frame</span>
        </button>

        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-2xl text-xs font-semibold transition ${
            activeTab === 'filters'
              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Filters</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-2xl text-xs font-semibold transition ${
            activeTab === 'text'
              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60'
          }`}
        >
          <Type className="w-3.5 h-3.5 text-indigo-500" />
          <span>Text & Date</span>
        </button>

        <button
          onClick={() => setActiveTab('stickers')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-2xl text-xs font-semibold transition ${
            activeTab === 'stickers'
              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
              : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60'
          }`}
        >
          <Smile className="w-3.5 h-3.5 text-emerald-500" />
          <span>Stickers</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* TAB 1: LAYOUT & BORDERS */}
        {activeTab === 'layout' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Layout Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Layout Strip Format
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.values(LAYOUT_CONFIGS).map((item) => {
                  const isSelected = currentLayoutId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectLayout(item.id)}
                      className={`flex flex-col p-3 rounded-2xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-200 shadow-sm'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-rose-500 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                          {getLayoutIcon(item.id)}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-rose-500 stroke-[3]" />}
                      </div>
                      <span className="font-semibold text-xs text-zinc-800">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 leading-tight mt-0.5 line-clamp-1">
                        {item.tagline}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frame Background Colors */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Frame Border Color
                </label>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-zinc-400">Custom:</span>
                  <input
                    type="color"
                    value={borderConfig.customColor || borderConfig.color}
                    onChange={(e) => onChangeBorderConfig({ customColor: e.target.value })}
                    className="w-5 h-5 rounded-md cursor-pointer border border-zinc-300 p-0 overflow-hidden"
                  />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {FRAME_COLORS.map((col) => {
                  const isSelected = (!borderConfig.customColor && borderConfig.color === col.value) || borderConfig.customColor === col.value;
                  return (
                    <button
                      key={col.name}
                      title={col.name}
                      onClick={() => onChangeBorderConfig({ color: col.value, customColor: undefined })}
                      style={{ backgroundColor: col.value }}
                      className={`h-8 rounded-xl border transition transform hover:scale-105 flex items-center justify-center ${
                        isSelected 
                          ? 'ring-2 ring-rose-500 border-rose-400 shadow-sm' 
                          : 'border-zinc-300/80 shadow-xs'
                      }`}
                    >
                      {isSelected && (
                        <Check className={`w-3.5 h-3.5 ${col.textDark ? 'text-zinc-900' : 'text-white'} stroke-[3]`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Border Dimensions & Geometry */}
            <div className="space-y-4 pt-1">
              {/* Padding */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-zinc-600">
                  <span>Border Padding</span>
                  <span className="font-mono text-zinc-400">{borderConfig.width}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="36"
                  value={borderConfig.width}
                  onChange={(e) => onChangeBorderConfig({ width: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              {/* Photo Gap */}
              {currentLayoutId !== 'polaroid-single' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-zinc-600">
                    <span>Frame Gap</span>
                    <span className="font-mono text-zinc-400">{borderConfig.gap}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="28"
                    value={borderConfig.gap}
                    onChange={(e) => onChangeBorderConfig({ gap: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
              )}

              {/* Corner Roundness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-zinc-600">
                  <span>Photo Corner Radius</span>
                  <span className="font-mono text-zinc-400">{borderConfig.borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="28"
                  value={borderConfig.borderRadius}
                  onChange={(e) => onChangeBorderConfig({ borderRadius: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              {/* Paper Texture */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600">
                  Paper Texture
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'clean', name: 'Clean Gloss' },
                    { id: 'grain', name: 'Analog Grain' },
                    { id: 'matte', name: 'Vintage Paper' },
                  ].map((tex) => (
                    <button
                      key={tex.id}
                      onClick={() => onChangeBorderConfig({ texture: tex.id as any })}
                      className={`py-2 px-2.5 text-xs font-medium rounded-xl border text-center transition ${
                        borderConfig.texture === tex.id
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {tex.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FILTERS & PRESETS */}
        {activeTab === 'filters' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Global Strip Filter
              </label>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Applies harmonious analog film colors to all frames
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {FILTER_PRESETS.map((f) => {
                const isSelected = globalFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onSelectFilter(f.id)}
                    className={`flex items-start p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-200 shadow-sm'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl mr-3 flex-shrink-0 border border-zinc-200 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: f.toneColor || '#999' }}
                    >
                      {isSelected && <Check className="w-5 h-5 text-white stroke-[3]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-zinc-900">
                        {f.name}
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-tight mt-0.5 line-clamp-2">
                        {f.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TEXT & CAPTIONS */}
        {activeTab === 'text' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Custom Caption */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Custom Strip Caption
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={captionConfig.enabled}
                    onChange={(e) => onChangeCaptionConfig({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>

              {captionConfig.enabled && (
                <div className="space-y-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
                  <input
                    type="text"
                    value={captionConfig.text}
                    placeholder="e.g., SEOUL 2026 ♡ MEMORIES"
                    onChange={(e) => onChangeCaptionConfig({ text: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />

                  {/* Font Family Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'caveat', label: 'Handwritten', fontClass: 'font-caveat text-sm' },
                      { id: 'mono', label: 'Retro Mono', fontClass: 'font-mono-retro text-xs' },
                      { id: 'playfair', label: 'Vintage Serif', fontClass: 'font-serif-vintage text-xs' },
                      { id: 'display', label: 'Modern Sans', fontClass: 'font-sans text-xs' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => onChangeCaptionConfig({ font: f.id as any })}
                        className={`py-2 px-2.5 rounded-xl border text-center transition ${
                          captionConfig.font === f.id
                            ? 'border-rose-500 bg-white text-rose-600 shadow-xs'
                            : 'border-zinc-200 bg-white/60 text-zinc-600 hover:bg-white'
                        }`}
                      >
                        <span className={f.fontClass}>{f.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Size and Color */}
                  <div className="flex items-center space-x-3 pt-1">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[11px] text-zinc-500">
                        <span>Font Size</span>
                        <span>{captionConfig.size}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="28"
                        value={captionConfig.size}
                        onChange={(e) => onChangeCaptionConfig({ size: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-zinc-500 mb-1">Color</span>
                      <input
                        type="color"
                        value={captionConfig.color}
                        onChange={(e) => onChangeCaptionConfig({ color: e.target.value })}
                        className="w-8 h-7 rounded-lg cursor-pointer border border-zinc-200 p-0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Date Stamp */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Retro Date Stamp
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dateStampConfig.enabled}
                    onChange={(e) => onChangeDateStampConfig({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>

              {dateStampConfig.enabled && (
                <div className="space-y-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={dateStampConfig.date}
                      onChange={(e) => onChangeDateStampConfig({ date: e.target.value })}
                      placeholder="e.g. 2026.10.03"
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      onClick={() => {
                        const now = new Date();
                        const pad = (n: number) => n.toString().padStart(2, '0');
                        onChangeDateStampConfig({
                          date: `'${now.getFullYear().toString().slice(2)} ${pad(now.getMonth() + 1)} ${pad(now.getDate())}`
                        });
                      }}
                      className="px-2.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-[11px] font-semibold text-zinc-700"
                      title="Set to Today's Date"
                    >
                      Today
                    </button>
                  </div>

                  {/* Stamp Color quick presets (Retro Orange LED, Classic Black, Muted Grey) */}
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-[11px] text-zinc-500">Style:</span>
                    {[
                      { name: '90s Orange LED', color: '#EA580C' },
                      { name: 'Dark Ink', color: '#18181B' },
                      { name: 'Soft Gray', color: '#71717A' },
                    ].map((st) => (
                      <button
                        key={st.name}
                        onClick={() => onChangeDateStampConfig({ color: st.color })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition ${
                          dateStampConfig.color === st.color
                            ? 'border-rose-500 bg-white font-bold'
                            : 'border-zinc-200 bg-white text-zinc-600'
                        }`}
                        style={{ color: st.color }}
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FUN STICKERS */}
        {activeTab === 'stickers' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Sticker Deco Box
                </label>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Click to add stickers onto your photobooth strip
                </p>
              </div>
              {stickers.length > 0 && (
                <button
                  onClick={onClearStickers}
                  className="text-xs text-red-500 hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
              {STICKER_PALETTE.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => onAddSticker(emoji)}
                  className="h-12 bg-white hover:bg-rose-50 border border-zinc-200 hover:border-rose-300 rounded-xl text-xl flex items-center justify-center transition transform hover:scale-110 active:scale-90 shadow-2xs"
                  title={`Add ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {stickers.length > 0 && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-800">
                💡 Tip: You can drag stickers directly on the photobooth strip or hover to remove them!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
