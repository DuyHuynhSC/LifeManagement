// Định nghĩa Types cho Phân hệ Quản lý & Theo dõi Danh mục Đầu tư (FamLife Investment)

export type AssetClass = 
  | 'stock'        // Cổ phiếu (VN, US...)
  | 'crypto'       // Tiền mã hóa (BTC, ETH, SOL...)
  | 'gold'         // Vàng, kim loại quý (SJC, Nhẫn 9999...)
  | 'savings'      // Tiết kiệm ngân hàng, Trái phiếu
  | 'fund'         // Chứng chỉ quỹ mở, ETF
  | 'real_estate'  // Bất động sản
  | 'other';       // Khác

export type TransactionType = 
  | 'buy'             // Lệnh Mua
  | 'sell'            // Lệnh Bán
  | 'dividend_cash'   // Cổ tức tiền mặt / Tiền lãi
  | 'dividend_stock'  // Cổ tức cổ phiếu / Cổ phiếu thưởng
  | 'interest';       // Lãi suất gửi tiết kiệm / Staking

export type HoldingCategory = 
  | 'short_term'   // Dưới 90 ngày (Lướt sóng / Ngắn hạn)
  | 'medium_term'  // 90 - 365 ngày (Trung hạn)
  | 'long_term';   // Trên 365 ngày (Dài hạn)

export interface InvestmentAsset {
  id: string;
  symbol: string;             // Mã Ticker: VNM, HPG, BTC, ETH, SJC...
  name: string;               // Tên đầy đủ: Tập đoàn Hòa Phát, Bitcoin...
  assetClass: AssetClass;     // Phân loại tài sản
  quantity: number;           // Số lượng đang nắm giữ hiện tại
  avgBuyPrice: number;        // Giá vốn trung bình (DCA)
  currentPrice: number;       // Giá thị trường hiện tại
  currency: 'VND' | 'USD';    // Đơn vị tiền tệ
  firstBuyDate: string;       // Ngày mua đầu tiên (YYYY-MM-DD)
  notes?: string;
  targetPrice?: number;       // Giá mục tiêu chốt lời
  stopLossPrice?: number;     // Giá cắt lỗ
  iconUrl?: string;

  // Thuộc tính riêng cho Tiết kiệm ngân hàng / Tiền gửi có kỳ hạn
  interestRate?: number;       // Lãi suất năm (%/năm, ví dụ: 5.5)
  termMonths?: number;         // Kỳ hạn gửi tính theo tháng (ví dụ: 1, 3, 6, 12...)
  maturityDate?: string;       // Ngày đáo hạn (YYYY-MM-DD)
  expectedInterest?: number;   // Tiền lãi dự kiến khi tới kỳ (VND)
}

export interface InvestmentTransaction {
  id: string;
  assetId: string;
  type: TransactionType;
  date: string;               // YYYY-MM-DD
  quantity: number;           // Số lượng khớp
  pricePerUnit: number;       // Giá trên 1 đơn vị
  fees: number;               // Phí giao dịch (vnd/usd)
  tax: number;                // Thuế TNCN (nếu có)
  totalAmount: number;        // Tổng số tiền giao dịch
  notes?: string;

  // Thuộc tính riêng cho Tiết kiệm
  interestRate?: number;       // Lãi suất năm (%/năm)
  termMonths?: number;         // Kỳ hạn gửi (tháng)
  maturityDate?: string;       // Ngày đáo hạn (YYYY-MM-DD)
  expectedInterest?: number;   // Tiền lãi dự kiến khi tới kỳ (VND)
}

export interface DividendRecord {
  id: string;
  assetId: string;
  date: string;               // YYYY-MM-DD
  type: 'cash' | 'stock';     // Tiền mặt hoặc Cổ phiếu
  amountOrQuantity: number;   // Số tiền mặt (VND/USD) hoặc số cổ phiếu nhận thêm
  taxDeducted?: number;       // Thuế bị khấu trừ tại nguồn
  reinvested: boolean;        // Có tự động tái đầu tư không
  notes?: string;
}

// Kết quả tính toán Lãi/Lỗ và Thời gian nắm giữ cho 1 tài sản cụ thể
export interface AssetPnL {
  investedValue: number;          // Tổng giá trị vốn đã mua (avgBuyPrice * quantity)
  currentValue: number;           // Giá trị thị trường hiện tại (currentPrice * quantity)
  unrealizedPnL: number;          // Lãi/Lỗ chưa thực hiện (currentValue - investedValue)
  unrealizedPnLPercent: number;   // % Lãi/Lỗ chưa thực hiện
  realizedPnL: number;            // Lãi/Lỗ đã chốt từ các lệnh Bán trước đó
  totalDividends: number;         // Tổng cổ tức/lợi tức tiền mặt đã nhận
  allTimeNetProfit: number;       // Tổng lãi ròng (unrealizedPnL + realizedPnL + totalDividends)
  holdingDays: number;            // Số ngày nắm giữ tính đến hôm nay
  holdingPeriodLabel: string;     // Định dạng: "X tháng Y ngày" hoặc "X năm Y tháng"
  holdingCategory: HoldingCategory; // Ngắn hạn / Trung hạn / Dài hạn
  yieldOnCost: number;            // Tỷ suất cổ tức trên giá vốn (% / năm)
}

// Kết quả tổng hợp toàn bộ Danh mục đầu tư (Portfolio Summary)
export interface PortfolioSummary {
  totalInvested: number;          // Tổng giá trị vốn đang đầu tư
  currentMarketValue: number;     // Tổng giá trị thị trường của toàn bộ danh mục
  totalUnrealizedPnL: number;     // Tổng lãi/lỗ chưa thực hiện
  unrealizedPnLPercent: number;   // % Lãi/lỗ chưa thực hiện toàn danh mục
  totalRealizedPnL: number;       // Tổng lãi/lỗ đã chốt
  totalDividendsReceived: number; // Tổng cổ tức đã thu về ví
  allTimeNetProfit: number;       // Tổng lợi nhuận ròng toàn bộ thời gian
  roiPercentage: number;          // Tỷ suất sinh lời tổng (% ROI)
  averageHoldingDays: number;     // Thời gian nắm giữ trung bình của danh mục (ngày)
  allocationByClass: {
    assetClass: AssetClass;
    label: string;
    value: number;
    percentage: number;
  }[];
}
