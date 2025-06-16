import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GameStats {
  totalAttempts: number;
  errors: number;
  perfectRun: boolean;
  // Campos opcionales para diferentes tipos de juegos
  audioPlays?: number;
  flipCount?: number;
  resets?: number;
  matchesFound?: number;
  efficiency?: number;
  [key: string]: any;
}

interface GameStatsDisplayProps {
  stats: GameStats;
  showPerfectBadge?: boolean;
  customStats?: Array<{
    label: string;
    value: string | number;
    isError?: boolean;
  }>;
  layout?: 'horizontal' | 'vertical';
}

export const GameStatsDisplay: React.FC<GameStatsDisplayProps> = ({ 
  stats, 
  showPerfectBadge = true,
  customStats = [],
  layout = 'horizontal'
}) => {
  const containerStyle = layout === 'horizontal' ? styles.statsContainer : styles.statsContainerVertical;

  return (
    <View style={containerStyle}>
      {/* Estadísticas básicas */}
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Intentos</Text>
        <Text style={styles.statValue}>{stats.totalAttempts}</Text>
      </View>
      
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Errores</Text>
        <Text style={[styles.statValue, stats.errors > 0 && styles.errorText]}>
          {stats.errors}
        </Text>
      </View>

      {/* Estadísticas específicas del juego */}
      {stats.audioPlays !== undefined && (
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Audio</Text>
          <Text style={styles.statValue}>{stats.audioPlays}</Text>
        </View>
      )}

      {stats.flipCount !== undefined && (
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Volteos</Text>
          <Text style={styles.statValue}>{stats.flipCount}</Text>
        </View>
      )}

      {stats.resets !== undefined && (
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Reinicios</Text>
          <Text style={styles.statValue}>{stats.resets}</Text>
        </View>
      )}

      {stats.matchesFound !== undefined && (
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Parejas</Text>
          <Text style={styles.statValue}>{stats.matchesFound}</Text>
        </View>
      )}

      {stats.efficiency !== undefined && (
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Eficiencia</Text>
          <Text style={styles.statValue}>{stats.efficiency}%</Text>
        </View>
      )}

      {/* Estadísticas personalizadas */}
      {customStats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={[
            styles.statValue, 
            stat.isError && styles.errorText
          ]}>
            {stat.value}
          </Text>
        </View>
      ))}

      {/* Badge de rendimiento perfecto */}
      {showPerfectBadge && stats.perfectRun && stats.totalAttempts > 0 && (
        <View style={styles.perfectBadge}>
          <Text style={styles.perfectText}>🔥 Perfecto</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  statsContainerVertical: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 2,
  },
  errorText: {
    color: '#ef4444',
  },
  perfectBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  perfectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});