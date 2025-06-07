import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Navigation, MapPin, Plus, Target, Compass, Timer, Bluetooth, Smartphone, Search, Wifi } from 'lucide-react-native';

interface TrackedDevice {
  id: string;
  name: string;
  type: 'phone' | 'headphones' | 'watch' | 'ball';
  coordinate: {
    latitude: number;
    longitude: number;
  };
  lastSeen: Date;
  distance?: number;
  signalStrength: number;
  batteryLevel?: number;
  hole?: number;
}

export default function CourseMapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [trackedDevices, setTrackedDevices] = useState<TrackedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<TrackedDevice | null>(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);

  // Demo devices to simulate Find My network
  const demoDevices: TrackedDevice[] = [
    {
      id: 'demo-1',
      name: 'Golf Ball #1',
      type: 'ball',
      coordinate: { latitude: 0, longitude: 0 },
      lastSeen: new Date(Date.now() - 5 * 60000),
      signalStrength: 85,
      batteryLevel: 78,
      hole: 7,
    },
    {
      id: 'demo-2',
      name: "John's iPhone",
      type: 'phone',
      coordinate: { latitude: 0, longitude: 0 },
      lastSeen: new Date(Date.now() - 2 * 60000),
      signalStrength: 92,
      batteryLevel: 65,
    },
    {
      id: 'demo-3',
      name: 'AirPods Pro',
      type: 'headphones',
      coordinate: { latitude: 0, longitude: 0 },
      lastSeen: new Date(Date.now() - 1 * 60000),
      signalStrength: 76,
      batteryLevel: 45,
    },
  ];

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'GolfTrackerJack needs location access to track devices and provide navigation.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setLocation(location);

      if (!gameStartTime) {
        setGameStartTime(new Date());
      }
    })();
  }, []);

  useEffect(() => {
    if (location && trackedDevices.length > 0) {
      setTrackedDevices(devices => 
        devices.map(device => ({
          ...device,
          distance: calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            device.coordinate.latitude,
            device.coordinate.longitude
          ),
        }))
      );
    }
  }, [location]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000;
    return Math.round(distance);
  };

  const startDeviceScanning = () => {
    setIsScanning(true);
    
    // Simulate device discovery
    setTimeout(() => {
      if (!location) return;
      
      const newDevices = demoDevices.map(device => ({
        ...device,
        coordinate: {
          latitude: location.coords.latitude + (Math.random() - 0.5) * 0.001,
          longitude: location.coords.longitude + (Math.random() - 0.5) * 0.001,
        },
        distance: Math.floor(Math.random() * 200) + 10,
      }));
      
      setTrackedDevices(newDevices);
      setIsScanning(false);
      
      Alert.alert(
        '🔍 Device Scan Complete',
        `Found ${newDevices.length} nearby devices! Golf balls and other devices are now being tracked.`,
        [{ text: 'Great!' }]
      );
    }, 3000);
  };

  const navigateToDevice = (device: TrackedDevice) => {
    setSelectedDevice(device);
    
    const distanceText = device.distance ? `${device.distance}m away` : 'Distance calculating...';
    const deviceIcon = device.type === 'ball' ? '⛳' : device.type === 'phone' ? '📱' : '🎧';
    
    Alert.alert(
      `${deviceIcon} Navigate to ${device.name}`,
      `Start turn-by-turn navigation?\n\n📍 ${distanceText}\n📶 Signal: ${device.signalStrength}%${device.hole ? `\n⛳ Hole ${device.hole}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Navigate', 
          onPress: () => {
            const url = Platform.select({
              ios: `maps:0,0?q=${device.coordinate.latitude},${device.coordinate.longitude}`,
              android: `geo:0,0?q=${device.coordinate.latitude},${device.coordinate.longitude}`,
              default: `https://www.google.com/maps/search/?api=1&query=${device.coordinate.latitude},${device.coordinate.longitude}`,
            });
            
            if (Platform.OS === 'web') {
              window.open(url, '_blank');
            }
            
            Alert.alert(
              '🧭 Navigation Started',
              `Follow the directions to reach ${device.name}!`,
              [{ text: 'OK' }]
            );
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
      case 'headphones': return Wifi;
      case 'watch': return Timer;
      default: return Bluetooth;
    }
  };

  const getSignalColor = (strength: number) => {
    if (strength >= 80) return '#22C55E';
    if (strength >= 60) return '#F59E0B';
    if (strength >= 40) return '#EF4444';
    return '#6B7280';
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>GolfTrackerJack</Text>
        <Text style={styles.headerSubtitle}>Find My Network for Golf</Text>
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

        {/* Map Placeholder with Device List */}
        <View style={styles.mapSection}>
          <LinearGradient
            colors={['#059669', '#047857']}
            style={styles.mapGradient}
          >
            <View style={styles.mapHeader}>
              <MapPin size={32} color="white" />
              <Text style={styles.mapTitle}>Device Tracking</Text>
              <Text style={styles.mapSubtitle}>
                {location ? 
                  `GPS: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` :
                  'Waiting for GPS location...'
                }
              </Text>
            </View>
            
            {/* Tracked Devices List */}
            {trackedDevices.length > 0 && (
              <View style={styles.devicesContainer}>
                <Text style={styles.devicesTitle}>Nearby Devices:</Text>
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
                            <View style={[styles.signalDot, { backgroundColor: getSignalColor(device.signalStrength) }]} />
                            <Text style={styles.signalText}>{device.signalStrength}%</Text>
                          </View>
                          <Text style={styles.lastSeenText}>{formatLastSeen(device.lastSeen)}</Text>
                        </View>
                      </View>
                      <Navigation size={16} color="white" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {trackedDevices.length === 0 && !isScanning && (
              <View style={styles.emptyState}>
                <Bluetooth size={48} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.emptyTitle}>No Devices Found</Text>
                <Text style={styles.emptyText}>Scan for nearby golf balls and devices</Text>
              </View>
            )}

            {isScanning && (
              <View style={styles.scanningState}>
                <Search size={48} color="white" />
                <Text style={styles.scanningTitle}>Scanning for Devices...</Text>
                <Text style={styles.scanningText}>Looking for golf balls and nearby devices</Text>
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
              <Target size={24} color="white" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Devices Tracked</Text>
                <Text style={styles.cardValue}>{trackedDevices.length}</Text>
              </View>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.statCard}
          >
            <View style={styles.cardContent}>
              <Bluetooth size={24} color="white" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Find My Network</Text>
                <Text style={styles.cardValue}>{isScanning ? 'SCANNING' : 'READY'}</Text>
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
              {isScanning ? 'Scanning for Devices...' : 'Scan for Nearby Devices'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
  mapSection: {
    height: 400,
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
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 40,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});