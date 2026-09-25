import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as CapSpeechRecognition } from '@capacitor-community/speech-recognition';
import { ExpenseCategory } from '../types';

export interface ParsedVoiceExpense {
  title: string;
  amount: number;
  category: ExpenseCategory;
}

export interface SpeechRecognitionController {
  stop: () => Promise<void> | void;
}

let activeController: SpeechRecognitionController | null = null;

function mapNativeError(error: string): string {
  if (/no speech|timeout/i.test(error)) {
    return 'Không nghe thấy âm thanh. Bạn vui lòng nói lại gần micro hơn.';
  }
  if (/no match/i.test(error)) {
    return 'Không nhận diện được giọng nói, vui lòng thử lại.';
  }
  if (/permission/i.test(error)) {
    return 'Chưa cấp quyền Microphone cho ứng dụng. Vui lòng bật quyền Microphone trong Cài đặt.';
  }
  if (/network/i.test(error)) {
    return 'Lỗi kết nối mạng khi nhận diện giọng nói.';
  }
  if (/busy/i.test(error)) {
    return 'Dịch vụ giọng nói đang bận, vui lòng thử lại sau giây lát.';
  }
  if (error === '0' || /cancel/i.test(error)) {
    return 'Đã hủy nhận diện giọng nói.';
  }
  return error || 'Lỗi nhận diện giọng nói';
}

export async function stopSpeechRecognition() {
  if (activeController) {
    try {
      await activeController.stop();
    } catch {
      // ignore
    }
    activeController = null;
  }
}

export async function startSpeechRecognition(
  onResult: (transcript: string, parsed: ParsedVoiceExpense) => void,
  onError: (error: string) => void,
  onEnd: () => void,
  lang: string = 'vi-VN'
): Promise<SpeechRecognitionController | null> {
  await stopSpeechRecognition();

  const targetLang = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'vi-VN';

  // 1. Native platform (Android / iOS) via Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      // Check & request RECORD_AUDIO permission
      const permissionStatus = await CapSpeechRecognition.checkPermissions();
      if (permissionStatus.speechRecognition !== 'granted') {
        const reqStatus = await CapSpeechRecognition.requestPermissions();
        if (reqStatus.speechRecognition !== 'granted') {
          onError('Ứng dụng cần quyền Microphone để nhận diện giọng nói. Vui lòng cấp quyền trong Cài đặt.');
          onEnd();
          return null;
        }
      }

      // Check service availability
      const avail = await CapSpeechRecognition.available();
      if (!avail.available) {
        onError('Thiết bị chưa hỗ trợ dịch vụ nhận diện giọng nói (Google Speech Services).');
        onEnd();
        return null;
      }

      let isEnded = false;
      const finish = () => {
        if (!isEnded) {
          isEnded = true;
          activeController = null;
          onEnd();
        }
      };

      const controller: SpeechRecognitionController = {
        stop: async () => {
          try {
            await CapSpeechRecognition.stop();
          } catch {}
          finish();
        }
      };
      activeController = controller;

      // Start recognition on Android:
      // Try background mode first (popup: false)
      try {
        const res = await CapSpeechRecognition.start({
          language: targetLang,
          maxResults: 3,
          prompt: 'Nói khoản chi tiêu của bạn...',
          popup: false,
          partialResults: false
        });

        if (res && res.matches && res.matches.length > 0) {
          const transcript = res.matches[0];
          const parsed = parseVoiceToExpense(transcript);
          onResult(transcript, parsed);
        } else {
          onError('Không nhận diện được giọng nói, vui lòng thử lại.');
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        // Fallback to system popup dialog if background speech recognizer fails
        if (errMsg.includes('Client side error') || errMsg.includes('No match') || errMsg.includes('error')) {
          try {
            const popupRes = await CapSpeechRecognition.start({
              language: targetLang,
              maxResults: 3,
              prompt: 'Nói khoản chi tiêu của bạn...',
              popup: true,
              partialResults: false
            });

            if (popupRes && popupRes.matches && popupRes.matches.length > 0) {
              const transcript = popupRes.matches[0];
              const parsed = parseVoiceToExpense(transcript);
              onResult(transcript, parsed);
              finish();
              return controller;
            }
          } catch (popupErr: any) {
            const popupErrMsg = popupErr?.message || String(popupErr);
            if (popupErrMsg !== '0') {
              onError(mapNativeError(popupErrMsg));
            }
            finish();
            return null;
          }
        } else if (errMsg !== '0') {
          onError(mapNativeError(errMsg));
        }
      }

      finish();
      return controller;
    } catch (err: any) {
      onError(mapNativeError(err?.message || 'Không thể khởi động microphone'));
      onEnd();
      return null;
    }
  }

  // 2. Web browser fallback using Web Speech API
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Trình duyệt của bạn chưa hỗ trợ Web Speech API.');
    onEnd();
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = targetLang;

    let hasEnded = false;
    const finishWeb = () => {
      if (!hasEnded) {
        hasEnded = true;
        activeController = null;
        onEnd();
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const parsed = parseVoiceToExpense(transcript);
      onResult(transcript, parsed);
    };

    recognition.onerror = (event: any) => {
      onError(mapNativeError(event.error || 'Lỗi nhận diện giọng nói'));
    };

    recognition.onend = () => {
      finishWeb();
    };

    recognition.start();

    const controller: SpeechRecognitionController = {
      stop: () => {
        try {
          recognition.stop();
        } catch {}
        finishWeb();
      }
    };
    activeController = controller;
    return controller;
  } catch (err: any) {
    onError(err?.message || 'Không thể khởi động microphone');
    onEnd();
    return null;
  }
}

