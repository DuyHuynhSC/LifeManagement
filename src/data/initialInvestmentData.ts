import { InvestmentAsset, InvestmentTransaction, DividendRecord } from '../types/investment';

export const initialInvestmentAssets: InvestmentAsset[] = [
  {
    id: 'asset-fpt',
    symbol: 'FPT',
    name: 'Công ty Cổ phần FPT',
    assetClass: 'stock',
    quantity: 1200,
    avgBuyPrice: 98000,
    currentPrice: 135000,
    currency: 'VND',
    firstBuyDate: '2025-03-15', // Nắm giữ dài hạn (> 1 năm tính theo mốc 2026)
    targetPrice: 150000,
    stopLossPrice: 90000,
    notes: 'Cổ phiếu công nghệ tăng trưởng dài hạn, hưởng lợi từ AI & Bán dẫn'
  },
  {
    id: 'asset-hpg',
    symbol: 'HPG',
    name: 'Tập đoàn Hòa Phát',
    assetClass: 'stock',
    quantity: 2500,
    avgBuyPrice: 28500,
    currentPrice: 31200,
    currency: 'VND',
    firstBuyDate: '2025-08-20',
    targetPrice: 36000,
    stopLossPrice: 26000,
    notes: 'Kỳ vọng lò cao Dung Quất 2 đi vào hoạt động toàn phần'
  },
  {
    id: 'asset-btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    assetClass: 'crypto',
    quantity: 0.15,
    avgBuyPrice: 1650000000, // ~ 66,000 USD
    currentPrice: 2150000000, // ~ 86,000 USD
    currency: 'VND',
    firstBuyDate: '2025-11-10',
    targetPrice: 2500000000,
    notes: 'Lưu trữ ví lạnh cá nhân Ledger, tích sản dài hạn'
  },
  {
    id: 'asset-eth',
    symbol: 'ETH',
    name: 'Ethereum',
    assetClass: 'crypto',
    quantity: 1.8,
    avgBuyPrice: 82000000, // ~ 3,280 USD
    currentPrice: 78000000, // Đang hơi lỗ ngắn hạn
    currency: 'VND',
    firstBuyDate: '2026-06-01',
    targetPrice: 110000000,
    notes: 'Staking nhận lãi định kỳ hàng tuần'
  },
  {
    id: 'asset-sjc',
    symbol: 'SJC-1L',
    name: 'Vàng miếng SJC 1 lượng',
    assetClass: 'gold',
    quantity: 3,
    avgBuyPrice: 84000000,
    currentPrice: 91500000,
    currency: 'VND',
    firstBuyDate: '2025-01-10',
    notes: 'Bảo vệ giá trị trước lạm phát, lưu két an toàn'
  },
  {
    id: 'asset-tiet-kiem-vcb',
    symbol: 'TK-VCB-12M',
    name: 'Sổ tiết kiệm Vietcombank 12 tháng',
    assetClass: 'savings',
    quantity: 1,
    avgBuyPrice: 200000000,
    currentPrice: 200000000,
    currency: 'VND',
    firstBuyDate: '2025-10-15',
    notes: 'Lãi suất 5.3%/năm, nhận lãi định kỳ vào tài khoản'
  }
];

export const initialInvestmentTransactions: InvestmentTransaction[] = [
  {
    id: 'tx-1',
    assetId: 'asset-fpt',
    type: 'buy',
    date: '2025-03-15',
    quantity: 800,
    pricePerUnit: 95000,
    fees: 114000,
    tax: 0,
    totalAmount: 76114000,
    notes: 'Lệnh mua mở vị thế đợt 1'
  },
  {
    id: 'tx-2',
    assetId: 'asset-fpt',
    type: 'buy',
    date: '2025-07-10',
    quantity: 400,
    pricePerUnit: 104000,
    fees: 62400,
    tax: 0,
    totalAmount: 41662400,
    notes: 'Mua gia tăng tích sản thêm sau điều chỉnh'
  },
  {
    id: 'tx-3',
    assetId: 'asset-hpg',
    type: 'buy',
    date: '2025-08-20',
    quantity: 3000,
    pricePerUnit: 28500,
    fees: 128250,
    tax: 0,
    totalAmount: 85628250,
    notes: 'Mua tích lũy vùng nền hỗ trợ'
  },
  {
    id: 'tx-4',
    assetId: 'asset-hpg',
    type: 'sell',
    date: '2026-03-10',
    quantity: 500,
    pricePerUnit: 32000,
    fees: 24000,
    tax: 16000,
    totalAmount: 15960000,
    notes: 'Chốt lời ngắn hạn 500 cổ phiếu lấy dòng tiền tái cơ cấu'
  },
  {
    id: 'tx-5',
    assetId: 'asset-btc',
    type: 'buy',
    date: '2025-11-10',
    quantity: 0.15,
    pricePerUnit: 1650000000,
    fees: 247500,
    tax: 0,
    totalAmount: 247747500,
    notes: 'DCA lệnh spot trên sàn Binance'
  }
];

export const initialDividends: DividendRecord[] = [
  {
    id: 'div-1',
    assetId: 'asset-fpt',
    date: '2025-06-25',
    type: 'cash',
    amountOrQuantity: 1200000, // 1000đ / cp cho 1200 cp
    taxDeducted: 60000, // 5% thuế TNCN
    reinvested: false,
    notes: 'Cổ tức đợt 2/2024 (10% bằng tiền)'
  },
  {
    id: 'div-2',
    assetId: 'asset-fpt',
    date: '2025-12-15',
    type: 'cash',
    amountOrQuantity: 1800000, // 1500đ / cp
    taxDeducted: 90000,
    reinvested: false,
    notes: 'Tạm ứng cổ tức đợt 1/2025 bằng tiền'
  },
  {
    id: 'div-3',
    assetId: 'asset-eth',
    date: '2026-07-01',
    type: 'cash',
    amountOrQuantity: 450000,
    taxDeducted: 0,
    reinvested: true,
    notes: 'Phần thưởng Staking ETH validator'
  },
  {
    id: 'div-4',
    assetId: 'asset-tiet-kiem-vcb',
    date: '2026-04-15',
    type: 'cash',
    amountOrQuantity: 5300000, // Trả lãi 6 tháng
    taxDeducted: 0,
    reinvested: false,
    notes: 'Lãi tiền gửi tiết kiệm có kỳ hạn'
  }
];
