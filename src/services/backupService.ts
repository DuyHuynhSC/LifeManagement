import { Asset, Expense, User, Budget, Task, IoTDevice, GamificationBadge, AppSettings } from '../types';
import { InvestmentAsset, InvestmentTransaction, DividendRecord } from '../types/investment';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface BackupData {
  version?: number;
  appName?: string;
  exportedAt?: string;
  assets?: Asset[];
  expenses?: Expense[];
  users?: User[];
  budgets?: Budget[];
  tasks?: Task[];
  iotDevices?: IoTDevice[];
  badges?: GamificationBadge[];
  settings?: Partial<AppSettings>;
  currentUserId?: string;
  // Danh mục Đầu tư & Tài chính
  investments?: {
    assets?: InvestmentAsset[];
    transactions?: InvestmentTransaction[];
    dividends?: DividendRecord[];
  };
  investmentAssets?: InvestmentAsset[];
  investmentTransactions?: InvestmentTransaction[];
  investmentDividends?: DividendRecord[];
}

export interface BackupSummary {
  version?: number;
  exportedAt?: string;
  assetsCount: number;
  expensesCount: number;
  usersCount: number;
  tasksCount: number;
  budgetsCount: number;
  iotDevicesCount: number;
  investmentsCount: number;
  investmentTransactionsCount: number;
  dividendsCount: number;
}

export interface ExportResult {
  success: boolean;
  message?: string;
  method?: 'native-share' | 'web-share' | 'download' | 'clipboard';
}

/**
 * Xuất dữ liệu sao lưu JSON hỗ trợ đa nền tảng (Web, Mobile Browser, Capacitor Android/iOS)
 */
export async function exportBackupData(data: BackupData): Promise<ExportResult> {
  const fileName = `famlife-backup-${new Date().toISOString().split('T')[0]}.json`;
  const jsonString = JSON.stringify(data, null, 2);

  // 1. Nếu đang chạy trên Native App (Capacitor Android/iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      // Ghi file vào thư mục Cache của ứng dụng
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      // Mở hộp thoại Share của hệ điều hành để người dùng lưu vào máy hoặc gửi qua ứng dụng khác
      await Share.share({
        title: 'Sao lưu dữ liệu FamLife',
        text: `Bản sao lưu FamLife (${new Date().toLocaleDateString('vi-VN')})`,
        url: writeResult.uri,
        dialogTitle: 'Lưu hoặc chia sẻ bản sao lưu'
      });

      return { success: true, method: 'native-share' };
    } catch (nativeErr: any) {
      // Người dùng bấm hủy chia sẻ
      if (
        nativeErr?.message?.includes('canceled') || 
        nativeErr?.message?.includes('cancelled') ||
        nativeErr?.name === 'AbortError'
      ) {
        return { success: true, message: 'Đã hủy thao tác lưu', method: 'native-share' };
      }
      console.warn('Native export failed, attempting web fallback...', nativeErr);
    }
  }

  // 2. Nếu đang chạy trên Web / Mobile Browser có hỗ trợ Web Share API với tệp tin
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([jsonString], fileName, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Sao lưu FamLife',
          text: `Bản sao lưu FamLife ngày ${new Date().toLocaleDateString('vi-VN')}`
        });
        return { success: true, method: 'web-share' };
      }
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        return { success: true, message: 'Đã hủy thao tác lưu', method: 'web-share' };
      }
      console.warn('Web Share API failed, attempting download fallback...', shareErr);
    }
  }

  // 3. Fallback tải xuống chuẩn trình duyệt (Desktop Browser / Android Chrome)
  try {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { success: true, method: 'download' };
  } catch (downloadErr) {
    console.error('All download methods failed:', downloadErr);
    return { 
      success: false, 
      message: 'Không thể tải file tự động. Vui lòng thử sao chép dữ liệu vào bộ nhớ tạm.' 
    };
  }
}

/**
 * Đọc nội dung tệp tin do người dùng tải lên (File object)
 */
export function readBackupFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Không đọc được nội dung tệp'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc tệp tin'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Kiểm tra và phân tích tính hợp lệ của tệp sao lưu JSON
 */
export function validateBackupData(jsonString: string): {
  valid: boolean;
  data?: BackupData;
  error?: string;
  summary?: BackupSummary;
} {
  try {
    const trimmed = jsonString.trim();
    if (!trimmed) {
      return { valid: false, error: 'Dữ liệu JSON rỗng' };
    }

    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, error: 'Định dạng dữ liệu không phải là đối tượng JSON hợp lệ' };
    }

    // Kiểm tra có ít nhất 1 mảng dữ liệu đặc trưng của FamLife
    const hasAssets = Array.isArray(parsed.assets);
    const hasExpenses = Array.isArray(parsed.expenses);
    const hasUsers = Array.isArray(parsed.users);
    const hasTasks = Array.isArray(parsed.tasks);
    const hasBudgets = Array.isArray(parsed.budgets);
    const hasIoT = Array.isArray(parsed.iotDevices);
    const hasInvestments = (parsed.investments && Array.isArray(parsed.investments.assets)) || Array.isArray(parsed.investmentAssets);
    const hasInvestmentTx = (parsed.investments && Array.isArray(parsed.investments.transactions)) || Array.isArray(parsed.investmentTransactions);
    const hasDividends = (parsed.investments && Array.isArray(parsed.investments.dividends)) || Array.isArray(parsed.investmentDividends);

    if (!hasAssets && !hasExpenses && !hasUsers && !hasTasks && !hasBudgets && !hasIoT && !hasInvestments && !hasInvestmentTx && !hasDividends) {
      return { 
        valid: false, 
        error: 'Tệp không chứa dữ liệu hợp lệ của ứng dụng FamLife (không tìm thấy đồ dùng, chi tiêu, đầu tư hoặc thành viên)' 
      };
    }

    const investmentsCount = Array.isArray(parsed.investments?.assets) 
      ? parsed.investments.assets.length 
      : (Array.isArray(parsed.investmentAssets) ? parsed.investmentAssets.length : 0);

    const investmentTransactionsCount = Array.isArray(parsed.investments?.transactions) 
      ? parsed.investments.transactions.length 
      : (Array.isArray(parsed.investmentTransactions) ? parsed.investmentTransactions.length : 0);

    const dividendsCount = Array.isArray(parsed.investments?.dividends) 
      ? parsed.investments.dividends.length 
      : (Array.isArray(parsed.investmentDividends) ? parsed.investmentDividends.length : 0);

    const summary: BackupSummary = {
      version: parsed.version,
      exportedAt: parsed.exportedAt,
      assetsCount: hasAssets ? parsed.assets.length : 0,
      expensesCount: hasExpenses ? parsed.expenses.length : 0,
      usersCount: hasUsers ? parsed.users.length : 0,
      tasksCount: hasTasks ? parsed.tasks.length : 0,
      budgetsCount: hasBudgets ? parsed.budgets.length : 0,
      iotDevicesCount: hasIoT ? parsed.iotDevices.length : 0,
      investmentsCount,
      investmentTransactionsCount,
      dividendsCount
    };

    return {
      valid: true,
      data: parsed as BackupData,
      summary
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Lỗi cú pháp JSON: ${err?.message || 'Không thể phân tích dữ liệu'}`
    };
  }
}

/**
 * Hỗ trợ sao chép JSON vào clipboard (phương án dự phòng bổ sung)
 */
export async function copyBackupToClipboard(data: BackupData): Promise<boolean> {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonString);
      return true;
    }
    // Fallback cho trình duyệt cũ
    const textArea = document.createElement('textarea');
    textArea.value = jsonString;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
