# Kế hoạch phát triển: Phân hệ Quản lý & Theo dõi Đầu tư (Investment Portfolio)

> **Mục tiêu:** Mở rộng ứng dụng FamLife để quản lý toàn diện danh mục đầu tư cá nhân & gia đình (Cổ phiếu, Crypto, Vàng, Tiền gửi, Quỹ đầu tư...), tính toán chuẩn xác Lãi/Lỗ (P&L), theo dõi Thời gian nắm giữ (Holding Period) và quản lý dòng tiền Cổ tức (Dividends/Yield).

---

## 1. Phân tích Yêu cầu & Nghiệp vụ (Requirements & Business Logic)

### 1.1. Lưu trữ Danh mục Đầu tư (Portfolio Management)
- **Hỗ trợ đa dạng loại tài sản (`AssetClass`):**
  - **Cổ phiếu (Stocks):** Mã CK (Ticker), Sàn (HOSE, HNX, UPCoM, US...), Số lượng, Giá mua trung bình, Giá hiện tại.
  - **Tiền mã hóa (Crypto):** Ticker (BTC, ETH, SOL...), Chuỗi/Ví lưu trữ (Binance, Metamask, Ví lạnh...).
  - **Kim loại quý & Tài sản an toàn:** Vàng (SJC, Nhẫn 9999...), Bạc.
  - **Tiết kiệm & Trái phiếu (Fixed Income):** Tiền gửi ngân hàng có kỳ hạn, Trái phiếu doanh nghiệp/chính phủ.
  - **Chứng chỉ quỹ (ETF / Mutual Funds):** Quỹ mở (VFM, Dragon Capital...), ETF (E1VFVN30, FUEVFVND...).
- **Quản lý vị thế & giao dịch:**
  - Sổ lệnh giao dịch (Transactions): Mua (Buy), Bán (Sell), Nạp/Chuyển vốn (Deposit/Transfer), Thuế & Phí giao dịch (Fees & Taxes).
  - Tự động cập nhật giá vốn trung bình (DCA - Weighted Average Cost) sau mỗi lần mua thêm.

---

### 1.2. Tính toán Lãi / Lỗ (P&L & ROI Calculation)
- **Lãi / Lỗ chưa thực hiện (Unrealized P&L):**
  $$\text{Unrealized P\&L} = (\text{Current Price} - \text{Avg Buy Price}) \times \text{Holding Quantity}$$
  $$\text{ROI \%} = \frac{\text{Current Value} - \text{Total Cost}}{\text{Total Cost}} \times 100\%$$
- **Lãi / Lỗ đã chốt (Realized P&L):**
  - Tính toán khi phát sinh lệnh Bán (Sell).
  - Lãi thực tế = $(\text{Sell Price} - \text{Avg Buy Price}) \times \text{Sell Quantity} - \text{Phí \& Thuế}$.
- **Tổng tài sản & Hiệu suất danh mục (Portfolio Performance):**
  - Tổng giá trị thị trường (Total Market Value).
  - Tổng vốn đầu tư ban đầu (Total Capital Invested).
  - Tổng lãi ròng (All-time Net Profit = Realized P&L + Unrealized P&L + Total Dividends).

---

### 1.3. Thời gian Nắm giữ (Holding Period)
- **Thời gian nắm giữ vị thế hiện tại:**
  - Tính từ ngày giao dịch đầu tiên (First Buy Date) hoặc theo từng lô (Lot-based FIFO).
  - Hiển thị trực quan: `X năm Y tháng Z ngày` hoặc số ngày tích lũy.
- **Phân loại chiến lược đầu tư:**
  - **Lướt sóng / Ngắn hạn (Short-term):** $< 3$ tháng.
  - **Trung hạn (Medium-term):** $3 - 12$ tháng.
  - **Dài hạn (Long-term / Value investing):** $> 1$ năm.
- **Thời gian nắm giữ trung bình (Average Holding Days):** Giúp nhà đầu tư đo lường kỷ luật kiên nhẫn và tốc độ quay vòng vốn (Portfolio Turnover).

---

### 1.4. Quản lý Cổ tức & Dòng tiền Thụ động (Dividends & Passive Income)
- **Hình thức cổ tức:**
  - **Cổ tức tiền mặt (Cash Dividend):** Ghi nhận dòng tiền thực tế về tài khoản.
  - **Cổ tức cổ phiếu / Thưởng cổ phiếu (Stock Dividend / Bonus Shares):** Tăng số lượng cổ phiếu sở hữu, tự động điều chỉnh giảm giá vốn trung bình (Price Dilution adjustment).
  - **Lợi tức Staking / Yield (Crypto):** Ghi nhận phần thưởng định kỳ.
  - **Lãi suất tiền gửi / Coupon trái phiếu (Interest):** Trả định kỳ hàng tháng/quý/năm.
