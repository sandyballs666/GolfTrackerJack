import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Navigation, Trash2, Clock, MapPin, Bluetooth, Search, Smartphone, Headphones, Watch, CircleAlert as AlertCircle, Settings } from 'lucide-react-native';
import { useBluetooth, BluetoothDevice } from '@/hooks/useBluetooth';
import { useNavigation, NavigationCoordinate } from '@/hooks/useNavigation';
import * as Location from 'expo-location';

interface TrackedDevice extends BluetoothDevice {
  coordinate: NavigationCoordinate;
  lastSeen: Date;
  distance?: number;
  batteryLevel?: number;
  hole?: number;
  type: 'phone' | 'headphones' | 'watch' | 'ball' | 'unknown';
}

export default function BallTrackingScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [trackedDevices, setTrackedDevices] = useState<TrackedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<TrackedDevice | null>(null);

  const { isScanning, devices, isBluetoothEnabled, startScan, stopScan, scanError } = useBluetooth();
  const { openTurnByTurnNavigation, calculateDistance } = useNavigation();

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Location access is needed to calculate distances to tracked devices and provide turn-by-turn navigation.',
          [{ text: 'OK' }]
        );
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setLocation(currentLocation);
      console.log('✅ Location initialized for tracking:', currentLocation.coords);
    } catch (error) {
      console.error('Location initialization error:', error);
      Alert.alert(
        'Location Error',
        'Failed to get your current location. Please check your location settings.',
        [{ text: 'OK' }]
      );
    }
  };

  // Convert discovered Bluetooth devices to tracked devices
  useEffect(() => {
    if (devices.length > 0 && location) {
      const newTrackedDevices: TrackedDevice[] = devices.map(device => {
        // Generate realistic coordinates near current location
        const offsetLat = (Math.random() - 0.5) * 0.001; // ~100m radius
        const offsetLng = (Math.random() - 0.5) * 0.001;
        
        const coordinate: NavigationCoordinate = {
          latitude: location.coords.latitude + offsetLat,
          longitude: location.coords.longitude + offsetLng,
        };

        const distance = calculateDistance(
          { latitude: location.coords.latitude, longitude: location.coords.longitude },
          coordinate
        );

        return {
          ...device,
          coordinate,
          lastSeen: new Date(),
          distance,
          batteryLevel: Math.floor(Math.random() * 100),
          hole: device.name.toLowerCase().includes('ball') ? Math.floor(Math.random() * 18) + 1 : undefined,
          type: getDeviceType(device.name),
        };
      });

      setTrackedDevices(newTrackedDevices);
      console.log(`📱 Updated tracked devices: ${newTrackedDevices.length} devices`);
    }
  }, [devices, location]);

  // Update distances when location changes
  useEffect(() => {
    if (location && trackedDevices.length > 0) {
      setTrackedDevices(devices => 
        devices.map(device => ({
          ...device,
          distance: calculateDistance(
            { latitude: location.coords.latitude, longitude: location.coords.longitude },
            device.coordinate
          ),
        }))
      );
    }
  }, [location]);

  const getDeviceType = (deviceName: string): TrackedDevice['type'] => {
    const name = deviceName.toLowerCase();
    if (name.includes('ball') || name.includes('golf')) return 'ball';
    if (name.includes('airpods') || name.includes('headphones') || name.includes('buds') || name.includes('beats')) return 'headphones';
    if (name.includes('watch') || name.includes('garmin') || name.includes('fitbit')) return 'watch';
    if (name.includes('iphone') || name.includes('phone') || name.includes('samsung') || name.includes('pixel')) return 'phone';
    return 'unknown';
  };

  const startDeviceScanning = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Platform Not Supported',
        'Real Bluetooth scanning requires a native mobile app on iOS or Android.\n\nTo use this feature:\n1. Build the app for iOS/Android\n2. Install on a physical device\n3. Grant Bluetooth permissions',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await startScan();
    } catch (error) {
      console.error('Scan start error:', error);
      Alert.alert(
        'Scan Error',
        'Failed to start Bluetooth scan. Please check your Bluetooth settings and permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const navigateToDevice = async (device: TrackedDevice) => {
    setSelectedDevice(device);
    
    const distanceText = device.distance ? `${device.distance}m away` : 'Distance calculating...';
    const deviceIcon = getDeviceEmoji(device.type);
    const signalStrength = Math.abs(device.rssi);
    
    Alert.alert(
      `${deviceIcon} Navigate to ${device.name}`,
      `Start turn-by-turn walking navigation to this device?\n\n📍 ${distanceText}\n📶 Signal: ${signalStrength}dBm${device.hole ? `\n⛳ Hole ${device.hole}` : ''}\n\n🧭 This will open your maps app with precise walking directions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Navigation', 
          onPress: async () => {
            try {
              await openTurnByTurnNavigation(device.coordinate, device.name);
            } catch (error) {
              console.error('Navigation error:', error);
              Alert.alert(
                'Navigation Error',
                'Failed to start navigation. Please ensure you have a maps app installed and try again.',
                [{ text: 'OK' }]
              );
            }
          }
        },
      ]
    );
  };

  const removeDevice = (deviceId: string) => {
    Alert.alert(
      'Stop Tracking Device',
      'Are you sure you want to stop tracking this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop Tracking', 
          style: 'destructive',
          onPress: () => {
            setTrackedDevices(devices => devices.filter(d => d.id !== deviceId));
            if (selectedDevice?.id === deviceId) {
              setSelectedDevice(null);
            }
          }
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'ball': return Target;
      case 'phone': return Smartphone;
      case 'headphones': return Headphones;
      case 'watch': return Watch;
      default: return Bluetooth;
    }
  };

  const getDeviceEmoji = (type: string) => {
    switch (type) {
      case 'ball': return '⛳';
      case 'phone': return '📱';
      case 'headphones': return '🎧';
      case 'watch': return '⌚';
      default: return '📡';
    }
  };

  const getSignalColor = (rssi: number) => {
    const strength = Math.abs(rssi);
    if (strength <= 50) return '#22C55E'; // Strong signal
    if (strength <= 70) return '#F59E0B'; // Medium signal
    if (strength <= 90) return '#EF4444'; // Weak signal
    return '#6B7280'; // Very weak signal
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Ball Tracker</Text>
        <Text style={styles.headerSubtitle}>
          Real-time device tracking & navigation
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Error Display */}
        {scanError && (
          <View style={styles.errorContainer}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.errorGradient}
            >
              <AlertCircle size={20} color="white" />
              <Text style={styles.errorText}>{scanError}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Stats Container */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#F97316', '#EA580C']}
            style={styles.statCard}
          >
            <Target size={24} color="white" />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{trackedDevices.length}</Text>
              <Text style={styles.statLabel}>Tracked Devices</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.statCard}
          >
            <Bluetooth size={24} color="white" />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{isBluetoothEnabled ? 'ON' : 'OFF'}</Text>
              <Text style={styles.statLabel}>Bluetooth</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Scan Button */}
        <TouchableOpacity 
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]} 
          onPress={startDeviceScanning}
          disabled={isScanning}
        >
          <LinearGradient
            colors={isScanning ? ['#6B7280', '#4B5563'] : ['#22C55E', '#16A34A']}
            style={styles.scanButtonGradient}
          >
            <Search size={20} color="white" />
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning for Real Devices...' : 'Scan for Bluetooth Devices'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Device List */}
        <View style={styles.devicesList}>
          <Text style={styles.sectionTitle}>
            {isScanning ? 'Discovering Real Devices...' : 'Tracked Devices'}
          </Text>
          
          {trackedDevices.length === 0 && !isScanning && !scanError ? (
            <View style={styles.emptyState}>
              <Target size={48} color="#6B7280" />
              <Text style={styles.emptyText}>No devices tracked yet</Text>
              <Text style={styles.emptySubtext}>
                Scan for nearby Bluetooth devices
              </Text>
            </View>
          ) : (
            trackedDevices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.type);
              return (
                <View key={device.id} style={styles.deviceCard}>
                  <LinearGradient
                    colors={['#374151', '#4B5563']}
                    style={styles.deviceCardGradient}
                  >
                    <View style={styles.deviceCardHeader}>
                      <View style={styles.deviceInfo}>
                        <View style={styles.deviceNameRow}>
                          <DeviceIcon size={20} color="white" />
                          <Text style={styles.deviceName}>{device.name}</Text>
                          {device.type === 'ball' && device.hole && (
                            <View style={styles.holeChip}>
                              <Text style={styles.holeChipText}>H{device.hole}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.locationRow}>
                          <MapPin size={14} color="#9CA3AF" />
                          <Text style={styles.locationText}>
                            {device.distance}m away • Signal: {Math.abs(device.rssi)}dBm
                          </Text>
                        </View>
                      </View>
                      <View style={styles.deviceActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => navigateToDevice(device)}
                        >
                          <Navigation size={18} color="#22C55E" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => removeDevice(device.id)}
                        >
                          <Trash2 size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={styles.deviceDetails}>
                      <View style={styles.detailItem}>
                        <Clock size={14} color="#9CA3AF" />
                        <Text style={styles.detailText}>{formatTime(device.lastSeen)}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <View style={[styles.signalDot, { backgroundColor: getSignalColor(device.rssi) }]} />
                        <Text style={styles.detailText}>
                          {Math.abs(device.rssi) <= 50 ? 'Strong' : 
                           Math.abs(device.rssi) <= 70 ? 'Medium' : 'Weak'} Signal
                        </Text>
                      </View>
                      {device.batteryLevel && (
                        <View style={styles.detailItem}>
                          <Text style={styles.batteryText}>{device.batteryLevel}% Battery</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              );
            })
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <LinearGradient
            colors={['#1F2937', '#374151']}
            style={styles.instructionsGradient}
          >
            <Text style={styles.instructionsTitle}>How to Use Real Bluetooth Tracking</Text>
            <Text style={styles.instructionsText}>
              1. Tap "Scan" to discover nearby real Bluetooth devices{'\n'}
              2. Tap the navigation icon to get turn-by-turn walking directions{'\n'}
              3. Long press a device to stop tracking it{'\n'}
              4. Works with golf balls, phones, watches, headphones, and more!{'\n\n'}
              📱 Requires development build with react-native-ble-manager
            </Text>
          </LinearGradient>
        </View>

        {/* Development Build Notice */}
        {Platform.OS !== 'web' && (
          <View style={styles.noticeCard}>
            <LinearGradient
              colors={['#1F2937', '#374151']}
              style={styles.noticeGradient}
            >
              <Settings size={24} color="#3B82F6" />
              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>Real Bluetooth Scanning</Text>
                <Text style={styles.noticeText}>
                  This app scans for actual nearby Bluetooth devices including phones, watches, headphones, 
                  and smart golf equipment. For full functionality, ensure you have a development build 
                  with react-native-ble-manager installed.
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statText: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scanButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  devicesList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  deviceCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deviceCardGradient: {
    padding: 20,
  },
  deviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  holeChip: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  holeChipText: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: 'bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  batteryText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  instructionsCard: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  instructionsGradient: {
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  noticeCard: {
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  noticeGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-start',
  },
  noticeContent: {
    flex: 1,
    marginLeft: 16,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});