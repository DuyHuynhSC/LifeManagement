import { Capacitor, registerPlugin } from '@capacitor/core';
import { PendingBankTransaction } from '../types';
import { parseBankNotification } from './bankingParserService';

export interface BankTransactionPluginInterface {
  checkNotificationPermission(): Promise<{ granted: boolean }>;
  openNotificationSettings(): Promise<{ success: boolean }>;
  getPendingTransactions(): Promise<{ transactions: { packageName: string; text: string; timestamp: number }[] }>;
  clearPendingTransactions(): Promise<{ success: boolean }>;
}

const BankTransactionPlugin = registerPlugin<BankTransactionPluginInterface>('BankTransactionPlugin', {
  web: {
    checkNotificationPermission: async () => ({ granted: false }),
    openNotificationSettings: async () => ({ success: false }),
    getPendingTransactions: async () => ({ transactions: [] }),
    clearPendingTransactions: async () => ({ success: true })
  }
});

/**
 * Check if Android Notification Listener permission is granted
 */
export async function checkBankNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await BankTransactionPlugin.checkNotificationPermission();
      return !!res.granted;
    } catch (e) {
      console.warn('BankTransactionPlugin.checkNotificationPermission failed:', e);
      return false;
    }
  }
  return false;
}

/**
 * Open system settings for Notification Access so user can enable FamLife
 */
export async function openBankNotificationSettings(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await BankTransactionPlugin.openNotificationSettings();
      return !!res.success;
    } catch (e) {
      console.warn('BankTransactionPlugin.openNotificationSettings failed:', e);
      return false;
    }
  }
  return false;
}

/**
 * Fetch any background bank notifications captured by Android NotificationListenerService
 */
export async function fetchNativePendingBankTransactions(): Promise<PendingBankTransaction[]> {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }

  try {
    const res = await BankTransactionPlugin.getPendingTransactions();
    if (!res || !res.transactions || res.transactions.length === 0) {
      return [];
    }

    const results: PendingBankTransaction[] = [];
    for (const item of res.transactions) {
      const parsed = parseBankNotification(item.text);
      if (parsed) {
        results.push(parsed);
      }
    }

    // Clear after reading so they aren't processed twice
    if (results.length > 0) {
      await BankTransactionPlugin.clearPendingTransactions();
    }

    return results;
  } catch (err) {
    console.warn('Error fetching native pending transactions:', err);
    return [];
  }
}

/**
 * Smart Clipboard Scanner: Checks if user copied an SMS or receipt of a debit transaction
 */
let lastCheckedClipboardText = '';

export async function checkClipboardForBankTransaction(): Promise<PendingBankTransaction | null> {
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    return null;
  }

  try {
    const text = await navigator.clipboard.readText();
    const trimmed = text.trim();

    if (!trimmed || trimmed === lastCheckedClipboardText || trimmed.length > 300) {
      return null;
    }

    // Only inspect if it looks like a bank transaction
    const parsed = parseBankNotification(trimmed, 'clipboard');
    if (parsed) {
      lastCheckedClipboardText = trimmed;
      return parsed;
    }
  } catch {
    // Permission denied or clipboard unavailable - safe to ignore
  }

  return null;
}
