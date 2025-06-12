import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
  FlatList,
  Dimensions,
  ScrollView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

const OrderStepsScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'orderSteps'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  // Crear una copia de las opciones y mezclarlas
  const shuffledOptions = [...(step.options || [])].sort(() => Math.random() - 0.5);

  const [selectedOrder, setSelectedOrder] = useState<any[]>([]);
  const [status, setStatus] = useState<{ [key: string]: 'correct' | 'wrong' | 'idle' }>({});
  const [disabled, setDisabled] = useState(false);

  const headerAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initStatus: any = {};
    shuffledOptions.forEach(opt => initStatus[opt.label] = 'idle');
    setStatus(initStatus);

    // Animación de entrada
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Actualizar barra de progreso
    const progress = selectedOrder.length / shuffledOptions.length;
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [selectedOrder]);

  const handleSelect = (option: any) => {
    if (disabled || selectedOrder.some(item => item.label === option.label)) return;

    const newOrder = [...selectedOrder, option];
    setSelectedOrder(newOrder);

    // Encontrar qué paso debería ser el siguiente basado en el orden
    const expectedStep = newOrder.length;
    const isCorrect = option.order === expectedStep;

    setStatus(prev => ({ ...prev, [option.label]: isCorrect ? 'correct' : 'wrong' }));

    if (!isCorrect) {
      setDisabled(true);
      setTimeout(() => {
        Alert.alert(
          '🤔 ¡Inténtalo otra vez!', 
          'Ese no era el paso correcto. ¡Tú puedes hacerlo!',
          [
            {
              text: '¡Intentar de nuevo!',
              onPress: reset,
            }
          ]
        );
      }, 800);
    } else if (newOrder.length === shuffledOptions.length) {
      setTimeout(() => {
        Alert.alert(
          '🎉 ¡Excelente!', 
          '¡Has completado la secuencia correctamente! ¡Muy bien hecho!',
          [
            {
              text: '¡Continuar!',
              onPress: () => navigation.goBack(),
            }
          ]
        );
      }, 500);
    }
  };

  const reset = () => {
    const resetStatus: any = {};
    shuffledOptions.forEach(opt => resetStatus[opt.label] = 'idle');
    setStatus(resetStatus);
    setSelectedOrder([]);
    setDisabled(false);
  };

  const renderItem = ({ item }: { item: any }) => {
    const itemStatus = status[item.label];
    const isSelected = selectedOrder.some(selected => selected.label === item.label);
    const stepNumber = selectedOrder.findIndex(selected => selected.label === item.label) + 1;

    return (
      <View style={styles.optionWrapper}>
        <TouchableOpacity
          disabled={disabled || itemStatus !== 'idle'}
          style={[
            styles.optionCard,
            itemStatus === 'correct' && styles.optionCardCorrect,
            itemStatus === 'wrong' && styles.optionCardWrong,
            itemStatus === 'idle' && styles.optionCardIdle,
          ]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.8}
        >
          <View style={styles.optionContent}>
            <Text style={[
              styles.optionIcon,
              itemStatus === 'correct' && styles.optionIconCorrect,
              itemStatus === 'wrong' && styles.optionIconWrong,
            ]}>
              {item.icon}
            </Text>
            <Text style={[
              styles.optionLabel,
              itemStatus === 'correct' && styles.optionLabelCorrect,
              itemStatus === 'wrong' && styles.optionLabelWrong,
            ]}>
              {item.label}
            </Text>
          </View>
          
          {isSelected && itemStatus === 'correct' && (
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{stepNumber}</Text>
            </View>
          )}
          
          {itemStatus === 'wrong' && (
            <View style={styles.wrongIndicator}>
              <Text style={styles.wrongIndicatorText}>✗</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
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
          <Text style={styles.title}>{lessonTitle}</Text>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  })
                }
              ]} 
            />
          </View>
        </Animated.View>

        {/* Instrucciones simplificadas */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Ordena los pasos</Text>
          <Text style={styles.instruction}>{step.text}</Text>
        </View>

        {/* Grid de opciones */}
        <View style={styles.gameContainer}>
          <FlatList
            data={shuffledOptions}
            keyExtractor={(item, idx) => item.label + idx}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.grid}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Botón de reset */}
        {selectedOrder.length > 0 && (
          <View style={styles.resetContainer}>
            <TouchableOpacity onPress={reset} style={styles.resetButton}>
              <Text style={styles.resetText}>🔄 Reiniciar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e8f0fe',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 3,
  },
  instructionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#4285f4',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instruction: {
    fontSize: 18,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 24,
  },
  gameContainer: {
    flex: 1,
    marginBottom: 20,
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionWrapper: {
    width: (width - 60) / 2,
    marginHorizontal: 5,
    marginVertical: 8,
  },
  optionCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    position: 'relative',
  },
  optionCardIdle: {
    backgroundColor: '#ffffff',
    borderColor: '#e8f0fe',
    shadowColor: '#4285f4',
  },
  optionCardCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.3,
  },
  optionCardWrong: {
    backgroundColor: '#ffeaea',
    borderColor: '#f44336',
    shadowColor: '#f44336',
    shadowOpacity: 0.3,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  optionIconCorrect: {
    opacity: 0.9,
  },
  optionIconWrong: {
    opacity: 0.7,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 18,
  },
  optionLabelCorrect: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  optionLabelWrong: {
    color: '#c62828',
    fontWeight: '700',
  },
  stepNumber: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    backgroundColor: '#4caf50',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  wrongIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    backgroundColor: '#f44336',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  wrongIndicatorText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: '#6b7280',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resetText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  backButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f8faff',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  backButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderStepsScreen;