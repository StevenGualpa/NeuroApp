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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import MenuGrid, { MenuGridRef } from '../components/MenuGrid';

const { width } = Dimensions.get('window');

type MainScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const creditsData = [
  {
    category: 'Desarrollo',
    items: [
      { name: 'Desarrollador Principal', value: 'Steven Gualpa' },
      { name: 'Diseño UI/UX', value: 'Steven Gualpa' },
      { name: 'Programación', value: 'Yolo Team' },
    ],
  },
  {
    category: 'Contenido',
    items: [
      { name: 'Contenido Educativo', value: 'Especialistas en Educación' },
      { name: 'Ilustraciones', value: 'Artistas Gráficos' },
      { name: 'Sonidos', value: 'Equipo de Audio' },
    ],
  },
  {
    category: 'Agradecimientos',
    items: [
      { name: 'Beta Testers', value: 'Comunidad de Usuarios' },
      { name: 'Feedback', value: 'Padres y Educadores' },
      { name: 'Inspiración', value: 'Niños de Todo el Mundo' },
    ],
  },
];

const MainScreen = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const [showCredits, setShowCredits] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const menuGridRef = useRef<MenuGridRef>(null);

  const menuOptions = [
    { 
      key: 'home', 
      label: 'Home', 
      icon: '🏠', 
      color: '#4ECDC4',
      shadowColor: '#26D0CE',
    },
    { 
      key: 'actividades', 
      label: 'Actividades', 
      icon: '🎮', 
      color: '#FF6B6B',
      shadowColor: '#FF4757',
    },
    { 
      key: 'logros', 
      label: 'Logros', 
      icon: '🏆', 
      color: '#45B7D1',
      shadowColor: '#3742FA',
    },
    { 
      key: 'estadisticas', 
      label: 'Estadísticas', 
      icon: '📊', 
      color: '#9C27B0',
      shadowColor: '#7B1FA2',
    },
    { 
      key: 'creditos', 
      label: 'Créditos', 
      icon: '👥', 
      color: '#FFA726',
      shadowColor: '#FF9800',
    },
  ];

  const handleMenuPress = (option: string) => {
    console.log('🎯 [MainScreen] Navegando a:', option);
    switch (option) {
      case 'home':
        navigation.navigate('login');
        break;
      case 'actividades':
        navigation.navigate('realActivityMenu');
        break;
      case 'logros':
        console.log('🏆 [MainScreen] Navegando a pantalla de logros');
        navigation.navigate('Achievements');
        break;
      case 'estadisticas':
        console.log('📊 [MainScreen] Navegando a pantalla de estadísticas');
        navigation.navigate('Statistics');
        break;
      case 'creditos':
        setShowCredits(true);
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
        break;
    }
  };

  const handleBackFromCredits = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => setShowCredits(false));
  };

  const renderCreditsContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.creditsHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackFromCredits}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.creditsTitle}>👥 Créditos</Text>
        <Text style={styles.creditsSubtitle}>Equipo detrás de la aplicación</Text>
      </View>
      
      <ScrollView 
        style={styles.creditsList}
        showsVerticalScrollIndicator={false}
      >
        {creditsData.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.creditsSection}>
            <Text style={styles.creditsSectionTitle}>{section.category}</Text>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.creditsItem}>
                <Text style={styles.creditsItemLabel}>{item.name}</Text>
                <Text style={styles.creditsItemValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ))}
        
        <View style={styles.appInfoSection}>
          <Text style={styles.appInfoTitle}>📱 Información de la App</Text>
          <View style={styles.appInfoItem}>
            <Text style={styles.appInfoLabel}>Versión</Text>
            <Text style={styles.appInfoValue}>1.0.0</Text>
          </View>
          <View style={styles.appInfoItem}>
            <Text style={styles.appInfoLabel}>Última actualización</Text>
            <Text style={styles.appInfoValue}>Diciembre 2024</Text>
          </View>
          <View style={styles.appInfoItem}>
            <Text style={styles.appInfoLabel}>Plataforma</Text>
            <Text style={styles.appInfoValue}>React Native</Text>
          </View>
        </View>

        <View style={styles.thankYouSection}>
          <Text style={styles.thankYouText}>
            ❤️ Gracias por usar nuestra aplicación educativa
          </Text>
          <Text style={styles.thankYouSubtext}>
            Juntos hacemos el aprendizaje más divertido
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NeuroApp</Text>
        <Text style={styles.headerSubtitle}>Aprendizaje Divertido</Text>
      </View>

      <Animated.View 
        style={[
          styles.contentWrapper,
          {
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -width],
              })
            }]
          }
        ]}
      >
        <View style={styles.screenContainer}>
          <MenuGrid 
            ref={menuGridRef}
            menuOptions={menuOptions}
            onMenuPress={handleMenuPress}
          />
        </View>
        <View style={styles.screenContainer}>
          {renderCreditsContent()}
        </View>
      </Animated.View>
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
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4285f4',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  contentWrapper: {
    flex: 1,
    width: width * 2,
    flexDirection: 'row',
  },
  screenContainer: {
    width: width,
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },

  // Credits Content Styles
  creditsHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  creditsTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  creditsSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
  },
  creditsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  creditsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  creditsSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 16,
  },
  creditsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  creditsItemLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  creditsItemValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  appInfoSection: {
    backgroundColor: '#f8faff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e8f0fe',
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 16,
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  appInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  appInfoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  thankYouSection: {
    backgroundColor: '#4285f4',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  thankYouText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  thankYouSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default MainScreen;