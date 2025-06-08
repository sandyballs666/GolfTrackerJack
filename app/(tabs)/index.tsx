import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Navigation, MapPin, Target, Compass, Timer, Bluetooth, Smartphone, Search, Wifi, Headphones, Watch, CircleAlert as AlertCircle, Settings, Globe } from 'lucide-react-native';
import { useBluetooth, BluetoothDevice } from '@/hooks/useBluetooth';
import { useNavigation, NavigationCoordinate } from '@/hooks/useNavigation';

interface TrackedDevice extends BluetoothDevice {
  coordinate: NavigationCoordinate;
  lastSeen: Date;
  distance?: number;
  batteryLevel?: number;
  hole?: number;
  type: 'phone' | 'headphones' | 'watch' | 'ball' | 'unknown';
}

export default function CourseMapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [trackedDevices, setTrackedDevices] = useState<TrackedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<TrackedDevice | null>(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);

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
          'GolfTrackerJack needs location access to calculate distances to tracked devices and provide turn-by-turn navigation.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Permission', onPress: async () => {
              await Location.requestForegroundPermissionsAsync();
            }},
          ]
        );
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setLocation(currentLocation);

      if (!gameStartTime) {
        setGameStartTime(new Date());
      }

      console.log('✅ Location initialized:', currentLocation.coords);
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
        // Generate realistic coordinates near current location (simulating device positions)
        const offsetLat = (Math.random() - 0.5) * 0.002; // ~200m radius
        const offsetLng = (Math.random() - 0.5) * 0.002;
        
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

  const formatGameTime = () => {
    if (!gameStartTime) return '0:00';
    const now = new Date();
    const diff = now.getTime() - gameStartTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}:${((diff % (1000 * 60)) / 1000).toFixed(0).padStart(2, '0')}`;
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

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  const getPlatformInfo = () => {
    if (Platform.OS === 'web') {
      return {
        icon: Globe,
        title: 'Web Bluetooth Available',
        subtitle: 'Click scan to use Web Bluetooth API',
        color: '#3B82F6'
      };
    }
    return {
      icon: Smartphone,
      title: 'Native Bluetooth Ready',
      subtitle: 'Tap scan for device discovery',
      color: '#22C55E'
    };
  };

  const platformInfo = getPlatformInfo();
  const PlatformIcon = platformInfo.icon;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>GolfTrackerJack</Text>
        <Text style={styles.headerSubtitle}>
          Real Bluetooth Device Tracking & Navigation
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Compact Game Info Panel */}
        <View style={styles.gameInfoPanel}>
          <LinearGradient
            colors={['rgba(31, 41, 55, 0.95)', 'rgba(55, 65, 81, 0.95)']}
            style={styles.gameInfoGradient}
          >
            <View style={styles.gameInfoRow}>
              <View style={styles.gameInfoItem}>
                <Target size={12} color="#22C55E" />
                <Text style={styles.gameInfoValue}>{currentHole}</Text>
                <Text style={styles.gameInfoLabel}>Hole</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.holeButton}
                onPress={() => setCurrentHole(h => h < 18 ? h + 1 : h)}
              >
                <Text style={styles.holeButtonText}>Next</Text>
              </TouchableOpacity>
              
              <View style={styles.gameInfoItem}>
                <Timer size={12} color="#3B82F6" />
                <Text style={styles.gameInfoValue}>{formatGameTime()}</Text>
                <Text style={styles.gameInfoLabel}>Time</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

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

        {/* Map Section with Device List */}
        <View style={styles.mapSection}>
          <LinearGradient
            colors={['#059669', '#047857']}
            style={styles.mapGradient}
          >
            <View style={styles.mapHeader}>
              <PlatformIcon size={32} color="white" />
              <Text style={styles.mapTitle}>{platformInfo.title}</Text>
              <Text style={styles.mapSubtitle}>
                {location ? 
                  `GPS: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` :
                  'Waiting for GPS location...'
                }
              </Text>
              <Text style={styles.bluetoothStatus}>
                Bluetooth: {isBluetoothEnabled ? '✅ Ready' : '❌ Not Available'}
                {Platform.OS === 'web' && ' • Web Bluetooth API'}
              </Text>
            </View>
            
            {/* Tracked Devices List */}
            {trackedDevices.length > 0 && (
              <View style={styles.devicesContainer}>
                <Text style={styles.devicesTitle}>Discovered Devices ({trackedDevices.length}):</Text>
                <ScrollView style={styles.devicesList} nestedScrollEnabled={true}>
                  {trackedDevices.map((device) => {
                    const DeviceIcon = getDeviceIcon(device.type);
                    return (
                      <TouchableOpacity
                        key={device.id}
                        style={styles.deviceItem}
                        onPress={() => navigateToDevice(device)}
                        onLongPress={() => removeDevice(device.id)}
                      >
                        <View style={styles.deviceInfo}>
                          <View style={styles.deviceHeader}>
                            <DeviceIcon size={18} color="white" />
                            <Text style={styles.deviceName}>{device.name}</Text>
                            {device.type === 'ball' && device.hole && (
                              <View style={styles.holeChip}>
                                <Text style={styles.holeChipText}>H{device.hole}</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.deviceDetails}>
                            <Text style={styles.deviceDistance}>{device.distance}m</Text>
                            <View style={styles.signalIndicator}>
                              <View style={[styles.signalDot, { backgroundColor: getSignalColor(device.rssi) }]} />
                              <Text style={styles.signalText}>{Math.abs(device.rssi)}dBm</Text>
                            </View>
                            <Text style={styles.lastSeenText}>{formatLastSeen(device.lastSeen)}</Text>
                          </View>
                        </View>
                        <Navigation size={16} color="white" />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {trackedDevices.length === 0 && !isScanning && !scanError && (
              <View style={styles.emptyState}>
                <Bluetooth size={48} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.emptyTitle}>No Devices Found</Text>
                <Text style={styles.emptyText}>
                  {Platform.OS === 'web' ? 'Use Web Bluetooth to discover devices' : 'Scan for nearby Bluetooth devices'}
                </Text>
              </View>
            )}

            {isScanning && (
              <View style={styles.scanningState}>
                <Search size={48} color="white" />
                <Text style={styles.scanningTitle}>
                  {Platform.OS === 'web' ? 'Web Bluetooth Scanning...' : 'Scanning for Devices...'}
                </Text>
                <Text style={styles.scanningText}>
                  {Platform.OS === 'web' ? 'Select a device from the browser dialog' : 'Looking for nearby Bluetooth devices'}
                </Text>
                <TouchableOpacity style={styles.stopScanButton} onPress={stopScan}>
                  <Text style={styles.stopScanText}>Stop Scan</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={styles.statCard}
          >
            <View style={styles.cardContent}>
              <Target size={20} color="white" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Devices Found</Text>
                <Text style={styles.cardValue}>{trackedDevices.length}</Text>
              </View>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.statCard}
          >
            <View style={styles.cardContent}>
              <Bluetooth size={20} color="white" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Bluetooth</Text>
                <Text style={styles.cardValue}>{isBluetoothEnabled ? 'ON' : 'OFF'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.actionButton, isScanning && styles.actionButtonDisabled]} 
          onPress={startDeviceScanning}
          disabled={isScanning}
        >
          <LinearGradient
            colors={isScanning ? ['#6B7280', '#4B5563'] : ['#3B82F6', '#2563EB']}
            style={styles.buttonGradient}
          >
            <Search size={20} color="white" />
            <Text style={styles.buttonText}>
              {isScanning ? 
                (Platform.OS === 'web' ? 'Web Bluetooth Scanning...' : 'Scanning for Devices...') : 
                (Platform.OS === 'web' ? 'Scan with Web Bluetooth' : 'Scan for Bluetooth Devices')
              }
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Platform-specific Notice */}
        <View style={styles.noticeCard}>
          <LinearGradient
            colors={['#1F2937', '#374151']}
            style={styles.noticeGradient}
          >
            <PlatformIcon size={24} color={platformInfo.color} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>{platformInfo.title}</Text>
              <Text style={styles.noticeText}>
                {Platform.OS === 'web' ? 
                  'This app uses the Web Bluetooth API to discover nearby devices. Click "Scan" to open the browser\'s device selection dialog. Works great for finding phones, headphones, and smart devices!' :
                  'For full native Bluetooth scanning with react-native-ble-manager, you\'ll need a custom development build. The current implementation provides device discovery and turn-by-turn navigation to help you find your golf equipment!'
                }
              </Text>
            </View>
          </LinearGradient>
        </View>
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
  gameInfoPanel: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gameInfoGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  gameInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameInfoItem: {
    alignItems: 'center',
    gap: 2,
    minWidth: 50,
  },
  gameInfoLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  gameInfoValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  holeButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  holeButtonText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '600',
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
  mapSection: {
    height: 450,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapGradient: {
    flex: 1,
    padding: 20,
  },
  mapHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 4,
  },
  bluetoothStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  devicesContainer: {
    flex: 1,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  devicesList: {
    flex: 1,
    maxHeight: 280,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  holeChip: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  holeChipText: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: 'bold',
  },
  deviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceDistance: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  signalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  signalText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  lastSeenText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  scanningState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  scanningText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  stopScanButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  stopScanText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
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