- **Chỉ số tài chính liên quan đến cổ tức:**
  - **Tỷ suất cổ tức trên giá vốn (Yield on Cost - YoC):** $\frac{\text{Annual Dividend per Share}}{\text{Avg Buy Price}} \times 100\%$
  - **Tỷ suất cổ tức trên giá thị trường (Current Dividend Yield):** $\frac{\text{Annual Dividend per Share}}{\text{Current Market Price}} \times 100\%$
- **Lịch theo dõi & Thống kê:**
  - Lịch dự kiến ngày giao dịch không hưởng quyền (Ex-dividend date) & ngày tiền về.
  - Biểu đồ dòng tiền cổ tức theo từng tháng/năm.

---

## 2. Kiến trúc Dữ liệu & Mô hình TypeScript

### File: `src/types/investment.ts`
```typescript
export type AssetClass = 'stock' | 'crypto' | 'gold' | 'savings' | 'fund' | 'real_estate' | 'other';

export type TransactionType = 'buy' | 'sell' | 'dividend_cash' | 'dividend_stock' | 'interest';

export interface InvestmentAsset {
  id: string;
  symbol: string;              // VNM, HPG, BTC, ETH, SJC...
  name: string;                // Tên đầy đủ
  assetClass: AssetClass;      // Loại tài sản
  quantity: number;            // Số lượng đang nắm giữ
  avgBuyPrice: number;         // Giá vốn trung bình
  currentPrice: number;        // Giá thị trường cập nhật
  currency: 'VND' | 'USD';
  firstBuyDate: string;        // Ngày mua đầu tiên (YYYY-MM-DD)
  notes?: string;
  targetPrice?: number;        // Giá mục tiêu chốt lời
  stopLossPrice?: number;      // Giá cắt lỗ
}

export interface InvestmentTransaction {
  id: string;
  assetId: string;
  type: TransactionType;
  date: string;                // YYYY-MM-DD
  quantity: number;
  pricePerUnit: number;
  fees: number;
  tax: number;
  totalAmount: number;         // (quantity * pricePerUnit) +/- fees +/- tax
  notes?: string;
}

export interface DividendRecord {
  id: string;
  assetId: string;
  date: string;
  type: 'cash' | 'stock';
  amountOrQuantity: number;    // Số tiền mặt nhận được hoặc số CP nhận thêm
  taxDeducted?: number;        // Thuế TNCN (ví dụ 5% cổ tức)
  reinvested: boolean;         // Có tái đầu tư mua lại không
  notes?: string;
}

export interface PortfolioSummary {
  totalInvested: number;       // Tổng vốn đã giải ngân
  currentMarketValue: number;  // Tổng giá trị danh mục thời điểm hiện tại
  totalUnrealizedPnL: number;  // Tổng lãi/lỗ chưa chốt
  totalRealizedPnL: number;    // Tổng lãi/lỗ đã chốt
  totalDividendsReceived: number; // Tổng cổ tức đã thu
  allTimeNetProfit: number;    // Lợi nhuận ròng toàn bộ thời gian
  roiPercentage: number;       // % ROI tổng danh mục
}
```

---

## 3. Thiết kế Giao diện Người dùng (UI / UX Mobile-first)

Tuân thủ quy chuẩn thiết kế `mobile-ui-contrast-layout-audit`:
1. **Màn hình Tổng quan Danh mục (Portfolio Dashboard):**
   - **Thẻ Card Tài sản Ròng (Net Worth Hero Card):** Hiển thị tổng giá trị danh mục, Lãi/Lỗ ròng (Xanh lá nếu Lời, Đỏ/Hồng nếu Lỗ), ROI (%).
   - **Bộ lọc & Phân bổ (Asset Allocation Pie Chart):** Biểu đồ tròn hiển thị tỷ trọng (% Cổ phiếu, % Crypto, % Tiết kiệm, % Vàng) sử dụng Recharts.
   - **Thanh chuyển tab con:** `Tất cả` | `Cổ phiếu` | `Crypto` | `Tiết kiệm` | `Cổ tức & Dòng tiền`.
2. **Danh sách Vị thế Nắm giữ (Asset Holding Card):**
   - Ticker + Logo/Icon phân loại.
   - Số lượng nắm giữ + Giá vốn trung bình.
   - Giá hiện tại + % Lãi/lỗ hiện thời.
   - Huy hiệu thời gian nắm giữ: `🕒 245 ngày (Dài hạn)`.
