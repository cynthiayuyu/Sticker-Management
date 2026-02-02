
import React, { useRef, useState } from 'react';
import { StickerItem } from '../types';
import { compressImage } from '../utils/imageCompression';

interface StickerItemCardProps {
  item: StickerItem;
  index: number;
  isSelected: boolean;
  isDragMode?: boolean;
  dragListeners?: Record<string, Function> | undefined;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<StickerItem>) => void;
}

export const StickerItemCard: React.FC<StickerItemCardProps> = ({ item, index, isSelected, isDragMode, dragListeners, onSelect, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('請上傳圖片檔案');
      return;
    }

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
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isDragMode) return; // Don't handle file drops in drag mode
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (isDragMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (isDragMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    if (isDragMode) return;
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除這張圖片嗎？')) {
      onUpdate(item.id, { imageUrl: undefined });
    }
  };

  return (
    <div
      className={`group relative p-4 transition-all duration-500 ${
        isDragMode
          ? 'cursor-grab active:cursor-grabbing bg-white/30 hover:bg-white/60 border border-dashed border-[#E5E0D8] hover:border-[#7D7489]'
          : isSelected
            ? 'bg-white shadow-[0_4px_20px_rgba(125,116,137,0.1)] transform -translate-y-1'
            : 'bg-transparent hover:bg-white/50'
      }`}
    >
      {/* Elegant Border Effect for Selected State */}
      {!isDragMode && (
        <>
          <div className={`absolute inset-0 pointer-events-none transition-all duration-500 border ${isSelected ? 'border-[#7D7489] opacity-40' : 'border-transparent opacity-0'}`}></div>
          <div className={`absolute inset-1 pointer-events-none transition-all duration-500 border ${isSelected ? 'border-[#E6E4E9]' : 'border-transparent'}`}></div>
        </>
      )}

      <div className="flex justify-between items-center mb-3">
        <div className={`text-sm md:text-base font-cormorant italic tracking-widest transition-colors ${isSelected ? 'text-[#7D7489]' : 'text-[#9F97A8]'}`}>
          NO. {(index + 1).toString().padStart(2, '0')}
        </div>

        {isDragMode ? (
          /* Drag Handle */
          <div
            {...dragListeners}
            className="p-1.5 rounded-full bg-[#E5E0D8] text-[#9F97A8] hover:bg-[#7D7489] hover:text-white transition-all duration-300 cursor-grab active:cursor-grabbing"
            title="拖曳以調整順序"
          >
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
              <path d="M5.5 4.625C6.12132 4.625 6.625 4.12132 6.625 3.5C6.625 2.87868 6.12132 2.375 5.5 2.375C4.87868 2.375 4.375 2.87868 4.375 3.5C4.375 4.12132 4.87868 4.625 5.5 4.625ZM9.5 4.625C10.1213 4.625 10.625 4.12132 10.625 3.5C10.625 2.87868 10.1213 2.375 9.5 2.375C8.87868 2.375 8.375 2.87868 8.375 3.5C8.375 4.12132 8.87868 4.625 9.5 4.625ZM6.625 7.5C6.625 8.12132 6.12132 8.625 5.5 8.625C4.87868 8.625 4.375 8.12132 4.375 7.5C4.375 6.87868 4.87868 6.375 5.5 6.375C6.12132 6.375 6.625 6.87868 6.625 7.5ZM9.5 8.625C10.1213 8.625 10.625 8.12132 10.625 7.5C10.625 6.87868 10.1213 6.375 9.5 6.375C8.87868 6.375 8.375 6.87868 8.375 7.5C8.375 8.12132 8.87868 8.625 9.5 8.625ZM6.625 11.5C6.625 12.1213 6.12132 12.625 5.5 12.625C4.87868 12.625 4.375 12.1213 4.375 11.5C4.375 10.8787 4.87868 10.375 5.5 10.375C6.12132 10.375 6.625 10.8787 6.625 11.5ZM9.5 12.625C10.1213 12.625 10.625 12.1213 10.625 11.5C10.625 10.8787 10.1213 10.375 9.5 10.375C8.87868 10.375 8.375 10.8787 8.375 11.5C8.375 12.1213 8.87868 12.625 9.5 12.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
            </svg>
          </div>
        ) : (
          /* Original Swap Button - hidden in drag mode */
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(item.id); }}
            className={`group/swap transition-all duration-300 p-1.5 rounded-full ${
              isSelected
                ? 'bg-[#7D7489] text-white'
                : 'bg-[#E5E0D8] text-[#9F97A8] hover:bg-[#7D7489] hover:text-white opacity-0 group-hover:opacity-100'
            }`}
            title={isSelected ? '取消選擇' : '點擊選擇以交換位置'}
          >
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
              <path d="M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
              <path d="M6.15819 3.13514C6.35964 2.94628 6.67606 2.95648 6.86492 3.15794L10.6149 7.15794C10.7952 7.35027 10.7952 7.64955 10.6149 7.84188L6.86492 11.8419C6.67606 12.0433 6.35964 12.0535 6.15819 11.8647C5.95673 11.6758 5.94652 11.3594 6.13538 11.1579L9.56479 7.49991L6.13538 3.84188C5.94652 3.64042 5.95673 3.32401 6.15819 3.13514Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
            </svg>
          </button>
        )}
      </div>

      <div
        className={`aspect-square w-full mb-4 flex items-center justify-center relative transition-all duration-500 overflow-hidden ${
          item.imageUrl ? '' : 'bg-[#F9F8F6] border border-dashed border-[#E5E0D8]'
        } ${
          isDragging ? 'border-[#7D7489] border-2 bg-[#F3F0F5]' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isCompressing ? (
          <div className="flex flex-col items-center justify-center text-[#7D7489]">
            <div className="animate-spin w-6 h-6 border-2 border-[#E5E0D8] border-t-[#7D7489] rounded-full mb-2"></div>
            <span className="text-[10px] font-cormorant">壓縮中...</span>
          </div>
        ) : isDragging ? (
          <div className="text-[#7D7489] flex flex-col items-center">
            <svg width="24" height="24" viewBox="0 0 15 15" fill="none" className="mb-2">
              <path d="M7.81825 1.18188C7.64251 1.00615 7.35759 1.00615 7.18185 1.18188L4.18185 4.18188C4.00611 4.35762 4.00611 4.64254 4.18185 4.81828C4.35759 4.99401 4.64251 4.99401 4.81825 4.81828L7.05005 2.58648V9.49996C7.05005 9.74849 7.25152 9.94996 7.50005 9.94996C7.74858 9.94996 7.95005 9.74849 7.95005 9.49996V2.58648L10.1819 4.81828C10.3576 4.99401 10.6425 4.99401 10.8182 4.81828C10.994 4.64254 10.994 4.35762 10.8182 4.18188L7.81825 1.18188ZM2.5 9.99997C2.77614 9.99997 3 10.2238 3 10.5V12C3 12.5538 3.44565 13 3.99635 13H11.0012C11.5529 13 12 12.5528 12 12V10.5C12 10.2238 12.2239 9.99997 12.5 9.99997C12.7761 9.99997 13 10.2238 13 10.5V12C13 13.104 12.1062 14 11.0012 14H3.99635C2.89019 14 2 13.103 2 12V10.5C2 10.2238 2.22386 9.99997 2.5 9.99997Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
            </svg>
            <span className="text-[10px] font-cormorant tracking-widest">拖放圖片到此</span>
          </div>
        ) : item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
        ) : (
          <div className="text-[#E5E0D8] flex flex-col items-center">
            <span className="font-cormorant italic text-lg opacity-50">+</span>
          </div>
        )}

        {/* Delete Button (top-right, only when image exists) */}
        {item.imageUrl && !isDragMode && (
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
        {!isDragMode && (
          <div
            onClick={triggerUpload}
            className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
          >
            <span className="bg-white/90 text-[#7D7489] text-[10px] px-2 py-1 shadow-sm font-cormorant tracking-widest uppercase rounded-sm border border-[#E5E0D8]">
              {item.imageUrl ? 'Modifier' : 'Ajouter'}
            </span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {!isDragMode && (
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
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 80) + 'px';
            }}
          />
        </div>
      )}

      {isDragMode && (
        <div className="text-center text-xs font-fangsong text-[#9F97A8] truncate mt-1">
          {item.name}
        </div>
      )}
    </div>
  );
};
