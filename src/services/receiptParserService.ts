import { Asset, AssetComponent, ExpenseCategory, RoomType } from '../types';

export type ScanSourceType = 'vietqr' | 'einvoice' | 'retail_receipt' | 'asset_qr' | 'url' | 'unknown';

export interface ParsedScanResult {
  sourceType: ScanSourceType;
  rawText: string;
  detectedName?: string;
  suggestedType: 'expense' | 'asset';
  expenseData: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    date: string;
    notes?: string;
    merchant?: string;
  };
  assetData: {
    name: string;
    category: string;
    room: RoomType;
    price: number;
    purchasePlace: string;
    purchaseDate: string;
    warrantyExpiryDate: string;
    serialNumber?: string;
    notes?: string;
    components?: AssetComponent[];
  };
  items?: { name: string; price: number; quantity?: number }[];
}

/**
 * Categorize expense based on text keywords (Vietnamese & English)
 */
export function inferExpenseCategory(text: string): ExpenseCategory {
  const lower = text.toLowerCase();

  if (
    lower.includes('thực phẩm') ||
    lower.includes('rau') ||
    lower.includes('thịt') ||
    lower.includes('cà phê') ||
    lower.includes('coffee') ||
    lower.includes('ăn uống') ||
    lower.includes('bánh') ||
    lower.includes('trà') ||
    lower.includes('nhà hàng') ||
    lower.includes('quán ăn') ||
    lower.includes('winmart') ||
    lower.includes('bách hóa') ||
    lower.includes('co.opmart') ||
    lower.includes('food')
  ) {
    return 'food';
  }

  if (
    lower.includes('tiền điện') ||
    lower.includes('tiền nước') ||
    lower.includes('evn') ||
    lower.includes('internet') ||
    lower.includes('wifi') ||
    lower.includes('gas') ||
    lower.includes('rác') ||
    lower.includes('điện thoại') ||
    lower.includes('cước') ||
    lower.includes('utilities')
  ) {
    return 'utilities';
  }

  if (
    lower.includes('máy giặt') ||
    lower.includes('máy lạnh') ||
    lower.includes('điều hòa') ||
    lower.includes('tủ lạnh') ||
    lower.includes('máy lọc') ||
    lower.includes('tivi') ||
    lower.includes('điện máy') ||
    lower.includes('sharp') ||
    lower.includes('xiaomi') ||
    lower.includes('panasonic') ||
    lower.includes('samsung')
  ) {
    return 'appliances';
  }

  if (
    lower.includes('bảo trì') ||
    lower.includes('sửa chữa') ||
    lower.includes('thay lõi') ||
    lower.includes('bảo dưỡng') ||
    lower.includes('linh kiện')
  ) {
    return 'maintenance';
  }

  if (
    lower.includes('thuốc') ||
    lower.includes('bệnh viện') ||
    lower.includes('khám') ||
    lower.includes('nha khoa') ||
    lower.includes('y tế') ||
    lower.includes('pharmacity') ||
    lower.includes('long châu')
  ) {
    return 'healthcare';
  }

  if (
    lower.includes('học phí') ||
    lower.includes('sách') ||
    lower.includes('khóa học') ||
    lower.includes('tiếng anh')
  ) {
    return 'education';
  }

  if (
    lower.includes('xem phim') ||
    lower.includes('du lịch') ||
    lower.includes('vé máy bay') ||
    lower.includes('khách sạn') ||
    lower.includes('karaoke')
  ) {
    return 'entertainment';
  }

  return 'other';
}

/**
 * Parse VietQR EMVCo format string (e.g. 00020101021238...5406...5303704...)
 */
