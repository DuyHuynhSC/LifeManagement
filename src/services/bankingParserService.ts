import { ExpenseCategory, CategoryItem, PaymentAppSource, PendingBankTransaction } from '../types';
import { inferExpenseCategory } from './receiptParserService';

export interface BankAppMeta {
  source: PaymentAppSource;
  displayName: string;
  iconName: string;
  color: string;
  packageNames: string[];
}

export const SUPPORTED_PAYMENT_APPS: Record<PaymentAppSource, BankAppMeta> = {
  momo: {
    source: 'momo',
    displayName: 'Ví MoMo',
    iconName: 'momo',
    color: '#d82d8b',
    packageNames: ['com.mservice.momotransfer', 'com.mservice.momo']
  },
  zalopay: {
    source: 'zalopay',
    displayName: 'Ví ZaloPay',
    iconName: 'zalopay',
    color: '#0068ff',
    packageNames: ['vn.com.vng.zalopay']
  },
  vcb: {
    source: 'vcb',
    displayName: 'Vietcombank',
    iconName: 'vcb',
    color: '#006633',
    packageNames: ['com.VCB', 'com.vcb.digibank']
  },
  tcb: {
    source: 'tcb',
    displayName: 'Techcombank',
    iconName: 'tcb',
    color: '#ea1d25',
    packageNames: ['vn.com.techcombank.bb.app', 'com.techcombank.mobile']
  },
  mbbank: {
    source: 'mbbank',
    displayName: 'MB Bank',
    iconName: 'mbbank',
    color: '#002878',
    packageNames: ['com.mbmobile', 'com.mbbank']
  },
  bidv: {
    source: 'bidv',
    displayName: 'BIDV SmartBanking',
    iconName: 'bidv',
    color: '#025f59',
    packageNames: ['com.vnpay.bidv']
  },
  vpbank: {
    source: 'vpbank',
    displayName: 'VPBank NEO',
    iconName: 'vpbank',
    color: '#00b14f',
    packageNames: ['com.vnpay.vpbankonline', 'com.vpbank.neo']
  },
  tpbank: {
    source: 'tpbank',
    displayName: 'TPBank',
    iconName: 'tpbank',
    color: '#732673',
    packageNames: ['com.tpb.mb.gprsandroid']
  },
  acb: {
    source: 'acb',
    displayName: 'ACB ONE',
    iconName: 'acb',
    color: '#0f4c81',
    packageNames: ['mobile.acb.com.vn']
  },
  vietinbank: {
    source: 'vietinbank',
    displayName: 'VietinBank iPay',
    iconName: 'vietinbank',
    color: '#005a9c',
    packageNames: ['com.vietinbank.ipay']
  },
  sms: {
    source: 'sms',
    displayName: 'SMS Banking',
    iconName: 'sms',
    color: '#6366f1',
    packageNames: ['com.google.android.apps.messaging', 'com.samsung.android.messaging', 'com.android.mms']
  },
  clipboard: {
    source: 'clipboard',
    displayName: 'Sao chép biên lai',
    iconName: 'clipboard',
    color: '#0284c7',
    packageNames: []
  },
  other: {
    source: 'other',
    displayName: 'Ngân hàng / Ví điện tử',
    iconName: 'bank',
    color: '#10b981',
    packageNames: []
  }
};

/**
 * Identify source app from package name or text mentions
 */
export function identifyPaymentSource(packageName?: string, text?: string): PaymentAppSource {
  if (packageName) {
    const pkgLower = packageName.toLowerCase();
    for (const [key, meta] of Object.entries(SUPPORTED_PAYMENT_APPS)) {
      if (meta.packageNames.some(p => pkgLower.includes(p.toLowerCase()))) {
        return key as PaymentAppSource;
      }
    }
  }

  if (text) {
    const lower = text.toLowerCase();
    if (lower.includes('momo') || lower.includes('ví momo')) return 'momo';
    if (lower.includes('zalopay') || lower.includes('zalo pay')) return 'zalopay';
    if (lower.includes('vietcombank') || lower.includes('vcb') || lower.includes('digibank')) return 'vcb';
    if (lower.includes('techcombank') || lower.includes('tcb')) return 'tcb';
    if (lower.includes('mbbank') || lower.includes('mb bank') || lower.includes('ngan hang quan doi')) return 'mbbank';
    if (lower.includes('bidv')) return 'bidv';
    if (lower.includes('vpbank') || lower.includes('vp bank') || lower.includes('neo')) return 'vpbank';
    if (lower.includes('tpbank') || lower.includes('tpb')) return 'tpbank';
    if (lower.includes('acb')) return 'acb';
    if (lower.includes('vietinbank') || lower.includes('vietin bank') || lower.includes('ipay')) return 'vietinbank';
  }

  return 'other';
}

