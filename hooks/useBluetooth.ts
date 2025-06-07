import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import BleManager from 'react-native-ble-manager';

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

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web Bluetooth API fallback
      setIsBluetoothEnabled(!!navigator.bluetooth);
      return;
    }

    // Initialize BLE Manager for native platforms
    BleManager.start({ showAlert: false })
      .then(() => {
        console.log('BLE Manager initialized');
        checkBluetoothState();
      })
      .catch((error) => {
        console.error('BLE Manager initialization error:', error);
      });

    return () => {
      if (isScanning) {
        stopScan();
      }
    };
  }, []);

  const checkBluetoothState = async () => {
    if (Platform.OS === 'web') {
      setIsBluetoothEnabled(!!navigator.bluetooth);
      return;
    }

    try {
      const state = await BleManager.checkState();
      setIsBluetoothEnabled(state === 'on');
    } catch (error) {
      console.error('Error checking Bluetooth state:', error);
      setIsBluetoothEnabled(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return true; // Web handles permissions through browser
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (error) {
        console.error('Permission request error:', error);
        return false;
      }
    }

    return true; // iOS handles permissions automatically
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

    if (Platform.OS === 'web') {
      // Web Bluetooth API implementation
      try {
        if (!navigator.bluetooth) {
          throw new Error('Web Bluetooth not supported');
        }

        // Request device with basic services
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'device_information']
        });

        if (device) {
          const webDevice: BluetoothDevice = {
            id: device.id,
            name: device.name || 'Unknown Device',
            rssi: -50, // Web Bluetooth doesn't provide RSSI
          };
          setDevices([webDevice]);
        }
      } catch (error) {
        console.error('Web Bluetooth scan error:', error);
        // Fallback to demo devices for web
        simulateDeviceDiscovery();
      } finally {
        setIsScanning(false);
      }
    } else {
      // Native Bluetooth implementation
      try {
        await BleManager.scan([], 10, true);
        
        // Listen for discovered devices
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

        // Stop scanning after 10 seconds
        setTimeout(() => {
          stopScan();
        }, 10000);

      } catch (error) {
        console.error('Native Bluetooth scan error:', error);
        setIsScanning(false);
        // Fallback to demo devices
        simulateDeviceDiscovery();
      }
    }
  };

  const stopScan = async (): Promise<void> => {
    if (!isScanning) return;

    setIsScanning(false);

    if (Platform.OS !== 'web') {
      try {
        await BleManager.stopScan();
        BleManager.removeAllListeners('BleManagerDiscoverPeripheral');
      } catch (error) {
        console.error('Error stopping scan:', error);
      }
    }
  };

  const simulateDeviceDiscovery = () => {
    // Fallback demo devices for when real Bluetooth isn't available
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
    ];

    // Simulate gradual discovery
    demoDevices.forEach((device, index) => {
      setTimeout(() => {
        setDevices(prev => [...prev, device]);
      }, (index + 1) * 1000);
    });

    setTimeout(() => {
      setIsScanning(false);
    }, 5000);
  };

  return {
    isScanning,
    devices,
    isBluetoothEnabled,
    startScan,
    stopScan,
    checkBluetoothState,
  };
}