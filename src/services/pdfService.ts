import { Asset, Expense, User } from '../types';

export function exportHouseholdReport(
  assets: Asset[],
  expenses: Expense[],
  users: User[]
) {
  const totalAssetValue = assets.reduce((sum, a) => sum + a.price, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để xuất báo cáo PDF.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <title>Báo cáo Quản lý Đồ dùng & Chi tiêu Gia đình - FamLife</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 30px;
          color: #1e293b;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          border-bottom: 2px solid #4f46e5;
          padding-bottom: 15px;
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        h1 { color: #4f46e5; margin: 0; font-size: 24px; }
        .meta { color: #64748b; font-size: 14px; }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 25px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 15px;
          border-radius: 8px;
        }
        .stat-val { font-size: 20px; font-weight: bold; color: #0f172a; }
        .stat-label { font-size: 13px; color: #64748b; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          font-size: 13px;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 10px;
          text-align: left;
        }
        th { background: #f1f5f9; font-weight: 600; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge-warning { background: #fef3c7; color: #d97706; }
        .badge-good { background: #dcfce7; color: #15803d; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>FamLife - Báo Cáo Gia Đình</h1>
          <div class="meta">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</div>
        </div>
        <div class="no-print">
          <button onclick="window.print()" style="background:#4f46e5;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;">
            In / Lưu thành PDF
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Tổng giá trị thiết bị</div>
          <div class="stat-val">${totalAssetValue.toLocaleString('vi-VN')} đ</div>
          <div class="stat-label">${assets.length} thiết bị đang quản lý</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tổng chi tiêu ghi nhận</div>
          <div class="stat-val">${totalExpenses.toLocaleString('vi-VN')} đ</div>
          <div class="stat-label">${expenses.length} giao dịch</div>
        </div>
      </div>

      <h2>1. Danh mục Thiết bị & Tình trạng Linh kiện</h2>
      <table>
        <thead>
          <tr>
            <th>Tên thiết bị</th>
            <th>Vị trí</th>
            <th>Giá mua</th>
            <th>Hạn bảo hành</th>
            <th>Linh kiện phụ thuộc</th>
          </tr>
        </thead>
        <tbody>
          ${assets.map(a => `
            <tr>
              <td><strong>${a.name}</strong><br><small>${a.purchasePlace}</small></td>
              <td>${a.room}</td>
              <td>${a.price.toLocaleString('vi-VN')} đ</td>
              <td>${a.warrantyExpiryDate}</td>
              <td>
                ${a.components.map(c => `
                  <div>• ${c.name}: <strong>${c.currentWearPercent}%</strong> (Chi phí: ${c.replacementCost.toLocaleString('vi-VN')} đ)</div>
                `).join('')}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>2. Lịch sử Chi tiêu Gần đây</h2>
      <table>
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Nội dung</th>
            <th>Danh mục</th>
            <th>Người chi</th>
            <th>Số tiền</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.slice(0, 15).map(e => `
            <tr>
              <td>${e.date}</td>
              <td>${e.title}</td>
              <td>${e.category}</td>
              <td>${userMap[e.payerId] || e.payerId}</td>
              <td><strong>${e.amount.toLocaleString('vi-VN')} đ</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
        Được tạo tự động bởi Ứng dụng Quản lý Gia đình Thông minh - FamLife
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
