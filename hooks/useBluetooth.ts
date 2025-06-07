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
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [bleManager, setBleManager] = useState<any>(null);

  useEffect(() => {
    initializeBluetooth();
  }, []);

  const initializeBluetooth = async () => {
    try {
      // Try to import and initialize BLE Manager
      const BleManager = require('react-native-ble-manager');
      
      // Initialize BLE Manager
      await BleManager.start({ showAlert: false });
      setBleManager(BleManager);
      
      // Check initial Bluetooth state
      const isEnabled = await BleManager.checkState();
      setIsBluetoothEnabled(isEnabled === 'on');
      setUseDemoMode(false);
      
      console.log('✅ Real Bluetooth initialized successfully');
      
      // Listen for Bluetooth state changes
      const stateChangeListener = (args: any) => {
        setIsBluetoothEnabled(args.state === 'on');
      };
      
      // Note: In a real implementation, you'd add event listeners here
      // BleManager.addListener('BleManagerDidUpdateState', stateChangeListener);
      
    } catch (error) {
      console.log('⚠️ BLE Manager not available, using demo mode:', error);
      setUseDemoMode(true);
      setIsBluetoothEnabled(true); // Simulate enabled for demo
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ];

        // Add Bluetooth permissions for Android 12+
        if (Platform.Version >= 31) {
          permissions.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE
          );
        }

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'Bluetooth and location permissions are required to scan for nearby devices like golf balls, phones, and accessories.',
            [{ text: 'OK' }]
          );
        }

        return allGranted;
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    }

    // iOS permissions are handled automatically by the system
    return true;
  };

  const startScan = async (): Promise<void> => {
    if (isScanning) return;

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      return;
    }

    setIsScanning(true);
    setDevices([]);

    if (useDemoMode || !bleManager) {
      console.log('🔍 Starting demo device discovery...');
      simulateDeviceDiscovery();
      return;
    }

    try {
      console.log('🔍 Starting real Bluetooth scan...');
      
      // Clear previous devices
      setDevices([]);
      
      // Start scanning for all devices
      await bleManager.scan([], 10, true); // Scan for 10 seconds, allow duplicates
      
      // Set up device discovery listener
      const deviceDiscoveryListener = (device: any) => {
        if (device && device.id && device.name) {
          const newDevice: BluetoothDevice = {
            id: device.id,
            name: device.name || 'Unknown Device',
            rssi: device.rssi || -100,
            advertising: device.advertising,
          };
          
          setDevices(prev => {
            // Avoid duplicates
            if (prev.find(d => d.id === device.id)) {
              return prev.map(d => d.id === device.id ? newDevice : d);
            }
            console.log(`📱 Discovered: ${newDevice.name} (${newDevice.rssi}dBm)`);
            return [...prev, newDevice];
          });
        }
      };

      // Note: In a real implementation, you'd add the listener here
      // bleManager.addListener('BleManagerDiscoverPeripheral', deviceDiscoveryListener);
      
      // Stop scanning after timeout
      setTimeout(() => {
        stopScan();
      }, 10000);
      
    } catch (error) {
      console.error('Real Bluetooth scan error:', error);
      console.log('🔄 Falling back to demo mode...');
      setUseDemoMode(true);
      simulateDeviceDiscovery();
    }
  };

  const stopScan = async (): Promise<void> => {
    if (!isScanning) return;
    
    setIsScanning(false);
    
    if (bleManager && !useDemoMode) {
      try {
        await bleManager.stopScan();
        console.log('⏹️ Real Bluetooth scan stopped');
      } catch (error) {
        console.error('Stop scan error:', error);
      }
    } else {
      console.log('⏹️ Demo scan stopped');
    }
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
      {
        id: 'demo-titleist',
        name: 'Titleist Smart Ball',
        rssi: -67,
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
          console.log(`📱 Demo discovered: ${device.name}`);
          return [...prev, device];
        });
      }, (index + 1) * 600); // Stagger discovery every 600ms
    });

    // Stop scanning after all devices are discovered
    setTimeout(() => {
      setIsScanning(false);
      console.log('✅ Demo scan completed');
    }, demoDevices.length * 600 + 1000);
  };

  const checkBluetoothState = async () => {
    if (useDemoMode || !bleManager) {
      setIsBluetoothEnabled(true);
      return;
    }

    try {
      const state = await bleManager.checkState();
      setIsBluetoothEnabled(state === 'on');
    } catch (error) {
      console.error('Bluetooth state check error:', error);
      setIsBluetoothEnabled(false);
    }
  };

  return {
    isScanning,
    devices,
    isBluetoothEnabled,
    startScan,
    stopScan,
    checkBluetoothState,
    useDemoMode,
  };
}