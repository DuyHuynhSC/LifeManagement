import React, { useState } from 'react';
import { X, Key, Zap, CheckCircle2, AlertCircle, Save, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SmartThingsService, TuyaService, LGThinQService, TSmartLifeService } from '../../services/iot';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({
  isOpen,
  onClose
}) => {
  const { settings, updateAppSettings } = useAppStore();

  const [price, setPrice] = useState(settings.electricityPricePerKwh || 2500);
  const [smartThingsToken, setSmartThingsToken] = useState(settings.smartThingsToken || '');
  const [tuyaClientId, setTuyaClientId] = useState(settings.tuyaClientId || '');
  const [tuyaClientSecret, setTuyaClientSecret] = useState(settings.tuyaClientSecret || '');
  const [lgThinqToken, setLgThinqToken] = useState(settings.lgThinqToken || '');
  const [tsmartlifeAccount, setTsmartlifeAccount] = useState(settings.tsmartlifeAccount || '');
  const [tsmartlifeToken, setTsmartlifeToken] = useState(settings.tsmartlifeToken || '');

  const [testResult, setTestResult] = useState<{ provider: string; message: string; success: boolean } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestSmartThings = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await SmartThingsService.testConnection(smartThingsToken);
    setTestResult({
      provider: 'Samsung SmartThings',
      message: res.message,
      success: res.success
    });
    setIsTesting(false);
  };

  const handleTestTuya = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await TuyaService.testConnection(tuyaClientId, tuyaClientSecret);
    setTestResult({
      provider: 'Tuya / SmartLife',
      message: res.message,
      success: res.success
    });
    setIsTesting(false);
  };

  const handleTestLG = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await LGThinQService.testConnection(lgThinqToken);
    setTestResult({
      provider: 'LG ThinQ',
      message: res.message,
      success: res.success
    });
    setIsTesting(false);
  };

  const handleTestTSmartLife = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await TSmartLifeService.testConnection(tsmartlifeAccount, tsmartlifeToken);
    setTestResult({
      provider: 'Toshiba TSmartLife',
      message: res.message,
      success: res.success
    });
    setIsTesting(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings({
      electricityPricePerKwh: Number(price) || 2500,
      smartThingsToken: smartThingsToken.trim(),
      tuyaClientId: tuyaClientId.trim(),
      tuyaClientSecret: tuyaClientSecret.trim(),
      lgThinqToken: lgThinqToken.trim(),
      tsmartlifeAccount: tsmartlifeAccount.trim(),
      tsmartlifeToken: tsmartlifeToken.trim()
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Key size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Cấu hình Cloud API & Điện năng
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {testResult.success ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />}
            <div>
              <span className="font-bold">[{testResult.provider}] </span>
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Cấu hình Đơn giá điện sinh hoạt */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-200 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
              <Zap size={16} />
              <span>Đơn giá điện sinh hoạt gia đình</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="500"
                max="10000"
                step="50"
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-32 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
              />
              <span className="font-semibold text-slate-600 dark:text-slate-400">VNĐ / 1 kWh</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Dùng để tự động tính tiền điện hàng tháng từ dữ liệu các thiết bị IoT và ghi hóa đơn vào Chi tiêu.
            </p>
          </div>

          {/* Samsung SmartThings */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-white">
                Samsung SmartThings (Tủ lạnh, Máy giặt Samsung)
              </span>
              <button
                type="button"
                disabled={isTesting || !smartThingsToken}
                onClick={handleTestSmartThings}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline disabled:opacity-40"
              >
                Kiểm tra kết nối
              </button>
            </div>
            <input
              type="password"
              value={smartThingsToken}
              onChange={e => setSmartThingsToken(e.target.value)}
              placeholder="Nhập Personal Access Token (PAT)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-900 dark:text-white"
            />
            <p className="text-[10px] text-slate-400">
              Lấy PAT miễn phí tại: account.smartthings.com/tokens
            </p>
          </div>

          {/* Tuya / SmartLife */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-white">
                Tuya / SmartLife (Máy lọc nước Karofi, Kangaroo)
              </span>
              <button
                type="button"
                disabled={isTesting || !tuyaClientId}
                onClick={handleTestTuya}
                className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline disabled:opacity-40"
              >
                Kiểm tra kết nối
              </button>
            </div>
            <div className="space-y-1.5">
              <input
                type="text"
                value={tuyaClientId}
                onChange={e => setTuyaClientId(e.target.value)}
                placeholder="Access ID / Client ID..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <input
                type="password"
                value={tuyaClientSecret}
                onChange={e => setTuyaClientSecret(e.target.value)}
                placeholder="Access Secret / Client Secret..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* LG ThinQ */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-white">
                LG ThinQ Connect (Máy giặt, Điều hòa LG)
              </span>
              <button
                type="button"
                disabled={isTesting || !lgThinqToken}
                onClick={handleTestLG}
                className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline disabled:opacity-40"
              >
                Kiểm tra kết nối
              </button>
            </div>
            <input
              type="password"
              value={lgThinqToken}
              onChange={e => setLgThinqToken(e.target.value)}
              placeholder="Nhập LG ThinQ Token..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          {/* Toshiba TSmartLife */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-white">
                Toshiba TSmartLife (Tủ lạnh, Máy giặt Toshiba)
              </span>
              <button
                type="button"
                disabled={isTesting || (!tsmartlifeAccount && !tsmartlifeToken)}
                onClick={handleTestTSmartLife}
                className="text-[11px] text-red-600 dark:text-red-400 font-bold hover:underline disabled:opacity-40"
              >
                Kiểm tra kết nối
              </button>
            </div>
            <div className="space-y-1.5">
              <input
                type="text"
                value={tsmartlifeAccount}
                onChange={e => setTsmartlifeAccount(e.target.value)}
                placeholder="Email hoặc SĐT đăng nhập TSmartLife..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <input
                type="password"
                value={tsmartlifeToken}
                onChange={e => setTsmartlifeToken(e.target.value)}
                placeholder="Mật khẩu hoặc Token TSmartLife..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Kết nối trực tiếp thiết bị qua ứng dụng Toshiba TSmartLife (Tủ lạnh OriginFresh, Máy giặt GreatWaves).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition flex items-center justify-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Đã lưu!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Lưu cấu hình</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