function parseVietQREMVCo(text: string): { amount?: number; content?: string; bankCode?: string } | null {
  if (!text.startsWith('000201')) {
    return null;
  }

  let index = 0;
  let amount: number | undefined;
  let content: string | undefined;
  let bankCode: string | undefined;

  while (index < text.length - 4) {
    const tag = text.substring(index, index + 2);
    const lengthStr = text.substring(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);
    if (isNaN(length) || length <= 0) break;

    const value = text.substring(index + 4, index + 4 + length);

    // Tag 54: Transaction Amount
    if (tag === '54') {
      const parsedAmount = parseFloat(value);
      if (!isNaN(parsedAmount)) amount = parsedAmount;
    }

    // Tag 38: Beneficiary Merchant info (contains Bank BIN / Account)
    if (tag === '38') {
      // Sub-TLV inside tag 38
      let subIdx = 0;
      while (subIdx < value.length - 4) {
        const subTag = value.substring(subIdx, subIdx + 2);
        const subLen = parseInt(value.substring(subIdx + 2, subIdx + 4), 10);
        if (isNaN(subLen) || subLen <= 0) break;
        const subVal = value.substring(subIdx + 4, subIdx + 4 + subLen);
        if (subTag === '00' && subVal.length >= 6) {
          bankCode = subVal;
        }
        subIdx += 4 + subLen;
      }
    }

    // Tag 62: Additional Data Field (e.g., Tag 08: Purpose of transaction / Content)
    if (tag === '62') {
      let subIdx = 0;
      while (subIdx < value.length - 4) {
        const subTag = value.substring(subIdx, subIdx + 2);
        const subLen = parseInt(value.substring(subIdx + 2, subIdx + 4), 10);
        if (isNaN(subLen) || subLen <= 0) break;
        const subVal = value.substring(subIdx + 4, subIdx + 4 + subLen);
        if (subTag === '08') {
          content = subVal;
        }
        subIdx += 4 + subLen;
      }
    }

    index += 4 + length;
  }

  return { amount, content, bankCode };
}

/**
 * Master parser for scanned QR code or receipt text
 */
