import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Tv2, 
  Wrench, 
  ShieldCheck, 
  ShieldAlert, 
  MapPin, 
  ChevronRight,
  ChevronLeft,
  AlertCircle
} from 'lucide-react';
import { RoomType, Asset } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { AssetDetailModal } from './AssetDetailModal';
import { AddAssetModal } from './AddAssetModal';

export const AssetListTab: React.FC<{ initialSelectedAssetId?: string | null }> = ({ initialSelectedAssetId }) => {
  const { assets, settings } = useAppStore();
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(() => {
    if (initialSelectedAssetId) {
      return assets.find(a => a.id === initialSelectedAssetId) || null;
    }
    return null;
  });
  const [showAddModal, setShowAddModal] = useState(false);

  // Horizontal scroll state & refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 140;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 250);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftPos(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftPos - walk;
    checkScroll();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    checkScroll();
  };

  const handleSelectRoomPill = (e: React.MouseEvent<HTMLButtonElement>, roomId: RoomType) => {
    setSelectedRoom(roomId);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    setTimeout(checkScroll, 300);
  };

  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const rooms: { id: RoomType; label: string; icon: string }[] = [
    { id: 'all', label: t('room_all'), icon: '🏠' },
    { id: 'living_room', label: t('room_living_room'), icon: '🛋️' },
    { id: 'kitchen', label: t('room_kitchen'), icon: '🍳' },
    { id: 'bedroom', label: t('room_bedroom'), icon: '🛏️' },
    { id: 'bathroom', label: t('room_bathroom'), icon: '🚿' },
    { id: 'balcony', label: t('room_balcony'), icon: '🪴' },
    { id: 'other', label: t('room_other'), icon: '📦' },
  ];

  const today = new Date();

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesRoom = selectedRoom === 'all' || asset.room === selectedRoom;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.purchasePlace.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRoom && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 relative">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('asset_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredAssets.length} {t('asset_under_management')}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
        >
          <Plus size={16} />
          <span>{t('action_add')}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={t('action_search')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        />
      </div>

      {/* Room Filter Pills with Left & Right Navigation Arrows */}
      <div className="relative group">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-md rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition"
            title="Cuộn sang trái"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs scroll-smooth select-none cursor-grab active:cursor-grabbing px-1"
        >
          {rooms.map(r => {
            const isSelected = selectedRoom === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={(e) => handleSelectRoomPill(e, r.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-md ring-2 ring-indigo-300 dark:ring-indigo-800 scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-md rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 transition animate-pulse"
            title="Xem các phòng tiếp theo"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Asset Cards List */}
      <div className="space-y-3">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-white dark:bg-slate-800/60 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-2">
            <Tv2 size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold">Không tìm thấy thiết bị nào.</p>
            <p className="text-[11px]">Bấm "+ Thêm mới" để quản lý đồ dùng gia đình của bạn.</p>
          </div>
        ) : (
          filteredAssets.map(asset => {
            const exp = new Date(asset.warrantyExpiryDate);
            const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isExpiringSoon = daysLeft >= 0 && daysLeft <= settings.notifyDaysBeforeExpiry;
            const isExpired = daysLeft < 0;

            // Check if any component is wearing out
            const criticalComps = asset.components.filter(c => c.currentWearPercent <= 20);

            return (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 transition cursor-pointer space-y-3 group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Tv2 size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {asset.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} />
                        <span className="capitalize">{asset.room}</span>
                        <span>•</span>
                        <span>{asset.purchasePlace}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* Sub-Components Wear Bar Summary */}
                {asset.components.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-2xl space-y-1.5 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Wrench size={12} className="text-indigo-500" />
                        {t('asset_components')} ({asset.components.length})
                      </span>
                      {criticalComps.length > 0 ? (
                        <span className="text-rose-600 font-bold flex items-center gap-0.5">
                          <AlertCircle size={12} /> {criticalComps.length} {t('asset_need_replace_alert')}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[10px]">
                          {t('asset_all_good')}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {asset.components.slice(0, 4).map(c => (
                        <div key={c.id} className="text-[10px] truncate">
                          <span className="text-slate-600 dark:text-slate-400">{c.name.split('(')[0]}: </span>
                          <span className={`font-bold ${c.currentWearPercent <= 20 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                            {c.currentWearPercent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warranty & Price Footer */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-700/80">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">
                    {asset.price.toLocaleString('vi-VN')} đ
                  </div>

                  {/* Warranty Badge */}
                  {isExpired ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                      <ShieldAlert size={11} />
                      {t('asset_warranty_expired_short')}
                    </span>
                  ) : isExpiringSoon ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 animate-pulse">
                      <ShieldAlert size={11} />
                      {t('asset_warranty_days_left', { days: daysLeft })}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <ShieldCheck size={11} />
                      {t('asset_days_left', { days: daysLeft })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <AddAssetModal
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};
