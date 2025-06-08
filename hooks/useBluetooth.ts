import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';

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

  useEffect(() => {
    initializeBluetooth();
  }, []);

  const initializeBluetooth = async () => {
    if (Platform.OS === 'web') {
      // Check for Web Bluetooth API support
      if ('bluetooth' in navigator) {
        setIsBluetoothEnabled(true);
        setScanError(null);
        console.log('✅ Web Bluetooth API available');
      } else {
        setScanError('Web Bluetooth API not supported in this browser. Try Chrome or Edge.');
        setIsBluetoothEnabled(false);
      }
      return;
    }

    // For native platforms in Expo Go, we can't access real Bluetooth
    // But we'll prepare for when they create a development build
    setIsBluetoothEnabled(true);
    setScanError(null);
    console.log('✅ Bluetooth ready for development build');
  };

  const startScan = async (): Promise<void> => {
    if (isScanning) return;

    setScanError(null);
    setIsScanning(true);
    setDevices([]);

    try {
      if (Platform.OS === 'web') {
        await startWebBluetoothScan();
      } else {
        await startNativeBluetoothScan();
      }
    } catch (error) {
      console.error('Bluetooth scan error:', error);
      setScanError('Failed to start Bluetooth scan');
      setIsScanning(false);
    }
  };

  const startWebBluetoothScan = async () => {
    try {
      if (!('bluetooth' in navigator)) {
        throw new Error('Web Bluetooth not supported');
      }

      console.log('🔍 Starting Web Bluetooth scan...');

      // Request device with broad service filters to find more devices
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'device_information',
          'generic_access',
          'generic_attribute',
          'heart_rate',
          'human_interface_device',
          '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
          '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
        ]
      });

      if (device) {
        // Try to connect to get more information
        let rssi = -50; // Default RSSI since Web Bluetooth doesn't provide it
        let services: string[] = [];

        try {
          const server = await device.gatt?.connect();
          if (server) {
            // Try to get available services
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

  const startNativeBluetoothScan = async () => {
    // Check if we're in Expo Go vs development build
    const isExpoGo = __DEV__ && !process.env.EXPO_CUSTOM_BUILD;
    
    if (isExpoGo) {
      Alert.alert(
        '📱 Real Bluetooth Scanning Requires Development Build',
        'To scan for real Bluetooth devices on mobile:\n\n' +
        '1. Create an EAS development build\n' +
        '2. Install react-native-ble-manager\n' +
        '3. Add Bluetooth permissions\n\n' +
        'Current Expo Go limitations prevent real device scanning.\n\n' +
        'Would you like to see the setup instructions?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsScanning(false) },
          { 
            text: 'Show Instructions', 
            onPress: () => {
              setIsScanning(false);
              showDevelopmentBuildInstructions();
            }
          }
        ]
      );
      return;
    }

    // If we're in a development build, try to use react-native-ble-manager
    try {
      // This would be the real implementation with react-native-ble-manager
      // const BleManager = require('react-native-ble-manager');
      // await BleManager.start();
      // await BleManager.scan([], 10, true);
      
      setScanError('Development build detected but react-native-ble-manager not configured');
      setIsScanning(false);
    } catch (error) {
      setScanError('Native Bluetooth scanning not available');
      setIsScanning(false);
    }
  };

  const showDevelopmentBuildInstructions = () => {
    Alert.alert(
      '🛠️ Development Build Setup',
      'To enable real Bluetooth scanning:\n\n' +
      '1. Run: eas build --profile development\n' +
      '2. Install: npm install react-native-ble-manager\n' +
      '3. Add to app.json plugins:\n' +
      '   ["react-native-ble-manager"]\n' +
      '4. Add permissions to app.json\n' +
      '5. Rebuild and install on device\n\n' +
      'Then you\'ll have full native Bluetooth access!',
      [{ text: 'Got it!' }]
    );
  };

  const stopScan = async (): Promise<void> => {
    setIsScanning(false);
    console.log('⏹️ Bluetooth scan stopped');
  };

  const checkBluetoothState = async () => {
    if (Platform.OS === 'web') {
      setIsBluetoothEnabled('bluetooth' in navigator);
    } else {
      setIsBluetoothEnabled(true);
    }
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