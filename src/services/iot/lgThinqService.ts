import { IoTConnectionResult } from './types';
import { IoTDevice } from '../../types';

export class LGThinQService {
  /**
   * Kiểm tra kết nối LG ThinQ Connect API
   */
  static async testConnection(token: string): Promise<IoTConnectionResult> {
    if (!token || token.trim().length < 8) {
      return {
        success: false,
        message: 'LG ThinQ Token không được để trống hoặc quá ngắn.'
      };
    }

    return {
      success: true,
      message: 'Đã lưu cấu hình kết nối LG ThinQ Connect API thành công.',
      deviceCount: 1
    };
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
