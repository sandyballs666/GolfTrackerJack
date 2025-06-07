import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

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
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(true);
  const [useDemoMode, setUseDemoMode] = useState(true); // Always start in demo mode

  useEffect(() => {
    // Always use demo mode for maximum safety
    console.log('Bluetooth hook initialized in demo mode');
    setUseDemoMode(true);
    setIsBluetoothEnabled(true);
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        // Add Bluetooth permissions for Android 12+
        if (Platform.Version >= 31) {
          permissions.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          );
        }

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        return Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    }

    return true;
  };

  const startScan = async (): Promise<void> => {
    if (isScanning) return;

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert(
        'Permissions Required',
        'Location permissions are required to scan for devices.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsScanning(true);
    setDevices([]);

    // Always use demo mode for safety
    console.log('Starting demo device discovery...');
    simulateDeviceDiscovery();
  };

  const stopScan = async (): Promise<void> => {
    if (!isScanning) return;
    setIsScanning(false);
    console.log('Scan stopped');
  };

  const simulateDeviceDiscovery = () => {
    const demoDevices: BluetoothDevice[] = [
      {
        id: 'demo-golf-ball-1',
        name: 'Smart Golf Ball #1',
        rssi: -45,
      },
      {
        id: 'demo-golf-ball-2',
        name: 'Smart Golf Ball #2',
        rssi: -62,
      },
      {
        id: 'demo-golf-ball-3',
        name: 'ProV1 Smart Ball',
        rssi: -58,
      },
      {
        id: 'demo-airpods',
        name: 'AirPods Pro',
        rssi: -38,
      },
      {
        id: 'demo-watch',
        name: 'Apple Watch Series 9',
        rssi: -55,
      },
      {
        id: 'demo-phone',
        name: 'iPhone 15 Pro',
        rssi: -42,
      },
      {
        id: 'demo-headphones',
        name: 'Sony WH-1000XM5',
        rssi: -48,
      },
      {
        id: 'demo-samsung',
        name: 'Galaxy S24 Ultra',
        rssi: -52,
      },
      {
        id: 'demo-garmin',
        name: 'Garmin Approach S70',
        rssi: -61,
      },
    ];

    // Simulate gradual discovery with realistic timing
    demoDevices.forEach((device, index) => {
      setTimeout(() => {
        setDevices(prev => {
          // Check if device already exists
          if (prev.find(d => d.id === device.id)) {
            return prev;
          }
          console.log(`Discovered demo device: ${device.name}`);
          return [...prev, device];
        });
      }, (index + 1) * 800); // Stagger discovery every 800ms
    });

    // Stop scanning after all devices are discovered
    setTimeout(() => {
      setIsScanning(false);
      console.log('Demo scan completed');
    }, demoDevices.length * 800 + 1000);
  };

  const checkBluetoothState = async () => {
    // Always report as enabled in demo mode
    setIsBluetoothEnabled(true);
  };

  return {
    isScanning,
    devices,
    isBluetoothEnabled,
    startScan,
    stopScan,
    checkBluetoothState,
    useDemoMode: true, // Always in demo mode
  };
}