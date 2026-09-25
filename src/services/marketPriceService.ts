import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { InvestmentAsset } from '../types/investment';

// Tỷ giá quy đổi USD -> VND mặc định cho Crypto (nếu tài sản tính bằng VND)
const DEFAULT_USD_VND_RATE = 25400;

/**
 * Lấy giá cổ phiếu Việt Nam (HOSE, HNX, UPCoM)
 * Nguồn: Entrade / DNSE Open Chart API (đơn vị giá trả về là nghìn đồng => x1000)
 */
export async function fetchVietnamStockPrice(symbol: string): Promise<{
  price: number;
  changePercent?: number;
} | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!cleanSymbol) return null;

  const now = Math.floor(Date.now() / 1000);
  const from = now - (86400 * 7); // Lấy trong 7 ngày gần nhất để bao quát ngày nghỉ cuối tuần

  const targetPath = `/chart-api/v2/ohlcs/stock?from=${from}&to=${now}&symbol=${cleanSymbol}&resolution=1D`;
  const directUrl = `https://services.entrade.com.vn${targetPath}`;
  const proxyUrl = `/api/entrade${targetPath}`;

  // 1. Nếu chạy trên Native Mobile (Android/iOS qua Capacitor), dùng CapacitorHttp để bypass triệt để CORS
  if (Capacitor.isNativePlatform()) {
    try {
      const response = await CapacitorHttp.get({
        url: directUrl,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.status === 200 && response.data) {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        if (data && Array.isArray(data.c) && data.c.length > 0) {
          const latestRaw = data.c[data.c.length - 1];
          const latestPrice = Math.round(latestRaw * 1000);

          let changePercent = 0;
          if (data.c.length > 1) {
            const prevRaw = data.c[data.c.length - 2];
            if (prevRaw > 0) {
              changePercent = Math.round(((latestRaw - prevRaw) / prevRaw) * 10000) / 100;
            }
          }

          return { price: latestPrice, changePercent };
        }
      }
    } catch (err) {
      console.warn(`Native CapacitorHttp error for stock ${cleanSymbol}:`, err);
    }
  }

  // 2. Chạy trên Web/Browser: Thử qua proxy dev server Vite hoặc direct URL
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const urlsToTry = isLocalhost ? [proxyUrl, directUrl] : [directUrl, proxyUrl];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data && Array.isArray(data.c) && data.c.length > 0) {
        const latestRaw = data.c[data.c.length - 1];
        const latestPrice = Math.round(latestRaw * 1000); // Entrade trả về đơn vị nghìn đồng

        let changePercent = 0;
        if (data.c.length > 1) {
          const prevRaw = data.c[data.c.length - 2];
          if (prevRaw > 0) {
            changePercent = Math.round(((latestRaw - prevRaw) / prevRaw) * 10000) / 100;
          }
        }

        return { price: latestPrice, changePercent };
      }
    } catch {
      // Thử fallback tiếp theo
    }
  }

  // 3. Fallback qua CORS proxy nếu cả hai cách trên bị chặn trên trình duyệt web
  try {
    const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
    const response = await fetch(fallbackUrl);
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.c) && data.c.length > 0) {
        const latestRaw = data.c[data.c.length - 1];
        return { price: Math.round(latestRaw * 1000) };
      }
    }
  } catch (err) {
    console.warn(`Could not fetch stock price for ${cleanSymbol}:`, err);
  }

  return null;
}

/**
 * Lấy giá tiền mã hóa (Crypto) từ Binance Public API
 */
export async function fetchCryptoPrice(symbol: string, currency: 'VND' | 'USD' = 'VND'): Promise<number | null> {
  const cleanSymbol = symbol.trim().toUpperCase().replace(/USDT$/, '');
  if (!cleanSymbol) return null;

  const pair = `${cleanSymbol}USDT`;
  const targetPath = `/api/v3/ticker/price?symbol=${pair}`;
  const directUrl = `https://api.binance.com${targetPath}`;
  const proxyUrl = `/api/binance${targetPath}`;

  // 1. Native Mobile via CapacitorHttp
  if (Capacitor.isNativePlatform()) {
    try {
      const response = await CapacitorHttp.get({ url: directUrl });
      if (response.status === 200 && response.data) {
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        if (data && data.price) {
          const usdPrice = parseFloat(data.price);
          if (currency === 'USD') return usdPrice;
          return Math.round(usdPrice * DEFAULT_USD_VND_RATE);
        }
      }
    } catch (err) {
      console.warn(`Native CapacitorHttp error for crypto ${cleanSymbol}:`, err);
    }
  }

  // 2. Browser / Web
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const urlsToTry = isLocalhost ? [proxyUrl, directUrl] : [directUrl, proxyUrl];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      if (data && data.price) {
        const usdPrice = parseFloat(data.price);
        if (currency === 'USD') {
          return usdPrice;
        }
        return Math.round(usdPrice * DEFAULT_USD_VND_RATE);
      }
    } catch {
      // Tiếp tục fallback
    }
  }

  return null;
}

/**
 * Lấy giá thị trường tự động cho bất kỳ tài sản nào (Cổ phiếu hoặc Crypto)
 */
export async function fetchPriceForAsset(asset: InvestmentAsset): Promise<number | null> {
  if (asset.assetClass === 'stock') {
    const res = await fetchVietnamStockPrice(asset.symbol);
    return res ? res.price : null;
  }
  
  if (asset.assetClass === 'crypto') {
    return await fetchCryptoPrice(asset.symbol, asset.currency);
  }

  return null;
}

/**
 * Đồng bộ toàn bộ giá thị trường cho các tài sản trong danh mục
 */
export async function syncAllMarketPrices(
  assets: InvestmentAsset[],
  updateAssetPrice: (id: string, newPrice: number) => void
): Promise<{ updatedCount: number; failedSymbols: string[] }> {
  let updatedCount = 0;
  const failedSymbols: string[] = [];

  // Lọc các tài sản có thể lấy giá tự động (Cổ phiếu, Crypto)
  const syncableAssets = assets.filter(a => a.assetClass === 'stock' || a.assetClass === 'crypto');

  for (const asset of syncableAssets) {
    try {
      const newPrice = await fetchPriceForAsset(asset);
      if (newPrice !== null && newPrice > 0) {
        updateAssetPrice(asset.id, newPrice);
        updatedCount++;
      } else {
        failedSymbols.push(asset.symbol);
      }
    } catch {
      failedSymbols.push(asset.symbol);
    }
  }

  return { updatedCount, failedSymbols };
}
