import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Alert,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from './navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type MemoryGameRouteProp = RouteProp<RootStackParamList, 'memoryGame'>;

interface Card {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
  animation: Animated.Value;
}

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 80) / 4;

const MemoryGameScreen = () => {
  const route = useRoute<MemoryGameRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showingCards, setShowingCards] = useState(true);

  const headerAnimation = useRef(new Animated.Value(0)).current;
  const instructionAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animaciones de entrada
    Animated.sequence([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(instructionAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const duplicated: Card[] =
      step.options?.map((option, index) => ({
        id: index,
        icon: option.icon,
        flipped: true,
        matched: false,
        animation: new Animated.Value(180),
      })) ?? [];

    // ✅ CORREGIDO: Crear instancias únicas de Animated.Value para cada carta
    const shuffled = [...duplicated]
      .flatMap((card) => [
        { 
          ...card, 
          id: card.id * 2,
          animation: new Animated.Value(180) // ← Nueva instancia para la primera copia
        },
        { 
          ...card, 
          id: card.id * 2 + 1,
          animation: new Animated.Value(180) // ← Nueva instancia para la segunda copia
        },
      ])
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);

    // Mostrar cartas por 5 segundos
    setTimeout(() => {
      setShowingCards(false);
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
      setGameStarted(true);
    }, 5000);
  }, []);

  useEffect(() => {
    // Actualizar barra de progreso
    const totalPairs = (step.options?.length || 0);
    const progress = totalPairs > 0 ? matchedCount / totalPairs : 0;
    
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();

    // Verificar si el juego terminó
    if (matchedCount === totalPairs && totalPairs > 0) {
      setTimeout(() => {
        Alert.alert(
          '🎉 ¡Felicitaciones!',
          '¡Has completado el juego de memoria! ¡Excelente trabajo!',
          [
            {
              text: '¡Continuar!',
              onPress: () => navigation.goBack(),
            }
          ]
        );
      }, 1000);
    }
  }, [matchedCount]);

  const flipCard = (card: Card) => {
    if (card.flipped || card.matched || selected.length === 2 || !gameStarted) return;

    // ✅ Animar solo la carta específica usando su propia instancia de animation
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
              c.id === first.id || c.id === second.id ? { ...c, matched: true } : c
            )
          );
          setMatchedCount((prev) => prev + 1);
          Alert.alert('🎉 ¡Excelente!', '¡Encontraste una pareja! ¡Muy bien hecho!');
        }, 500);
      } else {
        setTimeout(() => {
          // ✅ Animar solo las cartas específicas que fueron seleccionadas
          [first, second].forEach((selectedCard) => {
            // Encontrar la carta actual en el estado para usar su animation
            const currentCard = cards.find(c => c.id === selectedCard.id);
            if (currentCard) {
              Animated.timing(currentCard.animation, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }).start();
            }
          });

          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id
                ? { ...c, flipped: false }
                : c
            )
          );
          Alert.alert('🤔 ¡Sigue intentando!', '¡Tú puedes hacerlo! Inténtalo de nuevo.');
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
            <Text style={styles.cardQuestionText}>❓</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.card,
              styles.back,
              card.matched && styles.matchedCard,
              {
                transform: [{ rotateY: rotateYBack }],
                backfaceVisibility: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0,
              },
            ]}
          >
            <Text style={styles.cardIcon}>{card.icon}</Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const totalPairs = step.options?.length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header mejorado */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerAnimation,
              transform: [{
                translateY: headerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })
              }]
            }
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{lessonTitle}</Text>
            <View style={styles.titleUnderline} />
          </View>
          <View style={styles.activityBadge}>
            <Text style={styles.activityText}>🧠 Juego de Memoria</Text>
          </View>
        </Animated.View>

        {/* Instrucciones */}
        <Animated.View 
          style={[
            styles.instructionCard,
            {
              opacity: instructionAnimation,
              transform: [{
                scale: instructionAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })
              }]
            }
          ]}
        >
          <View style={styles.instructionHeader}>
            <Text style={styles.instructionIcon}>👀</Text>
            <Text style={styles.instructionTitle}>
              {showingCards ? '¡Memoriza las cartas!' : '¡Encuentra las parejas!'}
            </Text>
          </View>
          <Text style={styles.instruction}>
            {showingCards 
              ? 'Observa bien las cartas y recuerda dónde están'
              : 'Toca las cartas para voltearlas y encuentra las parejas iguales'
            }
          </Text>
        </Animated.View>

        {/* Barra de progreso */}
        {gameStarted && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>🎯 Progreso</Text>
              <Text style={styles.progressText}>{matchedCount} / {totalPairs}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Grid de cartas */}
        <View style={styles.gameContainer}>
          <View style={styles.grid}>
            {cards.map(renderCard)}
          </View>
        </View>

        {/* Footer motivacional */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>
              {showingCards ? '¡Observa con atención!' : '¡Tú puedes hacerlo!'}
            </Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: '#2D3436',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#9B59B6',
    borderRadius: 2,
  },
  activityBadge: {
    backgroundColor: '#9B59B6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#8E44AD',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  activityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  instructionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#9B59B6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#9B59B6',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  instructionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    color: '#636E72',
    fontWeight: '500',
    lineHeight: 22,
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9B59B6',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#9B59B6',
    borderRadius: 4,
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: width - 40,
  },
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: 8,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  front: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF4757',
  },
  back: {
    backgroundColor: '#4ECDC4',
    borderColor: '#26D0CE',
  },
  matchedCard: {
    backgroundColor: '#55A3FF',
    borderColor: '#3742FA',
    shadowColor: '#3742FA',
    shadowOpacity: 0.3,
  },
  cardQuestionText: {
    fontSize: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardIcon: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  motivationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(155, 89, 182, 0.1)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
  },
  motivationIcon: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9B59B6',
    textAlign: 'center',
  },
});

export default MemoryGameScreen;