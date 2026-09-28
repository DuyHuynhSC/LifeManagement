import { User, Asset, Expense, Budget, Task, IoTDevice, GamificationBadge, AppSettings, CategoryItem } from '../types';

export const initialUsers: User[] = [
  {
    id: 'user-admin',
    name: 'Bố (Admin)',
    role: 'admin',
    avatar: '👨‍💼',
    points: 0,
    badges: []
  }
];

export const initialCategories: CategoryItem[] = [
  { id: 'food', name: 'Ăn uống', icon: '🍔', color: '#10b981', isSystem: true },
  { id: 'utilities', name: 'Điện nước & Net', icon: '💡', color: '#3b82f6', isSystem: true },
  { id: 'appliances', name: 'Mua thiết bị', icon: '📺', color: '#8b5cf6', isSystem: true },
  { id: 'maintenance', name: 'Bảo trì linh kiện', icon: '🔧', color: '#f59e0b', isSystem: true },
  { id: 'healthcare', name: 'Y tế & Thuốc men', icon: '💊', color: '#ef4444', isSystem: true },
  { id: 'education', name: 'Học tập & Giáo dục', icon: '📚', color: '#ec4899', isSystem: true },
  { id: 'entertainment', name: 'Giải trí', icon: '🎬', color: '#06b6d4', isSystem: true },
  { id: 'other', name: 'Chi tiêu khác', icon: '📦', color: '#64748b', isSystem: true },
];

export const initialAssets: Asset[] = [];

export const initialExpenses: Expense[] = [];

export const initialBudgets: Budget[] = [
  { category: 'food', monthlyLimit: 0 },
  { category: 'utilities', monthlyLimit: 0 },
  { category: 'maintenance', monthlyLimit: 0 },
  { category: 'education', monthlyLimit: 0 },
  { category: 'healthcare', monthlyLimit: 0 },
  { category: 'entertainment', monthlyLimit: 0 },
  { category: 'appliances', monthlyLimit: 0 },
  { category: 'other', monthlyLimit: 0 },
];

export const initialTasks: Task[] = [];

export const initialIoTDevices: IoTDevice[] = [
  {
    id: 'iot-purifier-1',
    name: 'Máy lọc nước Karofi Smart Hydrogen',
    type: 'water_purifier',
    location: 'Bếp tầng 1',
    provider: 'tuya',
    isOnline: true,
    powerUsageKwh: 0.28,
    powerUsageKwhToday: 0.28,
    powerUsageKwhMonth: 8.4,
    currentWattage: 35,
    lastUpdated: 'Vừa xong',
    metrics: [
      { label: 'TDS đầu ra (uống)', value: 14, unit: 'ppm', status: 'normal' },
      { label: 'TDS nước cấp vào', value: 185, unit: 'ppm', status: 'normal' },
      { label: 'Tuổi thọ Lõi 1', value: 82, unit: '%', status: 'normal' },
      { label: 'Tuổi thọ Lõi RO', value: 94, unit: '%', status: 'normal' }
    ],
    waterPurifier: {
      tdsInPpm: 185,
      tdsOutPpm: 14,
      filter1LifePercent: 82,
      filterRoLifePercent: 94,
      filterMineralPercent: 90,
      isLeaking: false,
      litersToday: 9.2
    },
    alerts: []
  },
  {
    id: 'iot-fridge-1',
    name: 'Tủ lạnh Samsung Inverter Family',
    type: 'fridge',
    location: 'Phòng ăn tầng 1',
    provider: 'smartthings',
    isOnline: true,
    powerUsageKwh: 1.42,
    powerUsageKwhToday: 1.42,
    powerUsageKwhMonth: 42.6,
    currentWattage: 95,
    lastUpdated: '1 phút trước',
    metrics: [
      { label: 'Nhiệt độ ngăn mát', value: 3, unit: '°C', status: 'normal' },
      { label: 'Nhiệt độ ngăn đông', value: -18, unit: '°C', status: 'normal' },
      { label: 'Cửa tủ lạnh', value: 'Đóng kín', status: 'normal' },
      { label: 'Chế độ', value: 'Eco Tiết kiệm', status: 'normal' }
    ],
    fridge: {
      fridgeTemp: 3,
      freezerTemp: -18,
      doorAjar: false,
      fastFreezing: false,
      ecoMode: true
    },
    alerts: []
  },
  {
    id: 'iot-washer-1',
    name: 'Máy giặt LG AI DD Inverter 10kg',
    type: 'washing_machine',
    location: 'Ban công tầng 2',
    provider: 'lg_thinq',
    isOnline: true,
    powerUsageKwh: 0.68,
    powerUsageKwhToday: 0.68,
    powerUsageKwhMonth: 19.5,
    currentWattage: 380,
    lastUpdated: 'Vừa xong',
    metrics: [
      { label: 'Trạng thái', value: 'Đang giặt (Cotton)', status: 'normal' },
      { label: 'Thời gian còn lại', value: 24, unit: 'phút', status: 'normal' },
      { label: 'Cửa máy giặt', value: 'Khóa an toàn', status: 'normal' },
      { label: 'Vệ sinh lồng giặt', value: 'Tốt (14/30 lần)', status: 'normal' }
    ],
    washingMachine: {
      state: 'washing',
      remainingMinutes: 24,
      programName: 'Cotton Chăm sóc dịu nhẹ',
      doorLocked: true,
      drumCleanCycleCount: 14
    },
    alerts: [
      {
        id: 'alert-wash-1',
        level: 'info',
        message: 'Chu trình giặt Cotton đang chạy, dự kiến hoàn thành sau 24 phút.',
        timestamp: 'Vừa xong',
        actionRequired: 'Chuẩn bị phơi đồ khi hoàn tất'
      }
    ]
  }
];

export const initialBadges: GamificationBadge[] = [
  {
    id: 'b1',
    title: 'Cư dân thông thái',
    description: 'Gia nhập hệ thống quản lý gia đình FamLife',
    icon: '🏡',
    unlocked: false
  },
  {
    id: 'b2',
    title: 'Bậc thầy bảo trì',
    description: 'Thay mới 5 linh kiện thiết bị đúng hạn',
    icon: '🛠️',
    unlocked: false
  },
  {
    id: 'b3',
    title: 'Thần đồng tiết kiệm',
    description: 'Duy trì chi tiêu tháng dưới hạn mức ngân sách 2 tháng liên tiếp',
    icon: '💰',
    unlocked: false
  },
  {
    id: 'b4',
    title: 'Đại sứ xanh (Eco)',
    description: 'Tiết kiệm 15% điện năng tiêu thụ nhờ tự động hóa IoT',
    icon: '🌱',
    unlocked: false
  },
  {
    id: 'b5',
    title: 'Chiến thần ghi chép',
    description: 'Ghi chép chi tiêu đầy đủ trong 14 ngày liên tục',
    icon: '📝',
    unlocked: false
  },
  {
    id: 'b6',
    title: 'Ngôi sao việc nhà',
    description: 'Hoàn thành 10 nhiệm vụ chăm sóc thiết bị gia đình',
    icon: '⭐',
    unlocked: false
  }
];

export const initialSettings: AppSettings = {
  notifyDaysBeforeExpiry: 7, // Mặc định 1 tuần (7 ngày)
  theme: 'light',
  language: 'vi',
  electricityPricePerKwh: 2500
};
