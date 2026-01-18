
export type CollectionStatus = 'IDEATION' | 'IN_PROGRESS' | 'ARCHIVED';

export interface StickerItem {
  id: string; // Use string for dnd-kit compatibility
  originalOrder: number;
  name: string;
  imageUrl?: string;
}

export interface StickerSet {
  id: string;
  order: number; // Added for manual sorting on dashboard
  title: string;
  enTitle: string;
  series: string;
  zhDesc: string;
  enDesc: string;
  storeUrl: string;
  status: CollectionStatus;
  type: 'Sticker' | 'Emoji';
  itemCount: number;
  createdAt: number;
  items: StickerItem[];
}

export type ViewState = 'LIST' | 'EDITOR';