/**
 * Filter out messages that are clearly NOT debit / outgoing transactions
 */
export function isLikelyDebitNotification(text: string): boolean {
  const lower = text.toLowerCase();

  // 1. Check for OTP / Security verification codes
  if (
    lower.includes('mã otp') ||
    lower.includes('smart otp') ||
    lower.includes('ma xac thuc') ||
    lower.includes('mã xác thực') ||
    lower.includes('không chia sẻ mã') ||
    lower.includes('otp de xac nhan')
  ) {
    return false;
  }

  // 2. Filter out pure marketing, promos, rewards without an actual payment
  if (
    (lower.includes('khuyến mãi') ||
      lower.includes('ưu đãi') ||
      lower.includes('voucher') ||
      lower.includes('hoàn tiền') ||
      lower.includes('tặng bạn') ||
      lower.includes('chúc mừng bạn nhận được')) &&
    !lower.includes('thanh toán thành công') &&
    !lower.includes('chuyển tiền thành công')
  ) {
    return false;
  }

  // 3. Filter out Incoming/Credit money (tiền vào) unless it's explicitly an outgoing payment
  const isIncoming =
    lower.includes('nhận tiền từ') ||
    lower.includes('nhan duoc') ||
    lower.includes('nhận được') ||
    /\+\s*\d+([.,]\d+)?\s*(đ|vnd|dong)/i.test(text);

  if (isIncoming && !lower.includes('thanh toán') && !lower.includes('chuyển tiền')) {
    return false;
  }

  // 4. Look for debit signals: negative signs or payment/transfer keywords
  const hasNegativeSign = /[-−–]\s*\d+([.,]\d+)?\s*(đ|vnd|dong|k|triệu)?/i.test(text);
  const hasDebitAction =
    lower.includes('thanh toán thành công') ||
    lower.includes('chuyển tiền thành công') ||
    lower.includes('thanh toan thanh cong') ||
    lower.includes('chuyen tien thanh cong') ||
    lower.includes('giao dịch thành công') ||
    lower.includes('chuyển khoản thành công') ||
    lower.includes('bạn vừa thanh toán') ||
    lower.includes('vừa trừ') ||
    lower.includes('sd tk') ||
    lower.includes('số dư tk') ||
    lower.includes('biến động số dư') ||
    lower.includes('gd: -') ||
    lower.includes('tai khoan');

  return hasNegativeSign || hasDebitAction;
}

/**
 * Extract amount, clean title, recipient and infer category from bank/wallet notification text
 */
