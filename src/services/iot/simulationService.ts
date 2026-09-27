import { IoTDevice, IoTAlert } from '../../types';

export class SimulationService {
  /**
   * Cập nhật dữ liệu vi sai Telemetry theo thời gian thực cho các thiết bị Online
   */
  static simulateTelemetryStep(devices: IoTDevice[]): {
    updatedDevices: IoTDevice[];
    newAlerts: { device: IoTDevice; alert: IoTAlert }[];
  } {
    const newAlerts: { device: IoTDevice; alert: IoTAlert }[] = [];

    const updatedDevices = devices.map(device => {
      if (!device.isOnline) {
        return device;
      }

      const updated = { ...device, lastUpdated: 'Vừa xong' };

      // 1. Máy lọc nước (Water Purifier)
      if (device.type === 'water_purifier' && device.waterPurifier) {
        // Dao động nhẹ TDS đầu ra (13-16 ppm) và TDS cấp vào (180-195 ppm)
        const tdsOut = Math.min(25, Math.max(10, Math.floor(13 + Math.random() * 4)));
        const tdsIn = Math.floor(180 + Math.random() * 15);
        const addedLiters = +(Math.random() * 0.1).toFixed(2);
        const newLiters = +(device.waterPurifier.litersToday + addedLiters).toFixed(2);

        // Hao mòn nhẹ lõi lọc (0.01%)
        const f1 = +(Math.max(5, device.waterPurifier.filter1LifePercent - 0.02)).toFixed(1);
        const fRo = +(Math.max(2, device.waterPurifier.filterRoLifePercent - 0.01)).toFixed(1);

        updated.waterPurifier = {
          ...device.waterPurifier,
          tdsOutPpm: tdsOut,
          tdsInPpm: tdsIn,
          litersToday: newLiters,
          filter1LifePercent: f1,
          filterRoLifePercent: fRo
        };

        updated.metrics = [
          { label: 'TDS đầu ra (uống)', value: tdsOut, unit: 'ppm', status: tdsOut > 30 ? 'warning' : 'normal' },
          { label: 'TDS nước cấp vào', value: tdsIn, unit: 'ppm', status: 'normal' },
          { label: 'Tuổi thọ Lõi 1', value: f1, unit: '%', status: f1 < 15 ? 'warning' : 'normal' },
          { label: 'Tuổi thọ Lõi RO', value: fRo, unit: '%', status: fRo < 10 ? 'alert' : 'normal' }
        ];

        // Kiểm tra cảnh báo lõi lọc
        if (f1 < 15 && (!device.alerts || !device.alerts.some(a => a.id.includes('alert-filter-1')))) {
          const alert: IoTAlert = {
            id: `alert-filter-1-${Date.now()}`,
            level: 'warning',
            message: `Lõi lọc số 1 của ${device.name} chỉ còn ${f1}%. Hãy chuẩn bị thay thế.`,
            timestamp: 'Vừa xong',
            actionRequired: 'Thay lõi lọc số 1'
          };
          updated.alerts = [...(updated.alerts || []), alert];
          newAlerts.push({ device: updated, alert });
        }
      }

      // 2. Tủ lạnh (Fridge)
      if (device.type === 'fridge' && device.fridge) {
        // Dao động nhiệt độ 0.2 - 0.4 độ
        const delta = (Math.random() - 0.5) * 0.4;
        const fridgeTemp = +(device.fridge.fridgeTemp + delta).toFixed(1);
        const freezerTemp = +(-18 + (Math.random() - 0.5) * 0.6).toFixed(1);

        // Tiêu thụ điện tăng nhẹ theo thời gian thực
        const kwhAdded = 0.005;
        const todayKwh = +( (device.powerUsageKwhToday || device.powerUsageKwh) + kwhAdded ).toFixed(3);

        updated.powerUsageKwhToday = todayKwh;
        updated.powerUsageKwh = todayKwh;

        updated.fridge = {
          ...device.fridge,
          fridgeTemp,
          freezerTemp
        };

        updated.metrics = [
          { label: 'Nhiệt độ ngăn mát', value: fridgeTemp, unit: '°C', status: fridgeTemp > 8 ? 'warning' : 'normal' },
          { label: 'Nhiệt độ ngăn đông', value: freezerTemp, unit: '°C', status: freezerTemp > -10 ? 'warning' : 'normal' },
          { label: 'Cửa tủ lạnh', value: device.fridge.doorAjar ? 'Đang mở (Cảnh báo)' : 'Đóng kín', status: device.fridge.doorAjar ? 'alert' : 'normal' },
          { label: 'Chế độ', value: device.fridge.ecoMode ? 'Eco Tiết kiệm' : 'Tiêu chuẩn', status: 'normal' }
        ];
      }

      // 3. Máy giặt (Washing Machine)
      if (device.type === 'washing_machine' && device.washingMachine) {
        // Nếu đang ở chế độ kết nối trực tiếp Live API với LG ThinQ, giữ nguyên trạng thái từ máy thật
        if (device.washingMachine.dataSource === 'live_api') {
          return updated;
        }

        let { state, remainingMinutes, drumCleanCycleCount, programName, doorLocked } = device.washingMachine;

        if (state === 'washing' || state === 'rinsing' || state === 'spinning') {
          if (remainingMinutes > 1) {
            remainingMinutes -= 1;
            if (remainingMinutes <= 10 && state === 'washing') state = 'rinsing';
            if (remainingMinutes <= 5 && state === 'rinsing') state = 'spinning';
          } else {
            // Hoàn thành chu trình
            state = 'completed';
            remainingMinutes = 0;
            doorLocked = false;
            drumCleanCycleCount += 1;

            const alert: IoTAlert = {
              id: `alert-washer-done-${Date.now()}`,
              level: 'info',
              message: `Máy giặt "${device.name}" đã hoàn thành chu trình giặt! Hãy lấy đồ đem phơi.`,
              timestamp: 'Vừa xong',
              actionRequired: 'Lấy đồ đem phơi'
            };
            updated.alerts = [alert, ...(updated.alerts || [])];
            newAlerts.push({ device: updated, alert });
          }
        }

        updated.washingMachine = {
          state,
          remainingMinutes,
          programName,
          doorLocked,
          drumCleanCycleCount
        };

        const stateLabel = state === 'washing' ? 'Đang giặt' :
                           state === 'rinsing' ? 'Đang xả nước' :
                           state === 'spinning' ? 'Đang vắt khô' :
                           state === 'completed' ? 'Đã hoàn tất' : 'Chờ lệnh';

        updated.metrics = [
          { label: 'Trạng thái', value: `${stateLabel} (${programName})`, status: state === 'completed' ? 'warning' : 'normal' },
          { label: 'Thời gian còn lại', value: remainingMinutes, unit: 'phút', status: 'normal' },
          { label: 'Cửa máy giặt', value: doorLocked ? 'Khóa an toàn' : 'Mở khóa', status: 'normal' },
          { label: 'Vệ sinh lồng giặt', value: `${drumCleanCycleCount}/30 lần`, status: drumCleanCycleCount > 25 ? 'warning' : 'normal' }
        ];
      }

      return updated;
    });

    return { updatedDevices, newAlerts };
  }
}
