import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useLanguage } from '../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isMediumScreen = height < 800;

const OnboardingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { language } = useLanguage();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Animations
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Slides data - optimized and bilingual
  const slides = [
    {
      icon: '🧠',
      title: language === 'es' ? '¡Bienvenido a NeuroApp!' : 'Welcome to NeuroApp!',
      description: language === 'es' 
        ? 'Tu compañero de aprendizaje personalizado y divertido'
        : 'Your personalized and fun learning companion',
      color: '#4285f4',
    },
    {
      icon: '🎮',
      title: language === 'es' ? 'Juegos Educativos' : 'Educational Games',
      description: language === 'es'
        ? '6 tipos de actividades interactivas para desarrollar habilidades'
        : '6 types of interactive activities to develop skills',
      color: '#FF6B6B',
    },
    {
      icon: '🏆',
      title: language === 'es' ? 'Sistema de Logros' : 'Achievement System',
      description: language === 'es'
        ? 'Gana estrellas y desbloquea logros mientras aprendes'
        : 'Earn stars and unlock achievements while learning',
      color: '#4ECDC4',
    },
    {
      icon: '🎨',
      title: language === 'es' ? 'Aprendizaje Adaptativo' : 'Adaptive Learning',
      description: language === 'es'
        ? 'La app se adapta a tu ritmo y estilo de aprendizaje'
        : 'The app adapts to your pace and learning style',
      color: '#9C27B0',
    },
    {
      icon: '🚀',
      title: language === 'es' ? '¡Listo para Empezar!' : 'Ready to Start!',
      description: language === 'es'
        ? 'Tu aventura de aprendizaje comienza ahora'
        : 'Your learning adventure begins now',
      color: '#FF9800',
    },
  ];

  const currentSlideData = slides[currentSlide];

  useEffect(() => {
    // Initial animations
    Animated.stagger(200, [
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for icon
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  const navigateToSlide = (index: number) => {
    if (index === currentSlide) return;
    
    Animated.sequence([
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setCurrentSlide(index);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      navigateToSlide(currentSlide + 1);
    } else {
      handleStart();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      navigateToSlide(currentSlide - 1);
    }
  };

  const handleStart = () => {
    setIsLoading(true);
    
    // Simulate loading with progress
    const loadingInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 20 + 10;
        
        Animated.timing(progressAnimation, {
          toValue: newProgress / 100,
          duration: 150,
          useNativeDriver: false,
        }).start();

        if (newProgress >= 100) {
          clearInterval(loadingInterval);
          setTimeout(() => {
            navigation.replace('MainScreen');
          }, 500);
          return 100;
        }
        
        return newProgress;
      });
    }, 200);
  };

  const getLoadingMessage = () => {
    if (progress < 40) return language === 'es' ? 'Preparando tu aventura...' : 'Preparing your adventure...';
    if (progress < 80) return language === 'es' ? 'Cargando actividades...' : 'Loading activities...';
    return language === 'es' ? '¡Casi listo! 🎉' : 'Almost ready! 🎉';
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentSlideData.color }]}>
      <StatusBar barStyle="light-content" backgroundColor={currentSlideData.color} />
      
      {/* Background decorations */}
      <View style={styles.backgroundDecorations}>
        <View style={[styles.decoration1, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        <View style={[styles.decoration2, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
      </View>

      {/* Header with logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/Logoapp.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>NeuroApp</Text>
        </View>
      </View>

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: slideAnimation,
            transform: [{
              translateY: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }]
          }
        ]}
      >
        {/* Icon Section */}
        <Animated.View 
          style={[
            styles.iconSection,
            {
              transform: [{ scale: pulseAnimation }]
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.slideIcon}>{currentSlideData.icon}</Text>
          </View>
        </Animated.View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.title}>{currentSlideData.title}</Text>
          <Text style={styles.description}>{currentSlideData.description}</Text>
        </View>

        {/* Progress Indicators */}
        <View style={styles.progressIndicators}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.progressDot,
                index === currentSlide && styles.progressDotActive,
              ]}
              onPress={() => navigateToSlide(index)}
              activeOpacity={0.7}
            />
          ))}
        </View>
      </Animated.View>

      {/* Loading Section */}
      {isLoading && (
        <View style={styles.loadingSection}>
          <Text style={styles.loadingTitle}>{getLoadingMessage()}</Text>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        </View>
      )}

      {/* Navigation Buttons */}
      {!isLoading && (
        <View style={styles.navigationSection}>
          <View style={styles.navigationButtons}>
            {/* Previous Button */}
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.prevButton,
                currentSlide === 0 && styles.navButtonDisabled
              ]}
              onPress={handlePrev}
              disabled={currentSlide === 0}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.navButtonText,
                currentSlide === 0 && styles.navButtonTextDisabled
              ]}>‹</Text>
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => navigation.replace('MainScreen')}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>
                {language === 'es' ? 'Saltar' : 'Skip'}
              </Text>
            </TouchableOpacity>

            {/* Next/Start Button */}
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={styles.navButtonText}>
                {isLastSlide ? '🚀' : '›'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {language === 'es' 
            ? '✨ Creado con amor para el aprendizaje ✨'
            : '✨ Made with love for learning ✨'
          }
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecorations: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  decoration1: {
    position: 'absolute',
    width: isSmallScreen ? 120 : 150,
    height: isSmallScreen ? 120 : 150,
    borderRadius: isSmallScreen ? 60 : 75,
    top: -30,
    right: -30,
  },
  decoration2: {
    position: 'absolute',
    width: isSmallScreen ? 80 : 100,
    height: isSmallScreen ? 80 : 100,
    borderRadius: isSmallScreen ? 40 : 50,
    bottom: isSmallScreen ? 80 : 120,
    left: -20,
  },
  header: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 10 : 20,
    paddingBottom: isSmallScreen ? 10 : 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: isSmallScreen ? 40 : 50,
    height: isSmallScreen ? 40 : 50,
    marginRight: 10,
    borderRadius: isSmallScreen ? 20 : 25,
  },
  logoText: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconSection: {
    marginBottom: isSmallScreen ? 20 : 30,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: isSmallScreen ? 60 : 70,
    width: isSmallScreen ? 120 : 140,
    height: isSmallScreen ? 120 : 140,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  slideIcon: {
    fontSize: isSmallScreen ? 60 : 70,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 30 : 40,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: isSmallScreen ? 14 : 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 20 : 24,
    fontWeight: '500',
  },
  progressIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: isSmallScreen ? 8 : 10,
    height: isSmallScreen ? 8 : 10,
    borderRadius: isSmallScreen ? 4 : 5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: isSmallScreen ? 4 : 6,
  },
  progressDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    transform: [{ scale: 1.3 }],
  },
  loadingSection: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },
  loadingTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBarContainer: {
    width: '80%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: isSmallScreen ? 8 : 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: isSmallScreen ? 4 : 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: isSmallScreen ? 4 : 5,
  },
  progressText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  navigationSection: {
    paddingHorizontal: 20,
    paddingBottom: isSmallScreen ? 10 : 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: isSmallScreen ? 45 : 50,
    height: isSmallScreen ? 45 : 50,
    borderRadius: isSmallScreen ? 22.5 : 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonText: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  navButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  prevButton: {
    // Specific styles for previous button if needed
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipButtonText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: isSmallScreen ? 10 : 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default OnboardingScreen;