export type UserRole = 'admin' | 'manager' | 'member' | 'guest';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  points: number;
  badges: string[];
}

export type RoomType = 'all' | 'living_room' | 'kitchen' | 'bedroom' | 'bathroom' | 'balcony' | 'other';

export interface AssetComponent {
  id: string;
  assetId: string;
  name: string;
  installDate: string; // YYYY-MM-DD
  lifespanDays: number; // e.g. 180 days
  currentWearPercent: number; // 100% = brand new, 0% = expired
  replacementCost: number;
  lastReplacedDate?: string;
  notes?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  room: RoomType;
  purchaseDate: string; // YYYY-MM-DD
  purchasePlace: string;
  price: number;
  warrantyExpiryDate: string; // YYYY-MM-DD
  serialNumber?: string;
  status: 'good' | 'warning' | 'needs_service';
  notes?: string;
  imageUrl?: string;
  components: AssetComponent[];
}

export type ExpenseCategory = 
  | 'food' 
  | 'utilities' 
  | 'appliances' 
  | 'maintenance' 
  | 'healthcare' 
  | 'education' 
  | 'entertainment' 
  | 'other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  payerId: string;
  assetId?: string;
  componentId?: string;
  notes?: string;
}

export interface Budget {
  category: ExpenseCategory;
  monthlyLimit: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  dueDate: string;
  status: 'todo' | 'completed';
  assetId?: string;
  componentId?: string;
  xpReward: number;
}

export interface IoTDevice {
  id: string;
  name: string;
  type: 'water_purifier' | 'robot_vacuum' | 'fridge' | 'washing_machine' | 'air_conditioner';
  location: string;
  isOnline: boolean;
  powerUsageKwh: number;
  metrics: {
    label: string;
    value: string | number;
    unit?: string;
    status: 'normal' | 'warning' | 'alert';
  }[];
  lastUpdated: string;
}

export type LanguageCode = 'vi' | 'en' | 'ja';
export type ThemeMode = 'light' | 'dark';

export interface AppSettings {
  notifyDaysBeforeExpiry: number; // 1, 3, 7, 14, 30
  theme: ThemeMode;
  language: LanguageCode;
}

export interface GamificationBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface AIInsight {
  id: string;
  type: 'forecast' | 'warning' | 'tip';
  title: string;
  message: string;
  estimatedSaving?: number;
  actionText?: string;
}
