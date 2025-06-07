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
  const [bleManager, setBleManager] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    initializeBluetooth();
    return () => {
      // Cleanup listeners on unmount
      if (bleManager) {
        try {
          bleManager.removeAllListeners('BleManagerDiscoverPeripheral');
          bleManager.removeAllListeners('BleManagerStopScan');
          bleManager.removeAllListeners('BleManagerDidUpdateState');
        } catch (error) {
          console.log('Cleanup error:', error);
        }
      }
    };
  }, []);

  const initializeBluetooth = async () => {
    if (Platform.OS === 'web') {
      setScanError('Bluetooth scanning requires a native mobile app (iOS/Android)');
      return;
    }

    try {
      // Dynamic import for react-native-ble-manager
      const BleManager = require('react-native-ble-manager');
      
      // Initialize BLE Manager
      await BleManager.start({ showAlert: false });
      setBleManager(BleManager);
      
      // Set up state change listener
      const stateChangeListener = (args: any) => {
        console.log('Bluetooth state changed:', args.state);
        setIsBluetoothEnabled(args.state === 'on');
      };
      
      BleManager.addListener('BleManagerDidUpdateState', stateChangeListener);
      
      // Check initial Bluetooth state
      const state = await BleManager.checkState();
      setIsBluetoothEnabled(state === 'on');
      setScanError(null);
      
      console.log('✅ Bluetooth initialized successfully, state:', state);
      
    } catch (error) {
      console.error('❌ Bluetooth initialization failed:', error);
      setScanError('Bluetooth not available. Please ensure you have a development build with react-native-ble-manager.');
      setIsBluetoothEnabled(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setScanError('Bluetooth scanning not available on web platform');
      Alert.alert(
        'Platform Not Supported',
        'Bluetooth scanning requires a native mobile app. Please use this app on iOS or Android.',
        [{ text: 'OK' }]
      );
      return false;
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
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          );
        }

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          setScanError('Bluetooth and location permissions are required');
          Alert.alert(
            'Permissions Required',
            'This app needs Bluetooth and location permissions to scan for nearby devices like golf balls, phones, and accessories.\n\nPlease grant all permissions to continue.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                // You could open app settings here
                Alert.alert('Please enable permissions in your device settings');
              }}
            ]
          );
        }

        return allGranted;
      } catch (error) {
        console.error('Permission request error:', error);
        setScanError('Failed to request permissions');
        return false;
      }
    }

    // iOS permissions are handled automatically by the system
    return true;
  };

  const startScan = async (): Promise<void> => {
    if (isScanning) return;

    setScanError(null);

    if (!bleManager) {
      setScanError('Bluetooth not initialized. Please restart the app.');
      Alert.alert(
        'Bluetooth Error',
        'Bluetooth is not properly initialized. This usually means you need a development build with react-native-ble-manager.\n\nTo fix this:\n1. Create a development build\n2. Install react-native-ble-manager\n3. Test on a physical device',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isBluetoothEnabled) {
      setScanError('Please enable Bluetooth to scan for devices');
      Alert.alert(
        'Bluetooth Required',
        'Please enable Bluetooth in your device settings to scan for nearby devices.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Check Settings', onPress: () => {
            // Could open Bluetooth settings here
            Alert.alert('Please enable Bluetooth in your device settings');
          }}
        ]
      );
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      return;
    }

    setIsScanning(true);
    setDevices([]);

    try {
      console.log('🔍 Starting real Bluetooth scan...');
      
      // Clear any existing listeners
      bleManager.removeAllListeners('BleManagerDiscoverPeripheral');
      bleManager.removeAllListeners('BleManagerStopScan');
      
      // Set up device discovery listener
      const deviceDiscoveryListener = (device: any) => {
        if (device && device.id) {
          const deviceName = device.name || device.advertising?.localName || `Device ${device.id.slice(-4)}`;
          
          const newDevice: BluetoothDevice = {
            id: device.id,
            name: deviceName,
            rssi: device.rssi || -100,
            advertising: device.advertising,
          };
          
          setDevices(prev => {
            // Update existing device or add new one
            const existingIndex = prev.findIndex(d => d.id === device.id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = newDevice;
              return updated;
            }
            console.log(`📱 Discovered: ${newDevice.name} (${newDevice.rssi}dBm)`);
            return [...prev, newDevice];
          });
        }
      };

      // Set up scan stop listener
      const scanStopListener = () => {
        console.log('⏹️ Bluetooth scan completed');
        setIsScanning(false);
      };
      
      // Add event listeners
      bleManager.addListener('BleManagerDiscoverPeripheral', deviceDiscoveryListener);
      bleManager.addListener('BleManagerStopScan', scanStopListener);
      
      // Start scanning for all devices (empty array means scan for all)
      await bleManager.scan([], 15, true); // Scan for 15 seconds, allow duplicates
      
      // Show success message
      Alert.alert(
        '🔍 Scanning Started',
        'Scanning for nearby Bluetooth devices including phones, watches, headphones, and smart golf equipment...\n\nDevices will appear as they are discovered.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Bluetooth scan error:', error);
      setScanError('Failed to start Bluetooth scan');
      setIsScanning(false);
      
      Alert.alert(
        'Scan Error',
        'Failed to start Bluetooth scan. Please check that:\n\n• Bluetooth is enabled\n• Location permissions are granted\n• You are using a development build\n\nTry restarting the app if the issue persists.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopScan = async (): Promise<void> => {
    if (!isScanning || !bleManager) return;
    
    try {
      await bleManager.stopScan();
      console.log('⏹️ Bluetooth scan stopped manually');
    } catch (error) {
      console.error('Stop scan error:', error);
    }
    
    setIsScanning(false);
  };

  const checkBluetoothState = async () => {
    if (!bleManager) {
      setIsBluetoothEnabled(false);
      return;
    }

    try {
      const state = await bleManager.checkState();
      setIsBluetoothEnabled(state === 'on');
      console.log('Bluetooth state check:', state);
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
    scanError,
  };
}