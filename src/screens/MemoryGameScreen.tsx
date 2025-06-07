import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from './navigation/AppNavigator';

type MemoryGameRouteProp = RouteProp<RootStackParamList, 'memoryGame'>;

interface Card {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
  animation: Animated.Value;
}

const CARD_SIZE = Dimensions.get('window').width / 4 - 20;

const MemoryGameScreen = () => {
  const route = useRoute<MemoryGameRouteProp>();
  const { step, lessonTitle } = route.params;

  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);

  useEffect(() => {
    const duplicated: Card[] =
      step.options?.map((option, index) => ({
        id: index,
        icon: option.icon,
        flipped: true, // 👁️ visibles al inicio
        matched: false,
        animation: new Animated.Value(180),
      })) ?? [];

    const shuffled = [...duplicated]
      .flatMap((card) => [
        { ...card, id: card.id * 2 },
        { ...card, id: card.id * 2 + 1 },
      ])
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);

    // 🔁 Después de 5 segundos, voltea todas las cartas
    setTimeout(() => {
      const reset = shuffled.map((c) => ({
        ...c,
        flipped: false,
      }));

      reset.forEach((card) => {
        Animated.timing(card.animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });

      setCards(reset);
    }, 5000);
  }, []);

  const flipCard = (card: Card) => {
    if (card.flipped || card.matched || selected.length === 2) return;

    Animated.timing(card.animation, {
      toValue: 180,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const updatedCard = { ...card, flipped: true };
    const newCards = cards.map((c) => (c.id === card.id ? updatedCard : c));
    setCards(newCards);

    const newSelected = [...selected, updatedCard];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      if (first.icon === second.icon) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.icon === first.icon ? { ...c, matched: true } : c
            )
          );
          setMatchedCount((prev) => prev + 1);
          Alert.alert('¡Muy bien hecho! ✨');
        }, 500);
      } else {
        setTimeout(() => {
          [first, second].forEach((c) => {
            Animated.timing(c.animation, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }).start();
          });

          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id
                ? { ...c, flipped: false }
                : c
            )
          );
          Alert.alert('¡Intenta de nuevo! ❌');
        }, 1000);
      }

      setTimeout(() => setSelected([]), 1200);
    }
  };

  const renderCard = (card: Card) => {
    const rotateY = card.animation.interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg'],
    });

    const rotateYBack = card.animation.interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg'],
    });

    return (
      <TouchableWithoutFeedback key={card.id} onPress={() => flipCard(card)}>
        <View style={styles.cardWrapper}>
          <Animated.View
            style={[
              styles.card,
              styles.front,
              {
                transform: [{ rotateY }],
                backfaceVisibility: 'hidden',
              },
            ]}
          >
            <Text style={styles.cardText}>❓</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.card,
              styles.back,
              {
                transform: [{ rotateY: rotateYBack }],
                backfaceVisibility: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0,
              },
            ]}
          >
            <Text style={styles.cardText}>{card.icon}</Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{lessonTitle}</Text>
      <Text style={styles.subtitle}>Actividad: Memoria Visual</Text>
      <View style={styles.grid}>{cards.map(renderCard)}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6fc',
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2a2a2a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
  },
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: 10,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  front: {
    backgroundColor: '#e6e6e6',
  },
  back: {
    backgroundColor: '#d6f5d6',
  },
  cardText: {
    fontSize: 30,
  },
});

export default MemoryGameScreen;
