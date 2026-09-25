# Ứng dụng Quản lý Gia đình Thông minh - FamLife Mobile

Ứng dụng di động hiện đại giúp gia đình quản lý toàn diện **Đồ dùng & Linh kiện**, **Chi tiêu & Ngân sách**, tích hợp **AI thông minh**, **IoT Smart Home**, **Gamification**, **Cộng tác gia đình** và **Cài đặt cá nhân hóa**.

Ứng dụng được xây dựng hoàn thiện dựa trên tài liệu yêu cầu [`project.md`](./project.md).

---

## 🌟 Tính năng Nổi bật

### 1. ⏰ Cài đặt Thông báo Hết hạn (Tùy biến theo yêu cầu)
- Cấu hình số ngày gửi cảnh báo trước khi hết hạn bảo hành hoặc trước khi linh kiện đến hạn thay thế:
  - **1 ngày trước**
  - **3 ngày trước**
  - **1 tuần (7 ngày) trước** *(Khuyên dùng)*
  - **2 tuần (14 ngày) trước**
  - **1 tháng (30 ngày) trước**
- Hệ thống tự động tính toán thời gian thực và hiển thị thẻ cảnh báo đỏ/vàng trên **Dashboard** và **Danh sách thiết bị** theo đúng mốc ngày đã chọn.

### 2. 🌓 Giao diện Sáng / Tối (Dark / Light Theme)
- Chuyển đổi giao diện Sáng (Light Mode) và Tối (Dark Mode) tức thì bằng nút trên thanh Header hoặc trong tab Cài đặt.
- Tự động lưu cấu hình vào bộ nhớ máy (`localStorage`).

### 3. 🌐 Đa ngôn ngữ (i18n)
- Hỗ trợ 3 ngôn ngữ:
  - 🇻🇳 **Tiếng Việt** *(Mặc định)*
  - 🇬🇧 **English**
  - 🇯🇵 **日本語**
- Tự động dịch toàn bộ nhãn điều hướng, danh mục, trạng thái và thông báo.

### 4. 📺 Quản lý Đồ dùng & Linh kiện Phụ thuộc (Components)
- Lưu trữ đầy đủ: ngày mua, nơi mua, giá tiền, số serial, thời hạn bảo hành.
- **Quản lý linh kiện riêng biệt** (Ví dụ: Máy lọc nước có *Lõi số 1 PP, Lõi than OCB, Màng RO*; Robot hút bụi có *Màng HEPA, Chổi ven, Giẻ lau*).
- Hiển thị thanh tiến trình **% độ hao mòn** trực quan.
- Nút **"Đã thay mới"**: Tự động đưa tuổi thọ linh kiện về 100%, tự động tạo 1 khoản chi tiêu bảo trì tương ứng và cộng điểm thưởng XP cho người thực hiện.
- Hỗ trợ **Quét mã QR / Hóa đơn điện tử** để điền thông tin nhanh chóng.

### 5. 💰 Quản lý Chi tiêu & Ngân sách
- Sổ thu chi thông minh, phân loại theo nhóm: Ăn uống, Điện nước, Thiết bị, Bảo trì, Y tế, Giáo dục, Giải trí...
- **Liên kết chi phí với thiết bị**: Theo dõi chính xác chi phí sửa chữa, thay linh kiện cho từng đồ dùng trong nhà.
- Hạn mức ngân sách tháng với thanh tiến độ và cảnh báo vượt mức.
- Biểu đồ cột phân bổ chi tiêu trực quan.

### 6. 🎙️ Nhập liệu bằng Giọng nói (Web Speech API)
- Tích hợp micro nhận diện giọng nói: Người dùng có thể nói *"Ăn phở 45 nghìn"* hoặc *"Thay lõi lọc nước 110k"*, hệ thống tự động bóc tách số tiền, tên khoản chi và danh mục để điền form tự động.
- Cung cấp sẵn các câu lệnh mẫu để thử nghiệm nhanh ngay cả khi không có microphone.

### 7. 🤖 Trợ lý AI Gia đình
- Phân tích bất thường trong chi tiêu sinh hoạt.
- **Dự báo chi phí bảo trì**: Dự tính số tiền gia đình cần chuẩn bị để thay thế các linh kiện sắp hết hạn.
- Gợi ý tiết kiệm thông minh về điện năng và sinh hoạt.

### 8. 📡 Tích hợp Nhà thông minh (IoT Telemetry)
- Giám sát thời gian thực các thiết bị: Máy lọc nước Karofi (chỉ số tinh khiết TDS ppm, lưu lượng lít), Robot hút bụi Ecovacs (pin %, độ bẩn màng lọc), Tủ lạnh Samsung, Điều hòa Daikin.
- Đo lường điện năng tiêu thụ (kWh) trong ngày.

### 9. 👨‍👩‍👧‍👦 Cộng tác Gia đình & Phân quyền
- Chuyển đổi linh hoạt giữa 4 vai trò:
  - **Bố (Admin)**: Toàn quyền quản trị.
  - **Mẹ (Quản lý)**: Quản lý đồ dùng, chi tiêu, giao việc.
  - **Con (Thành viên cơ bản)**: Nhập chi tiêu, nhận nhiệm vụ làm việc nhà, nhận XP.
  - **Khách**: Xem tổng quan chỉ đọc.
- Giao việc bảo trì thiết bị cho từng thành viên kèm hạn chót và điểm thưởng XP.

### 10. 🎮 Gamification & Bảng Vinh danh
- Bảng xếp hạng gia đình (Leaderboard) theo tuần/tháng dựa trên điểm thưởng XP.
- Bộ sưu tập Huy hiệu thành tích: *Cư dân thông thái, Bậc thầy bảo trì, Thần đồng tiết kiệm, Đại sứ xanh...*
- Thử thách hàng tuần.

### 11. 📄 Xuất Báo cáo PDF
- Xuất toàn bộ tài sản thiết bị, tình trạng linh kiện và lịch sử chi tiêu gia đình ra tài liệu báo cáo chuyên nghiệp để in ấn hoặc lưu trữ.

---

## 🚀 Hướng dẫn Chạy Ứng dụng

### 1. Khởi chạy Server Phát triển
Tại thư mục dự án, chạy lệnh:
```bash
npm run dev
```
Sau đó mở trình duyệt tại địa chỉ hiển thị trên màn hình (mặc định: `http://localhost:3000`).

### 2. Đóng gói Bản Production
```bash
npm run build
npm run preview
```

### 3. Trải nghiệm trên Điện thoại Thật (Mobile Device)
- Mở trình duyệt trên điện thoại (Safari hoặc Chrome) và truy cập vào địa chỉ IP nội bộ của máy tính (ví dụ: `http://192.168.1.x:3000`).
- Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)** để cài đặt ứng dụng chạy full màn hình như ứng dụng Native.
- Trên máy tính, ứng dụng có nút chuyển đổi giữa **"Khung Điện thoại" (Phone View)** và **"Toàn màn hình" (Full Responsive)** để kiểm thử thuận tiện.