export function parseBankNotification(
  rawText: string,
  sourceOverride?: PaymentAppSource,
  availableCategories?: CategoryItem[]
): PendingBankTransaction | null {
  const trimmed = rawText.trim();
  if (!trimmed || !isLikelyDebitNotification(trimmed)) {
    return null;
  }

  const detectedSource = sourceOverride || identifyPaymentSource(undefined, trimmed);
  const sourceMeta = SUPPORTED_PAYMENT_APPS[detectedSource] || SUPPORTED_PAYMENT_APPS.other;

  // 1. Regex to capture amount
  // Format examples: "-50.000đ", "- 150,000 VND", "Số tiền: 250.000đ", "GD: -85,000VND", "50.000 VND", "1.200.000đ"
  let amount = 0;

  // Match explicitly negative amounts first (-150.000, - 85,000 VND)
  const negativeRegex = /[-−–]\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,10})\s*(?:đ|vnd|dong)?/i;
  // Match labeled amounts ("Số tiền: 150.000", "So tien: 150.000")
  const labeledRegex = /(?:số tiền|so tien|thanh toán|chuyển|chuyen|trừ|tru|tong tien|tổng tiền)[:\s]+([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,10})\s*(?:đ|vnd|dong)?/i;
  // General currency regex (e.g. "150.000 VND", "250,000 đ")
  const currencyRegex = /([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,10})\s*(?:đ|vnd|đồng|dong)\b/i;

  const negMatch = trimmed.match(negativeRegex);
  const labMatch = trimmed.match(labeledRegex);
  const currMatch = trimmed.match(currencyRegex);

  if (negMatch) {
    const rawNum = negMatch[1].replace(/[.,]/g, '');
    amount = parseInt(rawNum, 10);
  } else if (labMatch) {
    const rawNum = labMatch[1].replace(/[.,]/g, '');
    amount = parseInt(rawNum, 10);
  } else if (currMatch) {
    const rawNum = currMatch[1].replace(/[.,]/g, '');
    amount = parseInt(rawNum, 10);
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return null;
  }

  // 2. Default to fixed clean title as requested by user ("Mua đồ dùng")
  const cleanTitle = 'Mua đồ dùng';

  // 3. Infer category from notification keywords
  let category: ExpenseCategory = inferExpenseCategory(trimmed);

  // If inferred as other, check custom categories
  if (category === 'other' && availableCategories && availableCategories.length > 0) {
    const lower = trimmed.toLowerCase();
    for (const cat of availableCategories) {
      if (cat.name && lower.includes(cat.name.toLowerCase())) {
        category = cat.id;
        break;
      }
    }
  }

  // 4. Fingerprint for deduplication (same source + amount + date)
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const fingerprint = `${detectedSource}_${amount}_${dateStr}`;

  return {
    id: `bank-tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sourceApp: detectedSource,
    sourceAppName: sourceMeta.displayName,
    amount,
    suggestedTitle: cleanTitle,
    suggestedCategory: category,
    rawNotificationText: trimmed,
    timestamp: now.toISOString(),
    date: dateStr,
    fingerprint
  };
}

/**
 * Realistic Simulation Presets for immediate interactive demo and testing
 */
export const SAMPLE_BANK_NOTIFICATIONS = [
  {
    id: 'sim-momo-highlands',
    title: 'MoMo: Cà phê Highlands Coffee',
    badge: 'Ví MoMo',
    source: 'momo' as PaymentAppSource,
    rawText: 'MoMo: Bạn vừa thanh toán thành công 65.000đ tại HIGHLANDS COFFEE. Mã GD: MM98241256.',
    expectedAmount: 65000,
    expectedCategory: 'food'
  },
  {
    id: 'sim-vcb-electricity',
    title: 'Vietcombank: Thanh toán tiền điện EVN',
    badge: 'Vietcombank',
    source: 'vcb' as PaymentAppSource,
    rawText: 'VCB Digibank: SD TK 0011002345xxx -1,250,000 VND luc 30/10/2026. ND: EVNHCMC PE01000234567 TT TIEN DIEN T10/2026.',
    expectedAmount: 1250000,
    expectedCategory: 'utilities'
  },
  {
    id: 'sim-mbbank-supermarket',
    title: 'MB Bank: Đi siêu thị WinMart+',
    badge: 'MB Bank',
    source: 'mbbank' as PaymentAppSource,
    rawText: 'MB: TK 0987654321 GD: -380,000VND vao 30/10/2026. ND: QRIBFTTA TT SIÊU THỊ WINMART CONG HOA.',
    expectedAmount: 380000,
    expectedCategory: 'food'
  },
  {
    id: 'sim-tcb-lunch',
    title: 'Techcombank: Ăn trưa bún bò',
    badge: 'Techcombank',
    source: 'tcb' as PaymentAppSource,
    rawText: 'Techcombank: TK 1903456789 -55,000 VND vao 12:30. ND: Bun bo Hue Co Ba chuyen khoan an trua.',
    expectedAmount: 55000,
    expectedCategory: 'food'
  },
  {
    id: 'sim-zalopay-pharmacy',
    title: 'ZaloPay: Mua thuốc Pharmacity',
    badge: 'ZaloPay',
    source: 'zalopay' as PaymentAppSource,
    rawText: 'ZaloPay: Bạn đã thanh toán 145.000đ cho NHÀ THUỐC PHARMACITY thành công.',
    expectedAmount: 145000,
    expectedCategory: 'healthcare'
  },
  {
    id: 'sim-vpbank-internet',
    title: 'VPBank: Tiền cước Internet Viettel',
    badge: 'VPBank NEO',
    source: 'vpbank' as PaymentAppSource,
    rawText: 'VPBank NEO: TK 123456xxx giam -260,000 VND. ND: Cuoc internet Viettel T10 Hop dong VT09823.',
    expectedAmount: 260000,
    expectedCategory: 'utilities'
  }
];
