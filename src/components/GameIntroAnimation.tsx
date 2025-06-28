import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface GameIntroAnimationProps {
  activityType: string;
  onComplete: () => void;
}

interface ActivityConfig {
  icon: string;
  title: string;
  description: string;
  steps: string[];
  tip: string;
  color: string;
  shadowColor: string;
}

const activityConfigs: { [key: string]: ActivityConfig } = {
  'orderSteps': {
    icon: '🔢',
    title: 'Ordena los Pasos',
    description: 'Organiza las acciones en el orden correcto para completar una secuencia lógica.',
    steps: [
      '👀 Lee la pregunta con atención',
      '🤔 Piensa en el orden correcto',
      '👆 Toca las opciones en secuencia',
      '✅ ¡Completa la secuencia!'
    ],
    tip: '¡El orden es muy importante!',
    color: '#FF6B6B',
    shadowColor: '#FF4757'
  },
  'selectOption': {
    icon: '✅',
    title: 'Selecciona la Opción',
    description: 'Elige la respuesta correcta entre las opciones disponibles.',
    steps: [
      '📖 Lee la pregunta cuidadosamente',
      '🔍 Analiza todas las opciones',
      '🎯 Selecciona la respuesta correcta',
      '🎉 ¡Excelente elección!'
    ],
    tip: '¡Piensa antes de elegir!',
    color: '#4ECDC4',
    shadowColor: '#26D0CE'
  },
  'dragDrop': {
    icon: '🎯',
    title: 'Arrastra y Suelta',
    description: 'Mueve los elementos al lugar correcto arrastrándolos con tu dedo.',
    steps: [
      '👀 Observa los elementos disponibles',
      '👆 Mantén presionado para arrastrar',
      '🎯 Suelta en el lugar correcto',
      '🌟 ¡Perfecto posicionamiento!'
    ],
    tip: '¡Arrastra con cuidado!',
    color: '#45B7D1',
    shadowColor: '#3742FA'
  },
  'match': {
    icon: '🔗',
    title: 'Asocia Elementos',
    description: 'Conecta elementos que tienen relación entre sí.',
    steps: [
      '🔍 Examina todos los elementos',
      '🤔 Encuentra las conexiones',
      '🔗 Asocia los elementos relacionados',
      '✨ ¡Conexión perfecta!'
    ],
    tip: '¡Busca las relaciones!',
    color: '#FFA726',
    shadowColor: '#FF9800'
  },
  'memoryGame': {
    icon: '🧠',
    title: 'Memoria Visual',
    description: 'Memoriza las posiciones y encuentra las parejas iguales.',
    steps: [
      '👁️ Observa las cartas mostradas',
      '🧠 Memoriza sus posiciones',
      '🔄 Voltea las cartas para encontrar parejas',
      '🎊 ¡Memoria increíble!'
    ],
    tip: '¡Concéntrate y recuerda!',
    color: '#9C27B0',
    shadowColor: '#7B1FA2'
  },
  'repeatSound': {
    icon: '🎵',
    title: 'Repetir Sonidos',
    description: 'Escucha atentamente y repite la secuencia de sonidos.',
    steps: [
      '👂 Escucha la secuencia de sonidos',
      '🧠 Memoriza el orden',
      '🎵 Repite tocando en el mismo orden',
      '🎶 ¡Melodía perfecta!'
    ],
    tip: '¡Usa tus oídos!',
    color: '#E91E63',
    shadowColor: '#C2185B'
  },
  'patternRecognition': {
    icon: '🔍',
    title: 'Reconocimiento de Patrones',
    description: 'Identifica el patrón y completa la secuencia.',
    steps: [
      '👀 Observa el patrón mostrado',
      '🧩 Identifica la lógica',
      '🎯 Completa la secuencia',
      '🌟 ¡Patrón descifrado!'
    ],
    tip: '¡Busca la lógica!',
    color: '#795548',
    shadowColor: '#5D4037'
  }
};

const GameIntroAnimation: React.FC<GameIntroAnimationProps> = ({ activityType, onComplete }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [currentStep, setCurrentStep] = useState(0);
  const [showSteps, setShowSteps] = useState(false);

  const config = activityConfigs[activityType] || activityConfigs['selectOption'];

  useEffect(() => {
    // Animación de entrada
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Mostrar pasos después de la animación inicial
      setTimeout(() => {
        setShowSteps(true);
        animateSteps();
      }, 500);
    });
  }, []);

  const animateSteps = () => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= config.steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  const handleStart = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Header con icono y título */}
        <View style={styles.header}>
          <Animated.View 
            style={[
              styles.iconContainer,
              { 
                backgroundColor: config.color,
                shadowColor: config.shadowColor,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  })
                }]
              }
            ]}
          >
            <Text style={styles.icon}>{config.icon}</Text>
          </Animated.View>
          
          <Animated.View
            style={{
              opacity: slideAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                })
              }]
            }}
          >
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.description}>{config.description}</Text>
          </Animated.View>
        </View>

        {/* Pasos de instrucciones */}
        {showSteps && (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>¿Cómo jugar?</Text>
            {config.steps.map((step, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.stepItem,
                  {
                    opacity: currentStep >= index ? 1 : 0.3,
                    transform: [{
                      scale: currentStep >= index ? 1 : 0.95
                    }]
                  }
                ]}
              >
                <View style={[
                  styles.stepNumber,
                  { 
                    backgroundColor: currentStep >= index ? config.color : '#e0e0e0'
                  }
                ]}>
                  <Text style={[
                    styles.stepNumberText,
                    { color: currentStep >= index ? '#ffffff' : '#999999' }
                  ]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[
                  styles.stepText,
                  { 
                    color: currentStep >= index ? '#1a1a1a' : '#999999',
                    fontWeight: currentStep >= index ? '600' : '400'
                  }
                ]}>
                  {step}
                </Text>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Tip */}
        {showSteps && currentStep >= config.steps.length - 1 && (
          <Animated.View 
            style={[
              styles.tipContainer,
              { backgroundColor: `${config.color}20` }
            ]}
          >
            <Text style={[styles.tipText, { color: config.color }]}>
              💡 {config.tip}
            </Text>
          </Animated.View>
        )}

        {/* Botón de comenzar */}
        {showSteps && currentStep >= config.steps.length - 1 && (
          <Animated.View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.startButton,
                { 
                  backgroundColor: config.color,
                  shadowColor: config.shadowColor
                }
              ]}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>🚀 ¡Comenzar a Jugar!</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width - 40,
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  tipContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  tipText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  startButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default GameIntroAnimation;