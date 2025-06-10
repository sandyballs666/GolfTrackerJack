import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { BluetoothDevice } from './useBluetooth';

// Only import BleManager on native platforms and in development builds
let BleManager: any = null;
if (Platform.OS !== 'web') {
  try {
    // Only attempt to import in development builds
    if (__DEV__) {
      BleManager = require('react-native-ble-manager');
    }
  } catch (error) {
    console.log('react-native-ble-manager not available in this build');
  }
}

export function useNativeBluetooth() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' && BleManager) {
      initializeBluetooth();
    } else if (Platform.OS !== 'web') {
      setScanError('Development build required for native Bluetooth scanning');
    }
  }, []);

  const initializeBluetooth = async () => {
    try {
      if (!BleManager) {
        setScanError('react-native-ble-manager not available in this build');
        return;
      }

      // Request permissions on Android
      if (Platform.OS === 'android') {
        const granted = await requestBluetoothPermissions();
        if (!granted) {
          setScanError('Bluetooth permissions not granted');
          return;
        }
      }

      // Initialize BLE Manager
      await BleManager.start({ showAlert: false });
      
      // Check if Bluetooth is enabled
      const isEnabled = await BleManager.checkState();
      setIsBluetoothEnabled(isEnabled === 'on');
      
      if (isEnabled !== 'on') {
        setScanError('Please enable Bluetooth to scan for devices');
        return;
      }

      console.log('✅ Native Bluetooth initialized successfully');
      setScanError(null);

      // Set up event listeners
      setupEventListeners();

    } catch (error) {
      console.error('Bluetooth initialization error:', error);
      setScanError('Failed to initialize Bluetooth');
    }
  };

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      return Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  };

  const setupEventListeners = () => {
    if (!BleManager) return;

    // Device discovered
    BleManager.addListener('BleManagerDiscoverPeripheral', (device: any) => {
      console.log('📱 Device discovered:', device.name || device.id);
      
      const newDevice: BluetoothDevice = {
        id: device.id,
        name: device.name || 'Unknown Device',
        rssi: device.rssi || -100,
        advertising: {
          localName: device.name,
          manufacturerData: device.advertising?.manufacturerData,
          serviceUUIDs: device.advertising?.serviceUUIDs,
        }
      };

      setDevices(prevDevices => {
        // Check if device already exists
        const existingIndex = prevDevices.findIndex(d => d.id === newDevice.id);
        if (existingIndex >= 0) {
          // Update existing device
          const updated = [...prevDevices];
          updated[existingIndex] = newDevice;
          return updated;
        } else {
          // Add new device
          return [...prevDevices, newDevice];
        }
      });
    });

    // Scan stopped
    BleManager.addListener('BleManagerStopScan', () => {
      console.log('⏹️ Scan stopped');
      setIsScanning(false);
    });

    // Bluetooth state changed
    BleManager.addListener('BleManagerDidUpdateState', (args: any) => {
      console.log('Bluetooth state changed:', args.state);
      setIsBluetoothEnabled(args.state === 'on');
    });
  };

  const startScan = async (): Promise<void> => {
    if (!BleManager) {
      showDevelopmentBuildInstructions();
      return;
    }

    if (isScanning) return;

    try {
      setScanError(null);
      setIsScanning(true);
      setDevices([]);

      // Check Bluetooth state
      const state = await BleManager.checkState();
      if (state !== 'on') {
        throw new Error('Bluetooth is not enabled');
      }

      console.log('🔍 Starting native Bluetooth scan...');
      
      // Start scanning for 10 seconds
      await BleManager.scan([], 10, true);
      
      Alert.alert(
        '🔍 Scanning Started',
        'Scanning for nearby Bluetooth devices...\n\nThis will discover real devices like phones, headphones, watches, and smart golf equipment.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('Scan start error:', error);
      setScanError(`Scan failed: ${error.message}`);
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
    if (!BleManager) return;

    try {
      await BleManager.stopScan();
      setIsScanning(false);
      console.log('⏹️ Native Bluetooth scan stopped');
    } catch (error) {
      console.error('Stop scan error:', error);
    }
  };

  const connectToDevice = async (deviceId: string): Promise<boolean> => {
    if (!BleManager) return false;

    try {
      console.log(`🔗 Connecting to device: ${deviceId}`);
      await BleManager.connect(deviceId);
      console.log('✅ Connected successfully');
      return true;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  };

  const disconnectFromDevice = async (deviceId: string): Promise<void> => {
    if (!BleManager) return;

    try {
      await BleManager.disconnect(deviceId);
      console.log('🔌 Disconnected from device');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
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
    isNativeBluetoothAvailable: !!BleManager,
  };
}