3. **Màn hình Chi tiết Mã Đầu tư (Asset Detail & P&L Analysis):**
   - Bảng phân tích chi tiết: Vốn ban đầu, Giá trị hiện tại, Lãi/lỗ chưa chốt, Lãi/lỗ đã chốt từ các đợt bán trước.
   - Timeline lịch sử giao dịch: Lệnh Mua (Xanh dương), Lệnh Bán (Cam), Nhận cổ tức (Xanh lá).
   - Nhật ký cổ tức nhận được từ mã này.
4. **Màn hình Quản lý & Dự phóng Cổ tức (Dividend Tracker & Forecast):**
   - Biểu đồ Bar Chart: Dòng tiền cổ tức theo từng tháng trong năm.
   - Tổng thu nhập thụ động trung bình mỗi tháng.
   - Tỷ suất cổ tức (Dividend Yield on Cost).
5. **Modal Nhập Giao dịch (Add Transaction Modal):**
   - Chọn loại: Mua, Bán, Nhận cổ tức.
   - Tự động gợi ý mã có sẵn trong danh mục hoặc thêm mã mới.
   - Tự tính phí giao dịch và thuế ước tính.

---

## 4. Kế hoạch Triển khai Chi tiết (Phased Implementation Roadmap)

### Giai đoạn 1: Khung Dữ liệu & Tính toán Lõi (Core Engine & Store)
- [ ] Tạo file model `src/types/investment.ts`.
- [ ] Xây dựng bộ tiện ích tính toán tài chính `src/services/investmentCalculator.ts`:
  - Hàm tính Giá vốn trung bình (Weighted Average Cost / DCA).
  - Hàm tính Unrealized P&L & Realized P&L.
  - Hàm tính số ngày nắm giữ (Holding Days, Holding Format string).
  - Hàm tính Dividend Yield & Thống kê dòng tiền theo tháng.
- [ ] Mở rộng State Management trong `src/store/useInvestmentStore.ts` (hoặc `useAppStore.ts`):
  - State: `assets`, `transactions`, `dividends`.
  - Actions: `addInvestmentAsset`, `updateCurrentPrice`, `recordTransaction`, `recordDividend`, `deleteTransaction`.
  - Đồng bộ lưu trữ LocalStorage / IndexedDB an toàn.

### Giai đoạn 2: UI Danh mục & Tính toán Lãi/Lỗ
- [ ] Xây dựng Component Thẻ Tổng quan `InvestmentHeroCard.tsx` (Tổng vốn, Giá trị hiện tại, P&L, ROI).
- [ ] Xây dựng Biểu đồ phân bổ tỷ trọng `AssetAllocationChart.tsx` (Recharts Pie/Donut).
- [ ] Xây dựng Danh sách tài sản `InvestmentAssetList.tsx` hiển thị giá vốn, giá hiện tại, Lãi/Lỗ (+/-) và số ngày nắm giữ.
- [ ] Xây dựng Modal Thêm/Sửa Tài sản & Cập nhật giá thị trường nhanh `UpdatePriceModal.tsx`.

### Giai đoạn 3: Quản lý Giao dịch & Thời gian Nắm giữ
- [ ] Xây dựng Modal Nhập Giao dịch Mua/Bán `AddTransactionModal.tsx`.
- [ ] Logic tự động cập nhật số lượng và tính Realized P&L khi Bán một phần hoặc Bán hết.
- [ ] Hiển thị chi tiết thời gian nắm giữ: phân tích theo từng đợt mua, badge phân loại ngắn hạn/dài hạn.
- [ ] Màn hình chi tiết tài sản `InvestmentDetailModal.tsx`.

### Giai đoạn 4: Quản lý Cổ tức & Dòng tiền Thụ động
- [ ] Xây dựng Modal Ghi nhận Cổ tức `AddDividendModal.tsx` (Cổ tức tiền mặt, Cổ tức cổ phiếu).
- [ ] Xây dựng Tab / Khối `DividendOverviewCard.tsx`: Thống kê tổng tiền cổ tức theo năm, tháng.
- [ ] Biểu đồ Bar Chart doanh thu cổ tức 12 tháng qua.
- [ ] Bổ sung dịch ngôn ngữ i18n (`vi`, `en`, `ja`) cho tất cả các thuật ngữ đầu tư.

### Giai đoạn 5: Tích hợp Hệ thống FamLife & Kiểm thử
- [ ] Tích hợp Tab Đầu tư vào `BottomNav.tsx` (trong Menu "Thêm" hoặc Tab chính).
- [ ] Kiểm thử tích hợp P&L với các ca thử nghiệm phức tạp (mua nhiều lần giá khác nhau, bán một phần, nhận cổ tức cổ phiếu làm loãng giá vốn).
- [ ] Kiểm tra độ tương phản Dark Theme / Light Theme theo chuẩn `mobile-ui-contrast-layout-audit`.
