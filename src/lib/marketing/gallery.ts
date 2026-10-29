export interface GalleryPiece {
  id: string;
  title: string;
  palette: Record<string, string>;
  rows: string[];
  size: string;
  colors: number;
  beads: number;
  /** Optional AI-generated showcase photo served from /public/gallery. */
  imageUrl?: string;
  imageAlt?: string;
}

export const GALLERY_PIECES: GalleryPiece[] = [
  {
    id: 'cyber-cat',
    title: 'Cyber Cat',
    size: '29 × 29',
    colors: 9,
    beads: 512,
    imageUrl: '/gallery/bead-sprites.png',
    imageAlt:
      'AI-generated example of finished fuse bead cat and heart sprites on a cream pegboard',
    palette: {
      a: '#2B2A29',
      b: '#FF6B6B',
      c: '#FFB84C',
      d: '#3BC9DB',
      e: '#7C5CFF',
      f: '#FFFFFF',
      g: '#F6F1E7',
      h: '#6B6660',
      i: '#34C759',
    },
    rows: [
      '.....aaaaa.....',
      '....aaaaaaa....',
      '...aagggggaa...',
      '..aagggggggaa..',
      '..agffggffga...',
      '..agdfggfdga...',
      '..aggggggggaa..',
      '..aggbbbbgga...',
      '...aaggggaaa...',
      '....aaaaaaa....',
      '.....aaaaa.....',
    ],
  },
  {
    id: 'sprite-mushroom',
    title: 'Pixel Mushroom',
    size: '29 × 29',
    colors: 7,
    beads: 398,
    palette: {
      a: '#FF4D4F',
      b: '#FFFDF7',
      c: '#6B6660',
      d: '#FFB84C',
      e: '#2B2A29',
      f: '#F6F1E7',
    },
    rows: [
      '...fffff...',
      '..faaaaf...',
      '.fabbaaaf..',
      'fabbabbaaf.',
      'faaaaaaaaf.',
      '.ffffffff..',
      '...fdddf...',
      '...fdddf...',
      '...fdddf...',
      '....fff....',
    ],
  },
  {
    id: 'kandi-heart',
    title: 'Kandi Heart',
    size: '29 × 29',
    colors: 6,
    beads: 341,
    palette: {
      a: '#FF6B6B',
      b: '#FFB84C',
      c: '#FFFDF7',
      d: '#7C5CFF',
      e: '#F6F1E7',
    },
    rows: [
      '..aa...aa..',
      '.abba.abba.',
      'abbbbabbbba',
      'abbbbbbbbba',
      'abbbbbbbbba',
      '.abbbbbbba.',
      '..abbbbba..',
      '...abbba...',
      '....aba....',
      '.....a.....',
    ],
  },
  {
    id: 'invader',
    title: 'Space Invader',
    size: '29 × 29',
    colors: 5,
    beads: 288,
    palette: {
      a: '#7C5CFF',
      b: '#2B2A29',
      c: '#3BC9DB',
      d: '#FFFDF7',
      e: '#F6F1E7',
    },
    rows: [
      '..a....a..',
      '...aaaa...',
      '..abaaba..',
      '.ababaaba.',
      'ababbbbaba',
      'ababbababa',
      '.ababbaba.',
      '..ab.ba...',
      '.ac....ca.',
      '..c....c..',
    ],
  },
  {
    id: 'sunset-wave',
    title: 'Sunset Wave',
    size: '58 × 58',
    colors: 10,
    beads: 1684,
    palette: {
      a: '#FFB84C',
      b: '#FF6B6B',
      c: '#7C5CFF',
      d: '#3BC9DB',
      e: '#FFFDF7',
      f: '#2B2A29',
      g: '#F6F1E7',
    },
    rows: [
      'gggggggggggg',
      'ggeeeaaaeegg',
      'ggeaaaaaaeeg',
      'ggaaaaaaaaeg',
      'ggbbbbbbbbgg',
      'ggbbbccbbbgg',
      'ggbbccccbbgg',
      'ggbccccccbgg',
      'ggddddddddgg',
      'ggddddddddgg',
      'ggfffddffggg',
      'gggggggggggg',
    ],
  },
  {
    id: 'fox-portrait',
    title: 'Fox Portrait',
    size: '58 × 58',
    colors: 12,
    beads: 2045,
    palette: {
      a: '#FF8A3D',
      b: '#FFFDF7',
      c: '#2B2A29',
      d: '#6B6660',
      e: '#F6F1E7',
      f: '#FFB84C',
    },
    rows: [
      '..aa....aa..',
      '.aaaa..aaaa.',
      '.accaaaacca.',
      'aacccaacccaa',
      'aacbbbaabbca',
      'aaabbbbbbaaa',
      'aaabfbbbfaaa',
      '.aabbbbbbba.',
      '..aabbbbba..',
      '...aabbaa...',
      '....aaaa....',
      '.....aa.....',
    ],
  },
];

export const HERO_ART = GALLERY_PIECES[0];

export const SAMPLE_PROMPTS = [
  'A retro 8-bit cyber-punk cat wearing sunglasses',
  'A cozy pixel-art fox resting on autumn leaves',
  'A kawaii strawberry donut with pastel sprinkles',
  'A tiny pixel dragon sitting on a treasure chest',
  'An arcade-style sunrise over a neon city skyline',
];