export function parseScannedContent(raw: string): ParsedScanResult {
  const trimmed = raw.trim();
  const today = new Date().toISOString().split('T')[0];

  // 1. Check if JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const json = JSON.parse(trimmed);

      // JSON is an Asset
      if (json.name || json.serialNumber || json.warrantyExpiryDate) {
        const assetName = json.name || 'Thiết bị quét mã QR';
        const price = Number(json.price) || 0;
        return {
          sourceType: 'asset_qr',
          rawText: trimmed,
          detectedName: assetName,
          suggestedType: 'asset',
          expenseData: {
            title: `Mua ${assetName}`,
            amount: price,
            category: 'appliances',
            date: json.purchaseDate || today,
            notes: json.notes || `Nhận diện từ mã QR thiết bị (${json.serialNumber || ''})`,
            merchant: json.purchasePlace || 'Cửa hàng điện máy'
          },
          assetData: {
            name: assetName,
            category: json.category || 'Điện gia dụng',
            room: (json.room as RoomType) || 'living_room',
            price,
            purchasePlace: json.purchasePlace || 'Điện Máy Xanh',
            purchaseDate: json.purchaseDate || today,
            warrantyExpiryDate: json.warrantyExpiryDate || '2028-01-01',
            serialNumber: json.serialNumber || 'SN-QR-' + Date.now().toString().slice(-6),
            notes: json.notes || 'Nhập từ mã QR thiết bị',
            components: json.components || []
          }
        };
      }

      // JSON is an Expense
      if (json.amount || json.title) {
        const title = json.title || 'Chi tiêu quét từ mã QR';
        const amount = Number(json.amount) || 0;
        const cat = inferExpenseCategory(title + ' ' + (json.category || ''));
        return {
          sourceType: 'retail_receipt',
          rawText: trimmed,
          detectedName: title,
          suggestedType: 'expense',
          expenseData: {
            title,
            amount,
            category: cat,
            date: json.date || today,
            notes: json.notes || 'Nhập từ mã QR hóa đơn',
            merchant: json.merchant || json.purchasePlace
          },
          assetData: {
            name: title,
            category: 'Điện gia dụng',
            room: 'living_room',
            price: amount,
            purchasePlace: json.merchant || 'Cửa hàng',
            purchaseDate: json.date || today,
            warrantyExpiryDate: today,
            notes: json.notes
          }
        };
      }
    } catch {
      // not valid json, proceed to other parsers
    }
  }

  // 2. Check VietQR EMVCo format
  if (trimmed.startsWith('000201')) {
    const parsedEMV = parseVietQREMVCo(trimmed);
    const amount = parsedEMV?.amount || 0;
    const memo = parsedEMV?.content || 'Chuyển khoản thanh toán VietQR';
    const category = inferExpenseCategory(memo);

    return {
      sourceType: 'vietqr',
      rawText: trimmed,
      detectedName: memo,
      suggestedType: 'expense',
      expenseData: {
        title: memo,
        amount,
        category,
        date: today,
        notes: `Thanh toán VietQR chuẩn EMVCo${parsedEMV?.bankCode ? ` (Mã NH: ${parsedEMV.bankCode})` : ''}`,
        merchant: 'Thanh toán trực tuyến VietQR'
      },
      assetData: {
        name: memo,
        category: 'Điện tử gia dụng',
        room: 'living_room',
        price: amount,
        purchasePlace: 'Thanh toán VietQR',
        purchaseDate: today,
        warrantyExpiryDate: today
      }
    };
  }

  // 3. Check Vietnam e-Invoice format (Thông tư 78: MST|Ký hiệu|Số HĐ|Ngày|Tổng tiền|Thuế...)
  // Example: 0100109106;1C24TML;0001234;2024-05-12;5290000;529000;5819000
  if (trimmed.includes(';') || trimmed.includes('|')) {
    const delimiter = trimmed.includes(';') ? ';' : '|';
    const parts = trimmed.split(delimiter).map((p) => p.trim());

    if (parts.length >= 4) {
      const taxId = parts[0];
      const invoiceSymbol = parts[1];
      const invoiceNo = parts[2];
      const datePart = parts[3];

      let totalAmount = 0;
      for (let i = 4; i < parts.length; i++) {
        const num = parseFloat(parts[i].replace(/[^\d.]/g, ''));
        if (!isNaN(num) && num > totalAmount) {
          totalAmount = num;
        }
      }

      return {
        sourceType: 'einvoice',
        rawText: trimmed,
        detectedName: `HĐĐT số ${invoiceNo} (${invoiceSymbol})`,
        suggestedType: totalAmount > 2000000 ? 'asset' : 'expense',
        expenseData: {
          title: `Hóa đơn điện tử số ${invoiceNo}`,
          amount: totalAmount,
          category: inferExpenseCategory(`HĐĐT ${invoiceSymbol}`),
          date: datePart.length === 10 ? datePart : today,
          notes: `Hóa đơn điện tử MST: ${taxId}, Ký hiệu: ${invoiceSymbol}, Số: ${invoiceNo}`,
          merchant: `MST ${taxId}`
        },
        assetData: {
          name: `Thiết bị theo HĐ ${invoiceNo}`,
          category: 'Điện gia dụng',
          room: 'living_room',
          price: totalAmount,
          purchasePlace: `Đơn vị MST ${taxId}`,
          purchaseDate: datePart.length === 10 ? datePart : today,
          warrantyExpiryDate: '2027-12-31',
          serialNumber: `INV-${invoiceNo}`,
          notes: `Mua theo hóa đơn số ${invoiceNo}, ký hiệu ${invoiceSymbol}`
        }
      };
    }
  }

  // 4. Check URL format
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const isDMX = trimmed.includes('dienmayxanh') || trimmed.includes('thegioididong');
    const isShopee = trimmed.includes('shopee') || trimmed.includes('lazada') || trimmed.includes('tiki');
    const title = isDMX
      ? 'Đơn hàng Điện Máy Xanh'
      : isShopee
      ? 'Đơn hàng Thương Mại Điện Tử'
      : 'Đơn hàng trực tuyến';

    return {
      sourceType: 'url',
      rawText: trimmed,
      detectedName: title,
      suggestedType: isDMX ? 'asset' : 'expense',
      expenseData: {
        title,
        amount: 500000,
        category: isDMX ? 'appliances' : 'other',
        date: today,
        notes: `Tra cứu link: ${trimmed}`,
        merchant: isDMX ? 'Điện Máy Xanh' : isShopee ? 'Sàn TMĐT' : 'Cửa hàng trực tuyến'
      },
      assetData: {
        name: title,
        category: 'Điện gia dụng',
        room: 'living_room',
        price: 500000,
        purchasePlace: isDMX ? 'Điện Máy Xanh' : 'Trực tuyến',
        purchaseDate: today,
        warrantyExpiryDate: '2026-12-31',
        notes: `Link sản phẩm: ${trimmed}`
      }
    };
  }

  // 5. Fallback generic text parser
  const category = inferExpenseCategory(trimmed);
  return {
    sourceType: 'unknown',
    rawText: trimmed,
    detectedName: trimmed.slice(0, 40),
    suggestedType: 'expense',
    expenseData: {
      title: trimmed.length > 50 ? trimmed.substring(0, 50) + '...' : trimmed,
      amount: 150000,
      category,
      date: today,
      notes: trimmed
    },
    assetData: {
      name: trimmed.substring(0, 40),
      category: 'Điện gia dụng',
      room: 'living_room',
      price: 150000,
      purchasePlace: 'Cửa hàng',
      purchaseDate: today,
      warrantyExpiryDate: today,
      notes: trimmed
    }
  };
}

