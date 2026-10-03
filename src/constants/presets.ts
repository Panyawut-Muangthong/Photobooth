import { FilterPreset, LayoutConfig } from '../types/photobooth';

export const LAYOUT_CONFIGS: Record<string, LayoutConfig> = {
  'korean-4cut': {
    id: 'korean-4cut',
    name: 'Korean 4-Cut',
    tagline: 'Classic Seoul vertical photo strip (인생네컷)',
    slotsCount: 4,
    columns: 1,
    rows: 4,
    slotAspectRatio: 3 / 2, // 3:2 landscape photos stacked vertically
    exportWidthInches: 2,
    exportHeightInches: 6,
    defaultGap: 10,
    defaultPadding: 16,
    iconName: 'Columns',
  },
  'vintage-3cut': {
    id: 'vintage-3cut',
    name: 'Vintage 3-Cut',
    tagline: 'Classic 90s mall photobooth strip',
    slotsCount: 3,
    columns: 1,
    rows: 3,
    slotAspectRatio: 4 / 3,
    exportWidthInches: 2,
    exportHeightInches: 6,
    defaultGap: 12,
    defaultPadding: 18,
    iconName: 'StretchVertical',
  },
  'square-2x2': {
    id: 'square-2x2',
    name: '2x2 Grid Collage',
    tagline: 'Instagram postcard format (4"x6")',
    slotsCount: 4,
    columns: 2,
    rows: 2,
    slotAspectRatio: 1, // 1:1 square photos
    exportWidthInches: 4,
    exportHeightInches: 6,
    defaultGap: 12,
    defaultPadding: 20,
    iconName: 'Grid2X2',
  },
  'polaroid-single': {
    id: 'polaroid-single',
    name: 'Instant Polaroid',
    tagline: 'Timeless single frame with wide footer',
    slotsCount: 1,
    columns: 1,
    rows: 1,
    slotAspectRatio: 1, // classic square polaroid
    exportWidthInches: 3.5,
    exportHeightInches: 4.25,
    defaultGap: 0,
    defaultPadding: 22,
    iconName: 'Square',
  },
};

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'normal',
    name: 'Original',
    cssFilter: 'none',
    description: 'Crisp, natural true-to-life tones',
    toneColor: '#a1a1aa'
  },
  {
    id: 'bw',
    name: 'Monochrome',
    cssFilter: 'grayscale(100%) contrast(115%) brightness(105%)',
    description: 'Timeless black & white film with deep contrasts',
    toneColor: '#52525b'
  },
  {
    id: 'vintage-grain',
    name: '90s Film Grain',
    cssFilter: 'sepia(25%) contrast(110%) brightness(100%) saturate(120%) hue-rotate(-5deg)',
    description: 'Analog film warmth with nostalgic soft saturation',
    toneColor: '#d97706'
  },
  {
    id: 'warm-retro',
    name: 'Warm Retro',
    cssFilter: 'sepia(40%) saturate(140%) contrast(105%) brightness(102%)',
    description: 'Golden hour sunset tint with creamy highlights',
    toneColor: '#f59e0b'
  },
  {
    id: 'tokyo-pastel',
    name: 'Tokyo Pastel',
    cssFilter: 'saturate(85%) brightness(115%) contrast(92%) hue-rotate(5deg)',
    description: 'Dreamy soft Japanese photobooth light aesthetic',
    toneColor: '#f472b6'
  },
  {
    id: 'high-contrast',
    name: 'Film Noir / Punch',
    cssFilter: 'contrast(140%) brightness(95%) saturate(130%)',
    description: 'Dramatic shadows with vivid pop colors',
    toneColor: '#e11d48'
  },
  {
    id: 'cyber-pink',
    name: 'Y2K Glow',
    cssFilter: 'saturate(160%) hue-rotate(320deg) brightness(108%) contrast(110%)',
    description: 'Vibrant pink-purple Y2K pop booth mood',
    toneColor: '#ec4899'
  },
  {
    id: 'nostalgia-sepia',
    name: 'Sepia 70s',
    cssFilter: 'sepia(80%) contrast(95%) brightness(90%)',
    description: 'Vintage archive sepia print',
    toneColor: '#78350f'
  }
];

export const FRAME_COLORS = [
  { name: 'Pure White', value: '#FFFFFF', textDark: true },
  { name: 'Vintage Cream', value: '#FAF6EE', textDark: true },
  { name: 'Warm Oat', value: '#F3EDE2', textDark: true },
  { name: 'Charcoal Black', value: '#18181B', textDark: false },
  { name: 'Midnight Navy', value: '#0F172A', textDark: false },
  { name: 'Baby Pink', value: '#FCE7F3', textDark: true },
  { name: 'Cherry Blossom', value: '#FBCFE8', textDark: true },
  { name: 'Sweet Peach', value: '#FFEDD5', textDark: true },
  { name: 'Butter Yellow', value: '#FEF08A', textDark: true },
  { name: 'Matcha Sage', value: '#DCFCE7', textDark: true },
  { name: 'Mint Breeze', value: '#D1FAE5', textDark: true },
  { name: 'Soft Lavender', value: '#EDE9FE', textDark: true },
  { name: 'Cloud Blue', value: '#E0F2FE', textDark: true },
  { name: 'Retro Burgundy', value: '#450A0A', textDark: false },
];

export const STICKER_PALETTE = [
  '✨', '💖', '🎀', '🧸', '🌸', '🍒', '🍓', '🫧', '⭐', '🍀',
  '🐰', '🐱', '🕶️', '👑', '📷', '📼', '🎬', '💿', '💌', '🔥'
];
