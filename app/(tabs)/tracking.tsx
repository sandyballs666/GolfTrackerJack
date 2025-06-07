import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Navigation, Trash2, Clock, MapPin } from 'lucide-react-native';

interface TrackedBall {
  id: string;
  name: string;
  location: string;
  timestamp: Date;
  distance: number;
  hole: number;
}

export default function BallTrackingScreen() {
  const [trackedBalls, setTrackedBalls] = useState<TrackedBall[]>([
    {
      id: '1',
      name: 'Ball #1',
      location: 'Hole 7 - Rough',
      timestamp: new Date(Date.now() - 15 * 60000),
      distance: 45,
      hole: 7,
    },
    {
      id: '2',
      name: 'Ball #2',
      location: 'Hole 12 - Water Hazard',
      timestamp: new Date(Date.now() - 30 * 60000),
      distance: 120,
      hole: 12,
    },
  ]);

  const navigateToBall = (ball: TrackedBall) => {
    Alert.alert(
      'Navigate to Ball',
      `Start navigation to ${ball.name} at ${ball.location}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Navigate', onPress: () => console.log(`Navigating to ${ball.name}`) },
      ]
    );
  };

  const removeBall = (ballId: string) => {
    Alert.alert(
      'Remove Ball',
      'Are you sure you want to remove this ball from tracking?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setTrackedBalls(balls => balls.filter(b => b.id !== ballId))
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ${diffMins % 60}m ago`;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Ball Tracker</Text>
        <Text style={styles.headerSubtitle}>Never lose a ball again</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#F97316', '#EA580C']}
            style={styles.statCard}
          >
            <Target size={24} color="white" />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{trackedBalls.length}</Text>
              <Text style={styles.statLabel}>Active Balls</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.ballsList}>
          <Text style={styles.sectionTitle}>Tracked Balls</Text>
          
          {trackedBalls.length === 0 ? (
            <View style={styles.emptyState}>
              <Target size={48} color="#6B7280" />
              <Text style={styles.emptyText}>No balls tracked yet</Text>
              <Text style={styles.emptySubtext}>
                Use the map to mark ball locations
              </Text>
            </View>
          ) : (
            trackedBalls.map((ball) => (
              <View key={ball.id} style={styles.ballCard}>
                <LinearGradient
                  colors={['#374151', '#4B5563']}
                  style={styles.ballCardGradient}
                >
                  <View style={styles.ballCardHeader}>
                    <View style={styles.ballInfo}>
                      <Text style={styles.ballName}>{ball.name}</Text>
                      <View style={styles.locationRow}>
                        <MapPin size={14} color="#9CA3AF" />
                        <Text style={styles.locationText}>{ball.location}</Text>
                      </View>
                    </View>
                    <View style={styles.ballActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigateToBall(ball)}
                      >
                        <Navigation size={18} color="#22C55E" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => removeBall(ball.id)}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.ballDetails}>
                    <View style={styles.detailItem}>
                      <Clock size={14} color="#9CA3AF" />
                      <Text style={styles.detailText}>{formatTime(ball.timestamp)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.distanceText}>{ball.distance}m away</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.holeText}>Hole {ball.hole}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))
          )}
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
  statsContainer: {
    marginBottom: 24,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  statText: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  ballsList: {
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
  ballCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ballCardGradient: {
    padding: 20,
  },
  ballCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ballInfo: {
    flex: 1,
  },
  ballName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
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
  ballActions: {
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
  ballDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  holeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});