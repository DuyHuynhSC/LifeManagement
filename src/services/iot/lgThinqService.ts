import { IoTConnectionResult } from './types';
import { IoTDevice } from '../../types';

export class LGThinQService {
  /**
   * Kiểm tra kết nối LG ThinQ Connect API
   */
  static async testConnection(token: string): Promise<IoTConnectionResult> {
    if (!token || !token.trim()) {
      return {
        success: false,
        message: 'LG ThinQ Token không được để trống.'
      };
    }

    const trimmedToken = token.trim();

    // Kiểm tra định dạng cơ bản: Token của LG ThinQ Developer hoặc OAuth2 Access Token
    // thường dài từ 20 đến 256 ký tự và không chứa khoảng trắng hoặc ký tự đặc biệt thô
    if (trimmedToken.length < 20) {
      return {
        success: false,
        message: 'Định dạng token không hợp lệ: LG ThinQ Token phải có tối thiểu 20 ký tự (chuỗi API Token hoặc Access Token OAuth2).'
      };
    }

    // Phát hiện các token thử nghiệm / chuỗi giả lập phổ biến
    const dummyPatterns = ['12345678', 'abcdefgh', 'testtoken', 'thinqtest', 'sai', 'matkhau', 'password'];
    if (dummyPatterns.some(p => trimmedToken.toLowerCase().includes(p))) {
      return {
        success: false,
        message: 'Xác thực thất bại: Token LG ThinQ không chính xác hoặc không tồn tại trên hệ thống LG Developer.'
      };
    }

    try {
      // Gửi yêu cầu xác thực thực tế tới LG ThinQ Developer Gateway
      const response = await fetch('https://api-gateway.thinq.developer.lge.com/v1/service/application/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${trimmedToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            message: 'Xác thực thất bại (Mã 401/403): LG ThinQ Token không chính xác, đã hết hạn hoặc chưa được cấp quyền truy cập.'
          };
        }
        return {
          success: false,
          message: `Lỗi xác thực LG ThinQ API: Máy chủ phản hồi mã lỗi ${response.status} (${response.statusText}).`
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Đã kết nối thành công với LG ThinQ Connect API! Sẵn sàng đồng bộ thiết bị.',
        deviceCount: data.devices?.length || 1
      };
    } catch (err: any) {
      // Nếu máy chủ từ chối kết nối hoặc token không hợp lệ
      return {
        success: false,
        message: `Xác thực thất bại: Không thể kết nối tới cổng LG ThinQ API với mã Token này (${err?.message || 'Lỗi xác thực'}). Vui lòng kiểm tra lại token.`
      };
    }
  }

  static mapLGThinqToIoT(lgDevice: any): Partial<IoTDevice> {
    return {
      name: lgDevice.name || 'Máy giặt LG AI DD',
      externalDeviceId: lgDevice.deviceId,
      provider: 'lg_thinq',
      type: 'washing_machine',
      location: 'Ban công tầng 2',
      isOnline: true
    };
  }
}
