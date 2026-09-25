import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  QrCode, 
  Upload, 
  Zap, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Wallet, 
  Tv, 
  AlertCircle, 
  ArrowLeft,
  Check, 
  ShoppingCart, 
  Coffee, 
  Wind, 
  Droplets,
  Store,
  ChevronDown
} from 'lucide-react';
import { Asset, Expense, ExpenseCategory, RoomType } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../i18n';
import { 
  startCameraScanner, 
  scanImageFile, 
  ScannerControls 
} from '../../services/qrScannerService';
import { 
  parseScannedContent, 
  ParsedScanResult, 
  SAMPLE_RECEIPT_PRESETS 
} from '../../services/receiptParserService';

interface QRScannerModalProps {
  onClose: () => void;
  onScanResult?: (detectedAsset: Partial<Asset>) => void;
  onSaveExpense?: (expense: Omit<Expense, 'id'>) => void;
  onSaveAsset?: (asset: Omit<Asset, 'id'>) => void;
  initialType?: 'expense' | 'asset';
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  onClose,
  onScanResult,
  onSaveExpense,
  onSaveAsset,
  initialType
}) => {
  const { settings, users, currentUser } = useAppStore();
  const t = (key: any, params?: any) => getTranslation(settings.language, key, params);

  const [viewMode, setViewMode] = useState<'scan' | 'result'>('scan');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [showPresetsSheet, setShowPresetsSheet] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Scan detection result
  const [scanResult, setScanResult] = useState<ParsedScanResult | null>(null);
  const [targetType, setTargetType] = useState<'expense' | 'asset'>('expense');

  // Editable Expense fields
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmountStr, setExpenseAmountStr] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('food');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expensePayerId, setExpensePayerId] = useState(currentUser.id);
  const [expenseNotes, setExpenseNotes] = useState('');

  // Editable Asset fields
  const [assetName, setAssetName] = useState('');
  const [assetPriceStr, setAssetPriceStr] = useState('');
  const [assetCategory, setAssetCategory] = useState('Điện gia dụng');
  const [assetRoom, setAssetRoom] = useState<RoomType>('living_room');
  const [assetPurchaseDate, setAssetPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetWarrantyDate, setAssetWarrantyDate] = useState('2028-09-20');
  const [assetPurchasePlace, setAssetPurchasePlace] = useState('Điện Máy Xanh');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetNotes, setAssetNotes] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement | null>(null);
  const scannerControlsRef = useRef<ScannerControls | null>(null);

  // Handle detection from camera or file
  const handleContentDetected = (text: string) => {
    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop();
    }
    const parsed = parseScannedContent(text);
    applyParsedResult(parsed);
  };

  const applyParsedResult = (parsed: ParsedScanResult) => {
    setScanResult(parsed);
    const chosenType = initialType || parsed.suggestedType;
    setTargetType(chosenType);

    // Populate Expense form
    setExpenseTitle(parsed.expenseData.title);
    setExpenseAmountStr(parsed.expenseData.amount > 0 ? String(parsed.expenseData.amount) : '');
    setExpenseCategory(parsed.expenseData.category);
    setExpenseDate(parsed.expenseData.date);
    setExpenseNotes(parsed.expenseData.notes || '');

    // Populate Asset form
    setAssetName(parsed.assetData.name);
    setAssetPriceStr(parsed.assetData.price > 0 ? String(parsed.assetData.price) : '');
    setAssetCategory(parsed.assetData.category);
    setAssetRoom(parsed.assetData.room);
    setAssetPurchaseDate(parsed.assetData.purchaseDate);
    setAssetWarrantyDate(parsed.assetData.warrantyExpiryDate);
    setAssetPurchasePlace(parsed.assetData.purchasePlace);
    setAssetSerial(parsed.assetData.serialNumber || '');
    setAssetNotes(parsed.assetData.notes || '');

    setShowPresetsSheet(false);
    setViewMode('result');
  };

  // Start Camera Scanner
  useEffect(() => {
    let isMounted = true;

    if (viewMode === 'scan' && videoRef.current) {
      setCameraError(null);
      startCameraScanner(
        videoRef.current,
        (decodedText) => {
          if (isMounted) handleContentDetected(decodedText);
        },
        (errMsg) => {
          if (isMounted) {
            console.warn('Camera scanner init notice:', errMsg);
            setCameraError(errMsg);
            setCameraActive(false);
          }
        }
      )
        .then((controls) => {
          if (isMounted) {
            scannerControlsRef.current = controls;
            setCameraActive(true);
          } else {
            controls.stop();
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.error('Camera init error:', err);
            setCameraActive(false);
          }
        });
    }

    return () => {
      isMounted = false;
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop();
        scannerControlsRef.current = null;
      }
    };
  }, [viewMode, retryKey]);

  // Torch control
  const handleToggleTorch = async () => {
    if (scannerControlsRef.current) {
      const isOn = await scannerControlsRef.current.toggleTorch();
      setIsTorchOn(isOn);
    }
  };

  // Switch Camera
  const handleSwitchCamera = async () => {
    if (scannerControlsRef.current) {
      await scannerControlsRef.current.switchCamera();
      setIsTorchOn(false);
    }
  };

  // Retry opening camera
  const handleRetryCamera = () => {
    setCameraError(null);
    setRetryKey(k => k + 1);
  };

  // Upload photo file from gallery or direct camera snap
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const text = await scanImageFile(file);
      if (text) {
        handleContentDetected(text);
      } else {
        // Fallback: receipt photo without QR, extract name/info from filename or simulated OCR
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        handleContentDetected('Hóa đơn mua hàng: ' + (cleanName || 'Biên lai thanh toán'));
      }
    } catch (err) {
      console.error('File scan error:', err);
      handleContentDetected('Hóa đơn thanh toán mua sắm');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraCaptureInputRef.current) cameraCaptureInputRef.current.value = '';
    }
  };

  // Reset to scan mode
  const handleRescan = () => {
    setScanResult(null);
    setViewMode('scan');
  };

  // Clean numeric string
  const handleExpenseAmountChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const cleaned = digits.replace(/^0+(?=\d)/, '');
    setExpenseAmountStr(cleaned);
  };

  const handleAssetPriceChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const cleaned = digits.replace(/^0+(?=\d)/, '');
    setAssetPriceStr(cleaned);
  };

  // Confirm Save
  const handleConfirmSave = () => {
    if (targetType === 'expense') {
      const amount = Number(expenseAmountStr) || 0;
      const newExpense: Omit<Expense, 'id'> = {
        title: expenseTitle.trim() || 'Chi tiêu quét hóa đơn',
        amount,
        category: expenseCategory,
        date: expenseDate,
        payerId: expensePayerId,
        notes: expenseNotes.trim() ? expenseNotes : 'Ghi nhận từ Quét QR/Hóa đơn'
      };

      if (onSaveExpense) {
        onSaveExpense(newExpense);
      }
      onClose();
    } else {
      const price = Number(assetPriceStr) || 0;
      const newAsset: Omit<Asset, 'id'> = {
        name: assetName.trim() || 'Thiết bị quét mã QR',
        category: assetCategory,
        room: assetRoom,
        price,
        purchaseDate: assetPurchaseDate,
        warrantyExpiryDate: assetWarrantyDate,
        purchasePlace: assetPurchasePlace,
        serialNumber: assetSerial.trim() || 'SN-QR-' + Date.now().toString().slice(-6),
        notes: assetNotes.trim() ? assetNotes : 'Nhận diện tự động từ mã QR/hóa đơn',
        status: 'good',
        components: scanResult?.assetData.components || []
      };

      if (onSaveAsset) {
        onSaveAsset(newAsset);
      } else if (onScanResult) {
        onScanResult(newAsset);
      }
      onClose();
    }
  };

  // Helper for preset icons
  const renderPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingCart': return <ShoppingCart size={16} className="text-emerald-400" />;
      case 'Zap': return <Zap size={16} className="text-amber-400" />;
      case 'Coffee': return <Coffee size={16} className="text-orange-400" />;
      case 'Wind': return <Wind size={16} className="text-cyan-400" />;
      case 'Droplets': return <Droplets size={16} className="text-blue-400" />;
      default: return <Sparkles size={16} className="text-indigo-400" />;
    }
  };

  const getSourceTypeBadge = (sourceType?: string) => {
    switch (sourceType) {
      case 'vietqr':
        return { label: t('scan_type_vietqr'), color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'einvoice':
        return { label: t('scan_type_einvoice'), color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'retail_receipt':
        return { label: t('scan_type_receipt'), color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'asset_qr':
        return { label: t('scan_type_asset'), color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      default:
        return { label: t('scan_detected_badge'), color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black overflow-hidden select-none animate-in fade-in">
      {/* Hidden File / Camera capture inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      <input
        ref={cameraCaptureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* VIEW MODE 1: FULL SCREEN LIVE CAMERA (ZALO / MOMO STYLE) */}
      {viewMode === 'scan' && (
        <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">
          {/* Full Screen Live Video */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Floating Top Header (Glassmorphism overlay) */}
          <div className="relative z-30 flex items-center justify-between p-4 pt-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition shadow-lg"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <h1 className="text-sm font-bold text-white drop-shadow-md flex items-center justify-center gap-1.5">
                <QrCode size={16} className="text-indigo-400" />
                <span>{t('scan_title')}</span>
              </h1>
              <p className="text-[11px] text-slate-200 font-medium drop-shadow-sm">
                {t('scan_subtitle')}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSwitchCamera}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/70 active:scale-95 transition shadow-lg"
              title={t('scan_camera_flip')}
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Viewfinder Center Overlay (Cutout Box with MoMo/Zalo style mask) */}
          <div className="relative flex-1 flex flex-col items-center justify-center pointer-events-none z-20 px-6">
            {/* Viewfinder Box */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-auto flex items-center justify-center">
              {/* Corner Brackets */}
              <div className="absolute -top-1.5 -left-1.5 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-2xl shadow-[0_0_8px_#818cf8]" />
              <div className="absolute -top-1.5 -right-1.5 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-2xl shadow-[0_0_8px_#818cf8]" />
              <div className="absolute -bottom-1.5 -left-1.5 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-2xl shadow-[0_0_8px_#818cf8]" />
              <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-2xl shadow-[0_0_8px_#818cf8]" />

              {/* Animated Laser Scanning Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_16px_#f43f5e] animate-[bounce_2.5s_infinite]" />

              {/* Central faint icon */}
              <QrCode size={64} className="text-white/15" />
            </div>

            {/* Instruction pill right under the box */}
            <p className="mt-5 text-[11px] text-slate-100 font-semibold px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-center max-w-xs shadow-lg border border-white/10 pointer-events-auto">
              {t('scan_hint_viewfinder')}
            </p>

            {/* Flashlight button directly below viewfinder (MoMo style) */}
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`mt-3.5 pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border text-xs font-bold transition shadow-xl active:scale-95 ${
                isTorchOn
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30'
                  : 'bg-black/60 text-slate-200 border-white/20 hover:bg-black/80'
              }`}
            >
              <Zap size={15} className={isTorchOn ? 'fill-current' : ''} />
              <span>{isTorchOn ? 'Tắt đèn Flash' : 'Bật đèn Flash'}</span>
            </button>
          </div>

          {/* Camera Permission / Error Fallback Overlay */}
          {cameraError && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <AlertCircle size={36} />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 className="text-sm font-bold text-white">Chưa thể mở Camera trực tiếp</h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {cameraError}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
                <button
                  type="button"
                  onClick={handleRetryCamera}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs border border-slate-700 transition flex items-center justify-center gap-2 shadow-md"
                >
                  <RotateCcw size={15} className="text-indigo-400" />
                  <span>Thử lại Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraCaptureInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
                >
                  <Camera size={16} />
                  <span>Chụp ảnh bằng Camera máy</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl text-xs border border-slate-800 transition flex items-center justify-center gap-2"
                >
                  <Upload size={14} className="text-indigo-400" />
                  <span>Chọn ảnh từ thư viện</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPresetsSheet(true)}
                  className="w-full py-2 px-4 text-amber-400 font-bold rounded-2xl text-xs hover:bg-amber-400/10 transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Xem các hóa đơn mẫu có sẵn</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Bottom Action Dock (MoMo / Zalo style) */}
          <div className="relative z-30 p-5 pb-8 flex items-center justify-around bg-gradient-to-t from-black/95 via-black/60 to-transparent">
            {/* Gallery Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
              className="flex flex-col items-center gap-1.5 text-slate-300 hover:text-white transition group active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:border-indigo-400 group-hover:text-indigo-400 transition shadow-lg">
                <Upload size={20} />
              </div>
              <span className="text-[11px] font-semibold">
                {isProcessingFile ? 'Đang đọc...' : 'Thư viện ảnh'}
              </span>
            </button>

            {/* Shutter Camera Button (Native Snap) */}
            <button
              type="button"
              onClick={() => cameraCaptureInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 text-white transition group active:scale-90"
              title="Chụp ảnh hóa đơn"
            >
              <div className="w-16 h-16 rounded-full bg-white p-1 shadow-2xl shadow-white/30 flex items-center justify-center group-hover:scale-105 transition">
                <div className="w-full h-full rounded-full border-2 border-slate-900 bg-white flex items-center justify-center text-slate-900">
                  <Camera size={26} />
                </div>
              </div>
              <span className="text-[11px] font-bold">Chụp ảnh</span>
            </button>

            {/* Preset Samples Button */}
            <button
              type="button"
              onClick={() => setShowPresetsSheet(true)}
              className="flex flex-col items-center gap-1.5 text-slate-300 hover:text-white transition group active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:border-amber-400 transition shadow-lg">
                <Sparkles size={20} className="text-amber-400" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">Hóa đơn mẫu</span>
            </button>
          </div>

          {/* Slide-up Bottom Sheet for Sample Presets */}
          {showPresetsSheet && (
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
              <div 
                className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 shadow-2xl space-y-3.5 max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-300"
              >
                {/* Drag Handle & Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <h3 className="font-bold text-xs text-white">Chọn nhanh hóa đơn mẫu</h3>
                      <p className="text-[10px] text-slate-300">Thử nghiệm nhận diện tức thì không cần giấy tờ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPresetsSheet(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>

                {/* Presets List */}
                <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                  {SAMPLE_RECEIPT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyParsedResult(preset.result)}
                      className="w-full text-left p-3 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-2xl text-xs flex items-center justify-between transition group shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
                          {renderPresetIcon(preset.iconName)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-100 group-hover:text-indigo-300 truncate">
                            {preset.name}
                          </p>
                          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 mt-1 font-medium">
                            {preset.badge}
                          </span>
                        </div>
                      </div>
                      <CheckCircle2 size={16} className="text-slate-500 group-hover:text-indigo-400 shrink-0" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowPresetsSheet(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition shrink-0"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: REVIEW & EDIT RESULT (FULL SCREEN / SHEET) */}
      {viewMode === 'result' && scanResult && (
        <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
            <button
              onClick={handleRescan}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 flex items-center gap-1.5 transition text-xs font-bold"
            >
              <ArrowLeft size={18} />
              <span>Quét lại</span>
            </button>

            <div className="text-center">
              <h2 className="text-sm font-bold text-white">{t('scan_result_title')}</h2>
              <span className="text-[10px] text-slate-300">Kiểm tra & điều chỉnh trước khi lưu</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Detection Summary Card */}
            <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Nguồn quét
                </span>
                {(() => {
                  const badge = getSourceTypeBadge(scanResult.sourceType);
                  return (
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>

              <div className="text-xs text-white font-semibold flex items-center gap-2">
                <Store size={15} className="text-indigo-400 shrink-0" />
                <span className="truncate">{scanResult.detectedName || 'Dữ liệu nhận diện'}</span>
              </div>

              {scanResult.items && scanResult.items.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-medium text-slate-300 mb-1.5">
                    Chi tiết hóa đơn ({scanResult.items.length} món):
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto text-[11px] text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    {scanResult.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center py-0.5">
                        <span className="truncate pr-2 text-slate-300">• {it.name} {it.quantity ? `(x${it.quantity})` : ''}</span>
                        <span className="font-semibold text-slate-100 shrink-0">
                          {it.price.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Destination Toggle: Save as Expense vs Save as Asset */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTargetType('expense')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  targetType === 'expense'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Wallet size={15} />
                <span>{t('scan_save_as_expense')}</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('asset')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  targetType === 'asset'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Tv size={15} />
                <span>{t('scan_save_as_asset')}</span>
              </button>
            </div>

            {/* Target 1: Expense Form */}
            {targetType === 'expense' && (
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tên khoản chi
                  </label>
                  <input
                    type="text"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    placeholder="VD: Đi siêu thị WinMart"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Số tiền (VNĐ)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={expenseAmountStr ? Number(expenseAmountStr).toLocaleString('vi-VN') : ''}
                      onChange={(e) => handleExpenseAmountChange(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Danh mục
                    </label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="food">🍔 {t('cat_food')}</option>
                      <option value="utilities">💡 {t('cat_utilities')}</option>
                      <option value="appliances">📺 {t('cat_appliances')}</option>
                      <option value="maintenance">🔧 {t('cat_maintenance')}</option>
                      <option value="healthcare">💊 {t('cat_healthcare')}</option>
                      <option value="education">📚 {t('cat_education')}</option>
                      <option value="entertainment">🎬 {t('cat_entertainment')}</option>
                      <option value="other">📦 {t('cat_other')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Ngày chi
                    </label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Người thanh toán
                    </label>
                    <select
                      value={expensePayerId}
                      onChange={(e) => setExpensePayerId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Ghi chú / Đơn vị
                  </label>
                  <input
                    type="text"
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                    placeholder="Ghi chú chi tiêu..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Target 2: Asset Form */}
            {targetType === 'asset' && (
              <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tên thiết bị / đồ dùng
                  </label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="VD: Máy hút ẩm Sharp"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Giá mua (VNĐ)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={assetPriceStr ? Number(assetPriceStr).toLocaleString('vi-VN') : ''}
                      onChange={(e) => handleAssetPriceChange(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-indigo-400 font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Vị trí phòng
                    </label>
                    <select
                      value={assetRoom}
                      onChange={(e) => setAssetRoom(e.target.value as RoomType)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="living_room">{t('room_living_room')}</option>
                      <option value="kitchen">{t('room_kitchen')}</option>
                      <option value="bedroom">{t('room_bedroom')}</option>
                      <option value="bathroom">{t('room_bathroom')}</option>
                      <option value="balcony">{t('room_balcony')}</option>
                      <option value="other">{t('room_other')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nơi mua
                    </label>
                    <input
                      type="text"
                      value={assetPurchasePlace}
                      onChange={(e) => setAssetPurchasePlace(e.target.value)}
                      placeholder="Điện Máy Xanh"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Hạn bảo hành
                    </label>
                    <input
                      type="date"
                      value={assetWarrantyDate}
                      onChange={(e) => setAssetWarrantyDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Số Serial / Model
                  </label>
                  <input
                    type="text"
                    value={assetSerial}
                    onChange={(e) => setAssetSerial(e.target.value)}
                    placeholder="VD: SHARP-DW-D16A-W"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Sticky Action Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 shrink-0 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRescan}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition"
            >
              Quét lại
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className={`flex-1 py-3 px-4 text-white font-bold rounded-2xl text-xs shadow-xl transition flex items-center justify-center gap-2 ${
                targetType === 'expense'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/40'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/40'
              }`}
            >
              <Check size={16} />
              <span>
                {targetType === 'expense'
                  ? t('scan_btn_confirm_expense')
                  : t('scan_btn_confirm_asset')}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
