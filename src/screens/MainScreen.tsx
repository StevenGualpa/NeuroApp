import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useLanguage } from '../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isMediumScreen = height < 800;

type MainScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MainScreen = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const { t, language } = useLanguage();
  const [showCredits, setShowCredits] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(Array(7).fill(0).map(() => new Animated.Value(1))).current;

  // Menu options - optimized and responsive
  const menuOptions = [
    { 
      key: 'actividades', 
      label: t.navigation.activities, 
      icon: '🎮', 
      color: '#FF6B6B',
      route: 'activityMenu',
    },
    { 
      key: 'progreso', 
      label: language === 'es' ? 'Mi Progreso' : 'My Progress', 
      icon: '📊', 
      color: '#4CAF50',
      route: 'ProgressReport',
    },
    { 
      key: 'logros', 
      label: t.navigation.achievements, 
      icon: '🏆', 
      color: '#45B7D1',
      route: 'Achievements',
    },
    { 
      key: 'perfil', 
      label: language === 'es' ? 'Perfil Médico' : 'Medical Profile', 
      icon: '🧠', 
      color: '#9C27B0',
      route: 'NeurodivergentProfile',
    },
    { 
      key: 'opciones', 
      label: t.navigation.settings, 
      icon: '⚙️', 
      color: '#66BB6A',
      route: 'Settings',
    },
    { 
      key: 'creditos', 
      label: t.navigation.credits, 
      icon: '👥', 
      color: '#FFA726',
      action: 'credits',
    },
    { 
      key: 'salir', 
      label: language === 'es' ? 'Salir' : 'Exit', 
      icon: '🚪', 
      color: '#F44336',
      action: 'exit',
    },
  ];

  // Credits data - simplified
  const creditsData = [
    {
      category: language === 'es' ? 'Desarrollo' : 'Development',
      items: [
        { name: language === 'es' ? 'Desarrollador Principal' : 'Lead Developer', value: 'Steven Gualpa' },
        { name: language === 'es' ? 'Diseño UI/UX' : 'UI/UX Design', value: 'Steven Gualpa' },
        { name: language === 'es' ? 'Programación' : 'Programming', value: 'Yolo Team' },
      ],
    },
    {
      category: language === 'es' ? 'Información' : 'Information',
      items: [
        { name: language === 'es' ? 'Versión' : 'Version', value: '1.0.0' },
        { name: language === 'es' ? 'Plataforma' : 'Platform', value: 'React Native' },
        { name: language === 'es' ? 'Actualización' : 'Last Update', value: language === 'es' ? 'Dic 2024' : 'Dec 2024' },
      ],
    },
  ];

  // Initialize animations
  React.useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      ...scaleAnims.map((anim, index) => 
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, []);

  const handleMenuPress = (option: any) => {
    const index = menuOptions.findIndex(item => item.key === option.key);
    
    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Handle navigation
    if (option.route) {
      navigation.navigate(option.route as keyof RootStackParamList);
    } else if (option.action === 'credits') {
      showCreditsScreen();
    } else if (option.action === 'exit') {
      handleExit();
    }
  };

  const showCreditsScreen = () => {
    setShowCredits(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideCreditsScreen = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowCredits(false));
  };

  const handleExit = () => {
    Alert.alert(
      language === 'es' ? 'Salir' : 'Exit',
      language === 'es' ? '¿Estás seguro de que quieres salir?' : 'Are you sure you want to exit?',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        { text: language === 'es' ? 'Salir' : 'Exit', onPress: () => navigation.navigate('login') },
      ]
    );
  };

  const renderMenuCard = (option: any, index: number) => (
    <Animated.View
      key={option.key}
      style={[
        styles.menuCard,
        { 
          backgroundColor: option.color,
          transform: [{ scale: scaleAnims[index] }],
          opacity: fadeAnim,
        }
      ]}
    >
      <TouchableOpacity
        style={styles.menuCardContent}
        onPress={() => handleMenuPress(option)}
        activeOpacity={0.8}
      >
        <Text style={styles.menuIcon}>{option.icon}</Text>
        <Text style={styles.menuLabel}>{option.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCreditsScreen = () => (
    <Animated.View 
      style={[
        styles.creditsContainer,
        {
          transform: [{
            translateX: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [width, 0],
            })
          }]
        }
      ]}
    >
      <View style={styles.creditsHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={hideCreditsScreen}
        >
          <Text style={styles.backButtonText}>← {t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.creditsTitle}>👥 {t.navigation.credits}</Text>
      </View>
      
      <ScrollView 
        style={styles.creditsContent}
        showsVerticalScrollIndicator={false}
      >
        {creditsData.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.creditsSection}>
            <Text style={styles.sectionTitle}>{section.category}</Text>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.creditsItem}>
                <Text style={styles.itemLabel}>{item.name}</Text>
                <Text style={styles.itemValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ))}
        
        <View style={styles.thankYouSection}>
          <Text style={styles.thankYouText}>
            ❤️ {language === 'es' 
              ? 'Gracias por usar NeuroApp'
              : 'Thank you for using NeuroApp'
            }
          </Text>
          <Text style={styles.thankYouSubtext}>
            {language === 'es'
              ? 'Juntos hacemos el aprendizaje divertido'
              : 'Together we make learning fun'
            }
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {language === 'es' ? 'Bienvenido' : 'Welcome'}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <Animated.View 
            style={[
              styles.welcomeSection,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.welcomeText}>
              🌟 {language === 'es' ? '¡Bienvenido!' : 'Welcome!'} 🌟
            </Text>
            <Text style={styles.welcomeSubtext}>
              {language === 'es' 
                ? '¿Qué quieres hacer hoy?'
                : 'What do you want to do today?'
              }
            </Text>
          </Animated.View>

          {/* Menu Grid */}
          <View style={styles.menuGrid}>
            {menuOptions.map((option, index) => renderMenuCard(option, index))}
          </View>

          {/* Footer */}
          <Animated.View 
            style={[
              styles.footer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.footerText}>
              🚀 {language === 'es' 
                ? '¡Tu aventura de aprendizaje comienza aquí!'
                : 'Your learning adventure starts here!'
              } 🧠
            </Text>
          </Animated.View>
        </ScrollView>
      </View>

      {/* Credits Overlay */}
      {showCredits && renderCreditsScreen()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: isSmallScreen ? 20 : 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 28 : 32,
    fontWeight: '900',
    color: '#4285f4',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 15 : 20,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 5,
  },
  welcomeSubtext: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: isSmallScreen ? 12 : 16,
  },
  menuCard: {
    width: (width - 40 - (isSmallScreen ? 12 : 16)) / 2,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: isSmallScreen ? 12 : 16,
  },
  menuCardContent: {
    padding: isSmallScreen ? 16 : 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isSmallScreen ? 110 : 130,
    position: 'relative',
  },
  menuIcon: {
    fontSize: isSmallScreen ? 36 : 42,
    marginBottom: isSmallScreen ? 6 : 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  menuLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: isSmallScreen ? 13 : 14,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: isSmallScreen ? 15 : 20,
  },
  footerText: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  // Credits styles
  creditsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8faff',
  },
  creditsHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: isSmallScreen ? 15 : 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  creditsTitle: {
    fontSize: isSmallScreen ? 22 : 26,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  creditsContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  creditsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: isSmallScreen ? 16 : 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 12,
  },
  creditsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemLabel: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  itemValue: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#1a1a1a',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  thankYouSection: {
    backgroundColor: '#4285f4',
    borderRadius: 16,
    padding: isSmallScreen ? 16 : 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  thankYouText: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  thankYouSubtext: {
    fontSize: isSmallScreen ? 13 : 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default MainScreen;