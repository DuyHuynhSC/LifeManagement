import { IoTDevice, IoTProviderType } from '../../types';

export interface IoTCloudCredentials {
  smartThingsToken?: string;
  tuyaClientId?: string;
  tuyaClientSecret?: string;
  lgThinqToken?: string;
}

export interface IoTConnectionResult {
  success: boolean;
  message: string;
  deviceCount?: number;
  devices?: Partial<IoTDevice>[];
}

export interface IoTAdapter {
  provider: IoTProviderType;
  testConnection(credentials: IoTCloudCredentials): Promise<IoTConnectionResult>;
  syncDevices?(credentials: IoTCloudCredentials): Promise<Partial<IoTDevice>[]>;
  sendCommand?(deviceId: string, command: string, params?: any): Promise<boolean>;
}
