/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Màu thương hiệu/Chủ đạo: #0284C7 (Sky 600) - Chuẩn FinTech Clean tạo sự tin cậy
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284C7', // Sky 600 - Main Brand
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
          DEFAULT: '#0284C7',
        },
        // FinTech Clean Design Tokens
        fintech: {
          bg: '#F8FAFC',        // Nền ứng dụng chính: Slate 50
          card: '#FFFFFF',      // Nền các thẻ (Cards/Surfaces)
          title: '#0F172A',     // Tiêu đề & Số tiền lớn: Slate 900
          category: '#475569',  // Danh mục & Ngày tháng: Slate 600
          muted: '#94A3B8',     // Văn bản phụ/Muted: Slate 400
          brand: '#0284C7',     // Sky 600
          income: '#16A34A',    // Green 600
          expense: '#DC2626',   // Red 600
          border: '#E2E8F0',    // Đường viền tối giản: Slate 200
        },
        // Khoản thu (Income)
        income: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16A34A', // Green 600
          700: '#15803d',
          DEFAULT: '#16A34A',
        },
        // Khoản chi (Expense)
        expense: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#DC2626', // Red 600
          700: '#b91c1c',
          DEFAULT: '#DC2626',
        },
        slate: {
          750: '#253248',
          850: '#162032',
        },
      },
      borderRadius: {
        'card': '1rem', // 1rem (rounded-2xl) dành cho các thẻ nội dung
      },
      screens: {
        'xs': '400px',
      }
    },
  },
  plugins: [],
}
