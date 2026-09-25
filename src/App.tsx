import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { MobileFrame } from './components/layout/MobileFrame';
import { Header } from './components/layout/Header';
import { BottomNav, TabType } from './components/layout/BottomNav';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { AssetListTab } from './components/assets/AssetListTab';
import { ExpenseTab } from './components/expenses/ExpenseTab';
import { IoTTab } from './components/iot/IoTTab';
import { FamilyTab } from './components/family/FamilyTab';
import { GameTab } from './components/gamification/GameTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { InvestmentTab } from './components/investments/InvestmentTab';
import { AddExpenseModal } from './components/expenses/AddExpenseModal';
import { AddAssetModal } from './components/assets/AddAssetModal';
import { VoiceInputModal } from './components/common/VoiceInputModal';
import { QRScannerModal } from './components/common/QRScannerModal';
import { AlertsModal } from './components/dashboard/AlertsModal';
import { Asset, Expense, ExpenseCategory } from './types';

export const App: React.FC = () => {
  const { assets, settings, addExpense, addAsset, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('famlife_active_tab') as TabType;
      if (saved && ['dashboard', 'assets', 'expenses', 'investments', 'iot', 'family', 'game', 'settings'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'dashboard';
  });

  useEffect(() => {
    try {
      localStorage.setItem('famlife_active_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  // Modals state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrScannerInitialType, setQrScannerInitialType] = useState<'expense' | 'asset'>('expense');
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [preselectedAssetId, setPreselectedAssetId] = useState<string | null>(null);

  // Sync theme with html document element
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Calculate urgent alerts based on notifyDaysBeforeExpiry
  const today = new Date();
  let urgentCount = 0;

  assets.forEach(asset => {
    const exp = new Date(asset.warrantyExpiryDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= settings.notifyDaysBeforeExpiry) {
      urgentCount++;
    }
    asset.components.forEach(comp => {
      if (comp.currentWearPercent <= 20) {
        urgentCount++;
      }
    });
  });

  const handleVoiceExpenseConfirm = (parsed: { title: string; amount: number; category: ExpenseCategory }) => {
    addExpense({
      title: parsed.title,
      amount: parsed.amount,
      category: parsed.category,
      date: new Date().toISOString().split('T')[0],
      payerId: currentUser.id,
      notes: 'Nhập bằng giọng nói (Voice Recognition)'
    });
  };

  const handleSaveExpenseFromScanner = (expense: Omit<Expense, 'id'>) => {
    addExpense(expense);
    setActiveTab('expenses');
  };

  const handleSaveAssetFromScanner = (asset: Omit<Asset, 'id'>) => {
    addAsset(asset);
    setActiveTab('assets');
  };

  const handleQRScanResult = (detectedAsset: Partial<Asset>) => {
    if (detectedAsset.name) {
      addAsset({
        name: detectedAsset.name,
        category: detectedAsset.category || 'Điện gia dụng',
        room: detectedAsset.room || 'living_room',
        price: detectedAsset.price || 4000000,
        purchaseDate: detectedAsset.purchaseDate || new Date().toISOString().split('T')[0],
        warrantyExpiryDate: detectedAsset.warrantyExpiryDate || '2027-09-13',
        purchasePlace: detectedAsset.purchasePlace || 'Điện Máy Xanh',
        serialNumber: detectedAsset.serialNumber || 'SN-QR-DETECTED',
        notes: detectedAsset.notes || 'Nhận diện tự động từ mã QR/hóa đơn',
        status: 'good',
        components: detectedAsset.components || []
      });
      setActiveTab('assets');
    }
  };

  const handleSelectAsset = (assetId: string) => {
    setPreselectedAssetId(assetId);
    setActiveTab('assets');
  };

  return (
    <MobileFrame>
      <Header
        onOpenAlerts={() => setShowAlertsModal(true)}
        urgentAlertsCount={urgentCount}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'dashboard' && (
          <DashboardTab
            onNavigateTab={setActiveTab}
            onOpenAddExpense={() => setShowAddExpense(true)}
            onOpenAddAsset={() => setShowAddAsset(true)}
            onOpenVoiceInput={() => setShowVoiceInput(true)}
            onOpenQRScanner={() => {
              setQrScannerInitialType('expense');
              setShowQRScanner(true);
            }}
            onSelectAsset={handleSelectAsset}
          />
        )}

        {activeTab === 'assets' && (
          <AssetListTab initialSelectedAssetId={preselectedAssetId} />
        )}

        {activeTab === 'expenses' && (
          <ExpenseTab 
            onOpenVoiceInput={() => setShowVoiceInput(true)}
            onOpenQRScanner={() => {
              setQrScannerInitialType('expense');
              setShowQRScanner(true);
            }}
          />
        )}

        {activeTab === 'iot' && <IoTTab />}

        {activeTab === 'family' && <FamilyTab />}

        {activeTab === 'game' && <GameTab />}

        {activeTab === 'investments' && <InvestmentTab />}

        {activeTab === 'settings' && <SettingsTab />}
      </main>

      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        urgentAssetsCount={urgentCount}
      />

      {/* Global Modals */}
      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onOpenVoiceInput={() => {
            setShowAddExpense(false);
            setShowVoiceInput(true);
          }}
          onOpenQRScanner={() => {
            setShowAddExpense(false);
            setQrScannerInitialType('expense');
            setShowQRScanner(true);
          }}
        />
      )}

      {showAddAsset && (
        <AddAssetModal
          onClose={() => setShowAddAsset(false)}
          onOpenQRScanner={() => {
            setShowAddAsset(false);
            setQrScannerInitialType('asset');
            setShowQRScanner(true);
          }}
        />
      )}

      {showVoiceInput && (
        <VoiceInputModal
          onClose={() => setShowVoiceInput(false)}
          onConfirmExpense={handleVoiceExpenseConfirm}
        />
      )}

      {showQRScanner && (
        <QRScannerModal
          initialType={qrScannerInitialType}
          onClose={() => setShowQRScanner(false)}
          onSaveExpense={handleSaveExpenseFromScanner}
          onSaveAsset={handleSaveAssetFromScanner}
          onScanResult={handleQRScanResult}
        />
      )}

      {showAlertsModal && (
        <AlertsModal
          onClose={() => setShowAlertsModal(false)}
          onSelectAsset={handleSelectAsset}
        />
      )}
    </MobileFrame>
  );
};
