
import React, { useState, useCallback } from 'react';
import { StickerSet, StickerItem } from '../types';
import { StickerItemCard } from './StickerItemCard';
import { Button } from './Button';

interface StickerEditorProps {
  set: StickerSet;
  allSeries: string[];
  onSave: (updatedSet: StickerSet) => Promise<void>;
  onBack: () => void;
}

const COUNT_OPTIONS = [8, 16, 24, 32, 40];

export const StickerEditor: React.FC<StickerEditorProps> = ({ set, allSeries, onSave, onBack }) => {
  const [editedSet, setEditedSet] = useState<StickerSet>({ ...set });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateItem = useCallback((id: string, updates: Partial<StickerItem>) => {
    setEditedSet(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  }, []);

  const handleItemClick = (id: string) => {
    if (selectedItemId === null) {
      setSelectedItemId(id);
    } else if (selectedItemId === id) {
      setSelectedItemId(null); // Deselect
    } else {
      // Swap items
      setEditedSet(prev => {
        const items = [...prev.items];
        const indexA = items.findIndex(i => i.id === selectedItemId);
        const indexB = items.findIndex(i => i.id === id);

        if (indexA !== -1 && indexB !== -1) {
          const temp = items[indexA];
          items[indexA] = items[indexB];
          items[indexB] = temp;
        }
        return { ...prev, items };
      });
      setSelectedItemId(null);
    }
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      await onSave(editedSet);
    } catch (e) {
      alert("儲存失敗，請重試");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountChange = (newCount: number) => {
    setEditedSet(prev => {
      let newItems = [...prev.items];
      if (newCount < prev.items.length) {
        newItems = newItems.slice(0, newCount);
      } else if (newCount > prev.items.length) {
        const diff = newCount - prev.items.length;
        const additional = Array.from({ length: diff }, (_, i) => ({
          id: `new-${Date.now()}-${i}`,
          originalOrder: prev.items.length + i + 1,
          name: `Image ${prev.items.length + i + 1}`
        }));
        newItems = [...newItems, ...additional];
      }
      return { ...prev, itemCount: newCount, items: newItems };
    });
  };

  const openStoreUrl = () => {
    if (editedSet.storeUrl) {
      window.open(editedSet.storeUrl, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 md:px-8 animate-in fade-in duration-1000">
      <datalist id="series-suggestions">
        {allSeries.map(s => <option key={s} value={s} />)}
      </datalist>

      {/* Header Navigation */}
      <div className="flex justify-between items-center mb-16 border-b border-[#E5E0D8] pb-6">
        <Button variant="ghost" onClick={onBack} size="sm" className="pl-0 hover:pl-2 transition-all text-sm">
          <span className="mr-2">←</span> Retour
        </Button>
        <div className="text-xs uppercase tracking-[0.3em] text-[#7D7489]">Mode Éditeur</div>
        <div className="w-20"></div> {/* Spacer for balance */}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 mb-20">

        {/* Left: Project Identity */}
        <div className="xl:col-span-6 space-y-10">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-[#9F97A8] mb-3 font-cormorant">Titre du Projet</label>
            <input
              type="text"
              value={editedSet.title}
              onChange={(e) => setEditedSet(prev => ({ ...prev, title: e.target.value }))}
              className="w-full text-3xl md:text-4xl font-fangsong bg-transparent border-b border-[#E5E0D8] focus:border-[#7D7489] focus:outline-none pb-3 text-[#2C2C2C] placeholder-[#E5E0D8]"
              placeholder="中文標題"
            />
            <input
              type="text"
              value={editedSet.enTitle}
              onChange={(e) => setEditedSet(prev => ({ ...prev, enTitle: e.target.value }))}
              className="w-full text-xl md:text-2xl font-cormorant italic mt-4 bg-transparent border-b border-transparent focus:border-[#E5E0D8] focus:outline-none pb-2 text-[#7D7489] placeholder-[#F0EEEB]"
              placeholder="English Title"
            />
          </div>

          <div className="space-y-6 pt-4">
            {/* New Type Selector and Status */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-[#9F97A8] mb-3 font-cormorant">Type</label>
                <select
                  value={editedSet.type}
                  onChange={(e) => setEditedSet(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full text-sm font-fangsong bg-transparent border-b border-[#E5E0D8] py-2 rounded-none focus:outline-none focus:border-[#7D7489] cursor-pointer"
                >
                  <option value="Sticker">貼圖</option>
                  <option value="Emoji">表情貼</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-[#9F97A8] mb-3 font-cormorant">Statut</label>
                <select
                  value={editedSet.status}
                  onChange={(e) => setEditedSet(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full text-sm font-fangsong bg-transparent border-b border-[#E5E0D8] py-2 rounded-none focus:outline-none focus:border-[#7D7489] cursor-pointer"
                >
                  <option value="IDEATION">發想構思</option>
                  <option value="IN_PROGRESS">繪製創作</option>
                  <option value="ARCHIVED">完稿歸檔</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-[#9F97A8] mb-3 font-cormorant">Quantité</label>
              <select
                value={editedSet.itemCount}
                onChange={(e) => handleCountChange(parseInt(e.target.value))}
                className="w-full text-sm font-fangsong bg-transparent border-b border-[#E5E0D8] py-2 rounded-none focus:outline-none focus:border-[#7D7489] cursor-pointer"
              >
                {COUNT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt} Images</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-[#9F97A8] mb-3 font-cormorant">Collection / Série</label>
              <input
                type="text"
                list="series-suggestions"
                value={editedSet.series}
                onChange={(e) => setEditedSet(prev => ({ ...prev, series: e.target.value }))}
                className="w-full text-sm font-fangsong bg-transparent border-b border-[#E5E0D8] py-2 focus:outline-none focus:border-[#7D7489]"
                placeholder="未分類"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-[#9F97A8] mb-3 font-cormorant">Lien Boutique</label>
              <div className="flex items-center gap-2 border-b border-[#E5E0D8] py-1 focus-within:border-[#7D7489] transition-colors">
                <input
                  type="url"
                  value={editedSet.storeUrl}
                  onChange={(e) => setEditedSet(prev => ({ ...prev, storeUrl: e.target.value }))}
                  placeholder="https://store.line.me/..."
                  className="flex-1 text-sm font-cormorant bg-transparent focus:outline-none placeholder-[#E5E0D8]"
                />
                {editedSet.storeUrl && (
                  <button onClick={openStoreUrl} className="text-[#9F97A8] hover:text-[#2C2C2C] px-2">
                    <span className="text-sm">↗</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Description & Actions */}
        <div className="xl:col-span-6 flex flex-col justify-between pl-0 xl:pl-16 border-l-0 xl:border-l border-[#F3F0EB]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div className="bg-white p-6 shadow-[0_2px_10px_rgba(125,116,137,0.05)] border border-transparent hover:border-[#E5E0D8] transition-colors">
              <label className="block text-xs uppercase tracking-[0.2em] text-[#D8D2CB] mb-4 font-cormorant text-center">Description (Chinois)</label>
              <textarea
                value={editedSet.zhDesc}
                onChange={(e) => setEditedSet(prev => ({ ...prev, zhDesc: e.target.value }))}
                className="w-full h-32 text-sm font-fangsong bg-transparent border-none p-0 focus:outline-none resize-none leading-relaxed text-center placeholder-[#F3F0EB]"
                placeholder="請輸入中文介紹..."
              />
            </div>
            <div className="bg-white p-6 shadow-[0_2px_10px_rgba(125,116,137,0.05)] border border-transparent hover:border-[#E5E0D8] transition-colors">
              <label className="block text-xs uppercase tracking-[0.2em] text-[#D8D2CB] mb-4 font-cormorant text-center">Description (Anglais)</label>
              <textarea
                value={editedSet.enDesc}
                onChange={(e) => setEditedSet(prev => ({ ...prev, enDesc: e.target.value }))}
                className="w-full h-32 text-sm font-cormorant italic bg-transparent border-none p-0 focus:outline-none resize-none leading-relaxed text-center placeholder-[#F3F0EB]"
                placeholder="Enter English description..."
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-6 pt-8 border-t border-[#F3F0EB]">
            <div className="text-xs text-[#D8D2CB] italic font-cormorant mr-auto hidden md:block">
              * Click two items to swap positions
            </div>
            <Button onClick={handleSaveClick} variant="primary" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Visual Line */}
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D8D2CB] to-transparent"></div>

        <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-4 sm:gap-6">
          {editedSet.items.map((item, index) => (
            <StickerItemCard
              key={item.id}
              item={item}
              index={index}
              isSelected={selectedItemId === item.id}
              onSelect={handleItemClick}
              onUpdate={handleUpdateItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
