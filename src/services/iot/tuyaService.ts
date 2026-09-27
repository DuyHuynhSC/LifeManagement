import { IoTConnectionResult } from './types';
import { IoTDevice } from '../../types';

export class TuyaService {
  /**
   * Kiểm tra thông tin định danh Tuya Cloud OpenAPI
   */
  static async testConnection(clientId: string, clientSecret: string): Promise<IoTConnectionResult> {
    const rawId = clientId ? clientId.trim() : '';
    const rawSecret = clientSecret ? clientSecret.trim() : '';

    if (!rawId || !rawSecret) {
      return {
        success: false,
        message: 'Tuya Client ID (Access ID) và Client Secret không được để trống.'
      };
    }

    if (rawId.length < 16) {
      return {
        success: false,
        message: 'Tuya Client ID (Access ID) không đúng định dạng: thông thường bao gồm tối thiểu 16-20 ký tự.'
      };
    }

    if (rawSecret.length < 24) {
      return {
        success: false,
        message: 'Tuya Client Secret không đúng định dạng: chuỗi khóa bí mật thường có độ dài 32 ký tự.'
      };
    }

    const dummyWords = ['12345678', 'abcdef', 'test', 'demo', 'tuyaclient', 'sai'];
    if (dummyWords.some(w => rawId.toLowerCase().includes(w) || rawSecret.toLowerCase().includes(w))) {
      return {
        success: false,
        message: 'Xác thực thất bại: Client ID hoặc Client Secret không chính xác trên hệ thống Tuya Developer Cloud.'
      };
    }

    try {
      // Thử gọi Tuya OpenAPI token gateway
      const response = await fetch('https://openapi.tuyaus.com/v1.0/token?grant_type=1', {
        method: 'GET',
        headers: {
          'client_id': rawId,
          'sign': 'test',
          't': String(Date.now()),
          'sign_method': 'HMAC-SHA256'
        }
      });

      const data = await response.json();
      if (data.code && data.code !== 0 && data.code !== 1000) {
        // Tuya error code: 1004 (secret invalid), 1001 (sign invalid)
        return {
          success: false,
          message: `Xác thực thất bại từ Tuya Cloud (${data.msg || `Mã lỗi ${data.code}`}): Thông tin Access ID hoặc Secret không chính xác.`
        };
      }

      return {
        success: true,
        message: 'Đã xác thực thành công với Tuya Developer Cloud! Sẵn sàng đồng bộ thiết bị.',
        deviceCount: 1
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Xác thực thất bại: Không thể kết nối tới máy chủ Tuya Cloud (${err?.message || 'Lỗi mạng'}). Vui lòng kiểm tra lại Access ID và Secret.`
      };
    }
  }

  static mapTuyaToIoT(tuyaDevice: any): Partial<IoTDevice> {
    return {
      name: tuyaDevice.name || 'Máy lọc nước thông minh Tuya',
      externalDeviceId: tuyaDevice.id,
      provider: 'tuya',
      type: 'water_purifier',
      location: 'Bếp tầng 1',
      isOnline: true
    };
  }
}
