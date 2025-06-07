import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Navigation, Trash2, MapPin, Clock, Target } from 'lucide-react-native';

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

interface BallMarkerModalProps {
  visible: boolean;
  ball: BallMarker | null;
  onClose: () => void;
  onNavigate: (ball: BallMarker) => void;
  onRemove: (ballId: string) => void;
}

const { width } = Dimensions.get('window');

export default function BallMarkerModal({ 
  visible, 
  ball, 
  onClose, 
  onNavigate, 
  onRemove 
}: BallMarkerModalProps) {
  if (!ball) return null;

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
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#374151', '#4B5563']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Target size={24} color="#22C55E" />
                <Text style={styles.ballTitle}>{ball.title}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Ball Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <MapPin size={16} color="#9CA3AF" />
                <Text style={styles.detailText}>Hole {ball.hole}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Clock size={16} color="#9CA3AF" />
                <Text style={styles.detailText}>{formatTime(ball.timestamp)}</Text>
              </View>
              
              {ball.distance && (
                <View style={styles.detailRow}>
                  <Text style={styles.distanceText}>{ball.distance}m away</Text>
                </View>
              )}
            </View>

            {/* Coordinates Display */}
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesTitle}>GPS Coordinates</Text>
              <Text style={styles.coordinatesText}>
                {ball.coordinate.latitude.toFixed(6)}, {ball.coordinate.longitude.toFixed(6)}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  onNavigate(ball);
                  onClose();
                }}
              >
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  style={styles.buttonGradient}
                >
                  <Navigation size={20} color="white" />
                  <Text style={styles.buttonText}>Navigate</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  onRemove(ball.id);
                  onClose();
                }}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.buttonGradient}
                >
                  <Trash2 size={20} color="white" />
                  <Text style={styles.buttonText}>Remove</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: width,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ballTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  coordinatesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  coordinatesTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '600',
  },
  coordinatesText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});