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
        setScanError('Web Bluetooth API not supported in this browser');
        setIsBluetoothEnabled(false);
      }
      return;
    }

    // For native platforms, we'll use a different approach
    // Since react-native-ble-manager requires native code, we'll implement
    // a solution that works with Expo's managed workflow
    setIsBluetoothEnabled(true);
    setScanError(null);
    console.log('✅ Bluetooth initialized for native platform');
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

      // Request device with basic services
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      if (device) {
        const newDevice: BluetoothDevice = {
          id: device.id || Math.random().toString(36),
          name: device.name || 'Unknown Device',
          rssi: -50, // Web Bluetooth doesn't provide RSSI
          advertising: {
            localName: device.name
          }
        };

        setDevices([newDevice]);
        console.log('📱 Web Bluetooth device discovered:', newDevice.name);
      }

      setIsScanning(false);
    } catch (error) {
      console.error('Web Bluetooth error:', error);
      if (error.name === 'NotFoundError') {
        setScanError('No devices found or scan cancelled');
      } else {
        setScanError('Web Bluetooth scan failed');
      }
      setIsScanning(false);
    }
  };

  const startNativeBluetoothScan = async () => {
    // For native platforms without react-native-ble-manager,
    // we'll simulate device discovery for demonstration
    // In a real app, you'd need to eject from Expo or use a custom development build

    Alert.alert(
      '📱 Native Bluetooth Scanning',
      'To scan for real Bluetooth devices on mobile, this app needs:\n\n1. A custom development build (not Expo Go)\n2. Native Bluetooth permissions\n3. react-native-ble-manager properly linked\n\nFor now, I\'ll demonstrate with simulated nearby devices.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsScanning(false) },
        { text: 'Show Demo', onPress: () => simulateDeviceDiscovery() }
      ]
    );
  };

  const simulateDeviceDiscovery = () => {
    // Simulate discovering real-looking devices
    const simulatedDevices: BluetoothDevice[] = [
      {
        id: 'iphone-12-pro',
        name: 'iPhone 12 Pro',
        rssi: -45,
        advertising: { localName: 'iPhone 12 Pro' }
      },
      {
        id: 'airpods-pro',
        name: 'AirPods Pro',
        rssi: -38,
        advertising: { localName: 'AirPods Pro' }
      },
      {
        id: 'apple-watch',
        name: 'Apple Watch Series 8',
        rssi: -52,
        advertising: { localName: 'Apple Watch' }
      },
      {
        id: 'golf-ball-tracker',
        name: 'Smart Golf Ball',
        rssi: -65,
        advertising: { localName: 'Golf Ball Tracker' }
      },
      {
        id: 'samsung-galaxy',
        name: 'Galaxy S23',
        rssi: -48,
        advertising: { localName: 'Samsung Galaxy' }
      }
    ];

    // Simulate gradual device discovery
    simulatedDevices.forEach((device, index) => {
      setTimeout(() => {
        setDevices(prev => [...prev, device]);
        console.log(`📱 Simulated device discovered: ${device.name} (${device.rssi}dBm)`);
        
        if (index === simulatedDevices.length - 1) {
          setTimeout(() => setIsScanning(false), 1000);
        }
      }, (index + 1) * 1500);
    });
  };

  const stopScan = async (): Promise<void> => {
    setIsScanning(false);
    console.log('⏹️ Bluetooth scan stopped');
  };

  const checkBluetoothState = async () => {
    if (Platform.OS === 'web') {
      setIsBluetoothEnabled('bluetooth' in navigator);
    } else {
      // For native platforms, assume Bluetooth is available
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