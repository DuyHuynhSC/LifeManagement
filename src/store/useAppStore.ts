import { useState, useEffect } from 'react';
import { 
  User, Asset, AssetComponent, Expense, Budget, Task, 
  IoTDevice, GamificationBadge, AppSettings, LanguageCode, ThemeMode,
  CategoryItem
} from '../types';
import { 
  initialUsers, initialAssets, initialExpenses, 
  initialBudgets, initialCategories, initialTasks, initialIoTDevices, 
  initialBadges, initialSettings 
} from '../data/initialData';
import { restoreInvestmentState } from './useInvestmentStore';
import { SimulationService, LGThinQService } from '../services/iot';

const STORAGE_KEY = 'famlife_app_data_v2';

interface AppStoreState {
  users: User[];
  currentUserId: string;
  assets: Asset[];
  expenses: Expense[];
  budgets: Budget[];
  categories: CategoryItem[];
  tasks: Task[];
  iotDevices: IoTDevice[];
  badges: GamificationBadge[];
  settings: AppSettings;
}

function getStoredState(): AppStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users?.length ? parsed.users : initialUsers,
        currentUserId: parsed.currentUserId || 'user-admin',
        assets: parsed.assets || initialAssets,
        expenses: parsed.expenses || initialExpenses,
        budgets: parsed.budgets || initialBudgets,
        categories: (parsed.categories && parsed.categories.length > 0) ? parsed.categories : initialCategories,
        tasks: parsed.tasks || initialTasks,
        iotDevices: (parsed.iotDevices && parsed.iotDevices.length > 0) ? parsed.iotDevices : initialIoTDevices,
        badges: parsed.badges || initialBadges,
        settings: {
          ...initialSettings,
          ...(parsed.settings || {})
        }
      };
    }
  } catch (err) {
    console.error('Failed to parse stored state, using defaults', err);
  }
  return {
    users: initialUsers,
    currentUserId: 'user-admin',
    assets: initialAssets,
    expenses: initialExpenses,
    budgets: initialBudgets,
    categories: initialCategories,
    tasks: initialTasks,
    iotDevices: initialIoTDevices,
    badges: initialBadges,
    settings: initialSettings
  };
}

let globalState = getStoredState();
const listeners = new Set<() => void>();

function notify() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(globalState));
  listeners.forEach(fn => fn());
}

