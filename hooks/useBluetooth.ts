import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { useNativeBluetooth } from './useNativeBluetooth';

export interface BluetoothDevice {
  id: string;
  name: string;
  rssi: number;
  advertising?: {
    localName?: string;
    manufacturerData?: any;
    serviceUUIDs?: string[];
  };
}

export function useBluetooth() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Use native Bluetooth hook for mobile platforms
  const nativeBluetooth = useNativeBluetooth();

  useEffect(() => {
    if (Platform.OS === 'web') {
      initializeWebBluetooth();
    }
  }, []);

  // For native platforms, use the native Bluetooth hook
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsScanning(nativeBluetooth.isScanning);
      setDevices(nativeBluetooth.devices);
      setIsBluetoothEnabled(nativeBluetooth.isBluetoothEnabled);
      setScanError(nativeBluetooth.scanError);
    }
  }, [
    nativeBluetooth.isScanning,
    nativeBluetooth.devices,
    nativeBluetooth.isBluetoothEnabled,
    nativeBluetooth.scanError
  ]);

  const initializeWebBluetooth = async () => {
    if ('bluetooth' in navigator) {
      setIsBluetoothEnabled(true);
      setScanError(null);
      console.log('✅ Web Bluetooth API available');
    } else {
      setScanError('Web Bluetooth API not supported in this browser. Try Chrome or Edge.');
      setIsBluetoothEnabled(false);
    }
  };

  const startScan = async (): Promise<void> => {
    if (Platform.OS === 'web') {
      await startWebBluetoothScan();
    } else {
      if (nativeBluetooth.isNativeBluetoothAvailable) {
        await nativeBluetooth.startScan();
      } else {
        showDevelopmentBuildInstructions();
      }
    }
  };

  const startWebBluetoothScan = async () => {
    if (isScanning) return;

    setScanError(null);
    setIsScanning(true);
    setDevices([]);

    try {
      if (!('bluetooth' in navigator)) {
        throw new Error('Web Bluetooth not supported');
      }

      console.log('🔍 Starting Web Bluetooth scan...');

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'device_information',
          'generic_access',
          'generic_attribute',
          'heart_rate',
          'human_interface_device',
          '0000180f-0000-1000-8000-00805f9b34fb',
          '0000180a-0000-1000-8000-00805f9b34fb',
        ]
      });

      if (device) {
        let rssi = -50;
        let services: string[] = [];

        try {
          const server = await device.gatt?.connect();
          if (server) {
            const primaryServices = await server.getPrimaryServices();
            services = primaryServices.map(service => service.uuid);
            console.log('📡 Connected to device, found services:', services);
            server.disconnect();
          }
        } catch (connectError) {
          console.log('Could not connect to device for additional info:', connectError);
        }

        const newDevice: BluetoothDevice = {
          id: device.id || Math.random().toString(36),
          name: device.name || 'Unknown Device',
          rssi: rssi,
          advertising: {
            localName: device.name,
            serviceUUIDs: services
          }
        };

        setDevices([newDevice]);
        console.log('📱 Real Bluetooth device discovered:', newDevice.name);
        
        Alert.alert(
          '✅ Real Device Found!',
          `Successfully discovered: ${newDevice.name}\n\nThis is a real Bluetooth device near you! You can now navigate to it using turn-by-turn directions.`,
          [{ text: 'Great!' }]
        );
      }

      setIsScanning(false);
    } catch (error: any) {
      console.error('Web Bluetooth error:', error);
      if (error.name === 'NotFoundError') {
        setScanError('No devices selected or scan cancelled');
      } else if (error.name === 'SecurityError') {
        setScanError('Bluetooth access denied. Please allow Bluetooth access.');
      } else {
        setScanError(`Web Bluetooth error: ${error.message}`);
      }
      setIsScanning(false);
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
      'The development build includes react-native-ble-manager for real device scanning!',
      [{ text: 'Got it!' }]
    );
  };

  const stopScan = async (): Promise<void> => {
    if (Platform.OS === 'web') {
      setIsScanning(false);
      console.log('⏹️ Web Bluetooth scan stopped');
    } else {
      await nativeBluetooth.stopScan();
    }
  };

  const checkBluetoothState = async () => {
    if (Platform.OS === 'web') {
      setIsBluetoothEnabled('bluetooth' in navigator);
    }
    // Native state is handled by the native hook
  };

  return {
    isScanning,
    devices,
    isBluetoothEnabled,
    startScan,
    stopScan,
    checkBluetoothState,
    scanError,
  };
}