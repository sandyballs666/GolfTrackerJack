import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Navigation, MapPin, Plus, Target, Compass, Timer } from 'lucide-react-native';

interface BallMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  timestamp: Date;
  hole: number;
  distance?: number;
}

export default function CourseMapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [ballMarkers, setBallMarkers] = useState<BallMarker[]>([]);
  const [selectedBall, setSelectedBall] = useState<BallMarker | null>(null);
  const [currentHole, setCurrentHole] = useState(1);
  const [isTracking, setIsTracking] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'GolfTrackerJack needs location access to track your golf balls and provide navigation.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
        return;
      }

      // Start location tracking
      setIsTracking(true);
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      setLocation(location);

      // Start game timer
      if (!gameStartTime) {
        setGameStartTime(new Date());
      }
    })();
  }, []);

  useEffect(() => {
    // Update distances for all ball markers when location changes
    if (location && ballMarkers.length > 0) {
      setBallMarkers(markers => 
        markers.map(marker => ({
          ...marker,
          distance: calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            marker.coordinate.latitude,
            marker.coordinate.longitude
          ),
        }))
      );
    }
  }, [location]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Distance in meters
    return Math.round(distance);
  };

  const addBallMarker = () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services to track balls.');
      return;
    }

    // Simulate adding a ball marker at current location with slight offset
    const offset = 0.0001; // Small offset for demo
    const coordinate = {
      latitude: location.coords.latitude + (Math.random() - 0.5) * offset,
      longitude: location.coords.longitude + (Math.random() - 0.5) * offset,
    };

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      coordinate.latitude,
      coordinate.longitude
    );

    const newMarker: BallMarker = {
      id: Date.now().toString(),
      coordinate,
      title: `Ball #${ballMarkers.length + 1}`,
      description: `Hole ${currentHole} - ${new Date().toLocaleTimeString()}`,
      timestamp: new Date(),
      hole: currentHole,
      distance,
    };
    
    setBallMarkers([...ballMarkers, newMarker]);
    
    Alert.alert(
      'Ball Tracked! 🏌️‍♂️',
      `${newMarker.title} has been marked on Hole ${currentHole}. Distance: ${distance}m`,
      [{ text: 'Got it!' }]
    );
  };

  const navigateToBall = (ball: BallMarker) => {
    setSelectedBall(ball);
    
    const distanceText = ball.distance ? `${ball.distance}m away` : 'Distance calculating...';
    
    Alert.alert(
      '🧭 Navigate to Ball',
      `Start turn-by-turn navigation to ${ball.title}?\n\n📍 ${distanceText}\n⛳ Hole ${ball.hole}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Navigate', 
          onPress: () => {
            // Open in external maps app
            const url = Platform.select({
              ios: `maps:0,0?q=${ball.coordinate.latitude},${ball.coordinate.longitude}`,
              android: `geo:0,0?q=${ball.coordinate.latitude},${ball.coordinate.longitude}`,
              default: `https://www.google.com/maps/search/?api=1&query=${ball.coordinate.latitude},${ball.coordinate.longitude}`,
            });
            
            if (Platform.OS === 'web') {
              window.open(url, '_blank');
            }
            
            Alert.alert(
              '🚶‍♂️ Navigation Started',
              `Follow the directions to reach ${ball.title}!`,
              [{ text: 'OK' }]
            );
          }
        },
      ]
    );
  };

  const removeBallMarker = (ballId: string) => {
    Alert.alert(
      'Remove Ball Marker',
      'Are you sure you want to remove this ball marker?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setBallMarkers(markers => markers.filter(m => m.id !== ballId));
            if (selectedBall?.id === ballId) {
              setSelectedBall(null);
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>GolfTrackerJack</Text>
        <Text style={styles.headerSubtitle}>Never lose a ball again</Text>
      </LinearGradient>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <LinearGradient
          colors={['#059669', '#047857']}
          style={styles.mapGradient}
        >
          <MapPin size={48} color="white" />
          <Text style={styles.mapPlaceholderTitle}>Golf Course Map</Text>
          <Text style={styles.mapPlaceholderText}>
            {location ? 
              `Current Location: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` :
              'Waiting for GPS location...'
            }
          </Text>
          
          {/* Ball Markers List */}
          {ballMarkers.length > 0 && (
            <View style={styles.markersContainer}>
              <Text style={styles.markersTitle}>Tracked Balls:</Text>
              {ballMarkers.map((marker) => (
                <TouchableOpacity
                  key={marker.id}
                  style={styles.markerItem}
                  onPress={() => navigateToBall(marker)}
                  onLongPress={() => removeBallMarker(marker.id)}
                >
                  <View style={styles.markerInfo}>
                    <Text style={styles.markerTitle}>{marker.title}</Text>
                    <Text style={styles.markerDistance}>{marker.distance}m away</Text>
                  </View>
                  <Navigation size={20} color="white" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Game Info Panel */}
      <View style={styles.gameInfoPanel}>
        <LinearGradient
          colors={['rgba(31, 41, 55, 0.95)', 'rgba(55, 65, 81, 0.95)']}
          style={styles.gameInfoGradient}
        >
          <View style={styles.gameInfoRow}>
            <View style={styles.gameInfoItem}>
              <Target size={16} color="#22C55E" />
              <Text style={styles.gameInfoLabel}>Hole</Text>
              <Text style={styles.gameInfoValue}>{currentHole}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.holeButton}
              onPress={() => setCurrentHole(h => h < 18 ? h + 1 : h)}
            >
              <Text style={styles.holeButtonText}>Next Hole</Text>
            </TouchableOpacity>
            
            <View style={styles.gameInfoItem}>
              <Timer size={16} color="#3B82F6" />
              <Text style={styles.gameInfoLabel}>Time</Text>
              <Text style={styles.gameInfoValue}>{formatGameTime()}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Bottom Stats Panel */}
      <View style={styles.bottomPanel}>
        <LinearGradient
          colors={['#22C55E', '#16A34A']}
          style={styles.statsCard}
        >
          <View style={styles.cardContent}>
            <MapPin size={24} color="white" />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Balls Tracked</Text>
              <Text style={styles.cardValue}>{ballMarkers.length}</Text>
            </View>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.statsCard}
        >
          <View style={styles.cardContent}>
            <Compass size={24} color="white" />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>GPS Active</Text>
              <Text style={styles.cardValue}>{isTracking ? 'ON' : 'OFF'}</Text>
            </View>
          </View>
        </LinearGradient>

        <TouchableOpacity style={styles.actionButton} onPress={addBallMarker}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.buttonGradient}
          >
            <Plus size={20} color="white" />
            <Text style={styles.buttonText}>Track Ball at Current Location</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  mapPlaceholder: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  markersContainer: {
    width: '100%',
    marginTop: 20,
  },
  markersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  markerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  markerInfo: {
    flex: 1,
  },
  markerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  markerDistance: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  gameInfoPanel: {
    position: 'absolute',
    top: 140,
    left: 20,
    right: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gameInfoGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  gameInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameInfoItem: {
    alignItems: 'center',
    gap: 4,
  },
  gameInfoLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  gameInfoValue: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  holeButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  holeButtonText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    gap: 12,
  },
  statsCard: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
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