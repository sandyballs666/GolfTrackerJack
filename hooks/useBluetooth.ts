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

  useEffect(() => {
    initializeBluetooth();
    
    return () => {
      if (isScanning) {
        stopScan();
      }
    };
  }, []);

  const initializeBluetooth = async () => {
    // Always start with demo mode enabled for safety
    setUseDemoMode(true);
    setIsBluetoothEnabled(true);

    if (Platform.OS === 'web') {
      // Web Bluetooth API check
      if (navigator.bluetooth) {
        setIsBluetoothEnabled(true);
      }
      return;
    }

    // For native platforms, try to check if BLE is available without initializing
    try {
      // Check if the module exists without importing it
      const hasBluetoothModule = await checkBluetoothModuleAvailability();
      
      if (hasBluetoothModule) {
        console.log('Bluetooth module available, attempting initialization...');
        await initializeNativeBluetooth();
      } else {
        console.log('Bluetooth module not available, using demo mode');
      }
    } catch (error) {
      console.log('Bluetooth initialization failed, using demo mode:', error);
      // Keep demo mode enabled
    }
  };

  const checkBluetoothModuleAvailability = async (): Promise<boolean> => {
    try {
      // Try to resolve the module without importing it
      const moduleExists = await new Promise((resolve) => {
        try {
          require.resolve('react-native-ble-manager');
          resolve(true);
        } catch {
          resolve(false);
        }
      });
      return moduleExists as boolean;
    } catch {
      return false;
    }
  };

  const initializeNativeBluetooth = async () => {
    try {
      // Only import if we're sure the module exists
      const BleManagerModule = require('react-native-ble-manager');
      const BleManager = BleManagerModule.default || BleManagerModule;
      
      if (!BleManager || typeof BleManager.start !== 'function') {
        throw new Error('BLE Manager not properly available');
      }

      // Try to start BLE Manager with timeout
      const initPromise = BleManager.start({ showAlert: false });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('BLE initialization timeout')), 5000)
      );

      await Promise.race([initPromise, timeoutPromise]);
      
      console.log('BLE Manager initialized successfully');
      setUseDemoMode(false); // Disable demo mode if real BLE works
      
      // Check Bluetooth state
      const state = await BleManager.checkState();
      setIsBluetoothEnabled(state === 'on');
      
    } catch (error) {
      console.log('Native Bluetooth initialization failed:', error);
      // Keep demo mode enabled
      setUseDemoMode(true);
      setIsBluetoothEnabled(true);
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
        'Bluetooth and location permissions are required to scan for devices.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isBluetoothEnabled) {
      Alert.alert(
        'Bluetooth Disabled',
        'Please enable Bluetooth to scan for devices.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsScanning(true);
    setDevices([]);

    if (useDemoMode || Platform.OS === 'web') {
      // Use demo mode or web Bluetooth
      if (Platform.OS === 'web' && navigator.bluetooth && !useDemoMode) {
        try {
          const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service', 'device_information']
          });

          if (device) {
            const webDevice: BluetoothDevice = {
              id: device.id,
              name: device.name || 'Unknown Device',
              rssi: -50,
            };
            setDevices([webDevice]);
          }
        } catch (error) {
          console.log('Web Bluetooth failed, using demo mode');
          simulateDeviceDiscovery();
        }
      } else {
        // Always use demo mode for safety
        simulateDeviceDiscovery();
      }
    } else {
      // Try native Bluetooth scanning
      try {
        const BleManagerModule = require('react-native-ble-manager');
        const BleManager = BleManagerModule.default || BleManagerModule;
        
        await BleManager.scan([], 10, true);
        
        const handleDiscoverPeripheral = (peripheral: any) => {
          const device: BluetoothDevice = {
            id: peripheral.id,
            name: peripheral.name || peripheral.advertising?.localName || 'Unknown Device',
            rssi: peripheral.rssi,
            advertising: peripheral.advertising,
          };

          setDevices(prevDevices => {
            const existingIndex = prevDevices.findIndex(d => d.id === device.id);
            if (existingIndex >= 0) {
              const updated = [...prevDevices];
              updated[existingIndex] = device;
              return updated;
            }
            return [...prevDevices, device];
          });
        };

        BleManager.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);

        setTimeout(() => {
          stopScan();
        }, 10000);

      } catch (error) {
        console.log('Native scan failed, falling back to demo mode:', error);
        setUseDemoMode(true);
        simulateDeviceDiscovery();
      }
    }
  };

  const stopScan = async (): Promise<void> => {
    if (!isScanning) return;

    setIsScanning(false);

    if (!useDemoMode && Platform.OS !== 'web') {
      try {
        const BleManagerModule = require('react-native-ble-manager');
        const BleManager = BleManagerModule.default || BleManagerModule;
        
        if (BleManager && typeof BleManager.stopScan === 'function') {
          await BleManager.stopScan();
          BleManager.removeAllListeners('BleManagerDiscoverPeripheral');
        }
      } catch (error) {
        console.log('Error stopping native scan:', error);
      }
    }
  };

  const simulateDeviceDiscovery = () => {
    console.log('Starting demo device discovery...');
    
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
        id: 'demo-airpods',
        name: 'AirPods Pro',
        rssi: -38,
      },
      {
        id: 'demo-watch',
        name: 'Apple Watch',
        rssi: -55,
      },
      {
        id: 'demo-phone',
        name: 'Samsung Galaxy S24',
        rssi: -42,
      },
      {
        id: 'demo-headphones',
        name: 'Sony WH-1000XM4',
        rssi: -58,
      },
    ];

    // Simulate gradual discovery
    demoDevices.forEach((device, index) => {
      setTimeout(() => {
        setDevices(prev => {
          // Check if device already exists
          if (prev.find(d => d.id === device.id)) {
            return prev;
          }
          return [...prev, device];
        });
      }, (index + 1) * 1000);
    });

    setTimeout(() => {
      setIsScanning(false);
    }, 7000);
  };

  const checkBluetoothState = async () => {
    if (useDemoMode || Platform.OS === 'web') {
      setIsBluetoothEnabled(true);
      return;
    }

    try {
      const BleManagerModule = require('react-native-ble-manager');
      const BleManager = BleManagerModule.default || BleManagerModule;
      
      if (BleManager && typeof BleManager.checkState === 'function') {
        const state = await BleManager.checkState();
        setIsBluetoothEnabled(state === 'on');
      }
    } catch (error) {
      console.log('Error checking Bluetooth state:', error);
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
    useDemoMode, // Expose demo mode status
  };
}