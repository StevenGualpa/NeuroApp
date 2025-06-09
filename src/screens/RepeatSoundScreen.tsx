// RepeatSoundScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import Tts from 'react-native-tts';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

const RepeatSoundScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'repeatSound'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  const speakerScale = useRef(new Animated.Value(1)).current;
  const optionScales = useRef(
    step.options?.map(() => new Animated.Value(1)) || []
  ).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const headerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Tts.setDefaultLanguage('es-ES');
    Tts.setDefaultRate(0.5);
    
    // Animación de entrada del header
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Reproducir automáticamente al cargar
    setTimeout(() => {
      playAudio();
    }, 1000);

    // Animación de pulso continua para el botón de audio
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulse();

    return () => {
      Tts.stop();
    };
  }, []);

  const playAudio = () => {
    setIsPlaying(true);
    Tts.speak(step.audio);
    
    // Animación del botón de audio
    Animated.sequence([
      Animated.timing(speakerScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(speakerScale, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(speakerScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => setIsPlaying(false), 1000);
    });
  };

  const handleOptionPress = (optionIndex: number, correct: boolean) => {
    setSelectedOption(optionIndex);
    
    // Animación de la opción seleccionada
    Animated.spring(optionScales[optionIndex], {
      toValue: 0.95,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(optionScales[optionIndex], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });

    setTimeout(() => {
      if (correct) {
        Alert.alert(
          '🎉 ¡Excelente!', 
          '¡Has elegido la opción correcta! ¡Muy bien hecho!',
          [
            {
              text: '¡Continuar!',
              onPress: () => navigation.goBack(),
            }
          ]
        );
      } else {
        Alert.alert(
          '🤔 ¡Inténtalo otra vez!', 
          'Esa no es la opción correcta. ¡Tú puedes hacerlo!',
          [
            {
              text: '¡Intentar de nuevo!',
              onPress: () => setSelectedOption(null),
            }
          ]
        );
      }
    }, 300);
  };

  const handleOptionPressIn = (index: number) => {
    Animated.spring(optionScales[index], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleOptionPressOut = (index: number) => {
    if (selectedOption !== index) {
      Animated.spring(optionScales[index], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

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
        </Animated.View>

        {/* Botón de Audio mejorado */}
        <View style={styles.audioSection}>
          <Animated.View 
            style={[
              styles.audioContainer,
              { 
                transform: [
                  { scale: speakerScale },
                  { scale: pulseAnimation }
                ] 
              }
            ]}
          >
            <TouchableOpacity 
              style={[
                styles.speakerButton,
                isPlaying && styles.speakerButtonActive
              ]} 
              onPress={playAudio}
              activeOpacity={0.8}
            >
              <View style={styles.speakerIconContainer}>
                <Text style={styles.speakerIcon}>
                  {isPlaying ? '🔊' : '🎵'}
                </Text>
              </View>
              <Text style={styles.speakerText}>
                {isPlaying ? '¡Reproduciendo!' : '¡Presiona para escuchar!'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Opciones con instrucciones integradas */}
        <View style={styles.optionsSection}>
          <View style={styles.instructionCard}>
            <View style={styles.instructionHeader}>
              <Text style={styles.instructionIcon}>👂</Text>
              <Text style={styles.instructionTitle}>¡Escucha con atención!</Text>
            </View>
            <Text style={styles.instruction}>
              Presiona el botón de audio y elige el pictograma correcto
            </Text>
          </View>
          
          <View style={styles.optionsGrid}>
            {step.options?.map((option, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.optionContainer,
                  { transform: [{ scale: optionScales[idx] }] }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedOption === idx && styles.optionButtonSelected
                  ]}
                  onPress={() => handleOptionPress(idx, option.correct)}
                  onPressIn={() => handleOptionPressIn(idx)}
                  onPressOut={() => handleOptionPressOut(idx)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.iconContainer,
                    selectedOption === idx && styles.iconContainerSelected
                  ]}>
                    <Text style={styles.icon}>{option.icon}</Text>
                  </View>
                  <Text style={[
                    styles.label,
                    selectedOption === idx && styles.labelSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Footer motivacional mejorado */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>¡Tú puedes hacerlo!</Text>
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
    backgroundColor: '#F5F7FF',
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
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
  instructionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#4ECDC4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#4ECDC4',
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
  audioSection: {
    alignItems: 'center',
    marginBottom: 35,
  },
  audioContainer: {
    alignItems: 'center',
  },
  speakerButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 35,
    paddingVertical: 25,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#26D0CE',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    minWidth: 220,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  speakerButtonActive: {
    backgroundColor: '#45B7D1',
    shadowColor: '#3742FA',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  speakerIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  speakerIcon: {
    fontSize: 28,
  },
  speakerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  optionsSection: {
    flex: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
  },
  optionContainer: {
    width: (width - 60) / 2,
    maxWidth: 160,
  },
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'transparent',
    minHeight: 140,
    justifyContent: 'center',
  },
  optionButtonSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#F0FFFF',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.3,
  },
  iconContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  icon: {
    fontSize: 35,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2D3436',
    lineHeight: 18,
  },
  labelSelected: {
    color: '#4ECDC4',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 35,
  },
  motivationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
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
    color: '#4ECDC4',
    textAlign: 'center',
  },
});

export default RepeatSoundScreen;