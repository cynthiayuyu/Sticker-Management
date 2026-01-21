
import React, { useRef, useState } from 'react';
import { StickerItem } from '../types';
import { compressImage } from '../utils/imageCompression';

interface StickerItemCardProps {
  item: StickerItem;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<StickerItem>) => void;
}

export const StickerItemCard: React.FC<StickerItemCardProps> = ({ item, index, isSelected, onSelect, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        // Compress image before storing
        const compressedDataUrl = await compressImage(file, 800, 0.85);
        onUpdate(item.id, { imageUrl: compressedDataUrl });
      } catch (error) {
        console.error('圖片壓縮失敗:', error);
        alert('圖片上傳失敗，請重試');
      } finally {
        setIsCompressing(false);
      }
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking delete
    if (window.confirm('確定要刪除這張圖片嗎？')) {
      onUpdate(item.id, { imageUrl: undefined });
    }
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
        {isCompressing ? (
          <div className="flex flex-col items-center justify-center text-[#7D7489]">
            <div className="animate-spin w-6 h-6 border-2 border-[#E5E0D8] border-t-[#7D7489] rounded-full mb-2"></div>
            <span className="text-[10px] font-cormorant">壓縮中...</span>
          </div>
        ) : item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
        ) : (
          <div className="text-[#E5E0D8] flex flex-col items-center">
            <span className="font-cormorant italic text-lg opacity-50">+</span>
          </div>
        )}

        {/* Delete Button (top-right, only when image exists) */}
        {item.imageUrl && (
          <button
            onClick={handleDelete}
            className="absolute top-1 right-1 p-1.5 bg-white/90 text-red-400 hover:text-red-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all rounded-full shadow-sm border border-[#E5E0D8] hover:border-red-300 z-20"
            title="刪除圖片"
          >
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
              <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4H3.5C3.22386 4 3 3.77614 3 3.5ZM5 4V12H10V4H5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </button>
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
        <textarea
          value={item.name}
          placeholder="名稱"
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          rows={2}
          className="w-full text-center text-sm md:text-base font-fangsong text-[#5D5550] placeholder-[#D8D2CB] focus:outline-none bg-transparent py-2 border-b border-transparent focus:border-[#7D7489] transition-all resize-none overflow-hidden break-words"
          style={{
            minHeight: '2.5rem',
            maxHeight: '5rem'
          }}
          onInput={(e) => {
            // Auto-resize textarea based on content
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 80) + 'px';
          }}
        />
      </div>
    </div>
  );
};
