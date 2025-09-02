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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Animation refs
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimation = useRef(new Animated.Value(1)).current;
  const featuresAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const navButtonsAnimation = useRef(new Animated.Value(0)).current;
  const prevButtonScale = useRef(new Animated.Value(1)).current;
  const nextButtonScale = useRef(new Animated.Value(1)).current;

  // Slides content with more context
  const slides = [
    {
      icon: '🧠',
      title: '¡Bienvenido a NeuroApp!',
      subtitle: 'Tu Compañero de Aprendizaje',
      description: 'Una aplicación educativa diseñada especialmente para hacer el aprendizaje divertido, interactivo y personalizado.',
      audioText: 'Hola! Bienvenido a NeuroApp, tu compañero de aprendizaje. Esta es una aplicación educativa especial que hace que aprender sea divertido, interactivo y personalizado solo para ti.',
      color: '#4285f4',
    },
    {
      icon: '🎮',
      title: '6 Tipos de Actividades',
      subtitle: 'Diversión Garantizada',
      description: 'Explora diferentes tipos de juegos educativos que desarrollan habilidades cognitivas, motoras y de comunicación.',
      color: '#FF6B6B',
    },
    {
      icon: '🏆',
      title: 'Sistema de Recompensas',
      subtitle: 'Celebra Cada Logro',
      description: 'Gana estrellas, desbloquea logros y ve tu progreso mientras aprendes. Cada pequeño paso cuenta.',
      color: '#4ECDC4',
    },
    {
      icon: '🎨',
      title: 'Aprendizaje Personalizado',
      subtitle: 'A Tu Propio Ritmo',
      description: 'La aplicación se adapta a tu velocidad de aprendizaje. Sin presión, sin estrés, solo diversión educativa.',
      color: '#9C27B0',
    },
    {
      icon: '🌟',
      title: 'Categorías Educativas',
      subtitle: 'Contenido Organizado',
      description: 'Explora diferentes areas de aprendizaje organizadas por categorías para un desarrollo integral.',
      color: '#FF9800',
    },
    {
      icon: '🚀',
      title: '¡Todo Listo para Empezar!',
      subtitle: 'Tu Aventura Comienza Ahora',
      description: 'Tienes todo lo necesario para comenzar tu viaje de aprendizaje. ¡Vamos a explorar juntos!',
      color: '#FFA726',
    },
  ];

  const currentSlideData = slides[currentSlide];

  useEffect(() => {
    // Initial animations
    Animated.sequence([
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Show navigation buttons after content loads
      Animated.timing(navButtonsAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // No auto-play audio - let user decide when to listen
    });

    // Continuous pulse animation for icon
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Auto-advance slides with enhanced transitions (only if autoAdvance is true)
    let slideInterval: NodeJS.Timeout | null = null;
    
    if (autoAdvance && !isDownloading) {
      slideInterval = setInterval(() => {
        if (currentSlide < slides.length - 1) {
          setCurrentSlide(prev => prev + 1);
          
          // Simple slide transition animation for auto-advance
          Animated.sequence([
            Animated.timing(slideAnimation, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnimation, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }, 5000); // 5 seconds per slide
    }

    return () => {
      if (slideInterval) clearInterval(slideInterval);
      pulseLoop.stop();
    };
  }, [currentSlide, isDownloading, autoAdvance]);

  const handleNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setAutoAdvance(false); // Disable auto-advance when user manually navigates
      setCurrentSlide(prev => prev + 1);
      
      // Enhanced slide transition animation
      Animated.sequence([
        Animated.timing(slideAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) {
      setAutoAdvance(false); // Disable auto-advance when user manually navigates
      setCurrentSlide(prev => prev - 1);
      
      // Enhanced slide transition animation
      Animated.sequence([
        Animated.timing(slideAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePrevButtonPress = () => {
    Animated.sequence([
      Animated.timing(prevButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(prevButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    handlePrevSlide();
  };

  const handleNextButtonPress = () => {
    Animated.sequence([
      Animated.timing(nextButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(nextButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    handleNextSlide();
  };

  const handleDownload = () => {
    setIsDownloading(true);
    
    // Button press animation
    Animated.timing(buttonAnimation, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Simulate download progress
    const downloadInterval = setInterval(() => {
      setDownloadProgress(prev => {
        const newProgress = prev + Math.random() * 15 + 5;
        
        // Animate progress bar
        Animated.timing(progressAnimation, {
          toValue: newProgress / 100,
          duration: 200,
          useNativeDriver: false,
        }).start();

        if (newProgress >= 100) {
          clearInterval(downloadInterval);
          
          // Complete animation
          setTimeout(() => {
            Animated.timing(contentAnimation, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              navigation.replace('MainScreen');
            });
          }, 1000);
          
          return 100;
        }
        
        return newProgress;
      });
    }, 150);
  };

  const getDownloadMessage = () => {
    if (downloadProgress < 30) return 'Preparando tu aventura...';
    if (downloadProgress < 60) return 'Cargando actividades divertidas...';
    if (downloadProgress < 90) return 'Casi listo para jugar...';
    return '¡Aventura lista! 🎉';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentSlideData.color }]}>
      <StatusBar barStyle="light-content" backgroundColor={currentSlideData.color} />
      
      {/* Background decorations */}
      <View style={styles.backgroundDecorations}>
        <Animated.View style={[styles.decoration1, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        <Animated.View style={[styles.decoration2, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]} />
        <Animated.View style={[styles.decoration3, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
      </View>

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: contentAnimation,
            transform: [{
              translateY: contentAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}
      >
        {/* Logo/Icon Section */}
        <Animated.View 
          style={[
            styles.logoSection,
            {
              opacity: logoAnimation,
              transform: [
                {
                  scale: logoAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  })
                },
                {
                  rotate: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }
              ]
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: pulseAnimation }]
              }
            ]}
          >
            <Text style={styles.slideIcon}>{currentSlideData.icon}</Text>
          </Animated.View>
        </Animated.View>

        {/* Content Section */}
        <Animated.View 
          style={[
            styles.textSection,
            {
              transform: [{
                translateX: slideAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, -20, 0],
                })
              }]
            }
          ]}
        >
          <Text style={styles.title}>{currentSlideData.title}</Text>
          <Text style={styles.subtitle}>{currentSlideData.subtitle}</Text>
          <Text style={styles.description}>{currentSlideData.description}</Text>
        </Animated.View>

        {/* Navigation Controls */}
        {!isDownloading && (
          <View style={styles.navigationContainer}>
            {/* Navigation Buttons */}
            <Animated.View 
              style={[
                styles.navigationButtons,
                {
                  opacity: navButtonsAnimation,
                  transform: [{
                    translateY: navButtonsAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }
              ]}
            >
              {/* Previous Button */}
              <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    styles.prevButton,
                    currentSlide === 0 && styles.navButtonDisabled
                  ]}
                  onPress={handlePrevButtonPress}
                  disabled={currentSlide === 0}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.navButtonText,
                    currentSlide === 0 && styles.navButtonTextDisabled
                  ]}>‹</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Progress Indicators */}
              <View style={styles.progressIndicators}>
                {slides.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.progressDot,
                      index === currentSlide && styles.progressDotActive,
                    ]}
                    onPress={() => {
                      setAutoAdvance(false); // Stop auto-advance permanently when user clicks dots
                      setCurrentSlide(index);
                    }}
                    activeOpacity={0.7}
                  />
                ))}
              </View>

              {/* Next Button */}
              <Animated.View style={{ transform: [{ scale: nextButtonScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    styles.nextButton,
                    currentSlide === slides.length - 1 && styles.navButtonDisabled
                  ]}
                  onPress={handleNextButtonPress}
                  disabled={currentSlide === slides.length - 1}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.navButtonText,
                    currentSlide === slides.length - 1 && styles.navButtonTextDisabled
                  ]}>›</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
        )}

        {/* Download Section */}
        {currentSlide === slides.length - 1 && (
          <View style={styles.downloadSection}>
            {!isDownloading ? (
              <Animated.View style={{ transform: [{ scale: buttonAnimation }] }}>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={handleDownload}
                  activeOpacity={0.8}
                >
                  <Text style={styles.downloadButtonIcon}>🚀</Text>
                  <Text style={styles.downloadButtonText}>¡Iniciar Mi Aventura!</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={styles.downloadingContainer}>
                <Text style={styles.downloadingTitle}>{getDownloadMessage()}</Text>
                
                {/* Progress Bar */}
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
                  <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
                </View>

                {/* Loading Animation */}
                <View style={styles.loadingAnimationContainer}>
                  <Text style={styles.loadingEmoji}>🎮</Text>
                  <Text style={styles.loadingEmoji}>🧩</Text>
                  <Text style={styles.loadingEmoji}>🎨</Text>
                  <Text style={styles.loadingEmoji}>🎵</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💝 Creado con amor para el aprendizaje divertido ✨
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
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -50,
    right: -50,
  },
  decoration2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: 100,
    left: -30,
  },
  decoration3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: height * 0.3,
    right: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  logoSection: {
    marginBottom: 40,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 80,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  slideIcon: {
    fontSize: 80,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  navigationContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: 28,
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
    marginRight: 10,
  },
  nextButton: {
    marginLeft: 10,
  },
  progressIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    transform: [{ scale: 1.3 }],
  },
  downloadSection: {
    width: '100%',
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  downloadButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  downloadButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285f4',
  },
  downloadingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  downloadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: '80%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingAnimationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
  },
  loadingEmoji: {
    fontSize: 32,
    opacity: 0.7,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default OnboardingScreen;