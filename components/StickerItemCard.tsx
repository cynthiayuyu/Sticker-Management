
import React, { useRef } from 'react';
import { StickerItem } from '../types';

interface StickerItemCardProps {
  item: StickerItem;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<StickerItem>) => void;
}

export const StickerItemCard: React.FC<StickerItemCardProps> = ({ item, index, isSelected, onSelect, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(item.id, { imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking the input or the name field, ignore selection
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT') return;

    // Select the card for swapping
    onSelect(item.id);
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking upload
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative p-4 transition-all duration-500 cursor-pointer ${isSelected
          ? 'bg-white shadow-[0_4px_20px_rgba(125,116,137,0.1)] transform -translate-y-1'
          : 'bg-transparent hover:bg-white/50'
        }`}
    >
      {/* Elegant Border Effect for Selected State */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-500 border ${isSelected ? 'border-[#7D7489] opacity-40' : 'border-transparent opacity-0'
        }`}></div>
      <div className={`absolute inset-1 pointer-events-none transition-all duration-500 border ${isSelected ? 'border-[#E6E4E9]' : 'border-transparent'
        }`}></div>

      <div className="flex justify-between items-center mb-3">
        <div className={`text-sm md:text-base font-cormorant italic tracking-widest transition-colors ${isSelected ? 'text-[#7D7489]' : 'text-[#9F97A8]'
          }`}>
          NO. {(index + 1).toString().padStart(2, '0')}
        </div>

        {/* Selection Indicator */}
        <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isSelected ? 'bg-[#7D7489]' : 'bg-[#E5E0D8] opacity-0 group-hover:opacity-50'
          }`}></div>
      </div>

      <div className={`aspect-square w-full mb-4 flex items-center justify-center relative transition-all duration-500 overflow-hidden ${item.imageUrl ? '' : 'bg-[#F9F8F6] border border-dashed border-[#E5E0D8]'
        }`}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
        ) : (
          <div className="text-[#E5E0D8] flex flex-col items-center">
            <span className="font-cormorant italic text-lg opacity-50">+</span>
          </div>
        )}

        {/* Explicit Upload Button/Overlay */}
        <div
          onClick={triggerUpload}
          className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
        >
          <span className="bg-white/90 text-[#7D7489] text-[10px] px-2 py-1 shadow-sm font-cormorant tracking-widest uppercase rounded-sm border border-[#E5E0D8]">
            {item.imageUrl ? 'Modifier' : 'Ajouter'}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="relative z-20">
        <input
          type="text"
          value={item.name}
          placeholder="名稱"
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          className="w-full text-center text-sm md:text-base font-fangsong text-[#5D5550] placeholder-[#D8D2CB] focus:outline-none bg-transparent py-2 border-b border-transparent focus:border-[#7D7489] transition-all"
        />
      </div>
    </div>
  );
};
