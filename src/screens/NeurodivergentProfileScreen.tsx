// src/screens/NeurodivergentProfileScreen.tsx
// Pantalla para configurar el perfil neurodivergente del niño

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useAuth } from '../hooks';
import AnalysisService, { NeurodivergentProfile } from '../services/AnalysisService';

type DiagnosisType = 'TDAH' | 'TEA' | 'Dislexia' | 'Discalculia' | 'Otro' | '';
type SeverityType = 'Leve' | 'Moderado' | 'Severo' | '';

const NeurodivergentProfileScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Form state
  const [diagnosis, setDiagnosis] = useState<DiagnosisType>('');
  const [severity, setSeverity] = useState<SeverityType>('');
  const [diagnosisDate, setDiagnosisDate] = useState(new Date().toISOString());
  const [diagnosedBy, setDiagnosedBy] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Características seleccionables
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const profile = await AnalysisService.getNeurodivergentProfile(user.id);
      if (profile) {
        setHasProfile(true);
        setDiagnosis(profile.primary_diagnosis as DiagnosisType);
        setSeverity(profile.severity as SeverityType);
        setDiagnosisDate(profile.diagnosis_date);
        setDiagnosedBy(profile.diagnosed_by || '');
        setClinicalNotes(profile.clinical_notes || '');

        // Parsear áreas de dificultad
        try {
          const difficulties = JSON.parse(profile.difficulty_areas || '[]');
          setSelectedDifficulties(difficulties);
        } catch (e) {}

        // Parsear fortalezas
        try {
          const strengths = JSON.parse(profile.strength_areas || '[]');
          setSelectedStrengths(strengths);
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    // Validaciones
    if (!diagnosis) {
      Alert.alert('Error', 'Por favor selecciona un diagnóstico');
      return;
    }
    if (!severity) {
      Alert.alert('Error', 'Por favor selecciona la severidad');
      return;
    }

    setSaving(true);
    try {
      const profileData: NeurodivergentProfile = {
        primary_diagnosis: diagnosis,
        severity,
        diagnosis_date: diagnosisDate,
        diagnosed_by: diagnosedBy,
        difficulty_areas: JSON.stringify(selectedDifficulties),
        strength_areas: JSON.stringify(selectedStrengths),
        clinical_notes: clinicalNotes,
        characteristics: JSON.stringify(getCharacteristics()),
        therapeutic_goals: JSON.stringify(getTherapeuticGoals()),
      };

      if (hasProfile) {
        await AnalysisService.updateNeurodivergentProfile(user.id, profileData);
        Alert.alert('✅ Éxito', 'Perfil actualizado correctamente');
      } else {
        await AnalysisService.createNeurodivergentProfile(user.id, profileData);
        setHasProfile(true);
        Alert.alert(
          '✅ Perfil Creado',
          'Ahora podrás ver análisis personalizados en "Mi Progreso"',
          [
            { text: 'Ver Ahora', onPress: () => navigation.navigate('ProgressReport') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const getCharacteristics = () => {
    const chars: any = {};
    if (diagnosis === 'TDAH') {
      chars.impulsivity = selectedDifficulties.includes('impulsivity');
      chars.hyperactivity = selectedDifficulties.includes('hyperactivity');
      chars.inattention = selectedDifficulties.includes('attention');
    } else if (diagnosis === 'TEA') {
      chars.social_interaction = selectedDifficulties.includes('social');
      chars.routine_preference = true;
      chars.sensory_sensitivity = selectedDifficulties.includes('sensory');
    } else if (diagnosis === 'Dislexia') {
      chars.reading_difficulty = selectedDifficulties.includes('reading');
      chars.visual_processing = 'slow';
    }
    return chars;
  };

  const getTherapeuticGoals = () => {
    const goals: string[] = [];
    if (diagnosis === 'TDAH') {
      goals.push('Mejorar atención sostenida');
      goals.push('Desarrollar control de impulsos');
      goals.push('Fortalecer auto-regulación');
    } else if (diagnosis === 'TEA') {
      goals.push('Mejorar comunicación social');
      goals.push('Desarrollar flexibilidad cognitiva');
      goals.push('Ampliar intereses');
    } else if (diagnosis === 'Dislexia') {
      goals.push('Mejorar velocidad de lectura');
      goals.push('Desarrollar estrategias de decodificación');
      goals.push('Fortalecer procesamiento visual');
    }
    return goals;
  };

  const toggleDifficulty = (item: string) => {
    setSelectedDifficulties(prev =>
      prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item]
    );
  };

  const toggleStrength = (item: string) => {
    setSelectedStrengths(prev =>
      prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]
    );
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>Debes iniciar sesión</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🧠 Perfil Neurodivergente</Text>
        <Text style={styles.subtitle}>
          {hasProfile ? 'Actualiza la información del perfil' : 'Configura el perfil para análisis personalizados'}
        </Text>
      </View>

      {/* Información importante */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔒 Información Confidencial</Text>
        <Text style={styles.infoText}>
          Esta información es privada y se usa solo para personalizar las actividades y generar reportes de progreso.
        </Text>
      </View>

      {/* Diagnóstico Principal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnóstico Principal *</Text>
        <View style={styles.optionsGrid}>
          {(['TDAH', 'TEA', 'Dislexia', 'Discalculia', 'Otro'] as DiagnosisType[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionCard, diagnosis === option && styles.optionCardSelected]}
              onPress={() => setDiagnosis(option)}>
              <Text style={[styles.optionIcon, diagnosis === option && styles.optionIconSelected]}>
                {option === 'TDAH' && '🎯'}
                {option === 'TEA' && '🧩'}
                {option === 'Dislexia' && '📖'}
                {option === 'Discalculia' && '🔢'}
                {option === 'Otro' && '💭'}
              </Text>
              <Text style={[styles.optionText, diagnosis === option && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Severidad */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Severidad *</Text>
        <View style={styles.optionsRow}>
          {(['Leve', 'Moderado', 'Severo'] as SeverityType[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.severityButton, severity === option && styles.severityButtonSelected]}
              onPress={() => setSeverity(option)}>
              <Text style={[styles.severityText, severity === option && styles.severityTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Fecha de Diagnóstico */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fecha de Registro *</Text>
        <Text style={styles.helperText}>Se usa la fecha actual automáticamente</Text>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{formatDate(diagnosisDate)}</Text>
        </View>
      </View>

      {/* Diagnosticado por */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnosticado por (opcional)</Text>
        <TextInput
          style={styles.input}
          value={diagnosedBy}
          onChangeText={setDiagnosedBy}
          placeholder="Dr. Juan Pérez - Neuropediatra"
          placeholderTextColor="#999"
        />
      </View>

      {/* Áreas de Dificultad */}
      {diagnosis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Áreas de Dificultad</Text>
          <Text style={styles.helperText}>Selecciona las que apliquen</Text>
          <View style={styles.checkboxGrid}>
            {getDifficultyOptions(diagnosis).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.checkbox,
                  selectedDifficulties.includes(option.value) && styles.checkboxSelected,
                ]}
                onPress={() => toggleDifficulty(option.value)}>
                <Text style={styles.checkboxIcon}>
                  {selectedDifficulties.includes(option.value) ? '✓' : ''}
                </Text>
                <Text style={styles.checkboxLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Áreas de Fortaleza */}
      {diagnosis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Áreas de Fortaleza</Text>
          <Text style={styles.helperText}>Selecciona las que apliquen</Text>
          <View style={styles.checkboxGrid}>
            {getStrengthOptions(diagnosis).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.checkbox,
                  selectedStrengths.includes(option.value) && styles.checkboxSelected,
                ]}
                onPress={() => toggleStrength(option.value)}>
                <Text style={styles.checkboxIcon}>
                  {selectedStrengths.includes(option.value) ? '✓' : ''}
                </Text>
                <Text style={styles.checkboxLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Notas Clínicas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notas Adicionales (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={clinicalNotes}
          onChangeText={setClinicalNotes}
          placeholder="Cualquier información relevante sobre el diagnóstico, tratamiento actual, preferencias, etc."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Botón Guardar */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveProfile}
        disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            {hasProfile ? '💾 Actualizar Perfil' : '✅ Crear Perfil'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Botón Eliminar (si existe perfil) */}
      {hasProfile && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Eliminar Perfil',
              '¿Estás seguro? Se perderán los análisis personalizados.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => {
                  // TODO: Implementar eliminación
                  Alert.alert('Info', 'Funcionalidad de eliminación en desarrollo');
                }},
              ]
            );
          }}>
          <Text style={styles.deleteButtonText}>🗑️ Eliminar Perfil</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

// Helper functions
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('es-ES', options);
};

const getDifficultyOptions = (diagnosis: DiagnosisType) => {
  switch (diagnosis) {
    case 'TDAH':
      return [
        { label: 'Atención', value: 'attention' },
        { label: 'Impulsividad', value: 'impulsivity' },
        { label: 'Hiperactividad', value: 'hyperactivity' },
        { label: 'Memoria de trabajo', value: 'working_memory' },
        { label: 'Organización', value: 'organization' },
      ];
    case 'TEA':
      return [
        { label: 'Interacción social', value: 'social' },
        { label: 'Comunicación', value: 'communication' },
        { label: 'Flexibilidad', value: 'flexibility' },
        { label: 'Sensibilidad sensorial', value: 'sensory' },
      ];
    case 'Dislexia':
      return [
        { label: 'Lectura', value: 'reading' },
        { label: 'Escritura', value: 'writing' },
        { label: 'Ortografía', value: 'spelling' },
        { label: 'Velocidad de procesamiento', value: 'processing_speed' },
      ];
    case 'Discalculia':
      return [
        { label: 'Cálculo numérico', value: 'calculation' },
        { label: 'Sentido numérico', value: 'number_sense' },
        { label: 'Conceptos matemáticos', value: 'math_concepts' },
      ];
    default:
      return [];
  }
};

const getStrengthOptions = (diagnosis: DiagnosisType) => {
  return [
    { label: 'Creatividad', value: 'creativity' },
    { label: 'Procesamiento visual', value: 'visual_processing' },
    { label: 'Memoria visual', value: 'visual_memory' },
    { label: 'Pensamiento lógico', value: 'logical_thinking' },
    { label: 'Atención al detalle', value: 'attention_to_detail' },
    { label: 'Resolución de problemas', value: 'problem_solving' },
    { label: 'Entusiasmo', value: 'enthusiasm' },
  ];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    margin: 15,
    padding: 15,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFF',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  optionIconSelected: {
    transform: [{ scale: 1.1 }],
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  optionTextSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  severityButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  severityButtonSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  severityTextSelected: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 100,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  dateIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  checkboxGrid: {
    gap: 10,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  checkboxIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#DDD',
    marginRight: 10,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FFF',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NeurodivergentProfileScreen;

