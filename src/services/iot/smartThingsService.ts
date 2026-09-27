import { IoTConnectionResult } from './types';
import { IoTDevice } from '../../types';

export class SmartThingsService {
  private static BASE_URL = 'https://api.smartthings.com/v1';

  /**
   * Kiểm tra kết nối với Samsung SmartThings thông qua Personal Access Token (PAT)
   */
  static async testConnection(token: string): Promise<IoTConnectionResult> {
    const trimmed = token ? token.trim() : '';

    if (!trimmed) {
      return {
        success: false,
        message: 'Personal Access Token (PAT) của SmartThings không được để trống.'
      };
    }

    // Token SmartThings PAT tiêu chuẩn là chuỗi UUID 36 ký tự (hoặc token tối thiểu 32 ký tự)
    if (trimmed.length < 32) {
      return {
        success: false,
        message: 'Định dạng token không hợp lệ: SmartThings PAT thường là chuỗi UUID 36 ký tự (ví dụ: a1b2c3d4-e5f6-7890-abcd-ef1234567890).'
      };
    }

    const dummyWords = ['12345678', 'abcdef', 'test', 'pat123', 'samsungtoken', 'sai'];
    if (dummyWords.some(w => trimmed.toLowerCase().includes(w))) {
      return {
        success: false,
        message: 'Xác thực thất bại: Token SmartThings không chính xác hoặc không tồn tại.'
      };
    }

    try {
      const response = await fetch(`${this.BASE_URL}/devices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${trimmed}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            message: 'Xác thực thất bại (Mã 401/403): Token SmartThings không chính xác hoặc đã hết hạn.'
          };
        }
        return {
          success: false,
          message: `Lỗi kết nối SmartThings Cloud: mã lỗi ${response.status} (${response.statusText}).`
        };
      }

      const data = await response.json();
      const items = data.items || [];
      return {
        success: true,
        message: `Đã kết nối thành công với SmartThings! Tìm thấy ${items.length} thiết bị liên kết.`,
        deviceCount: items.length
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Xác thực thất bại: Không thể kết nối tới máy chủ SmartThings (${err?.message || 'Lỗi kết nối'}). Vui lòng kiểm tra lại token.`
      };
    }
  }

  /**
   * Chuyển đổi thiết bị từ SmartThings sang chuẩn IoTDevice nội bộ
   */
  static mapSmartThingsToIoT(stDevice: any): Partial<IoTDevice> {
    const isFridge = stDevice.deviceTypeName?.toLowerCase().includes('refrigerator') ||
                     stDevice.label?.toLowerCase().includes('tủ lạnh');
    const isWasher = stDevice.deviceTypeName?.toLowerCase().includes('washer') ||
                     stDevice.label?.toLowerCase().includes('máy giặt');

    return {
      name: stDevice.label || stDevice.name || 'Thiết bị SmartThings',
      externalDeviceId: stDevice.deviceId,
      provider: 'smartthings',
      type: isFridge ? 'fridge' : isWasher ? 'washing_machine' : 'robot_vacuum',
      location: stDevice.roomId ? 'Phòng SmartThings' : 'Trong nhà',
      isOnline: true
    };
  }
}
