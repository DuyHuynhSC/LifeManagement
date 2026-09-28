import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  Tags, 
  AlertCircle, 
  Layers, 
  Palette, 
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CategoryItem } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface CategoryManagementModalProps {
  onClose: () => void;
}

const COMMON_EMOJIS = [
  '🍔', '💡', '📺', '🔧', '💊', '📚', '🎬', '📦',
  '🚗', '🛵', '🛒', '☕', '🎮', '🏠', '👗', '🐾',
  '🎁', '👶', '🧾', '🏋️', '✈️', '💄', '💻', '🍕'
];

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#64748b',
  '#14b8a6', '#f97316', '#84cc16', '#6366f1'
];

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory, expenses, budgets, settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for Add / Edit
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏷️');
  const [color, setColor] = useState('#10b981');
  const [customEmoji, setCustomEmoji] = useState('');

  // Delete confirmation & reassign state
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [fallbackId, setFallbackId] = useState<string>('');

  // Alert feedback
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleStartAdd = () => {
    setEditingId(null);
    setDeletingCategory(null);
    setName('');
    setIcon('🛒');
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setCustomEmoji('');
    setIsAdding(true);
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setIsAdding(false);
    setDeletingCategory(null);
    setEditingId(cat.id);
    setName(cat.name);
    setIcon(cat.icon || '🏷️');
    setColor(cat.color || '#10b981');
    setCustomEmoji('');
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      showStatus('Vui lòng nhập tên danh mục!', 'error');
      return;
    }

    // Check duplicate name
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      showStatus('Danh mục này đã tồn tại!', 'error');
      return;
    }

    const selectedIcon = customEmoji.trim() || icon;
    addCategory({
      name: trimmed,
      icon: selectedIcon,
      color
    });

    handleCancelForm();
    showStatus(`Đã thêm danh mục "${trimmed}" thành công!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const trimmed = name.trim();
    if (!trimmed) {
      showStatus('Vui lòng nhập tên danh mục!', 'error');
      return;
    }

    // Check duplicate name on other categories
    if (categories.some(c => c.id !== editingId && c.name.toLowerCase() === trimmed.toLowerCase())) {
      showStatus('Tên danh mục này đã trùng với một danh mục khác!', 'error');
      return;
    }

    const selectedIcon = customEmoji.trim() || icon;
    updateCategory(editingId, {
      name: trimmed,
      icon: selectedIcon,
      color
    });

    handleCancelForm();
    showStatus(`Đã cập nhật danh mục "${trimmed}" thành công!`);
  };

  const handlePromptDelete = (cat: CategoryItem) => {
    if (categories.length <= 1) {
      showStatus('Phải giữ lại ít nhất 1 danh mục chi tiêu!', 'error');
      return;
    }

    const linkedCount = expenses.filter(e => e.category === cat.id).length;
    const remaining = categories.filter(c => c.id !== cat.id);
    const defaultFallback = remaining.find(c => c.id === 'other')?.id || remaining[0]?.id || '';

    setFallbackId(defaultFallback);
    setDeletingCategory(cat);
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;

    const catName = deletingCategory.name;
    const res = deleteCategory(deletingCategory.id, fallbackId);
    if (res.success) {
      showStatus(`Đã xóa danh mục "${catName}" thành công!`);
    } else {
      showStatus(res.message || 'Không thể xóa danh mục này', 'error');
    }
    setDeletingCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl border-t md:border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <Tags size={20} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Quản lý Danh mục Chi tiêu
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                {categories.length} nhóm chi tiêu hiện có
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Notification Banner */}
        {statusMsg && (
          <div className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-b border-rose-200 dark:border-rose-800'
          }`}>
            <AlertCircle size={15} />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Content Container */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">

          {/* Delete with Reassignment Confirmation Dialog */}
          {deletingCategory && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 shrink-0">
                  <Trash2 size={16} />
                </span>
                <div>
                  <h3 className="font-bold text-rose-900 dark:text-rose-200 text-xs">
                    Xác nhận xóa danh mục "{deletingCategory.icon} {deletingCategory.name}"
                  </h3>
                  {(() => {
                    const count = expenses.filter(e => e.category === deletingCategory.id).length;
                    return (
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium mt-0.5">
                        {count > 0 
                          ? `Danh mục này đang có ${count} giao dịch. Vui lòng chọn danh mục chuyển tiếp để không làm mất lịch sử chi tiêu:`
                          : 'Danh mục này chưa có giao dịch nào liên kết. Bạn có thể xóa an toàn.'}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {expenses.filter(e => e.category === deletingCategory.id).length > 0 && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-rose-900 dark:text-rose-200">
                    Chuyển các giao dịch sang:
                  </label>
                  <select
                    value={fallbackId}
                    onChange={e => setFallbackId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {categories.filter(c => c.id !== deletingCategory.id).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Đồng ý xóa
                </button>
              </div>
            </div>
          )}

          {/* Add / Edit Form */}
          {(isAdding || editingId) && (
            <form 
              onSubmit={isAdding ? handleSaveAdd : handleSaveEdit} 
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3.5 shadow-sm animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-500" />
                  {isAdding ? 'Thêm mới danh mục chi tiêu' : 'Chỉnh sửa danh mục'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Name Input */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tiền trọ, Xăng xe, Mỹ phẩm, Cà phê..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 text-base sm:text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Icon / Emoji Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-200">
                    Biểu tượng hiển thị:
                  </label>
                  <span className="text-base px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm">
                    {customEmoji.trim() || icon}
                  </span>
                </div>
                
                {/* Preset Emojis Grid */}
                <div className="grid grid-cols-8 gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 max-h-28 overflow-y-auto">
                  {COMMON_EMOJIS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setIcon(em);
                        setCustomEmoji('');
                      }}
                      className={`h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                        icon === em && !customEmoji
                          ? 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-400 dark:border-emerald-600 scale-105 shadow-sm'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                {/* Custom Emoji Input */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                    Hoặc nhập icon khác:
                  </span>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="VD: 🚴"
                    value={customEmoji}
                    onChange={e => setCustomEmoji(e.target.value)}
                    className="w-20 p-1.5 text-center text-base sm:text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Màu đại diện:
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-emerald-500' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-1.5">
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      title="Chọn mã màu tùy ý"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                >
                  {t('action_cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Check size={15} />
                  <span>{isAdding ? 'Lưu danh mục' : 'Cập nhật'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Add Category Trigger Button */}
          {!isAdding && !editingId && (
            <button
              onClick={handleStartAdd}
              className="w-full py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/60 border border-dashed border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition active:scale-98 shadow-sm"
            >
              <Plus size={16} />
              <span>Thêm danh mục mới</span>
            </button>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider px-1">
              Danh sách danh mục ({categories.length})
            </div>

            {categories.map(cat => {
              const txCount = expenses.filter(e => e.category === cat.id).length;
              const budgetItem = budgets.find(b => b.category === cat.id);
              const isSelectedForEdit = editingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelectedForEdit
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Category Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm"
                      style={{
                        backgroundColor: `${cat.color || '#10b981'}18`,
                        border: `1px solid ${cat.color || '#10b981'}40`
                      }}
                    >
                      {cat.icon || '🏷️'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {cat.name}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || '#10b981' }}
                          title={`Mã màu: ${cat.color}`}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-0.5 flex-wrap">
                        <span>{txCount} giao dịch</span>
                        {budgetItem && budgetItem.monthlyLimit > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Hạn mức: {budgetItem.monthlyLimit.toLocaleString('vi-VN')} đ
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(cat)}
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition active:scale-95"
                      title="Sửa danh mục"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => handlePromptDelete(cat)}
                      disabled={categories.length <= 1}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition active:scale-95 ${
                        categories.length <= 1
                          ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-700 text-slate-400'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                      }`}
                      title={categories.length <= 1 ? 'Không thể xóa danh mục duy nhất' : 'Xóa danh mục'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
