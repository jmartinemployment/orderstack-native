import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

const DEVICE_ID_KEY = 'orderstack-device-id';

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const uniqueId = await DeviceInfo.getUniqueId();
  const deviceId = `pos-${uniqueId}-${Date.now()}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  cachedDeviceId = deviceId;
  return deviceId;
}

export async function getDeviceInfo(): Promise<{
  model: string;
  systemName: string;
  systemVersion: string;
  isTablet: boolean;
}> {
  return {
    model: DeviceInfo.getModel(),
    systemName: DeviceInfo.getSystemName(),
    systemVersion: DeviceInfo.getSystemVersion(),
    isTablet: DeviceInfo.isTablet(),
  };
}
