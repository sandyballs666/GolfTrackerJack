import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { BluetoothDevice } from './useBluetooth';

export function useNativeBluetooth() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Check if we're in a development build
      checkDevelopmentBuild();
    }
  }, []);

  const checkDevelopmentBuild = () => {
    // In a development build, react-native-ble-manager would be available
    // For now, we'll simulate this check
    const isDevelopmentBuild = false; // This would be true in an actual dev build
    
    if (!isDevelopmentBuild) {
      setScanError('Development build required for native Bluetooth scanning');
      setIsBluetoothEnabled(false);
    } else {
      setIsBluetoothEnabled(true);
      setScanError(null);
    }
  };

  const showDevelopmentBuildInstructions = () => {
    Alert.alert(
      '🛠️ Development Build Required',
      'To scan for real Bluetooth devices on mobile:\n\n' +
      '1. Install EAS CLI: npm install -g @expo/cli\n' +
      '2. Run: eas build --profile development\n' +
      '3. Install the generated APK/IPA on your device\n' +
      '4. Open the app from the development build\n\n' +
      'The development build will include react-native-ble-manager for real device scanning!',
      [{ text: 'Got it!' }]
    );
  };

  const startScan = async (): Promise<void> => {
    showDevelopmentBuildInstructions();
  };

  const stopScan = async (): Promise<void> => {
    setIsScanning(false);
  };

  const connectToDevice = async (deviceId: string): Promise<boolean> => {
    return false;
  };

  const disconnectFromDevice = async (deviceId: string): Promise<void> => {
    // No-op for now
  };

  return {
    isScanning,
    devices,
    isBluetoothEnabled,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    scanError,
    isNativeBluetoothAvailable: false,
  };
}