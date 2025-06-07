import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { History, Trophy, TrendingUp, Calendar, MapPin, Users, Target } from 'lucide-react-native';

interface GameRecord {
  id: string;
  date: Date;
  course: string;
  players: string[];
  totalScore: number;
  par: number;
  holesPlayed: number;
  duration: string;
  bestHole: number;
  worstHole: number;
}

const GAME_HISTORY: GameRecord[] = [
  {
    id: '1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    course: 'Pebble Beach Golf Links',
    players: ['You', 'John', 'Mike'],
    totalScore: 89,
    par: -17,
    holesPlayed: 18,
    duration: '4h 23m',
    bestHole: 3,
    worstHole: 12,
  },
  {
    id: '2',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    course: 'Augusta National Golf Club',
    players: ['You', 'Sarah'],
    totalScore: 76,
    par: -4,
    holesPlayed: 18,
    duration: '3h 45m',
    bestHole: 7,
    worstHole: 15,
  },
  {
    id: '3',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    course: 'St. Andrews Old Course',
    players: ['You', 'Alex', 'Chris', 'David'],
    totalScore: 92,
    par: -20,
    holesPlayed: 18,
    duration: '4h 56m',
    bestHole: 1,
    worstHole: 17,
  },
];

export default function HistoryScreen() {
  const [selectedGame, setSelectedGame] = useState<GameRecord | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getParColor = (par: number) => {
    if (par > 0) return '#EF4444';
    if (par < 0) return '#22C55E';
    return '#9CA3AF';
  };

  const getParText = (par: number) => {
    if (par === 0) return 'E';
    return par > 0 ? `+${par}` : `${par}`;
  };

  const calculateStats = () => {
    const totalGames = GAME_HISTORY.length;
    const avgScore = GAME_HISTORY.reduce((sum, game) => sum + game.totalScore, 0) / totalGames;
    const bestScore = Math.min(...GAME_HISTORY.map(game => game.totalScore));
    const totalBallsTracked = GAME_HISTORY.reduce((sum, game) => sum + game.players.length * 3, 0);

    return { totalGames, avgScore, bestScore, totalBallsTracked };
  };

  const stats = calculateStats();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Game History</Text>
        <Text style={styles.headerSubtitle}>Track your progress</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Stats */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.statCard}
          >
            <Trophy size={24} color="white" />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{stats.totalGames}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={styles.statCard}
          >
            <TrendingUp size={24} color="white" />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{stats.avgScore.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.statCard}
          >
            <Target size={24} color="white" />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{stats.bestScore}</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.statCard}
          >
            <MapPin size={24} color="white" />
            <View style={styles.statText}>
              <Text style={styles.statValue}>{stats.totalBallsTracked}</Text>
              <Text style={styles.statLabel}>Balls Tracked</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Recent Games */}
        <View style={styles.gamesSection}>
          <Text style={styles.sectionTitle}>Recent Games</Text>
          
          {GAME_HISTORY.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={styles.gameCard}
              onPress={() => setSelectedGame(selectedGame?.id === game.id ? null : game)}
            >
              <LinearGradient
                colors={['#374151', '#4B5563']}
                style={styles.gameCardGradient}
              >
                <View style={styles.gameHeader}>
                  <View style={styles.gameMainInfo}>
                    <Text style={styles.courseName}>{game.course}</Text>
                    <View style={styles.gameMetaRow}>
                      <Calendar size={14} color="#9CA3AF" />
                      <Text style={styles.gameDate}>{formatDate(game.date)}</Text>
                      <Users size={14} color="#9CA3AF" />
                      <Text style={styles.playerCount}>{game.players.length} players</Text>
                    </View>
                  </View>
                  
                  <View style={styles.scoreSection}>
                    <Text style={styles.totalScore}>{game.totalScore}</Text>
                    <Text style={[styles.parScore, { color: getParColor(game.par) }]}>
                      {getParText(game.par)}
                    </Text>
                  </View>
                </View>

                {selectedGame?.id === game.id && (
                  <View style={styles.gameDetails}>
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Duration</Text>
                        <Text style={styles.detailValue}>{game.duration}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Holes</Text>
                        <Text style={styles.detailValue}>{game.holesPlayed}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Best Hole</Text>
                        <Text style={styles.detailValue}>#{game.bestHole}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Worst Hole</Text>
                        <Text style={styles.detailValue}>#{game.worstHole}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.playersSection}>
                      <Text style={styles.playersLabel}>Players:</Text>
                      <View style={styles.playersList}>
                        {game.players.map((player, index) => (
                          <View key={index} style={styles.playerChip}>
                            <Text style={styles.playerName}>{player}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Performance Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          
          <View style={styles.insightCard}>
            <LinearGradient
              colors={['#059669', '#047857']}
              style={styles.insightGradient}
            >
              <TrendingUp size={28} color="white" />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Improving Consistency</Text>
                <Text style={styles.insightText}>
                  Your scores have improved by 12% over the last month. 
                  Ball tracking helped you save an average of 3 strokes per round!
                </Text>
              </View>
            </LinearGradient>
          </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
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
  gamesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  gameCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gameCardGradient: {
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  gameMainInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  gameMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gameDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 8,
  },
  playerCount: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  scoreSection: {
    alignItems: 'flex-end',
  },
  totalScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  parScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  gameDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    width: '45%',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  playersSection: {
    marginTop: 8,
  },
  playersLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerChip: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playerName: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  insightsSection: {
    marginBottom: 40,
  },
  insightCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  insightGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-start',
  },
  insightContent: {
    flex: 1,
    marginLeft: 16,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
});