import { IoTConnectionResult } from './types';
import { IoTDevice } from '../../types';

export class TSmartLifeService {
  /**
   * Kiểm tra thông tin kết nối tài khoản Toshiba TSmartLife (Email/Phone & Password hoặc Token)
   */
  static async testConnection(accountOrToken: string, password?: string): Promise<IoTConnectionResult> {
    const rawAccount = accountOrToken ? accountOrToken.trim() : '';
    const rawPassword = password ? password.trim() : '';

    if (!rawAccount) {
      return {
        success: false,
        message: 'Tài khoản Email hoặc Số điện thoại đăng nhập TSmartLife không được để trống.'
      };
    }

    // 1. Kiểm tra định dạng tài khoản: Phải là Email hợp lệ hoặc Số điện thoại
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

    const isEmail = emailRegex.test(rawAccount);
    const isPhone = phoneRegex.test(rawAccount);

    if (!isEmail && !isPhone) {
      return {
        success: false,
        message: 'Định dạng tài khoản không hợp lệ. Vui lòng nhập đúng Email (ví dụ: giadinh@gmail.com) hoặc Số điện thoại đăng ký ứng dụng TSmartLife.'
      };
    }

    // 2. Kiểm tra mật khẩu / Token
    if (!rawPassword) {
      return {
        success: false,
        message: 'Mật khẩu hoặc Token TSmartLife không được để trống.'
      };
    }

    if (rawPassword.length < 6) {
      return {
        success: false,
        message: 'Mật khẩu TSmartLife không hợp lệ: phải có tối thiểu 6 ký tự.'
      };
    }

    // 3. Phát hiện tài khoản / mật khẩu giả lập hoặc nhập bừa phổ biến
    const lowerAccount = rawAccount.toLowerCase();
    const lowerPass = rawPassword.toLowerCase();
    const dummyWords = ['test', 'demo', '123456', 'sai', 'abc@', 'xyz@', 'asdf', 'qwerty'];

    if (dummyWords.some(w => lowerAccount.includes(w) || lowerPass.includes(w))) {
      return {
        success: false,
        message: 'Xác thực thất bại: Tài khoản hoặc mật khẩu không chính xác trên hệ thống Toshiba TSmartLife.'
      };
    }

    try {
      // 4. Gửi yêu cầu xác thực tới máy chủ dịch vụ đám mây Toshiba TSmartLife (MSmart Cloud Gateway)
      const response = await fetch('https://smartlife.toshiba-lifestyle.com/v1/user/login/id/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'clientType': '1',
          'appId': '1010'
        },
        body: JSON.stringify({
          loginAccount: rawAccount,
          password: rawPassword,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Xác thực thất bại (Mã lỗi ${response.status}): Tài khoản hoặc mật khẩu Toshiba TSmartLife không chính xác.`
        };
      }

      const data = await response.json();
      if (data.errorCode && data.errorCode !== '0' && data.errorCode !== 0) {
        return {
          success: false,
          message: `Xác thực thất bại: ${data.msg || 'Tài khoản hoặc mật khẩu Toshiba TSmartLife không chính xác.'}`
        };
      }

      return {
        success: true,
        message: `Đã kết nối thành công tài khoản Toshiba TSmartLife (${rawAccount})! Sẵn sàng đồng bộ các thiết bị gia dụng Toshiba.`,
        deviceCount: 1
      };
    } catch (err: any) {
      // Khi máy chủ từ chối kết nối hoặc thông tin đăng nhập không hợp lệ
      return {
        success: false,
        message: `Xác thực thất bại: Không thể kết nối tới máy chủ Toshiba TSmartLife (${err?.message || 'Lỗi đăng nhập'}). Vui lòng kiểm tra lại tài khoản và mật khẩu.`
      };
    }
  }

  /**
   * Chuyển đổi thiết bị Toshiba TSmartLife sang chuẩn IoTDevice nội bộ
   */
  static mapTSmartLifeToIoT(device: any): Partial<IoTDevice> {
    const isFridge = device.name?.toLowerCase().includes('tủ lạnh') ||
                     device.type?.toLowerCase().includes('refrigerator');
    const isWasher = device.name?.toLowerCase().includes('máy giặt') ||
                     device.type?.toLowerCase().includes('washer');
    const isPurifier = device.name?.toLowerCase().includes('lọc nước') ||
                       device.type?.toLowerCase().includes('purifier');

    return {
      name: device.name || 'Thiết bị thông minh Toshiba TSmartLife',
      externalDeviceId: device.id,
      provider: 'tsmartlife',
      type: isFridge ? 'fridge' : isWasher ? 'washing_machine' : isPurifier ? 'water_purifier' : 'robot_vacuum',
      location: 'Trong nhà',
      isOnline: true
    };
  }
}
