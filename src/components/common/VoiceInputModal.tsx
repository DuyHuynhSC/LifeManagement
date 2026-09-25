import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Check, Sparkles, Pencil, Tag, DollarSign } from 'lucide-react';
import { ExpenseCategory } from '../../types';
import { startSpeechRecognition, stopSpeechRecognition, parseVoiceToExpense } from '../../services/voiceService';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';

interface VoiceInputModalProps {
  onClose: () => void;
  onConfirmExpense: (expense: { title: string; amount: number; category: ExpenseCategory }) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({ onClose, onConfirmExpense }) => {
  const { settings } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<{ title: string; amount: number; category: ExpenseCategory }>({
    title: '',
    amount: 0,
    category: 'other'
  });

  const categories: { id: ExpenseCategory; label: string; icon: string }[] = [
    { id: 'food', label: t('cat_food'), icon: '🍔' },
    { id: 'utilities', label: t('cat_utilities'), icon: '💡' },
    { id: 'appliances', label: t('cat_appliances'), icon: '📺' },
    { id: 'maintenance', label: t('cat_maintenance'), icon: '🔧' },
    { id: 'healthcare', label: t('cat_healthcare'), icon: '💊' },
    { id: 'education', label: t('cat_education'), icon: '📚' },
    { id: 'entertainment', label: t('cat_entertainment'), icon: '🎬' },
    { id: 'other', label: t('cat_other'), icon: '📦' },
  ];

  const quickAdjustDeltas = settings.language === 'en'
    ? [
        { label: '+1$', value: 1 },
        { label: '+5$', value: 5 },
        { label: '+10$', value: 10 },
        { label: '+50$', value: 50 },
      ]
    : settings.language === 'ja'
    ? [
        { label: '+100円', value: 100 },
        { label: '+500円', value: 500 },
        { label: '+1,000円', value: 1000 },
        { label: '+5,000円', value: 5000 },
      ]
    : [
        { label: '+10k', value: 10000 },
        { label: '+50k', value: 50000 },
        { label: '+100k', value: 100000 },
        { label: '+500k', value: 500000 },
      ];

  const sampleVoiceCommands = settings.language === 'en' ? [
    'Coffee at Starbucks 5 dollars',
    'Dinner at restaurant 45 dollars',
    'Electricity bill 80 dollars',
    'Buy fever medicine 15 dollars'
  ] : settings.language === 'ja' ? [
    'スターバックスのコーヒー 450円',
    'レストランでの夕食 4500円',
    '電気料金 8000円',
    '解熱剤の購入 1200円'
  ] : [
    'Mua cà phê Highland 45 nghìn',
    'Ăn phở bò tái 55 ngàn',
    'Thay lõi lọc nước Karofi 110k',
    'Hóa đơn tiền điện sinh hoạt 1 triệu 450 nghìn',
    'Mua thuốc hạ sốt 65k'
  ];

  useEffect(() => {
    return () => {
      stopSpeechRecognition();
    };
  }, []);

  const handleApplyResult = (text: string, parsedResult: { title: string; amount: number; category: ExpenseCategory }) => {
    setTranscript(text);
    setParsed(parsedResult);
    setAmountStr(parsedResult.amount > 0 ? String(parsedResult.amount) : '');
  };

  const handleToggleListening = async () => {
    if (isListening) {
      await stopSpeechRecognition();
      setIsListening(false);
      return;
    }

    setError('');
    setIsListening(true);
    const controller = await startSpeechRecognition(
      (text, parsedResult) => {
        handleApplyResult(text, parsedResult);
        setIsListening(false);
      },
      err => {
        setError(err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      },
      settings.language
    );

    if (!controller) {
      setIsListening(false);
    }
  };

  const handleApplySample = (sample: string) => {
    const result = parseVoiceToExpense(sample);
    handleApplyResult(sample, result);
  };

  const handleAmountChange = (rawVal: string) => {
    const digits = rawVal.replace(/\D/g, '');
    const cleaned = digits.replace(/^0+(?=\d)/, '');
    setAmountStr(cleaned);
    const num = cleaned ? parseInt(cleaned, 10) : 0;
    setParsed(prev => ({ ...prev, amount: num }));
  };

  const handleAdjustAmount = (delta: number) => {
    const current = parsed.amount || 0;
    const updated = Math.max(0, current + delta);
    setParsed(prev => ({ ...prev, amount: updated }));
    setAmountStr(updated > 0 ? String(updated) : '');
  };

  const handleConfirm = () => {
    if (parsed.title.trim() && parsed.amount > 0) {
      onConfirmExpense({
        title: parsed.title.trim(),
        amount: parsed.amount,
        category: parsed.category
      });
      onClose();
    }
  };

  const formatDisplayAmount = (num: number) => {
    if (!num) return '0';
    if (settings.language === 'en') return `$${num.toLocaleString('en-US')}`;
    if (settings.language === 'ja') return `¥${num.toLocaleString('ja-JP')}`;
    return `${num.toLocaleString('vi-VN')} đ`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl md:rounded-3xl p-5 shadow-2xl space-y-4 border-t md:border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Mic size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('voice_title')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                {t('voice_subtitle')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Big Animated Mic Button */}
        <div className="flex flex-col items-center justify-center py-3 space-y-2.5">
          <button
            type="button"
            onClick={handleToggleListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-200 dark:ring-rose-900/60 scale-110'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'
            }`}
            aria-label={isListening ? 'Stop' : 'Start'}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <p className="text-xs font-semibold text-slate-600 dark:text-slate-200 text-center">
            {isListening ? t('voice_listening') : t('voice_tap_to_speak')}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-600 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        {/* Sample Voice Prompts */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} className="text-purple-500 dark:text-purple-400" />
            <span>{t('voice_quick_samples')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sampleVoiceCommands.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySample(sample)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-600 dark:hover:text-purple-300 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition font-medium"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>

        {/* Parsed Result Preview & Interactive Fine-tuning */}
        {transcript && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/60 shadow-sm space-y-3 text-xs animate-in fade-in zoom-in-95 duration-150">
            {/* Recognized text & Edit hint */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/80">
              <div className="truncate pr-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-medium">
                  {t('voice_recognized')}
                </span>
                <span className="text-slate-800 dark:text-indigo-200 font-semibold italic text-xs truncate block">
                  "{transcript}"
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold whitespace-nowrap border border-indigo-200 dark:border-indigo-800">
                <Pencil size={10} />
                {t('voice_edit_badge')}
              </span>
            </div>

            {/* Field 1: Title Editing */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag size={13} className="text-indigo-500 dark:text-indigo-400" />
                  {t('voice_expense_item')}
                </span>
                <span className="text-[10px] text-slate-400">Chạm để sửa</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={parsed.title}
                  onChange={(e) => setParsed(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('voice_title_placeholder')}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                />
                {parsed.title && (
                  <button
                    type="button"
                    onClick={() => setParsed(prev => ({ ...prev, title: '' }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    aria-label="Clear title"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Field 2: Amount Editing */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <DollarSign size={13} className="text-emerald-500 dark:text-emerald-400" />
                  {t('voice_amount')}
                </label>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {formatDisplayAmount(parsed.amount)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr ? Number(amountStr).toLocaleString(settings.language === 'en' ? 'en-US' : 'vi-VN') : ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder={t('voice_amount_placeholder')}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-extrabold text-emerald-600 dark:text-emerald-400 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition pr-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
                  {settings.language === 'en' ? '$' : settings.language === 'ja' ? '¥' : 'đ'}
                </span>
              </div>

              {/* Quick Adjust Amount Chips */}
              <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                  {t('voice_quick_adjust')}
                </span>
                {quickAdjustDeltas.map((delta, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAdjustAmount(delta.value)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition whitespace-nowrap active:scale-95 shadow-2xs"
                  >
                    {delta.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 3: Category Selector */}
            <div className="space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {t('voice_category')}
                </span>
                <span className="capitalize font-bold text-indigo-600 dark:text-indigo-400 text-[10px]">
                  {categories.find(c => c.id === parsed.category)?.label || parsed.category}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {categories.map((cat) => {
                  const isSelected = parsed.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setParsed(prev => ({ ...prev, category: cat.id }))}
                      className={`py-1.5 px-1 rounded-xl text-[10px] font-semibold border flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <span className="text-xs">{cat.icon}</span>
                      <span className="truncate max-w-full text-center">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {t('action_close')}
          </button>
          {parsed.amount > 0 && parsed.title.trim().length > 0 && (
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Check size={16} />
              {t('voice_record_expense')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
