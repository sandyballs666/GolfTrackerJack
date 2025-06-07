import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Users, Clock, Target, Plus, Minus, Flag, Save } from 'lucide-react-native';

interface Player {
  id: string;
  name: string;
  scores: number[];
}

interface Hole {
  number: number;
  par: number;
  distance: number;
}

const COURSE_HOLES: Hole[] = Array.from({ length: 18 }, (_, i) => ({
  number: i + 1,
  par: [3, 4, 5][Math.floor(Math.random() * 3)], // Random par for demo
  distance: Math.floor(Math.random() * 200) + 150, // Random distance 150-350 yards
}));

export default function ScorecardScreen() {
  const [players, setPlayers] = useState<Player[]>([
    {
      id: '1',
      name: 'You',
      scores: new Array(18).fill(0),
    },
  ]);
  const [currentHole, setCurrentHole] = useState(1);
  const [gameStartTime, setGameStartTime] = useState(new Date());
  const [isGameActive, setIsGameActive] = useState(true);

  // Helper function to calculate total score for a player
  const calculateTotalScore = (scores: number[]) => {
    return scores.reduce((sum, score) => sum + score, 0);
  };

  // Helper function to calculate par total for a player
  const calculateParTotal = (scores: number[]) => {
    const totalScore = calculateTotalScore(scores);
    const parTotal = totalScore - COURSE_HOLES.slice(0, scores.filter(s => s > 0).length)
      .reduce((sum, hole) => sum + hole.par, 0);
    return parTotal;
  };

  const updateScore = (playerId: string, holeIndex: number, change: number) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.id === playerId
          ? {
              ...player,
              scores: player.scores.map((score, index) =>
                index === holeIndex ? Math.max(0, score + change) : score
              ),
            }
          : player
      )
    );
  };

  const addPlayer = () => {
    if (Platform.OS === 'web') {
      const name = window.prompt('Enter player name:');
      if (name && name.trim()) {
        const newPlayer: Player = {
          id: Date.now().toString(),
          name: name.trim(),
          scores: new Array(18).fill(0),
        };
        setPlayers([...players, newPlayer]);
      }
    } else {
      Alert.prompt(
        'Add Player',
        'Enter player name:',
        (name) => {
          if (name && name.trim()) {
            const newPlayer: Player = {
              id: Date.now().toString(),
              name: name.trim(),
              scores: new Array(18).fill(0),
            };
            setPlayers([...players, newPlayer]);
          }
        }
      );
    }
  };

  const saveGame = () => {
    Alert.alert(
      'Save Game',
      'Game saved successfully!',
      [{ text: 'OK' }]
    );
  };

  const nextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };

  const previousHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  const getScoreColor = (score: number, par: number) => {
    const diff = score - par;
    if (score === 0) return '#6B7280';
    if (diff <= -2) return '#059669'; // Eagle or better
    if (diff === -1) return '#22C55E'; // Birdie
    if (diff === 0) return '#3B82F6';  // Par
    if (diff === 1) return '#F59E0B';  // Bogey
    return '#EF4444'; // Double bogey or worse
  };

  const getScoreText = (score: number, par: number) => {
    if (score === 0) return '-';
    const diff = score - par;
    if (diff <= -2) return '🦅';
    if (diff === -1) return '🐦';
    if (diff === 0) return 'PAR';
    if (diff === 1) return '+1';
    return `+${diff}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Scorecard</Text>
        <Text style={styles.headerSubtitle}>Track your round</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Game Stats */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={styles.statCard}
          >
            <Flag size={24} color="white" />
            <View style={styles.statText}>
              <Text style={styles.statValue}>Hole {currentHole}</Text>
              <Text style={styles.statLabel}>Current</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.statCard}
          >
            <Users size={24} color="white" />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{players.length}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Current Hole Info */}
        <View style={styles.holeInfoCard}>
          <LinearGradient
            colors={['#374151', '#4B5563']}
            style={styles.holeInfoGradient}
          >
            <View style={styles.holeInfoHeader}>
              <Text style={styles.holeNumber}>Hole {currentHole}</Text>
              <View style={styles.holeDetails}>
                <Text style={styles.holeDetailText}>Par {COURSE_HOLES[currentHole - 1].par}</Text>
                <Text style={styles.holeDetailText}>{COURSE_HOLES[currentHole - 1].distance} yds</Text>
              </View>
            </View>
            
            <View style={styles.holeNavigation}>
              <TouchableOpacity
                style={[styles.navButton, currentHole === 1 && styles.navButtonDisabled]}
                onPress={previousHole}
                disabled={currentHole === 1}
              >
                <Text style={styles.navButtonText}>Previous</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.navButton, currentHole === 18 && styles.navButtonDisabled]}
                onPress={nextHole}
                disabled={currentHole === 18}
              >
                <Text style={styles.navButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Players Scores */}
        <View style={styles.playersContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Players</Text>
            <TouchableOpacity style={styles.addPlayerButton} onPress={addPlayer}>
              <Plus size={20} color="#22C55E" />
            </TouchableOpacity>
          </View>

          {players.map((player) => {
            const totalScore = calculateTotalScore(player.scores);
            const parTotal = calculateParTotal(player.scores);
            
            return (
              <View key={player.id} style={styles.playerCard}>
                <LinearGradient
                  colors={['#374151', '#4B5563']}
                  style={styles.playerCardGradient}
                >
                  <View style={styles.playerHeader}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <View style={styles.playerStats}>
                      <Text style={styles.totalScore}>{totalScore}</Text>
                      <Text style={[
                        styles.parScore,
                        { color: parTotal === 0 ? '#9CA3AF' : parTotal > 0 ? '#EF4444' : '#22C55E' }
                      ]}>
                        {parTotal === 0 ? 'E' : parTotal > 0 ? `+${parTotal}` : parTotal}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.currentHoleScore}>
                    <View style={styles.scoreControls}>
                      <TouchableOpacity
                        style={styles.scoreButton}
                        onPress={() => updateScore(player.id, currentHole - 1, -1)}
                      >
                        <Minus size={20} color="white" />
                      </TouchableOpacity>

                      <View style={styles.scoreDisplay}>
                        <Text style={[
                          styles.scoreNumber,
                          { color: getScoreColor(player.scores[currentHole - 1], COURSE_HOLES[currentHole - 1].par) }
                        ]}>
                          {player.scores[currentHole - 1] || '-'}
                        </Text>
                        <Text style={styles.scoreIndicator}>
                          {getScoreText(player.scores[currentHole - 1], COURSE_HOLES[currentHole - 1].par)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.scoreButton}
                        onPress={() => updateScore(player.id, currentHole - 1, 1)}
                      >
                        <Plus size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            );
          })}
        </View>

        {/* Save Game Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveGame}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.saveButtonGradient}
          >
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>Save Game</Text>
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
  holeInfoCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  holeInfoGradient: {
    padding: 20,
  },
  holeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  holeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  holeDetails: {
    alignItems: 'flex-end',
  },
  holeDetailText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  holeNavigation: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  playersContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  addPlayerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  playerCardGradient: {
    padding: 20,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  playerStats: {
    alignItems: 'flex-end',
  },
  totalScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  parScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentHoleScore: {
    alignItems: 'center',
  },
  scoreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  scoreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreIndicator: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  saveButton: {
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});