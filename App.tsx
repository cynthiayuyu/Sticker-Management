
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StickerSet, ViewState, CollectionStatus } from './types';
import { StickerEditor } from './components/StickerEditor';
import { Button } from './components/Button';
import { getAllStickerSets, saveStickerSet, saveStickerSets, deleteStickerSet, clearAllStickerSets } from './services/storage';
import { compressExistingImage } from './utils/imageCompression';
import { githubSync } from './services/githubSync';

// Sorting helper for Series: English (A-Z) then Chinese
const sortSeries = (a: string, b: string) => {
  const isAEnglish = /^[A-Za-z]/.test(a);
  const isBEnglish = /^[A-Za-z]/.test(b);

  if (isAEnglish && !isBEnglish) return -1;
  if (!isAEnglish && isBEnglish) return 1;

  if (isAEnglish) {
    return a.localeCompare(b);
  } else {
    return a.localeCompare(b, 'zh-Hant-TW');
  }
};

// Collection Card Component
const CollectionCard = ({
  set,
  onClick,
  onDelete,
  onSwapClick,
  isSwapMode,
  isSelectedForSwap,
  getStatusLabel,
  getStatusColor
}: any) => {

  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Safety check: if the click originated from a button, ignore it here
    // This acts as a backup even if stopPropagation fails
    if ((e.target as HTMLElement).closest('button')) return;

    // If in swap mode, clicking the body should trigger swap
    if (isSwapMode) {
      onSwapClick(set.id);
    } else {
      onClick(set.id);
    }
  };

  return (
    <div
      className={`bg-white p-8 border group transition-all duration-500 cursor-pointer relative flex flex-col h-full
        ${isSelectedForSwap
          ? 'border-[#7D7489] shadow-[0_10px_40px_rgba(125,116,137,0.15)] transform -translate-y-1'
          : isSwapMode
            ? 'border-[#F3F0EB] hover:border-[#7D7489] opacity-80 hover:opacity-100'
            : 'border-[#F3F0EB] hover:border-[#7D7489] hover:shadow-[0_10px_40px_rgba(125,116,137,0.08)]'
        }
      `}
      onClick={handleCardClick}
    >
      {/* Swap Selection Indicator Overlay */}
      {isSwapMode && !isSelectedForSwap && (
        <div className="absolute inset-0 bg-[#7D7489] opacity-0 group-hover:opacity-5 pointer-events-none transition-opacity"></div>
      )}

      <div className="flex justify-between items-start mb-8">
        <div className="flex-1 pr-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-[10px] px-2 py-1 border font-fangsong tracking-wider rounded-sm whitespace-nowrap ${getStatusColor(set.status)}`}>
              {getStatusLabel(set.status)}
            </span>

            {/* Type Label */}
            <span className="text-[10px] px-2 py-1 border border-[#E5E0D8] text-[#9F97A8] font-fangsong tracking-widest rounded-sm bg-[#F9F8F6] whitespace-nowrap">
              {set.type === 'Emoji' ? '表情貼' : '貼圖'}
            </span>

            <span className="text-[10px] text-[#D8D2CB] uppercase tracking-[0.2em] font-cormorant ml-1 truncate max-w-[100px]">{set.series || '—'}</span>
          </div>
          <h4 className="text-3xl font-playfair text-[#2C2C2C] leading-tight group-hover:text-[#7D7489] transition-colors mb-2 break-words">
            {set.title}
          </h4>
          <p className="text-sm font-cormorant italic text-[#9F97A8] break-words">{set.enTitle}</p>
        </div>

        {/* Actions Container */}
        <div className="flex flex-col items-end gap-3 z-30 relative shrink-0">
          {/* Swap Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSwapClick(set.id);
            }}
            className={`p-2 transition-all duration-300 rounded-full hover:bg-[#F3F0EB] ${isSelectedForSwap ? 'text-[#7D7489] rotate-180 bg-[#F3F0EB]' : 'text-[#F3F0EB] hover:text-[#9F97A8]'}`}
            title="Swap / Reorder"
          >
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2C7.77614 2 8 2.22386 8 2.5V12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5V2.5C7 2.22386 7.22386 2 7.5 2ZM2.5 5.5C2.5 5.22386 2.72386 5 3 5H12C12.2761 5 12.5 5.22386 12.5 5.5C12.5 5.77614 12.2761 6 12 6H3C2.72386 6 2.5 5.77614 2.5 5.5ZM3 9.5C2.72386 9.5 2.5 9.72386 2.5 10C2.5 10.2761 2.72386 10.5 3 10.5H12C12.2761 10.5 12.5 10.2761 12.5 10C12.5 9.72386 12.2761 9.5 12 9.5H3Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </button>

          {/* Delete Button */}
          {/* Delete Button with 2-step confirmation */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              if (isDeleting) {
                onDelete(set.id);
              } else {
                setIsDeleting(true);
                // Reset after 3 seconds if not confirmed
                setTimeout(() => setIsDeleting(false), 3000);
              }
            }}
            className={`p-2 rounded-full transition-all cursor-pointer z-40 flex items-center justify-center
              ${isDeleting
                ? 'bg-red-50 text-red-500 hover:bg-red-100 opacity-100 w-auto px-3 gap-2'
                : 'opacity-0 group-hover:opacity-100 text-[#E5E0D8] hover:text-[#7D7489] hover:bg-[#F3F0EB]'
              }
            `}
            title={isDeleting ? "Confirm Delete" : "Delete Collection"}
          >
            {isDeleting ? (
              <>
                <span className="text-xs font-bold">Confirmer ?</span>
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4H3.5C3.22386 4 3 3.77614 3 3.5ZM5 4V12H10V4H5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </>
            ) : (
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H11V12C11 12.5523 10.5523 13 10 13H5C4.44772 13 4 12.5523 4 12V4H3.5C3.22386 4 3 3.77614 3 3.5ZM5 4V12H10V4H5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-8 opacity-40 group-hover:opacity-100 transition-opacity duration-700 flex-1">
        {set.items.slice(0, 5).map((item: any) => (
          <div key={item.id} className="aspect-square bg-[#FDFBF7] flex items-center justify-center border border-[#F3F0EB] hover:border-[#E5E0D8]">
            {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-contain p-1" /> : <div className="w-1 h-1 bg-[#E5E0D8] rounded-full"></div>}
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <div className="flex justify-between items-center text-[10px] font-cormorant text-[#9F97A8] uppercase tracking-[0.2em] pt-5 border-t border-[#F9F8F6] group-hover:border-[#E6E4E9]">
          <span>{set.itemCount} Éléments</span>
          <span className="text-[#7D7489] opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
            {isSwapMode ? (isSelectedForSwap ? 'Selected' : 'Swap Here') : 'Ouvrir'}
          </span>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [sets, setSets] = useState<StickerSet[]>([]);
  const [view, setView] = useState<ViewState>('LIST');
  const [activeSetId, setActiveSetId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<CollectionStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'Sticker' | 'Emoji'>('ALL');
  const [filterSeries, setFilterSeries] = useState<string>('ALL');

  // New state for click-to-swap
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null);

  // Compression state
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<{ current: number; total: number } | null>(null);

  // GitHub Sync state
  const [isLoggedIn, setIsLoggedIn] = useState(githubSync.isLoggedIn());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data asynchronously on mount
  useEffect(() => {
    getAllStickerSets().then(loadedSets => {
      // Normalize orders if they are missing
      const setsWithOrder = loadedSets.map((s, idx) => ({
        ...s,
        order: typeof s.order === 'number' ? s.order : idx
      }));
      setSets(setsWithOrder);
    });
  }, []);

  const seriesList = useMemo(() => {
    const list = Array.from(new Set(sets.map(s => s.series).filter(Boolean)));
    const sorted = list.sort(sortSeries);
    return ['ALL', ...sorted];
  }, [sets]);

  const filteredSets = useMemo(() => {
    return sets.filter(s => {
      const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
      const matchType = filterType === 'ALL' || s.type === filterType;
      const matchSeries = filterSeries === 'ALL' || s.series === filterSeries;
      return matchStatus && matchType && matchSeries;
    });
  }, [sets, filterStatus, filterType, filterSeries]);

  const handleCreateNew = () => {
    const id = Date.now().toString();

    // Auto-populate series if currently filtered
    const defaultSeries = filterSeries !== 'ALL' ? filterSeries : '';

    const newSet: StickerSet = {
      id,
      order: -1, // Temporary, will be sorted to top
      title: 'Nouvelle Collection',
      enTitle: 'New Collection',
      series: defaultSeries,
      zhDesc: '',
      enDesc: '',
      storeUrl: '',
      status: 'IDEATION',
      type: 'Sticker',
      itemCount: 40,
      createdAt: Date.now(),
      items: Array.from({ length: 40 }, (_, i) => ({
        id: `item-${id}-${i}`,
        originalOrder: i + 1,
        name: `Image ${i + 1}`
      }))
    };

    // Update orders: shift everything down
    const updatedSets = sets.map(s => ({ ...s, order: (s.order || 0) + 1 }));
    const finalSets = [{ ...newSet, order: 0 }, ...updatedSets];

    // Save all to DB to persist order
    saveStickerSets(finalSets).then(() => {
      setSets(finalSets);
      setActiveSetId(id);
      setView('EDITOR');
    });
  };

  const handleSaveSet = async (updatedSet: StickerSet) => {
    await saveStickerSet(updatedSet);
    setSets(prev => prev.map(s => s.id === updatedSet.id ? updatedSet : s));
    setView('LIST');
  };

  const handleDeleteSet = async (id: string) => {
    // Confirm dialog is handled inline by the button now
    await deleteStickerSet(id);
    setSets(prev => prev.filter(s => s.id !== id));
    if (swapSourceId === id) setSwapSourceId(null);
  };

  const handleSwapClick = async (id: string) => {
    if (swapSourceId === null) {
      // Select for swap
      setSwapSourceId(id);
    } else if (swapSourceId === id) {
      // Deselect
      setSwapSourceId(null);
    } else {
      // Perform Swap
      const indexA = sets.findIndex(s => s.id === swapSourceId);
      const indexB = sets.findIndex(s => s.id === id);

      if (indexA !== -1 && indexB !== -1) {
        const newSets = [...sets];

        // Swap logic using orders works best if we ensure orders are unique/valid
        // Simple swap of order property:
        const orderA = newSets[indexA].order || 0;
        const orderB = newSets[indexB].order || 0;

        newSets[indexA] = { ...newSets[indexA], order: orderB };
        newSets[indexB] = { ...newSets[indexB], order: orderA };

        // Re-sort the array based on order
        const sortedSets = newSets.sort((a, b) => (a.order || 0) - (b.order || 0));

        // Save to DB with proper error handling
        try {
          await saveStickerSets(sortedSets);
          setSets(sortedSets);
        } catch (err) {
          console.error("Failed to save swap", err);
          alert("交換位置儲存失敗，請重試");
        }
      }
      setSwapSourceId(null);
    }
  };

  // --- Compress All Images ---

  const handleCompressAll = async () => {
    if (!confirm('這將壓縮所有現有圖片以減少檔案大小。\n\n壓縮後圖片品質會略微下降，但可減少 70-80% 的儲存空間。\n\n確定要繼續嗎？')) {
      return;
    }

    setIsCompressing(true);
    let processedCount = 0;
    let totalImages = 0;

    // Count total images
    sets.forEach(set => {
      set.stickers.forEach(sticker => {
        if (sticker.imageUrl) totalImages++;
      });
    });

    if (totalImages === 0) {
      alert('沒有找到需要壓縮的圖片！');
      setIsCompressing(false);
      return;
    }

    setCompressionProgress({ current: 0, total: totalImages });

    try {
      const updatedSets = await Promise.all(
        sets.map(async (set) => {
          const updatedStickers = await Promise.all(
            set.stickers.map(async (sticker) => {
              if (sticker.imageUrl) {
                try {
                  const compressed = await compressExistingImage(sticker.imageUrl, 800, 0.85);
                  processedCount++;
                  setCompressionProgress({ current: processedCount, total: totalImages });
                  return { ...sticker, imageUrl: compressed };
                } catch (err) {
                  console.error('壓縮圖片失敗:', err);
                  processedCount++;
                  setCompressionProgress({ current: processedCount, total: totalImages });
                  return sticker; // Keep original on error
                }
              }
              return sticker;
            })
          );
          return { ...set, stickers: updatedStickers };
        })
      );

      await saveStickerSets(updatedSets);
      setSets(updatedSets);
      alert(`✅ 壓縮完成！\n\n成功處理 ${totalImages} 張圖片。\n請使用「匯出」功能備份您的資料。`);
    } catch (err) {
      console.error('批次壓縮失敗:', err);
      alert('壓縮過程中發生錯誤，請重試。');
    } finally {
      setIsCompressing(false);
      setCompressionProgress(null);
    }
  };

  // --- Export / Import Logic ---

  const handleExport = async () => {
    try {
      const allData = await getAllStickerSets();
      const jsonString = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `atelier-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("匯出失敗，請稍後再試。");
    }
  };

  // --- GitHub Sync Functions ---

  const handleGitHubLogin = async () => {
    const token = prompt('請輸入 GitHub Personal Access Token:\n\n如何取得：\n1. 前往 github.com/settings/tokens\n2. 點擊 "Generate new token (classic)"\n3. 勾選 "gist" 權限\n4. 生成並複製 Token');

    if (!token) return;

    try {
      setIsSyncing(true);
      await githubSync.login(token);
      setIsLoggedIn(true);
      alert('✅ 登入成功！\n\n您現在可以使用雲端同步功能。');
    } catch (error: any) {
      alert(`登入失敗：${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGitHubLogout = () => {
    if (confirm('確定要登出 GitHub 嗎？\n\n本地資料不會被刪除，但將無法同步。')) {
      githubSync.logout();
      setIsLoggedIn(false);
      setLastSyncTime(null);
    }
  };

  const handleUploadToGist = async () => {
    if (!isLoggedIn) {
      alert('請先登入 GitHub');
      return;
    }

    try {
      setIsSyncing(true);
      const allSets = await getAllStickerSets();
      await githubSync.upload(allSets);
      setLastSyncTime(new Date());
      alert('✅ 上傳成功！\n\n資料已同步到 GitHub Gist。');
    } catch (error: any) {
      alert(`上傳失敗：${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadFromGist = async () => {
    if (!isLoggedIn) {
      alert('請先登入 GitHub');
      return;
    }

    if (!confirm('這將從 GitHub Gist 下載資料並覆蓋本地資料。\n\n確定要繼續嗎？')) {
      return;
    }

    try {
      setIsSyncing(true);
      const remoteSets = await githubSync.download();

      if (remoteSets.length === 0) {
        alert('雲端還沒有備份資料。\n\n請先使用「上傳到雲端」功能。');
        return;
      }

      await saveStickerSets(remoteSets);
      setSets(remoteSets);
      setLastSyncTime(new Date());
      alert(`✅ 下載成功！\n\n已從雲端還原 ${remoteSets.length} 個貼圖集。`);
    } catch (error: any) {
      alert(`下載失敗：${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportClick = () => {
    // Ensure value is reset so onChange fires even if same file is selected
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          alert("檔案讀取錯誤（內容為空）。");
          return;
        }

        const data = JSON.parse(content);

        if (Array.isArray(data)) {
          // First Check: Import detected
          if (window.confirm(`準備匯入 ${data.length} 個貼圖系列。\n\n按「確定」繼續。\n按「取消」放棄操作。`)) {

            // Second Check: Strategy (Merge or Restore)
            const shouldClear = window.confirm(
              `【重要】是否要先清空現有資料？\n\n` +
              `按「確定」：清空所有舊資料，完全還原備份 (Restore)。\n` +
              `按「取消」：保留舊資料，僅更新或新增項目 (Merge)。`
            );

            if (shouldClear) {
              await clearAllStickerSets();
            }

            if (data.length > 0) {
              // Ensure imported data has correct structure
              const cleanData = data.map((s: any, idx: number) => ({
                ...s,
                order: typeof s.order === 'number' ? s.order : idx // Ensure order exists
              }));
              await saveStickerSets(cleanData as StickerSet[]);
            }

            // Refresh data
            const refreshedSets = await getAllStickerSets();
            setSets(refreshedSets);

            const actionText = shouldClear ? '還原' : '合併';
            alert(`匯入成功！已${actionText} ${data.length} 筆資料。`);
          }
        } else {
          alert("檔案格式錯誤。請確認這是從本應用程式匯出的 JSON 檔案。");
        }
      } catch (err) {
        console.error("Import parsing error", err);
        alert("匯入失敗：檔案損毀或格式不符。請檢查 console logs 獲取詳細資訊。");
      }
    };
    reader.readAsText(file);
  };

  const getStatusLabel = (status: CollectionStatus) => {
    switch (status) {
      case 'IDEATION': return '發想構思';
      case 'IN_PROGRESS': return '繪製創作';
      case 'ARCHIVED': return '完稿歸檔';
    }
  };

  const getStatusColor = (status: CollectionStatus) => {
    switch (status) {
      case 'IDEATION': return 'bg-[#F0EFEC] text-[#9F97A8] border-[#E5E0D8]';
      case 'IN_PROGRESS': return 'bg-[#F3F0F5] text-[#7D7489] border-[#E6E4E9]';
      case 'ARCHIVED': return 'bg-[#4A4543] text-[#FDFBF7] border-[#4A4543]';
      default: return '';
    }
  };

  const activeSet = sets.find(s => s.id === activeSetId);

  if (view === 'EDITOR' && activeSet) {
    return (
      <StickerEditor
        set={activeSet}
        allSeries={seriesList.filter(s => s !== 'ALL')}
        onSave={handleSaveSet}
        onBack={() => setView('LIST')}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 border-t-4 border-[#7D7489]">
      <header className="pt-24 pb-16 px-8 text-center">
        <h1 className="text-sm uppercase tracking-[0.5em] text-[#9F97A8] font-cormorant mb-6">Maison de Création</h1>
        <h2 className="text-7xl md:text-9xl font-pinyon text-[#2C2C2C] tracking-tight mb-4">L'Atelier</h2>
        <div className="text-base font-cormorant italic text-[#7D7489]">Stickers & Emojis Manager</div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 px-4">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-cormorant uppercase tracking-[0.2em] text-[#D8D2CB]">Filtre</span>
              <div className="flex gap-4">
                {['ALL', 'IDEATION', 'IN_PROGRESS', 'ARCHIVED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s as any)}
                    className={`w-4 h-4 rounded-full transition-all border border-transparent ${filterStatus === s
                      ? 'bg-[#7D7489] scale-125 shadow-md'
                      : (s === 'ALL' ? 'bg-[#E5E0D8]' : getStatusColor(s as CollectionStatus).split(' ')[0]) + ' hover:opacity-80'
                      }`}
                    title={s === 'ALL' ? '全部' : getStatusLabel(s as CollectionStatus)}
                  />
                ))}
              </div>
            </div>

            <div className="h-px w-8 bg-[#E5E0D8] hidden md:block"></div>

            {/* Type Filter */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-cormorant uppercase tracking-[0.2em] text-[#D8D2CB]">類型</span>
              <div className="flex gap-3">
                {[
                  { value: 'ALL', label: '全部', icon: '◈' },
                  { value: 'Sticker', label: '貼圖', icon: '◆' },
                  { value: 'Emoji', label: '表情貼', icon: '◇' }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFilterType(type.value as any)}
                    className={`px-3 py-1 rounded-full text-[10px] font-fangsong tracking-wider transition-all border ${
                      filterType === type.value
                        ? 'bg-[#7D7489] text-white border-[#7D7489] shadow-md scale-105'
                        : 'bg-white text-[#9F97A8] border-[#E5E0D8] hover:border-[#7D7489] hover:text-[#7D7489]'
                    }`}
                    title={type.label}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px w-8 bg-[#E5E0D8] hidden md:block"></div>

            <select
              value={filterSeries}
              onChange={(e) => setFilterSeries(e.target.value)}
              className="bg-transparent border-b border-[#E5E0D8] text-sm font-fangsong py-1 focus:outline-none focus:border-[#7D7489] text-[#7D7489] cursor-pointer min-w-[120px]"
            >
              <option value="ALL">Toutes les Séries</option>
              {seriesList.filter(s => s !== 'ALL').map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-4">
            {isCompressing && compressionProgress && (
              <div className="flex flex-col items-end gap-1 mr-4">
                <span className="text-xs text-[#7D7489] font-fangsong">
                  正在壓縮圖片... {compressionProgress.current} / {compressionProgress.total}
                </span>
                <div className="w-40 h-1 bg-[#F3F0EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7D7489] transition-all duration-300"
                    style={{ width: `${(compressionProgress.current / compressionProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            {swapSourceId && (
              <span className="text-xs text-[#7D7489] font-fangsong animate-pulse">
                請選擇另一個項目進行交換...
              </span>
            )}

            {/* Hidden Import Input */}
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileImport}
            />

            {/* Backup & Compression Controls */}
            <div className="flex items-center gap-2 mr-2 border-r border-[#F3F0EB] pr-4">
              <Button
                onClick={handleCompressAll}
                variant="ghost"
                size="sm"
                className="text-[#9F97A8] hover:text-[#7D7489] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCompressing}
              >
                {isCompressing ? '壓縮中...' : '一鍵壓縮'}
              </Button>
              <Button onClick={handleExport} variant="ghost" size="sm" className="text-[#9F97A8] hover:text-[#7D7489]">
                匯出
              </Button>
              <Button onClick={handleImportClick} variant="ghost" size="sm" className="text-[#9F97A8] hover:text-[#7D7489]">
                匯入
              </Button>
            </div>

            {/* GitHub Sync Controls */}
            <div className="flex items-center gap-2 mr-2 border-r border-[#F3F0EB] pr-4">
              {isLoggedIn ? (
                <>
                  <Button
                    onClick={handleUploadToGist}
                    variant="ghost"
                    size="sm"
                    className="text-[#9F97A8] hover:text-[#7D7489] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    disabled={isSyncing}
                  >
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
                      <path d="M7.5 1C7.77614 1 8 1.22386 8 1.5V11.2929L11.1464 8.14645C11.3417 7.95118 11.6583 7.95118 11.8536 8.14645C12.0488 8.34171 12.0488 8.65829 11.8536 8.85355L7.85355 12.8536C7.65829 13.0488 7.34171 13.0488 7.14645 12.8536L3.14645 8.85355C2.95118 8.65829 2.95118 8.34171 3.14645 8.14645C3.34171 7.95118 3.65829 7.95118 3.85355 8.14645L7 11.2929V1.5C7 1.22386 7.22386 1 7.5 1Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
                    </svg>
                    {isSyncing ? '同步中...' : '上傳到雲端'}
                  </Button>
                  <Button
                    onClick={handleDownloadFromGist}
                    variant="ghost"
                    size="sm"
                    className="text-[#9F97A8] hover:text-[#7D7489] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    disabled={isSyncing}
                  >
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
                      <path d="M7.5 14C7.22386 14 7 13.7761 7 13.5V3.70711L3.85355 6.85355C3.65829 7.04882 3.34171 7.04882 3.14645 6.85355C2.95118 6.65829 2.95118 6.34171 3.14645 6.14645L7.14645 2.14645C7.34171 1.95118 7.65829 1.95118 7.85355 2.14645L11.8536 6.14645C12.0488 6.34171 12.0488 6.65829 11.8536 6.85355C11.6583 7.04882 11.3417 7.04882 11.1464 6.85355L8 3.70711V13.5C8 13.7761 7.77614 14 7.5 14Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
                    </svg>
                    從雲端下載
                  </Button>
                  <Button
                    onClick={handleGitHubLogout}
                    variant="ghost"
                    size="sm"
                    className="text-[#D8D2CB] hover:text-[#9F97A8] text-[10px]"
                  >
                    登出
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleGitHubLogin}
                  variant="ghost"
                  size="sm"
                  className="text-[#9F97A8] hover:text-[#7D7489] flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
                    <path d="M7.49933 0.25C3.49635 0.25 0.25 3.49593 0.25 7.50024C0.25 10.703 2.32715 13.4206 5.2081 14.3797C5.57084 14.446 5.70302 14.2222 5.70302 14.0299C5.70302 13.8576 5.69679 13.4019 5.69323 12.797C3.67661 13.235 3.25112 11.825 3.25112 11.825C2.92132 10.9874 2.44599 10.7644 2.44599 10.7644C1.78773 10.3149 2.49584 10.3238 2.49584 10.3238C3.22353 10.375 3.60629 11.0711 3.60629 11.0711C4.25298 12.1788 5.30335 11.8588 5.71638 11.6732C5.78225 11.205 5.96962 10.8854 6.17658 10.7043C4.56675 10.5209 2.87415 9.89918 2.87415 7.12104C2.87415 6.32925 3.15677 5.68257 3.62053 5.17563C3.54576 4.99226 3.29697 4.25521 3.69174 3.25691C3.69174 3.25691 4.30015 3.06196 5.68522 3.99973C6.26337 3.83906 6.8838 3.75895 7.50022 3.75583C8.1162 3.75895 8.73619 3.83906 9.31523 3.99973C10.6994 3.06196 11.3069 3.25691 11.3069 3.25691C11.7026 4.25521 11.4538 4.99226 11.3795 5.17563C11.8441 5.68257 12.1245 6.32925 12.1245 7.12104C12.1245 9.9063 10.4292 10.5192 8.81452 10.6985C9.07444 10.9224 9.30633 11.3648 9.30633 12.0413C9.30633 13.0102 9.29742 13.7922 9.29742 14.0299C9.29742 14.2239 9.42828 14.4496 9.79591 14.3788C12.6746 13.4179 14.75 10.7025 14.75 7.50024C14.75 3.49593 11.5036 0.25 7.49933 0.25Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
                  </svg>
                  登入 GitHub
                </Button>
              )}
            </div>

            <Button onClick={handleCreateNew} variant="outline" className="tracking-[0.2em] text-sm hover:bg-[#F3F0F5]">
              + Créer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {filteredSets.map(set => (
            <CollectionCard
              key={set.id}
              set={set}
              onClick={(id: string) => { setActiveSetId(id); setView('EDITOR'); }}
              onDelete={handleDeleteSet}
              onSwapClick={handleSwapClick}
              isSwapMode={swapSourceId !== null}
              isSelectedForSwap={swapSourceId === set.id}
              getStatusLabel={getStatusLabel}
              getStatusColor={getStatusColor}
            />
          ))}

          {filteredSets.length === 0 && (
            <div className="col-span-full py-40 text-center">
              <div className="w-16 h-px bg-[#E5E0D8] mx-auto mb-6"></div>
              <p className="font-playfair italic text-[#D8D2CB] text-3xl">La collection est vide.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-32 border-t border-[#E5E0D8] py-12 text-center bg-[#FDFBF7]">
        <div className="font-playfair italic text-[#D8D2CB] text-xl">L'Atelier</div>
        <div className="text-xs uppercase tracking-[0.3em] text-[#7D7489] mt-2 font-cormorant">
          Digital Stationery v3.4
        </div>
      </footer>
    </div>
  );
};

export default App;
