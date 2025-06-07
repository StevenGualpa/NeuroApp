import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';

interface MemoryCardProps {
  icon: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
  onPress: () => void;
}

const CARD_SIZE = Dimensions.get('window').width / 4 - 20;

const MemoryCard: React.FC<MemoryCardProps> = ({
  icon,
  label,
  isFlipped,
  isMatched,
  onPress,
}) => {
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 180 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const rotateY = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable onPress={onPress} disabled={isFlipped || isMatched} style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ rotateY }] }]}>
        <View style={styles.face}>
          {isFlipped || isMatched ? (
            <>
              <Text style={styles.icon}>{icon}</Text>
              <Text style={styles.label}>{label}</Text>
            </>
          ) : (
            <Text style={styles.cover}>❓</Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE + 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    elevation: 4,
  },
  face: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 36,
  },
  label: {
    fontSize: 14,
    marginTop: 6,
    color: '#333',
  },
  cover: {
    fontSize: 38,
  },
});

export default MemoryCard;
