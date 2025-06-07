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
    checkPlatformSupport();
  }, []);

  const checkPlatformSupport = () => {
    if (Platform.OS === 'web') {
      setScanError('Bluetooth scanning requires a native mobile app');
      setIsBluetoothEnabled(false);
    } else {
      // Check if we're in Expo Go or development build
      setScanError('Real Bluetooth requires a development build with native modules');
      setIsBluetoothEnabled(false);
    }
  };

  const startScan = async (): Promise<void> => {
    if (isScanning) return;

    setScanError(null);

    if (Platform.OS === 'web') {
      setScanError('Bluetooth scanning not available on web platform');
      Alert.alert(
        'Platform Not Supported',
        'Bluetooth scanning is not available on web browsers. Please use the mobile app on iOS or Android.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Show development build requirement message
    Alert.alert(
      'Development Build Required',
      'Real Bluetooth scanning requires a development build with native modules.\n\nTo enable Bluetooth:\n\n1. Run: npx create-expo-app --template\n2. Add react-native-ble-manager\n3. Create development build with EAS\n4. Install on device\n\nFor now, this shows demo devices.',
      [
        { text: 'Learn More', onPress: () => {
          Alert.alert(
            'How to Enable Real Bluetooth',
            'Steps to get real Bluetooth working:\n\n1. Exit Expo Go\n2. Run: npx create-expo-app MyGolfApp\n3. Add: npx expo install react-native-ble-manager\n4. Configure permissions in app.json\n5. Run: npx eas build --profile development\n6. Install the .apk/.ipa on your device\n\nThen Bluetooth will work with real devices!',
            [{ text: 'Got it!' }]
          );
        }},
        { text: 'Show Demo', onPress: () => simulateDeviceDiscovery() }
      ]
    );
  };

  const simulateDeviceDiscovery = () => {
    setIsScanning(true);
    setDevices([]);
    setScanError(null);

    const demoDevices: BluetoothDevice[] = [
      {
        id: 'demo-phone-1',
        name: 'iPhone 15 Pro',
        rssi: -42,
      },
      {
        id: 'demo-watch-1',
        name: 'Apple Watch Series 9',
        rssi: -55,
      },
      {
        id: 'demo-headphones-1',
        name: 'AirPods Pro',
        rssi: -38,
      },
      {
        id: 'demo-phone-2',
        name: 'Galaxy S24 Ultra',
        rssi: -52,
      },
      {
        id: 'demo-headphones-2',
        name: 'Sony WH-1000XM5',
        rssi: -48,
      },
      {
        id: 'demo-watch-2',
        name: 'Garmin Approach S70',
        rssi: -61,
      },
      {
        id: 'demo-golf-1',
        name: 'Smart Golf Ball Pro',
        rssi: -67,
      },
      {
        id: 'demo-golf-2',
        name: 'Titleist Smart Ball',
        rssi: -58,
      },
    ];

    // Simulate gradual discovery
    demoDevices.forEach((device, index) => {
      setTimeout(() => {
        setDevices(prev => {
          if (prev.find(d => d.id === device.id)) {
            return prev;
          }
          console.log(`📱 Demo discovered: ${device.name}`);
          return [...prev, device];
        });
      }, (index + 1) * 800);
    });

    // Stop scanning after all devices are discovered
    setTimeout(() => {
      setIsScanning(false);
      console.log('✅ Demo scan completed');
    }, demoDevices.length * 800 + 1000);
  };

  const stopScan = async (): Promise<void> => {
    setIsScanning(false);
    console.log('⏹️ Scan stopped');
  };

  const checkBluetoothState = async () => {
    // For demo purposes, always return false since we don't have real Bluetooth
    setIsBluetoothEnabled(false);
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