/**
 * Rich realistic sample presets for instant simulation and testing
 */
export const SAMPLE_RECEIPT_PRESETS: {
  id: string;
  name: string;
  badge: string;
  iconName: string;
  result: ParsedScanResult;
}[] = [
  {
    id: 'winmart-grocery',
    name: 'Hóa đơn Siêu thị WinMart+ (Ăn uống & Nhu yếu phẩm)',
    badge: 'Chi tiêu',
    iconName: 'ShoppingCart',
    result: {
      sourceType: 'retail_receipt',
      rawText: 'WINMART+ | HD: WM-982412 | 23/09/2026 | Sữa chua, Trứng gà, Rau củ, Nước mắm | Tổng: 345.000 VNĐ',
      detectedName: 'Siêu thị WinMart+ (Rau củ, Nhu yếu phẩm)',
      suggestedType: 'expense',
      expenseData: {
        title: 'Đi siêu thị WinMart+',
        amount: 345000,
        category: 'food',
        date: new Date().toISOString().split('T')[0],
        notes: 'Mua sữa chua, trứng gà Ba Huân, rau củ quả Đà Lạt, gia vị sinh hoạt',
        merchant: 'WinMart+'
      },
      assetData: {
        name: 'Giỏ hàng WinMart+',
        category: 'Khác',
        room: 'kitchen',
        price: 345000,
        purchasePlace: 'WinMart+',
        purchaseDate: new Date().toISOString().split('T')[0],
        warrantyExpiryDate: new Date().toISOString().split('T')[0]
      },
      items: [
        { name: 'Sữa chua Vinamilk lốc 4', price: 32000, quantity: 2 },
        { name: 'Trứng gà Ba Huân hộp 10', price: 38000, quantity: 1 },
        { name: 'Rau xanh & Cà chua Đà Lạt', price: 85000, quantity: 1 },
        { name: 'Thịt heo sạch MeatDeli 500g', price: 110000, quantity: 1 },
        { name: 'Dầu ăn Simply 1L', price: 48000, quantity: 1 }
      ]
    }
  },
  {
    id: 'vietqr-electricity',
    name: 'VietQR: Thanh toán Tiền điện EVN tháng này',
    badge: 'Tiện ích',
    iconName: 'Zap',
    result: {
      sourceType: 'vietqr',
      rawText: '00020101021238540010A00000072701240006970422011003456789010208QRIBFTTA5303704540714850005802VN62250821TT TIEN DIEN EVN T096304A1B2',
      detectedName: 'Thanh toán tiền điện EVN',
      suggestedType: 'expense',
      expenseData: {
        title: 'Tiền điện EVN tháng 9',
        amount: 1485000,
        category: 'utilities',
        date: new Date().toISOString().split('T')[0],
        notes: 'Mã khách hàng: PE01000234567, thanh toán tự động qua VietQR MBBank',
        merchant: 'Điện lực EVN'
      },
      assetData: {
        name: 'Hóa đơn Điện EVN',
        category: 'Điện gia dụng',
        room: 'living_room',
        price: 1485000,
        purchasePlace: 'EVN',
        purchaseDate: new Date().toISOString().split('T')[0],
        warrantyExpiryDate: new Date().toISOString().split('T')[0]
      }
    }
  },
  {
    id: 'highlands-coffee',
    name: 'Hóa đơn Highlands Coffee (Gặp bạn bè & Thư giãn)',
    badge: 'Ăn uống',
    iconName: 'Coffee',
    result: {
      sourceType: 'retail_receipt',
      rawText: 'HIGHLANDS COFFEE #108 | Phin Sữa Đá, Trà Sen Vàng | 135.000 VNĐ',
      detectedName: 'Highlands Coffee',
      suggestedType: 'expense',
      expenseData: {
        title: 'Cà phê Highlands Coffee',
        amount: 135000,
        category: 'food',
        date: new Date().toISOString().split('T')[0],
        notes: '2 ly Phin sữa đá cỡ lớn + 1 bánh phô mai trà xanh',
        merchant: 'Highlands Coffee'
      },
      assetData: {
        name: 'Highlands Coffee',
        category: 'Khác',
        room: 'other',
        price: 135000,
        purchasePlace: 'Highlands',
        purchaseDate: new Date().toISOString().split('T')[0],
        warrantyExpiryDate: new Date().toISOString().split('T')[0]
      },
      items: [
        { name: 'Phin Sữa Đá (L)', price: 45000, quantity: 2 },
        { name: 'Bánh Mousse Cacao', price: 45000, quantity: 1 }
      ]
    }
  },
  {
    id: 'xiaomi-air-purifier',
    name: 'Hóa đơn Điện Máy Xanh: Máy lọc không khí Xiaomi Pro 4',
    badge: 'Đồ dùng',
    iconName: 'Wind',
    result: {
      sourceType: 'einvoice',
      rawText: '0104918404;1C24TDMX;0048291;2026-09-20;4990000;499000;5489000',
      detectedName: 'Máy lọc không khí Xiaomi Smart Air Purifier 4 Pro',
      suggestedType: 'asset',
      expenseData: {
        title: 'Mua Máy lọc không khí Xiaomi Pro 4',
        amount: 4990000,
        category: 'appliances',
        date: new Date().toISOString().split('T')[0],
        notes: 'Hóa đơn VAT Điện Máy Xanh số 0048291, bảo hành chính hãng 24 tháng',
        merchant: 'Điện Máy Xanh'
      },
      assetData: {
        name: 'Máy lọc không khí Xiaomi Smart Air Purifier 4 Pro',
        category: 'Thiết bị làm sạch',
        room: 'living_room',
        price: 4990000,
        purchasePlace: 'Điện Máy Xanh',
        purchaseDate: new Date().toISOString().split('T')[0],
        warrantyExpiryDate: '2028-09-20',
        serialNumber: 'XIAOMI-AP4P-VN',
        notes: 'Màng lọc 3 trong 1 HEPA lọc 99.97% bụi mịn PM2.5, công suất 500m3/h',
        components: [
          {
            id: 'comp-xiaomi-hepa',
            assetId: '',
            name: 'Màng lọc HEPA 3-in-1 Xiaomi Pro',
            installDate: new Date().toISOString().split('T')[0],
            lifespanDays: 270,
            currentWearPercent: 100,
            replacementCost: 450000,
            notes: 'Cần thay thế sau 9 tháng sử dụng'
          }
        ]
      }
    }
  },
  {
    id: 'sharp-dehumidifier',
    name: 'Mã QR Bảo hành: Máy hút ẩm Sharp Plasmacluster 16L',
    badge: 'Đồ dùng',
    iconName: 'Droplets',
    result: {
      sourceType: 'asset_qr',
      rawText: '{"name":"Máy hút ẩm Sharp Plasmacluster 16L","category":"Điện gia dụng","room":"bedroom","price":5290000,"purchasePlace":"Nguyễn Kim","purchaseDate":"2026-09-22","warrantyExpiryDate":"2028-09-22","serialNumber":"SHARP-DW-D16A-W","notes":"Dung tích 16L/ngày, ion Plasmacluster khử khuẩn","components":[{"name":"Bộ lọc thô kháng khuẩn","installDate":"2026-09-22","lifespanDays":180,"currentWearPercent":100,"replacementCost":180000}]}',
      detectedName: 'Máy hút ẩm Sharp Plasmacluster 16L',
      suggestedType: 'asset',
      expenseData: {
        title: 'Mua Máy hút ẩm Sharp 16L',
        amount: 5290000,
        category: 'appliances',
        date: new Date().toISOString().split('T')[0],
        notes: 'Bảo hành 24 tháng tại Nguyễn Kim, công nghệ Plasmacluster ion',
        merchant: 'Nguyễn Kim'
      },
      assetData: {
        name: 'Máy hút ẩm Sharp Plasmacluster 16L',
        category: 'Điện gia dụng',
        room: 'bedroom',
        price: 5290000,
        purchasePlace: 'Nguyễn Kim',
        purchaseDate: new Date().toISOString().split('T')[0],
        warrantyExpiryDate: '2028-09-22',
        serialNumber: 'SHARP-DW-D16A-W',
        notes: 'Dung tích hút 16L/ngày, công nghệ Plasmacluster ion khử khuẩn và nấm mốc',
        components: [
          {
            id: 'comp-sharp-filter',
            assetId: '',
            name: 'Bộ lọc thô kháng khuẩn Sharp',
            installDate: new Date().toISOString().split('T')[0],
            lifespanDays: 180,
            currentWearPercent: 100,
            replacementCost: 180000
          }
        ]
      }
    }
  }
];
