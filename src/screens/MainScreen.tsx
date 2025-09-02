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
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

type MainScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MainScreen = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const { t } = useLanguage();
  const [showCredits, setShowCredits] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const menuGridRef = useRef<MenuGridRef>(null);

  // Credits data with translations
  const creditsData = [
    {
      category: t.language === 'es' ? 'Desarrollo' : 'Development',
      items: [
        { name: t.language === 'es' ? 'Desarrollador Principal' : 'Lead Developer', value: 'Steven Gualpa' },
        { name: t.language === 'es' ? 'Diseño UI/UX' : 'UI/UX Design', value: 'Steven Gualpa' },
        { name: t.language === 'es' ? 'Programación' : 'Programming', value: 'Yolo Team' },
      ],
    },
    {
      category: t.language === 'es' ? 'Contenido' : 'Content',
      items: [
        { name: t.language === 'es' ? 'Contenido Educativo' : 'Educational Content', value: t.language === 'es' ? 'Especialistas en Educación' : 'Education Specialists' },
        { name: t.language === 'es' ? 'Ilustraciones' : 'Illustrations', value: t.language === 'es' ? 'Artistas Gráficos' : 'Graphic Artists' },
        { name: t.language === 'es' ? 'Sonidos' : 'Sounds', value: t.language === 'es' ? 'Equipo de Audio' : 'Audio Team' },
      ],
    },
    {
      category: t.language === 'es' ? 'Agradecimientos' : 'Acknowledgments',
      items: [
        { name: t.language === 'es' ? 'Evaluadores Beta' : 'Beta Testers', value: t.language === 'es' ? 'Comunidad de Usuarios' : 'User Community' },
        { name: t.language === 'es' ? 'Retroalimentación' : 'Feedback', value: t.language === 'es' ? 'Padres y Educadores' : 'Parents and Educators' },
        { name: t.language === 'es' ? 'Inspiraci��n' : 'Inspiration', value: t.language === 'es' ? 'Niños de Todo el Mundo' : 'Children Around the World' },
      ],
    },
  ];

  // Opciones del menú en el orden correcto
  const menuOptions = [
    { 
      key: 'actividades', 
      label: t.navigation.activities, 
      icon: '🎮', 
      color: '#FF6B6B',
      shadowColor: '#FF4757',
    },
    { 
      key: 'logros', 
      label: t.navigation.achievements, 
      icon: '🏆', 
      color: '#45B7D1',
      shadowColor: '#3742FA',
    },
    { 
      key: 'estadisticas', 
      label: t.navigation.statistics, 
      icon: '📊', 
      color: '#9C27B0',
      shadowColor: '#7B1FA2',
    },
    { 
      key: 'opciones', 
      label: t.navigation.settings, 
      icon: '⚙️', 
      color: '#66BB6A',
      shadowColor: '#4CAF50',
    },
    { 
      key: 'creditos', 
      label: t.navigation.credits, 
      icon: '👥', 
      color: '#FFA726',
      shadowColor: '#FF9800',
    },
    { 
      key: 'salir', 
      label: t.language === 'es' ? 'Salir' : 'Exit', 
      icon: '🚪', 
      color: '#F44336',
      shadowColor: '#D32F2F',
    },
  ];

  const handleMenuPress = (option: string) => {
    console.log('🎯 [MainScreen] Navegando a:', option);
    switch (option) {
      case 'actividades':
        console.log('🎮 [MainScreen] Navegando a menú de actividades');
        navigation.navigate('activityMenu');
        break;
      case 'logros':
        console.log('🏆 [MainScreen] Navegando a pantalla de logros');
        navigation.navigate('Achievements');
        break;
      case 'estadisticas':
        console.log('📊 [MainScreen] Navegando a pantalla de estadísticas');
        navigation.navigate('Statistics');
        break;
      case 'opciones':
        console.log('⚙️ [MainScreen] Navegando a pantalla de configuraciones');
        navigation.navigate('Settings');
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
      case 'salir':
        console.log('🚪 [MainScreen] Saliendo a login');
        navigation.navigate('login');
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
          <Text style={styles.backButtonText}>← {t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.creditsTitle}>👥 {t.navigation.credits}</Text>
        <Text style={styles.creditsSubtitle}>
          {t.language === 'es' ? 'Equipo detrás de la aplicación' : 'Team behind the application'}
        </Text>
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
          <Text style={styles.appInfoTitle}>
            📱 {t.language === 'es' ? 'Información de la App' : 'App Information'}
          </Text>
          <View style={styles.appInfoItem}>
            <Text style={styles.appInfoLabel}>
              {t.language === 'es' ? 'Versión' : 'Version'}
            </Text>
            <Text style={styles.appInfoValue}>1.0.0</Text>
          </View>
          <View style={styles.appInfoItem}>
            <Text style={styles.appInfoLabel}>
              {t.language === 'es' ? 'Última actualización' : 'Last update'}
            </Text>
            <Text style={styles.appInfoValue}>
              {t.language === 'es' ? 'Diciembre 2024' : 'December 2024'}
            </Text>
          </View>
          <View style={styles.appInfoItem}>
            <Text style={styles.appInfoLabel}>
              {t.language === 'es' ? 'Plataforma' : 'Platform'}
            </Text>
            <Text style={styles.appInfoValue}>React Native</Text>
          </View>
        </View>

        <View style={styles.thankYouSection}>
          <Text style={styles.thankYouText}>
            ❤️ {t.language === 'es' 
              ? 'Gracias por usar nuestra aplicación educativa'
              : 'Thank you for using our educational app'
            }
          </Text>
          <Text style={styles.thankYouSubtext}>
            {t.language === 'es'
              ? 'Juntos hacemos el aprendizaje más divertido'
              : 'Together we make learning more fun'
            }
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.mainScreen.title}</Text>
        <Text style={styles.headerSubtitle}>{t.mainScreen.subtitle}</Text>
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
        {/* Main Menu Screen con ScrollView */}
        <View style={styles.screenContainer}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            bounces={true}
            contentContainerStyle={styles.scrollContent}
          >
            <MenuGrid 
              ref={menuGridRef}
              menuOptions={menuOptions}
              onMenuPress={handleMenuPress}
              language={t.language}
            />
          </ScrollView>
        </View>
        
        {/* Credits Screen */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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