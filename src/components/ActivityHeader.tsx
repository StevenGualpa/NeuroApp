import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { GameStatsDisplay } from './GameStatsDisplay';

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  firstTrySuccess?: boolean;
}

interface ActivityHeaderProps {
  title: string;
  activityType: string;
  onBackPress: () => void;
  gameStats?: GameStats;
  showStats?: boolean;
}

export const ActivityHeader: React.FC<ActivityHeaderProps> = ({
  title,
  activityType,
  onBackPress,
  gameStats,
  showStats = true,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackPress}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.activityBadge}>
        <Text style={styles.activityText}>{activityType}</Text>
      </View>

      {/* Stats Display */}
      {showStats && gameStats && gameStats.totalAttempts > 0 && (
        <GameStatsDisplay 
          stats={gameStats}
          showPerfectBadge={true}
          layout="horizontal"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4285f4',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285f4',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 60,
  },
  activityBadge: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 8,
  },
  activityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});