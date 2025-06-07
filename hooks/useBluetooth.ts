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
  }, []);

  const initializeBluetooth = async () => {
    try {
      // Import BLE Manager
      const BleManager = require('react-native-ble-manager');
      
      // Initialize BLE Manager
      await BleManager.start({ showAlert: false });
      setBleManager(BleManager);
      
      // Check initial Bluetooth state
      const isEnabled = await BleManager.checkState();
      setIsBluetoothEnabled(isEnabled === 'on');
      setScanError(null);
      
      console.log('✅ Bluetooth initialized successfully');
      
    } catch (error) {
      console.error('❌ Bluetooth initialization failed:', error);
      setScanError('Bluetooth not available on this device');
      setIsBluetoothEnabled(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setScanError('Bluetooth scanning not available on web platform');
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
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE
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
            'Bluetooth and location permissions are required to scan for nearby devices like golf balls, phones, and accessories.',
            [{ text: 'OK' }]
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
      setScanError('Bluetooth not initialized');
      return;
    }

    if (!isBluetoothEnabled) {
      setScanError('Please enable Bluetooth to scan for devices');
      Alert.alert(
        'Bluetooth Required',
        'Please enable Bluetooth in your device settings to scan for nearby devices.',
        [{ text: 'OK' }]
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
      
      // Start scanning for all devices
      await bleManager.scan([], 15, true); // Scan for 15 seconds, allow duplicates
      
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

      // Add event listeners
      bleManager.addListener('BleManagerDiscoverPeripheral', deviceDiscoveryListener);
      
      // Set up scan stop listener
      const scanStopListener = () => {
        console.log('⏹️ Bluetooth scan completed');
        setIsScanning(false);
        bleManager.removeListener('BleManagerDiscoverPeripheral', deviceDiscoveryListener);
        bleManager.removeListener('BleManagerStopScan', scanStopListener);
      };
      
      bleManager.addListener('BleManagerStopScan', scanStopListener);
      
      // Auto-stop scanning after timeout
      setTimeout(() => {
        if (isScanning) {
          stopScan();
        }
      }, 15000);
      
    } catch (error) {
      console.error('Bluetooth scan error:', error);
      setScanError('Failed to start Bluetooth scan');
      setIsScanning(false);
      
      Alert.alert(
        'Scan Error',
        'Failed to start Bluetooth scan. Please check your Bluetooth settings and try again.',
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