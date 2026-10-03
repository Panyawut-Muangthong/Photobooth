export type LayoutId = 'korean-4cut' | 'vintage-3cut' | 'square-2x2' | 'polaroid-single';

export interface LayoutConfig {
  id: LayoutId;
  name: string;
  tagline: string;
  slotsCount: number;
  columns: number;
  rows: number;
  slotAspectRatio: number; // width / height, e.g. 4/3 or 3/2 or 1
  exportWidthInches: number; // e.g., 2 inches for strip, 4 inches for card
  exportHeightInches: number; // e.g., 6 inches
  defaultGap: number;
  defaultPadding: number;
  iconName: string;
}

export type FilterId = 
  | 'normal' 
  | 'bw' 
  | 'vintage-grain' 
  | 'warm-retro' 
  | 'tokyo-pastel' 
  | 'high-contrast'
  | 'cyber-pink'
  | 'nostalgia-sepia';

export interface FilterPreset {
  id: FilterId;
  name: string;
  cssFilter: string;
  description: string;
  toneColor?: string;
}

export interface TransformState {
  x: number; // offset X in percentage or px
  y: number; // offset Y in percentage or px
  scale: number; // 1.0 to 3.0
  rotation: number; // 0, 90, 180, 270
  flipH: boolean; // mirrored
}

export interface PhotoSlotData {
  id: string;
  imageSrc: string | null;
  transform: TransformState;
  slotFilter?: FilterId; // slot-specific filter override if set
}

export type PaperTexture = 'clean' | 'grain' | 'matte' | 'film';

export interface FrameBorderConfig {
  color: string;
  customColor?: string;
  width: number; // border padding in px
  gap: number; // gap between photos in px
  borderRadius: number; // corner roundness
  texture: PaperTexture;
  aspectRatioLock: boolean;
}

export interface CaptionConfig {
  enabled: boolean;
  text: string;
  font: 'caveat' | 'mono' | 'display' | 'playfair';
  size: number;
  color: string;
}

export interface DateStampConfig {
  enabled: boolean;
  date: string;
  format: 'dots' | 'slashes' | 'retro-digital' | 'analog';
  color: string; // e.g. orange LED '#FF7700' or subtle dark '#333333'
  position: 'strip-footer' | 'corner' | 'bottom-right';
}

export interface StickerItem {
  id: string;
  emoji: string;
  x: number; // percentage
  y: number; // percentage
  scale: number;
  rotation: number;
}
