import { User, Asset, Expense, Budget, Task, IoTDevice, GamificationBadge, AppSettings } from '../types';

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

export const initialIoTDevices: IoTDevice[] = [];

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
  language: 'vi'
};