export function parseVoiceToExpense(text: string): ParsedVoiceExpense {
  const originalText = text.trim();
  let cleanTitle = originalText;
  let amount = 0;
  let category: ExpenseCategory = 'other';

  // 1. Regex patterns for various amount expressions
  // Compound million + thousand (e.g. "1 triệu 450 nghìn", "1tr 450k", "2 triệu 500")
  const compoundMillionRegex = /(\d+([.,]\d+)?)\s*(triệu|củ|tr)\s*(?:và\s*)?(\d+([.,]\d+)?)\s*(nghìn|ngàn|k)?/i;
  const singleMillionRegex = /(\d+([.,]\d+)?)\s*(triệu|củ|tr)\b/i;
  const singleThousandRegex = /(\d+([.,]\d+)?)\s*(nghìn|ngàn|k)\b/i;
  const currencyVndRegex = /(\d{1,3}(?:[.,]\d{3})+|\d{3,9})\s*(đồng|đ|vnd)\b/i;
  const dollarsRegex = /(\d+([.,]\d+)?)\s*(dollars?|\$)/i;
  const yenRegex = /(\d+)\s*(yen|円)/i;
  const plainNumberRegex = /\b(\d{3,9})\b/;

  let matchedAmountStr: string | null = null;

  const compoundMatch = cleanTitle.match(compoundMillionRegex);
  if (compoundMatch) {
    matchedAmountStr = compoundMatch[0];
    const millions = parseFloat(compoundMatch[1].replace(',', '.'));
    const thousandsPart = compoundMatch[4];
    let thousands = 0;
    if (thousandsPart) {
      const parsedThousands = parseFloat(thousandsPart.replace(',', '.'));
      thousands = parsedThousands < 1000 ? parsedThousands * 1000 : parsedThousands;
    }
    amount = Math.round(millions * 1000000 + thousands);
  } else {
    const millionMatch = cleanTitle.match(singleMillionRegex);
    if (millionMatch) {
      matchedAmountStr = millionMatch[0];
      const num = parseFloat(millionMatch[1].replace(',', '.'));
      amount = Math.round(num * 1000000);
    } else {
      const thousandMatch = cleanTitle.match(singleThousandRegex);
      if (thousandMatch) {
        matchedAmountStr = thousandMatch[0];
        const num = parseFloat(thousandMatch[1].replace(',', '.'));
        amount = Math.round(num * 1000);
      } else {
        const vndMatch = cleanTitle.match(currencyVndRegex);
        if (vndMatch) {
          matchedAmountStr = vndMatch[0];
          const raw = vndMatch[1].replace(/[.,]/g, '');
          amount = parseInt(raw, 10);
        } else {
          const dolMatch = cleanTitle.match(dollarsRegex);
          if (dolMatch) {
            matchedAmountStr = dolMatch[0];
            amount = Math.round(parseFloat(dolMatch[1].replace(',', '.')));
          } else {
            const yMatch = cleanTitle.match(yenRegex);
            if (yMatch) {
              matchedAmountStr = yMatch[0];
              amount = parseInt(yMatch[1], 10);
            } else {
              const numMatch = cleanTitle.match(plainNumberRegex);
              if (numMatch) {
                matchedAmountStr = numMatch[0];
                amount = parseInt(numMatch[1], 10);
              }
            }
          }
        }
      }
    }
  }

  // 2. Strip the matched amount substring from cleanTitle
  if (matchedAmountStr) {
    cleanTitle = cleanTitle.replace(matchedAmountStr, ' ');
  }

  // Strip trailing or leading connecting words: "hết", "mất", "giá", "khoảng", "tầm", "tổng cộng", "tổng", "chi", "là"
  cleanTitle = cleanTitle
    .replace(/\s+(hết|mất|giá|khoảng|tầm|tổng cộng|tổng|chi hết|chi|là|hết khoảng)$/i, '')
    .replace(/^(chi|tiền|khoản)\s+/i, (match) => {
      // Keep "tiền điện", "tiền nước", but remove "chi " prefix if wanted
      return match.toLowerCase().startsWith('chi ') ? '' : match;
    })
    .replace(/[,\-:;]+$/, '')
    .replace(/^[,\-:;]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If after stripping, cleanTitle ends with connector words again
  cleanTitle = cleanTitle.replace(/\s+(hết|mất|giá|khoảng|tầm|tổng cộng|tổng|chi hết|là)$/i, '').trim();

  // 3. Classify category based on keywords from the full original utterance
  const lowerFull = originalText.toLowerCase();
  if (/(ăn|uống|phở|cà phê|cafe|bún|cơm|siêu thị|chợ|bánh|thịt|rau|dinner|lunch|breakfast|coffee)/.test(lowerFull)) {
    category = 'food';
    if (!cleanTitle) cleanTitle = 'Ăn uống thực phẩm';
  } else if (/(điện|nước|mạng|internet|wifi|rác|vệ sinh|bill|utility)/.test(lowerFull)) {
    category = 'utilities';
    if (!cleanTitle) cleanTitle = 'Hóa đơn dịch vụ';
  } else if (/(lõi lọc|thay|bảo trì|sửa|thợ|màng lọc|vệ sinh máy|bảo dưỡng|repair|maintenance)/.test(lowerFull)) {
    category = 'maintenance';
    if (!cleanTitle) cleanTitle = 'Bảo trì linh kiện';
  } else if (/(mua máy|tivi|tủ lạnh|máy giặt|nồi|thiết bị|quạt|hút bụi|appliance)/.test(lowerFull)) {
    category = 'appliances';
    if (!cleanTitle) cleanTitle = 'Mua sắm thiết bị';
  } else if (/(thuốc|bác sĩ|khám|viện|y tế|bệnh|medicine|doctor|clinic)/.test(lowerFull)) {
    category = 'healthcare';
    if (!cleanTitle) cleanTitle = 'Chăm sóc sức khỏe';
  } else if (/(học|sách|vở|học phí|khóa học|education|book|school)/.test(lowerFull)) {
    category = 'education';
    if (!cleanTitle) cleanTitle = 'Giáo dục học tập';
  } else if (/(xem phim|du lịch|vé|chơi|game|movie|travel)/.test(lowerFull)) {
    category = 'entertainment';
    if (!cleanTitle) cleanTitle = 'Giải trí';
  }

  // Fallback if title became completely blank
  if (!cleanTitle) {
    cleanTitle = originalText;
  }

  // Capitalize first letter
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  return {
    title: cleanTitle,
    amount: amount > 0 ? amount : 50000,
    category
  };
}