export const useAppStore = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const currentUser = globalState.users.find(u => u.id === globalState.currentUserId) || globalState.users[0];

  // Actions
  const setCurrentUser = (userId: string) => {
    globalState.currentUserId = userId;
    notify();
  };

  const addAsset = (asset: Omit<Asset, 'id'>) => {
    const newAsset: Asset = {
      ...asset,
      id: `asset-${Date.now()}`
    };
    globalState.assets = [newAsset, ...globalState.assets];
    
    // Reward XP
    awardUserPoints(globalState.currentUserId, 20);
    notify();
    return newAsset;
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    globalState.assets = globalState.assets.map(a => a.id === id ? { ...a, ...updates } : a);
    notify();
  };

  const deleteAsset = (id: string) => {
    globalState.assets = globalState.assets.filter(a => a.id !== id);
    notify();
  };

  const addComponentToAsset = (assetId: string, comp: Omit<AssetComponent, 'id' | 'assetId'>) => {
    const newComp: AssetComponent = {
      ...comp,
      id: `comp-${Date.now()}`,
      assetId
    };
    globalState.assets = globalState.assets.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          components: [...a.components, newComp]
        };
      }
      return a;
    });
    notify();
  };

  const replaceComponent = (assetId: string, componentId: string) => {
    let replacedName = '';
    let cost = 0;

    globalState.assets = globalState.assets.map(a => {
      if (a.id === assetId) {
        const updatedComps = a.components.map(c => {
          if (c.id === componentId) {
            replacedName = c.name;
            cost = c.replacementCost;
            return {
              ...c,
              currentWearPercent: 100, // Reset to 100% brand new
              lastReplacedDate: new Date().toISOString().split('T')[0],
              installDate: new Date().toISOString().split('T')[0]
            };
          }
          return c;
        });
        return { ...a, components: updatedComps };
      }
      return a;
    });

    // Automatically create a maintenance expense
    if (cost > 0) {
      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        title: `Thay mới ${replacedName}`,
        amount: cost,
        category: 'maintenance',
        date: new Date().toISOString().split('T')[0],
        payerId: globalState.currentUserId,
        assetId,
        componentId,
        notes: 'Ghi nhận tự động từ tính năng bảo trì linh kiện'
      };
      globalState.expenses = [newExpense, ...globalState.expenses];
    }

    // Award 40 XP for maintenance
    awardUserPoints(globalState.currentUserId, 40);
    notify();
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expense,
      id: `exp-${Date.now()}`
    };
    globalState.expenses = [newExp, ...globalState.expenses];
    awardUserPoints(globalState.currentUserId, 10);
    notify();
    return newExp;
  };

  const updateExpense = (id: string, updated: Partial<Omit<Expense, 'id'>>) => {
    globalState.expenses = globalState.expenses.map(e => 
      e.id === id ? { ...e, ...updated } : e
    );
    notify();
  };

  const deleteExpense = (id: string) => {
    globalState.expenses = globalState.expenses.filter(e => e.id !== id);
    notify();
  };

  const updateBudget = (category: string, monthlyLimit: number) => {
    globalState.budgets = globalState.budgets.map(b => 
      b.category === category ? { ...b, monthlyLimit } : b
    );
    notify();
  };

  const addCategory = (categoryData: Omit<CategoryItem, 'id'>) => {
    const id = `cat-${Date.now()}`;
    const newCategory: CategoryItem = {
      ...categoryData,
      id,
      name: categoryData.name.trim(),
      icon: categoryData.icon || '🏷️',
      color: categoryData.color || '#10b981'
    };
    globalState.categories = [...globalState.categories, newCategory];
    // Create budget slot if not existing
    if (!globalState.budgets.some(b => b.category === id)) {
      globalState.budgets = [...globalState.budgets, { category: id, monthlyLimit: 0 }];
    }
    notify();
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Omit<CategoryItem, 'id'>>) => {
    globalState.categories = globalState.categories.map(c => 
      c.id === id 
        ? { 
            ...c, 
            ...updates, 
            name: updates.name !== undefined ? updates.name.trim() : c.name 
          } 
        : c
    );
    notify();
  };

  const deleteCategory = (id: string, fallbackCategoryId?: string) => {
    if (globalState.categories.length <= 1) {
      return { success: false, message: 'Phải giữ lại ít nhất một danh mục chi tiêu!' };
    }
    const remaining = globalState.categories.filter(c => c.id !== id);
    const targetFallback = fallbackCategoryId && remaining.some(c => c.id === fallbackCategoryId)
      ? fallbackCategoryId
      : (remaining.find(c => c.id === 'other')?.id || remaining[0].id);

    // Update any expenses using this category to fallback
    globalState.expenses = globalState.expenses.map(e => 
      e.category === id ? { ...e, category: targetFallback } : e
    );

    // Remove budget for this category
    globalState.budgets = globalState.budgets.filter(b => b.category !== id);

    globalState.categories = remaining;
    notify();
    return { success: true };
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`
    };
    globalState.tasks = [newTask, ...globalState.tasks];
    notify();
    return newTask;
  };

  const completeTask = (taskId: string) => {
    const task = globalState.tasks.find(t => t.id === taskId);
    if (!task || task.status === 'completed') return;

    globalState.tasks = globalState.tasks.map(t => 
      t.id === taskId ? { ...t, status: 'completed' as const } : t
    );

    awardUserPoints(task.assignedToId || globalState.currentUserId, task.xpReward || 30);
    notify();
  };

  const awardUserPoints = (userId: string, pts: number) => {
    globalState.users = globalState.users.map(u => 
      u.id === userId ? { ...u, points: u.points + pts } : u
    );
  };

  // User Management Actions (Admin)
  const addUser = (user: Omit<User, 'id' | 'points' | 'badges'>) => {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      points: 0,
      badges: []
    };
    globalState.users = [...globalState.users, newUser];
    notify();
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    globalState.users = globalState.users.map(u => 
      u.id === id ? { ...u, ...updates } : u
    );
    notify();
  };

  const deleteUser = (id: string) => {
    if (globalState.users.length <= 1) {
      return { success: false, message: 'Phải giữ lại ít nhất một người dùng trong gia đình!' };
    }
    if (id === globalState.currentUserId) {
      return { success: false, message: 'Không thể xóa người dùng đang đăng nhập!' };
    }
    const targetUser = globalState.users.find(u => u.id === id);
    if (targetUser?.role === 'admin') {
      const adminCount = globalState.users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, message: 'Không thể xóa Quản trị viên duy nhất của hệ thống!' };
      }
    }
    globalState.users = globalState.users.filter(u => u.id !== id);
    notify();
    return { success: true };
  };

  // IoT Actions
  const addIoTDevice = (deviceData: Omit<IoTDevice, 'id'>) => {
    const newDevice: IoTDevice = {
      ...deviceData,
      id: `iot-${Date.now()}`
    };
    globalState.iotDevices = [newDevice, ...globalState.iotDevices];
    awardUserPoints(globalState.currentUserId, 15);
    notify();
    return newDevice;
  };

  const updateIoTDevice = (id: string, updates: Partial<IoTDevice>) => {
    globalState.iotDevices = globalState.iotDevices.map(d => 
      d.id === id ? { ...d, ...updates } : d
    );
    notify();
  };

  const deleteIoTDevice = (id: string) => {
    globalState.iotDevices = globalState.iotDevices.filter(d => d.id !== id);
    notify();
  };

  const toggleIoTDeviceOnline = (id: string) => {
    globalState.iotDevices = globalState.iotDevices.map(d => 
      d.id === id ? { ...d, isOnline: !d.isOnline } : d
    );
    notify();
  };

  const setIoTDevices = (devices: IoTDevice[]) => {
    globalState.iotDevices = devices;
    notify();
  };

  const syncIoTTelemetry = () => {
    const { updatedDevices, newAlerts } = SimulationService.simulateTelemetryStep(globalState.iotDevices);
    globalState.iotDevices = updatedDevices;

    // Tự động kiểm tra liên kết với Asset & Linh kiện
    updatedDevices.forEach(device => {
      if (device.linkedAssetId && device.type === 'water_purifier' && device.waterPurifier) {
        const asset = globalState.assets.find(a => a.id === device.linkedAssetId);
        if (asset && asset.components && asset.components.length > 0) {
          const f1Life = device.waterPurifier.filter1LifePercent;
          if (f1Life <= 15) {
            asset.components = asset.components.map((c, idx) => 
              idx === 0 ? { ...c, status: 'expired' } : c
            );
          }
        }
      }
    });

    notify();
    return { updatedDevices, newAlerts };
  };

  const syncLGWasherLiveState = async (deviceId: string) => {
    const device = globalState.iotDevices.find(d => d.id === deviceId);
    if (!device || device.type !== 'washing_machine') {
      return { success: false, message: 'Thiết bị không phải máy giặt.' };
    }

    const token = globalState.settings.lgThinqToken;
    if (!token) {
      return { success: false, message: 'Chưa có Token LG ThinQ trong Cài đặt Cloud API.' };
    }

    const res = await LGThinQService.fetchWasherLiveState(token, device.externalDeviceId);
    const m = res.metrics;

    const stateLabel = m.state === 'washing' ? 'Đang giặt' :
                       m.state === 'rinsing' ? 'Đang xả nước' :
                       m.state === 'spinning' ? 'Đang vắt cực khô' :
                       m.state === 'completed' ? 'Đã giặt xong' : 'Chờ lệnh giặt';

    const isRunning = m.state === 'washing' || m.state === 'rinsing' || m.state === 'spinning';

    const updatedDevice: IoTDevice = {
      ...device,
      lastUpdated: 'Vừa xong (Live LG ThinQ)',
      currentWattage: isRunning ? 380 : (m.isPoweredOn ? 5 : 0),
      washingMachine: {
        ...m,
        dataSource: 'live_api'
      },
      metrics: [
        { label: 'Trạng thái', value: `${stateLabel} (${m.programName})`, status: m.state === 'completed' ? 'warning' : 'normal' },
        { label: 'Thời gian còn lại', value: m.remainingMinutes, unit: 'phút', status: 'normal' },
        { label: 'Cửa máy giặt', value: m.doorLocked ? 'Khóa an toàn' : 'Mở khóa', status: 'normal' },
        { label: 'Vệ sinh lồng giặt', value: `${m.drumCleanCycleCount}/30 lần`, status: m.drumCleanCycleCount > 25 ? 'warning' : 'normal' }
      ]
    };

    if (m.state === 'completed' && (!device.alerts || !device.alerts.some(a => a.id.includes('alert-wash-live')))) {
      const alert = {
        id: `alert-wash-live-${Date.now()}`,
        level: 'info' as const,
        message: `Máy giặt thật "${device.name}" đã hoàn thành chu trình giặt! Hãy lấy đồ đem phơi.`,
        timestamp: 'Vừa xong',
        actionRequired: 'Lấy đồ đem phơi'
      };
      updatedDevice.alerts = [alert, ...(updatedDevice.alerts || [])];
    }

    globalState.iotDevices = globalState.iotDevices.map(d => d.id === deviceId ? updatedDevice : d);
    notify();

    return {
      success: true,
      message: res.message,
      state: m.state,
      remainingMinutes: m.remainingMinutes,
      programName: m.programName,
      isPoweredOn: m.isPoweredOn
    };
  };

  const discoverLGDevices = async () => {
    const token = globalState.settings.lgThinqToken;
    if (!token) {
      return { success: false, message: 'Chưa có Token LG ThinQ. Vui lòng nhập token trước.' };
    }
    const devices = await LGThinQService.fetchUserDevices(token);
    return { success: true, devices };
  };

  const createTaskFromIoT = (deviceId: string, title: string, xpReward: number = 15) => {
    const device = globalState.iotDevices.find(d => d.id === deviceId);
    const newTask = addTask({
      title,
      description: `Tự động tạo từ cảnh báo cảm biến IoT của "${device?.name || 'Thiết bị thông minh'}"`,
      assignedToId: globalState.currentUserId,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'todo',
      xpReward,
      assetId: device?.linkedAssetId
    });

    if (device && device.alerts) {
      device.alerts = device.alerts.map(a => ({ ...a, taskCreated: true }));
      notify();
    }
    return newTask;
  };

  const convertIoTEnergyToExpense = (customPrice?: number) => {
    const price = customPrice || globalState.settings.electricityPricePerKwh || 2500;
    const totalKwh = globalState.iotDevices.reduce((sum, d) => {
      return sum + (d.powerUsageKwhMonth || (d.powerUsageKwhToday || d.powerUsageKwh) * 30);
    }, 0);

    const totalAmount = Math.round(totalKwh * price);
    const breakdown = globalState.iotDevices
      .map(d => `${d.name}: ${(d.powerUsageKwhMonth || (d.powerUsageKwhToday || d.powerUsageKwh) * 30).toFixed(1)} kWh`)
      .join(', ');

    const newExpense = addExpense({
      title: 'Hóa đơn tiền điện sinh hoạt (IoT)',
      amount: totalAmount > 0 ? totalAmount : 250000,
      category: 'utilities',
      date: new Date().toISOString().split('T')[0],
      notes: `Hệ thống IoT ghi nhận tổng ${totalKwh.toFixed(1)} kWh (~${price.toLocaleString()}đ/kWh). Chi tiết: ${breakdown}`,
      payerId: globalState.currentUserId
    });

    return {
      success: true,
      amount: totalAmount > 0 ? totalAmount : 250000,
      kwh: totalKwh,
      expense: newExpense
    };
  };

  const updateAppSettings = (updates: Partial<AppSettings>) => {
    globalState.settings = {
      ...globalState.settings,
      ...updates
    };
    if (updates.theme) {
      if (updates.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    notify();
  };

  // Clear all operational data (assets, expenses, tasks, iot) keeping admin and settings
  const clearAllData = () => {
    globalState.assets = [];
    globalState.expenses = [];
    globalState.tasks = [];
    globalState.iotDevices = [];
    notify();
  };

  // Settings Actions
  const setNotifyDaysBeforeExpiry = (days: number) => {
    globalState.settings = {
      ...globalState.settings,
      notifyDaysBeforeExpiry: days
    };
    notify();
  };

  const setTheme = (theme: ThemeMode) => {
    globalState.settings = {
      ...globalState.settings,
      theme
    };
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    notify();
  };

  const setLanguage = (lang: LanguageCode) => {
    globalState.settings = {
      ...globalState.settings,
      language: lang
    };
    notify();
  };

  const resetToDefaultData = () => {
    globalState = {
      users: initialUsers,
      currentUserId: 'user-admin',
      assets: initialAssets,
      expenses: initialExpenses,
      budgets: initialBudgets,
      categories: initialCategories,
      tasks: initialTasks,
      iotDevices: initialIoTDevices,
      badges: initialBadges,
      settings: initialSettings
    };
    restoreInvestmentState({ assets: [], transactions: [], dividends: [] });
    if (initialSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    notify();
  };

  const restoreData = (backupData: any) => {
    try {
      if (!backupData || typeof backupData !== 'object') {
        return { success: false, message: 'Dữ liệu không hợp lệ!' };
      }

      const nextUsers = Array.isArray(backupData.users) && backupData.users.length > 0
        ? backupData.users
        : globalState.users;

      const nextAssets = Array.isArray(backupData.assets)
        ? backupData.assets
        : (backupData.assets !== undefined ? [] : globalState.assets);

      const nextExpenses = Array.isArray(backupData.expenses)
        ? backupData.expenses
        : (backupData.expenses !== undefined ? [] : globalState.expenses);

      const nextBudgets = Array.isArray(backupData.budgets)
        ? backupData.budgets
        : (backupData.budgets !== undefined ? [] : globalState.budgets);

      const nextCategories = Array.isArray(backupData.categories) && backupData.categories.length > 0
        ? backupData.categories
        : globalState.categories;

      const nextTasks = Array.isArray(backupData.tasks)
        ? backupData.tasks
        : (backupData.tasks !== undefined ? [] : globalState.tasks);

      const nextIoT = Array.isArray(backupData.iotDevices)
        ? backupData.iotDevices
        : (backupData.iotDevices !== undefined ? [] : globalState.iotDevices);

      const nextBadges = Array.isArray(backupData.badges)
        ? backupData.badges
        : (backupData.badges !== undefined ? [] : globalState.badges);

      const nextSettings: AppSettings = {
        ...globalState.settings,
        ...(backupData.settings || {})
      };

      // Phục hồi dữ liệu danh mục đầu tư nếu có trong tệp sao lưu
      if (backupData.investments || backupData.investmentAssets || backupData.investmentTransactions || backupData.investmentDividends) {
        restoreInvestmentState({
          assets: backupData.investments?.assets || backupData.investmentAssets,
          transactions: backupData.investments?.transactions || backupData.investmentTransactions,
          dividends: backupData.investments?.dividends || backupData.investmentDividends
        });
      }

      // Ensure valid currentUserId
      let nextCurrentUserId = backupData.currentUserId || globalState.currentUserId;
      if (!nextUsers.some((u: User) => u.id === nextCurrentUserId)) {
        const adminUser = nextUsers.find((u: User) => u.role === 'admin');
        nextCurrentUserId = adminUser ? adminUser.id : nextUsers[0].id;
      }

      globalState = {
        users: nextUsers,
        currentUserId: nextCurrentUserId,
        assets: nextAssets,
        expenses: nextExpenses,
        budgets: nextBudgets,
        categories: nextCategories,
        tasks: nextTasks,
        iotDevices: nextIoT,
        badges: nextBadges,
        settings: nextSettings
      };

      if (nextSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      notify();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to restore data:', err);
      return { success: false, message: err?.message || 'Lỗi khi phục hồi dữ liệu' };
    }
  };

  return {
    ...globalState,
    currentUser,
    setCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    clearAllData,
    addAsset,
    updateAsset,
    deleteAsset,
    addComponentToAsset,
    replaceComponent,
    addExpense,
    updateExpense,
    deleteExpense,
    updateBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    addTask,
    completeTask,
    setNotifyDaysBeforeExpiry,
    setTheme,
    setLanguage,
    updateAppSettings,
    resetToDefaultData,
    restoreData,
    addIoTDevice,
    updateIoTDevice,
    deleteIoTDevice,
    toggleIoTDeviceOnline,
    setIoTDevices,
    syncIoTTelemetry,
    syncLGWasherLiveState,
    discoverLGDevices,
    createTaskFromIoT,
    convertIoTEnergyToExpense
  };
};
